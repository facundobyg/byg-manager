import { describe, it, expect, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { tabla } from "../caja/fake-tx";

// P1-03A / P1-03A.1 — write path canónico del TC: Config (valor + updatedAt real) + vigencia en
// TipoCambio con FECHA EFECTIVA ARGENTINA + AuditLog, en UNA transacción. La autorización
// (configuracion:editar, solo ADMIN por defecto: Francisco/Augusto DENY) se prueba con la
// matriz real en src/lib/auth/beta-3usuarios.test.ts y el wiring en configuracion/actions.test.ts.

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/fecha-negocio", async () => await import("../fecha-negocio"));
import { actualizarTcBlueTx, setTCBlue, TcUpdateError } from "./config.service";

type Row = Record<string, unknown>;
const d = (s: string) => new Date(`${s}T00:00:00Z`);
const CONFIG_UPDATED_LEGACY = new Date("2026-05-08T21:21:52.889Z");

function crearDb() {
  const t = {
    config: tabla([{ id: "cfg", clave: "tc_blue", valor: "1550", updatedAt: CONFIG_UPDATED_LEGACY }]),
    tipoCambio: tabla([
      { id: "tc-0416", monedaOrigen: "ARS", monedaDestino: "USD", valor: new Decimal(1250), fecha: d("2026-04-16") },
      { id: "tc-0506", monedaOrigen: "ARS", monedaDestino: "USD", valor: new Decimal(1250), fecha: d("2026-05-06") },
      { id: "tc-0918", monedaOrigen: "ARS", monedaDestino: "USD", valor: new Decimal(1550), fecha: d("2026-09-18") },
      { id: "tc-eur", monedaOrigen: "EUR", monedaDestino: "USD", valor: new Decimal(1.08), fecha: d("2026-05-06") },
    ]),
    auditLog: tabla([] as Row[]),
  };
  /** $transaction falso: snapshot y restauración total si el callback falla. */
  const $transaction = async <T,>(fn: (tx: never) => Promise<T>): Promise<T> => {
    const snap = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.rows.map((r) => ({ ...r }))]));
    try { return await fn(t as never); } catch (e) {
      for (const [k, v] of Object.entries(t)) v.rows.splice(0, v.rows.length, ...snap[k]);
      throw e;
    }
  };
  const foto = () => JSON.stringify(Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.rows])));
  const filasDe = (f: string) => t.tipoCambio.rows.filter((x) => x.monedaOrigen === "ARS" && (x.fecha as Date).getTime() === d(f).getTime());
  return { t, $transaction, foto, filasDe };
}
// Instantes UTC explícitos (independientes del TZ del proceso).
const AHORA = new Date("2026-11-15T15:30:00Z"); // 12:30 ART del 15/11

