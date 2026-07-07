"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { ProductorInversion } from "@prisma/client";
import { writeAuditLog } from "@/lib/services/audit.service";
import { requireActionPermission } from "@/lib/auth/permissions";
import { recalcBatchStatus } from "./importaciones/bind/process-upload";

type ActionResult = { error?: string; success?: boolean };

const PRODUCTORES: ProductorInversion[] = ["IPS", "BYG", "OTRO"];

function parseDecimal(raw: FormDataEntryValue | null): Decimal {
  try { return new Decimal(raw?.toString().trim() || "0"); } catch { return new Decimal("0"); }
}

function revalidate(cuentaId: string) {
  revalidatePath("/cuentas-inversion");
  revalidatePath(`/cuentas-inversion/${cuentaId}`);
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createComitente(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const cuentaId      = formData.get("cuentaInversionId")?.toString().trim();
  const nroComitente  = formData.get("nroComitente")?.toString().trim();
  const nombre        = formData.get("nombre")?.toString().trim();
  const razonSocial   = formData.get("razonSocial")?.toString().trim() || null;
  const productorRaw  = formData.get("productor")?.toString() as ProductorInversion;
  const notas         = formData.get("notas")?.toString().trim() || null;
  const esPropioBYG   = formData.get("esPropioBYG") === "true";

  if (!cuentaId || !nroComitente || !nombre)
    return { error: "Número de comitente y nombre son requeridos" };
  if (!PRODUCTORES.includes(productorRaw))
    return { error: "Productor inválido" };

  const exists = await prisma.comitenteInversion.findUnique({
    where: { cuentaInversionId_nroComitente: { cuentaInversionId: cuentaId, nroComitente } },
  });
  if (exists) return { error: `El número de comitente ${nroComitente} ya existe en esta cuenta` };

  await prisma.$transaction(async (tx) => {
    const comitente = await tx.comitenteInversion.create({
      data: { id: crypto.randomUUID(), cuentaInversionId: cuentaId, nroComitente, nombre, razonSocial, productor: productorRaw, notas, activo: true, esPropioBYG, updatedAt: new Date() },
    });
    await tx.saldoComitenteInversion.create({
      data: { id: crypto.randomUUID(), comitenteId: comitente.id, saldoARS: new Decimal(0), saldoUSDCable: new Decimal(0), saldoUSDMep: new Decimal(0), updatedAt: new Date() },
    });
  });

  revalidate(cuentaId);
  return { success: true };
}

// ── Update comitente ──────────────────────────────────────────────────────────

export async function updateComitente(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id           = formData.get("id")?.toString().trim();
  const cuentaId     = formData.get("cuentaInversionId")?.toString().trim();
  const nroComitente = formData.get("nroComitente")?.toString().trim();
  const nombre       = formData.get("nombre")?.toString().trim();
  const razonSocial  = formData.get("razonSocial")?.toString().trim() || null;
  const productorRaw = formData.get("productor")?.toString() as ProductorInversion;
  const notas        = formData.get("notas")?.toString().trim() || null;
  const activo       = formData.get("activo") === "true";
  const esPropioBYG  = formData.get("esPropioBYG") === "true";

  if (!id || !cuentaId || !nroComitente || !nombre)
    return { error: "Campos requeridos incompletos" };
  if (!PRODUCTORES.includes(productorRaw))
    return { error: "Productor inválido" };

  const duplicate = await prisma.comitenteInversion.findFirst({
    where: { cuentaInversionId: cuentaId, nroComitente, id: { not: id } },
  });
  if (duplicate) return { error: `El número de comitente ${nroComitente} ya existe en esta cuenta` };

  await prisma.comitenteInversion.update({
    where: { id },
    data: { nroComitente, nombre, razonSocial, productor: productorRaw, notas, activo, esPropioBYG },
  });

  revalidate(cuentaId);
  return { success: true };
}

// ── Update saldos ─────────────────────────────────────────────────────────────

export async function updateSaldos(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireActionPermission("saldos:editar");
  if (denied) return denied;

  const comitenteId = formData.get("comitenteId")?.toString().trim();
  const cuentaId    = formData.get("cuentaInversionId")?.toString().trim();

  if (!comitenteId || !cuentaId) return { error: "Datos requeridos incompletos" };

  const saldoARS      = parseDecimal(formData.get("saldoARS"));
  const saldoUSDCable = parseDecimal(formData.get("saldoUSDCable"));
  const saldoUSDMep   = parseDecimal(formData.get("saldoUSDMep"));

  if (saldoARS.lt(0) || saldoUSDCable.lt(0) || saldoUSDMep.lt(0))
    return { error: "Los saldos no pueden ser negativos" };

  await prisma.saldoComitenteInversion.upsert({
    where: { comitenteId },
    update: { saldoARS, saldoUSDCable, saldoUSDMep },
    create: { id: crypto.randomUUID(), comitenteId, saldoARS, saldoUSDCable, saldoUSDMep, updatedAt: new Date() },
  });

  const session = await auth();
  const userId   = session?.user?.id as string | undefined;
  const userName = (session?.user as { name?: string } | undefined)?.name ?? "Usuario";
  await writeAuditLog({
    userId,
    accion:     "EDICION_SALDO",
    entidad:    "ComitenteInversion",
    entidadId:  comitenteId,
    description: `${userName} modificó saldos — ARS ${saldoARS}, USD Cable ${saldoUSDCable}, USD MEP ${saldoUSDMep}`,
  });

  revalidate(cuentaId);
  return { success: true };
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteComitente(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id       = formData.get("id")?.toString().trim();
  const cuentaId = formData.get("cuentaInversionId")?.toString().trim();

  if (!id || !cuentaId) return { error: "ID requerido" };

  const holdingsCount = await prisma.holdingComitenteInversion.count({ where: { comitenteId: id } });
  if (holdingsCount > 0)
    return { error: `No se puede eliminar: el comitente tiene ${holdingsCount} holding(s) registrado(s)` };

  // Capturar archivos Bind afectados antes de que el onDelete:SetNull los desreferencie
  const affectedBindFiles = await prisma.bindTenenciasImportFile.findMany({
    where: {
      matchedComitenteId: id,
      status: { notIn: ["CONFIRMED", "ERROR", "DUPLICATE", "SKIPPED"] },
    },
    select: { id: true, batchId: true },
  });

  await prisma.comitenteInversion.delete({ where: { id } });

  // Después del delete, matchedComitenteId ya es null por onDelete:SetNull
  // Recalcular status de archivos y lotes afectados
  if (affectedBindFiles.length > 0) {
    await prisma.bindTenenciasImportFile.updateMany({
      where: { id: { in: affectedBindFiles.map((f) => f.id) } },
      data: { status: "NEEDS_ACCOUNT_MAPPING", updatedAt: new Date() },
    });
    const batchIds = Array.from(new Set(affectedBindFiles.map((f) => f.batchId)));
    for (const batchId of batchIds) await recalcBatchStatus(batchId);
  }

  revalidate(cuentaId);
  return { success: true };
}
