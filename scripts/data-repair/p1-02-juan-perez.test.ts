import { describe, it, expect, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

// editarCliente REAL (Server Action) sobre la DB falsa: solo se sustituyen auth/permisos/prisma/cache.
const st = vi.hoisted(() => ({ prisma: null as unknown }));
vi.mock("@/auth", () => ({ auth: async () => ({ user: { id: "u-admin", name: "Facundo" } }) }));
vi.mock("@/lib/prisma", () => ({ get prisma() { return st.prisma; } }));
vi.mock("@/lib/config", () => ({ readOnlyPreview: false }));
vi.mock("@/lib/services/audit.service", () => ({ writeAuditLog: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ requireActionPermission: vi.fn(async () => null), requireCajaPermission: vi.fn(async () => null) }));
vi.mock("@/lib/data/movimiento-cc", () => ({ esMovimientoDeOperacionAgrupada: () => false, extraerOperationRef: () => null }));
vi.mock("@/lib/parse-monto", async () => await import("../../src/lib/parse-monto"));
vi.mock("@/lib/caja/integridad", async () => await import("../../src/lib/caja/integridad"));
vi.mock("@/lib/cc/integridad", async () => await import("../../src/lib/cc/integridad"));
vi.mock("@/lib/cc/integridad.service", async () => await import("../../src/lib/cc/integridad.service"));
vi.mock("@/lib/services/cc.service", async () => await import("../../src/lib/services/cc.service"));
vi.mock("@/lib/services/intereses.service", async () => await import("../../src/lib/services/intereses.service"));
vi.mock("@/lib/services/liquidacion-cc.service", async () => await import("../../src/lib/services/liquidacion-cc.service"));
vi.mock("@/lib/caja/integridad.service", async () => await import("../../src/lib/caja/integridad.service"));
import { editarCliente } from "../../src/app/(dashboard)/clientes/actions";
import { editarCambioTx } from "../../src/lib/caja/integridad.service";
import { tabla } from "../../src/lib/caja/fake-tx";
import { esOpRevertida, esReversaValida } from "../../src/lib/caja/integridad";
import { saldoReconstruido } from "../../src/lib/cc/integridad";
import { construirLedger } from "../../src/lib/finance/ledger";
import { dataset, opCambio } from "../../src/lib/finance/test-fixtures";
import { CLAVES_HUELLA, HUELLAS_ALGORITMO_P1_02, P1_02, P102Error, PREVIO, aplicarTx, canon, descRegARS, descRegUSD, huella, huellaFila, postcheck, precheck, rollbackTx } from "./p1-02-juan-perez";

// P1-02 — neutralizar + archivar el cliente seed/prueba Juan Pérez, sobre una DB falsa con el estado
// EXACTO auditado en PROD / TEST V5 (2026-11-11) + terceros (Marianela RIRI, otro cliente, otra op).

type Row = Record<string, unknown>;
const D = (v: Decimal.Value) => new Decimal(v);
const ADMIN = "u-admin", SOCIO = "u-socio";
const OFICINA = "caja-oficina", TRENQUE = "caja-trenque";
const OTRA_CC = "2cc55645-12a8-45c5-b205-d0d315f6694d";
const AHORA = new Date("2026-11-11T15:00:00.000Z");

function estadoInicial(over: { cliente?: Row; ccUSD?: Row; ccARS?: Row; op?: Row; cajaC?: Row; extraCC?: Row[]; extraCaja?: Row[]; pf?: Row; audit?: Row[] } = {}) {
  const ts = (s: string) => new Date(s);
  return {
    cliente: [
      { id: P1_02.clienteId, nombre: "Juan Pérez", email: "juan.perez@email.com", telefono: null, activo: true, tasaCC: D(4), notas: null, updatedAt: ts(PREVIO.cliente.updatedAt), ...(over.cliente ?? {}) },
      { id: "cli-marianela", nombre: "Marianela RIRI", email: null, activo: true, tasaCC: D(0), notas: null, updatedAt: ts("2026-05-21T10:00:00Z") },
    ],
    cuentaCorriente: [
      { id: P1_02.ccUSD, clienteId: P1_02.clienteId, moneda: "USD", saldo: D(1000), updatedAt: ts(PREVIO.ccUSD.updatedAt), ...(over.ccUSD ?? {}) },
      { id: P1_02.ccARS, clienteId: P1_02.clienteId, moneda: "ARS", saldo: D(1380000), updatedAt: ts(PREVIO.ccARS.updatedAt), ...(over.ccARS ?? {}) },
      { id: OTRA_CC, clienteId: "cli-marianela", moneda: "USD", saldo: D(9000), updatedAt: ts("2026-05-21T16:49:43Z") },
    ],
    movimientoCC: [
      { id: P1_02.movCC, cuentaCorrienteId: P1_02.ccUSD, fecha: ts("2026-05-21"), tipo: "INGRESO", monto: D(2000), descripcion: "ingreso", operacionCambioId: null, userId: null },
      { id: "m-mar", cuentaCorrienteId: OTRA_CC, fecha: ts("2026-05-21"), tipo: "INGRESO", monto: D(10000), descripcion: "INGRESO", operacionCambioId: null, userId: null },
      { id: "m-mar2", cuentaCorrienteId: OTRA_CC, fecha: ts("2026-05-21"), tipo: "EGRESO", monto: D(1000), descripcion: "Retiro efec", operacionCambioId: null, userId: null },
      ...(over.extraCC ?? []),
    ],
    operacionCambio: [
      { id: P1_02.op, tipo: "COMPRA_USD", moneda: "USD", cantidad: D(1000), tipoCambio: D(1380), totalARS: D(1380000), clienteId: P1_02.clienteId, clienteNombre: "Juan Pérez", fecha: ts("2026-05-21T16:20:27.000Z"), mesContable: "2026-05", pendiente: false, descripcion: PREVIO.op.descripcion, updatedAt: ts(PREVIO.op.updatedAt), ...(over.op ?? {}) },
      { id: "op-otra", tipo: "VENTA_USD", moneda: "USD", cantidad: D(10000), tipoCambio: D(1400), totalARS: D(14000000), clienteId: null, pendiente: false, descripcion: "Operación de VENTA USD | usr:Facundo", updatedAt: ts("2026-05-21T13:11:29Z") },
    ],
    movimientoCaja: [
      { id: P1_02.cajaA, cajaId: OFICINA, tipo: "ENTRADA", moneda: "USD", monto: D(1000), descripcion: `[Cambio ${P1_02.op}] Compra divisa`, confirmado: true, anulado: false, operacionCambioId: null, transferenciaRef: null, pagoDeId: null, fecha: ts("2026-05-21") },
      { id: P1_02.cajaB, cajaId: OFICINA, tipo: "SALIDA", moneda: "ARS", monto: D(1380000), descripcion: `[Cambio ${P1_02.op}] Pago ARS x Compra`, confirmado: true, anulado: false, operacionCambioId: null, transferenciaRef: null, pagoDeId: null, fecha: ts("2026-05-21") },
      { id: P1_02.cajaC, cajaId: OFICINA, tipo: "ENTRADA", moneda: "USD", monto: D(2000), descripcion: `[MOV_CC] ingreso | cc:${P1_02.ccUSD}`, confirmado: true, anulado: false, operacionCambioId: null, transferenciaRef: null, pagoDeId: null, fecha: ts("2026-05-21"), ...(over.cajaC ?? {}) },
      { id: P1_02.marianela, cajaId: OFICINA, tipo: "SALIDA", moneda: "USD", monto: D(1000), descripcion: `[MOV_CC] Retiro efec | cc:${OTRA_CC}`, confirmado: true, anulado: false, operacionCambioId: null, transferenciaRef: null, pagoDeId: null, fecha: ts("2026-05-21") },
      { id: "caja-otra-op", cajaId: OFICINA, tipo: "SALIDA", moneda: "USD", monto: D(10000), descripcion: "[Cambio op-otra] Venta divisa", confirmado: true, anulado: false, operacionCambioId: null, transferenciaRef: null, pagoDeId: null, fecha: ts("2026-05-21") },
      { id: "caja-trenque", cajaId: TRENQUE, tipo: "ENTRADA", moneda: "ARS", monto: D(500), descripcion: "[MOVIMIENTO_CAJA:VARIOS] x", confirmado: true, anulado: false, operacionCambioId: null, transferenciaRef: null, pagoDeId: null, fecha: ts("2026-06-01") },
      ...(over.extraCaja ?? []),
    ],
    plazoFijo: P1_02.pfs.map((id, i) => ({ id, clienteId: P1_02.clienteId, moneda: "USD", capital: D(5000), saldoActual: D(5000), estado: "CANCELADO", notas: null, updatedAt: ts(`2026-05-21T1${3 + i * 3}:24:02Z`), ...(i === 0 ? over.pf ?? {} : {}) })),
    plazoFijoMovimiento: [] as Row[],
    auditLog: over.audit ?? [],
    user: [{ id: ADMIN, name: "Facundo", role: "ADMIN", activo: true }, { id: SOCIO, name: "Augusto", role: "SOCIO", activo: true }],
    caja: [{ id: OFICINA, slug: "oficina" }, { id: TRENQUE, slug: "nanu_trenque" }],
  };
}

function crearDb(over: Parameters<typeof estadoInicial>[0] = {}) {
  const s = estadoInicial(over);
  const t = {
    cliente: tabla(s.cliente), cuentaCorriente: tabla(s.cuentaCorriente), movimientoCC: tabla(s.movimientoCC, { operacionCambioId: null, userId: null }),
    operacionCambio: tabla(s.operacionCambio), movimientoCaja: tabla(s.movimientoCaja, { confirmado: false, anulado: false, operacionCambioId: null, transferenciaRef: null, pagoDeId: null }),
    plazoFijo: tabla(s.plazoFijo), plazoFijoMovimiento: tabla(s.plazoFijoMovimiento), auditLog: tabla(s.auditLog), user: tabla(s.user), caja: tabla(s.caja),
  };
  const locks: string[] = [];
  const tx = { ...t, $queryRaw: async (q: TemplateStringsArray) => { locks.push(q.join("?")); return []; } };
  const $transaction = async <T,>(fn: (x: never) => Promise<T>): Promise<T> => {
    const snap = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.rows.map((r) => ({ ...r }))]));
    try { return await fn(tx as never); } catch (e) {
      for (const [k, v] of Object.entries(t)) v.rows.splice(0, v.rows.length, ...snap[k]);
      throw e;
    }
  };
  /** Foto completa (huella por tabla) para comparar estados exactos. */
  const foto = (sinAudit = false) => Object.fromEntries(Object.entries(t).filter(([k]) => !(sinAudit && k === "auditLog")).map(([k, v]) => [k, huella(v.rows as Row[])]));
  const apply = () => $transaction((x) => aplicarTx(x, { ejecutorId: ADMIN, ahora: AHORA }));
  const rollback = () => $transaction((x) => rollbackTx(x, { ejecutorId: ADMIN }));
  return { t, tx: tx as never, locks, $transaction, foto, apply, rollback };
}
const cc = (t: ReturnType<typeof crearDb>["t"], id: string) => ({
  saldo: String(t.cuentaCorriente.rows.find((r) => r.id === id)!.saldo),
  recon: saldoReconstruido(t.movimientoCC.rows.filter((m) => m.cuentaCorrienteId === id) as never).toString(),
  n: t.movimientoCC.rows.filter((m) => m.cuentaCorrienteId === id).length,
});
const netoCaja = (rows: Row[]) => rows.reduce<Record<string, number>>((s, m) => { s[String(m.moneda)] = (s[String(m.moneda)] ?? 0) + Number(m.monto) * (m.tipo === "ENTRADA" ? 1 : -1); return s; }, {});

