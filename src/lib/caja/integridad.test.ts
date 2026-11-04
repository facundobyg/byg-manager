import { describe, it, expect } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import {
  conMarcaParcial, descripcionEditada, descripcionOpEditada, divisaLiquidada, netoPorCajaMoneda, netoPorCuentaCC,
  parseMontoPositivo, planConfirmacion, validarLiquidacion, validarPagoParcial, vinculoFinanciero,
} from "./integridad";
import {
  anularPendienteTx, cancelarCambioTx, confirmarPendienteTx, cubrirParcialTx, liquidarCambioTx, revertirCambioTx, revertirMovimientoTx,
} from "./integridad.service";
import { fakeTx, saldoCaja } from "./fake-tx";

// MACRO 3 — Integridad de Caja + Cambio. Reglas puras + servicios transaccionales
// reales sobre una tx en memoria. La concurrencia real se prueba contra Postgres
// (scripts/qa-m3-caja-cambio-pg.ts, TEST V5).

const D = (v: Decimal.Value) => new Decimal(v);
const OF = "oficina", TR = "trenque";
const pendiente = (p: Record<string, unknown> = {}) => ({
  id: "pend", cajaId: OF, tipo: "ENTRADA", moneda: "USD", monto: D(100), confirmado: false, anulado: false,
  pagoDeId: null, transferenciaRef: null, operacionCambioId: null, descripcion: "DEBE cliente", fecha: new Date(), ...p,
});
const ctx = { cajaOriginalEsperada: OF, cajaPagoId: OF, userName: "t" };

describe("15. montos inválidos → DENY", () => {
  it.each(["0", "-5", "abc", "NaN", "Infinity", "0x10", "1e3", "12abc", " ", "1_000", "", null])("%j → null", (raw) => {
    expect(parseMontoPositivo(raw as string)).toBeNull();
  });
  it("decimal estricto con coma o punto", () => {
    expect(parseMontoPositivo("1500,50")?.toString()).toBe("1500.5");
    expect(parseMontoPositivo("0.01")?.toString()).toBe("0.01");
  });
});

