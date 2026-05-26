"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireActionPermission } from "@/lib/auth/permissions";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/services/audit.service";

// All modulo:accion keys used by server actions in the app
export const PERMISSION_KEYS = [
  { key: "bolsa:crear",               label: "Bolsa — crear op" },
  { key: "bolsa:concertar",           label: "Bolsa — concertar" },
  { key: "bolsa:anular",              label: "Bolsa — anular op" },
  { key: "bolsa:transferir_custodia", label: "Bolsa — transferir a custodia" },
  { key: "holdings:comprar",          label: "Holdings — comprar" },
  { key: "holdings:vender",           label: "Holdings — vender" },
  { key: "holdings:editar",           label: "Holdings — editar" },
  { key: "caja:operar_oficina",       label: "Caja — operar Oficina" },
  { key: "caja:operar_trenque",       label: "Caja — operar Trenque" },
  { key: "caja:editar_movimiento",    label: "Caja — editar movimiento" },
  { key: "caja:eliminar_movimiento",  label: "Caja — eliminar movimiento" },
  { key: "caja:transferir",           label: "Caja — transferir entre cajas" },
  { key: "operativa:crear",           label: "Operativa — crear" },
  { key: "operativa:eliminar",        label: "Operativa — eliminar" },
  { key: "cc:crear_movimiento",       label: "CC — crear movimiento" },
  { key: "cc:intereses",              label: "CC — aplicar intereses" },
  { key: "cc:eliminar_movimiento",    label: "CC — eliminar movimiento" },
  { key: "clientes:crear",            label: "Clientes — crear" },
  { key: "clientes:editar",           label: "Clientes — editar" },
  { key: "clientes:eliminar",         label: "Clientes — eliminar" },
  { key: "pf:crear",                  label: "PF — crear" },
  { key: "pf:editar",                 label: "PF — editar" },
  { key: "configuracion:editar",      label: "Configuración — editar" },
  { key: "saldos:editar",             label: "Saldos — editar" },
] as const;

export type PermissionKey = typeof PERMISSION_KEYS[number]["key"];

async function ensurePermiso(modulo: string, accion: string): Promise<string> {
  const existing = await prisma.permiso.findUnique({ where: { modulo_accion: { modulo, accion } } });
  if (existing) return existing.id;
  const created = await prisma.permiso.create({
    data: { id: crypto.randomUUID(), modulo, accion },
  });
  return created.id;
}

export async function setUserPermissionOverride(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const userId   = formData.get("userId")?.toString();
  const modulo   = formData.get("modulo")?.toString();
  const accion   = formData.get("accion")?.toString();
  const concedidoStr = formData.get("concedido")?.toString();

  if (!userId || !modulo || !accion || !concedidoStr) return { error: "Faltan datos" };
  if (concedidoStr !== "true" && concedidoStr !== "false" && concedidoStr !== "remove") {
    return { error: "Valor inválido" };
  }

  const permisoId = await ensurePermiso(modulo, accion);

  if (concedidoStr === "remove") {
    await prisma.userPermiso.deleteMany({ where: { userId, permisoId } });
  } else {
    const concedido = concedidoStr === "true";
    await prisma.userPermiso.upsert({
      where:  { userId_permisoId: { userId, permisoId } },
      create: { id: crypto.randomUUID(), userId, permisoId, concedido, temporal: false, createdAt: new Date() },
      update: { concedido },
    });
  }

  const sessionPerm = await auth();
  await writeAuditLog({
    userId:      sessionPerm?.user?.id,
    accion:      "EDITAR",
    entidad:     "UserPermiso",
    description: `Permiso ${modulo}:${accion} para usuario ${userId} → ${concedidoStr}`,
  });

  revalidatePath("/permisos");
  return { ok: true };
}

export async function applyRolePreset(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const userId = formData.get("userId")?.toString();
  const preset = formData.get("preset")?.toString();

  if (!userId || !preset) return { error: "Faltan datos" };

  const PRESETS: Record<string, Array<{ modulo: string; accion: string; concedido: boolean }>> = {
    // Francisco (SOCIO) — revocar acceso write a caja y clientes
    francisco_socio: [
      { modulo: "caja",      accion: "operar_oficina",      concedido: false },
      { modulo: "caja",      accion: "operar_trenque",      concedido: false },
      { modulo: "caja",      accion: "editar_movimiento",   concedido: false },
      { modulo: "caja",      accion: "eliminar_movimiento", concedido: false },
      { modulo: "caja",      accion: "transferir",          concedido: false },
      { modulo: "operativa", accion: "crear",               concedido: false },
      { modulo: "operativa", accion: "eliminar",            concedido: false },
      { modulo: "cc",        accion: "crear_movimiento",    concedido: false },
      { modulo: "cc",        accion: "intereses",           concedido: false },
      { modulo: "clientes",  accion: "crear",               concedido: false },
      { modulo: "clientes",  accion: "editar",              concedido: false },
      { modulo: "pf",        accion: "crear",               concedido: false },
      { modulo: "pf",        accion: "editar",              concedido: false },
    ],
    // Augusto/Nanu (EMPLEADO) — otorgar acceso write a caja Trenque + CC/PF
    augusto_empleado: [
      { modulo: "caja",      accion: "operar_trenque",      concedido: true  },
      { modulo: "caja",      accion: "editar_movimiento",   concedido: true  },
      { modulo: "caja",      accion: "transferir",          concedido: true  },
      { modulo: "operativa", accion: "crear",               concedido: true  },
      { modulo: "cc",        accion: "crear_movimiento",    concedido: true  },
      { modulo: "cc",        accion: "intereses",           concedido: true  },
      { modulo: "pf",        accion: "crear",               concedido: true  },
      { modulo: "pf",        accion: "editar",              concedido: true  },
      { modulo: "clientes",  accion: "crear",               concedido: true  },
    ],
    // Limpiar todos los overrides del usuario
    clear: [],
  };

  const rules = PRESETS[preset];
  if (!rules) return { error: "Preset desconocido" };

  if (preset === "clear") {
    await prisma.userPermiso.deleteMany({ where: { userId } });
  } else {
    for (const rule of rules) {
      const permisoId = await ensurePermiso(rule.modulo, rule.accion);
      await prisma.userPermiso.upsert({
        where:  { userId_permisoId: { userId, permisoId } },
        create: { id: crypto.randomUUID(), userId, permisoId, concedido: rule.concedido, temporal: false, createdAt: new Date() },
        update: { concedido: rule.concedido },
      });
    }
  }

  const sessionPreset = await auth();
  await writeAuditLog({
    userId:      sessionPreset?.user?.id,
    accion:      "EDITAR",
    entidad:     "UserPermiso",
    description: `Preset "${preset}" aplicado a usuario ${userId}`,
  });

  revalidatePath("/permisos");
  return { ok: true };
}