describe("P1-02 — precheck", () => {
  it("1. estado aprobado → PASS", async () => {
    const r = await precheck(crearDb().tx);
    expect(r.chequeos.filter((c) => !c.ok)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.oficinaId).toBe(OFICINA);
  });

  it.each([
    ["cliente inactivo", { cliente: { activo: false } }], ["tasaCC distinta", { cliente: { tasaCC: D(3) } }], ["cliente con notas", { cliente: { notas: "x" } }],
    ["cliente modificado (updatedAt)", { cliente: { updatedAt: new Date() } }], ["saldo USD distinto", { ccUSD: { saldo: D(900) } }], ["saldo ARS distinto", { ccARS: { saldo: D(0) } }],
    ["CC tocada (updatedAt)", { ccUSD: { updatedAt: new Date() } }], ["cambio ya revertido", { op: { descripcion: `[REVERTIDA POR: X] ${PREVIO.op.descripcion}`, pendiente: true } }],
    ["cambio pendiente", { op: { pendiente: true } }], ["TC distinto", { op: { tipoCambio: D(1400) } }],
    ["C anulada", { cajaC: { anulado: true } }], ["C con otro monto", { cajaC: { monto: D(2500) } }],
    ["PF reactivado", { pf: { estado: "ACTIVO" } }],
    ["MovimientoCC posterior en la CC", { extraCC: [{ id: "x", cuentaCorrienteId: P1_02.ccARS, fecha: new Date(), tipo: "INGRESO", monto: D(1), descripcion: "x" }] }],
    ["MovimientoCC ya vinculado al cambio", { extraCC: [{ id: "x", cuentaCorrienteId: OTRA_CC, fecha: new Date(), tipo: "INGRESO", monto: D(1), descripcion: "x", operacionCambioId: P1_02.op }] }],
    ["reversa previa de C", { extraCaja: [{ id: "rx", cajaId: OFICINA, tipo: "SALIDA", moneda: "USD", monto: D(2000), descripcion: `REVERSO | ref:${P1_02.cajaC} | x`, confirmado: true, anulado: false, fecha: new Date() }] }],
    ["reparación vigente", { audit: [{ id: "a1", accion: P1_02.accion, entidadId: P1_02.clienteId, createdAt: new Date() }] }],
  ])("2. precondición alterada (%s) → ABORT sin escribir", async (_k, over) => {
    const db = crearDb(over as never);
    const antes = db.foto();
    expect((await precheck(db.tx)).ok).toBe(false);
    await expect(db.apply()).rejects.toThrow(P102Error);
    expect(db.foto()).toEqual(antes);
  });

  it("3. Marianela RIRI: verificada y EXCLUIDA del conjunto de Juan", async () => {
    const r = await precheck(crearDb().tx);
    expect(r.chequeos.find((c) => c.chequeo.startsWith("Marianela RIRI 7cbe7f00"))?.ok).toBe(true);
    expect(r.chequeos.find((c) => c.chequeo === "Marianela RIRI fuera del conjunto Juan")?.ok).toBe(true);
  });

  it("ejecutor no ADMIN → ABORT", async () => {
    const db = crearDb();
    await expect(db.$transaction((x) => aplicarTx(x, { ejecutorId: SOCIO }))).rejects.toThrow(/ADMIN/);
  });
});