describe("1–2 + parciales: pendiente con pagos parciales (residual)", () => {
  it("1. pendiente 100 + parcial 30 + confirmar → caja total 100 (nunca 130)", async () => {
    const { tx, db } = fakeTx({ movs: [pendiente()] });
    await cubrirParcialTx(tx, { ...ctx, movimientoId: "pend", monto: D(30), pagoId: "p1" });
    const r = await confirmarPendienteTx(tx, { movimientoId: "pend", cajaEsperada: OF, userName: "t" });
    expect(r.accion).toBe("PAGO_RESIDUAL");
    expect(r.monto.toNumber()).toBe(70);
    expect(saldoCaja(db.movimientoCaja.rows, OF, "USD").toNumber()).toBe(100);
    expect(db.movimientoCaja.rows.find((m) => m.id === "pend")!.confirmado).toBe(false); // el original queda cubierto, no se suma
  });

  it("2. 100 → 30 → 20 → confirmar = 100; residual intermedio 50", async () => {
    const { tx, db } = fakeTx({ movs: [pendiente()] });
    await cubrirParcialTx(tx, { ...ctx, movimientoId: "pend", monto: D(30), pagoId: "p1" });
    await cubrirParcialTx(tx, { ...ctx, movimientoId: "pend", monto: D(20), pagoId: "p2" });
    await expect(cubrirParcialTx(tx, { ...ctx, movimientoId: "pend", monto: D(51), pagoId: "p3" })).rejects.toThrow(/supera el restante \(50\.00\)/);
    await confirmarPendienteTx(tx, { movimientoId: "pend", cajaEsperada: OF, userName: "t" });
    expect(saldoCaja(db.movimientoCaja.rows, OF, "USD").toNumber()).toBe(100);
  });

  it("parciales suman 100 → confirmar no impacta nada (RECHAZA, sin movimiento)", async () => {
    const { tx, db } = fakeTx({ movs: [pendiente()] });
    await cubrirParcialTx(tx, { ...ctx, movimientoId: "pend", monto: D(100), pagoId: "p1" });
    const antes = db.movimientoCaja.rows.length;
    await expect(confirmarPendienteTx(tx, { movimientoId: "pend", cajaEsperada: OF, userName: "t" })).rejects.toThrow(/totalmente cubierto/);
    expect(db.movimientoCaja.rows.length).toBe(antes);
    expect(saldoCaja(db.movimientoCaja.rows, OF, "USD").toNumber()).toBe(100);
  });

  it("parcial REVERTIDO vuelve a contar como pendiente; confirmar impacta 100 en total", async () => {
    const { tx, db } = fakeTx({ movs: [pendiente()] });
    await cubrirParcialTx(tx, { ...ctx, movimientoId: "pend", monto: D(30), pagoId: "p1" });
    await revertirMovimientoTx(tx, { movimientoId: "p1", cajasAutorizadas: [OF] });
    const r = await confirmarPendienteTx(tx, { movimientoId: "pend", cajaEsperada: OF, userName: "t" });
    expect(r.accion).toBe("CONFIRMAR_ORIGINAL"); // no quedan pagos válidos
    expect(saldoCaja(db.movimientoCaja.rows, OF, "USD").toNumber()).toBe(100); // 30 − 30 + 100
  });

  it("sin pagos: confirmar el original una sola vez (segunda confirmación DENY)", async () => {
    const { tx, db } = fakeTx({ movs: [pendiente()] });
    await confirmarPendienteTx(tx, { movimientoId: "pend", cajaEsperada: OF, userName: "t" });
    await expect(confirmarPendienteTx(tx, { movimientoId: "pend", cajaEsperada: OF, userName: "t" })).rejects.toThrow(/ya está confirmado/);
    expect(saldoCaja(db.movimientoCaja.rows, OF, "USD").toNumber()).toBe(100);
  });

  it("toda operación sobre el pendiente toma el lock de fila (FOR UPDATE)", async () => {
    const { tx, locks } = fakeTx({ movs: [pendiente()] });
    await confirmarPendienteTx(tx, { movimientoId: "pend", cajaEsperada: OF, userName: "t" });
    expect(locks.some((l) => /FROM "MovimientoCaja" WHERE id IN \(\?\) ORDER BY id FOR UPDATE/.test(l))).toBe(true);
  });

  it("anular: con pagos válidos DENY; tras revertir el pago, se puede", async () => {
    const { tx } = fakeTx({ movs: [pendiente()] });
    await cubrirParcialTx(tx, { ...ctx, movimientoId: "pend", monto: D(30), pagoId: "p1" });
    await expect(anularPendienteTx(tx, { movimientoId: "pend", motivo: "x", userName: "t" })).rejects.toThrow(/pagos parciales/);
    await revertirMovimientoTx(tx, { movimientoId: "p1", cajasAutorizadas: [OF] });
    await anularPendienteTx(tx, { movimientoId: "pend", motivo: "x", userName: "t" });
  });

  it("reglas puras: planConfirmacion / validarPagoParcial", () => {
    expect(planConfirmacion(100, [])).toEqual({ accion: "CONFIRMAR_ORIGINAL" });
    expect(planConfirmacion(100, [30, 20])).toMatchObject({ accion: "PAGO_RESIDUAL" });
    expect(planConfirmacion(100, [100]).accion).toBe("RECHAZAR");
    expect(planConfirmacion(100, [120]).accion).toBe("RECHAZAR");
    expect(validarPagoParcial(100, [], D(0))).toMatch(/mayor a 0/);
  });
});

