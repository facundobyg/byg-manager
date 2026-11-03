import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { fakeTx, tabla } from "../caja/fake-tx";
import { previewInteresPendienteCC, saldoInicialInteresCC, saldoReconstruido, validarEdicionPF } from "./integridad";
import { construirLedger } from "../finance/ledger";
import { calcularPatrimonioNeto } from "../finance/patrimonio";
import { calcularResultadoRealizado } from "../finance/resultado";
import { dataset } from "../finance/test-fixtures";
import { idsRevertidos, revertirCambioTx, revertirMovimientoTx } from "../caja/integridad.service";
import { reversasValidasCaja } from "../finance/ledger";

// MACRO 4 — Integridad CC + PF: Server Actions reales sobre una base EN MEMORIA con
// estado. La contención real (lost update, doble reversión, atomicidad) se prueba
// contra Postgres en scripts/qa-m4-cc-pf-pg.ts (TEST V5).

const st = vi.hoisted(() => ({ prisma: null as unknown }));
vi.mock("@/auth", () => ({ auth: async () => ({ user: { id: "u1", name: "Tester" } }) }));
vi.mock("@/lib/prisma", () => ({ get prisma() { return st.prisma; } }));
vi.mock("@/lib/config", () => ({ readOnlyPreview: false }));
vi.mock("@/lib/services/audit.service", () => ({ writeAuditLog: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ requireActionPermission: vi.fn(async () => null), requireCajaPermission: vi.fn(async () => null) }));
vi.mock("@/lib/data/movimiento-cc", () => ({ esMovimientoDeOperacionAgrupada: () => false, extraerOperationRef: () => null }));
vi.mock("@/lib/parse-monto", async () => await import("../parse-monto"));
vi.mock("@/lib/caja/integridad", async () => await import("../caja/integridad"));
vi.mock("@/lib/cc/integridad", async () => await import("./integridad"));
vi.mock("@/lib/cc/integridad.service", async () => await import("./integridad.service"));
vi.mock("@/lib/services/cc.service", async () => await import("../services/cc.service"));
vi.mock("@/lib/services/intereses.service", async () => await import("../services/intereses.service"));
vi.mock("@/lib/services/liquidacion-cc.service", async () => await import("../services/liquidacion-cc.service"));
vi.mock("@/lib/caja/integridad.service", async () => await import("../caja/integridad.service"));

import * as cc from "../../app/(dashboard)/clientes/actions";

type Row = Record<string, unknown>;
const D = (v: Decimal.Value) => new Decimal(v);

function db(seed: { cuentas?: Row[]; movs?: Row[]; pfs?: Row[]; pfMovs?: Row[]; clientes?: Row[]; opsCambio?: Row[]; cajaMovs?: Row[] } = {}) {
  const { db: t, locks } = fakeTx({
    ccMovs: seed.movs ?? [], ops: seed.opsCambio ?? [], movs: seed.cajaMovs ?? [],
    cuentas: seed.cuentas ?? [{ id: "usd", clienteId: "cli", moneda: "USD", saldo: D(1000) }, { id: "ars", clienteId: "cli", moneda: "ARS", saldo: D(0) }],
  });
  const p = {
    ...t,
    plazoFijo: tabla(seed.pfs ?? []),
    plazoFijoMovimiento: tabla(seed.pfMovs ?? []),
    cliente: tabla(seed.clientes ?? [{ id: "cli", nombre: "Cliente QA", tasaCC: D("0.365") }]),
    custodiaCliente: tabla([]), operacionBolsa: tabla([]), transferenciaActivo: tabla([]),
    $transaction: async (fn: (tx: unknown) => unknown, _opts?: unknown) => fn(p),
  };
  st.prisma = p;
  return { p, locks };
}
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const saldo = (p: ReturnType<typeof db>["p"], id: string) => (p.cuentaCorriente.rows.find((c) => c.id === id)!.saldo as Decimal).toNumber();
const reconstruido = (p: ReturnType<typeof db>["p"], id: string) =>
  saldoReconstruido(p.movimientoCC.rows.filter((m) => m.cuentaCorrienteId === id) as { tipo: string; monto: Decimal }[]).toNumber();
const err = (r: unknown) => (r as { error?: string }).error;

beforeEach(() => { st.prisma = null; });

// 1. movimiento CC: increment atómico, saldo = Σ movimientos
describe("1 · movimiento CC sin lost update", () => {
  it("dos movimientos seguidos: saldo exacto y reconstruible; el update es increment (nunca saldo absoluto)", async () => {
    const { p } = db();
    const upd = vi.spyOn(p.cuentaCorriente, "update");
    await cc.crearMovimientoCC(null, fd({ cuentaId: "usd", clienteId: "cli", tipo: "INGRESO", monto: "100" }));
    await cc.crearMovimientoCC(null, fd({ cuentaId: "usd", clienteId: "cli", tipo: "EGRESO", monto: "30,5" }));
    expect(saldo(p, "usd")).toBe(1069.5);
    expect(reconstruido(p, "usd")).toBe(69.5); // + 1000 de apertura sin movimiento (seed)
    for (const c of upd.mock.calls) expect((c[0] as unknown as { data: { saldo: object } }).data.saldo).toHaveProperty("increment");
  });
});

// 2. ejecutarOperacion misma moneda
describe("2 · ejecutarOperacion misma moneda: efecto neto exacto", () => {
  it("RULO USD→USD 100 al 10%: EGRESO 100 + INGRESO 110 → saldo +10 (antes el 2º absoluto pisaba al 1º: +110)", async () => {
    const { p } = db();
    const r = await cc.ejecutarOperacion(fd({ clienteId: "cli", tipo: "RULO", monedaOrigen: "USD", monedaDestino: "USD", monto: "100", tasa: "10" }));
    expect(r).toMatchObject({ success: true });
    expect(saldo(p, "usd")).toBe(1010);
    expect(p.movimientoCC.rows.map((m) => [m.tipo, (m.monto as Decimal).toNumber()])).toEqual([["EGRESO", 100], ["INGRESO", 110]]);
  });
  it("DIVISA USD→ARS: cada cuenta recibe exactamente su pata", async () => {
    const { p } = db();
    await cc.ejecutarOperacion(fd({ clienteId: "cli", tipo: "DIVISA", monedaOrigen: "USD", monedaDestino: "ARS", monto: "100", tipoCambio: "1200" }));
    expect([saldo(p, "usd"), saldo(p, "ars")]).toEqual([900, 120000]);
  });
});