describe("P1-03A — setTCBlue / actualizarTcBlueTx atómico", () => {
  it("Config.tc_blue = nuevo valor y updatedAt = timestamp real (ya no queda el updatedAt legacy)", async () => {
    const db = crearDb();
    await db.$transaction((tx) => setTCBlue(1600, tx, { userId: "u-admin", ahora: AHORA }));
    expect(db.t.config.rows[0]).toMatchObject({ valor: "1600", updatedAt: AHORA });
  });

  it("crea TipoCambio ARS→USD con la fecha efectiva y deja la historia anterior intacta", async () => {
    const db = crearDb();
    const antes = db.t.tipoCambio.rows.map((r) => ({ ...r }));
    const r = await db.$transaction((tx) => setTCBlue(1600, tx, { userId: "u-admin", ahora: AHORA }));
    expect(r).toMatchObject({ fechaEfectiva: "2026-11-15", anterior: "1550" });
    const hoy = db.filasDe("2026-11-15");
    expect(hoy).toHaveLength(1);
    expect(String(hoy[0].valor)).toBe("1600");
    expect(db.t.tipoCambio.rows.filter((x) => x.id !== hoy[0].id)).toEqual(antes); // 18/09, 06/05, 16/04, EUR: sin tocar
  });

  it("AuditLog ACTUALIZAR_TIPO_CAMBIO: usuario, timestamp real, fecha ART, anterior, nuevo, par, fila, origen", async () => {
    const db = crearDb();
    const r = await db.$transaction((tx) => setTCBlue(1600, tx, { userId: "u-admin", ahora: AHORA }));
    expect(db.t.auditLog.rows).toHaveLength(1);
    const a = db.t.auditLog.rows[0] as { userId: string; accion: string; entidad: string; entidadId: string; datosPrevios: Row; datosNuevos: Row };
    expect(a).toMatchObject({ userId: "u-admin", accion: "ACTUALIZAR_TIPO_CAMBIO", entidad: "TipoCambio", entidadId: r.tipoCambioId });
    expect(a.datosPrevios).toEqual({
      tcVigenteAnterior: { valor: "1550", fechaEfectiva: "2026-09-18", tipoCambioId: "tc-0918" },
      configTcBlue: { valor: "1550", updatedAt: CONFIG_UPDATED_LEGACY.toISOString() },
    });
    expect(a.datosNuevos).toMatchObject({
      valor: "1600", monedaOrigen: "ARS", monedaDestino: "USD", fechaEfectiva: "2026-11-15",
      zonaFechaEfectiva: "America/Argentina/Buenos_Aires", timestamp: AHORA.toISOString(), source: "MANUAL",
      tipoCambioId: r.tipoCambioId, mismoDia: false,
    });
  });

  it("después de las 21:00 ART (2026-11-12T00:30Z = 11/11 21:30 ART): fecha efectiva 11/11, timestamp real UTC", async () => {
    const db = crearDb();
    const instante = new Date("2026-11-12T00:30:00Z");
    const r = await db.$transaction((tx) => setTCBlue(1600, tx, { userId: "u-admin", ahora: instante }));
    expect(r.fechaEfectiva).toBe("2026-11-11");
    expect(db.filasDe("2026-11-11")).toHaveLength(1);
    expect(db.filasDe("2026-11-12")).toHaveLength(0);
    expect(db.t.config.rows[0].updatedAt).toEqual(instante);
    expect((db.t.auditLog.rows[0].datosNuevos as Row).timestamp).toBe("2026-11-12T00:30:00.000Z");
  });

  it("cruce de medianoche ART: 23:59:59 ART → día 11; 00:00:00 ART → día 12 (dos vigencias distintas)", async () => {
    const db = crearDb();
    await db.$transaction((tx) => setTCBlue(1600, tx, { userId: "u-admin", ahora: new Date("2026-11-12T02:59:59Z") }));
    await db.$transaction((tx) => setTCBlue(1700, tx, { userId: "u-admin", ahora: new Date("2026-11-12T03:00:00Z") }));
    expect(String(db.filasDe("2026-11-11")[0].valor)).toBe("1600");
    expect(String(db.filasDe("2026-11-12")[0].valor)).toBe("1700");
    expect((db.t.auditLog.rows[1].datosPrevios as { tcVigenteAnterior: Row }).tcVigenteAnterior).toMatchObject({ valor: "1600", fechaEfectiva: "2026-11-11" });
  });

  it("CASO D: mismo día ARGENTINO en días UTC distintos (19:00 y 22:30 ART del 11/11): UNA fila 11/11 = 1650 y 2 AuditLog", async () => {
    const db = crearDb();
    await db.$transaction((tx) => setTCBlue(1600, tx, { userId: "u-admin", ahora: new Date("2026-11-11T22:00:00Z") })); // 19:00 ART
    await db.$transaction((tx) => setTCBlue(1650, tx, { userId: "u-admin", ahora: new Date("2026-11-12T01:30:00Z") })); // 22:30 ART (12/11 UTC)
    expect(db.filasDe("2026-11-11")).toHaveLength(1);
    expect(String(db.filasDe("2026-11-11")[0].valor)).toBe("1650");
    expect(db.filasDe("2026-11-12")).toHaveLength(0);
    expect(db.t.auditLog.rows).toHaveLength(2);
    const [a1, a2] = db.t.auditLog.rows as { datosPrevios: { tcVigenteAnterior: Row }; datosNuevos: Row }[];
    expect(a1.datosPrevios.tcVigenteAnterior).toMatchObject({ valor: "1550" });
    expect(a1.datosNuevos).toMatchObject({ valor: "1600", fechaEfectiva: "2026-11-11", mismoDia: false });
    expect(a2.datosPrevios.tcVigenteAnterior).toMatchObject({ valor: "1600", fechaEfectiva: "2026-11-11" });
    expect(a2.datosNuevos).toMatchObject({ valor: "1650", fechaEfectiva: "2026-11-11", mismoDia: true });
  });

  it("Config y TC vigente quedan CONSISTENTES tras cada actualización", async () => {
    const db = crearDb();
    for (const [v, t] of [[1600, "2026-11-11T22:00:00Z"], [1650, "2026-11-12T01:30:00Z"], [1700, "2026-11-13T15:00:00Z"]] as const) {
      await db.$transaction((tx) => setTCBlue(v, tx, { userId: "u-admin", ahora: new Date(t) }));
      const ars = db.t.tipoCambio.rows.filter((x) => x.monedaOrigen === "ARS").sort((a, b) => (b.fecha as Date).getTime() - (a.fecha as Date).getTime());
      expect(new Decimal(db.t.config.rows[0].valor as string).eq(ars[0].valor as Decimal)).toBe(true);
    }
  });

  it("sin usuario → TcUpdateError y 0 writes (no se inventa usuario)", async () => {
    const db = crearDb();
    const antes = db.foto();
    await expect(db.$transaction((tx) => actualizarTcBlueTx(tx, { valor: 1600, userId: "", origen: "MANUAL", ahora: AHORA }))).rejects.toThrow(TcUpdateError);
    expect(db.foto()).toBe(antes);
  });

  it("TC inválido (0 / negativo) → TcUpdateError y 0 writes", async () => {
    const db = crearDb();
    const antes = db.foto();
    for (const v of [0, -5]) await expect(db.$transaction((tx) => actualizarTcBlueTx(tx, { valor: v, userId: "u", origen: "MANUAL", ahora: AHORA }))).rejects.toThrow(TcUpdateError);
    expect(db.foto()).toBe(antes);
  });

  it("fallo del AuditLog → ROLLBACK total (Config y TipoCambio sin cambios)", async () => {
    const db = crearDb();
    const antes = db.foto();
    vi.spyOn(db.t.auditLog, "create").mockRejectedValueOnce(new Error("audit caído"));
    await expect(db.$transaction((tx) => setTCBlue(1600, tx, { userId: "u-admin", ahora: AHORA }))).rejects.toThrow(/audit caído/);
    expect(db.foto()).toBe(antes);
  });

  it("fallo del upsert de TipoCambio → ROLLBACK total (Config no queda cambiado, sin AuditLog)", async () => {
    const db = crearDb();
    const antes = db.foto();
    vi.spyOn(db.t.tipoCambio, "upsert").mockRejectedValueOnce(new Error("unique roto"));
    await expect(db.$transaction((tx) => setTCBlue(1600, tx, { userId: "u-admin", ahora: AHORA }))).rejects.toThrow(/unique roto/);
    expect(db.foto()).toBe(antes);
    expect(db.t.auditLog.rows).toHaveLength(0);
  });

  it("atomicidad: los 3 writes ocurren dentro de la misma tx en orden Config → TipoCambio → AuditLog", async () => {
    const db = crearDb();
    const orden: string[] = [];
    for (const [k, m] of [["config", "upsert"], ["tipoCambio", "upsert"], ["auditLog", "create"]] as const) {
      const orig = (db.t[k] as unknown as Record<string, (...a: unknown[]) => unknown>)[m].bind(db.t[k]);
      vi.spyOn(db.t[k] as never, m as never).mockImplementation(((...a: unknown[]) => { orden.push(k); return orig(...a); }) as never);
    }
    await db.$transaction((tx) => setTCBlue(1600, tx, { userId: "u-admin", ahora: AHORA }));
    expect(orden).toEqual(["config", "tipoCambio", "auditLog"]);
  });
});
