"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { CUENTAS_OPERATIVAS_ACTUALES } from "@/lib/constants/cuentas-operativas";

export async function crearDivInteres(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const fechaStr = formData.get("fecha")?.toString();
  const ticker = formData.get("ticker")?.toString();
  const descripcion = formData.get("descripcion")?.toString();

  if (!fechaStr || !ticker || !descripcion) {
    return { error: "Fecha, ticker y descripción son obligatorios" };
  }

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const mesContable = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

  const cuentas = CUENTAS_OPERATIVAS_ACTUALES;
  const opsToCreate: Prisma.OperacionDivIntCreateInput[] = [];

  for (const cuenta of cuentas) {
    const rawUSD = formData.get(`usd_${cuenta}`)?.toString().replace(",", ".") || "0";
    const rawARS = formData.get(`ars_${cuenta}`)?.toString().replace(",", ".") || "0";
    
    const usd = parseFloat(rawUSD);
    const ars = parseFloat(rawARS);

    if (usd !== 0 || ars !== 0) {
      opsToCreate.push({
        id: crypto.randomUUID(),
        fecha,
        ticker,
        descripcion,
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
        await tx.operacionDivInt.create({ data: op });
      }
    });

    revalidatePath("/operativa/div-intereses");
    return { ok: true };
  } catch (error: any) {
    console.error("Error creating Div/Int:", error);
    return { error: "Error al registrar las operaciones en la base de datos" };
  }
}