// 3. inputs inválidos
const INVALIDOS = ["0", "-5", "NaN", "Infinity", "0x10", "0b101", "0o17", "1e3", "12abc"];
describe("3 · inputs inválidos → DENY sin escritura", () => {
  it.each(INVALIDOS)("ejecutarOperacion monto %j", async (v) => {
    const { p } = db();
    expect(err(await cc.ejecutarOperacion(fd({ clienteId: "cli", tipo: "RULO", monedaOrigen: "USD", monedaDestino: "ARS", monto: v, tasa: "1" })))).toBeTruthy();
    expect(p.movimientoCC.rows).toHaveLength(0);
  });
  it.each(["NaN", "Infinity", "0x10", "1e3", "-1", "12abc"])("ejecutarOperacion tasa/TC %j", async (v) => {
    const { p } = db();
    expect(err(await cc.ejecutarOperacion(fd({ clienteId: "cli", tipo: "RULO", monedaOrigen: "USD", monedaDestino: "ARS", monto: "10", tasa: v })))).toBeTruthy();
    expect(err(await cc.ejecutarOperacion(fd({ clienteId: "cli", tipo: "DIVISA", monedaOrigen: "USD", monedaDestino: "ARS", monto: "10", tipoCambio: v })))).toBeTruthy();
    expect(err(await cc.ejecutarOperacion(fd({ clienteId: "cli", tipo: "LP", monedaOrigen: "USD", monto: "10", tasa: v, plazoDias: "30" })))).toBeTruthy();
    expect(p.movimientoCC.rows).toHaveLength(0);
    expect(p.plazoFijo.rows).toHaveLength(0);
  });
  it("aplicarTodos: payload con cuenta inválida → DENY sin escrituras (el monto ya no se transporta: ver B)", async () => {
    const { p } = db();
    expect(err(await cc.aplicarTodosInteresesCC(fd({ payload: JSON.stringify([{ cuentaId: "usd" }, { cuentaId: 5 }]) })))).toBe("Payload inválido");
    expect(err(await cc.aplicarTodosInteresesCC(fd({ payload: "{no-json" })))).toBe("Payload inválido");
    expect(p.movimientoCC.rows).toHaveLength(0);
  });
  it.each(["NaN", "Infinity", "0x10", "1e3", "12abc"])("liquidarInteresCC tasa/interés %j", async (v) => {
    const { p } = db();
    const base = { cuentaId: "usd", clienteId: "cli", fechaInicio: "2026-09-01", fechaFin: "2026-09-30", tasa: "10", interesAplicado: "0" };
    expect(err(await cc.liquidarInteresCCAction(null, fd({ ...base, tasa: v })))).toBeTruthy();
    expect(err(await cc.liquidarInteresCCAction(null, fd({ ...base, interesAplicado: v })))).toBeTruthy();
    expect(p.movimientoCC.rows).toHaveLength(0);
  });
  it.each(INVALIDOS)("crearPlazoFijoSimple capital %j", async (v) => {
    const { p } = db();
    expect(err(await cc.crearPlazoFijoSimple(null, fd({ clienteId: "cli", moneda: "USD", capital: v, tasaAnual: "5", fechaInicio: "2026-10-01", fechaVencimiento: "2026-11-01" })))).toBeTruthy();
    expect(p.plazoFijo.rows).toHaveLength(0);
  });
});

// 4–5. PF desde CC + reconciliación
describe("4–5 · crear PF desde CC → MovimientoCC + saldo; reconciliar no lo altera", () => {
  const crear = () => cc.crearPlazoFijoSimple(null, fd({ clienteId: "cli", moneda: "USD", capital: "400", tasaAnual: "5", fechaInicio: "2026-10-01", fechaVencimiento: "2026-11-01" }));
  it("PF + EGRESO vinculados por el mismo op:<ref>; saldo 1000 → 600", async () => {
    const { p } = db({ movs: [{ id: "ing", cuentaCorrienteId: "usd", tipo: "INGRESO", monto: D(1000), descripcion: "depósito", fecha: new Date("2026-09-01") }] });
    expect(await crear()).toEqual({ ok: true });
    expect(saldo(p, "usd")).toBe(600);
    const egreso = p.movimientoCC.rows.find((m) => m.tipo === "EGRESO")!;
    expect((egreso.monto as Decimal).toNumber()).toBe(400);
    expect((egreso.fecha as Date).toISOString().slice(0, 10)).toBe("2026-10-01");
    const ref = String(egreso.descripcion).match(/^PF egreso \| op:([a-zA-Z0-9-]+)$/)?.[1];
    expect(ref).toBeTruthy();
    expect(p.plazoFijo.rows[0].notas).toBe(`PF desde CC | op:${ref}`);
    expect(reconstruido(p, "usd")).toBe(600);
  });
  it("reconciliar después: saldo intacto (diferencia 0)", async () => {
    const { p } = db({ movs: [{ id: "ing", cuentaCorrienteId: "usd", tipo: "INGRESO", monto: D(1000), descripcion: "depósito", fecha: new Date("2026-09-01") }] });
    await crear();
    expect(await cc.reconciliarSaldoCC(null, fd({ cuentaId: "usd", clienteId: "cli" }))).toEqual({ ok: true, diferencia: "0.00" });
    expect(saldo(p, "usd")).toBe(600);
  });
  it("legacy inconsistente (PF viejo sin MovimientoCC): se informa la diferencia y NO se ajusta (antes: doble pasivo)", async () => {
    const { p } = db({ cuentas: [{ id: "usd", clienteId: "cli", moneda: "USD", saldo: D(600) }], movs: [
      { id: "ing", cuentaCorrienteId: "usd", tipo: "INGRESO", monto: D(1000), descripcion: "depósito", fecha: new Date("2026-09-01") },
    ] });
    expect(await cc.reconciliarSaldoCC(null, fd({ cuentaId: "usd", clienteId: "cli" }))).toEqual({ ok: true, diferencia: "-400.00" });
    expect(saldo(p, "usd")).toBe(600);
  });
  it("crear PF sin CC previa: crea la cuenta en 0 y el EGRESO la deja en −capital (trazable)", async () => {
    const { p } = db({ cuentas: [] });
    await cc.crearPlazoFijoSimple(null, fd({ clienteId: "cli", moneda: "EUR", capital: "50", tasaAnual: "0", fechaInicio: "2026-10-01", fechaVencimiento: "2026-11-01" }));
    const cuenta = p.cuentaCorriente.rows[0];
    expect((cuenta.saldo as Decimal).toNumber()).toBe(-50);
    expect(reconstruido(p, cuenta.id as string)).toBe(-50);
  });
});

