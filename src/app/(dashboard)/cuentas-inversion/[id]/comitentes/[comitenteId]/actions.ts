"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ProductorInversion } from "@prisma/client";
import { requireActionPermission } from "@/lib/auth/permissions";

export async function editProductorAction(
  comitenteId: string,
  cuentaInversionId: string,
  productor: ProductorInversion,
): Promise<{ error?: string }> {
  const denied = await requireActionPermission("comitentes:editar");
  if (denied) return denied;

  const VALID: ProductorInversion[] = ["IPS", "BYG", "OTRO"];
  if (!VALID.includes(productor)) return { error: "Productor inválido." };
  await prisma.comitenteInversion.update({
    where: { id: comitenteId },
    data: { productor, updatedAt: new Date() },
  });
  revalidatePath(`/cuentas-inversion/${cuentaInversionId}/comitentes/${comitenteId}`);
  revalidatePath(`/cuentas-inversion/${cuentaInversionId}`);
  return {};
}

// Vincular un comitente como espejo de una cartera propia afecta qué se
// considera patrimonio BYG → es configuración, no operación.
export async function setCarteraAction(
  comitenteId: string,
  cuentaInversionId: string,
  carteraId: string | null,
): Promise<{ error?: string }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  await prisma.comitenteInversion.update({
    where: { id: comitenteId },
    data: { carteraId, updatedAt: new Date() },
  });
  revalidatePath(`/cuentas-inversion/${cuentaInversionId}/comitentes/${comitenteId}`);
  revalidatePath(`/cuentas-inversion/${cuentaInversionId}`);
  return {};
}
