"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { CUENTAS_OPERATIVAS_ACTUALES } from "@/lib/constants/cuentas-operativas";
import { readOnlyPreview } from "@/lib/config";

export async function crearRuloBolsa(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const fechaStr = formData.get("fecha")?.toString();
  const descripcion = formData.get("descripcion")?.toString();
  const notas = formData.get("notas")?.toString();

  if (!fechaStr || !descripcion) {
    return { error: "Fecha y descripción son obligatorias" };
  }

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const mesContable = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

  const cuentas = CUENTAS_OPERATIVAS_ACTUALES;
  const opsToCreate: Prisma.OperacionRuloCreateInput[] = [];

  for (const cuenta of cuentas) {
    const rawUSD = formData.get(`usd_${cuenta}`)?.toString().replace(",", ".") || "0";
    const rawARS = formData.get(`ars_${cuenta}`)?.toString().replace(",", ".") || "0";
    
    const usd = parseFloat(rawUSD);
    const ars = parseFloat(rawARS);

    if (usd !== 0 || ars !== 0) {
      opsToCreate.push({
        id: crypto.randomUUID(),
        fecha,
        descripcion,
        notas: notas || null,
        mesContable,
        detalles: {
          cuenta,
          usd,
          ars
        },
        updatedAt: new Date(),
      });
    }
  }

  if (opsToCreate.length === 0) {
    return { error: "Debe ingresar al menos un monto en alguna cuenta" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const op of opsToCreate) {
        await tx.operacionRulo.create({ data: op });
      }
    });

    revalidatePath("/operativa/rulos-bolsa");
    return { ok: true };
  } catch (error: any) {
    console.error("Error creating Rulo Bolsa:", error);
    return { error: "Error al registrar las operaciones en la base de datos" };
  }
}

export async function eliminarOperacionRulo(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const id = formData.get("id")?.toString().trim();
  if (!id) return { error: "ID requerido" };

  const op = await prisma.operacionRulo.findUnique({ where: { id } });
  if (!op) return { error: "Operación no encontrada" };

  await prisma.operacionRulo.delete({ where: { id } });

  revalidatePath("/operativa/rulos-bolsa");
  return { ok: true };
}
