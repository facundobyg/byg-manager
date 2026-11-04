import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { tabla } from "../caja/fake-tx";
import { calcularLiquidacion, costoPromedioTrasCompra, type CostosOperacion } from "./integridad";
import { anularOperacionTx, concertarOperacionTx, liquidarOperacionTx, type DatosConcertacion } from "./integridad.service";
import { construirLedger } from "../finance/ledger";
import { calcularPatrimonioNeto } from "../finance/patrimonio";
import { calcularResultadoRealizado } from "../finance/resultado";
import { dataset, opBolsa } from "../finance/test-fixtures";

// MACRO 5 — Carteras propias + Bolsa: servicios reales sobre una base EN MEMORIA con
// estado (la contención real se prueba contra Postgres: scripts/qa-m5-bolsa-pg.ts).

const st = vi.hoisted(() => ({ prisma: null as unknown, audit: [] as { accion: string; description: string }[] }));
vi.mock("@/auth", () => ({ auth: async () => ({ user: { id: "u1", name: "Tester" } }) }));
vi.mock("@/lib/prisma", () => ({ get prisma() { return st.prisma; } }));
vi.mock("@/lib/config", () => ({ readOnlyPreview: false }));
vi.mock("@/lib/services/audit.service", () => ({ writeAuditLog: async (e: { accion: string; description: string }) => { st.audit.push(e); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ requireActionPermission: vi.fn(async () => null) }));
vi.mock("@/lib/services/config.service", () => ({ setTcMepDia: vi.fn() }));
vi.mock("@/lib/parse-monto", async () => await import("../parse-monto"));
vi.mock("@/lib/caja/integridad", async () => await import("../caja/integridad"));
vi.mock("@/lib/bolsa/integridad", async () => await import("./integridad"));
vi.mock("@/lib/bolsa/integridad.service", async () => await import("./integridad.service"));
vi.mock("@/lib/bolsa/ajustes.service", async () => await import("./ajustes.service"));
vi.mock("@/lib/custodia/beta", async () => await import("../custodia/beta"));

import * as bolsa from "../../app/(dashboard)/bolsa/actions";
import * as carteras from "../../app/(dashboard)/carteras/actions";

type Row = Record<string, unknown>;
const D = (v: Decimal.Value) => new Decimal(v);
const n = (v: unknown) => new Decimal(String(v)).toNumber();

function db(seed: { ops?: Row[]; posiciones?: Row[]; holdings?: Row[]; saldoComitente?: Row[] } = {}) {
  const locks: string[] = [];
  const p = {
    operacionBolsa: tabla(seed.ops ?? [], { anulada: false, carteraId: null, comitenteId: null, netoLiquidado: null, costoReal: null, comisionUSD: null, tcMepDia: null, esSenebi: false, fechaLiquidacion: null }),
    operacionBolsaLog: tabla([]),
    cartera: tabla([{ id: "car", nombre: "BYG", saldoPesos: D(1_000_000), saldoUSDCable: D(10_000), saldoUSDMep: D(0) }]),
    activo: tabla([]),
    posicionCartera: tabla(seed.posiciones ?? []),
    holdingComitenteInversion: tabla(seed.holdings ?? []),
    operacionHoldingInversion: tabla([]),
    saldoComitenteInversion: tabla(seed.saldoComitente ?? []),
    auditLog: tabla([]),
    $queryRaw: async (s: TemplateStringsArray) => { locks.push(s.join("?")); return []; },
    $transaction: async (fn: (tx: unknown) => unknown, _o?: unknown) => fn(p),
  };
  st.prisma = p;
  return { p, locks, tx: p as never };
}
let seq = 0;
function op(p: ReturnType<typeof db>["p"], tipo: string, cantidad: number, precio: number, extra: Row = {}) {
  const id = `op${++seq}`;
  p.operacionBolsa.rows.push({ id, tipoOperacion: tipo, ticker: "GGAL", cantidad: D(cantidad), precio: D(precio), moneda: "ARS", estado: "PENDIENTE_CONCERTACION", carteraId: "car", comitenteId: null, anulada: false, netoLiquidado: null, costoReal: null, comisionUSD: null, tcMepDia: null, esSenebi: false, fechaLiquidacion: null, ...extra });
  return id;
}
const sinCostos: CostosOperacion = { comisionPct: null, comisionFija: null, derechosMercado: null, gastos: null, impuestos: null, netoManual: null };
const datos = (c: Partial<CostosOperacion> = {}, extra: Partial<DatosConcertacion> = {}): DatosConcertacion => ({
  nroBoleto: null, alyc: null, fechaConcertacion: null, fechaLiquidacion: null, plazoLiquidacion: "T1",
  costos: { ...sinCostos, ...c }, comisionUSD: null, tcMepDia: null, esSenebi: false, senebiBruto: null, diasCaucion: null, tasaCaucion: null, ...extra,
  saldoUSD: extra.saldoUSD ?? null,
});
const concertar = (tx: never, id: string, c: Partial<CostosOperacion> = {}) => concertarOperacionTx(tx, { operacionId: id, userId: "u", datos: datos(c) });
const caja = (p: ReturnType<typeof db>["p"]) => n(p.cartera.rows[0].saldoPesos);
const pos = (p: ReturnType<typeof db>["p"]) => { const r = p.posicionCartera.rows[0]; return r ? [n(r.cantidad), n(r.precioCompra)] : null; };

/** Motor (Macro 2) sobre el estado de la base en memoria: PN de carteras y resultado realizado. */
function motor(p: ReturnType<typeof db>["p"], precioActual: number) {
  const c = p.cartera.rows[0];
  const ds = dataset({
    carteras: [{
      id: "car", nombre: "BYG", activa: true, saldoPesos: n(c.saldoPesos), saldoUSDCable: n(c.saldoUSDCable), saldoUSDMep: n(c.saldoUSDMep),
      posiciones: p.posicionCartera.rows.map((r) => ({ ticker: "GGAL", cantidad: n(r.cantidad), precioCompra: n(r.precioCompra), precioActual, monedaPrecio: "ARS" as const })),
    }],
    opsBolsa: p.operacionBolsa.rows.map((o) => opBolsa({
      id: o.id as string, tipoOperacion: o.tipoOperacion as string, cantidad: n(o.cantidad), precio: n(o.precio), moneda: "ARS", estado: o.estado as string,
      anulada: o.anulada as boolean, carteraId: o.carteraId as string, netoLiquidado: o.netoLiquidado == null ? null : n(o.netoLiquidado), costoReal: o.costoReal == null ? null : n(o.costoReal),
    })),
    costosCartera: p.operacionBolsaLog.rows.filter((l) => l.accion === "COSTO_CARTERA").map((l) => ({ operacionId: l.operacionId as string, costoUnitario: (l.snapshot as { costoUnitario: string }).costoUnitario })),
  });
  return {
    pnCarteras: calcularPatrimonioNeto(ds, "2026-04-30").componentes.carteras.nativo.ARS,
    resultado: calcularResultadoRealizado(ds, construirLedger(ds), "2026-04").porCategoria.CARTERA_VENTA.nativo.ARS,
  };
}

beforeEach(() => { seq = 0; st.audit = []; });

describe("reglas puras", () => {
  it("liquidación: costos sobre el bruto; compra suma, venta resta; costo unitario de compra con costos", () => {
    const c = calcularLiquidacion("COMPRA_ACCION", D(100), D(1000), { ...sinCostos, comisionPct: D(1), comisionFija: D(50) });
    expect([c.costoReal.toNumber(), c.neto.toNumber(), c.precioPromedioReal!.toNumber()]).toEqual([1050, 101050, 1010.5]);
    const v = calcularLiquidacion("VENTA_ACCION", D(100), D(1100), { ...sinCostos, comisionFija: D(100) });
    expect([v.neto.toNumber(), v.precioPromedioReal]).toEqual([109900, null]);
  });
  it("promedio ponderado: (100 × 1000 + 120.000) / 200 = 1100", () => {
    const r = costoPromedioTrasCompra(D(100), D(1000), D(100), D(120000));
    expect([r.cantidad.toNumber(), r.costo.toNumber()]).toEqual([200, 1100]);
  });
});

describe("1–4 · compra / venta de cartera propia = posición + cash + costo + resultado", () => {
  it("1 + 15. compra: cash ↓, posición ↑, PN neutral (precio de mercado = precio), resultado 0", async () => {
    const { p, tx } = db();
    const pn0 = motor(p, 1000).pnCarteras;
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1000));
    expect(caja(p)).toBe(900_000);
    expect(pos(p)).toEqual([100, 1000]);
    const m = motor(p, 1000);
    expect(m.pnCarteras).toBe(pn0);
    expect(m.resultado).toBe(0);
  });
  it("2. segunda compra: promedio ponderado exacto", async () => {
    const { p, tx } = db();
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1000));
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1200));
    expect(pos(p)).toEqual([200, 1100]);
    expect(caja(p)).toBe(780_000);
  });
  it("3 + 16. venta parcial: cash ↑, posición ↓, costo intacto; resultado = neto − cant × costo promedio", async () => {
    const { p, tx } = db();
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1000));
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1200));
    await concertar(tx, op(p, "VENTA_ACCION", 50, 1300));
    expect(pos(p)).toEqual([150, 1100]);
    expect(caja(p)).toBe(845_000);
    expect(motor(p, 1300).resultado).toBe(10_000); // 65.000 − 50 × 1.100
  });
  it("4. venta total: posición 0 (se elimina) y resultado correcto", async () => {
    const { p, tx } = db();
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1000));
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1200));
    await concertar(tx, op(p, "VENTA_ACCION", 200, 1300));
    expect(pos(p)).toBeNull();
    expect(caja(p)).toBe(1_040_000);
    expect(motor(p, 1300).resultado).toBe(40_000); // 260.000 − 220.000
  });
});

