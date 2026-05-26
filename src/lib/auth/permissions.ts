import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { writeAuditLog } from "@/lib/services/audit.service";

// ── Static action permission matrix ───────────────────────────────────────────
// Primary security layer — no DB required. DB UserPermiso overrides are additive.
const EMPLEADO_ALLOWED = new Set([
  "holdings:comprar",
  "holdings:vender",
  "holdings:editar",
  "saldos:editar",
  // Caja: solo Trenque (oficina requiere permiso temporal)
  "caja:operar_trenque",
  // Operativa diaria
  "operativa:crear",
  // Clientes / CC / PF
  "cc:crear_movimiento",
  "clientes:crear",
  "pf:crear",
  // NOT included: holdings:eliminar, bolsa:anular, configuracion:*, mes:editar,
  //               caja:operar_oficina, caja:editar_movimiento, caja:eliminar_movimiento,
  //               caja:transferir, operativa:eliminar, cc:eliminar_movimiento,
  //               cc:intereses, clientes:editar, clientes:eliminar, pf:editar
]);

function checkActionRole(role: UserRole, key: string): boolean {
  if (role === "ADMIN" || role === "SOCIO") return true;
  if (role === "EMPLEADO") return EMPLEADO_ALLOWED.has(key);
  return false;
}

/**
 * Checks for a user-level DB override (grant or revoke).
 * Returns: true = explicitly granted, false = explicitly revoked, null = no override.
 * Works for any role — allows revoking SOCIO/ADMIN on specific actions,
 * and granting EMPLEADO beyond the static matrix.
 */
async function checkUserLevelOverride(userId: string, permissionKey: string): Promise<boolean | null> {
  const [modulo, accion] = permissionKey.split(":");
  if (!modulo || !accion) return null;

  const permiso = await prisma.permiso.findUnique({ where: { modulo_accion: { modulo, accion } } });
  if (!permiso) return null;

  const override = await prisma.userPermiso.findUnique({
    where: { userId_permisoId: { userId, permisoId: permiso.id } },
  });
  if (!override) return null;

  const expired = override.temporal && override.fechaExpiracion !== null && override.fechaExpiracion < new Date();
  if (expired) return null;

  return override.concedido;
}

/**
 * For server actions — returns { error } on denial instead of redirecting.
 * Usage: const denied = await requireActionPermission("bolsa:concertar");
 *        if (denied) return denied;
 *
 * Check order:
 *  1. User-level DB override (can grant OR revoke, even for SOCIO/ADMIN)
 *  2. Static role matrix
 *  3. Optional temporal DB grant (legacy path, kept for compatibility)
 */
export async function requireActionPermission(
  permissionKey: string,
  opts?: { allowTemporary?: boolean },
): Promise<{ error: string } | null> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sin sesión activa" };

  const role = (session.user as { role?: UserRole }).role ?? "CLIENTE";

  // ADMIN always has full access (no overrides), preview mode handled separately
  if (role === "ADMIN") return null;

  // Check user-level DB override first — can revoke SOCIO or grant EMPLEADO
  const userOverride = await checkUserLevelOverride(session.user.id, permissionKey);
  if (userOverride === false) {
    await writeAuditLog({
      userId:      session.user.id,
      accion:      "ACCESO_DENEGADO",
      entidad:     "Permission",
      description: `${(session.user as { name?: string }).name ?? session.user.id} bloqueado por override: ${permissionKey}`,
    });
    return { error: "No tenés permisos para realizar esta acción." };
  }
  if (userOverride === true) return null;

  // Static role check
  if (checkActionRole(role, permissionKey)) return null;

  // Temporal DB grant (additive, for one-off supervisor overrides)
  if (opts?.allowTemporary && await hasTemporaryPermission(permissionKey)) return null;

  await writeAuditLog({
    userId:      session.user.id,
    accion:      "ACCESO_DENEGADO",
    entidad:     "Permission",
    description: `${(session.user as { name?: string }).name ?? session.user.id} intentó acción sin permiso: ${permissionKey}`,
  });

  return { error: "No tenés permisos para realizar esta acción." };
}

/**
 * For server components — returns boolean to conditionally render UI.
 * Fast: only checks static matrix, no DB hit.
 */
export async function canDoAction(permissionKey: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  const role = (session.user as { role?: UserRole }).role ?? "CLIENTE";
  return checkActionRole(role, permissionKey);
}

/**
 * Checks whether a user has an active *temporary* DB grant for a given key.
 * Useful for one-off supervisor overrides (e.g. Augusto + Caja Oficina for a day).
 * This is additive on top of the static matrix — it only grants, never revokes.
 */
export async function hasTemporaryPermission(permissionKey: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const [modulo, accion] = permissionKey.split(":");
  if (!modulo || !accion) return false;

  const permiso = await prisma.permiso.findUnique({ where: { modulo_accion: { modulo, accion } } });
  if (!permiso) return false;

  const override = await prisma.userPermiso.findUnique({
    where: { userId_permisoId: { userId: session.user.id, permisoId: permiso.id } },
  });
  if (!override || !override.temporal || !override.concedido) return false;
  if (override.fechaExpiracion && override.fechaExpiracion < new Date()) return false;
  return true;
}

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