// 6. editar PF
describe("6 · editar PF económicamente → DENY", () => {
  const pf = { id: "pf", clienteId: "cli", moneda: "USD", capital: D(1000), saldoActual: D(1000), tasaAnual: D(5), estado: "ACTIVO", fechaInicio: new Date("2026-10-01"), fechaVencimiento: new Date("2026-11-01") };
  const form = (o: Record<string, string> = {}) => fd({ pfId: "pf", clienteId: "cli", capital: "1000", saldoActual: "1000", estado: "ACTIVO", tasaAnual: "5", fechaInicio: "2026-10-01", fechaVencimiento: "2026-11-01", ...o });
  it.each([
    ["capital", { capital: "1500" }, /capital/],
    ["saldoActual (interés sin fecha)", { saldoActual: "1010" }, /saldo actual/],
    ["estado", { estado: "CANCELADO" }, /estado/],
  ])("%s → DENY, PF intacto", async (_n, o, re) => {
    const { p } = db({ pfs: [{ ...pf }] });
    expect(err(await cc.editarPlazoFijo(null, form(o)))).toMatch(re);
    expect(p.plazoFijo.rows[0]).toMatchObject({ estado: "ACTIVO" });
    expect((p.plazoFijo.rows[0].saldoActual as Decimal).toNumber()).toBe(1000);
  });
  it("tasa y fechas (sin efecto económico inmediato) → OK", async () => {
    const { p } = db({ pfs: [{ ...pf }] });
    expect(await cc.editarPlazoFijo(null, form({ tasaAnual: "6,5", fechaVencimiento: "2026-12-01" }))).toEqual({ ok: true });
    expect((p.plazoFijo.rows[0].tasaAnual as Decimal).toNumber()).toBe(6.5);
  });
  it("regla pura: moneda y cliente tampoco", () => {
    const a = { capital: 1, saldoActual: 1, estado: "ACTIVO", moneda: "USD", clienteId: "c" };
    expect(validarEdicionPF(a, { moneda: "ARS" })).toMatch(/moneda/);
    expect(validarEdicionPF(a, { clienteId: "x" })).toMatch(/cliente/);
  });
});

