import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { MENSAJE_CAMBIO_CON_CC, liquidarCambioTx, revertirCambioTx } from "./integridad.service";
import { fakeTx, saldoCaja, tabla } from "./fake-tx";
import { saldoReconstruido } from "../cc/integridad";

// MACRO 6 — FIX FINAL: Cambio con impacto en CC y Cambio liquidado en Caja son
// caminos MUTUAMENTE EXCLUYENTES (fail-closed). Guard central en liquidarCambioTx
// (cubre Cobrar, liquidación manual total/parcial y edición → COBRADA) + rechazo en
// el alta. La reversa por revertirCambioTx sigue neutralizando la CC una sola vez.

const st = vi.hoisted(() => ({ prisma: null as unknown }));
vi.mock("@/auth", () => ({ auth: async () => ({ user: { id: "u1", name: "Tester" } }) }));
vi.mock("@/lib/prisma", () => ({ get prisma() { return st.prisma; } }));
vi.mock("@/lib/config", () => ({ readOnlyPreview: false, betaMode: false }));
vi.mock("@/lib/services/audit.service", () => ({ writeAuditLog: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ requireActionPermission: vi.fn(async () => null), requireCajaPermission: vi.fn(async () => null) }));
vi.mock("@/lib/parse-monto", async () => await import("../parse-monto"));
vi.mock("@/lib/caja/integridad", async () => await import("./integridad"));
vi.mock("@/lib/caja/integridad.service", async () => await import("./integridad.service"));

import * as diarios from "../../app/(dashboard)/operativa/mov-diarios/actions";

const D = (v: Decimal.Value) => new Decimal(v);
const OF = "oficina", CTA_USD = "cta-usd", CTA_ARS = "cta-ars";
type Row = Record<string, unknown>;

function db(seed: { ops?: Row[]; ccMovs?: Row[]; cuentas?: Row[]; movs?: Row[] } = {}) {
  const { db: t } = fakeTx(seed);
  const p = {
    ...t,
    caja: tabla([{ id: OF, slug: "oficina", label: "Oficina", esPrincipal: true, activa: true, tipo: "CENTRAL_CONTABLE" }]),
    cliente: tabla([{ id: "cli", nombre: "Cliente CC" }]),
    $transaction: async (arg: unknown) => (typeof arg === "function" ? (arg as (tx: unknown) => unknown)(p) : Promise.all(arg as unknown[])),
  };
  st.prisma = p;
  return p;
}
const err = (r: unknown) => (r as { error?: string }).error;
const fd = (o: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) for (const x of Array.isArray(v) ? v : [v]) f.append(k, x);
  return f;
};

/** Operación pendiente con sus dos patas CC (como la deja crearOperacionCambio con impactoCC). */
function opConCC(p: Row = {}) {
  return {
    ops: [{ id: "op1", fecha: new Date("2026-11-01"), tipo: "COMPRA_USD", moneda: "USD", cantidad: D(100), tipoCambio: D(1000), totalARS: D(100000),
      cobroUSD: D(100), cobroARS: D(100000), descripcion: "[CC] compra", pendiente: true, clienteId: "cli", clienteNombre: "Cliente CC", ...p }],
    cuentas: [{ id: CTA_USD, clienteId: "cli", moneda: "USD", saldo: D(-100) }, { id: CTA_ARS, clienteId: "cli", moneda: "ARS", saldo: D(100000) }],
    ccMovs: [
      { id: "cc1", cuentaCorrienteId: CTA_USD, tipo: "EGRESO", monto: D(100), operacionCambioId: "op1", descripcion: "Compra USD | op:op1" },
      { id: "cc2", cuentaCorrienteId: CTA_ARS, tipo: "INGRESO", monto: D(100000), operacionCambioId: "op1", descripcion: "Contrapartida ARS | op:op1" },
    ],
  };
}
const snapshot = (p: ReturnType<typeof db>) => JSON.stringify({
  caja: p.movimientoCaja.rows.length, cc: p.movimientoCC.rows.length,
  saldos: p.cuentaCorriente.rows.map((c) => (c.saldo as Decimal).toString()),
  op: p.operacionCambio.rows.map((o) => [o.pendiente, o.descripcion]),
});
const reconstruida = (p: ReturnType<typeof db>, cta: string) =>
  saldoReconstruido(p.movimientoCC.rows.filter((m) => m.cuentaCorrienteId === cta) as { tipo: string; monto: Decimal }[]);

