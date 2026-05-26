"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { EstadoComision, UserRole } from "@prisma/client";
import { writeAuditLog } from "@/lib/services/audit.service";

type ActionResult = { success: true } | { error: string };
type AuthSession = { user?: { id?: string; role?: UserRole } } | null;

function getRole(session: AuthSession): UserRole | null {
  return session?.user?.role ?? null;
}

export async function marcarEstadoComision(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth() as AuthSession;
  const userId = session?.user?.id;
  const role = getRole(session);
  if (!userId || !role || !["ADMIN", "SOCIO"].includes(role)) {
    return { error: "Sin permisos" };
  }

  const productorId = formData.get("productorId")?.toString();
  const mes = formData.get("mes")?.toString();
  const estado = formData.get("estado")?.toString() as EstadoComision | undefined;

  if (!productorId || !mes || !estado) return { error: "Faltan datos" };
  if (estado === "PAGADO" && role !== "ADMIN") {
    return { error: "Solo el administrador puede marcar como pagado" };
  }

  const paidAt = estado === "PAGADO" ? new Date() : undefined;
  const paidByUserId = estado === "PAGADO" ? userId : undefined;

  try {
    const record = await prisma.comisionMes.upsert({
      where: { productorId_mes: { productorId, mes } },
      update: { estado, paidAt: paidAt ?? null, paidByUserId: paidByUserId ?? null, updatedAt: new Date() },
      create: {
        id: crypto.randomUUID(),
        productorId,
        mes,
        estado,
        paidAt: paidAt ?? null,
        paidByUserId: paidByUserId ?? null,
        updatedAt: new Date(),
      },
    });

    await writeAuditLog({
      userId,
      accion: "EDICION",
      entidad: "ComisionMes",
      entidadId: record.id,
      description: `Comisión ${mes} productor ${productorId.slice(0, 8)} → ${estado}`,
    });

    revalidatePath("/comisiones");
    return { success: true };
  } catch (e) {
    console.error("marcarEstadoComision:", e);
    return { error: "Error al actualizar estado" };
  }
}

export async function crearProductor(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth() as AuthSession;
  const role = getRole(session);
  if (role !== "ADMIN") return { error: "Solo el administrador puede crear productores" };

  const nombre = formData.get("nombre")?.toString().trim();
  const porcentajeRaw = formData.get("porcentaje")?.toString().replace(",", ".");
  const notas = formData.get("notas")?.toString().trim() || null;

  if (!nombre || !porcentajeRaw) return { error: "Nombre y porcentaje requeridos" };

  const porcentaje = parseFloat(porcentajeRaw);
  if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    return { error: "Porcentaje inválido (0–100)" };
  }

  try {
    await prisma.productor.create({
      data: {
        id: crypto.randomUUID(),
        nombre: nombre.toUpperCase(),
        porcentaje,
        activo: true,
        notas,
        updatedAt: new Date(),
      },
    });

    await writeAuditLog({
      userId: session?.user?.id ?? "",
      accion: "CREACION",
      entidad: "Productor",
      description: `Creación productor ${nombre} (${porcentaje}%)`,
    });

    revalidatePath("/comisiones");
    return { success: true };
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      return { error: "Ya existe un productor con ese nombre" };
    }
    return { error: "Error al crear productor" };
  }
}

export async function actualizarProductor(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth() as AuthSession;
  const role = getRole(session);
  if (role !== "ADMIN") return { error: "Sin permisos" };

  const id = formData.get("id")?.toString();
  const porcentajeRaw = formData.get("porcentaje")?.toString().replace(",", ".");
  const activoRaw = formData.get("activo")?.toString();

  if (!id) return { error: "ID requerido" };

  const data: { porcentaje?: number; activo?: boolean; updatedAt: Date } = { updatedAt: new Date() };
  if (porcentajeRaw) {
    const pct = parseFloat(porcentajeRaw);
    if (isNaN(pct) || pct < 0 || pct > 100) return { error: "Porcentaje inválido" };
    data.porcentaje = pct;
  }
  if (activoRaw !== undefined) {
    data.activo = activoRaw === "true";
  }

  try {
    await prisma.productor.update({ where: { id }, data });
    revalidatePath("/comisiones");
    return { success: true };
  } catch {
    return { error: "Error al actualizar productor" };
  }
}

export async function asignarProductor(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth() as AuthSession;
  const role = getRole(session);
  if (!role || !["ADMIN", "SOCIO"].includes(role)) return { error: "Sin permisos" };

  const clienteId = formData.get("clienteId")?.toString();
  const productorId = formData.get("productorId")?.toString() || null;

  if (!clienteId) return { error: "Cliente requerido" };

  try {
    await prisma.cliente.update({
      where: { id: clienteId },
      data: { productorId: productorId || null, updatedAt: new Date() },
    });
    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath("/comisiones");
    return { success: true };
  } catch {
    return { error: "Error al asignar productor" };
  }
}
