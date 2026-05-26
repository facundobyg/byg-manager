"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/services/audit.service";
import { requireActionPermission } from "@/lib/auth/permissions";
import type { EstadoHonorario, Moneda } from "@prisma/client";

export async function crearHonorario(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const nombre           = formData.get("nombre")?.toString().trim();
  const clienteId        = formData.get("clienteId")?.toString() || null;
  const comitenteId      = formData.get("comitenteId")?.toString() || null;
  const pctAnualStr      = formData.get("porcentajeAnual")?.toString().replace(",", ".");
  const moneda           = (formData.get("moneda")?.toString() || "USD") as Moneda;
  const fechaInicioStr   = formData.get("fechaInicio")?.toString();
  const notas            = formData.get("notas")?.toString().trim() || null;

  if (!nombre || !pctAnualStr || !fechaInicioStr)
    return { error: "Faltan datos obligatorios" };

  const porcentajeAnual = parseFloat(pctAnualStr);
  if (isNaN(porcentajeAnual) || porcentajeAnual < 0 || porcentajeAnual > 100)
    return { error: "Porcentaje inválido" };

  const fechaInicio = new Date(fechaInicioStr + "T00:00:00Z");
  if (isNaN(fechaInicio.getTime())) return { error: "Fecha inválida" };

  await prisma.honorarioBYG.create({
    data: {
      id: crypto.randomUUID(),
      nombre,
      clienteId,
      comitenteId,
      cobra: true,
      porcentajeAnual,
      moneda,
      fechaInicio,
      notas,
      activo: true,
      updatedAt: new Date(),
    },
  });

  const session = await auth();
  await writeAuditLog({
    userId:      session?.user?.id,
    accion:      "ALTA_HONORARIO",
    entidad:     "HonorarioBYG",
    description: `Honorario "${nombre}" creado: ${porcentajeAnual}% anual`,
  });

  revalidatePath("/honorarios");
  return { ok: true };
}

export async function toggleHonorarioActivo(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  const h = await prisma.honorarioBYG.findUnique({ where: { id } });
  if (!h) return { error: "No encontrado" };

  await prisma.honorarioBYG.update({ where: { id }, data: { activo: !h.activo, updatedAt: new Date() } });
  revalidatePath("/honorarios");
  return { ok: true };
}

export async function registrarHonorarioMes(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const honorarioId    = formData.get("honorarioId")?.toString();
  const mes            = formData.get("mes")?.toString();
  const saldoStr       = formData.get("saldoCartera")?.toString().replace(",", ".");
  const pctStr         = formData.get("porcentaje")?.toString().replace(",", ".");
  const tcMepStr       = formData.get("tcMep")?.toString().replace(",", ".");
  const notas          = formData.get("notas")?.toString().trim() || null;
  const monedaSaldo    = (formData.get("monedaSaldo")?.toString() || "USD") as Moneda;

  if (!honorarioId || !mes || !pctStr) return { error: "Faltan datos" };
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return { error: "Formato de mes inválido (YYYY-MM)" };

  const porcentaje = parseFloat(pctStr);
  if (isNaN(porcentaje)) return { error: "Porcentaje inválido" };

  const saldoCartera = saldoStr ? parseFloat(saldoStr) : null;
  const tcMep        = tcMepStr ? parseFloat(tcMepStr) : null;

  let honorarioUSD: number | null = null;
  let honorarioARS: number | null = null;

  if (saldoCartera !== null) {
    const pctMensual = porcentaje / 100 / 12;
    if (monedaSaldo === "USD") {
      honorarioUSD = saldoCartera * pctMensual;
      honorarioARS = tcMep ? honorarioUSD * tcMep : null;
    } else {
      honorarioARS = saldoCartera * pctMensual;
      honorarioUSD = tcMep ? honorarioARS / tcMep : null;
    }
  }

  await prisma.honorarioBYGMes.upsert({
    where: { honorarioId_mes: { honorarioId, mes } },
    create: {
      id: crypto.randomUUID(),
      honorarioId,
      mes,
      saldoCartera,
      monedaSaldo,
      porcentaje,
      honorarioUSD,
      tcMep,
      honorarioARS,
      estado: "PENDIENTE",
      notas,
      updatedAt: new Date(),
    },
    update: { saldoCartera, monedaSaldo, porcentaje, honorarioUSD, tcMep, honorarioARS, notas, updatedAt: new Date() },
  });

  const session = await auth();
  await writeAuditLog({
    userId:      session?.user?.id,
    accion:      "REGISTRO_HONORARIO_MES",
    entidad:     "HonorarioBYGMes",
    description: `Honorario ${honorarioId} mes ${mes}: saldo=${saldoCartera} pct=${porcentaje}%`,
  });

  revalidatePath("/honorarios");
  return { ok: true };
}

export async function marcarEstadoHonorario(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const id     = formData.get("id")?.toString();
  const estado = formData.get("estado")?.toString() as EstadoHonorario;

  if (!id || !["PENDIENTE", "COBRADO", "NO_CORRESPONDE"].includes(estado))
    return { error: "Datos inválidos" };

  await prisma.honorarioBYGMes.update({ where: { id }, data: { estado, updatedAt: new Date() } });
  revalidatePath("/honorarios");
  return { ok: true };
}
