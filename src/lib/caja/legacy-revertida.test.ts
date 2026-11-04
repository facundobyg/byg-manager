import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { cancelarCambioTx, liquidarCambioTx, revertirCambioTx } from "./integridad.service";
import { descripcionOpEditada, esOpRevertida } from "./integridad";
import { fakeTx, tabla } from "./fake-tx";
import { calcularResultadoRealizado } from "../finance/resultado";
import { construirLedger } from "../finance/ledger";
import { dataset, opCambio } from "../finance/test-fixtures";

// PRE-CUTOVER — MICRO-FIX: operaciones de cambio revertidas por el código anterior
// llevan la marca LEGACY "[REVERTIDA] …" (sin "POR:"). Deben tener la misma semántica
// que las revertidas modernas "[REVERTIDA POR: x] …": terminales para todo flujo
// económico y fuera del resultado. Formato reproducido de los datos reales (5 en PROD).

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
const OF = "oficina";
const ID = "3ce26b4c-6d86-411f-ba08-3727d884f477";
type Row = Record<string, unknown>;

/** Réplica del caso real 3ce26b4c: cambio con CC, liquidado y revertido por el código viejo. */
function legacy(descripcion = "[REVERTIDA] [CC] Operación de COMPRA USD | usr:Facundo") {
  const caja = (id: string, tipo: string, moneda: string, monto: number, desc: string) =>
    ({ id, cajaId: OF, tipo, moneda, monto: D(monto), confirmado: true, operacionCambioId: null, descripcion: desc, fecha: new Date("2026-05-21") });
  return {
    ops: [{ id: ID, fecha: new Date("2026-05-21"), tipo: "COMPRA_USD", moneda: "USD", cantidad: D(1000), tipoCambio: D(1400), totalARS: D(1_400_000),
      cobroUSD: D(1000), cobroARS: D(1_400_000), descripcion, pendiente: true, clienteId: "cli", clienteNombre: "C" }],
    movs: [
      caja("c1", "ENTRADA", "USD", 1000, `[Cambio ${ID}] Compra divisa`),
      caja("c2", "SALIDA", "ARS", 1_400_000, `[Cambio ${ID}] Pago ARS x Compra`),
      caja("c3", "SALIDA", "USD", 1000, `[REVERSO Cambio ${ID}] [Cambio ${ID}] Compra divisa`),
      caja("c4", "ENTRADA", "ARS", 1_400_000, `[REVERSO Cambio ${ID}] [Cambio ${ID}] Pago ARS x Compra`),
    ],
    cuentas: [{ id: "cta-usd", clienteId: "cli", moneda: "USD", saldo: D(0) }, { id: "cta-ars", clienteId: "cli", moneda: "ARS", saldo: D(0) }],
    ccMovs: [
      { id: "k1", cuentaCorrienteId: "cta-usd", tipo: "EGRESO", monto: D(1000), operacionCambioId: ID, descripcion: `Compra USD - Operación Cambio | op:${ID}` },
      { id: "k2", cuentaCorrienteId: "cta-usd", tipo: "INGRESO", monto: D(1000), operacionCambioId: ID, descripcion: `[REVERSO] Compra USD - Operación Cambio | op:${ID}` },
      { id: "k3", cuentaCorrienteId: "cta-ars", tipo: "INGRESO", monto: D(1_400_000), operacionCambioId: ID, descripcion: `Compra USD - Contrapartida ARS | op:${ID}` },
      { id: "k4", cuentaCorrienteId: "cta-ars", tipo: "EGRESO", monto: D(1_400_000), operacionCambioId: ID, descripcion: `[REVERSO] Compra USD - Contrapartida ARS | op:${ID}` },
    ],
  };
}
function db(seed: { ops?: Row[]; ccMovs?: Row[]; cuentas?: Row[]; movs?: Row[] }) {
  const { db: t } = fakeTx(seed);
  const p = {
    ...t,
    caja: tabla([{ id: OF, slug: "oficina", label: "Oficina", esPrincipal: true, activa: true, tipo: "CENTRAL_CONTABLE" }]),
    $transaction: async (arg: unknown) => (typeof arg === "function" ? (arg as (tx: unknown) => unknown)(p) : Promise.all(arg as unknown[])),
  };
  st.prisma = p;
  return p;
}
const snapshot = (p: ReturnType<typeof db>) => JSON.stringify({
  caja: p.movimientoCaja.rows.length, cc: p.movimientoCC.rows.length, ops: p.operacionCambio.rows.map((o) => [o.id, o.pendiente, o.descripcion]),
  saldos: p.cuentaCorriente.rows.map((c) => (c.saldo as Decimal).toString()),
});
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.append(k, v); return f; };
const err = (r: unknown) => (r as { error?: string } | undefined)?.error;

beforeEach(() => { st.prisma = null; });

describe("SSOT esOpRevertida — formato moderno y legacy, solo estructural al inicio", () => {
  it.each([
    ["[REVERTIDA POR: Augusto] Operación de COMPRA USD", true],                 // 1
    ["[REVERTIDA]", true],                                                       // 2
    ["[REVERTIDA] [CC] Operación de COMPRA USD | usr:Facundo", true],           // 3 (formato real)
    ["[REVERTIDA] Operación de VENTA USD | usr:Facu", true],
    ["  [REVERTIDA] con espacios previos", true],
    ["Operación de COMPRA USD | usr:Facundo", false],                           // 4
    ["OPERACION NO REVERTIDA", false],                                           // 5
    ["REVERTIDA MANUALMENTE", false],
    ["TEST [REVERTIDA]", false],
    ["[CC] [REVERTIDA] compra", false],
    ["[REVERTIDA POR NADIE] x", false],
    ["[REVERTIDAS] x", false],
    ["", false],
    [null, false],
  ])("%j → %s", (desc, esperado) => {
    expect(esOpRevertida(desc as string | null)).toBe(esperado);
  });

  it("editar el texto conserva la marca legacy (no se puede borrar editando)", () => {
    expect(descripcionOpEditada("[REVERTIDA] [CC] Operación de COMPRA USD", "texto nuevo")).toBe("[REVERTIDA] [CC] texto nuevo");
  });
});

