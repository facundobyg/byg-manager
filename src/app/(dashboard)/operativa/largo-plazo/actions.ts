"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, TipoOperacionLP } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { CUENTAS_OPERATIVAS_ACTUALES } from "@/lib/constants/cuentas-operativas";

export async function crearLargoPlazo(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const fechaStr = formData.get("fecha")?.toString();
  const tipo = formData.get("tipo")?.toString() as TipoOperacionLP;
  const ticker = formData.get("ticker")?.toString();
  const notas = formData.get("notas")?.toString() || "";

  if (!fechaStr || !tipo || !ticker) {
    return { error: "Fecha, tipo y ticker son obligatorios" };
  }

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const mesContable = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

  const cuentas = CUENTAS_OPERATIVAS_ACTUALES;
  const opsToCreate: Prisma.OperacionLargoPlazoCreateInput[] = [];

  for (const cuenta of cuentas) {
    const rawTotalUSD = formData.get(`totalUSD_${cuenta}`)?.toString().replace(",", ".") || "0";
    const rawARS = formData.get(`ars_${cuenta}`)?.toString().replace(",", ".") || "0";
    
    const totalUSD = parseFloat(rawTotalUSD);
    const ars = parseFloat(rawARS);

    if (totalUSD !== 0 || ars !== 0) {
      opsToCreate.push({
        id: crypto.randomUUID(),
        fecha,
        tipo,
        ticker,
        descripcion: notas,
        mesContable,
        detalles: {
          cuenta,
          cantidad: 0,
          precio: 0,
          totalUSD,
          ars
        },
        updatedAt: new Date(),
      });
    }
  }

  if (opsToCreate.length === 0) {
    return { error: "Debe ingresar actividad en al menos una cuenta" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const op of opsToCreate) {
        await tx.operacionLargoPlazo.create({ data: op });
      }
    });

    revalidatePath("/operativa/largo-plazo");
    return { ok: true };
  } catch (error: any) {
    console.error("Error creating Largo Plazo:", error);
    return { error: "Error al registrar las operaciones en la base de datos" };
  }
}
