"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireActionPermission } from "@/lib/auth/permissions";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/services/audit.service";
import { UserRole } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs") as {
  hash(data: string, saltOrRounds: number): Promise<string>;
};

type AvatarValidation = { ok: true; value: string | null } | { ok: false; error: string };

// Valida un avatar enviado como data URL: tamaño real decodificado + magic bytes
// reales del archivo (no solo el MIME que declara el navegador).
function validateAvatarDataUrl(raw: string): AvatarValidation {
  if (!raw) return { ok: true, value: null };

  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(raw);
  if (!match) return { ok: false, error: "Formato de imagen no permitido. Usá JPG, PNG o WebP." };

  const [, mime, b64] = match;

  let bytes: Buffer;
  try {
    bytes = Buffer.from(b64, "base64");
  } catch {
    return { ok: false, error: "Archivo de imagen inválido." };
  }

  if (bytes.length === 0 || bytes.length > 500 * 1024) {
    return { ok: false, error: "La imagen supera el límite de 500 KB." };
  }

  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng  = bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  const matchesDeclaredType =
    (mime === "jpeg" && isJpeg) ||
    (mime === "png"  && isPng)  ||
    (mime === "webp" && isWebp);

  if (!matchesDeclaredType) {
    return { ok: false, error: "El archivo no es una imagen válida (firma de bytes no coincide)." };
  }

  return { ok: true, value: raw };
}

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
      update: { concedido, temporal: false, fechaExpiracion: null },
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
    // Augusto/Nanu (EMPLEADO) — acceso estándar operativo
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
    // Solo lectura — revocar todas las acciones write
    solo_lectura: [
      { modulo: "bolsa",     accion: "crear",               concedido: false },
      { modulo: "bolsa",     accion: "concertar",           concedido: false },
      { modulo: "bolsa",     accion: "anular",              concedido: false },
      { modulo: "caja",      accion: "operar_oficina",      concedido: false },
      { modulo: "caja",      accion: "operar_trenque",      concedido: false },
      { modulo: "caja",      accion: "editar_movimiento",   concedido: false },
      { modulo: "caja",      accion: "eliminar_movimiento", concedido: false },
      { modulo: "caja",      accion: "transferir",          concedido: false },
      { modulo: "operativa", accion: "crear",               concedido: false },
      { modulo: "operativa", accion: "eliminar",            concedido: false },
      { modulo: "cc",        accion: "crear_movimiento",    concedido: false },
      { modulo: "cc",        accion: "intereses",           concedido: false },
      { modulo: "cc",        accion: "eliminar_movimiento", concedido: false },
      { modulo: "clientes",  accion: "crear",               concedido: false },
      { modulo: "clientes",  accion: "editar",              concedido: false },
      { modulo: "clientes",  accion: "eliminar",            concedido: false },
      { modulo: "pf",        accion: "crear",               concedido: false },
      { modulo: "pf",        accion: "editar",              concedido: false },
      { modulo: "configuracion", accion: "editar",          concedido: false },
      { modulo: "saldos",    accion: "editar",              concedido: false },
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
        update: { concedido: rule.concedido, temporal: false, fechaExpiracion: null },
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

export async function setTemporalPermission(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const userId      = formData.get("userId")?.toString();
  const modulo      = formData.get("modulo")?.toString();
  const accion      = formData.get("accion")?.toString();
  const fechaHasta  = formData.get("fechaHasta")?.toString();
  const notas       = formData.get("notas")?.toString() ?? "";

  if (!userId || !modulo || !accion || !fechaHasta) return { error: "Faltan datos" };

  const fechaExpiracion = new Date(fechaHasta + "T23:59:59");
  if (isNaN(fechaExpiracion.getTime())) return { error: "Fecha inválida" };
  if (fechaExpiracion < new Date()) return { error: "La fecha debe ser futura" };

  const permisoId = await ensurePermiso(modulo, accion);
  await prisma.userPermiso.upsert({
    where:  { userId_permisoId: { userId, permisoId } },
    create: { id: crypto.randomUUID(), userId, permisoId, concedido: true, temporal: true, fechaExpiracion, notas, createdAt: new Date() },
    update: { concedido: true, temporal: true, fechaExpiracion, notas },
  });

  const session = await auth();
  await writeAuditLog({
    userId:      session?.user?.id,
    accion:      "PERMISO_TEMPORAL",
    entidad:     "UserPermiso",
    description: `Permiso temporal ${modulo}:${accion} para usuario ${userId} hasta ${fechaHasta}${notas ? ` — ${notas}` : ""}`,
  });

  revalidatePath("/permisos");
  return { ok: true };
}

export async function createUser(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const nombre   = formData.get("nombre")?.toString().trim();
  const email    = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const role     = formData.get("role")?.toString() as UserRole;
  const activo   = formData.get("activo") !== "false";

  if (!nombre || !email || !password || !role) return { error: "Todos los campos son obligatorios" };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres" };
  if (!["ADMIN", "SOCIO", "EMPLEADO", "CLIENTE"].includes(role)) return { error: "Rol inválido" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email inválido" };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Ya existe un usuario con ese email" };

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      id:           crypto.randomUUID(),
      email,
      name:         nombre,
      passwordHash,
      role,
      activo,
      updatedAt:    new Date(),
    },
  });

  const session = await auth();
  await writeAuditLog({
    userId:      session?.user?.id,
    accion:      "ALTA_USUARIO",
    entidad:     "User",
    description: `${(session?.user as any)?.name ?? "Admin"} creó usuario ${nombre} (${email}) con rol ${role}`,
  });

  revalidatePath("/permisos");
  return { ok: true };
}