describe("P1-02 — apply", () => {
  it("4–5. la regularización sola no mueve el saldo; revertirCambioTx la encuentra (sin ella no habría CC que neutralizar)", async () => {
    const db = crearDb();
    const { creados } = await db.apply();
    const reg = db.t.movimientoCC.rows.filter((m) => m.id === creados.regUSD || m.id === creados.regARS);
    expect(reg.map((m) => m.descripcion).sort()).toEqual([descRegARS, descRegUSD].sort());
    expect(reg.every((m) => m.operacionCambioId === P1_02.op)).toBe(true);
    // revertirCambioTx creó la reversa CC de CADA regularización (vínculo por operacionCambioId)
    const rev = db.t.movimientoCC.rows.filter((m) => m.id === creados.revCCUSD || m.id === creados.revCCARS);
    expect(rev.map((m) => [m.cuentaCorrienteId, m.tipo, String(m.monto)]).sort()).toEqual([[P1_02.ccARS, "EGRESO", "1380000"], [P1_02.ccUSD, "INGRESO", "1000"]].sort());
    expect(rev.every((m) => String(m.descripcion).startsWith("[REVERSO] Reverso op cambio | op:") && m.operacionCambioId === P1_02.op)).toBe(true);
  });

  it("6–9 + 27. exactamente 8 hechos: 5 MovimientoCC + 3 MovimientoCaja, una reversa por efecto", async () => {
    const db = crearDb();
    const cajaAntes = db.t.movimientoCaja.rows.length, ccAntes = db.t.movimientoCC.rows.length;
    const { creados } = await db.apply();
    expect(Object.keys(creados)).toHaveLength(8);
    expect(new Set(Object.values(creados)).size).toBe(8);
    expect(db.t.movimientoCC.rows.length - ccAntes).toBe(5);
    expect(db.t.movimientoCaja.rows.length - cajaAntes).toBe(3);
    const caja = (id: string) => db.t.movimientoCaja.rows.find((m) => m.id === id)!;
    // 7. A y B revertidas una vez (reversa del cambio = neto por caja/moneda)
    expect([caja(creados.revCajaUSD), caja(creados.revCajaARS)].map((m) => [m.tipo, m.moneda, String(m.monto), m.cajaId, m.operacionCambioId]))
      .toEqual([["SALIDA", "USD", "1000", OFICINA, P1_02.op], ["ENTRADA", "ARS", "1380000", OFICINA, P1_02.op]]);
    expect(db.t.movimientoCaja.rows.filter((m) => String(m.descripcion).startsWith(`[REVERSO Cambio ${P1_02.op}]`))).toHaveLength(2);
    // 8. C revertida una vez, estructural Macro 3
    const original = db.t.movimientoCaja.rows.find((m) => m.id === P1_02.cajaC)!;
    expect(esReversaValida(original as never, caja(creados.revCajaC) as never)).toBe(true);
    expect(db.t.movimientoCaja.rows.filter((m) => String(m.descripcion).startsWith(`REVERSO | ref:${P1_02.cajaC}`))).toHaveLength(1);
    // 9. f14e4627 revertido una vez (movref)
    expect(db.t.movimientoCC.rows.filter((m) => String(m.descripcion).endsWith(`movref:${P1_02.movCC}`))).toHaveLength(1);
    expect(db.t.movimientoCC.rows.find((m) => m.id === creados.revMovCC)).toMatchObject({ tipo: "EGRESO", cuentaCorrienteId: P1_02.ccUSD });
  });

  it("10–12. CC USD 0/0, CC ARS 0/0, Caja de Juan neta 0/0", async () => {
    const db = crearDb();
    const { creados } = await db.apply();
    expect(cc(db.t, P1_02.ccUSD)).toEqual({ saldo: "0", recon: "0", n: 4 });
    expect(cc(db.t, P1_02.ccARS)).toEqual({ saldo: "0", recon: "0", n: 2 });
    const jp = [P1_02.cajaA, P1_02.cajaB, P1_02.cajaC, creados.revCajaUSD, creados.revCajaARS, creados.revCajaC];
    const n = netoCaja(db.t.movimientoCaja.rows.filter((m) => jp.includes(String(m.id))));
    expect(n).toEqual({ USD: 0, ARS: 0 });
    expect(netoCaja(db.t.movimientoCaja.rows.filter((m) => ([P1_02.cajaA, P1_02.cajaB, P1_02.cajaC] as string[]).includes(String(m.id))))).toEqual({ USD: 3000, ARS: -1380000 });
  });

  it("13–15. otros movimientos de caja, otras CC, Marianela y PF intactos", async () => {
    const db = crearDb();
    const filas = (k: keyof ReturnType<typeof crearDb>["t"], f: (r: Row) => boolean) => huella((db.t[k].rows as Row[]).filter(f));
    const ajenaCaja = (r: Row) => !([P1_02.cajaA, P1_02.cajaB, P1_02.cajaC] as string[]).includes(String(r.id));
    const antes = {
      caja: filas("movimientoCaja", ajenaCaja), cc: filas("cuentaCorriente", (r) => r.id === OTRA_CC), movcc: filas("movimientoCC", (r) => r.cuentaCorrienteId === OTRA_CC),
      ops: filas("operacionCambio", (r) => r.id === "op-otra"), pf: filas("plazoFijo", () => true), originales: filas("movimientoCaja", (r) => !ajenaCaja(r)),
      mar: filas("movimientoCaja", (r) => r.id === P1_02.marianela), cli: filas("cliente", (r) => r.id === "cli-marianela"),
    };
    const { creados } = await db.apply();
    const nuevos = new Set(Object.values(creados));
    expect(filas("movimientoCaja", (r) => ajenaCaja(r) && !nuevos.has(String(r.id)))).toBe(antes.caja);
    expect(filas("movimientoCaja", (r) => !ajenaCaja(r))).toBe(antes.originales); // A/B/C sin editar
    expect(filas("cuentaCorriente", (r) => r.id === OTRA_CC)).toBe(antes.cc);
    expect(filas("movimientoCC", (r) => r.cuentaCorrienteId === OTRA_CC)).toBe(antes.movcc);
    expect(filas("operacionCambio", (r) => r.id === "op-otra")).toBe(antes.ops);
    expect(filas("plazoFijo", () => true)).toBe(antes.pf);
    expect(filas("movimientoCaja", (r) => r.id === P1_02.marianela)).toBe(antes.mar);
    expect(filas("cliente", (r) => r.id === "cli-marianela")).toBe(antes.cli);
  });

  it("16. cliente inactivo, tasaCC 0, nota P1-02 (sin borrar)", async () => {
    const db = crearDb();
    await db.apply();
    expect(db.t.cliente.rows.find((c) => c.id === P1_02.clienteId)).toMatchObject({ activo: false, notas: "[P1-02] Cliente seed/prueba archivado" });
    expect(String(db.t.cliente.rows.find((c) => c.id === P1_02.clienteId)!.tasaCC)).toBe("0");
    expect(db.t.cuentaCorriente.rows.filter((c) => c.clienteId === P1_02.clienteId)).toHaveLength(2);
    expect(db.t.plazoFijo.rows).toHaveLength(2);
  });

  it("17. AuditLog en la misma tx, con todos los ids y el estado previo exacto", async () => {
    const db = crearDb();
    const { creados } = await db.apply();
    expect(db.t.auditLog.rows).toHaveLength(1);
    const a = db.t.auditLog.rows[0] as { accion: string; entidadId: string; userId: string; datosNuevos: Record<string, unknown>; datosPrevios: Record<string, unknown> };
    expect(a).toMatchObject({ accion: "REPARACION_CLIENTE_PRUEBA", entidadId: P1_02.clienteId, userId: ADMIN });
    expect(a.datosNuevos).toMatchObject({ creados, operacionCambioId: P1_02.op, cajaJuan: [P1_02.cajaA, P1_02.cajaB, P1_02.cajaC], deltaFxAgostoEsperadoARS: "-473.68", fechaCompensacion: "2026-11-11" });
    expect(a.datosPrevios).toMatchObject({ cliente: PREVIO.cliente, op: PREVIO.op });
  });

  it("18. fallo del AuditLog → ROLLBACK total", async () => {
    const db = crearDb();
    const antes = db.foto();
    vi.spyOn(db.t.auditLog, "create").mockRejectedValueOnce(new Error("audit caído"));
    await expect(db.apply()).rejects.toThrow(/audit caído/);
    expect(db.foto()).toEqual(antes);
  });

  it("19. segundo apply → DENY sin escribir", async () => {
    const db = crearDb();
    await db.apply();
    const despues = db.foto();
    await expect(db.apply()).rejects.toThrow(/PRECHECK FAIL/);
    expect(db.foto()).toEqual(despues);
  });

  it("20. motor: el cambio queda REVERTIDO y fuera del costo FX (antes: CONFIRMADO y dentro)", async () => {
    const db = crearDb();
    const op0 = db.t.operacionCambio.rows.find((o) => o.id === P1_02.op)!;
    const ds = (o: Row) => dataset({ opsCambio: [opCambio({ id: P1_02.op, tipo: "COMPRA_USD", fecha: "2026-05-21", cantidad: 1000, totalARS: 1380000, descripcion: o.descripcion as string, pendiente: o.pendiente as boolean })] });
    const antes = construirLedger(ds(op0));
    expect(antes.fxOperaciones.map((f) => f.id)).toEqual([P1_02.op]);
    await db.apply();
    const op1 = db.t.operacionCambio.rows.find((o) => o.id === P1_02.op)!;
    expect(esOpRevertida(op1.descripcion as string)).toBe(true);
    expect(op1.descripcion).toBe(`[REVERTIDA POR: Facundo · P1-02] ${PREVIO.op.descripcion}`);
    const despues = construirLedger(ds(op1));
    expect(despues.fxOperaciones).toHaveLength(0);
    expect(despues.hechos.find((h) => h.origenId === P1_02.op)?.estado).toBe("REVERTIDO");
  });

  it("locks: cliente, CC, cambio, caja A/B/C y f14e4627 antes de escribir", async () => {
    const db = crearDb();
    await db.apply();
    expect(db.locks.slice(0, 5).map((l) => l.match(/FROM "(\w+)"/)?.[1])).toEqual(["Cliente", "CuentaCorriente", "OperacionCambio", "MovimientoCaja", "MovimientoCC"]);
  });
});

