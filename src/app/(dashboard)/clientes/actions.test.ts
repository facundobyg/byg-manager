import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { fakeTx, tabla } from "../../../lib/caja/fake-tx";

// OPS-01 / OPS-02 / A2.1 — reversas de operaciones CC (RULO/DIVISA/LP/INTERES) y de
// movimientos manuales. MACRO 4: sobre una base EN MEMORIA con estado (no mocks de
// forma de llamada): cada caso verifica filas y saldos resultantes. La atomicidad y
// la contención reales se prueban contra Postgres (scripts/qa-m4-cc-pf-pg.ts).

const st = vi.hoisted(() => ({ prisma: null as unknown, eventos: [] as string[] }));

vi.mock("@/lib/auth/permissions", () => ({ requireActionPermission: vi.fn(async () => null), requireCajaPermission: vi.fn(async () => null) }));
vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "user-1", name: "Tester" } })) }));
vi.mock("@/lib/services/audit.service", () => ({ writeAuditLog: vi.fn() }));
vi.mock("@/lib/config", () => ({ readOnlyPreview: false }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ get prisma() { return st.prisma; } }));
// Se mockea solo porque cargarlo tal cual dispara un problema de resolución de
// rutas de Vite en este entorno de test; actions.ts ya no lo usa para reversas.
vi.mock("@/lib/data/movimiento-cc", () => ({
  esMovimientoDeOperacionAgrupada: (d: string | null | undefined) => /op:[a-zA-Z0-9-]+/.test(d ?? ""),
  extraerOperationRef: (t: string | null | undefined) => t?.match(/op:([a-zA-Z0-9-]+)/)?.[1] ?? null,
}));
vi.mock("@/lib/caja/integridad", async () => await import("../../../lib/caja/integridad"));
vi.mock("@/lib/parse-monto", async () => await import("../../../lib/parse-monto"));
vi.mock("@/lib/cc/integridad", async () => await import("../../../lib/cc/integridad"));
vi.mock("@/lib/cc/integridad.service", async () => await import("../../../lib/cc/integridad.service"));

import { revertirOperacion, revertirMovimientoCC, ejecutarOperacion } from "./actions";

type Row = Record<string, unknown>;
const D = (v: Decimal.Value) => new Decimal(v);

