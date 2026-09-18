// A3.1.1 — motor server-side de OperationalLock.
//
// Toda fecha de expiración se calcula con clock_timestamp() de Postgres,
// nunca con Date.now()/now()/CURRENT_TIMESTAMP/transaction_timestamp(): estas
// últimas quedan congeladas al valor de inicio de la transacción, lo cual
// rompe cualquier chequeo de TTL cuando la transacción queda bloqueada
// esperando un row lock (ver test J).
//
// Sin integración a Server Actions financieras todavía (A3.1.1 es solo la
// infraestructura base).

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { LOCK_TTL_MS, LOCK_TX_OPTIONS } from "./constants";
import { LockConflictError, LockOwnershipError } from "./errors";
import { assertValidClientId, assertValidOwnerUserId, deriveLockArea, normalizeLockKeys } from "./keys";
import { withDeadlockRetry } from "./retry";

export interface AcquiredLock {
  lockKey: string;
  acquiredAt: Date;
}

export type HeartbeatResult =
  | { status: "OK" }
  | { status: "LOST"; renewed: string[]; lost: string[] };

export interface TakeoverResultItem {
  lockKey: string;
  /** null = la key no tenía owner previo. Nunca se expone ownerClientId acá. */
  previousOwnerUserId: string | null;
  acquiredAt: Date;
}

// ── acquireLocks ─────────────────────────────────────────────────────────
/**
 * Adquiere TODO el set atómicamente en una sola interactive transaction,
 * procesando las keys en orden lexicográfico. Por cada key:
 *   - no existe            → crea el lease.
 *   - existe, mismo owner  → renueva heartbeat, preserva acquiredAt original.
 *   - existe, expirado     → toma ownership con acquiredAt nuevo.
 *   - existe, vigente,
 *     owner distinto       → NO adquiere: toda la transacción hace rollback.
 *
 * Los leases que el mismo owner ya tenía de ANTES de esta llamada (ya
 * comprometidos en transacciones previas) nunca se pierden por este
 * rollback: solo se deshacen los cambios hechos dentro de esta transacción.
 */
export async function acquireLocks(
  lockKeys: readonly string[],
  ownerUserId: string,
  ownerClientId: string,
): Promise<AcquiredLock[]> {
  const sortedKeys = normalizeLockKeys(lockKeys);
  assertValidOwnerUserId(ownerUserId);
  assertValidClientId(ownerClientId);

  return withDeadlockRetry(() =>
    prisma.$transaction(async (tx) => {
      const acquired: AcquiredLock[] = [];
      for (const lockKey of sortedKeys) {
        const rows = await tx.$queryRaw<{ lockKey: string; acquiredAt: Date }[]>`
          WITH now_ts AS (SELECT clock_timestamp() AS ts)
          INSERT INTO "OperationalLock" (id, "lockKey", area, "ownerUserId", "ownerClientId", "acquiredAt", "lastHeartbeatAt", "updatedAt")
          SELECT ${crypto.randomUUID()}, ${lockKey}, ${deriveLockArea(lockKey)}, ${ownerUserId}, ${ownerClientId}, ts, ts, ts
          FROM now_ts
          ON CONFLICT ("lockKey") DO UPDATE SET
            "ownerUserId" = EXCLUDED."ownerUserId",
            "ownerClientId" = EXCLUDED."ownerClientId",
            "acquiredAt" = CASE
              WHEN "OperationalLock"."ownerUserId" = EXCLUDED."ownerUserId"
                AND "OperationalLock"."ownerClientId" = EXCLUDED."ownerClientId"
              THEN "OperationalLock"."acquiredAt"
              ELSE EXCLUDED."acquiredAt"
            END,
            "lastHeartbeatAt" = EXCLUDED."lastHeartbeatAt",
            "updatedAt" = EXCLUDED."updatedAt"
          WHERE
            ("OperationalLock"."ownerUserId" = EXCLUDED."ownerUserId" AND "OperationalLock"."ownerClientId" = EXCLUDED."ownerClientId")
            OR "OperationalLock"."lastHeartbeatAt" < EXCLUDED."acquiredAt" - (${LOCK_TTL_MS}::bigint * interval '1 millisecond')
          RETURNING "lockKey", "acquiredAt"
        `;
        if (rows.length !== 1) {
          throw new LockConflictError(lockKey);
        }
        acquired.push({ lockKey: rows[0].lockKey, acquiredAt: rows[0].acquiredAt });
      }
      return acquired;
    }, LOCK_TX_OPTIONS),
  );
}

