"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/services/audit.service";
import { requireActionPermission } from "@/lib/auth/permissions";

export async function upsertComisionConfig(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const productorId      = formData.get("productorId")?.toString();
  const pctProductorStr  = formData.get("pctProductor")?.toString().replace(",", ".");
  const pctBYGStr        = formData.get("pctBYG")?.toString().replace(",", ".");
  const pctIIBBStr       = formData.get("pctIIBB")?.toString().replace(",", ".");
  const aplicaSenebiStr  = formData.get("aplicaSenebi")?.toString();
  const otrosImpStr      = formData.get("otrosImpuestos")?.toString().replace(",", ".");
  const vigenciaDesdeStr = formData.get("vigenciaDesde")?.toString();
  const notas            = formData.get("notas")?.toString().trim() || null;

  if (!productorId || !pctProductorStr || !pctBYGStr || !vigenciaDesdeStr)
    return { error: "Faltan datos obligatorios" };

  const pctProductor = parseFloat(pctProductorStr);
  const pctBYG       = parseFloat(pctBYGStr);
  const pctIIBB      = parseFloat(pctIIBBStr ?? "5.5");
  const otrosImp     = parseFloat(otrosImpStr ?? "0");
  const aplicaSenebi = aplicaSenebiStr === "true";

  if ([pctProductor, pctBYG, pctIIBB, otrosImp].some(isNaN))
    return { error: "Valores numéricos inválidos" };

  const vigenciaDesde = new Date(vigenciaDesdeStr + "T00:00:00Z");
  if (isNaN(vigenciaDesde.getTime())) return { error: "Fecha de vigencia inválida" };

  const prod = await prisma.productor.findUnique({ where: { id: productorId } });
  if (!prod) return { error: "Productor no encontrado" };

  await prisma.comisionConfig.create({
    data: {
      id: crypto.randomUUID(),
      productorId,
      pctProductor,
      pctBYG,
      pctIIBB,
      aplicaSenebi,
      otrosImpuestos: otrosImp,
      vigenciaDesde,
      notas,
    },
  });

  const session = await auth();
  await writeAuditLog({
    userId:      session?.user?.id,
    accion:      "ALTA_COMISION_CONFIG",
    entidad:     "ComisionConfig",
    description: `Config comisión para ${prod.nombre}: prod=${pctProductor}% BYG=${pctBYG}% IIBB=${pctIIBB}% desde ${vigenciaDesdeStr}`,
  });

  revalidatePath("/comisiones");
  return { ok: true };
}

export async function deleteComisionConfig(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  await prisma.comisionConfig.delete({ where: { id } });
  revalidatePath("/comisiones");
  return { ok: true };
}
