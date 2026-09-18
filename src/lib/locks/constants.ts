// A3.1.1 — constantes del motor de OperationalLock.

/** Tiempo de vida de un lease sin heartbeat antes de considerarse expirado. */
export const LOCK_TTL_MS = 80_000;

/** Cadencia esperada de heartbeat del cliente (debe ser << LOCK_TTL_MS). */
export const LOCK_HEARTBEAT_MS = 25_000;

/** Opciones de interactive transaction para operaciones del motor de locks. */
export const LOCK_TX_OPTIONS = { maxWait: 5000, timeout: 8000 } as const;