// ── requireOperationalLocks ──────────────────────────────────────────────
/**
 * Contrato crítico: NO abre transacción propia, NO adquiere locks
 * faltantes, NO reacquire silenciosamente locks expirados. Se ejecuta
 * DENTRO de la transacción financiera del caller (`tx`).
 *
 * Por cada key esperada (en orden lexicográfico) hace un UPDATE que exige
 * lockKey + ownerUserId + ownerClientId exactos y heartbeat todavía vigente.
 * Ese UPDATE toma un row lock que se sostiene hasta que la transacción
 * financiera del caller haga commit o rollback — así ningún acquire/takeover
 * concurrente puede tomar la key mientras la mutación financiera está activa
 * (ver test J: la ventana entre "validar" y "escribir" no existe porque
 * ambas cosas ocurren dentro del mismo row lock).
 *
 * Si el UPDATE afecta 0 filas para cualquier key, lanza y aborta la
 * transacción financiera completa.
 */
export async function requireOperationalLocks(
  tx: Prisma.TransactionClient,
  expectedLockKeys: readonly string[],
  ownerUserId: string,
  ownerClientId: string,
): Promise<void> {
  const sortedKeys = normalizeLockKeys(expectedLockKeys);
  assertValidOwnerUserId(ownerUserId);
  assertValidClientId(ownerClientId);

  for (const lockKey of sortedKeys) {
    const affected = await tx.$executeRaw`
      WITH now_ts AS (SELECT clock_timestamp() AS ts)
      UPDATE "OperationalLock" ol
      SET "lastHeartbeatAt" = now_ts.ts, "updatedAt" = now_ts.ts
      FROM now_ts
      WHERE ol."lockKey" = ${lockKey}
        AND ol."ownerUserId" = ${ownerUserId}
        AND ol."ownerClientId" = ${ownerClientId}
        AND ol."lastHeartbeatAt" >= now_ts.ts - (${LOCK_TTL_MS}::bigint * interval '1 millisecond')
    `;
    if (affected !== 1) {
      throw new LockOwnershipError(lockKey);
    }
  }
}

// ── heartbeatLocks ───────────────────────────────────────────────────────
/**
 * Renueva el set completo solo si CADA key sigue perteneciendo al mismo
 * owner (userId+clientId exactos) y su lease no expiró. Un heartbeat
 * tardío nunca resucita un lease vencido.
 *
 * Si menos de N de N keys renuevan, el resultado global es LOST. Como
 * best-effort, libera las leases que sí renovaron en este intento fallido
 * (para no dejar al cliente con un subconjunto "medio vivo" del set que la
 * UI trataría como válido) — comportamiento documentado explícitamente acá,
 * no es un auto-reacquire de lo perdido.
 */
export async function heartbeatLocks(
  lockKeys: readonly string[],
  ownerUserId: string,
  ownerClientId: string,
): Promise<HeartbeatResult> {
  const sortedKeys = normalizeLockKeys(lockKeys);
  assertValidOwnerUserId(ownerUserId);
  assertValidClientId(ownerClientId);

  return withDeadlockRetry(() =>
    prisma.$transaction(async (tx) => {
      const renewed: string[] = [];
      for (const lockKey of sortedKeys) {
        const affected = await tx.$executeRaw`
          WITH now_ts AS (SELECT clock_timestamp() AS ts)
          UPDATE "OperationalLock" ol
          SET "lastHeartbeatAt" = now_ts.ts, "updatedAt" = now_ts.ts
          FROM now_ts
          WHERE ol."lockKey" = ${lockKey}
            AND ol."ownerUserId" = ${ownerUserId}
            AND ol."ownerClientId" = ${ownerClientId}
            AND ol."lastHeartbeatAt" >= now_ts.ts - (${LOCK_TTL_MS}::bigint * interval '1 millisecond')
        `;
        if (affected === 1) renewed.push(lockKey);
      }

      if (renewed.length === sortedKeys.length) {
        return { status: "OK" as const };
      }

      const lost = sortedKeys.filter((key) => !renewed.includes(key));
      if (renewed.length > 0) {
        await tx.operationalLock.deleteMany({
          where: { lockKey: { in: renewed }, ownerUserId, ownerClientId },
        });
      }
      return { status: "LOST" as const, renewed, lost };
    }, LOCK_TX_OPTIONS),
  );
}