describe("5–6 · comisiones", () => {
  it("5. comisión de compra integra el costo (no se cuenta además como gasto)", async () => {
    const { p, tx } = db();
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1000), { comisionPct: D(1), comisionFija: D(50) });
    expect(pos(p)).toEqual([100, 1010.5]);
    expect(caja(p)).toBe(1_000_000 - 101_050);
  });
  it("6. comisión de venta reduce el producido: resultado = 109.900 − 101.050", async () => {
    const { p, tx } = db();
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1000), { comisionPct: D(1), comisionFija: D(50) });
    await concertar(tx, op(p, "VENTA_ACCION", 100, 1100), { comisionFija: D(100) });
    expect(caja(p)).toBe(1_000_000 - 101_050 + 109_900);
    expect(motor(p, 1100).resultado).toBe(8_850);
  });
});

describe("7–8 · venta sin posición suficiente", () => {
  it("7. venta > posición → DENY sin cambios", async () => {
    const { p, tx } = db();
    await concertar(tx, op(p, "COMPRA_ACCION", 10, 1000));
    const v = op(p, "VENTA_ACCION", 11, 1000);
    await expect(concertar(tx, v)).rejects.toThrow(/Stock insuficiente/);
    expect(pos(p)).toEqual([10, 1000]);
    expect(caja(p)).toBe(990_000);
  });
  it("8. dos ventas de la misma posición: la segunda ve la posición consumida (lock de la cartera antes de leer)", async () => {
    const { p, tx, locks } = db();
    await concertar(tx, op(p, "COMPRA_ACCION", 10, 1000));
    locks.length = 0;
    await concertar(tx, op(p, "VENTA_ACCION", 10, 1000));
    await expect(concertar(tx, op(p, "VENTA_ACCION", 10, 1000))).rejects.toThrow(/Stock insuficiente/);
    expect(locks.some((l) => l.includes('"Cartera"') && l.includes("FOR UPDATE"))).toBe(true);
    expect(pos(p)).toBeNull();
  });
});

