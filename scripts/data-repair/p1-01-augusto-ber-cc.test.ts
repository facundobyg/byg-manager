import { describe, it, expect, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { tabla } from "../../src/lib/caja/fake-tx";
import { revertirOperacionCCTx } from "../../src/lib/cc/integridad.service";
import { refOperacion, saldoReconstruido } from "../../src/lib/cc/integridad";
import { P1_01, P101Error, aplicarTx, descripcionReparacion, notasPfCanonicas, postcheck, precheck, rollbackTx } from "./p1-01-augusto-ber-cc";

// P1-01 — reparación histórica de la CC USD de Augusto Ber, sobre una DB falsa en memoria
// con el estado EXACTO auditado en PROD / TEST V5 (2026-11-04).

type Row = Record<string, unknown>;
const D = (v: Decimal.Value) => new Decimal(v);
const ADMIN = "u-admin";
const SOCIO = "u-socio";

function movimientosAuditados(): Row[] {
  // 322 movimientos, reconstruido = 38.491.
  const out: Row[] = [
    { id: "m-a", cuentaCorrienteId: P1_01.cuentaId, fecha: new Date("2016-05-09"), tipo: "INGRESO", monto: D(38000), descripcion: "INGRESO" },
    { id: "m-b", cuentaCorrienteId: P1_01.cuentaId, fecha: new Date("2026-05-12"), tipo: "INGRESO", monto: D(491), descripcion: "AJUSTE CORRECCIÓN BACKUP - faltante importado" },
  ];
  for (let i = 0; i < 160; i++) {
    out.push({ id: `m-i${i}`, cuentaCorrienteId: P1_01.cuentaId, fecha: new Date(Date.UTC(2017, 0, 1 + i)), tipo: "INGRESO", monto: D(10), descripcion: "INGRESO" });
    out.push({ id: `m-e${i}`, cuentaCorrienteId: P1_01.cuentaId, fecha: new Date(Date.UTC(2017, 0, 1 + i)), tipo: "EGRESO", monto: D(10), descripcion: "RETIRO" });
  }
  return out;
}

function crearDb(over: { saldo?: number; sinPf?: boolean; pf?: Row; extraMovs?: Row[]; audit?: Row[] } = {}) {
  const t = {
    cuentaCorriente: tabla([{ id: P1_01.cuentaId, clienteId: P1_01.clienteId, moneda: "USD", saldo: D(over.saldo ?? 33491), updatedAt: new Date("2026-08-12T20:35:00.505Z") }]),
    movimientoCC: tabla([...movimientosAuditados(), ...(over.extraMovs ?? [])], { operacionCambioId: null, userId: null }),
    plazoFijo: tabla(over.sinPf ? [] : [{
      id: P1_01.pfId, clienteId: P1_01.clienteId, moneda: "USD", capital: D(5000), saldoActual: D(5000), tasaAnual: D(5), estado: "ACTIVO",
      fechaInicio: new Date("2026-08-12T00:00:00Z"), fechaVencimiento: new Date("2027-08-12T00:00:00Z"), notas: null,
      createdAt: new Date("2026-08-12T20:35:00.275Z"), updatedAt: new Date("2026-08-12T20:35:00.274Z"), ...(over.pf ?? {}),
    }]),
    plazoFijoMovimiento: tabla([]),
    auditLog: tabla(over.audit ?? []),
    user: tabla([{ id: ADMIN, role: "ADMIN", activo: true }, { id: SOCIO, role: "SOCIO", activo: true }]),
    movimientoCaja: tabla([
      { id: "caja-1", cajaId: "oficina", tipo: "ENTRADA", moneda: "USD", monto: D(5000), confirmado: true, anulado: false, descripcion: "[Cambio x] Compra divisa" },
    ], { confirmado: false, anulado: false }),
  };
  const locks: string[] = [];
  const tx = { ...t, $queryRaw: async (s: TemplateStringsArray) => { locks.push(s.join("?")); return []; } };
  /** Transacción simulada: si la función lanza, se restaura TODO (semántica de ROLLBACK). */
  const $transaction = async <T,>(fn: (x: never) => Promise<T>): Promise<T> => {
    const snap = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.rows.map((r) => ({ ...r }))]));
    try { return await fn(tx as never); } catch (e) {
      for (const [k, v] of Object.entries(t)) v.rows.splice(0, v.rows.length, ...snap[k]);
      throw e;
    }
  };
  const foto = () => JSON.stringify(Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.rows])));
  return { t, tx: tx as never, locks, $transaction, foto };
}