describe("P1-02 — rollback", () => {
  it("23–24. rollback restaura EXACTAMENTE el estado original (saldos/updatedAt directos, sin movimientos extra)", async () => {
    const db = crearDb();
    const original = db.foto(true);
    const ccAntes = db.t.movimientoCC.rows.length, cajaAntes = db.t.movimientoCaja.rows.length;
    await db.apply();
    await db.rollback();
    expect(db.foto(true)).toEqual(original); // todas las tablas salvo AuditLog: idénticas, incluidos updatedAt
    expect(db.t.movimientoCC.rows).toHaveLength(ccAntes);
    expect(db.t.movimientoCaja.rows).toHaveLength(cajaAntes);
    expect(cc(db.t, P1_02.ccUSD)).toEqual({ saldo: "1000", recon: "2000", n: 1 });
    expect(cc(db.t, P1_02.ccARS)).toEqual({ saldo: "1380000", recon: "0", n: 0 });
    expect(db.t.auditLog.rows.map((a) => a.accion)).toEqual([P1_02.accion, P1_02.accionRollback]);
    expect((await precheck(db.tx)).ok).toBe(true); // re-aplicable
  });

  it("25. segundo rollback → DENY sin escribir", async () => {
    const db = crearDb();
    await db.apply();
    await db.rollback();
    const antes = db.foto();
    await expect(db.rollback()).rejects.toThrow(/ROLLBACK DENY/);
    expect(db.foto()).toEqual(antes);
  });

  it("rollback sin reparación aplicada → DENY", async () => {
    await expect(crearDb().rollback()).rejects.toThrow(/ROLLBACK DENY/);
  });

  it.each([
    ["reversa posterior de la reversa de caja C", (c: Record<string, string>) => ({ t: "movimientoCaja", row: { id: "dep", cajaId: OFICINA, tipo: "ENTRADA", moneda: "USD", monto: D(2000), descripcion: `REVERSO | ref:${c.revCajaC} | x`, confirmado: true, anulado: false, fecha: new Date() } })],
    ["reversa posterior de una regularización", (c: Record<string, string>) => ({ t: "movimientoCC", row: { id: "dep", cuentaCorrienteId: OTRA_CC, fecha: new Date(), tipo: "INGRESO", monto: D(1), descripcion: `x | movref:${c.regUSD}` } })],
    ["movimiento nuevo en la CC del cliente", () => ({ t: "movimientoCC", row: { id: "dep", cuentaCorrienteId: P1_02.ccUSD, fecha: new Date(), tipo: "INGRESO", monto: D(5), descripcion: "x" } })],
  ])("26. rollback con dependencia posterior (%s) → DENY", async (_k, dep) => {
    const db = crearDb();
    const { creados } = await db.apply();
    const d = dep(creados as unknown as Record<string, string>);
    (db.t as unknown as Record<string, { rows: Row[] }>)[d.t].rows.push(d.row);
    const antes = db.foto();
    await expect(db.rollback()).rejects.toThrow(/ROLLBACK DENY/);
    expect(db.foto()).toEqual(antes);
  });
});