export async function adminUpdateUserProfile(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const targetUserId = formData.get("userId")?.toString();
  const name         = formData.get("name")?.toString().trim();
  const email        = formData.get("email")?.toString().trim().toLowerCase();
  const activoStr    = formData.get("activo")?.toString();
  const imageRaw     = formData.get("image")?.toString() ?? "";

  if (!targetUserId || !name || !email) return { error: "Faltan datos obligatorios" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email inválido" };

  const imageResult = validateAvatarDataUrl(imageRaw);
  if (!imageResult.ok) return { error: imageResult.error };
  const image = imageResult.value;

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { error: "Usuario no encontrado" };

  if (email !== target.email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return { error: "Ese email ya está en uso" };
  }

  const activo = activoStr === "true";

  await prisma.user.update({
    where: { id: targetUserId },
    data:  { name, email, activo, image, updatedAt: new Date() },
  });

  const session = await auth();
  await writeAuditLog({
    userId:      session?.user?.id,
    accion:      "UPDATE_USER_PROFILE",
    entidad:     "User",
    entidadId:   targetUserId,
    description: `${(session?.user as any)?.name ?? "Admin"} editó perfil de ${target.name} (${target.email})`,
  });

  revalidatePath("/permisos");
  return { ok: true };
}

export async function adminResetPassword(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const targetUserId    = formData.get("userId")?.toString();
  const newPassword     = formData.get("newPassword")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!targetUserId || !newPassword || !confirmPassword) return { error: "Faltan datos" };
  if (newPassword.length < 8) return { error: "Mínimo 8 caracteres" };
  if (newPassword !== confirmPassword) return { error: "Las contraseñas no coinciden" };

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, email: true },
  });
  if (!target) return { error: "Usuario no encontrado" };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: targetUserId },
    data: { passwordHash, mustChangePassword: true, updatedAt: new Date() },
  });

  const session = await auth();
  await writeAuditLog({
    userId:      session?.user?.id,
    accion:      "RESET_PASSWORD",
    entidad:     "User",
    entidadId:   targetUserId,
    description: `${(session?.user as any)?.name ?? "Admin"} reseteó contraseña de ${target.name} (${target.email})`,
  });

  revalidatePath("/permisos");
  return { ok: true };
}

export async function updateUserRole(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("configuracion:editar");
  if (denied) return denied;

  const userId  = formData.get("userId")?.toString();
  const newRole = formData.get("role")?.toString() as UserRole;

  if (!userId || !newRole) return { error: "Faltan datos" };
  if (!["ADMIN", "SOCIO", "EMPLEADO", "CLIENTE"].includes(newRole)) return { error: "Rol inválido" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado" };

  await prisma.user.update({ where: { id: userId }, data: { role: newRole, updatedAt: new Date() } });

  const session = await auth();
  await writeAuditLog({
    userId:      session?.user?.id,
    accion:      "CAMBIO_ROL",
    entidad:     "User",
    description: `${(session?.user as any)?.name ?? "Admin"} cambió rol de ${user.name} de ${user.role} a ${newRole}`,
  });

  revalidatePath("/permisos");
  return { ok: true };
}