const reconstruido = (t: ReturnType<typeof crearDb>["t"]) =>
  saldoReconstruido(t.movimientoCC.rows.filter((m) => m.cuentaCorrienteId === P1_01.cuentaId) as never).toString();

describe("P1-01 — precheck", () => {
  it("1. estado auditado → PASS", async () => {
    const { tx } = crearDb();
    const r = await precheck(tx);
    expect(r.chequeos.filter((c) => !c.ok)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.estado).toMatchObject({ saldo: "33491", reconstruido: "38491", diferencia: "-5000", movimientos: 322 });
  });

  it("2. saldo inesperado → aborta sin escribir", async () => {
    const db = crearDb({ saldo: 28491 });
    const antes = db.foto();
    expect((await precheck(db.tx)).ok).toBe(false);
    await expect(db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }))).rejects.toThrow(/PRECHECK FAIL.*saldo almacenado/);
    expect(db.foto()).toBe(antes);
  });

  it("3. reconstruido inesperado → aborta", async () => {
    const db = crearDb({ extraMovs: [{ id: "m-x", cuentaCorrienteId: P1_01.cuentaId, fecha: new Date("2026-09-01"), tipo: "INGRESO", monto: D(1), descripcion: "x" }] });
    await expect(db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }))).rejects.toThrow(/reconstruido = 38491/);
  });

  it("4. PF faltante → aborta", async () => {
    const db = crearDb({ sinPf: true });
    await expect(db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }))).rejects.toThrow(/PF existe/);
  });

  it.each([
    ["capital", { capital: D(4000) }], ["saldoActual", { saldoActual: D(4900) }], ["estado", { estado: "CANCELADO" }],
    ["fecha", { fechaInicio: new Date("2026-08-13T00:00:00Z") }], ["notas", { notas: "PF desde CC | op:otro" }], ["moneda", { moneda: "ARS" }],
  ])("5. PF modificado (%s) → aborta", async (_k, pf) => {
    const db = crearDb({ pf });
    const antes = db.foto();
    await expect(db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }))).rejects.toThrow(P101Error);
    expect(db.foto()).toBe(antes);
  });

  it("ejecutor no ADMIN → aborta", async () => {
    const db = crearDb();
    await expect(db.$transaction((tx) => aplicarTx(tx, { ejecutorId: SOCIO }))).rejects.toThrow(/ADMIN/);
  });
});