// 7–8. interés CC
describe("7–8 · interés CC: una sola aplicación; revertido → neutral", () => {
  afterEach(() => { vi.useRealTimers(); });
  const en = (iso: string) => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(`${iso}T15:00:00Z`)); };
  const conSaldo = () => db({ movs: [{ id: "ing", cuentaCorrienteId: "usd", tipo: "INGRESO", monto: D(100000), descripcion: "depósito", fecha: U("2026-08-01") }] });

  it("aplicarInteresCC dos veces el mismo día → la 2ª no encuentra días pendientes (bajo lock)", async () => {
    en("2026-09-20");
    const { p, locks } = conSaldo();
    expect(await cc.aplicarInteresCC(fd({ cuentaId: "usd" }))).toEqual({ success: true });
    expect(err(await cc.aplicarInteresCC(fd({ cuentaId: "usd" })))).toMatch(/No hay días pendientes/);
    expect(p.movimientoCC.rows.filter((m) => m.tipo === "INTERES")).toHaveLength(1);
    expect(locks.some((l) => l.includes('"CuentaCorriente"') && l.includes("FOR UPDATE"))).toBe(true);
  });
  it("aplicarTodos con la misma cuenta repetida → una sola aplicación", async () => {
    en("2026-09-20");
    const { p } = conSaldo();
    const r = await cc.aplicarTodosInteresesCC(fd({ payload: JSON.stringify([{ cuentaId: "usd" }, { cuentaId: "usd" }]) }));
    expect(r).toEqual({ success: true, total: 1 });
    expect(p.movimientoCC.rows.filter((m) => m.tipo === "INTERES")).toHaveLength(1);
  });
  it("liquidación del mismo período dos veces → la 2ª se rechaza", async () => {
    const { p } = conSaldo();
    const f = () => cc.liquidarInteresCCAction(null, fd({ cuentaId: "usd", clienteId: "cli", fechaInicio: "2026-09-01", fechaFin: "2026-09-30", tasa: "0.5", interesAplicado: "0" }));
    expect(await f()).toMatchObject({ success: true });
    expect(err(await f())).toMatch(/liquidado hasta/);
    expect(p.movimientoCC.rows.filter((m) => m.tipo === "INTERES")).toHaveLength(1);
  });
  it("interés revertido → saldo vuelve y el motor no lo cuenta en el resultado", async () => {
    en("2026-10-06");
    const { p } = conSaldo();
    await cc.aplicarInteresCC(fd({ cuentaId: "usd" }));
    const interes = p.movimientoCC.rows.find((m) => m.tipo === "INTERES")!;
    expect(await cc.revertirMovimientoCC(null, fd({ id: interes.id as string }))).toEqual({ ok: true });
    expect(saldo(p, "usd")).toBe(1000);
    const rev = p.movimientoCC.rows.find((m) => String(m.descripcion).includes(`movref:${interes.id}`))!;
    const ds = dataset({
      movsCCInteres: [{ id: interes.id as string, fecha: "2026-10-06", tipo: "INTERES", monto: (interes.monto as Decimal).toNumber(), moneda: "USD", clienteId: "cli", descripcion: interes.descripcion as string }],
      movsCCReversas: [{ id: rev.id as string, fecha: "2026-10-06", descripcion: rev.descripcion as string }],
    });
    expect(calcularResultadoRealizado(ds, construirLedger(ds), "2026-10").porCategoria.INTERES_CC.nativo.USD).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// FIX FINAL INTERESES: vista previa = servidor, monto del servidor, sin solapamiento
// ════════════════════════════════════════════════════════════════════════════

/** Oráculo diario independiente: saldo vigente (sin INTERES) de cada día de [ini, fin). */
function oraculo(movs: { fecha: string; tipo: string; monto: number }[], ini: string, fin: string, tasa: number) {
  let total = 0;
  for (let d = U(ini); d < U(fin); d = new Date(d.getTime() + 86_400_000)) {
    const dia = d.toISOString().slice(0, 10);
    const s = movs.filter((m) => m.tipo !== "INTERES" && m.fecha <= dia).reduce((a, m) => a + (m.tipo === "EGRESO" ? -1 : 1) * m.monto, 0);
    if (s > 0) total += (s * tasa) / 365;
  }
  return total;
}
const U = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const asMov = (m: { id: string; fecha: string; tipo: string; monto: number; descripcion?: string }) =>
  ({ id: m.id, fecha: U(m.fecha), tipo: m.tipo, monto: D(m.monto), descripcion: m.descripcion ?? null });
const interesesDe = (p: ReturnType<typeof db>["p"]) => p.movimientoCC.rows.filter((m) => m.tipo === "INTERES");

describe("A · vista previa con saldo canónico", () => {
  it("1. saldo 0 al inicio, INGRESO 100.000 el día 5, vista el 20 → interés sobre 100.000 (no 200.000)", () => {
    const movs = [asMov({ id: "i", fecha: "2026-09-05", tipo: "INGRESO", monto: 100000 })];
    const p = previewInteresPendienteCC(movs, D("0.365"), new Date("2026-09-20T15:00:00Z"));
    expect([p.inicio.toISOString().slice(0, 10), p.fin.toISOString().slice(0, 10), p.dias]).toEqual(["2026-09-01", "2026-09-20", 19]);
    expect(p.interesTotal.toNumber()).toBeCloseTo(1500, 8); // 15 días × 100.000 × 0,001
    expect(p.interesTotal.toNumber()).toBeCloseTo(oraculo([{ fecha: "2026-09-05", tipo: "INGRESO", monto: 100000 }], "2026-09-01", "2026-09-20", 0.365), 8);
  });
  it("2. más de 50 movimientos (antes y dentro del período): coincide con el oráculo diario", () => {
    const raw = Array.from({ length: 80 }, (_, i) => ({
      id: `m${i}`, fecha: `2026-${i < 40 ? "08" : "09"}-${String((i % 28) + 1).padStart(2, "0")}`,
      tipo: i % 3 === 0 ? "EGRESO" : "INGRESO", monto: 1000 + i * 37,
    }));
    const p = previewInteresPendienteCC(raw.map(asMov), D("0.42"), new Date("2026-09-25T10:00:00Z"));
    expect(p.interesTotal.toNumber()).toBeCloseTo(oraculo(raw, "2026-09-01", "2026-09-25", 0.42), 6);
  });
  it("INTERES y su reversa no capitalizan (saldo inicial canónico)", () => {
    const movs = [
      asMov({ id: "d", fecha: "2026-08-01", tipo: "INGRESO", monto: 1000 }),
      asMov({ id: "int", fecha: "2026-08-20", tipo: "INTERES", monto: 50, descripcion: "INTERES CC | op:R1" }),
      asMov({ id: "rv", fecha: "2026-08-21", tipo: "EGRESO", monto: 50, descripcion: "REVERSO INTERES | op:R2 | ref:R1" }),
    ];
    expect(saldoInicialInteresCC(movs, U("2026-09-01")).toNumber()).toBe(1000);
  });
  it("3. vista previa = monto que el servidor aplica si la DB no cambia", async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-09-20T15:00:00Z"));
    try {
      const { p } = db({ cuentas: [{ id: "usd", clienteId: "cli", moneda: "USD", saldo: D(0) }] });
      await cc.crearMovimientoCC(null, fd({ cuentaId: "usd", clienteId: "cli", tipo: "INGRESO", monto: "100000" }));
      p.movimientoCC.rows[0].fecha = U("2026-09-05"); // depósito del día 5
      const prev = previewInteresPendienteCC(p.movimientoCC.rows as never, D("0.365"), new Date());
      expect(await cc.aplicarInteresCC(fd({ cuentaId: "usd" }))).toEqual({ success: true });
      expect((interesesDe(p)[0].monto as Decimal).toNumber()).toBe(prev.interesTotal.toDecimalPlaces(2).toNumber());
      expect((interesesDe(p)[0].monto as Decimal).toNumber()).toBe(1500);
    } finally { vi.useRealTimers(); }
  });
});

describe("B · el servidor recalcula; el cliente no decide el monto", () => {
  afterEach(() => { vi.useRealTimers(); });
  const conSaldo = () => db({ movs: [{ id: "ing", cuentaCorrienteId: "usd", tipo: "INGRESO", monto: D(100000), descripcion: "depósito", fecha: U("2026-08-01") }] });
  it.each(["1", "999999999", "NaN", "-5"])("4. montoAplicado %j enviado → ignorado: se aplica el cálculo del servidor", async (v) => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-09-11T15:00:00Z"));
    const { p } = conSaldo();
    expect(await cc.aplicarInteresCC(fd({ cuentaId: "usd", montoAplicado: v }))).toEqual({ success: true });
    expect((interesesDe(p)[0].monto as Decimal).toNumber()).toBe(1000); // 10 días × 100.000 × 0,001
  });
  it("4b. aplicarTodos con montos manipulados en el payload → ignorados", async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-09-11T15:00:00Z"));
    const { p } = conSaldo();
    await cc.aplicarTodosInteresesCC(fd({ payload: JSON.stringify([{ cuentaId: "usd", montoAplicado: "999999999" }]) }));
    expect((interesesDe(p)[0].monto as Decimal).toNumber()).toBe(1000);
  });
  it("5. el estado cambia entre la vista previa y aplicar → el servidor usa el estado nuevo", async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-09-20T15:00:00Z"));
    const { p } = conSaldo();
    const prev = previewInteresPendienteCC(p.movimientoCC.rows as never, D("0.365"), new Date());
    // PF creado con fecha del día 10 → EGRESO de 40.000 dentro del período
    await cc.crearPlazoFijoSimple(null, fd({ clienteId: "cli", moneda: "USD", capital: "40000", tasaAnual: "5", fechaInicio: "2026-09-10", fechaVencimiento: "2026-12-10" }));
    await cc.aplicarInteresCC(fd({ cuentaId: "usd" }));
    const aplicado = (interesesDe(p)[0].monto as Decimal).toNumber();
    expect(prev.interesTotal.toNumber()).toBeCloseTo(1900, 8); // 19 días × 100.000
    expect(aplicado).toBe(1500); // 9 días × 100.000 + 10 días × 60.000
  });
});