beforeEach(() => { st.prisma = null; });

describe("MACRO 6 — alta: impactoCC + liquidación en Caja → DENY antes de escribir", () => {
  const base = { fecha: "2026-11-03", tipoOperacion: "COMPRA", moneda: "USD", cantidad: "100", tipoCambio: "1000", clienteId: "cli", clienteNombre: "Cliente CC", impactoCC: "on" };

  it("A. impactoCC + LIQUIDADA → DENY, 0 operaciones / patas / CC", async () => {
    const p = db();
    const r = await diarios.crearOperacionCambio({}, fd({ ...base, estadoOp: "LIQUIDADA", cajaLiqId: OF }));
    expect(err(r)).toBe(MENSAJE_CAMBIO_CON_CC);
    expect([p.operacionCambio.rows.length, p.movimientoCaja.rows.length, p.movimientoCC.rows.length]).toEqual([0, 0, 0]);
  });

  it("B. impactoCC + PARCIAL → DENY, 0 operaciones / patas / CC", async () => {
    const p = db();
    const r = await diarios.crearOperacionCambio({}, fd({ ...base, estadoOp: "PARCIAL", [`cajaLiq_${OF}_div`]: "30" }));
    expect(err(r)).toBe(MENSAJE_CAMBIO_CON_CC);
    expect([p.operacionCambio.rows.length, p.movimientoCaja.rows.length, p.movimientoCC.rows.length]).toEqual([0, 0, 0]);
  });
});

describe("MACRO 6 — guard central: cambio con CC vigente no se liquida en Caja", () => {
  it("C. liquidarCambioTx (total y parcial) → DENY; F. caja, CC y operación idénticas", async () => {
    const p = db(opConCC());
    const antes = snapshot(p);
    await expect(liquidarCambioTx(p as never, { opId: "op1", items: "TOTAL", cajaTotalId: OF, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "t" }))
      .rejects.toThrow(MENSAJE_CAMBIO_CON_CC);
    await expect(liquidarCambioTx(p as never, { opId: "op1", items: [{ cajaId: OF, div: D(30), ars: null }], fecha: new Date(), etiqueta: "Cambio", userName: "t" }))
      .rejects.toThrow(MENSAJE_CAMBIO_CON_CC);
    expect(snapshot(p)).toBe(antes);
    expect(reconstruida(p, CTA_USD).toString()).toBe("-100");
  });

  it("D. vía Cobrar (cobrarOperacionCambio) → DENY, sin patas de caja", async () => {
    const p = db(opConCC());
    const antes = snapshot(p);
    expect(err(await diarios.cobrarOperacionCambio(null, fd({ operacionId: "op1" })))).toBeTruthy();
    expect(snapshot(p)).toBe(antes);
    expect(saldoCaja(p.movimientoCaja.rows, OF, "USD").toString()).toBe("0");
  });

  it("E. vía liquidación manual (total y parcial) y edición → COBRADA → DENY, sin cambios", async () => {
    const p = db(opConCC());
    const antes = snapshot(p);
    expect(err(await diarios.liquidarPagoPendiente(null, fd({ operacionId: "op1", modo: "total", cajaId: OF })))).toBeTruthy();
    expect(err(await diarios.liquidarPagoPendiente(null, fd({ operacionId: "op1", modo: "parcial", [`caja_${OF}_div`]: "30" })))).toBeTruthy();
    expect(err(await diarios.editarOperacionCambio(null, fd({
      id: "op1", tipoOp: "COMPRA", moneda: "USD", cantidad: "100", tipoCambio: "1000", fecha: "2026-11-01", descripcion: "compra", estadoNuevo: "COBRADA",
    })))).toBeTruthy();
    expect(snapshot(p)).toBe(antes);
  });
});