describe("9–10 · liquidación", () => {
  it("9. CONCERTADA → LIQUIDADA una vez, sin efecto económico nuevo", async () => {
    const { p, tx } = db();
    const id = op(p, "COMPRA_ACCION", 100, 1000);
    await concertar(tx, id);
    await liquidarOperacionTx(tx, { operacionId: id, userId: "u", fechaLiquidacion: null });
    expect(p.operacionBolsa.rows[0].estado).toBe("LIQUIDADA");
    expect([caja(p), pos(p)]).toEqual([900_000, [100, 1000]]);
  });
  it("10. doble liquidación → DENY; pendiente o anulada no se liquidan", async () => {
    const { p, tx } = db();
    const id = op(p, "COMPRA_ACCION", 100, 1000);
    await expect(liquidarOperacionTx(tx, { operacionId: id, userId: "u", fechaLiquidacion: null })).rejects.toThrow(/concertada/);
    await concertar(tx, id);
    await liquidarOperacionTx(tx, { operacionId: id, userId: "u", fechaLiquidacion: null });
    await expect(liquidarOperacionTx(tx, { operacionId: id, userId: "u", fechaLiquidacion: null })).rejects.toThrow(/ya está liquidada/);
    expect(p.operacionBolsaLog.rows.filter((l) => l.accion === "LIQUIDACION")).toHaveLength(1);
  });
});