describe("C · sin solapamiento de períodos (guard bajo lock)", () => {
  const liq = (ini: string, fin: string) => cc.liquidarInteresCCAction(null, fd({ cuentaId: "usd", clienteId: "cli", fechaInicio: ini, fechaFin: fin, tasa: "0.365", interesAplicado: "0" }));
  const conSaldo = () => db({ movs: [{ id: "ing", cuentaCorrienteId: "usd", tipo: "INGRESO", monto: D(100000), descripcion: "depósito", fecha: U("2026-08-01") }] });
  it("6. 01–30 después de 15–30 → DENY", async () => {
    const { p } = conSaldo();
    expect(await liq("2026-09-15", "2026-09-30")).toMatchObject({ success: true });
    expect(err(await liq("2026-09-01", "2026-09-30"))).toMatch(/liquidado hasta el 2026-09-30/);
    expect(interesesDe(p)).toHaveLength(1);
  });
  it("7. 15–30 después de 01–30 → DENY; 10–20 después de 01–15 → DENY", async () => {
    const { p } = conSaldo();
    await liq("2026-09-01", "2026-09-30");
    expect(err(await liq("2026-09-15", "2026-09-30"))).toMatch(/liquidado hasta/);
    const { p: q } = conSaldo();
    await liq("2026-09-01", "2026-09-15");
    expect(err(await liq("2026-09-10", "2026-09-20"))).toMatch(/liquidado hasta/);
    expect([interesesDe(p).length, interesesDe(q).length]).toEqual([1, 1]);
  });
  it("8. períodos disjuntos consecutivos ([01,15) y [15,30), o desde el 16) → PASS", async () => {
    const { p } = conSaldo();
    expect(await liq("2026-09-01", "2026-09-15")).toMatchObject({ success: true });
    expect(await liq("2026-09-15", "2026-09-30")).toMatchObject({ success: true });
    expect(interesesDe(p).map((m) => (m.monto as Decimal).toNumber())).toEqual([1400, 1500]); // 14 + 15 días
    const { p: q } = conSaldo();
    await liq("2026-09-01", "2026-09-15");
    expect(await liq("2026-09-16", "2026-09-30")).toMatchObject({ success: true });
    expect(interesesDe(q)).toHaveLength(2);
  });
  it("9. interés revertido → el período vuelve a poder liquidarse", async () => {
    const { p } = conSaldo();
    await liq("2026-09-01", "2026-09-30");
    const int = interesesDe(p)[0];
    expect(await cc.revertirMovimientoCC(null, fd({ id: int.id as string }))).toEqual({ ok: true });
    expect(await liq("2026-09-01", "2026-09-30")).toMatchObject({ success: true });
    expect(saldo(p, "usd")).toBe(1000 + 2900); // apertura seed 1000 + un solo interés vigente (29 días)
  });
});

describe("D · aplicaciones en días distintos: solo días nuevos", () => {
  afterEach(() => { vi.useRealTimers(); });
  it("10–12. día 10 cubre 01–09; día 20 solo 10–19; Macro 2 suma una vez 19 días", async () => {
    const { p } = db({ movs: [{ id: "ing", cuentaCorrienteId: "usd", tipo: "INGRESO", monto: D(100000), descripcion: "depósito", fecha: U("2026-08-01") }] });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-10T15:00:00Z"));
    await cc.aplicarInteresCC(fd({ cuentaId: "usd" }));
    vi.setSystemTime(new Date("2026-09-20T15:00:00Z"));
    await cc.aplicarInteresCC(fd({ cuentaId: "usd" }));
    const ints = interesesDe(p);
    expect(ints.map((m) => [(m.fecha as Date).toISOString().slice(0, 10), (m.monto as Decimal).toNumber()])).toEqual([["2026-09-10", 900], ["2026-09-20", 1000]]);
    const ds = dataset({ movsCCInteres: ints.map((m) => ({ id: m.id as string, fecha: (m.fecha as Date).toISOString().slice(0, 10), tipo: "INTERES", monto: (m.monto as Decimal).toNumber(), moneda: "USD" as const, clienteId: "cli", descripcion: m.descripcion as string })) });
    expect(calcularResultadoRealizado(ds, construirLedger(ds), "2026-09").porCategoria.INTERES_CC.nativo.USD).toBe(-1900); // 19 días, una vez
  });
});