describe("P1-01 — apply", () => {
  it("6. reparación existente → segundo apply DENY (idempotente)", async () => {
    const db = crearDb();
    await db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }));
    const despues = db.foto();
    await expect(db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }))).rejects.toThrow(/sin reparación P1-01 previa|movimientos = 322/);
    expect(db.foto()).toBe(despues);
  });

  it("6b. 'PF egreso | op:' equivalente o AuditLog vigente → DENY", async () => {
    const a = crearDb({ extraMovs: [{ id: "m-pf", cuentaCorrienteId: P1_01.cuentaId, fecha: new Date("2026-08-12"), tipo: "EGRESO", monto: D(0.01), descripcion: "PF egreso | op:abc" }] });
    expect((await precheck(a.tx)).chequeos.find((c) => c.chequeo.startsWith("sin 'PF egreso"))?.ok).toBe(false);
    const b = crearDb({ audit: [{ id: "a1", accion: P1_01.accion, entidadId: P1_01.cuentaId }] });
    await expect(b.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }))).rejects.toThrow(/AuditLog REPARACION_CC_HISTORICA vigente/);
  });

  it("7–12. crea 1 MovimientoCC, saldo intacto, reconstruido 38.491 → 33.491, PF solo notas, caja intacta, AuditLog en la misma tx", async () => {
    const db = crearDb();
    const pfAntes = { ...db.t.plazoFijo.rows[0] };
    const cajaAntes = JSON.stringify(db.t.movimientoCaja.rows);
    const saldoAntes = db.t.cuentaCorriente.rows[0].saldo;
    const auditSpy = vi.spyOn(db.t.auditLog, "create");
    expect(reconstruido(db.t)).toBe("38491");

    const r = await db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN, ref: "ref-p101", movimientoId: "mov-p101" }));

    // 7. exactamente 1 movimiento nuevo, con el formato canónico
    const nuevos = db.t.movimientoCC.rows.filter((m) => String(m.descripcion).includes(P1_01.marca));
    expect(nuevos).toHaveLength(1);
    expect(db.t.movimientoCC.rows).toHaveLength(323);
    expect(nuevos[0]).toMatchObject({ id: "mov-p101", tipo: "EGRESO", cuentaCorrienteId: P1_01.cuentaId, descripcion: descripcionReparacion("ref-p101"), operacionCambioId: null, userId: ADMIN });
    expect(D(nuevos[0].monto as Decimal.Value).eq(5000)).toBe(true);
    expect((nuevos[0].fecha as Date).toISOString().slice(0, 10)).toBe("2026-08-12");
    expect(String(nuevos[0].descripcion).startsWith("PF egreso | op:ref-p101 | ")).toBe(true);
    // 8. saldo almacenado NO cambia (mismo objeto, ni siquiera reescrito)
    expect(db.t.cuentaCorriente.rows[0].saldo).toBe(saldoAntes);
    expect(String(db.t.cuentaCorriente.rows[0].saldo)).toBe("33491");
    // 9. reconstruido 38.491 → 33.491
    expect(reconstruido(db.t)).toBe("33491");
    // 10. PF: solo cambian las notas
    expect(db.t.plazoFijo.rows[0]).toEqual({ ...pfAntes, notas: notasPfCanonicas("ref-p101") });
    expect(db.t.plazoFijo.rows).toHaveLength(1);
    // 11. caja intacta
    expect(JSON.stringify(db.t.movimientoCaja.rows)).toBe(cajaAntes);
    // 12. AuditLog en la misma tx, con la trazabilidad pedida
    expect(auditSpy).toHaveBeenCalledTimes(1);
    expect(db.t.auditLog.rows).toHaveLength(1);
    const a = db.t.auditLog.rows[0] as { accion: string; entidadId: string; userId: string; datosNuevos: Record<string, string>; datosPrevios: Record<string, unknown> };
    expect(a).toMatchObject({ accion: "REPARACION_CC_HISTORICA", entidad: "CuentaCorriente", entidadId: P1_01.cuentaId, userId: ADMIN });
    expect(a.datosNuevos).toMatchObject({
      cuentaId: P1_01.cuentaId, clienteId: P1_01.clienteId, plazoFijoId: P1_01.pfId, movimientoId: "mov-p101", operationRef: "ref-p101",
      saldoAlmacenadoAntes: "33491", saldoAlmacenadoDespues: "33491", saldoReconstruidoAntes: "38491", saldoReconstruidoDespues: "33491", ejecutorId: ADMIN,
    });
    expect(a.datosNuevos.incidente).toContain("4062b54");
    expect(a.datosNuevos.incidente).toContain(P1_01.auditOriginal);
    expect(a.datosPrevios).toMatchObject({ saldoAlmacenado: "33491", saldoReconstruido: "38491", movimientos: 322, pfNotas: null });
    // locks de cuenta y PF
    expect(r.post.ok).toBe(true);
    expect((await postcheck(db.tx)).ok).toBe(true);
  });

  it("locks: cuenta y PF bloqueados antes de escribir", async () => {
    const db = crearDb();
    await db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }));
    expect(db.locks[0]).toMatch(/FROM "CuentaCorriente" WHERE id IN/);
    expect(db.locks[1]).toMatch(/FROM "PlazoFijo" WHERE id =/);
  });

  it("13. fallo del AuditLog → ROLLBACK total (nada queda escrito)", async () => {
    const db = crearDb();
    const antes = db.foto();
    vi.spyOn(db.t.auditLog, "create").mockRejectedValueOnce(new Error("audit caído"));
    const createMov = vi.spyOn(db.t.movimientoCC, "create");
    await expect(db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }))).rejects.toThrow(/audit caído/);
    expect(createMov).toHaveBeenCalledTimes(1); // se había escrito dentro de la tx…
    expect(db.foto()).toBe(antes); // …y la tx lo deshizo entero
  });

  it("14. la estructura resultante es la de un PF desde CC: la reversa canónica la reconoce", async () => {
    const db = crearDb();
    const { operationRef } = await db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN, ref: "ref-rev" }));
    expect(refOperacion(db.t.plazoFijo.rows[0].notas as string)).toBe(operationRef);
    // Solo en el fake: demuestra compatibilidad, la reparación NUNCA ejecuta la reversa.
    const r = await revertirOperacionCCTx(db.tx, { operationRef, fecha: new Date("2026-11-04") });
    expect(r).toMatchObject({ plazoFijoId: P1_01.pfId, reversos: 1, reversosCaja: 0 });
    expect(db.t.plazoFijo.rows[0]).toMatchObject({ estado: "CANCELADO" });
    expect(String(db.t.cuentaCorriente.rows[0].saldo)).toBe("38491"); // CC restituida
    expect(reconstruido(db.t)).toBe("38491"); // y el historial sigue cuadrando
  });
});

