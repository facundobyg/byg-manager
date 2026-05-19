"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { TipoInversionInmobiliaria, Moneda } from "@prisma/client";

export async function crearMovimientoInmobiliario(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const propiedadId = formData.get("propiedadId")?.toString();
  const fechaStr = formData.get("fecha")?.toString();
  const tipo = formData.get("tipo")?.toString() as TipoInversionInmobiliaria;
  const descripcion = formData.get("descripcion")?.toString();
  const montoStr = formData.get("monto")?.toString().replace(",", ".");
  const moneda = formData.get("moneda")?.toString() as Moneda;
  const quien = formData.get("quien")?.toString();

  if (!propiedadId || !fechaStr || !tipo || !montoStr || !moneda || !quien) {
    return { error: "Todos los campos son obligatorios" };
  }

  const monto = parseFloat(montoStr);
  if (isNaN(monto) || monto <= 0) {
    return { error: "Monto inválido" };
  }

  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) {
    return { error: "Fecha inválida" };
  }

  try {
    await prisma.inversionInmobiliaria.create({
      data: {
        id: crypto.randomUUID(),
        propiedadId,
        fecha,
        tipo,
        descripcion: descripcion || "",
        monto: new Decimal(monto),
        moneda,
        quien,
      },
    });

    revalidatePath("/carteras/inmobiliarias");
    return { ok: true };
  } catch (error: any) {
    return { error: error.message || "Error al crear movimiento" };
  }
}

export async function crearPropiedad(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const nombre = formData.get("nombre")?.toString().trim();

  if (!nombre) {
    return { error: "El nombre es obligatorio" };
  }

  try {
    await prisma.propiedad.create({
      data: { id: crypto.randomUUID(), nombre, activa: true },
    });

    revalidatePath("/carteras/inmobiliarias");
    return { ok: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Ya existe una propiedad con ese nombre" };
    }
    return { error: error.message || "Error al crear propiedad" };
  }
}

export async function desactivarPropiedad(propiedadId: string) {
  try {
    await prisma.propiedad.update({
      where: { id: propiedadId },
      data: { activa: false },
    });

    revalidatePath("/carteras/inmobiliarias");
    return { ok: true };
  } catch (error: any) {
    return { error: error.message || "Error al desactivar propiedad" };
  }
}
