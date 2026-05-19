"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function setCarteraAction(
  comitenteId: string,
  cuentaInversionId: string,
  carteraId: string | null,
): Promise<{ error?: string }> {
  await prisma.comitenteInversion.update({
    where: { id: comitenteId },
    data: { carteraId, updatedAt: new Date() },
  });
  revalidatePath(`/cuentas-inversion/${cuentaInversionId}/comitentes/${comitenteId}`);
  revalidatePath(`/cuentas-inversion/${cuentaInversionId}`);
  return {};
}