describe("legacy [REVERTIDA] — protegida igual que una revertida moderna (0 escrituras)", () => {
  it("6. Cobrar (cobrarOperacionCambio) → DENY, sin caja ni CC nuevas", async () => {
    const p = db(legacy());
    const antes = snapshot(p);
    expect(err(await diarios.cobrarOperacionCambio(null, fd({ operacionId: ID })))).toBeTruthy();
    expect(snapshot(p)).toBe(antes);
  });

  it("7. liquidarCambioTx total y parcial → DENY; liquidación manual → DENY", async () => {
    const p = db(legacy());
    const antes = snapshot(p);
    await expect(liquidarCambioTx(p as never, { opId: ID, items: "TOTAL", cajaTotalId: OF, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "t" })).rejects.toThrow(/revertida/);
    await expect(liquidarCambioTx(p as never, { opId: ID, items: [{ cajaId: OF, div: D(10), ars: null }], fecha: new Date(), etiqueta: "Cambio", userName: "t" })).rejects.toThrow(/revertida/);
    expect(err(await diarios.liquidarPagoPendiente(null, fd({ operacionId: ID, modo: "total", cajaId: OF })))).toBeTruthy();
    expect(snapshot(p)).toBe(antes);
  });

  it("8. edición a COBRADA → DENY", async () => {
    const p = db(legacy());
    const antes = snapshot(p);
    expect(err(await diarios.editarOperacionCambio(null, fd({
      id: ID, tipoOp: "COMPRA", moneda: "USD", cantidad: "1000", tipoCambio: "1400", fecha: "2026-05-21", descripcion: "x", estadoNuevo: "COBRADA",
    })))).toMatch(/revertida/i);
    expect(snapshot(p)).toBe(antes);
  });

  it("9. nueva reversa → DENY (servicio y Server Action); cancelar → DENY", async () => {
    const p = db(legacy());
    const antes = snapshot(p);
    await expect(revertirCambioTx(p as never, { opId: ID, revertidoPor: "t", fecha: new Date(), cajasAutorizadas: [OF] })).rejects.toThrow(/ya fue revertida/);
    expect(err(await diarios.revertirOperacionCambio(null, fd({ id: ID })))).toMatch(/ya fue revertida/);
    await expect(cancelarCambioTx(p as never, { opId: ID, fecha: new Date() })).rejects.toThrow(/ya fue revertida/);
    expect(snapshot(p)).toBe(antes);
  });

  it("legacy revertida SIN patas de caja (caso de CC sola) → cancelar no la borra, reversa DENY", async () => {
    const s = legacy();
    const p = db({ ...s, movs: [] });
    await expect(cancelarCambioTx(p as never, { opId: ID, fecha: new Date() })).rejects.toThrow(/ya fue revertida/);
    await expect(revertirCambioTx(p as never, { opId: ID, revertidoPor: "t", fecha: new Date(), cajasAutorizadas: [] })).rejects.toThrow(/ya fue revertida/);
    expect(p.operacionCambio.rows).toHaveLength(1);
  });

  it("control: la misma operación SIN marca (pendiente real sin CC vigente) sí se liquida", async () => {
    const s = legacy("Operación de COMPRA USD | usr:Facundo");
    const p = db({ ...s, movs: [], ccMovs: [] });
    await liquidarCambioTx(p as never, { opId: ID, items: "TOTAL", cajaTotalId: OF, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "t" });
    expect(p.movimientoCaja.rows).toHaveLength(2);
  });
});

describe("10. motor financiero — legacy revertida no genera resultado (igual que la moderna)", () => {
  const ventaRevertida = (descripcion: string) => dataset({ opsCambio: [
    opCambio({ id: "c", tipo: "COMPRA_USD", fecha: "2026-04-01", cantidad: 100, totalARS: 100_000 }),
    opCambio({ id: "v", tipo: "VENTA_USD", fecha: "2026-04-05", cantidad: 100, totalARS: 110_000, pendiente: true, descripcion }),
  ] });
  const res = (descripcion: string) => {
    const ds = ventaRevertida(descripcion);
    const ledger = construirLedger(ds);
    return { r: calcularResultadoRealizado(ds, ledger, "2026-04"), hecho: ledger.hechos.find((h) => h.origenId === "v") };
  };

  it("legacy [REVERTIDA] y moderna [REVERTIDA POR:] → mismo estado REVERTIDO y ninguna partida", () => {
    const leg = res("[REVERTIDA] Operación de VENTA USD | usr:Facu");
    const mod = res("[REVERTIDA POR: t] Operación de VENTA USD");
    expect(leg.hecho?.estado).toBe("REVERTIDO");
    expect(mod.hecho?.estado).toBe("REVERTIDO");
    expect(leg.r.partidas.filter((p) => p.origenId === "v")).toHaveLength(0);
    expect(JSON.stringify(leg.r.porCategoria)).toBe(JSON.stringify(mod.r.porCategoria));
  });
});