describe("4–7: transferencias (par inseparable)", () => {
  const par = () => [
    { id: "out", cajaId: OF, tipo: "TRANSFERENCIA_OUT", moneda: "USD", monto: D(100), confirmado: true, anulado: false, transferenciaRef: "T1", pagoDeId: null, operacionCambioId: null, descripcion: "TRANSFERENCIA | op:T1" },
    { id: "in", cajaId: TR, tipo: "TRANSFERENCIA_IN", moneda: "USD", monto: D(100), confirmado: true, anulado: false, transferenciaRef: "T1", pagoDeId: null, operacionCambioId: null, descripcion: "TRANSFERENCIA | op:T1" },
  ];

  it("5. una pata es un movimiento VINCULADO (no editable/borrable por separado)", () => {
    for (const m of par()) expect(vinculoFinanciero(m)).toBe("TRANSFERENCIA");
    expect(vinculoFinanciero({ tipo: "SALIDA", descripcion: "[TRANSFERENCIA:OUT] a Trenque", transferenciaRef: null, operacionCambioId: null, pagoDeId: null })).toBe("TRANSFERENCIA");
  });

  it("6. revertir UNA pata revierte el PAR: efecto patrimonial 0", async () => {
    const { tx, db } = fakeTx({ movs: par() });
    const r = await revertirMovimientoTx(tx, { movimientoId: "in", cajasAutorizadas: [OF, TR] });
    expect(r.reversos).toHaveLength(2);
    expect(saldoCaja(db.movimientoCaja.rows, OF, "USD").toNumber()).toBe(0);
    expect(saldoCaja(db.movimientoCaja.rows, TR, "USD").toNumber()).toBe(0);
    const refs = new Set(db.movimientoCaja.rows.filter((m) => String(m.descripcion).startsWith("REVERSO")).map((m) => m.transferenciaRef));
    expect(refs.size).toBe(1); // los reversos también son un par
  });

  it("7. doble reversión (por cualquiera de las patas) → DENY, sin segundo efecto", async () => {
    const { tx, db } = fakeTx({ movs: par() });
    await revertirMovimientoTx(tx, { movimientoId: "out", cajasAutorizadas: [OF, TR] });
    const n = db.movimientoCaja.rows.length;
    await expect(revertirMovimientoTx(tx, { movimientoId: "in", cajasAutorizadas: [OF, TR] })).rejects.toThrow(/ya fue revertido/);
    await expect(revertirMovimientoTx(tx, { movimientoId: "out", cajasAutorizadas: [OF, TR] })).rejects.toThrow(/ya fue revertido/);
    expect(db.movimientoCaja.rows.length).toBe(n);
  });

  it("transferencia legacy sin transferenciaRef → no se revierte una sola pata", async () => {
    const { tx } = fakeTx({ movs: [{ id: "lg", cajaId: OF, tipo: "SALIDA", moneda: "USD", monto: D(5), confirmado: true, anulado: false, transferenciaRef: null, pagoDeId: null, operacionCambioId: null, descripcion: "[TRANSFERENCIA:OUT] a Trenque" }] });
    await expect(revertirMovimientoTx(tx, { movimientoId: "lg", cajasAutorizadas: [OF] })).rejects.toThrow(/una sola pata/);
  });

  it("pata de cambio → solo desde la operación; un reverso no se revierte", async () => {
    const { tx } = fakeTx({ movs: [
      { id: "c1", cajaId: OF, tipo: "ENTRADA", moneda: "USD", monto: D(5), confirmado: true, anulado: false, transferenciaRef: null, pagoDeId: null, operacionCambioId: "op", descripcion: "[Cambio op] Compra divisa" },
      { id: "r1", cajaId: OF, tipo: "SALIDA", moneda: "USD", monto: D(5), confirmado: true, anulado: false, transferenciaRef: null, pagoDeId: null, operacionCambioId: null, descripcion: "REVERSO | ref:x | algo" },
    ] });
    await expect(revertirMovimientoTx(tx, { movimientoId: "c1", cajasAutorizadas: [OF] })).rejects.toThrow(/operación de cambio/);
    await expect(revertirMovimientoTx(tx, { movimientoId: "r1", cajasAutorizadas: [OF] })).rejects.toThrow(/ya es un reverso/);
  });
});

