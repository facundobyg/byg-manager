import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import {
  esReversaValida, marcaReservadaEn, parseMontoPositivo, validarClasificacion, validarTextoEditado, validarTextoUsuario,
} from "./integridad";
import { confirmarPendienteTx, cubrirParcialTx, idsRevertidos, liquidarCambioTx, revertirMovimientoTx } from "./integridad.service";
import { fakeTx, saldoCaja, tabla } from "./fake-tx";
import { fechaReversaPorMovimiento } from "../finance/ledger";
import { mov } from "../finance/test-fixtures";

// MACRO 3 — FIX PASS FINAL L1–L4: marcas reservadas + reversas estructurales (L1),
// cambio entre cajas como OperacionCambio real (L2), edición de operación bajo lock
// (L3) y parser estricto en caja↔cartera (L4). Server Actions reales sobre una
// "prisma" en memoria; la concurrencia real se prueba contra Postgres (TEST V5).

const st = vi.hoisted(() => ({ prisma: null as unknown }));
vi.mock("@/auth", () => ({ auth: async () => ({ user: { id: "u1", name: "Tester" } }) }));
vi.mock("@/lib/prisma", () => ({ get prisma() { return st.prisma; } }));
vi.mock("@/lib/config", () => ({ readOnlyPreview: false, betaMode: false }));
vi.mock("@/lib/services/audit.service", () => ({ writeAuditLog: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/services/caja.service", async () => {
  const { Decimal: Dec } = await import("@prisma/client/runtime/library");
  return { calcularSaldoCaja: vi.fn(async () => new Dec(1e9)), calcularSaldoCajaConCliente: vi.fn(async () => new Dec(1e9)) };
});
vi.mock("@/lib/auth/permissions", () => ({ requireActionPermission: vi.fn(async () => null), requireCajaPermission: vi.fn(async () => null) }));
vi.mock("@/lib/parse-monto", async () => await import("../parse-monto"));
vi.mock("@/lib/caja/integridad", async () => await import("./integridad"));
vi.mock("@/lib/caja/integridad.service", async () => await import("./integridad.service"));
vi.mock("@/lib/cc/integridad", async () => await import("../cc/integridad"));
vi.mock("@/lib/cc/integridad.service", async () => await import("../cc/integridad.service"));
vi.mock("@/lib/data/movimiento-cc", () => ({ esMovimientoDeOperacionAgrupada: () => false, extraerOperationRef: () => null }));

import * as caja from "../../app/(dashboard)/caja/actions";
import * as diarios from "../../app/(dashboard)/operativa/mov-diarios/actions";
import * as clientes from "../../app/(dashboard)/clientes/actions";

const D = (v: Decimal.Value) => new Decimal(v);
const OF = "oficina", TR = "trenque";
type Row = Record<string, unknown>;

function db(seed: { movs?: Row[]; ops?: Row[]; ccMovs?: Row[]; cuentas?: Row[]; carteras?: Row[] } = {}) {
  const { db: t, locks } = fakeTx(seed);
  const p = {
    ...t,
    caja: tabla([{ id: OF, slug: "oficina", label: "Oficina", esPrincipal: true, activa: true }, { id: TR, slug: "trenque", label: "Trenque", activa: true }]),
    cartera: tabla(seed.carteras ?? [{ id: "cart", nombre: "Propia", slug: "propia", saldoUSDCable: D(1000), saldoUSDMep: D(1000), saldoPesos: D(1000) }]),
    $transaction: async (arg: unknown) => (typeof arg === "function" ? (arg as (tx: unknown) => unknown)(p) : Promise.all(arg as unknown[])),
  };
  st.prisma = p;
  return { p, locks };
}
const err = (r: unknown) => (r as { error?: string }).error;
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const pendiente = (p: Row = {}) => ({
  id: "pend", cajaId: OF, tipo: "ENTRADA", moneda: "USD", monto: D(100), confirmado: false, anulado: false,
  pagoDeId: null, transferenciaRef: null, operacionCambioId: null, descripcion: "DEBE cliente", fecha: new Date(), ...p,
});
const pago30 = { id: "p1", cajaId: OF, tipo: "ENTRADA", moneda: "USD", monto: D(30), confirmado: true, anulado: false, pagoDeId: "pend", transferenciaRef: null, operacionCambioId: null, descripcion: "Pago parcial de pendiente pend | usr:t", fecha: new Date() };

beforeEach(() => { st.prisma = null; });

// ── L1 ───────────────────────────────────────────────────────────────────────

describe("L1 · marcas internas reservadas", () => {
  it.each([
    "REVERSO | ref:p1 | x", "reverso de algo", "[Cambio abc] x", "[Cobro Cambio abc]", "[REVERSO Cambio abc]", "x [TRANSFERENCIA:IN] y",
    "[RESULTADO_OPERATIVO:COMISION]", "[MOVIMIENTO_CAJA:AJUSTE_CAJA]", "Pago parcial de pendiente pend", "Pago final de pendiente pend",
    "[IMPORT LEGACY CAJA]", "nota | movref:abc", "x | op:abc", "ref:abc", "x | usr:Augusto", "[REVERTIDA POR: x]", "[PARCIAL] x", "[CC] x",
    "[MOV_CC] x", "[REVERSO por X] y", "COBERTURA PARCIAL pend", "x | ANULADO: y",
  ])("%j → marca detectada", (t) => {
    expect(marcaReservadaEn(t)).not.toBeNull();
    expect(validarTextoUsuario(t)).toMatch(/marca interna/);
  });
  it.each(["Compra USD cliente", "Cooperativa: pago", "Referencia factura 12", "Operación de mostrador", "", null])("%j → texto libre válido", (t) => {
    expect(validarTextoUsuario(t as string)).toBeNull();
  });
  it("edición: tolera las marcas que ya estaban, rechaza las nuevas", () => {
    const orig = "[RESULTADO_OPERATIVO:COMISION] cobro | usr:Ana";
    expect(validarTextoEditado(orig, "cobro corregido")).toBeNull();
    expect(validarTextoEditado(orig, "[RESULTADO_OPERATIVO:COMISION] cobro | usr:Ana")).toBeNull();
    expect(validarTextoEditado(orig, "REVERSO | ref:p1 | x")).toMatch(/marca interna/);
    expect(validarTextoEditado("[CC] venta", "[REVERTIDA POR: yo] venta")).toMatch(/\[REVERTIDA/);
  });

  it("exploit 130→100: alta con reversa falsa → DENY, sin escritura", async () => {
    const { p } = db({ movs: [pendiente(), { ...pago30 }] });
    const r = await caja.crearMovimientoCaja(null, fd({ cajaId: OF, tipo: "ENTRADA", monto: "0,01", moneda: "USD", descripcion: "REVERSO | ref:p1 | x" }));
    expect(err(r)).toMatch(/marca interna/);
    expect(p.movimientoCaja.rows).toHaveLength(2);
  });

  it("exploit 130→100: edición que inyecta la marca → DENY", async () => {
    const plano = { id: "m9", cajaId: OF, tipo: "ENTRADA", moneda: "USD", monto: D(1), confirmado: true, anulado: false, pagoDeId: null, transferenciaRef: null, operacionCambioId: null, descripcion: "nota | op:x | usr:t", fecha: new Date() };
    const { p } = db({ movs: [pendiente(), { ...pago30 }, plano] });
    const r = await diarios.editarMovimientoCajaCompleto(null, fd({ id: "m9", fecha: "2026-11-01", tipo: "ENTRADA", moneda: "USD", monto: "1", descripcion: "REVERSO | ref:p1 | x" }));
    expect(err(r)).toMatch(/marca interna/);
    expect(p.movimientoCaja.rows.find((m) => m.id === "m9")!.descripcion).toBe("nota | op:x | usr:t");
  });

  it.each([
    ["otra caja", { cajaId: TR }],
    ["otra moneda", { moneda: "ARS" }],
    ["otro monto", { monto: D(0.01) }],
    ["mismo tipo (no inverso)", { tipo: "ENTRADA" }],
    ["no confirmada", { confirmado: false }],
  ])("reversa falsa (%s) no revierte el pago: confirmar deja la caja en 100", async (_n, dif) => {
    const falsa = { id: "fake", cajaId: OF, tipo: "SALIDA", moneda: "USD", monto: D(30), confirmado: true, anulado: false, pagoDeId: null, transferenciaRef: null, operacionCambioId: null, descripcion: "REVERSO | ref:p1 | forjada", fecha: new Date(), ...dif };
    const { tx, db: t } = fakeTx({ movs: [pendiente(), { ...pago30 }, falsa] });
    expect((await idsRevertidos(tx, ["p1"])).size).toBe(0);
    const r = await confirmarPendienteTx(tx, { movimientoId: "pend", cajaEsperada: OF, userName: "t" });
    expect(r.accion).toBe("PAGO_RESIDUAL");
    const sinFalsa = t.movimientoCaja.rows.filter((m) => m.id !== "fake");
    expect(saldoCaja(sinFalsa, OF, "USD").toNumber()).toBe(100);
  });

  it("reversa legítima del pago: residual vuelve a 100 y confirmar impacta 100 una sola vez", async () => {
    const { tx, db: t } = fakeTx({ movs: [pendiente()] });
    await cubrirParcialTx(tx, { movimientoId: "pend", cajaOriginalEsperada: OF, cajaPagoId: OF, monto: D(30), userName: "t", pagoId: "p1" });
    await revertirMovimientoTx(tx, { movimientoId: "p1", cajasAutorizadas: [OF] });
    expect((await idsRevertidos(tx, ["p1"])).has("p1")).toBe(true);
    const r = await confirmarPendienteTx(tx, { movimientoId: "pend", cajaEsperada: OF, userName: "t" });
    expect(r.accion).toBe("CONFIRMAR_ORIGINAL");
    expect(saldoCaja(t.movimientoCaja.rows, OF, "USD").toNumber()).toBe(100); // 30 − 30 + 100
  });

  it("motor: solo la reversa estructural reabre el pendiente (fechaReversaPorMovimiento)", () => {
    const p1 = mov({ id: "p1", tipo: "ENTRADA", moneda: "USD", monto: 30, fecha: "2026-04-05", pagoDeId: "pend" });
    const falsa = mov({ id: "f", tipo: "ENTRADA", moneda: "USD", monto: 0.01, fecha: "2026-04-06", descripcion: "REVERSO | ref:p1 | x" });
    const otraCaja = mov({ id: "g", cajaId: TR, tipo: "SALIDA", moneda: "USD", monto: 30, fecha: "2026-04-07", descripcion: "REVERSO | ref:p1 | x" });
    expect(fechaReversaPorMovimiento([p1, falsa, otraCaja]).size).toBe(0);
    const buena = mov({ id: "r", tipo: "SALIDA", moneda: "USD", monto: 30, fecha: "2026-04-20", descripcion: "REVERSO | ref:p1 | x" });
    expect(fechaReversaPorMovimiento([p1, falsa, buena]).get("p1")).toBe("2026-04-20");
    expect(esReversaValida({ ...p1, monto: 30 }, { ...buena, monto: 30 })).toBe(true);
  });
});

describe("L1 · clasificación / subtipo de Movimientos Diarios (lista cerrada)", () => {
  it("reglas puras", () => {
    expect(validarClasificacion("RESULTADO_OPERATIVO", "COMISION")).toBeNull();
    expect(validarClasificacion("MOVIMIENTO_CAJA", "AJUSTE_CAJA")).toBeNull();
    expect(validarClasificacion("TRANSFERENCIA", null)).toBeNull();
    expect(validarClasificacion("RESULTADO_OPERATIVO", "AJUSTE_CAJA")).toMatch(/Subtipo/);
    expect(validarClasificacion("Cambio abc", "X")).toMatch(/Clasificación/);
  });
  const base = { cajaId: OF, fecha: "2026-11-01", tipo: "ENTRADA", monto: "10", moneda: "USD" };
  it("valor válido → crea con la marca del sistema", async () => {
    const { p } = db();
    const r = await diarios.crearMovimientoDiario({}, fd({ ...base, clasificacion: "RESULTADO_OPERATIVO", subtipoOperativo: "COMISION", descripcion: "cobro" }));
    expect(r).toEqual({ ok: true });
    expect(p.movimientoCaja.rows[0].descripcion).toMatch(/^\[RESULTADO_OPERATIVO:COMISION\] cobro \| usr:Tester$/);
  });
  it.each([
    ["subtipo desconocido", { clasificacion: "RESULTADO_OPERATIVO", subtipoOperativo: "INVENTADO" }],
    ["clasificación desconocida", { clasificacion: "OTRA", subtipoOperativo: "COMISION" }],
    ["subtipo que forja [Cambio …]", { clasificacion: "MOVIMIENTO_CAJA", subtipoOperativo: "X] [Cambio op1" }],
    ["clasificación que forja [Cambio …]", { clasificacion: "Cambio op1", subtipoOperativo: "X" }],
    ["descripción con [Cambio …]", { clasificacion: "MOVIMIENTO_CAJA", subtipoOperativo: "AJUSTE_CAJA", descripcion: "[Cambio op1] Compra divisa" }],
  ])("%s → DENY antes de escribir", async (_n, extra) => {
    const { p } = db();
    const r = await diarios.crearMovimientoDiario({}, fd({ ...base, descripcion: "x", ...extra }));
    expect(err(r)).toBeTruthy();
    expect(p.movimientoCaja.rows).toHaveLength(0);
  });
});

// ── L2 ───────────────────────────────────────────────────────────────────────

describe("L2 · cambio entre cajas = OperacionCambio real + 2 patas vinculadas", () => {
  it.each([
    ["COMPRA", "ENTRADA", "SALIDA"],
    ["VENTA", "SALIDA", "ENTRADA"],
  ])("%s: 1 operación (cantidad/totalARS/TC) + 2 patas con operacionCambioId, sin duplicar", async (tipoOp, tDiv, tArs) => {
    const { p } = db();
    const r = await caja.registrarOperacionCambioEnCajas(null, fd({
      cajaDivisaId: TR, cajaArsId: OF, montoDivisa: "100", montoArs: "123456,78", tipoOperacion: tipoOp, moneda: "USD", descripcion: "Compra USD cliente",
    }));
    expect(r).toEqual({ success: true });
    expect(p.operacionCambio.rows).toHaveLength(1);
    const op = p.operacionCambio.rows[0];
    expect(op.tipo).toBe(`${tipoOp}_USD`);
    expect((op.cantidad as Decimal).toString()).toBe("100");
    expect((op.totalARS as Decimal).toString()).toBe("123456.78");
    expect((op.tipoCambio as Decimal).toString()).toBe("1234.5678");
    expect(op.pendiente).toBe(false);
    const patas = p.movimientoCaja.rows;
    expect(patas).toHaveLength(2);
    expect(patas.every((m) => m.operacionCambioId === op.id && m.transferenciaRef === null && m.confirmado === true)).toBe(true);
    const div = patas.find((m) => m.moneda === "USD")!, ars = patas.find((m) => m.moneda === "ARS")!;
    expect([div.cajaId, div.tipo, (div.monto as Decimal).toString()]).toEqual([TR, tDiv, "100"]);
    expect([ars.cajaId, ars.tipo, (ars.monto as Decimal).toString()]).toEqual([OF, tArs, "123456.78"]);
    expect(String(div.descripcion)).toMatch(new RegExp(`^\\[Cambio ${op.id}\\]`));
  });

  it("re-liquidar la operación ya liquidada → DENY (sin patas extra)", async () => {
    const { p } = db();
    await caja.registrarOperacionCambioEnCajas(null, fd({ cajaDivisaId: OF, cajaArsId: OF, montoDivisa: "10", montoArs: "10000", tipoOperacion: "COMPRA", moneda: "USD" }));
    const opId = p.operacionCambio.rows[0].id as string;
    await expect(liquidarCambioTx(p as never, { opId, items: "TOTAL", cajaTotalId: OF, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "t" }))
      .rejects.toThrow(/totalmente liquidada/);
    expect(p.movimientoCaja.rows).toHaveLength(2);
  });

  it.each(["0", "NaN", "1e3", "0x10"])("monto inválido %j → DENY sin operación ni patas", async (bad) => {
    const { p } = db();
    const r = await caja.registrarOperacionCambioEnCajas(null, fd({ cajaDivisaId: OF, cajaArsId: OF, montoDivisa: bad, montoArs: "1000", tipoOperacion: "COMPRA", moneda: "USD" }));
    expect(err(r)).toBeTruthy();
    expect(p.operacionCambio.rows).toHaveLength(0);
    expect(p.movimientoCaja.rows).toHaveLength(0);
  });

  it("descripción con marca reservada → DENY", async () => {
    const { p } = db();
    const r = await caja.registrarOperacionCambioEnCajas(null, fd({ cajaDivisaId: OF, cajaArsId: OF, montoDivisa: "1", montoArs: "1000", tipoOperacion: "COMPRA", moneda: "USD", descripcion: "[REVERTIDA POR: x]" }));
    expect(err(r)).toMatch(/marca interna/);
    expect(p.operacionCambio.rows).toHaveLength(0);
  });
});

// ── L3 ───────────────────────────────────────────────────────────────────────

describe("L3 · editarOperacionCambio: lock + relectura + validación en la misma tx", () => {
  const op = (p: Row = {}) => ({
    id: "op1", fecha: new Date("2026-11-01"), tipo: "VENTA_USD", moneda: "USD", cantidad: D(100), tipoCambio: D(1000), totalARS: D(100000),
    cobroUSD: D(100), cobroARS: D(100000), descripcion: "venta | usr:t", pendiente: true, clienteNombre: "C", ...p,
  });
  const form = (o: Record<string, string> = {}) => fd({ id: "op1", tipoOp: "VENTA", moneda: "USD", cantidad: "100", tipoCambio: "1000", fecha: "2026-11-01", descripcion: "venta", estadoNuevo: "PENDIENTE", ...o });

  it("toma FOR UPDATE de la operación antes de decidir", async () => {
    const { locks } = db({ ops: [op()] });
    expect(await diarios.editarOperacionCambio(null, form({ cantidad: "80" }))).toEqual({ ok: true });
    expect(locks.some((l) => l.includes(`"OperacionCambio"`) && l.includes("FOR UPDATE"))).toBe(true);
  });

  it("liquidación concurrente ya aplicada (pendiente=false) → el cambio económico se rechaza: liquidado nunca > total", async () => {
    const { p } = db({ ops: [op()] });
    await liquidarCambioTx(p as never, { opId: "op1", items: "TOTAL", cajaTotalId: OF, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "t" });
    const r = await diarios.editarOperacionCambio(null, form({ cantidad: "50" }));
    expect(err(r)).toMatch(/liquidada/);
    expect((p.operacionCambio.rows[0].cantidad as Decimal).toString()).toBe("100");
  });

  it("parcial liquidado 60 → bajar el total a 50 DENY; a 70 OK", async () => {
    const { p } = db({ ops: [op()] });
    await liquidarCambioTx(p as never, { opId: "op1", items: [{ cajaId: OF, div: D(60), ars: null }], fecha: new Date(), etiqueta: "Cobro Cambio", userName: "t" });
    p.operacionCambio.rows[0].pendiente = true; // estado legacy "pendiente con liquidaciones"
    expect(err(await diarios.editarOperacionCambio(null, form({ cantidad: "50" })))).toMatch(/por debajo de lo liquidado/);
    expect(await diarios.editarOperacionCambio(null, form({ cantidad: "70" }))).toEqual({ ok: true });
  });

  it("solo texto en una operación liquidada con CC → OK (el formulario reenvía los mismos valores)", async () => {
    const { p } = db({ ops: [op({ pendiente: false })], ccMovs: [{ id: "cc1", cuentaCorrienteId: "cta", tipo: "INGRESO", monto: D(100), operacionCambioId: "op1" }] });
    expect(await diarios.editarOperacionCambio(null, form({ descripcion: "venta corregida" }))).toEqual({ ok: true });
    expect(p.operacionCambio.rows[0].descripcion).toBe("venta corregida");
  });

  it("revertida → cambio económico DENY; marca nueva en el texto → DENY", async () => {
    db({ ops: [op({ descripcion: "[REVERTIDA POR: x] venta" })] });
    expect(err(await diarios.editarOperacionCambio(null, form({ cantidad: "90" })))).toMatch(/revertida/);
    db({ ops: [op()] });
    expect(err(await diarios.editarOperacionCambio(null, form({ descripcion: "[REVERTIDA POR: yo] venta" })))).toMatch(/marca interna/);
  });
});

// ── L4 ───────────────────────────────────────────────────────────────────────

const INVALIDOS = ["0", "-5", "NaN", "Infinity", "0x10", "0b101", "0o17", "1e3", "12abc"];

describe("L4 · caja↔cartera y CC con impacto en caja: parser estricto", () => {
  it.each(INVALIDOS)("parseMontoPositivo(%j) → null", (v) => expect(parseMontoPositivo(v)).toBeNull());

  it.each(INVALIDOS)("caja → cartera %j → DENY, nada escrito", async (v) => {
    const { p } = db();
    const r = await caja.transferirCajaACartera(null, fd({ cajaId: OF, carteraId: "cart", moneda: "USD", destinoSaldo: "CABLE", monto: v }));
    expect(err(r)).toMatch(/Monto inválido/);
    expect(p.movimientoCaja.rows).toHaveLength(0);
    expect((p.cartera.rows[0].saldoUSDCable as Decimal).toString()).toBe("1000");
  });

  it.each(INVALIDOS)("cartera → caja %j → DENY, nada escrito", async (v) => {
    const { p } = db();
    const r = await caja.transferirCarteraACaja(null, fd({ cajaId: OF, carteraId: "cart", origenSaldo: "MEP", monto: v }));
    expect(err(r)).toMatch(/Monto inválido/);
    expect(p.movimientoCaja.rows).toHaveLength(0);
    expect((p.cartera.rows[0].saldoUSDMep as Decimal).toString()).toBe("1000");
  });

  it("decimal normal en ambos sentidos → OK, nunca NaN en la DB", async () => {
    const { p } = db();
    expect(await caja.transferirCajaACartera(null, fd({ cajaId: OF, carteraId: "cart", moneda: "USD", destinoSaldo: "CABLE", monto: "150,25" }))).toEqual({ success: true });
    expect(await caja.transferirCarteraACaja(null, fd({ cajaId: OF, carteraId: "cart", origenSaldo: "MEP", monto: "10.5" }))).toEqual({ success: true });
    expect(p.movimientoCaja.rows.map((m) => (m.monto as Decimal).toString())).toEqual(["150.25", "10.5"]);
    expect((p.cartera.rows[0].saldoUSDCable as Decimal).toString()).toBe("1150.25");
    expect((p.cartera.rows[0].saldoUSDMep as Decimal).toString()).toBe("989.5");
    expect(p.movimientoCaja.rows.every((m) => (m.monto as Decimal).isFinite())).toBe(true);
  });

  it("descripción con marca en caja↔cartera → DENY", async () => {
    db();
    const r = await caja.transferirCajaACartera(null, fd({ cajaId: OF, carteraId: "cart", moneda: "USD", destinoSaldo: "CABLE", monto: "1", descripcion: "x | op:abc" }));
    expect(err(r)).toMatch(/marca interna/);
  });

  it.each(["NaN", "0x10", "1e3"])("movimiento CC con impacto en caja %j → DENY", async (v) => {
    const { p } = db({ cuentas: [{ id: "cta", moneda: "USD", saldo: D(0) }] });
    const r = await clientes.crearMovimientoCC(null, fd({ cuentaId: "cta", clienteId: "cli", tipo: "INGRESO", monto: v, impactaCaja: "on", cajaImpactoId: OF }));
    expect(err(r)).toMatch(/Monto inválido/);
    expect(p.movimientoCaja.rows).toHaveLength(0);
    expect(p.movimientoCC.rows).toHaveLength(0);
  });

  it("movimiento CC con 'op:<id>' en la descripción → DENY (no se cuela en una operación ajena)", async () => {
    const { p } = db({ cuentas: [{ id: "cta", moneda: "USD", saldo: D(0) }] });
    const r = await clientes.crearMovimientoCC(null, fd({ cuentaId: "cta", clienteId: "cli", tipo: "INGRESO", monto: "5", descripcion: "x | op:op1" }));
    expect(err(r)).toMatch(/marca interna/);
    expect(p.movimientoCC.rows).toHaveLength(0);
  });
});
