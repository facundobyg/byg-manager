// A3.1.1 — normalización de lock keys y namespaces de área acordados.
import { LockKeyError, InvalidClientIdError } from "./errors";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** ownerClientId viene del browser: se valida como UUID estricto siempre. */
export function assertValidClientId(ownerClientId: unknown): asserts ownerClientId is string {
  if (!isValidUuid(ownerClientId)) throw new InvalidClientIdError();
}

/**
 * ownerUserId debe llegar únicamente desde contexto autenticado server-side
 * (sesión), nunca como dato confiable del browser. Acá solo se valida forma.
 */
export function assertValidOwnerUserId(ownerUserId: unknown): asserts ownerUserId is string {
  if (typeof ownerUserId !== "string" || ownerUserId.trim().length === 0) {
    throw new LockKeyError("ownerUserId inválido: se espera un string no vacío.");
  }
}

/**
 * trim → rechaza vacíos → dedupe → orden lexicográfico determinístico.
 * Todo acquire/require/takeover multi-lock pasa por acá: nunca se conserva
 * el orden recibido del caller (es la base de la prevención de deadlocks:
 * dos transacciones concurrentes con sets solapados siempre procesan las
 * keys compartidas en el mismo orden global).
 */
export function normalizeLockKeys(rawKeys: readonly string[]): string[] {
  if (!Array.isArray(rawKeys) || rawKeys.length === 0) {
    throw new LockKeyError("Se requiere al menos un lockKey.");
  }
  const trimmed = rawKeys.map((key) => (typeof key === "string" ? key.trim() : ""));
  if (trimmed.some((key) => key.length === 0)) {
    throw new LockKeyError("lockKey vacío no permitido.");
  }
  const deduped = Array.from(new Set(trimmed));
  return deduped.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** "CAJA:abc123" → "CAJA". Keys estáticas (sin ":") son su propia área. */
export function deriveLockArea(lockKey: string): string {
  const idx = lockKey.indexOf(":");
  return idx === -1 ? lockKey : lockKey.slice(0, idx);
}

// ── Namespaces acordados ────────────────────────────────────────────────────
// Solo infraestructura: builders de keys, sin cablear a Server Actions todavía.
export const LOCK_AREA = {
  PF: "PF",
  CC: "CC",
  CLIENTES: "CLIENTES",
  OPERATIVA: "OPERATIVA",
  CARTERA: "CARTERA",
  BOLSA: "BOLSA",
  BIND: "BIND",
  CONFIG: "CONFIG",
} as const;

export type StaticLockArea = (typeof LOCK_AREA)[keyof typeof LOCK_AREA];

const LOCK_AREA_PREFIX_CAJA = "CAJA";
const LOCK_AREA_PREFIX_BIND_BATCH = "BIND_BATCH";

/** Key dinámica por caja: "CAJA:{cajaId}". */
export function cajaLockKey(cajaId: string): string {
  return `${LOCK_AREA_PREFIX_CAJA}:${cajaId}`;
}

/** Key dinámica por batch de importación Bind: "BIND_BATCH:{batchId}". */
export function bindBatchLockKey(batchId: string): string {
  return `${LOCK_AREA_PREFIX_BIND_BATCH}:${batchId}`;
}