describe("11–12 · anulación = neutraliza TODO el hecho; una sola vez", () => {
  it("11a. anular compra: posición, costo y cash vuelven al estado previo", async () => {
    const { p, tx } = db();
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1000));
    const id = op(p, "COMPRA_ACCION", 100, 1200);
    await concertar(tx, id);
    await anularOperacionTx(tx, { operacionId: id, userId: "u", motivo: "error" });
    expect([pos(p), caja(p)]).toEqual([[100, 1000], 900_000]);
  });
  it("11b. anular venta (también LIQUIDADA): posición y costo repuestos, cash devuelto, el motor deja de contar el resultado", async () => {
    const { p, tx } = db();
    await concertar(tx, op(p, "COMPRA_ACCION", 100, 1000));
    const v = op(p, "VENTA_ACCION", 100, 1300);
    await concertar(tx, v);
    await liquidarOperacionTx(tx, { operacionId: v, userId: "u", fechaLiquidacion: null });
    expect(motor(p, 1300).resultado).toBe(30_000);
    await anularOperacionTx(tx, { operacionId: v, userId: "u", motivo: "error" });
    expect([pos(p), caja(p)]).toEqual([[100, 1000], 900_000]);
    expect(motor(p, 1300).resultado).toBe(0);
  });
  it("11c. comitente: saldo y holding vuelven exactos; el movimiento de holding de la operación se elimina", async () => {
    const { p, tx } = db({ saldoComitente: [{ id: "s", comitenteId: "com", saldoARS: D(500_000), saldoUSDCable: D(0), saldoUSDMep: D(0) }] });
    const id = op(p, "COMPRA_BONO", 100, 1000, { carteraId: null, comitenteId: "com" });
    await concertar(tx, id, { comisionFija: D(100) });
    expect(n(p.saldoComitenteInversion.rows[0].saldoARS)).toBe(399_900);
    expect([n(p.holdingComitenteInversion.rows[0].cantidad), n(p.holdingComitenteInversion.rows[0].precioPromedio)]).toEqual([100, 1001]);
    await anularOperacionTx(tx, { operacionId: id, userId: "u", motivo: "error" });
    expect(n(p.saldoComitenteInversion.rows[0].saldoARS)).toBe(500_000);
    expect(p.holdingComitenteInversion.rows).toHaveLength(0);
    expect(p.operacionHoldingInversion.rows).toHaveLength(0);
  });
  it("11d. si la posición cambió después (otra operación), anular la anterior → DENY (fail closed)", async () => {
    const { p, tx } = db();
    const a = op(p, "COMPRA_ACCION", 100, 1000);
    await concertar(tx, a);
    await concertar(tx, op(p, "COMPRA_ACCION", 50, 1100));
    await expect(anularOperacionTx(tx, { operacionId: a, userId: "u", motivo: "x" })).rejects.toThrow(/cambió después/);
    expect([pos(p)?.[0], caja(p)]).toEqual([150, 845_000]);
  });
  it("12. doble anulación → DENY, sin segundo efecto", async () => {
    const { p, tx } = db();
    const id = op(p, "COMPRA_ACCION", 100, 1000);
    await concertar(tx, id);
    await anularOperacionTx(tx, { operacionId: id, userId: "u", motivo: "x" });
    await expect(anularOperacionTx(tx, { operacionId: id, userId: "u", motivo: "x" })).rejects.toThrow(/ya anulada/);
    expect([pos(p), caja(p)]).toEqual([null, 1_000_000]);
  });
  it("legacy: concertada sin efectos registrados → la anulación se rechaza (no se inventan reversas)", async () => {
    const { p, tx } = db();
    const id = op(p, "COMPRA_ACCION", 100, 1000, { estado: "CONCERTADA" });
    await expect(anularOperacionTx(tx, { operacionId: id, userId: "u", motivo: "x" })).rejects.toThrow(/legacy/);
    expect(p.operacionBolsa.rows[0].estado).toBe("CONCERTADA");
  });
});

