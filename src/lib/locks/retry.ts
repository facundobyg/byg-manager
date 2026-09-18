// A3.1.1 — retry acotado para deadlock/serialization failures de Postgres.
//
// Prisma 6.19.3 no expone el SQLSTATE de forma uniforme: según el camino
// (interactive transaction vs $queryRaw/$executeRaw, y según el engine),
// puede aparecer como PrismaClientKnownRequestError con .code "P2034"
// (transaction conflict, ya mapeado por Prisma) o con .code "P2010" y el
// SQLSTATE real en .meta.code, o incluso solo mencionado en .message. Por
// eso la extracción prueba varias formas en vez de asumir una sola.

const RETRYABLE_SQLSTATES = new Set(["40001", "40P01"]);

/** Prisma ya mapea internamente conflictos de transacción interactiva a esto. */
const PRISMA_TRANSACTION_CONFLICT_CODE = "P2034";

const SQLSTATE_IN_MESSAGE_RE = /\b(40001|40P01)\b/;

function readSqlStateFromMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const code = (meta as Record<string, unknown>).code;
  return typeof code === "string" && RETRYABLE_SQLSTATES.has(code) ? code : null;
}

/**
 * Devuelve el SQLSTATE si el error corresponde a un deadlock (40P01) o a una
 * serialization failure (40001) de Postgres; null para cualquier otro caso
 * (lock ocupado por owner distinto, UUID inválido, ownership inválido,
 * permisos, validation errors de Prisma, o cualquier error no reconocido).
 */
export function extractSqlState(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const err = error as { code?: unknown; meta?: unknown; message?: unknown; cause?: unknown };

  if (err.code === PRISMA_TRANSACTION_CONFLICT_CODE) return "40001";

  const fromMeta = readSqlStateFromMeta(err.meta);
  if (fromMeta) return fromMeta;

  if (typeof err.code === "string" && RETRYABLE_SQLSTATES.has(err.code)) return err.code;

  if (typeof err.message === "string") {
    const match = SQLSTATE_IN_MESSAGE_RE.exec(err.message);
    if (match) return match[1];
  }

  if (err.cause && err.cause !== error) return extractSqlState(err.cause);

  return null;
}

export function isRetryableError(error: unknown): boolean {
  return extractSqlState(error) !== null;
}

/** Máximo de intentos TOTAL (1 intento inicial + hasta 2 reintentos). */
export const MAX_LOCK_RETRY_ATTEMPTS = 3;

const JITTER_MIN_MS = 50;
const JITTER_MAX_MS = 150;

function jitterMs(): number {
  return JITTER_MIN_MS + Math.floor(Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS + 1));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reintenta `fn` únicamente ante deadlock (40P01) o serialization failure
 * (40001), hasta MAX_LOCK_RETRY_ATTEMPTS intentos totales, con backoff
 * aleatorio (jitter) entre reintentos. Cualquier otro error se propaga de
 * inmediato en el primer intento: lock ocupado, UUID inválido, ownership
 * inválido, permisos, o errores desconocidos nunca se reintentan.
 */
export async function withDeadlockRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_LOCK_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === MAX_LOCK_RETRY_ATTEMPTS) throw error;
      await sleep(jitterMs());
    }
  }
  // Inalcanzable (el loop siempre retorna o lanza), pero TS necesita el throw.
  throw lastError;
}