// 9. interés PF
describe("9 · interés PF: una sola aplicación, con fecha", () => {
  it("un movimiento INTERES de PF entra una vez, en su mes; saldoActual editado a mano no entra (y la edición está bloqueada: test 6)", () => {
    const ds = dataset({ pfMovs: [{ id: "pi", plazoFijoId: "pf", fecha: "2026-10-15", tipo: "INTERES", monto: 30, moneda: "USD" }] });
    const l = construirLedger(ds);
    expect(l.hechos.filter((h) => h.categoria === "INTERES_PF")).toHaveLength(1);
    expect(calcularResultadoRealizado(ds, l, "2026-10").porCategoria.INTERES_PF.nativo.USD).toBe(-30);
    expect(calcularResultadoRealizado(ds, l, "2026-11").porCategoria.INTERES_PF.nativo.USD).toBe(0);
  });
});

// 10–11. reversas
describe("10–11 · reversas: una sola; PF + CC atómico", () => {
  it("10: doble reversión de la misma operación → la 2ª se rechaza, un solo inverso", async () => {
    const { p } = db();
    await cc.ejecutarOperacion(fd({ clienteId: "cli", tipo: "RULO", monedaOrigen: "USD", monedaDestino: "ARS", monto: "100", tasa: "0" }));
    const ref = String(p.movimientoCC.rows[0].descripcion).match(/op:([a-zA-Z0-9-]+)/)![1];
    expect(await cc.revertirOperacion(fd({ operationRef: ref }))).toEqual({ success: true });
    expect(err(await cc.revertirOperacion(fd({ operationRef: ref })))).toMatch(/ya fue revertida/);
    expect(p.movimientoCC.rows).toHaveLength(4);
    expect([saldo(p, "usd"), saldo(p, "ars")]).toEqual([1000, 0]);
  });
  it("11: revertir el PF creado desde CC → CC restituida + PF CANCELADO en la misma operación", async () => {
    const { p } = db();
    await cc.crearPlazoFijoSimple(null, fd({ clienteId: "cli", moneda: "USD", capital: "400", tasaAnual: "5", fechaInicio: "2026-10-01", fechaVencimiento: "2026-11-01" }));
    const ref = String(p.plazoFijo.rows[0].notas).match(/op:([a-zA-Z0-9-]+)/)![1];
    expect(await cc.revertirOperacion(fd({ operationRef: ref }))).toEqual({ success: true });
    expect(saldo(p, "usd")).toBe(1000);
    expect(p.plazoFijo.rows[0]).toMatchObject({ estado: "CANCELADO" });
    expect((p.plazoFijo.rows[0].saldoActual as Decimal).toNumber()).toBe(0);
  });
  it("11b: si cancelar el PF falla, no se informa éxito (en Postgres la tx revierte la CC: QA PG)", async () => {
    const { p } = db();
    await cc.crearPlazoFijoSimple(null, fd({ clienteId: "cli", moneda: "USD", capital: "400", tasaAnual: "5", fechaInicio: "2026-10-01", fechaVencimiento: "2026-11-01" }));
    const ref = String(p.plazoFijo.rows[0].notas).match(/op:([a-zA-Z0-9-]+)/)![1];
    p.plazoFijo.update = (async () => { throw new Error("falla"); }) as never;
    expect(err(await cc.revertirOperacion(fd({ operationRef: ref })))).toBeTruthy();
  });
});

// 12. eliminación de cliente
describe("12 · cliente con historia → DELETE DENY", () => {
  it.each([
    ["movimientos CC", { movs: [{ id: "m", cuentaCorrienteId: "usd", tipo: "INGRESO", monto: D(1), descripcion: "x", fecha: new Date() }] }],
    ["PF", { pfs: [{ id: "pf", clienteId: "cli" }] }],
    ["CC con saldo sin movimientos (legacy)", { cuentas: [{ id: "usd", clienteId: "cli", moneda: "USD", saldo: D(5) }] }],
    ["operación de cambio", { opsCambio: [{ id: "op", clienteId: "cli" }] }],
  ])("%s → DENY, nada borrado", async (_n, seed) => {
    const { p } = db({ ...(seed as object), ...("cuentas" in seed ? {} : { cuentas: [{ id: "usd", clienteId: "cli", moneda: "USD", saldo: D(0) }] }) });
    expect(err(await cc.eliminarClienteConDatos(null, fd({ id: "cli" })))).toMatch(/historia financiera/);
    expect(p.cliente.rows).toHaveLength(1);
    expect(p.cuentaCorriente.rows).toHaveLength(1);
  });
  it("cliente realmente vacío (CC en 0 sin movimientos) → se elimina", async () => {
    const { p } = db({ cuentas: [{ id: "usd", clienteId: "cli", moneda: "USD", saldo: D(0) }] });
    expect(await cc.eliminarClienteConDatos(null, fd({ id: "cli" }))).toEqual({ ok: true });
    expect(p.cliente.rows).toHaveLength(0);
  });
});

