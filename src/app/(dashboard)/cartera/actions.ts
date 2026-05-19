"use server";

import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";
import { readOnlyPreview } from "@/lib/config";
import { calcularPrecioPromedio } from "@/lib/services/precioPromedio.service";

export async function transferirActivo(_prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const posicionId = formData.get("posicionId") as string;
  const clienteId = formData.get("clienteId") as string;
  const cantidadRaw = formData.get("cantidad") as string;

  if (!posicionId || !clienteId || !cantidadRaw) return { error: "Datos inválidos" };

  let cantidad: Decimal;
  try {
    cantidad = new Decimal(cantidadRaw);
    if (cantidad.lte(0)) return { error: "Cantidad debe ser mayor a 0" };
  } catch {
    return { error: "Cantidad inválida" };
  }

  const posicion = await prisma.posicionCartera.findUnique({ where: { id: posicionId } });
  if (!posicion) return { error: "Posición no encontrada" };

  const disponible = new Decimal(posicion.cantidad.toString());
  if (cantidad.greaterThan(disponible)) return { error: "Cantidad insuficiente" };

  try {
    await prisma.$transaction(async (tx) => {
      const nuevaCantidad = disponible.minus(cantidad);

      if (nuevaCantidad.eq(0)) {
        await tx.posicionCartera.delete({ where: { id: posicionId } });
      } else {
        await tx.posicionCartera.update({
          where: { id: posicionId },
          data: { cantidad: nuevaCantidad },
        });
      }

      const existente = await tx.custodiaCliente.findUnique({
        where: { clienteId_activoId: { clienteId, activoId: posicion.activoId } },
      });

      if (existente) {
        const cantidadActual = new Decimal(existente.cantidadTotal.toString());
        const nuevaCantidadTotal = cantidadActual.plus(cantidad);
        const nuevoPrecioPromedio = calcularPrecioPromedio({
          cantidadActual,
          precioActual: new Decimal(existente.precioPromedio.toString()),
          cantidadNueva: cantidad,
          precioNuevo: new Decimal(posicion.precioCompra.toString()),
        });

        await tx.custodiaCliente.update({
          where: { id: existente.id },
          data: {
            cantidadTotal: nuevaCantidadTotal,
            precioPromedio: nuevoPrecioPromedio,
          },
        });
      } else {
        await tx.custodiaCliente.create({
          data: {
            id: crypto.randomUUID(),
            clienteId,
            activoId: posicion.activoId,
            cantidadTotal: cantidad,
            precioPromedio: posicion.precioCompra,
            updatedAt: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          accion: "TRANSFERENCIA_ACTIVO",
          entidad: "PosicionCartera",
          entidadId: posicionId,
          datosNuevos: {
            clienteId,
            activoId: posicion.activoId,
            cantidad: cantidad.toString(),
            precioCompra: posicion.precioCompra.toString(),
            descripcion: "Transferencia de cartera propia a custodia cliente",
          },
        },
      });
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al ejecutar transferencia";
    return { error: msg };
  }

  revalidatePath("/cartera");
  revalidatePath("/custodia");

  return { success: true };
}