// ── releaseLocks / releaseAllMyClientLocks ──────────────────────────────
/** Libera exclusivamente las keys indicadas, y solo si pertenecen a ese owner exacto. */
export async function releaseLocks(
  lockKeys: readonly string[],
  ownerUserId: string,
  ownerClientId: string,
): Promise<number> {
  const sortedKeys = normalizeLockKeys(lockKeys);
  assertValidOwnerUserId(ownerUserId);
  assertValidClientId(ownerClientId);

  const result = await prisma.operationalLock.deleteMany({
    where: { lockKey: { in: sortedKeys }, ownerUserId, ownerClientId },
  });
  return result.count;
}

/**
 * Libera TODOS los locks de esa tab (ownerUserId+ownerClientId exactos).
 * No es logout global del usuario: nunca toca locks de otras tabs del
 * mismo usuario (otro ownerClientId), aunque sean el mismo ownerUserId.
 */
export async function releaseAllMyClientLocks(
  ownerUserId: string,
  ownerClientId: string,
): Promise<number> {
  assertValidOwnerUserId(ownerUserId);
  assertValidClientId(ownerClientId);

  const result = await prisma.operationalLock.deleteMany({
    where: { ownerUserId, ownerClientId },
  });
  return result.count;
}

// ── takeoverLocks ────────────────────────────────────────────────────────
/**
 * Infraestructura únicamente: sin wiring de permisos/UI todavía (ADMIN no
 * tiene bypass silencioso implementado acá, eso es responsabilidad del
 * caller futuro).
 *
 * Adquiere TODO el set atómicamente ignorando el TTL (el takeover explícito
 * siempre gana), reemplaza ownerUserId/ownerClientId, y resetea
 * acquiredAt/heartbeat. Un set con keys existentes y no existentes mezcladas
 * se resuelve igual de atómico dentro de una sola transacción.
 *
 * Respeta row locks existentes: si una mutación financiera tiene el row
 * lock (ver requireOperationalLocks), el SELECT ... FOR UPDATE por key
 * espera a que esa transacción termine, y al despertar toma el estado
 * entonces actual antes de sobrescribir.
 *
 * El resultado incluye el ownerUserId previo por key (para auditoría
 * futura) pero nunca expone ownerClientId — ni el previo ni, por contrato
 * de este tipo de retorno, es para consumo directo del frontend sin filtrar.
 */
export async function takeoverLocks(
  lockKeys: readonly string[],
  newOwnerUserId: string,
  newOwnerClientId: string,
): Promise<TakeoverResultItem[]> {
  const sortedKeys = normalizeLockKeys(lockKeys);
  assertValidOwnerUserId(newOwnerUserId);
  assertValidClientId(newOwnerClientId);

  return withDeadlockRetry(() =>
    prisma.$transaction(async (tx) => {
      const results: TakeoverResultItem[] = [];
      for (const lockKey of sortedKeys) {
        const existing = await tx.$queryRaw<{ ownerUserId: string }[]>`
          SELECT "ownerUserId" FROM "OperationalLock" WHERE "lockKey" = ${lockKey} FOR UPDATE
        `;
        const previousOwnerUserId = existing.length === 1 ? existing[0].ownerUserId : null;

        const upserted = await tx.$queryRaw<{ acquiredAt: Date }[]>`
          WITH now_ts AS (SELECT clock_timestamp() AS ts)
          INSERT INTO "OperationalLock" (id, "lockKey", area, "ownerUserId", "ownerClientId", "acquiredAt", "lastHeartbeatAt", "updatedAt")
          SELECT ${crypto.randomUUID()}, ${lockKey}, ${deriveLockArea(lockKey)}, ${newOwnerUserId}, ${newOwnerClientId}, ts, ts, ts
          FROM now_ts
          ON CONFLICT ("lockKey") DO UPDATE SET
            "ownerUserId" = EXCLUDED."ownerUserId",
            "ownerClientId" = EXCLUDED."ownerClientId",
            "acquiredAt" = EXCLUDED."acquiredAt",
            "lastHeartbeatAt" = EXCLUDED."lastHeartbeatAt",
            "updatedAt" = EXCLUDED."updatedAt"
          RETURNING "acquiredAt"
        `;

        results.push({
          lockKey,
          previousOwnerUserId,
          acquiredAt: upserted[0].acquiredAt,
        });
      }
      return results;
    }, LOCK_TX_OPTIONS),
  );
}