describe("P1-02 — rollback: guard de huella completa post-apply", () => {
  const WRITES = ["create", "createMany", "update", "updateMany", "upsert", "delete", "deleteMany"];
  /** Espía TODOS los métodos de escritura de todas las tablas: el rollback DENY debe hacer 0 writes. */
  function espiarWrites(db: ReturnType<typeof crearDb>) {
    const spies = Object.values(db.t).flatMap((tb) => WRITES.filter((m) => typeof (tb as Record<string, unknown>)[m] === "function")
      .map((m) => vi.spyOn(tb as never, m as never)));
    return () => spies.reduce((n, s) => n + (s as unknown as { mock: { calls: unknown[] } }).mock.calls.length, 0);
  }
  async function denyTrasEdicion(db: ReturnType<typeof crearDb>, clave: RegExp) {
    const antes = db.foto();
    const writes = espiarWrites(db);
    await expect(db.rollback()).rejects.toThrow(/ROLLBACK DENY: entidad modificada después del apply/);
    await expect(db.rollback()).rejects.toThrow(clave);
    expect(writes()).toBe(0);
    expect(db.foto()).toEqual(antes); // nada restaurado, nada borrado: la edición posterior queda intacta
    vi.restoreAllMocks();
  }

  it("AuditLog APPLY guarda huellasPost de las 19 entidades (fila completa), estables tras el postcheck", async () => {
    const db = crearDb();
    const { creados } = await db.apply();
    const hp = (db.t.auditLog.rows[0].datosNuevos as Record<string, unknown>).huellasPost as Record<string, string>;
    expect(Object.keys(hp).sort()).toEqual([...CLAVES_HUELLA].sort());
    expect(CLAVES_HUELLA).toHaveLength(19);
    expect(Object.values(hp).every((h) => /^[0-9a-f]{64}$/.test(h))).toBe(true);
    expect(hp["creado.revCajaC"]).toBe(huellaFila(db.t.movimientoCaja.rows.find((r) => r.id === creados.revCajaC)));
    expect(hp.op).toBe(huellaFila(db.t.operacionCambio.rows.find((r) => r.id === P1_02.op)));
  });

  it("huella determinística: independiente del orden de claves; cualquier campo (incl. opcional) la cambia", () => {
    const a = { id: "x", monto: D("1.50"), fecha: new Date("2026-01-01T00:00:00Z"), userId: null, obj: { b: 1, a: [2, { z: 1, y: 2 }] } };
    const b = { obj: { a: [2, { y: 2, z: 1 }], b: 1 }, userId: null, fecha: new Date("2026-01-01T00:00:00Z"), monto: D("1.50"), id: "x" };
    expect(JSON.stringify(canon(a))).toBe(JSON.stringify(canon(b)));
    expect(huellaFila(a)).toBe(huellaFila(b));
    expect(huellaFila({ ...a, userId: "u" })).not.toBe(huellaFila(a));
    expect(huellaFila({ ...a, fecha: new Date("2026-01-02T00:00:00Z") })).not.toBe(huellaFila(a));
    expect(huellaFila(null)).toBe("AUSENTE");
  });

  it("E. editarCambioTx REAL cambia OperacionCambio.fecha → rollback DENY, 0 writes, edición intacta", async () => {
    const db = crearDb();
    await db.apply();
    const nueva = new Date("2026-05-20T12:00:00.000Z");
    await db.$transaction((x) => editarCambioTx(x, { opId: P1_02.op, fecha: nueva, cantidad: null, tipoCambio: null, cobro: null }));
    const op = () => db.t.operacionCambio.rows.find((r) => r.id === P1_02.op)!;
    expect((op().fecha as Date).toISOString()).toBe(nueva.toISOString());
    expect((await postcheck(db.tx)).ok).toBe(true); // los guards semánticos NO lo detectan: solo la huella
    await denyTrasEdicion(db, /\bop\b/);
    expect((op().fecha as Date).toISOString()).toBe(nueva.toISOString());
    expect(esOpRevertida(op().descripcion as string)).toBe(true);
  });

  it("F. editarCambioTx REAL cambia OperacionCambio.clienteNombre → rollback DENY, 0 writes, edición intacta", async () => {
    const db = crearDb();
    await db.apply();
    await db.$transaction((x) => editarCambioTx(x, { opId: P1_02.op, clienteNombre: "Juan P. (editado)", fecha: null, cantidad: null, tipoCambio: null, cobro: null }));
    expect((await postcheck(db.tx)).ok).toBe(true);
    await denyTrasEdicion(db, /\bop\b/);
    expect(db.t.operacionCambio.rows.find((r) => r.id === P1_02.op)!.clienteNombre).toBe("Juan P. (editado)");
  });

  it("G. editarCliente REAL cambia Cliente.telefono → rollback DENY, teléfono NO pisado, hechos P1-02 intactos", async () => {
    const db = crearDb();
    const { creados } = await db.apply();
    st.prisma = db.tx;
    const fd = new FormData();
    fd.set("id", P1_02.clienteId); fd.set("nombre", "Juan Pérez"); fd.set("email", "juan.perez@email.com");
    fd.set("telefono", "+54 11 5555-0000"); fd.set("notas", P1_02.notasArchivo);
    expect(await editarCliente(null, fd)).toEqual({ ok: true });
    const cli = () => db.t.cliente.rows.find((r) => r.id === P1_02.clienteId)!;
    expect(cli().telefono).toBe("+54 11 5555-0000");
    expect((await postcheck(db.tx)).ok).toBe(true);
    await denyTrasEdicion(db, /\bcliente\b/);
    expect(cli()).toMatchObject({ telefono: "+54 11 5555-0000", activo: false, notas: P1_02.notasArchivo });
    const ids = new Set(Object.values(creados));
    expect(db.t.movimientoCC.rows.filter((r) => ids.has(String(r.id))).length + db.t.movimientoCaja.rows.filter((r) => ids.has(String(r.id))).length).toBe(8);
  });

  it.each([
    ["fecha de la reversa de caja C", "movimientoCaja", "revCajaC", { fecha: new Date("2026-11-12T00:00:00Z") }],
    ["userId de la reversa CC de f14e4627", "movimientoCC", "revMovCC", { userId: "u-socio" }],
    ["fecha de la regularización USD", "movimientoCC", "regUSD", { fecha: new Date("2026-11-10T00:00:00Z") }],
  ] as const)("H. reversa/hecho creado modificado (%s) → rollback DENY, 0 writes", async (_k, tb, clave, cambio) => {
    const db = crearDb();
    const { creados } = await db.apply();
    Object.assign((db.t[tb].rows as Row[]).find((r) => r.id === creados[clave])!, cambio);
    expect((await postcheck(db.tx)).ok).toBe(true);
    await denyTrasEdicion(db, new RegExp(`creado\\.${clave}`));
    expect((db.t[tb].rows as Row[]).find((r) => r.id === creados[clave])).toMatchObject(cambio);
  });

  it.each([
    ["fecha de A 91ce00ff", P1_02.cajaA, { fecha: new Date("2026-05-22T00:00:00Z") }, /\bcajaA\b/],
    ["campo opcional de C (pagoDeId)", P1_02.cajaC, { pagoDeId: "x" }, /\bcajaC\b/],
    ["Marianela (guard de exclusión)", P1_02.marianela, { fecha: new Date("2026-05-23T00:00:00Z") }, /\bmarianela\b/],
  ] as const)("I. Caja original modificada (%s) → rollback DENY, 0 writes", async (_k, id, cambio, clave) => {
    const db = crearDb();
    await db.apply();
    Object.assign(db.t.movimientoCaja.rows.find((r) => r.id === id)!, cambio);
    await denyTrasEdicion(db, clave);
    expect(db.t.movimientoCaja.rows.find((r) => r.id === id)).toMatchObject(cambio);
  });

  it("PF / CC / f14 con campo no cubierto por guards semánticos → rollback DENY", async () => {
    for (const [tb, id, cambio, clave] of [
      ["plazoFijo", P1_02.pfs[1], { updatedAt: new Date() }, /pfdff40087/],
      ["cuentaCorriente", P1_02.ccARS, { updatedAt: new Date() }, /\bccARS\b/],
      ["movimientoCC", P1_02.movCC, { userId: "u-socio" }, /\bf14\b/],
    ] as const) {
      const db = crearDb();
      await db.apply();
      Object.assign((db.t[tb].rows as Row[]).find((r) => r.id === id)!, cambio);
      await denyTrasEdicion(db, clave);
    }
  });

  it("AuditLog sin huellasPost (o incompleto) → rollback DENY sin escribir", async () => {
    for (const mutar of [(h: Record<string, string>) => { for (const k of Object.keys(h)) delete h[k]; }, (h: Record<string, string>) => { delete h.cliente; }]) {
      const db = crearDb();
      await db.apply();
      mutar((db.t.auditLog.rows[0].datosNuevos as Record<string, Record<string, string>>).huellasPost);
      const antes = db.foto();
      await expect(db.rollback()).rejects.toThrow(/ROLLBACK DENY: huellasPost ausentes o incompatibles/);
      expect(db.foto()).toEqual(antes);
    }
  });

  it("edición revertida al valor post-apply exacto → huellas coinciden → rollback PASS y restauración exacta", async () => {
    const db = crearDb();
    const original = db.foto(true);
    await db.apply();
    const cli = db.t.cliente.rows.find((r) => r.id === P1_02.clienteId)!;
    const previo = { telefono: cli.telefono, updatedAt: cli.updatedAt };
    Object.assign(cli, { telefono: "QA", updatedAt: new Date() });
    await expect(db.rollback()).rejects.toThrow(/entidad modificada después del apply \(cliente\)/);
    // el $transaction falso repone copias de las filas al abortar: volver a buscar la fila
    Object.assign(db.t.cliente.rows.find((r) => r.id === P1_02.clienteId)!, previo);
    await db.rollback();
    expect(db.foto(true)).toEqual(original);
    expect((await precheck(db.tx)).ok).toBe(true);
  });
});