describe("13–14 · edición y pendientes", () => {
  it("13. edición económica de una concertada → DENY; datos inocuos → OK; liquidada → DENY", async () => {
    const { p, tx } = db();
    const id = op(p, "COMPRA_ACCION", 100, 1000);
    await concertar(tx, id, { comisionFija: D(50) });
    await expect(concertar(tx, id, { comisionFija: D(10) })).rejects.toThrow(/no se editan/);
    await concertarOperacionTx(tx, { operacionId: id, userId: "u", datos: datos({ comisionFija: D(50) }, { nroBoleto: "B-1", alyc: "X" }) });
    expect(p.operacionBolsa.rows[0].nroBoleto).toBe("B-1");
    expect([caja(p), pos(p)]).toEqual([899_950, [100, 1000.5]]); // sin segundo impacto
    await liquidarOperacionTx(tx, { operacionId: id, userId: "u", fechaLiquidacion: null });
    await expect(concertar(tx, id, { comisionFija: D(50) })).rejects.toThrow(/liquidada/);
  });
  it("14. pendiente: sin impacto; anular una pendiente no toca nada", async () => {
    const { p, tx } = db();
    const id = op(p, "COMPRA_ACCION", 100, 1000);
    expect([caja(p), pos(p)]).toEqual([1_000_000, null]);
    await anularOperacionTx(tx, { operacionId: id, userId: "u", motivo: "x" });
    expect([caja(p), pos(p), p.operacionBolsa.rows[0].estado]).toEqual([1_000_000, null, "ANULADA"]);
  });
  it("moneda sin saldo de cartera (EUR) → DENY sin efectos", async () => {
    const { p, tx } = db();
    await expect(concertar(tx, op(p, "COMPRA_ACCION", 1, 1, { moneda: "EUR" }))).rejects.toThrow(/no tiene saldo/);
    expect(p.operacionBolsa.rows[0].estado).toBe("CONCERTADA"); // en Postgres la tx revierte el estado (QA PG)
    expect(pos(p)).toBeNull();
  });
});

describe("17 · custodia fuera del PN propio", () => {
  it("agregar custodia de clientes no cambia el PN", () => {
    const sin = calcularPatrimonioNeto(dataset({}), "2026-04-30");
    const con = calcularPatrimonioNeto(dataset({ custodia: [{ cantidadTotal: 100, precioPromedio: 10, precioActual: 12, monedaPrecio: "USD" }] }), "2026-04-30");
    expect(con.totalUSD).toBe(sin.totalUSD);
    expect(con.custodiaExcluidaUSD).toBe(1200);
  });
});

