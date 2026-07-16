"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireActionPermission } from "@/lib/auth/permissions";
import {
  actualizarFila,
  excluirFila,
  restaurarFila,
  marcarDuplicadoLegitimo,
  agregarOperacionManual,
  enviarLoteAAugusto,
  type FilaEditPatch,
  type ManualOpInput,
  type MutationResult,
  type EnviarLoteResult,
} from "./lote-review";

async function gate(): Promise<{ userId: string } | { error: string }> {
  const denied = await requireActionPermission("bolsa:crear");
  if (denied) return { error: denied.error };
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión no válida." };
  return { userId: session.user.id };
}

/**
 * Ejecuta una mutación gateada, saneando cualquier excepción inesperada
 * (errores de Prisma/Postgres, etc.) antes de que llegue al cliente — solo
 * queda logueada en el servidor para diagnóstico.
 */
async function runGated<T extends MutationResult>(
  label: string,
  fn: (userId: string) => Promise<T>,
): Promise<T | MutationResult> {
  const g = await gate();
  if ("error" in g) return { ok: false, error: g.error };
  try {
    return await fn(g.userId);
  } catch (e) {
    console.error(`[${label}] Error inesperado:`, e);
    return { ok: false, error: "No se pudo completar la acción. Intentá de nuevo." };
  }
}

export async function actualizarFilaAction(
  filaId: string,
  patch: FilaEditPatch,
): Promise<MutationResult> {
  const result = await runGated("actualizarFilaAction", (userId) => actualizarFila(filaId, userId, patch));
  if (result.ok) {
    try {
      revalidatePath(`/bolsa/importar`);
    } catch {
      // no bloquear la edición por un revalidate fallido
    }
  }
  return result;
}

export async function excluirFilaAction(filaId: string): Promise<MutationResult> {
  return runGated("excluirFilaAction", (userId) => excluirFila(filaId, userId));
}

export async function restaurarFilaAction(filaId: string): Promise<MutationResult> {
  return runGated("restaurarFilaAction", (userId) => restaurarFila(filaId, userId));
}

export async function marcarDuplicadoLegitimoAction(filaId: string): Promise<MutationResult> {
  return runGated("marcarDuplicadoLegitimoAction", (userId) => marcarDuplicadoLegitimo(filaId, userId));
}

export async function agregarOperacionManualAction(
  loteId: string,
  input: ManualOpInput,
): Promise<MutationResult> {
  return runGated("agregarOperacionManualAction", (userId) => agregarOperacionManual(loteId, userId, input));
}

export async function enviarLoteAction(loteId: string): Promise<EnviarLoteResult> {
  const result = await runGated("enviarLoteAction", (userId) => enviarLoteAAugusto(loteId, userId));
  if (result.ok) {
    try {
      revalidatePath(`/bolsa/importar/${loteId}`);
    } catch {
      // no bloquear el envío por un revalidate fallido
    }
  }
  return result as EnviarLoteResult;
}
