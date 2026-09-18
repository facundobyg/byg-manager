"use server";

// A3.1.2.1 — Server Actions del lease de coordinación CONFIG. Solo manejan
// acquire/heartbeat/release del OperationalLock — ninguna mutación de
// negocio vive acá. Adquirir el lock NO autoriza ninguna mutación: cada
// Server Action de dominio (en actions.ts) sigue validando su propio
// requireActionPermission antes de escribir. Lock = coordinación entre
// usuarios autorizados; permission = autorización. Se mantienen separados
// a propósito.

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canDoAction } from "@/lib/auth/permissions";
import { acquireLocks, heartbeatLocks, releaseLocks } from "@/lib/locks/engine";
import { assertValidClientId } from "@/lib/locks/keys";
import { LockConflictError } from "@/lib/locks/errors";

const CONFIG_LOCK_KEY = "CONFIG";

// Las mutaciones de Configuración hoy están repartidas en más de un permiso
// (ver A3.1.2: configuracion:editar, configuracion:cajas, mes:editar —
// updateActivoMetadata usa un chequeo ADMIN aparte, ya cubierto porque
// canDoAction ya devuelve true para ADMIN en cualquiera de estas keys).
// "Puede adquirir el lease" = "puede hacer AL MENOS UNA de estas cosas",
// no un permiso nuevo ni un reemplazo de los existentes.
const CONFIG_CAPABILITY_KEYS = ["configuracion:editar", "configuracion:cajas", "mes:editar"] as const;

async function hasAnyConfigCapability(): Promise<boolean> {
  for (const key of CONFIG_CAPABILITY_KEYS) {
    if (await canDoAction(key)) return true;
  }
  return false;
}

export type ConfigLockStatus =
  | { mode: "EDITABLE" }
  | { mode: "READ_ONLY_OCCUPIED"; ownerName: string | null }
  | { mode: "READ_ONLY_SAME_USER_TAB" }
  | { mode: "DENIED" };

/** Nunca selecciona/expone ownerClientId — ver contrato de ConfigLockStatus. */
async function resolveOccupiedStatus(currentUserId: string): Promise<ConfigLockStatus> {
  const lock = await prisma.operationalLock.findUnique({
    where: { lockKey: CONFIG_LOCK_KEY },
    select: { ownerUserId: true },
  });

  if (!lock) {
    // Se liberó justo entre el conflict y esta lectura. No declarar EDITABLE
    // acá sin un reacquire confirmado — el caller ya hizo su único reintento
    // antes de llegar a esta función; devolvemos occupied "sin nombre" en
    // vez de asumir disponibilidad no confirmada.
    return { mode: "READ_ONLY_OCCUPIED", ownerName: null };
  }

  if (lock.ownerUserId === currentUserId) {
    return { mode: "READ_ONLY_SAME_USER_TAB" };
  }

  const owner = await prisma.user.findUnique({ where: { id: lock.ownerUserId }, select: { name: true } });
  return { mode: "READ_ONLY_OCCUPIED", ownerName: owner?.name ?? null };
}

/**
 * Intenta adquirir el lease CONFIG para esta tab. Contrato:
 *   - sin sesión → DENIED
 *   - sin ninguna capacidad de escritura en Configuración → DENIED
 *     (esto NO autoriza ninguna mutación puntual, solo decide si vale la
 *     pena darle el lease — cada Server Action de dominio revalida su
 *     propio permiso específico igual).
 *   - lock libre o expirado → EDITABLE
 *   - lock ocupado vigente → un único reintento (puede haberse liberado
 *     justo en el medio); si el reintento también falla, resuelve el owner
 *     actual. Nunca devuelve EDITABLE sin una adquisición confirmada.
 */
export async function acquireConfigLock(ownerClientId: string): Promise<ConfigLockStatus> {
  const session = await auth();
  if (!session?.user?.id) return { mode: "DENIED" };

  assertValidClientId(ownerClientId);

  if (!(await hasAnyConfigCapability())) return { mode: "DENIED" };

  try {
    await acquireLocks([CONFIG_LOCK_KEY], session.user.id, ownerClientId);
    return { mode: "EDITABLE" };
  } catch (error) {
    if (!(error instanceof LockConflictError)) throw error;
  }

  // Único reintento: el lock pudo liberarse/expirar entre el primer intento
  // y este punto. Si vuelve a fallar, recién ahí resolvemos el owner actual.
  try {
    await acquireLocks([CONFIG_LOCK_KEY], session.user.id, ownerClientId);
    return { mode: "EDITABLE" };
  } catch (error) {
    if (!(error instanceof LockConflictError)) throw error;
  }

  return resolveOccupiedStatus(session.user.id);
}

/**
 * Renueva el lease. El backend es siempre la autoridad: un heartbeat tardío
 * nunca resucita un lease vencido (ver heartbeatLocks). El caller (provider)
 * es responsable de no confundir un error de red/transporte con LOST — acá
 * solo se distingue lo que el motor realmente reporta.
 */
export async function heartbeatConfigLock(ownerClientId: string): Promise<{ status: "OK" | "LOST" }> {
  const session = await auth();
  if (!session?.user?.id) return { status: "LOST" };

  assertValidClientId(ownerClientId);

  const result = await heartbeatLocks([CONFIG_LOCK_KEY], session.user.id, ownerClientId);
  return { status: result.status };
}

/** Libera el lease de ESTA tab únicamente (ownerUserId + ownerClientId exactos). */
export async function releaseConfigLock(ownerClientId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  assertValidClientId(ownerClientId);

  await releaseLocks([CONFIG_LOCK_KEY], session.user.id, ownerClientId);
}
