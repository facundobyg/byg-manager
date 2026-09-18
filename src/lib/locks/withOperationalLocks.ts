// A3.1.2.1 — helper transaccional genérico, reusable por cualquier área
// (CONFIG, CC, PF, CAJA:{id}, etc.) para futuras mutaciones. Todavía no está
// cableado a ninguna Server Action real.
//
// Encapsula el único patrón seguro: exigir posesión vigente de las lockKeys
// DENTRO de la misma transacción que hace la escritura (nunca check-then-write
// en pasos separados — eso es TOCTOU), con la transacción COMPLETA bajo retry
// de deadlock/serialization failure.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { LOCK_TX_OPTIONS } from "./constants";
import { requireOperationalLocks } from "./engine";
import { withDeadlockRetry } from "./retry";

/**
 * `expectedLockKeys` se normaliza (trim/dedupe/orden lexicográfico) dentro
 * de `requireOperationalLocks`, no hace falta normalizar antes de llamar acá.
 *
 * `ownerUserId` debe venir siempre de auth() server-side — nunca de un
 * parámetro controlado por el browser. `ownerClientId` sí puede venir del
 * browser (identifica la tab, no autoriza al usuario).
 */
export async function withOperationalLocks<T>(
  expectedLockKeys: readonly string[],
  ownerUserId: string,
  ownerClientId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return withDeadlockRetry(() =>
    prisma.$transaction(async (tx) => {
      await requireOperationalLocks(tx, expectedLockKeys, ownerUserId, ownerClientId);
      return callback(tx);
    }, LOCK_TX_OPTIONS),
  );
}
