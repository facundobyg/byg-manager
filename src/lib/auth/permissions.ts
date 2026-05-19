import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";

const PREVIEW_COOKIE = "byg_preview_user";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function hasPermission(permissionKey: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  const realRole = session.user.role as UserRole;

  if (realRole === "ADMIN") {
    const store = await cookies();
    const previewUserId = store.get(PREVIEW_COOKIE)?.value;
    if (!previewUserId) return true;

    const previewUser = await prisma.user.findUnique({
      where: { id: previewUserId },
      select: { role: true },
    });
    if (!previewUser) return true;

    return checkPermission(previewUserId, previewUser.role, permissionKey);
  }

  return checkPermission(session.user.id, realRole, permissionKey);
}

async function checkPermission(userId: string, role: UserRole, permissionKey: string): Promise<boolean> {
  const [modulo, accion] = permissionKey.split(":");
  if (!modulo || !accion) return false;

  const permiso = await prisma.permiso.findUnique({
    where: { modulo_accion: { modulo, accion } },
  });
  if (!permiso) return false;

  const userOverride = await prisma.userPermiso.findUnique({
    where: { userId_permisoId: { userId, permisoId: permiso.id } },
  });

  if (userOverride) {
    const expired =
      userOverride.temporal &&
      userOverride.fechaExpiracion !== null &&
      userOverride.fechaExpiracion < new Date();
    if (!expired) return userOverride.concedido;
  }

  const rolPermiso = await prisma.rolPermiso.findUnique({
    where: { role_permisoId: { role, permisoId: permiso.id } },
  });

  return !!rolPermiso;
}

export async function requirePermission(permissionKey: string): Promise<void> {
  const allowed = await hasPermission(permissionKey);
  if (!allowed) redirect("/");
}

export async function getEffectivePermissions(userId: string, role: UserRole): Promise<Set<string>> {
  const [rolePermisos, userOverrides] = await Promise.all([
    prisma.rolPermiso.findMany({
      where: { role },
      select: { Permiso: { select: { modulo: true, accion: true } } },
    }),
    prisma.userPermiso.findMany({
      where: { userId },
      select: {
        concedido: true,
        temporal: true,
        fechaExpiracion: true,
        Permiso: { select: { modulo: true, accion: true } },
      },
    }),
  ]);

  const allowed = new Set<string>();
  for (const rp of rolePermisos) {
    allowed.add(`${rp.Permiso.modulo}:${rp.Permiso.accion}`);
  }
  for (const up of userOverrides) {
    const key = `${up.Permiso.modulo}:${up.Permiso.accion}`;
    const expired = up.temporal && up.fechaExpiracion !== null && up.fechaExpiracion < new Date();
    if (!expired) {
      if (up.concedido) allowed.add(key);
      else allowed.delete(key);
    }
  }
  return allowed;
}
