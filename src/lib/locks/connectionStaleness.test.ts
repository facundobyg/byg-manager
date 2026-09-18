import { describe, it, expect } from "vitest";
import { STALENESS_MARGIN_MS, isConnectionStale, reduceHeartbeatOutcome, heartbeatConfirmsLease } from "./connectionStaleness";
import { LOCK_TTL_MS, LOCK_HEARTBEAT_MS } from "./constants";

describe("STALENESS_MARGIN_MS", () => {
  it("es LOCK_TTL_MS - LOCK_HEARTBEAT_MS (55s con las constantes actuales), sin tocarlas", () => {
    expect(STALENESS_MARGIN_MS).toBe(LOCK_TTL_MS - LOCK_HEARTBEAT_MS);
    expect(STALENESS_MARGIN_MS).toBe(55_000);
  });
});

describe("isConnectionStale", () => {
  it("G. antes del margen → no stale", () => {
    const lastConfirmedAt = 0;
    expect(isConnectionStale(lastConfirmedAt, STALENESS_MARGIN_MS - 1)).toBe(false);
  });

  it("G. exactamente en el margen (55s) → stale", () => {
    const lastConfirmedAt = 0;
    expect(isConnectionStale(lastConfirmedAt, STALENESS_MARGIN_MS)).toBe(true);
  });

  it("G. después del margen → stale", () => {
    const lastConfirmedAt = 0;
    expect(isConnectionStale(lastConfirmedAt, STALENESS_MARGIN_MS + 10_000)).toBe(true);
  });
});

describe("reduceHeartbeatOutcome", () => {
  it("F. OK desde EDITABLE → EDITABLE/ONLINE (refresca confirmación)", () => {
    expect(reduceHeartbeatOutcome("EDITABLE", { kind: "OK" })).toEqual({ mode: "EDITABLE", networkState: "ONLINE" });
  });

  it("H. OK desde CONNECTION_UNCERTAIN → vuelve a EDITABLE/ONLINE", () => {
    expect(reduceHeartbeatOutcome("CONNECTION_UNCERTAIN", { kind: "OK" })).toEqual({
      mode: "EDITABLE",
      networkState: "ONLINE",
    });
  });

  it("LOST desde EDITABLE → LOST", () => {
    expect(reduceHeartbeatOutcome("EDITABLE", { kind: "LOST" })).toEqual({ mode: "LOST", networkState: "ONLINE" });
  });

  it("I. LOST desde CONNECTION_UNCERTAIN → LOST", () => {
    expect(reduceHeartbeatOutcome("CONNECTION_UNCERTAIN", { kind: "LOST" })).toEqual({
      mode: "LOST",
      networkState: "ONLINE",
    });
  });

  it("G. ERROR desde EDITABLE → nunca LOST, mode se mantiene EDITABLE, solo networkState degrada", () => {
    const result = reduceHeartbeatOutcome("EDITABLE", { kind: "ERROR" });
    expect(result.mode).toBe("EDITABLE");
    expect(result.mode).not.toBe("LOST");
    expect(result.networkState).toBe("DEGRADED");
  });

  it("ERROR desde CONNECTION_UNCERTAIN → se mantiene CONNECTION_UNCERTAIN, nunca rebota solo a EDITABLE ni salta a LOST", () => {
    const result = reduceHeartbeatOutcome("CONNECTION_UNCERTAIN", { kind: "ERROR" });
    expect(result.mode).toBe("CONNECTION_UNCERTAIN");
    expect(result.networkState).toBe("DEGRADED");
  });

  it("ERROR nunca equivale a LOST (ni desde EDITABLE ni desde CONNECTION_UNCERTAIN)", () => {
    expect(reduceHeartbeatOutcome("EDITABLE", { kind: "ERROR" }).mode).not.toBe("LOST");
    expect(reduceHeartbeatOutcome("CONNECTION_UNCERTAIN", { kind: "ERROR" }).mode).not.toBe("LOST");
  });
});

describe("heartbeatConfirmsLease", () => {
  it("OK confirma el lease", () => {
    expect(heartbeatConfirmsLease({ kind: "OK" })).toBe(true);
  });

  it("ERROR nunca confirma el lease", () => {
    expect(heartbeatConfirmsLease({ kind: "ERROR" })).toBe(false);
  });

  it("LOST nunca confirma el lease", () => {
    expect(heartbeatConfirmsLease({ kind: "LOST" })).toBe(false);
  });
});

describe("regresión — heartbeats fallidos repetidos no mueven la referencia de staleness (bug real, SESIÓN 16 MICRO REVIEW)", () => {
  // Este es el escenario exacto que ConfigLockProvider.runHeartbeat() debe
  // reproducir: solo heartbeatConfirmsLease() decide si se refresca
  // lastConfirmedAt — reduceHeartbeatOutcome().mode NUNCA debe usarse para
  // esa decisión (antes del fix, el caller confundía "mode sigue mostrando
  // EDITABLE" con "hubo una confirmación nueva", y errores repetidos
  // reiniciaban el reloj de staleness indefinidamente).
  it("T0 confirmado; ERROR en T+25 y T+50 no refrescan; a T+55 desde T0 ya es stale", () => {
    const lastConfirmedAt = 0; // T0 — última confirmación REAL.

    // T+25: ERROR.
    expect(heartbeatConfirmsLease({ kind: "ERROR" })).toBe(false);
    // T+50: ERROR de nuevo.
    expect(heartbeatConfirmsLease({ kind: "ERROR" })).toBe(false);
    // Ningún ERROR confirmó nada — lastConfirmedAt sigue siendo T0 en los
    // dos chequeos siguientes, tal como debe hacerlo el caller real.
    expect(isConnectionStale(lastConfirmedAt, 25_000)).toBe(false);
    expect(isConnectionStale(lastConfirmedAt, 50_000)).toBe(false);
    // A T+55 desde la confirmación real (T0, nunca movida) ya es stale.
    expect(isConnectionStale(lastConfirmedAt, 55_000)).toBe(true);
  });

  it("un OK intermedio si REALMENTE ocurriera sí movería la referencia (contraste)", () => {
    let lastConfirmedAt = 0;
    // T+25: OK real — este sí confirma y el caller SÍ debe refrescar.
    expect(heartbeatConfirmsLease({ kind: "OK" })).toBe(true);
    lastConfirmedAt = 25_000;
    // Con la referencia movida a T+25, a T+55 (30s después) todavía no es stale.
    expect(isConnectionStale(lastConfirmedAt, 55_000)).toBe(false);
    // Recién a T+80 (55s después de T+25) sería stale.
    expect(isConnectionStale(lastConfirmedAt, 80_000)).toBe(true);
  });
});