describe("P1-02 — rollback: metadata de huellas FAIL-CLOSED + orden locks/revalidación", () => {
  const WRITES = ["create", "createMany", "update", "updateMany", "upsert", "delete", "deleteMany"];
  function espiarWrites(db: ReturnType<typeof crearDb>, marca?: string[]) {
    const spies = Object.values(db.t).flatMap((tb) => WRITES.filter((m) => typeof (tb as Record<string, unknown>)[m] === "function").map((m) => {
      const orig = (tb as unknown as Record<string, (...a: unknown[]) => unknown>)[m].bind(tb);
      return vi.spyOn(tb as never, m as never).mockImplementation(((...a: unknown[]) => { marca?.push(`WRITE ${m}`); return orig(...a); }) as never);
    }));
    return () => spies.reduce((n, s) => n + (s as unknown as { mock: { calls: unknown[] } }).mock.calls.length, 0);
  }
  const datosNuevos = (db: ReturnType<typeof crearDb>) => db.t.auditLog.rows.find((r) => r.accion === P1_02.accion)!.datosNuevos as Record<string, unknown>;
  async function denyMetadata(db: ReturnType<typeof crearDb>, msg: RegExp, idsApply?: string[]) {
    const antes = db.foto();
    const ids = idsApply ?? Object.values(datosNuevos(db).creados as Record<string, string>);
    const writes = espiarWrites(db);
    await expect(db.rollback()).rejects.toThrow(msg);
    expect(writes()).toBe(0);
    vi.restoreAllMocks();
    expect(db.foto()).toEqual(antes);
    // siguen intactos: 8 hechos, CC 0/0, cambio revertido, cliente archivado, caja de Juan
    expect(db.t.movimientoCC.rows.filter((r) => ids.includes(String(r.id))).length + db.t.movimientoCaja.rows.filter((r) => ids.includes(String(r.id))).length).toBe(8);
    expect(cc(db.t, P1_02.ccUSD)).toEqual({ saldo: "0", recon: "0", n: 4 });
    expect(cc(db.t, P1_02.ccARS)).toEqual({ saldo: "0", recon: "0", n: 2 });
    expect(esOpRevertida(db.t.operacionCambio.rows.find((r) => r.id === P1_02.op)!.descripcion as string)).toBe(true);
    expect(db.t.cliente.rows.find((r) => r.id === P1_02.clienteId)).toMatchObject({ activo: false, notas: P1_02.notasArchivo });
    // con creados alterado el postcheck falla (con razón) en "AuditLog con los 8 ids"; el resto del estado se verificó arriba
    if (!idsApply) expect((await postcheck(db.tx)).ok).toBe(true);
  }

  it("apply escribe huellasAlgoritmo = constante centralizada HUELLAS_ALGORITMO_P1_02", async () => {
    const db = crearDb();
    await db.apply();
    expect(datosNuevos(db).huellasAlgoritmo).toBe(HUELLAS_ALGORITMO_P1_02);
  });

  it("E. huellasAlgoritmo AUSENTE → rollback DENY, 0 writes, hechos/CC/caja/cambio/cliente intactos", async () => {
    const db = crearDb();
    await db.apply();
    delete datosNuevos(db).huellasAlgoritmo;
    await denyMetadata(db, /ROLLBACK DENY: algoritmo de huellas ausente o incompatible/);
  });

  it.each([
    ["desconocido", "md5(row_to_json) v0"],
    ["casi igual (espacio extra)", `${HUELLAS_ALGORITMO_P1_02} `],
    ["null", null],
    ["string vacío", ""],
    ["número", 1],
    ["objeto", { nombre: HUELLAS_ALGORITMO_P1_02 }],
  ])("F. huellasAlgoritmo %s → rollback DENY, 0 writes", async (_k, valor) => {
    const db = crearDb();
    await db.apply();
    datosNuevos(db).huellasAlgoritmo = valor;
    await denyMetadata(db, /ROLLBACK DENY: algoritmo de huellas ausente o incompatible/);
  });

  it.each([
    ["huellasPost como array", (d: Record<string, unknown>) => { d.huellasPost = Object.values(d.huellasPost as object); }, /huellasPost ausentes o incompatibles/],
    ["huellasPost con clave extra", (d: Record<string, unknown>) => { (d.huellasPost as Record<string, string>).extra = "0".repeat(64); }, /huellasPost ausentes o incompatibles/],
    ["huella con formato inválido", (d: Record<string, unknown>) => { (d.huellasPost as Record<string, string>).op = "AUSENTE"; }, /huellasPost ausentes o incompatibles/],
    ["creados con 7 ids", (d: Record<string, unknown>) => { delete (d.creados as Record<string, string>).revCajaC; }, /metadata incompatible \(creados\)/],
    ["creados con id no string", (d: Record<string, unknown>) => { (d.creados as Record<string, unknown>).regUSD = 5; }, /metadata incompatible \(creados\)/],
  ])("metadata con estructura inválida (%s) → rollback DENY, 0 writes", async (_k, mutar, msg) => {
    const db = crearDb();
    const { creados } = await db.apply();
    const ids = [...Object.values(creados)]; // copia: el fake guarda creados por referencia
    mutar(datosNuevos(db));
    await denyMetadata(db, msg, ids);
  });

  it("G. positivo: algoritmo exacto + 19 huellas correctas → rollback PASS y restauración exacta", async () => {
    const db = crearDb();
    const original = db.foto(true);
    await db.apply();
    expect(datosNuevos(db).huellasAlgoritmo).toBe(HUELLAS_ALGORITMO_P1_02);
    await db.rollback();
    expect(db.foto(true)).toEqual(original);
    expect((await precheck(db.tx)).ok).toBe(true);
  });

  it("H. orden: TODOS los locks (incl. 8 creados, Marianela, PF, AuditLog) antes del primer write", async () => {
    const db = crearDb();
    const { creados } = await db.apply();
    db.locks.length = 0;
    espiarWrites(db, db.locks);
    await db.rollback();
    vi.restoreAllMocks();
    const primerWrite = db.locks.findIndex((l) => l.startsWith("WRITE"));
    const locks = db.locks.slice(0, primerWrite);
    expect(primerWrite).toBeGreaterThan(0);
    expect(locks.every((l) => /FOR UPDATE/.test(l))).toBe(true);
    const tablas = locks.map((l) => l.match(/FROM "(\w+)"/)?.[1]);
    expect(tablas).toEqual(["Cliente", "CuentaCorriente", "OperacionCambio", "MovimientoCaja", "MovimientoCC", "MovimientoCaja",
      "MovimientoCC", "MovimientoCC", "MovimientoCC", "MovimientoCC", "MovimientoCC", "PlazoFijo", "PlazoFijo", "AuditLog"]);
    expect(Object.keys(creados)).toHaveLength(8);
  });

  it("H. revalidación bajo lock: si la reparación vigente cambia entre la lectura inicial y los locks → DENY, 0 writes", async () => {
    const db = crearDb();
    await db.apply();
    const tx = db.tx as unknown as { $queryRaw: (q: TemplateStringsArray, ...v: unknown[]) => Promise<unknown[]> };
    const orig = tx.$queryRaw;
    // Concurrente: otro proceso registra un rollback mientras este espera el lock del AuditLog.
    tx.$queryRaw = async (q, ...v) => {
      if (q.join("?").includes(`FROM "AuditLog"`)) db.t.auditLog.rows.push({ id: "rb-concurrente", accion: P1_02.accionRollback, entidadId: P1_02.clienteId, createdAt: new Date() });
      return orig(q, ...v);
    };
    const writes = espiarWrites(db);
    await expect(db.rollback()).rejects.toThrow(/ROLLBACK DENY: la reparación vigente cambió durante el rollback/);
    expect(writes()).toBe(0);
    vi.restoreAllMocks();
    tx.$queryRaw = orig;
  });
});
