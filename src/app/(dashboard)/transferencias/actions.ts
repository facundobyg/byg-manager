"use server";

import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { readOnlyPreview } from "@/lib/config";

type DatosTransferencia = {
  clienteId: string;
  activoId: string;
  cantidad: string;
  precioCompra: string;
  descripcion: string;
};

export async function revertirTransferencia(_prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const logId = formData.get("logId") as string;
  if (!logId) return { error: "logId inválido" };

  const log = await prisma.auditLog.findUnique({ where: { id: logId } });
  if (!log) return { error: "Registro no encontrado" };

  const datos = log.datosNuevos as DatosTransferencia;
  if (!datos?.clienteId || !datos?.activoId || !datos?.cantidad) {
    return { error: "Datos del registro incompletos" };
  }

  const posicionId = log.entidadId;
  if (!posicionId) return { error: "Posición origen no identificable" };

  const cantidad = new Decimal(datos.cantidad);
  const { clienteId, activoId } = datos;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Devolver a cartera (increment; falla si la posición fue eliminada)
      await tx.posicionCartera.update({
        where: { id: posicionId },
        data: { cantidad: { increment: cantidad } },
      });

      // 2. Restar en custodia
      const custodia = await tx.custodiaCliente.findUnique({
        where: { clienteId_activoId: { clienteId, activoId } },
      });

      if (custodia) {
        const nuevaCantidad = new Decimal(custodia.cantidadTotal.toString()).minus(cantidad);

        if (nuevaCantidad.lte(0)) {
          await tx.custodiaCliente.delete({ where: { id: custodia.id } });
        } else {
          await tx.custodiaCliente.update({
            where: { id: custodia.id },
            data: { cantidadTotal: nuevaCantidad },
            // precioPromedio unchanged on reversal
          });
        }
      }

      // 3. Registrar reversión como nuevo log (AuditLog es inmutable)
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          accion: "TRANSFERENCIA_ACTIVO_REVERTIDA",
          entidad: "PosicionCartera",
          entidadId: posicionId,
          datosPrevios: log.datosNuevos as Prisma.InputJsonValue,
          datosNuevos: {
            logOriginalId: logId,
            clienteId,
            activoId,
            cantidad: cantidad.toString(),
            descripcion: "Reversión de transferencia de cartera propia a custodia cliente",
          },
        },
      });
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al revertir transferencia";
    return { error: msg };
  }

  revalidatePath("/cartera");
  revalidatePath("/custodia");
  revalidatePath("/transferencias");

  return { success: true };
}