describe("MACRO 6 — sin regresión: operaciones sin CC y reversas", () => {
  it("G. operación SIN CC → parcial + residual en Caja + reversa: normal", async () => {
    const p = db({ ops: [{ ...opConCC().ops[0], descripcion: "compra", clienteId: null }] });
    await liquidarCambioTx(p as never, { opId: "op1", items: [{ cajaId: OF, div: D(30), ars: null }], fecha: new Date(), etiqueta: "Cambio", userName: "t" });
    await liquidarCambioTx(p as never, { opId: "op1", items: "TOTAL", cajaTotalId: OF, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "t" });
    expect(saldoCaja(p.movimientoCaja.rows, OF, "USD").toString()).toBe("100");
    expect(saldoCaja(p.movimientoCaja.rows, OF, "ARS").toString()).toBe("-100000");
    await revertirCambioTx(p as never, { opId: "op1", revertidoPor: "t", fecha: new Date(), cajasAutorizadas: [OF] });
    expect(saldoCaja(p.movimientoCaja.rows, OF, "USD").toString()).toBe("0");
    expect(saldoCaja(p.movimientoCaja.rows, OF, "ARS").toString()).toBe("0");
  });

  it("H. operación CON CC → revertirCambioTx neutraliza la CC una sola vez, sin tocar caja; I. doble reversa DENY", async () => {
    const p = db(opConCC());
    await revertirCambioTx(p as never, { opId: "op1", revertidoPor: "t", fecha: new Date(), cajasAutorizadas: [] });
    const saldos = p.cuentaCorriente.rows.map((c) => (c.saldo as Decimal).toString());
    expect(saldos).toEqual(["0", "0"]);
    expect(reconstruida(p, CTA_USD).toString()).toBe("0");
    expect(reconstruida(p, CTA_ARS).toString()).toBe("0");
    expect(p.movimientoCC.rows.filter((m) => String(m.descripcion).startsWith("[REVERSO]"))).toHaveLength(2);
    expect(p.movimientoCaja.rows).toHaveLength(0);
    expect(String(p.operacionCambio.rows[0].descripcion)).toMatch(/^\[REVERTIDA POR: t\]/);
    await expect(revertirCambioTx(p as never, { opId: "op1", revertidoPor: "t", fecha: new Date(), cajasAutorizadas: [] })).rejects.toThrow(/ya fue revertida/);
    expect(p.movimientoCC.rows).toHaveLength(4);
    // revertida → tampoco se puede liquidar
    await expect(liquidarCambioTx(p as never, { opId: "op1", items: "TOTAL", cajaTotalId: OF, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "t" })).rejects.toThrow(/revertida/);
  });

  it("H'. vía Server Action revertirOperacionCambio sobre op con CC → OK (sin scope de caja)", async () => {
    const p = db(opConCC());
    expect(await diarios.revertirOperacionCambio(null, fd({ id: "op1" }))).toEqual({ ok: true });
    expect(p.cuentaCorriente.rows.map((c) => (c.saldo as Decimal).toString())).toEqual(["0", "0"]);
  });

  it("pendiente SIN CC ni caja → revertir sigue siendo DENY (nada que revertir; se cancela)", async () => {
    const p = db({ ops: [{ ...opConCC().ops[0], descripcion: "compra" }] });
    await expect(revertirCambioTx(p as never, { opId: "op1", revertidoPor: "t", fecha: new Date(), cajasAutorizadas: [] })).rejects.toThrow(/NO_LIQUIDADA/);
  });

  it("legacy: operación ya liquidada en caja CON CC → la reversa sigue neutralizando caja y CC una vez", async () => {
    const s = opConCC({ pendiente: false });
    const p = db({ ...s, movs: [
      { id: "m1", cajaId: OF, tipo: "ENTRADA", moneda: "USD", monto: D(100), confirmado: true, operacionCambioId: "op1", descripcion: "[Cambio op1] x" },
      { id: "m2", cajaId: OF, tipo: "SALIDA", moneda: "ARS", monto: D(100000), confirmado: true, operacionCambioId: "op1", descripcion: "[Cambio op1] y" },
    ] });
    await revertirCambioTx(p as never, { opId: "op1", revertidoPor: "t", fecha: new Date(), cajasAutorizadas: [OF] });
    expect(saldoCaja(p.movimientoCaja.rows, OF, "USD").toString()).toBe("0");
    expect(p.cuentaCorriente.rows.map((c) => (c.saldo as Decimal).toString())).toEqual(["0", "0"]);
  });
});