describe("8–14: operación de cambio", () => {
  const op = (p: Record<string, unknown> = {}) => ({
    id: "op", tipo: "COMPRA_USD", moneda: "USD", cantidad: D(100), tipoCambio: D(1000), totalARS: D(100_000),
    descripcion: "[CC] Op", pendiente: true, ...p,
  });
  const liquidar = (tx: never, items: { cajaId: string; div: number }[] | "TOTAL") =>
    liquidarCambioTx(tx, {
      opId: "op", items: items === "TOTAL" ? "TOTAL" : items.map((i) => ({ cajaId: i.cajaId, div: D(i.div), ars: null })),
      cajaTotalId: OF, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "t",
    });

  it("8. NO_LIQUIDADA → 0 impacto en caja", () => {
    const { db } = fakeTx({ ops: [op()] });
    expect(db.movimientoCaja.rows).toHaveLength(0);
  });

  it("9–10. parcial 30 (solo 30) y luego total → solo el residual 70; [PARCIAL] mientras falte", async () => {
    const { tx, db } = fakeTx({ ops: [op()] });
    const r1 = await liquidar(tx, [{ cajaId: TR, div: 30 }]);
    expect(r1.completa).toBe(false);
    expect(saldoCaja(db.movimientoCaja.rows, TR, "USD").toNumber()).toBe(30);
    expect(saldoCaja(db.movimientoCaja.rows, TR, "ARS").toNumber()).toBe(-30_000);
    expect(String(db.operacionCambio.rows[0].descripcion)).toBe("[PARCIAL] [CC] Op");
    const r2 = await liquidar(tx, "TOTAL");
    expect(r2.completa).toBe(true);
    expect(saldoCaja(db.movimientoCaja.rows, OF, "USD").toNumber()).toBe(70);
    expect(String(db.operacionCambio.rows[0].descripcion)).toBe("[CC] Op");
    expect(db.movimientoCaja.rows.every((m) => m.operacionCambioId === "op")).toBe(true);
  });

  it("11. sobreliquidación → DENY sin escrituras; totalmente liquidada → DENY", async () => {
    const { tx, db } = fakeTx({ ops: [op()] });
    await expect(liquidar(tx, [{ cajaId: OF, div: 60 }, { cajaId: TR, div: 41 }])).rejects.toThrow(/Sobreliquidación/);
    expect(db.movimientoCaja.rows).toHaveLength(0);
    await liquidar(tx, "TOTAL");
    await expect(liquidar(tx, "TOTAL")).rejects.toThrow(/totalmente liquidada/);
  });

  it("12. cancelación de cambio con CC → CC vuelve EXACTAMENTE al estado previo", async () => {
    const { tx, db } = fakeTx({
      ops: [op()],
      cuentas: [{ id: "ccUSD", saldo: D(-100) }, { id: "ccARS", saldo: D(100_000) }], // efecto de la creación
      ccMovs: [
        { id: "m1", cuentaCorrienteId: "ccUSD", tipo: "EGRESO", monto: D(100), operacionCambioId: "op", descripcion: "Compra USD | op:op" },
        { id: "m2", cuentaCorrienteId: "ccARS", tipo: "INGRESO", monto: D(100_000), operacionCambioId: "op", descripcion: "Contrapartida | op:op" },
      ],
    });
    await cancelarCambioTx(tx, { opId: "op", fecha: new Date() });
    expect(db.cuentaCorriente.rows.map((c) => (c.saldo as Decimal).toNumber())).toEqual([0, 0]);
    expect(db.operacionCambio.rows).toHaveLength(0);
    await expect(cancelarCambioTx(tx, { opId: "op", fecha: new Date() })).rejects.toThrow(/no encontrada/); // idempotente
  });

  it("13. reversa de cambio liquidado → caja y CC neutralizados; segunda reversa / re-liquidar DENY", async () => {
    // MACRO 6: CC y liquidación en caja son excluyentes → con CC vigente, liquidar se rechaza.
    // Este caso reproduce el estado LEGACY (pre-Macro 6) "liquidada en caja + CC": la reversa
    // sigue neutralizando ambas exactamente una vez.
    const { tx, db } = fakeTx({ ops: [op()], cuentas: [{ id: "ccUSD", saldo: D(0) }] });
    await liquidar(tx, [{ cajaId: TR, div: 40 }]);
    await liquidar(tx, "TOTAL");
    db.movimientoCC.rows.push({ id: "m1", cuentaCorrienteId: "ccUSD", tipo: "EGRESO", monto: D(100), operacionCambioId: "op", descripcion: "Compra | op:op" });
    db.cuentaCorriente.rows[0].saldo = D(-100);
    await revertirCambioTx(tx, { opId: "op", revertidoPor: "t", fecha: new Date(), cajasAutorizadas: [OF, TR] });
    for (const c of [OF, TR]) for (const m of ["USD", "ARS"]) expect(saldoCaja(db.movimientoCaja.rows, c, m).toNumber()).toBe(0);
    expect((db.cuentaCorriente.rows[0].saldo as Decimal).toNumber()).toBe(0);
    await expect(revertirCambioTx(tx, { opId: "op", revertidoPor: "t", fecha: new Date(), cajasAutorizadas: [OF, TR] })).rejects.toThrow(/ya fue revertida/);
    await expect(liquidar(tx, "TOTAL")).rejects.toThrow(/revertida/);
  });

  it("cancelar una operación con liquidaciones → DENY (se revierte)", async () => {
    const { tx } = fakeTx({ ops: [op()] });
    await liquidar(tx, [{ cajaId: OF, div: 10 }]);
    await expect(cancelarCambioTx(tx, { opId: "op", fecha: new Date() })).rejects.toThrow(/Solo se pueden cancelar operaciones pendientes/);
    // revertida (vuelve a pendiente pero con historia de caja) → tampoco se elimina
    await revertirCambioTx(tx, { opId: "op", revertidoPor: "t", fecha: new Date(), cajasAutorizadas: [OF] });
    await expect(cancelarCambioTx(tx, { opId: "op", fecha: new Date() })).rejects.toThrow(/movimientos de caja/);
  });

  it("reglas puras: liquidado neto de reversas; neto por caja/CC", () => {
    const o = { tipo: "VENTA_USD", moneda: "USD", cantidad: 100, tipoCambio: 1000 };
    const movs = [
      { cajaId: OF, moneda: "USD", tipo: "SALIDA", monto: 60 },
      { cajaId: OF, moneda: "USD", tipo: "ENTRADA", monto: 60 }, // reverso
      { cajaId: OF, moneda: "USD", tipo: "SALIDA", monto: 25 },
    ];
    expect(divisaLiquidada(o, movs).toNumber()).toBe(25);
    expect(validarLiquidacion(o, D(25), D(76))).toMatchObject({ ok: false });
    expect(netoPorCajaMoneda(movs)).toEqual([{ cajaId: OF, moneda: "USD", neto: D(-25) }]);
    expect(netoPorCuentaCC([{ cuentaCorrienteId: "a", tipo: "INGRESO", monto: 5 }, { cuentaCorrienteId: "a", tipo: "EGRESO", monto: 5 }])).toEqual([]);
  });
});

describe("Ediciones: marcas del sistema preservadas", () => {
  it("descripción de movimiento: la clasificación no se puede borrar ni cambiar", () => {
    expect(descripcionEditada("[RESULTADO_OPERATIVO:COMISION] viejo | usr:x", "nuevo texto")).toBe("[RESULTADO_OPERATIVO:COMISION] nuevo texto");
    expect(descripcionEditada("libre", "otro")).toBe("otro");
  });
  it("descripción de operación: [REVERTIDA POR:] / [PARCIAL] / [CC] se conservan", () => {
    expect(descripcionOpEditada("[REVERTIDA POR: Facu] [CC] op", "texto nuevo")).toBe("[REVERTIDA POR: Facu] [CC] texto nuevo");
    expect(descripcionOpEditada("[PARCIAL] op", "[PARCIAL] hack")).toBe("[PARCIAL] hack");
    expect(conMarcaParcial("[CC] [PARCIAL] op", false)).toBe("[CC] op");
    expect(conMarcaParcial("[CC] op", true)).toBe("[PARCIAL] [CC] op");
  });
});