/** Base en memoria: cuentas, movimientos CC, PF y movimientos de PF. Registra locks y re-chequeos. */
function base(seed: { cuentas?: Row[]; movs?: Row[]; pfs?: Row[]; pfMovs?: Row[] } = {}) {
  const { db } = fakeTx({ ccMovs: seed.movs ?? [], cuentas: seed.cuentas ?? [{ id: "cc-1", clienteId: "cli-1", moneda: "USD", saldo: D(1000) }] });
  st.eventos = [];
  const movimientoCC = db.movimientoCC;
  const findManyOrig = movimientoCC.findMany;
  movimientoCC.findMany = (async (args: { where?: Row } = {}) => {
    if (JSON.stringify(args.where ?? {}).match(/"contains":"(movref:|ref:)/)) st.eventos.push("recheck");
    return findManyOrig(args);
  }) as typeof findManyOrig;
  const p = {
    ...db,
    plazoFijo: tabla(seed.pfs ?? []),
    plazoFijoMovimiento: tabla(seed.pfMovs ?? []),
    $queryRaw: async (strings: TemplateStringsArray) => { st.eventos.push("lock:" + strings.join("?")); return []; },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(p)),
  };
  st.prisma = p;
  return p;
}
const saldo = (p: ReturnType<typeof base>, id: string) => (p.cuentaCorriente.rows.find((c) => c.id === id)!.saldo as Decimal).toNumber();
const nuevos = (p: ReturnType<typeof base>, antes: number) => p.movimientoCC.rows.slice(antes);
const err = (r: unknown) => (r as { error?: string }).error;
const fdOp = (ref: string) => { const f = new FormData(); f.set("operationRef", ref); return f; };
const fdId = (id: string) => { const f = new FormData(); f.set("id", id); return f; };
const mov = (o: Row) => ({ id: "m1", cuentaCorrienteId: "cc-1", tipo: "EGRESO", monto: D(100), descripcion: "RULO ARS->USD | op:REF1", operacionCambioId: null, fecha: new Date("2026-10-01"), ...o });
const pf = (o: Row = {}) => ({
  id: "pf-1", clienteId: "cli-1", capital: D(1000), saldoActual: D(1000), tasaAnual: D(5), moneda: "USD", estado: "ACTIVO",
  notas: "LP automático | op:REF-LP-1", fechaInicio: new Date("2026-01-01"), fechaVencimiento: new Date("2026-02-01"), ...o,
});
function fdLP(o: Partial<Record<"monto" | "tasa" | "plazoDias", string>> = {}) {
  const f = new FormData();
  f.set("clienteId", "cli-1"); f.set("tipo", "LP"); f.set("monedaOrigen", "USD");
  f.set("monto", o.monto ?? "1000"); f.set("tasa", o.tasa ?? "5"); f.set("plazoDias", o.plazoDias ?? "30");
  return f;
}
const DOS_CUENTAS = () => [{ id: "cc-ars", clienteId: "cli-1", moneda: "ARS", saldo: D(500) }, { id: "cc-usd", clienteId: "cli-1", moneda: "USD", saldo: D(300) }];

beforeEach(() => { vi.clearAllMocks(); });

// ════════════════════════════════════════════════════════════════════════════
// A. revertirOperacion
// ════════════════════════════════════════════════════════════════════════════

describe("revertirOperacion — Camino A (OPS-01)", () => {
  it("A1: reversión simple exitosa", async () => {
    const p = base({ movs: [mov({ descripcion: "AJUSTE egreso | op:REF1" })] });
    expect(await revertirOperacion(fdOp("REF1"))).toEqual({ success: true });
    expect(nuevos(p, 1)).toHaveLength(1);
    expect(saldo(p, "cc-1")).toBe(1100);
  });

  it("A2: RULO/DIVISA con múltiples movimientos se revierte completo", async () => {
    const p = base({ cuentas: DOS_CUENTAS(), movs: [
      mov({ id: "m-origen", cuentaCorrienteId: "cc-ars", tipo: "EGRESO", monto: D(100) }),
      mov({ id: "m-destino", cuentaCorrienteId: "cc-usd", tipo: "INGRESO", monto: D(150) }),
    ] });
    expect(await revertirOperacion(fdOp("REF1"))).toEqual({ success: true });
    expect(nuevos(p, 2)).toHaveLength(2);
  });

  it("A3: original + reversión suma 0 por cuenta y moneda (inverso exacto de cada pata)", async () => {
    const p = base({ cuentas: DOS_CUENTAS(), movs: [
      mov({ id: "m-origen", cuentaCorrienteId: "cc-ars", tipo: "EGRESO", monto: D(100) }),
      mov({ id: "m-destino", cuentaCorrienteId: "cc-usd", tipo: "INGRESO", monto: D(150) }),
    ] });
    await revertirOperacion(fdOp("REF1"));
    const [invOrigen, invDestino] = ["cc-ars", "cc-usd"].map((c) => nuevos(p, 2).find((m) => m.cuentaCorrienteId === c)!);
    expect([invOrigen.tipo, (invOrigen.monto as Decimal).toNumber()]).toEqual(["INGRESO", 100]);
    expect([invDestino.tipo, (invDestino.monto as Decimal).toNumber()]).toEqual(["EGRESO", 150]);
    expect([saldo(p, "cc-ars"), saldo(p, "cc-usd")]).toEqual([600, 150]);
  });

  it("A4/A5/A6: segunda reversión rechazada — 0 movimientos nuevos, 0 cambios de saldo", async () => {
    const p = base({ movs: [mov({ descripcion: "LP egreso | op:REF1" }), mov({ id: "rev1", tipo: "INGRESO", descripcion: "REVERSO EGRESO | op:REF2 | ref:REF1" })] });
    expect(await revertirOperacion(fdOp("REF1"))).toEqual({ error: "Esta operación ya fue revertida" });
    expect(nuevos(p, 2)).toHaveLength(0);
    expect(saldo(p, "cc-1")).toBe(1000);
  });

  it("A7: un reversalRef no puede revertirse como si fuera un operationRef original", async () => {
    const p = base({ movs: [mov({ id: "rev1", tipo: "INGRESO", descripcion: "REVERSO EGRESO | op:REF2 | ref:REF1" })] });
    expect(await revertirOperacion(fdOp("REF2"))).toEqual({ error: "No se puede revertir una reversión" });
    expect(nuevos(p, 1)).toHaveLength(0);
  });

  it("A8: operationRef inexistente es rechazado sin escribir nada", async () => {
    const p = base({ movs: [mov({})] });
    expect(await revertirOperacion(fdOp("no-existe"))).toEqual({ error: "No se encontraron movimientos para esta operación" });
    expect(st.eventos.filter((e) => e.startsWith("lock"))).toHaveLength(0);
    expect(nuevos(p, 1)).toHaveLength(0);
  });

  it("A8b (MACRO 4): un prefijo del operationRef NO arrastra otras operaciones (match exacto)", async () => {
    const p = base({ movs: [mov({ descripcion: "RULO ARS->USD | op:REF1abc" })] });
    expect(await revertirOperacion(fdOp("REF1"))).toEqual({ error: "No se encontraron movimientos para esta operación" });
    expect(nuevos(p, 1)).toHaveLength(0);
  });

  it("A9: operationRef vacío/inválido rechazado antes de tocar la base", async () => {
    const p = base();
    expect(await revertirOperacion(fdOp("   "))).toEqual({ error: "operationRef requerido" });
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it("A10: un fallo durante la escritura no continúa con las siguientes patas ni reporta éxito", async () => {
    const p = base({ cuentas: DOS_CUENTAS(), movs: [
      mov({ id: "m-origen", cuentaCorrienteId: "cc-ars", tipo: "EGRESO", monto: D(100) }),
      mov({ id: "m-destino", cuentaCorrienteId: "cc-usd", tipo: "INGRESO", monto: D(150) }),
    ] });
    const create = p.movimientoCC.create;
    let n = 0;
    p.movimientoCC.create = (async (a: { data: Row }) => { if (++n === 2) throw new Error("DB write failed"); return create(a); }) as typeof create;
    // El error interno no se filtra al usuario; en Postgres la tx revierte lo escrito (QA PG).
    expect(await revertirOperacion(fdOp("REF1"))).toEqual({ error: "Error al revertir operación" });
    expect(saldo(p, "cc-usd")).toBe(300); // la 2da pata nunca se aplicó
  });
});

// ════════════════════════════════════════════════════════════════════════════
// A''. ejecutarOperacion — creación LP (OPS-02, regresión)
// ════════════════════════════════════════════════════════════════════════════

describe("ejecutarOperacion — creación LP (OPS-02)", () => {
  it("1/2: crea un MovimientoCC EGRESO y reduce el saldo de la cuenta USD", async () => {
    const p = base({ cuentas: [{ id: "cc-usd", clienteId: "cli-1", moneda: "USD", saldo: D(5000) }] });
    const r = await ejecutarOperacion(fdLP({ monto: "1000" }));
    expect("success" in r && r.success).toBe(true);
    expect(p.movimientoCC.rows).toHaveLength(1);
    expect([p.movimientoCC.rows[0].tipo, p.movimientoCC.rows[0].cuentaCorrienteId]).toEqual(["EGRESO", "cc-usd"]);
    expect(saldo(p, "cc-usd")).toBe(4000);
  });

  it("3/4/5: crea exactamente 1 PlazoFijo, ACTIVO, con capital === saldoActual === monto", async () => {
    const p = base();
    await ejecutarOperacion(fdLP({ monto: "2500" }));
    expect(p.plazoFijo.rows).toHaveLength(1);
    const pfRow = p.plazoFijo.rows[0];
    expect(pfRow.estado).toBe("ACTIVO");
    expect([(pfRow.capital as Decimal).toNumber(), (pfRow.saldoActual as Decimal).toNumber()]).toEqual([2500, 2500]);
  });

  it("6: el MovimientoCC y el PlazoFijo comparten exactamente el mismo operationRef", async () => {
    const p = base();
    await ejecutarOperacion(fdLP());
    const movRef = String(p.movimientoCC.rows[0].descripcion).match(/op:([a-zA-Z0-9-]+)/)?.[1];
    expect(movRef).toBeTruthy();
    expect(String(p.plazoFijo.rows[0].notas).match(/op:([a-zA-Z0-9-]+)/)?.[1]).toBe(movRef);
  });

  it("7: un fallo en PlazoFijo.create se reporta como error (rollback lógico de toda la operación)", async () => {
    const p = base();
    p.plazoFijo.create = (async () => { throw new Error("DB write failed"); }) as never;
    expect(await ejecutarOperacion(fdLP())).toEqual({ error: "Error al ejecutar operación" });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// B'. revertirOperacion — LP (OPS-02)
// ════════════════════════════════════════════════════════════════════════════

describe("revertirOperacion — LP (OPS-02)", () => {
  const lp = (monto = 1000) => base({
    cuentas: [{ id: "cc-usd", clienteId: "cli-1", moneda: "USD", saldo: D(0) }],
    movs: [mov({ id: "lp-mov-1", cuentaCorrienteId: "cc-usd", tipo: "EGRESO", monto: D(monto), descripcion: "LP egreso | op:REF-LP-1" })],
    pfs: [pf({ capital: D(monto), saldoActual: D(monto) })],
  });

  it("8/9/10: LP ACTIVO se revierte — exactamente 1 inverso INGRESO por el capital exacto", async () => {
    const p = lp(1000);
    expect(await revertirOperacion(fdOp("REF-LP-1"))).toEqual({ success: true });
    const n = nuevos(p, 1);
    expect(n).toHaveLength(1);
    expect([n[0].tipo, (n[0].monto as Decimal).toNumber()]).toEqual(["INGRESO", 1000]);
    expect(n[0].descripcion).toMatch(/^REVERSO EGRESO \| op:[a-zA-Z0-9-]+ \| ref:REF-LP-1$/);
  });

  it("11/12: el PF queda CANCELADO con saldoActual en 0", async () => {
    const p = lp();
    await revertirOperacion(fdOp("REF-LP-1"));
    expect(p.plazoFijo.rows[0].estado).toBe("CANCELADO");
    expect((p.plazoFijo.rows[0].saldoActual as Decimal).toNumber()).toBe(0);
  });

  it("13/14: capital, tasa y fechas históricas del PF no se tocan", async () => {
    const p = lp();
    await revertirOperacion(fdOp("REF-LP-1"));
    const r = p.plazoFijo.rows[0];
    expect((r.capital as Decimal).toNumber()).toBe(1000);
    expect((r.tasaAnual as Decimal).toNumber()).toBe(5);
    expect([r.moneda, r.clienteId, r.notas]).toEqual(["USD", "cli-1", "LP automático | op:REF-LP-1"]);
    expect((r.fechaInicio as Date).toISOString().slice(0, 10)).toBe("2026-01-01");
  });

  it("15: original + reversión netean cero en la cuenta corriente", async () => {
    const p = lp(750);
    await revertirOperacion(fdOp("REF-LP-1"));
    expect(saldo(p, "cc-usd")).toBe(750); // saldo 0 inicial + 750 restituido
  });

  it("16: la cancelación del PF ocurre en la misma transacción que el movimiento inverso y el saldo", async () => {
    const p = lp();
    await revertirOperacion(fdOp("REF-LP-1"));
    expect(p.$transaction).toHaveBeenCalledTimes(1);
    expect(nuevos(p, 1)).toHaveLength(1);
    expect(p.plazoFijo.rows[0].estado).toBe("CANCELADO");
  });

  it("16b (MACRO 4): PF con intereses/movimientos propios → no se revierte como operación, 0 escrituras", async () => {
    const p = base({
      cuentas: [{ id: "cc-usd", clienteId: "cli-1", moneda: "USD", saldo: D(0) }],
      movs: [mov({ id: "lp-mov-1", cuentaCorrienteId: "cc-usd", descripcion: "LP egreso | op:REF-LP-1", monto: D(1000) })],
      pfs: [pf({ saldoActual: D(1010) })],
      pfMovs: [{ id: "pm1", plazoFijoId: "pf-1", tipo: "INTERES", monto: D(10) }],
    });
    expect(err(await revertirOperacion(fdOp("REF-LP-1")))).toMatch(/intereses o movimientos propios/);
    expect(nuevos(p, 1)).toHaveLength(0);
    expect(p.plazoFijo.rows[0].estado).toBe("ACTIVO");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// C'. revertirOperacion — validaciones LP (OPS-02)
// ════════════════════════════════════════════════════════════════════════════

describe("revertirOperacion — validaciones LP (OPS-02)", () => {
  const sinEscrituras = (p: ReturnType<typeof base>, estadoPf?: string) => {
    expect(nuevos(p, 1)).toHaveLength(0);
    expect(saldo(p, "cc-1")).toBe(1000);
    if (estadoPf) expect(p.plazoFijo.rows[0].estado).toBe(estadoPf);
  };

  it("17: LP sin PF asociado → error, 0 escrituras", async () => {
    const p = base({ movs: [mov({ descripcion: "LP egreso | op:REF-LP-X" })] });
    expect(err(await revertirOperacion(fdOp("REF-LP-X")))).toMatch(/no se encontró el plazo fijo/i);
    sinEscrituras(p);
  });

  it("18: LP con 2 PF asociados al mismo ref exacto → error, 0 escrituras", async () => {
    const p = base({ movs: [mov({ descripcion: "LP egreso | op:REF-LP-DUP" })], pfs: [
      pf({ id: "pf-a", notas: "LP automático | op:REF-LP-DUP" }), pf({ id: "pf-b", notas: "LP automático | op:REF-LP-DUP" }),
    ] });
    expect(err(await revertirOperacion(fdOp("REF-LP-DUP")))).toMatch(/múltiples plazos fijos/i);
    sinEscrituras(p, "ACTIVO");
  });

  it("19: un substring parecido (op:abc vs op:abcdef) NO cuenta como match del PF", async () => {
    const p = base({ movs: [mov({ descripcion: "LP egreso | op:abc" })], pfs: [pf({ id: "pf-parecido", notas: "LP automático | op:abcdef" })] });
    expect(err(await revertirOperacion(fdOp("abc")))).toMatch(/no se encontró el plazo fijo/i);
    sinEscrituras(p, "ACTIVO");
  });

  it("post-lock: si el operationRef de la fila ya no coincide después de adquirir el lock, se rechaza sin escribir nada", async () => {
    const p = base({ movs: [mov({ descripcion: "LP egreso | op:REF-LP-RACE" })], pfs: [pf({ id: "pf-race", notas: "LP automático | op:REF-LP-RACE" })] });
    // La relectura posterior al FOR UPDATE trae notas de otra operación (cambió entre el filtro y el lock).
    p.plazoFijo.findUniqueOrThrow = (async () => pf({ id: "pf-race", notas: "LP automático | op:REF-LP-OTRO" })) as never;
    expect(err(await revertirOperacion(fdOp("REF-LP-RACE")))).toMatch(/ya no corresponde a esta operación/i);
    sinEscrituras(p, "ACTIVO");
  });

  it.each(["CANCELADO", "VENCIDO", "RENOVADO"])("20–22: PF %s → reversión rechazada, 0 escrituras", async (estado) => {
    const p = base({ movs: [mov({ descripcion: "LP egreso | op:REF-LP-E" })], pfs: [pf({ notas: "LP automático | op:REF-LP-E", estado })] });
    expect(err(await revertirOperacion(fdOp("REF-LP-E")))).toMatch(new RegExp(estado));
    sinEscrituras(p, estado);
  });

  it("23: un fallo al actualizar el PF se reporta como error (en Postgres la tx revierte movimiento y saldo)", async () => {
    const p = base({ movs: [mov({ descripcion: "LP egreso | op:REF-LP-FAIL" })], pfs: [pf({ notas: "LP automático | op:REF-LP-FAIL" })] });
    p.plazoFijo.update = (async () => { throw new Error("DB write failed"); }) as never;
    expect(await revertirOperacion(fdOp("REF-LP-FAIL"))).toEqual({ error: "Error al revertir operación" });
    expect(nuevos(p, 1)).toHaveLength(1); // escrito ANTES del fallo, dentro de la misma tx
  });

  it("24: segunda reversión de un LP sigue rechazada por el guard de OPS-01, sin llegar a resolver el PF", async () => {
    const p = base({ movs: [
      mov({ descripcion: "LP egreso | op:REF-LP-2ND" }),
      mov({ id: "rev1", tipo: "INGRESO", descripcion: "REVERSO EGRESO | op:REF-LP-2ND-R | ref:REF-LP-2ND" }),
    ], pfs: [pf({ notas: "LP automático | op:REF-LP-2ND" })] });
    const findMany = vi.spyOn(p.plazoFijo, "findMany");
    expect(await revertirOperacion(fdOp("REF-LP-2ND"))).toEqual({ error: "Esta operación ya fue revertida" });
    expect(findMany).not.toHaveBeenCalled();
    expect(p.plazoFijo.rows[0].estado).toBe("ACTIVO");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// A'. INTERES — operación lógica de una sola pata (ajuste final A2.1)
// ════════════════════════════════════════════════════════════════════════════

describe("revertirOperacion — INTERES (ajuste final A2.1)", () => {
  const interes = (extra: Row[] = []) => base({
    cuentas: [{ id: "cc-1", clienteId: "cli-1", moneda: "USD", saldo: D(1025) }],
    movs: [mov({ id: "int-1", tipo: "INTERES", monto: D(25), descripcion: "INTERES CC | op:REF-INT-1" }), ...extra],
  });

  it("1/3/4: un INTERES de un solo MovimientoCC se revierte por revertirOperacion — exactamente un movimiento inverso con op:{reversalRef} | ref:{operationRef}", async () => {
    const p = interes();
    expect(await revertirOperacion(fdOp("REF-INT-1"))).toEqual({ success: true });
    const n = nuevos(p, 1);
    expect(n).toHaveLength(1);
    expect(n[0].descripcion).toMatch(/^REVERSO INTERES \| op:[a-zA-Z0-9-]+ \| ref:REF-INT-1$/);
  });

  it("2: el saldo vuelve exactamente al valor previo a aplicar el interés", async () => {
    const p = interes();
    await revertirOperacion(fdOp("REF-INT-1"));
    expect(saldo(p, "cc-1")).toBe(1000);
  });

  it("5/6: segunda reversión del mismo INTERES es rechazada — 0 movimientos nuevos, 0 modificaciones de saldo", async () => {
    const p = interes([mov({ id: "rev-int-1", tipo: "EGRESO", monto: D(25), descripcion: "REVERSO INTERES | op:REF-INT-2 | ref:REF-INT-1" })]);
    expect(await revertirOperacion(fdOp("REF-INT-1"))).toEqual({ error: "Esta operación ya fue revertida" });
    expect(nuevos(p, 2)).toHaveLength(0);
    expect(saldo(p, "cc-1")).toBe(1025);
  });

  it("7: INTERES sigue siendo rechazado por revertirMovimientoCC(id) — tiene op:", async () => {
    const p = interes();
    expect(err(await revertirMovimientoCC(null, fdId("int-1")))).toMatch(/operación agrupada/i);
    expect(nuevos(p, 1)).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// B. Cruce de caminos
// ════════════════════════════════════════════════════════════════════════════

describe("Cruce de caminos — revertirMovimientoCC vs revertirOperacion (OPS-01)", () => {
  it("11/12: un MovimientoCC con op: no puede pasar por revertirMovimientoCC y no escribe nada", async () => {
    const p = base({ movs: [mov({ id: "leg-1" })] });
    expect(err(await revertirMovimientoCC(null, fdId("leg-1")))).toMatch(/operación agrupada/i);
    expect(nuevos(p, 1)).toHaveLength(0);
    expect(saldo(p, "cc-1")).toBe(1000);
  });

  it("13: una pata ya revertida vía revertirOperacion sigue bloqueada por op: en revertirMovimientoCC", async () => {
    const p = base({ movs: [mov({ id: "leg-1" })] });
    expect(await revertirOperacion(fdOp("REF1"))).toEqual({ success: true });
    expect(err(await revertirMovimientoCC(null, fdId("leg-1")))).toMatch(/operación agrupada/i);
    expect(nuevos(p, 1)).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// C. revertirMovimientoCC manual
// ════════════════════════════════════════════════════════════════════════════

describe("revertirMovimientoCC — Camino C, movimientos manuales (OPS-01)", () => {
  const manual = (extra: Row[] = []) => base({
    cuentas: [{ id: "cc-1", clienteId: "cli-1", moneda: "USD", saldo: D(200) }],
    movs: [mov({ id: "mov-manual-1", monto: D(50), descripcion: "Ajuste manual de saldo" }), ...extra],
  });

  it("14: reversión individual válida", async () => {
    const p = manual();
    expect(await revertirMovimientoCC(null, fdId("mov-manual-1"))).toEqual({ ok: true });
    const n = nuevos(p, 1);
    expect(n).toHaveLength(1);
    expect(String(n[0].descripcion)).toContain("movref:mov-manual-1");
    expect(saldo(p, "cc-1")).toBe(250);
  });

  it("15/16/17: segundo intento rechazado — 0 movimientos nuevos, 0 cambio de saldo", async () => {
    const p = manual([mov({ id: "rev-1", tipo: "INGRESO", monto: D(50), descripcion: "[REVERSO por Otro] Ajuste manual de saldo | movref:mov-manual-1" })]);
    expect(await revertirMovimientoCC(null, fdId("mov-manual-1"))).toEqual({ error: "Este movimiento ya fue revertido" });
    expect(nuevos(p, 2)).toHaveLength(0);
    expect(saldo(p, "cc-1")).toBe(200);
  });

  it("18: un movimiento de reversión no puede volver a revertirse", async () => {
    const p = manual([mov({ id: "rev-1", tipo: "INGRESO", monto: D(50), descripcion: "[REVERSO por Admin] Ajuste manual de saldo | movref:mov-manual-1" })]);
    expect(await revertirMovimientoCC(null, fdId("rev-1"))).toEqual({ error: "Este movimiento ya es una reversión" });
    expect(nuevos(p, 2)).toHaveLength(0);
  });

  it("ID vacío es rechazado sin tocar la base", async () => {
    const p = base();
    expect(await revertirMovimientoCC(null, new FormData())).toEqual({ error: "ID requerido" });
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it("movimiento inexistente es rechazado", async () => {
    const p = base();
    expect(await revertirMovimientoCC(null, fdId("no-existe"))).toEqual({ error: "Movimiento no encontrado" });
    expect(p.movimientoCC.rows).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// E. Locking — presencia y orden del SELECT ... FOR UPDATE (test 22)
// ════════════════════════════════════════════════════════════════════════════
//
// No reproduce contención real de PostgreSQL (eso lo cubre la QA PG). Verifica que
// se emite SELECT … FOR UPDATE sobre el/los movimientos y que ocurre ANTES del
// re-chequeo de "ya revertida/o".

describe("Locking — presencia y orden del SELECT ... FOR UPDATE (test 22)", () => {
  it("revertirOperacion: adquiere el lock antes de re-chequear si ya fue revertida", async () => {
    base({ movs: [mov({ descripcion: "AJUSTE egreso | op:REF1" })] });
    await revertirOperacion(fdOp("REF1"));
    const i = st.eventos.findIndex((e) => e.startsWith("lock:") && e.includes('"MovimientoCC"') && e.includes("FOR UPDATE"));
    expect(i).toBeGreaterThanOrEqual(0);
    expect(st.eventos.indexOf("recheck")).toBeGreaterThan(i);
  });

  it("revertirMovimientoCC: adquiere el lock antes de re-chequear si ya fue revertido", async () => {
    base({ cuentas: [{ id: "cc-1", clienteId: "cli-1", moneda: "USD", saldo: D(200) }], movs: [mov({ id: "mov-manual-1", monto: D(50), descripcion: "Ajuste manual de saldo" })] });
    await revertirMovimientoCC(null, fdId("mov-manual-1"));
    const i = st.eventos.findIndex((e) => e.startsWith("lock:") && e.includes('"MovimientoCC"') && e.includes("FOR UPDATE"));
    expect(i).toBe(0); // primera operación de la tx
    expect(st.eventos.indexOf("recheck")).toBeGreaterThan(i);
  });
});
