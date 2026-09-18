// A3.1.2.1 (corrección lifecycle) — protección UX puramente client-side
// contra "EDITABLE indefinido sin confirmación del servidor" (corte de red
// sostenido, o notebook que duerme y despierta mucho después del último
// heartbeat exitoso). NUNCA decide ownership real del lease — esa autoridad
// sigue siendo exclusivamente Postgres (clock_timestamp() + heartbeatLocks,
// ver src/lib/locks/engine.ts, sin modificar). Esto solo decide cuándo la UI
// deja de MOSTRARSE como editable sin una confirmación reciente.

import { LOCK_TTL_MS, LOCK_HEARTBEAT_MS } from "./constants";

/** Margen conservador: dos ciclos de heartbeat de colchón antes de que el
 * lease pueda haber vencido realmente en el servidor (80s - 25s = 55s). No
 * toca LOCK_TTL_MS ni LOCK_HEARTBEAT_MS, ambos ya cerrados en A3.1.1. */
export const STALENESS_MARGIN_MS = LOCK_TTL_MS - LOCK_HEARTBEAT_MS;

/** true si pasó más de STALENESS_MARGIN_MS desde la última confirmación exitosa. */
export function isConnectionStale(lastConfirmedAt: number, now: number): boolean {
  return now - lastConfirmedAt >= STALENESS_MARGIN_MS;
}

/** Modos desde los que tiene sentido interpretar el resultado de un heartbeat. */
export type LeaseMode = "EDITABLE" | "CONNECTION_UNCERTAIN";

export type HeartbeatOutcome = { kind: "OK" } | { kind: "LOST" } | { kind: "ERROR" };

export interface HeartbeatReduction {
  mode: "EDITABLE" | "CONNECTION_UNCERTAIN" | "LOST";
  networkState: "ONLINE" | "DEGRADED";
}

/**
 * Reduce el resultado de UN heartbeat al próximo estado de UI. Puro: no
 * toca timers, refs ni el servidor — el caller es responsable de refrescar
 * `lastConfirmedAt`/rearmar el timer de staleness cuando el modo resultante
 * es "EDITABLE".
 *
 * Invariante central: un error de transporte (ERROR) nunca cambia `mode`
 * por sí solo — el backend es la única autoridad sobre "perdido". Solo un
 * "LOST" explícito del servidor, o el propio timer de staleness (ver
 * isConnectionStale), pueden degradar el modo.
 *
 * Importante: que `mode` siga siendo "EDITABLE" en el resultado de un
 * ERROR NO significa que hubo una confirmación nueva — es solo lo que debe
 * MOSTRAR la UI mientras tanto. El caller nunca debe usar `mode` acá para
 * decidir si refrescar `lastConfirmedAt`/rearmar el watchdog de staleness;
 * para eso existe exclusivamente `heartbeatConfirmsLease`.
 */
export function reduceHeartbeatOutcome(currentMode: LeaseMode, outcome: HeartbeatOutcome): HeartbeatReduction {
  switch (outcome.kind) {
    case "OK":
      return { mode: "EDITABLE", networkState: "ONLINE" };
    case "LOST":
      return { mode: "LOST", networkState: "ONLINE" };
    case "ERROR":
      return { mode: currentMode, networkState: "DEGRADED" };
  }
}

/**
 * true únicamente cuando el heartbeat confirma que el lease sigue vigente
 * — la ÚNICA señal que puede refrescar `lastConfirmedAt`/rearmar el
 * watchdog de staleness. Un ERROR de transporte NUNCA confirma nada, aunque
 * `reduceHeartbeatOutcome` pueda seguir mostrando "EDITABLE" para ese mismo
 * resultado (ver comentario arriba) — son dos decisiones distintas a
 * propósito: una es "qué mostrar", la otra es "hubo confirmación real".
 */
export function heartbeatConfirmsLease(outcome: HeartbeatOutcome): boolean {
  return outcome.kind === "OK";
}