describe("P1-01 — rollback", () => {
  it("15. rollback restaura el estado previo (saldo intacto, 322 movs, reconstruido 38.491, notas NULL, caja intacta)", async () => {
    const db = crearDb();
    const original = JSON.parse(db.foto()) as Record<string, Row[]>;
    await db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }));
    const r = await db.$transaction((tx) => rollbackTx(tx, { ejecutorId: ADMIN }));
    expect(r.estado).toMatchObject({ saldo: "33491", reconstruido: "38491", movimientos: 322, reparaciones: [], auditAplicadas: 1, auditRollbacks: 1 });
    expect(db.t.plazoFijo.rows[0].notas).toBeNull();
    const ahora = JSON.parse(db.foto()) as Record<string, Row[]>;
    for (const k of ["cuentaCorriente", "movimientoCC", "plazoFijo", "plazoFijoMovimiento", "movimientoCaja", "user"]) expect(ahora[k]).toEqual(original[k]);
    expect(db.t.auditLog.rows.map((a) => a.accion)).toEqual([P1_01.accion, P1_01.accionRollback]);
    // tras el rollback, la reparación puede volver a aplicarse (precheck vigente = 0)
    expect((await precheck(db.tx)).ok).toBe(true);
  });

  it("16. segundo rollback → DENY sin escribir", async () => {
    const db = crearDb();
    await db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }));
    await db.$transaction((tx) => rollbackTx(tx, { ejecutorId: ADMIN }));
    const antes = db.foto();
    await expect(db.$transaction((tx) => rollbackTx(tx, { ejecutorId: ADMIN }))).rejects.toThrow(/ROLLBACK DENY/);
    expect(db.foto()).toBe(antes);
  });

  it("rollback sin reparación aplicada → DENY", async () => {
    const db = crearDb();
    await expect(db.$transaction((tx) => rollbackTx(tx, { ejecutorId: ADMIN }))).rejects.toThrow(/ROLLBACK DENY/);
  });

  it("rollback con hecho posterior dependiente (reversa de la operación) → DENY", async () => {
    const db = crearDb();
    const { operationRef } = await db.$transaction((tx) => aplicarTx(tx, { ejecutorId: ADMIN }));
    db.t.movimientoCC.rows.push({ id: "rev", cuentaCorrienteId: "otra", fecha: new Date(), tipo: "INGRESO", monto: D(5000), descripcion: `REVERSO EGRESO | op:z | ref:${operationRef}` });
    await expect(db.$transaction((tx) => rollbackTx(tx, { ejecutorId: ADMIN }))).rejects.toThrow(/dependiente/);
  });
});