describe("18 · inputs inválidos → DENY", () => {
  const INVALIDOS = ["0", "-5", "NaN", "Infinity", "0x10", "0b101", "0o17", "1e3", "12abc"];
  const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
  it.each(INVALIDOS)("alta de operación con cantidad / precio %j", async (v) => {
    const { p } = db();
    const base = { sujetoTipo: "cartera", carteraId: "car", tipoOperacion: "COMPRA_ACCION", ticker: "GGAL", moneda: "ARS", mercado: "BYMA" };
    expect(await bolsa.crearOperacionBolsa(null, fd({ ...base, cantidad: v, precio: "10" }))).toHaveProperty("error");
    expect(await bolsa.crearOpMesaDiaria(null, fd({ ...base, cantidad: "1", precio: v }))).toHaveProperty("error");
    expect(p.operacionBolsa.rows).toHaveLength(0);
  });
  it.each(["NaN", "Infinity", "0x10", "1e3", "12abc", "-1"])("concertación con comisión %j → DENY, la operación sigue pendiente", async (v) => {
    const { p } = db();
    const id = op(p, "COMPRA_ACCION", 1, 1000);
    expect(await bolsa.concertarOperacion(null, fd({ operacionId: id, comisionFija: v }))).toHaveProperty("error");
    expect([p.operacionBolsa.rows[0].estado, caja(p)]).toEqual(["PENDIENTE_CONCERTACION", 1_000_000]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// FIX PASS M5-F01 (bolsa USD Cable / MEP explícita) y M5-F02 (ajustes manuales)
// ════════════════════════════════════════════════════════════════════════════

describe("M5-F01 · operaciones USD de cartera propia: bolsa Cable / MEP explícita", () => {
  const usd = (p: ReturnType<typeof db>["p"]) => [n(p.cartera.rows[0].saldoUSDCable), n(p.cartera.rows[0].saldoUSDMep)];
  const conMep = () => { const r = db(); r.p.cartera.rows[0].saldoUSDMep = D(10_000); return r; };
  const concertarUSD = (tx: never, id: string, saldoUSD: "CABLE" | "MEP" | null) =>
    concertarOperacionTx(tx, { operacionId: id, userId: "u", datos: datos({}, { saldoUSD }) });

  it.each([["CABLE", [9_000, 10_000]], ["MEP", [10_000, 9_000]]] as const)("1–2. compra USD %s: solo esa bolsa baja", async (bolsaUSD, esperado) => {
    const { p, tx } = conMep();
    await concertarUSD(tx, op(p, "COMPRA_ACCION", 10, 100, { moneda: "USD" }), bolsaUSD);
    expect(usd(p)).toEqual(esperado);
    expect(p.operacionBolsa.rows[0].saldoUSD).toBe(bolsaUSD);
  });
  it.each([["CABLE", [10_200, 10_000]], ["MEP", [10_000, 10_200]]] as const)("3–4. venta USD %s: solo esa bolsa sube", async (bolsaUSD, esperado) => {
    const { p, tx } = conMep();
    p.posicionCartera.rows.push({ id: "pos", carteraId: "car", activoId: "act", cantidad: D(10), precioCompra: D(15) });
    p.activo.rows.push({ id: "act", ticker: "GGAL" });
    await concertarUSD(tx, op(p, "VENTA_ACCION", 10, 20, { moneda: "USD" }), bolsaUSD);
    expect(usd(p)).toEqual(esperado);
  });
  it.each(["CABLE", "MEP"] as const)("5–6. anulación %s: restaura exactamente esa bolsa (nunca la otra)", async (bolsaUSD) => {
    const { p, tx } = conMep();
    const c = op(p, "COMPRA_ACCION", 10, 100, { moneda: "USD" });
    await concertarUSD(tx, c, bolsaUSD);
    const efectos = p.operacionBolsaLog.rows.find((l) => l.accion === "EFECTOS_CONCERTACION")!.snapshot as { saldo: { campo: string } };
    expect(efectos.saldo.campo).toBe(bolsaUSD === "MEP" ? "saldoUSDMep" : "saldoUSDCable");
    // otra operación mueve la OTRA bolsa: la anulación no debe tocarla
    p.cartera.rows[0][bolsaUSD === "MEP" ? "saldoUSDCable" : "saldoUSDMep"] = D(7_777);
    await anularOperacionTx(tx, { operacionId: c, userId: "u", motivo: "x" });
    expect(usd(p)).toEqual(bolsaUSD === "MEP" ? [7_777, 10_000] : [10_000, 7_777]);
  });
  it("7. valor inválido / ausente / en operación no-USD → DENY sin efectos", async () => {
    const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
    const { p, tx } = conMep();
    const id = op(p, "COMPRA_ACCION", 10, 100, { moneda: "USD" });
    expect(await bolsa.concertarOperacion(null, fd({ operacionId: id, saldoUSD: "BLUE" }))).toEqual({ error: "Bolsa de USD inválida: debe ser Cable o MEP" });
    expect(await bolsa.concertarOperacion(null, fd({ operacionId: id, saldoUSD: "cable" }))).toHaveProperty("error");
    await expect(concertarUSD(tx, id, null)).rejects.toThrow(/Elegí la bolsa de USD/);
    const ars = op(p, "COMPRA_ACCION", 1, 1);
    await expect(concertarUSD(tx, ars, "MEP")).rejects.toThrow(/solo aplica a compras y ventas USD/);
    expect(usd(p)).toEqual([10_000, 10_000]);
    expect(p.operacionBolsa.rows.map((o) => o.estado)).toEqual(["PENDIENTE_CONCERTACION", "PENDIENTE_CONCERTACION"]);
  });
  it("8. ARS: no altera ninguna bolsa USD", async () => {
    const { p, tx } = conMep();
    await concertar(tx, op(p, "COMPRA_ACCION", 10, 100));
    expect([caja(p), ...usd(p)]).toEqual([999_000, 10_000, 10_000]);
  });
  it("edición de una concertada: cambiar la bolsa USD → DENY; legacy sin elección se trata como Cable", async () => {
    const { p, tx } = conMep();
    const id = op(p, "COMPRA_ACCION", 10, 100, { moneda: "USD" });
    await concertarUSD(tx, id, "MEP");
    await expect(concertarUSD(tx, id, "CABLE")).rejects.toThrow(/bolsa de USD no se edita/);
    await concertarUSD(tx, id, "MEP"); // misma bolsa: edición inocua OK
    const legacy = op(p, "COMPRA_ACCION", 1, 1, { moneda: "USD", estado: "CONCERTADA", saldoUSD: null, netoLiquidado: D(1), costoReal: D(0) });
    await concertarUSD(tx, legacy, "CABLE");
    await expect(concertarUSD(tx, legacy, "MEP")).rejects.toThrow(/bolsa de USD no se edita/);
  });
  it("9. Macro 2: compra MEP → PN neutral (Cable + MEP siguen siendo cash propio)", async () => {
    const { p, tx } = conMep();
    const pn = () => {
      const c = p.cartera.rows[0];
      return calcularPatrimonioNeto(dataset({ carteras: [{
        id: "car", nombre: "BYG", activa: true, saldoPesos: n(c.saldoPesos), saldoUSDCable: n(c.saldoUSDCable), saldoUSDMep: n(c.saldoUSDMep),
        posiciones: p.posicionCartera.rows.map((r) => ({ ticker: "GGAL", cantidad: n(r.cantidad), precioCompra: n(r.precioCompra), precioActual: 100, monedaPrecio: "USD" as const })),
      }] }), "2026-04-30").componentes.carteras.nativo.USD;
    };
    const antes = pn();
    await concertarUSD(tx, op(p, "COMPRA_ACCION", 10, 100, { moneda: "USD" }), "MEP");
    expect(pn()).toBe(antes);
  });
});

describe("M5-F02 · ajuste / apertura manual de posición: explícito y sin cash", () => {
  const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
  const alta = { carteraId: "car", ticker: "GGAL", categoria: "ACCION_USD", cantidad: "10", precioCompra: "100", monedaPrecio: "ARS" };

  it("1. agregar sin confirmarAjuste → DENY, nada escrito", async () => {
    const { p } = db();
    expect(await carteras.agregarPosicion(null, fd(alta))).toEqual({ error: expect.stringMatching(/ajuste \/ apertura sin movimiento de cash/) });
    expect(await carteras.agregarPosicion(null, fd({ ...alta, confirmarAjuste: "true" }))).toHaveProperty("error"); // solo "on"
    expect(p.posicionCartera.rows).toHaveLength(0);
  });
  it("2–5. agregar con confirmación: posición cambia, cash NO, AuditLog AJUSTE_POSICION con antes/después", async () => {
    const { p } = db();
    const cash0 = [caja(p), n(p.cartera.rows[0].saldoUSDCable), n(p.cartera.rows[0].saldoUSDMep)];
    expect(await carteras.agregarPosicion(null, fd({ ...alta, confirmarAjuste: "on" }))).toEqual({ success: true });
    expect(await carteras.agregarPosicion(null, fd({ ...alta, cantidad: "10", precioCompra: "200", confirmarAjuste: "on" }))).toEqual({ success: true });
    expect(pos(p)).toEqual([20, 150]);
    expect([caja(p), n(p.cartera.rows[0].saldoUSDCable), n(p.cartera.rows[0].saldoUSDMep)]).toEqual(cash0);
    // AuditLog escrito en la MISMA tx del ajuste, con antes / después estructurados.
    const logs = p.auditLog.rows as { accion: string; userId: string; datosPrevios: Row; datosNuevos: Row & { description: string } }[];
    expect(logs.map((a) => a.accion)).toEqual(["AJUSTE_POSICION", "AJUSTE_POSICION"]);
    expect(logs[1].userId).toBe("u1");
    expect(logs[1].datosPrevios).toMatchObject({ ticker: "GGAL", cantidad: "10", costo: "100" });
    expect(logs[1].datosNuevos).toMatchObject({ ticker: "GGAL", cantidad: "20", costo: "150" });
    expect(logs[1].datosNuevos.description).toMatch(/\(sin cash\): 10 @ 100 → 20 @ 150/);
  });
  it("6. editar sin confirmación → DENY; con confirmación → ajuste auditado, cash intacto", async () => {
    const { p } = db({ posiciones: [{ id: "pos", carteraId: "car", activoId: "act", cantidad: D(10), precioCompra: D(100), Activo: { ticker: "GGAL" } }] });
    expect(await carteras.editarPosicion(null, fd({ posicionId: "pos", cantidad: "15" }))).toHaveProperty("error");
    expect(pos(p)).toEqual([10, 100]);
    expect(await carteras.editarPosicion(null, fd({ posicionId: "pos", cantidad: "15", confirmarAjuste: "on" }))).toEqual({ success: true });
    expect(pos(p)).toEqual([15, 100]);
    expect(caja(p)).toBe(1_000_000);
    const log = p.auditLog.rows[0] as { accion: string; datosNuevos: { description: string } };
    expect(log.accion).toBe("AJUSTE_POSICION");
    expect(log.datosNuevos.description).toMatch(/10 @ 100 → 15 @ 100/);
  });
  it("7. ajuste de saldos: compare-and-set rechaza si una concertación movió el saldo", async () => {
    const { p, tx } = db();
    const form = { carteraId: "car", slug: "byg", saldoPesos: "500000", saldoUSDCable: "10000", saldoUSDMep: "0", saldoPesosAnterior: "1000000", saldoUSDCableAnterior: "10000", saldoUSDMepAnterior: "0" };
    await concertar(tx, op(p, "COMPRA_ACCION", 10, 100)); // mueve saldoPesos a 999.000
    expect(await carteras.updateSaldosCartera({}, fd(form))).toEqual({ error: expect.stringMatching(/cambiaron/) });
    expect(caja(p)).toBe(999_000);
    expect(await carteras.updateSaldosCartera({}, fd({ ...form, saldoPesosAnterior: "999000" }))).toEqual({ ok: true });
    expect(caja(p)).toBe(500_000);
    expect(st.audit.at(-1)).toMatchObject({ accion: "AJUSTE_SALDOS_CARTERA" });
  });
});