// Integración Macro 2: PF desde CC no duplica pasivo
describe("Integración Macro 2 · PN con PF creado desde CC", () => {
  it("CC 1000 → PF 400: obligación total sigue en 1000 (CC 600 + PF 400), no 1400", () => {
    const pn = (cuenta: number, pfs: { capital: number; saldoActual: number }[]) => calcularPatrimonioNeto(dataset({
      clientes: [{ id: "cli", nombre: "C", activo: true, cc: [{ id: "usd", moneda: "USD", saldo: cuenta }], pf: pfs.map((x, i) => ({ id: `pf${i}`, moneda: "USD", estado: "ACTIVO", ...x })) }],
    }), "2026-10-30").componentes;
    const antes = pn(1000, []);
    const despues = pn(600, [{ capital: 400, saldoActual: 400 }]);
    expect(antes.ccAcreedora.nativo.USD + antes.pf.nativo.USD).toBe(1000);
    expect(despues.ccAcreedora.nativo.USD + despues.pf.nativo.USD).toBe(1000);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// FIX PASS F / G / H
// ════════════════════════════════════════════════════════════════════════════

const saldoCajaDe = (p: ReturnType<typeof db>["p"], cajaId: string, moneda: string) =>
  p.movimientoCaja.rows.filter((m) => m.cajaId === cajaId && m.moneda === moneda && m.confirmado)
    .reduce((s, m) => s + (m.monto as Decimal).toNumber() * (m.tipo === "ENTRADA" ? 1 : -1), 0);

describe("H · movimiento CC con impacto en caja = un solo hecho", () => {
  const crear = (tipo: "INGRESO" | "EGRESO") =>
    cc.crearMovimientoCC(null, fd({ cuentaId: "usd", clienteId: "cli", tipo, monto: "100", descripcion: "depósito", impactaCaja: "on", cajaImpactoId: "caja-of" }));
  const cero = () => db({ cuentas: [{ id: "usd", clienteId: "cli", moneda: "USD", saldo: D(0) }] });
  const refDe = (p: ReturnType<typeof db>["p"]) => String(p.movimientoCC.rows[0].descripcion).match(/op:([a-zA-Z0-9-]+)/)![1];

  it("H1: CC y caja comparten el mismo op:<ref> (marcas internas preservadas)", async () => {
    const { p } = cero();
    expect(await crear("INGRESO")).toMatchObject({ success: true });
    const ref = refDe(p);
    expect(p.movimientoCC.rows[0].descripcion).toBe(`[MOV_CC] depósito | op:${ref}`);
    expect(p.movimientoCaja.rows[0].descripcion).toBe(`[MOV_CC] depósito | cc:usd | op:${ref}`);
    expect([saldo(p, "usd"), saldoCajaDe(p, "caja-of", "USD")]).toEqual([100, 100]);
  });

  it.each([["INGRESO", 100], ["EGRESO", -100]] as const)("H2 (%s): revertir la operación deja CC = 0 y caja = 0; una reversa de cada lado", async (tipo, efecto) => {
    const { p } = cero();
    await crear(tipo);
    expect([saldo(p, "usd"), saldoCajaDe(p, "caja-of", "USD")]).toEqual([efecto, efecto]);
    expect(await cc.revertirOperacion(fd({ operationRef: refDe(p) }))).toEqual({ success: true });
    expect([saldo(p, "usd"), saldoCajaDe(p, "caja-of", "USD")]).toEqual([0, 0]);
    expect(p.movimientoCC.rows).toHaveLength(2);
    expect(p.movimientoCaja.rows).toHaveLength(2);
    const rev = p.movimientoCaja.rows[1];
    expect(String(rev.descripcion).startsWith(`REVERSO | ref:${p.movimientoCaja.rows[0].id} |`)).toBe(true);
    expect([rev.cajaId, rev.moneda, (rev.monto as Decimal).toNumber(), rev.confirmado]).toEqual(["caja-of", "USD", 100, true]);
  });

  it("H3: doble reversión → DENY, sin segundo efecto", async () => {
    const { p } = cero();
    await crear("INGRESO");
    const ref = refDe(p);
    await cc.revertirOperacion(fd({ operationRef: ref }));
    expect(err(await cc.revertirOperacion(fd({ operationRef: ref })))).toMatch(/ya fue revertida/);
    expect([p.movimientoCC.rows.length, p.movimientoCaja.rows.length]).toEqual([2, 2]);
    expect([saldo(p, "usd"), saldoCajaDe(p, "caja-of", "USD")]).toEqual([0, 0]);
  });

  it("H4: si falla la reversa de caja, no se informa éxito (rollback real: QA Postgres H)", async () => {
    const { p } = cero();
    await crear("INGRESO");
    const create = p.movimientoCaja.create;
    p.movimientoCaja.create = (async () => { throw new Error("falla"); }) as typeof create;
    expect(err(await cc.revertirOperacion(fd({ operationRef: refDe(p) })))).toBeTruthy();
  });

  it("H5: desde Caja la pata [MOV_CC] no se revierte sola (también legacy sin op:)", async () => {
    const { p } = cero();
    await crear("INGRESO");
    const legacy = { id: "leg", cajaId: "caja-of", tipo: "ENTRADA", moneda: "USD", monto: D(5), confirmado: true, anulado: false, pagoDeId: null, transferenciaRef: null, operacionCambioId: null, descripcion: "[MOV_CC] viejo | cc:usd", fecha: new Date() };
    p.movimientoCaja.rows.push(legacy);
    for (const id of [p.movimientoCaja.rows[0].id as string, "leg"]) {
      await expect(revertirMovimientoTx(p as never, { movimientoId: id, cajasAutorizadas: ["caja-of"] })).rejects.toThrow(/revertir desde Operaciones/);
    }
    expect(p.movimientoCaja.rows).toHaveLength(2);
  });

  it("H6: pata de caja inconsistente (monto distinto) → DENY, nada escrito", async () => {
    const { p } = cero();
    await crear("INGRESO");
    p.movimientoCaja.rows[0].monto = D(90);
    expect(err(await cc.revertirOperacion(fd({ operationRef: refDe(p) })))).toMatch(/inconsistente/);
    expect([p.movimientoCC.rows.length, p.movimientoCaja.rows.length]).toEqual([1, 1]);
  });
});

describe("G · CC de una operación de cambio solo se revierte desde Cambio", () => {
  const seed = () => db({
    cuentas: [{ id: "cc-usd", clienteId: "cli", moneda: "USD", saldo: D(-100) }, { id: "cc-ars", clienteId: "cli", moneda: "ARS", saldo: D(100000) }],
    opsCambio: [{ id: "op1", tipo: "COMPRA_USD", moneda: "USD", cantidad: D(100), tipoCambio: D(1000), totalARS: D(100000), descripcion: "[CC] compra", pendiente: false }],
    movs: [
      { id: "l1", cuentaCorrienteId: "cc-usd", tipo: "EGRESO", monto: D(100), descripcion: "Compra USD 100,00 a TC 1.000,00 — Op Cambio | op:op1", operacionCambioId: "op1", fecha: new Date() },
      { id: "l2", cuentaCorrienteId: "cc-ars", tipo: "INGRESO", monto: D(100000), descripcion: "Contrapartida ARS por Compra USD | op:op1", operacionCambioId: "op1", fecha: new Date() },
    ],
  });
  const cajaLegs = (p: ReturnType<typeof db>["p"]) => p.movimientoCaja.rows.push(
    { id: "c1", cajaId: "of", tipo: "ENTRADA", moneda: "USD", monto: D(100), confirmado: true, anulado: false, pagoDeId: null, transferenciaRef: null, operacionCambioId: "op1", descripcion: "[Cambio op1] Compra divisa", fecha: new Date() },
    { id: "c2", cajaId: "of", tipo: "SALIDA", moneda: "ARS", monto: D(100000), confirmado: true, anulado: false, pagoDeId: null, transferenciaRef: null, operacionCambioId: "op1", descripcion: "[Cambio op1] Pago ARS", fecha: new Date() },
  );

  it("G1: reversa desde Operaciones CC → DENY; CC, caja y OperacionCambio sin cambio", async () => {
    const { p } = seed();
    cajaLegs(p);
    expect(err(await cc.revertirOperacion(fd({ operationRef: "op1" })))).toBe("Esta cuenta corriente pertenece a una operación de cambio. Revertir desde la operación de cambio.");
    expect(err(await cc.revertirMovimientoCC(null, fd({ id: "l1" })))).toMatch(/operación de cambio/);
    expect([p.movimientoCC.rows.length, p.movimientoCaja.rows.length, saldo(p, "cc-usd"), saldo(p, "cc-ars")]).toEqual([2, 2, -100, 100000]);
    expect(p.operacionCambio.rows[0].descripcion).toBe("[CC] compra");
  });

  it("G2: reversa desde Cambio → CC y caja neutralizadas UNA vez; la 2ª DENY", async () => {
    const { p } = seed();
    cajaLegs(p);
    await revertirCambioTx(p as never, { opId: "op1", revertidoPor: "t", fecha: new Date(), cajasAutorizadas: ["of"] });
    expect([saldo(p, "cc-usd"), saldo(p, "cc-ars")]).toEqual([0, 0]);
    expect([saldoCajaDe(p, "of", "USD"), saldoCajaDe(p, "of", "ARS")]).toEqual([0, 0]);
    await expect(revertirCambioTx(p as never, { opId: "op1", revertidoPor: "t", fecha: new Date(), cajasAutorizadas: ["of"] })).rejects.toThrow(/ya fue revertida/);
    expect(err(await cc.revertirOperacion(fd({ operationRef: "op1" })))).toBeTruthy(); // tampoco por CC
    expect([saldo(p, "cc-usd"), saldo(p, "cc-ars")]).toEqual([0, 0]);
  });
});

describe("F · liquidación de interés: cálculo completo bajo lock", () => {
  it("F1: el lock de la cuenta ocurre ANTES de toda lectura económica (cuenta y movimientos)", async () => {
    const { p, locks } = db({ movs: [{ id: "ing", cuentaCorrienteId: "usd", tipo: "INGRESO", monto: D(100000), descripcion: "depósito", fecha: new Date("2026-08-01"), createdAt: new Date("2026-08-01") }] });
    for (const t of [p.movimientoCC, p.cuentaCorriente] as const) {
      const fm = t.findMany, fu = t.findUnique;
      t.findMany = (async (a?: never) => { locks.push("READ"); return fm(a); }) as typeof fm;
      t.findUnique = (async (a: never) => { locks.push("READ"); return fu(a); }) as typeof fu;
    }
    expect(await cc.liquidarInteresCCAction(null, fd({ cuentaId: "usd", clienteId: "cli", fechaInicio: "2026-09-01", fechaFin: "2026-09-30", tasa: "0.5", interesAplicado: "0" }))).toMatchObject({ success: true });
    const lock = locks.findIndex((l) => l.includes('"CuentaCorriente"') && l.includes("FOR UPDATE"));
    expect(lock).toBeGreaterThanOrEqual(0);
    expect(locks.indexOf("READ")).toBeGreaterThan(lock);
  });
  it("F1b: el monto se valida contra el cálculo bajo lock (pedir más que lo calculado → DENY)", async () => {
    const { p } = db({ movs: [{ id: "ing", cuentaCorrienteId: "usd", tipo: "INGRESO", monto: D(1000), descripcion: "depósito", fecha: new Date("2026-08-01"), createdAt: new Date("2026-08-01") }] });
    expect(err(await cc.liquidarInteresCCAction(null, fd({ cuentaId: "usd", clienteId: "cli", fechaInicio: "2026-09-01", fechaFin: "2026-09-30", tasa: "0.5", interesAplicado: "999999" })))).toMatch(/no puede superar/);
    expect(p.movimientoCC.rows.filter((m) => m.tipo === "INTERES")).toHaveLength(0);
  });
});

describe("Integración Macro 3 · la reversa de caja creada desde CC es una reversa estructural válida", () => {
  it("idsRevertidos y reversasValidasCaja (motor) la reconocen", async () => {
    const { p } = db({ cuentas: [{ id: "usd", clienteId: "cli", moneda: "USD", saldo: D(0) }] });
    await cc.crearMovimientoCC(null, fd({ cuentaId: "usd", clienteId: "cli", tipo: "INGRESO", monto: "100", descripcion: "x", impactaCaja: "on", cajaImpactoId: "caja-of" }));
    const ref = String(p.movimientoCC.rows[0].descripcion).match(/op:([a-zA-Z0-9-]+)/)![1];
    await cc.revertirOperacion(fd({ operationRef: ref }));
    const legId = p.movimientoCaja.rows[0].id as string;
    expect((await idsRevertidos(p as never, [legId])).has(legId)).toBe(true);
    const ds = p.movimientoCaja.rows.map((m) => ({
      id: m.id as string, cajaId: m.cajaId as string, fecha: "2026-10-01", createdAt: "2026-10-01", tipo: m.tipo as "ENTRADA", moneda: "USD" as const,
      monto: (m.monto as Decimal).toNumber(), descripcion: m.descripcion as string, confirmado: true, anulado: false, pagoDeId: null, operacionCambioId: null,
    }));
    expect(reversasValidasCaja(ds).get(legId)?.id).toBe(p.movimientoCaja.rows[1].id);
  });
});
