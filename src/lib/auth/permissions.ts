import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { readOnlyPreview } from "@/lib/config";
import { writeAuditLog } from "@/lib/services/audit.service";
import {
  PERMISSIONS,
  ROLES_2FA_OBLIGATORIO,
  effectivePermission,
  explicitGrant,
  getPermissionDef,
  rowKeysFor,
  type OverrideRow,
} from "./permission-registry";

// MACRO 1 — Guard central de autorización.
//
// Una sola resolución para Server Actions (requireActionPermission), UI
// (canDoAction) y páginas/sidebar (requirePermission / hasPermission /
// getEffectivePermissions): registro canónico en código (permission-registry)
// + overrides por usuario en UserPermiso con las MISMAS claves. RolPermiso ya
// no se consulta.
//
// requireActionPermission además centraliza, para toda Server Action:
//   sesión → readOnlyPreview → clave registrada → usuario activo en DB (rol
//   real, no el del JWT) → 2FA obligatorio → "ver como" de ADMIN (solo
//   lectura) → permiso. Todo rechazo con actor identificado queda auditado
//   con un reason code estructurado.

export const PREVIEW_COOKIE = "byg_preview_user";

const DENIED = "No tenés permisos para realizar esta acción.";
const PREVIEW_DENIED = "Estás en modo \"ver como\": es solo lectura. Salí de la vista previa para operar.";
const TWO_FA_DENIED = "Tenés que activar la verificación en dos pasos (2FA) antes de operar.";
const INACTIVE_DENIED = "Sesión inválida. Volvé a iniciar sesión.";

export type DenyReason =
  | "UNKNOWN_PERMISSION"
  | "USER_NOT_FOUND"
  | "USER_INACTIVE"
  | "TWO_FACTOR_REQUIRED"
  | "PREVIEW_READ_ONLY"
  | "GLOBAL_READ_ONLY"
  | "PERMISSION_DENIED"
  | "CAJA_SIN_SCOPE";

type GuardMode = "write" | "read";

interface GuardOptions {
  /** Compatibilidad: los grants temporales ya son overrides vigentes. */
  allowTemporary?: boolean;
  /** "read": acción de solo consulta; se permite en readOnlyPreview y en "ver como". */
  mode?: GuardMode;
  /**
   * Alternativa EXPLÍCITA: también se permite si el usuario tiene un override
   * canónico vigente concedido=true de esta clave (nunca por default de rol).
   * Se registra en el registro de claves (debe existir y no ser adminOnly).
   */
  orExplicitGrant?: string;
}

interface DbSubject {
  id: string;
  name: string;
  role: string;
  activo: boolean;
  twoFactorEnabled: boolean;
}

async function loadSubject(userId: string): Promise<DbSubject | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, activo: true, twoFactorEnabled: true },
  });
}

/** Filas de override para resolver `key`: canónica + puente legacy + implicación histórica. */
async function loadOverrideRows(userId: string, key: string): Promise<OverrideRow[]> {
  const claves = rowKeysFor(key);
  const rows = await prisma.userPermiso.findMany({
    where: {
      userId,
      OR: claves.map((c) => {
        const [modulo, accion] = c.split(":");
        return { Permiso: { modulo, accion } };
      }),
    },
    select: { concedido: true, temporal: true, fechaExpiracion: true, Permiso: { select: { modulo: true, accion: true } } },
  });
  return rows.map(toOverrideRow);
}

function toOverrideRow(r: { concedido: boolean; temporal: boolean; fechaExpiracion: Date | null; Permiso: { modulo: string; accion: string } }): OverrideRow {
  return { clave: `${r.Permiso.modulo}:${r.Permiso.accion}`, concedido: r.concedido, temporal: r.temporal, fechaExpiracion: r.fechaExpiracion };
}

async function getPreviewUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(PREVIEW_COOKIE)?.value || null;
}

/** Rechazo auditado. Un fallo de auditoría NUNCA cambia el resultado: siempre devuelve el rechazo. */
async function deny(userId: string, reason: DenyReason, detail: string, error: string) {
  try {
    await writeAuditLog({
      userId,
      accion: "ACCESO_DENEGADO",
      entidad: "Permission",
      description: detail,
      metadata: { reason },
    });
  } catch (e) {
    console.error("[auth] no se pudo auditar un rechazo", { reason, error: e instanceof Error ? e.message : "desconocido" });
  }
  return { error };
}

/**
 * Guard obligatorio de toda Server Action.
 * Uso: const denied = await requireActionPermission("bolsa:concertar");
 *      if (denied) return denied;
 */
export async function requireActionPermission(
  permissionKey: string,
  opts?: GuardOptions,
): Promise<{ error: string } | null> {
  const session = await auth();
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) return { error: "Sin sesión activa" };

  const mode: GuardMode = opts?.mode ?? "write";
  if (mode === "write" && readOnlyPreview) {
    return deny(sessionUserId, "GLOBAL_READ_ONLY", permissionKey, "Modo lectura activo");
  }

  const alt = opts?.orExplicitGrant;
  if (!getPermissionDef(permissionKey) || (alt !== undefined && (!getPermissionDef(alt) || getPermissionDef(alt)!.adminOnly))) {
    return deny(sessionUserId, "UNKNOWN_PERMISSION", alt ? `${permissionKey}|${alt}` : permissionKey, DENIED);
  }

  const [subject, overrideRows, altRows] = await Promise.all([
    loadSubject(sessionUserId),
    loadOverrideRows(sessionUserId, permissionKey),
    alt ? loadOverrideRows(sessionUserId, alt) : Promise.resolve([] as OverrideRow[]),
  ]);
  if (!subject) return deny(sessionUserId, "USER_NOT_FOUND", permissionKey, INACTIVE_DENIED);
  if (!subject.activo) return deny(subject.id, "USER_INACTIVE", `${subject.name}: ${permissionKey}`, INACTIVE_DENIED);

  if (ROLES_2FA_OBLIGATORIO.has(subject.role) && !subject.twoFactorEnabled) {
    return deny(subject.id, "TWO_FACTOR_REQUIRED", `${subject.name}: ${permissionKey}`, TWO_FA_DENIED);
  }

  if (mode === "write" && subject.role === "ADMIN" && (await getPreviewUserId())) {
    return deny(subject.id, "PREVIEW_READ_ONLY", `${subject.name}: ${permissionKey}`, PREVIEW_DENIED);
  }

  if (effectivePermission(subject.role, permissionKey, overrideRows)) return null;
  if (alt && explicitGrant(alt, altRows)) return null;

  return deny(subject.id, "PERMISSION_DENIED", `${subject.name}: ${permissionKey}`, DENIED);
}

// ── Scope de caja ───────────────────────────────────────────────────────────
//
// Fuente canónica: Caja.tipo (no el slug). SUCURSAL_OPERATIVA = caja de
// sucursal (hoy: Trenque) → caja:operar_trenque. CENTRAL_CONTABLE,
// CAJA_SEGURIDAD y BANCO → caja:operar_oficina. Un tipo sin regla o una caja
// inexistente → rechazo (nunca se asume un scope).

export type CajaScope = "OFICINA" | "TRENQUE";

const SCOPE_POR_TIPO: Readonly<Record<string, CajaScope>> = {
  SUCURSAL_OPERATIVA: "TRENQUE",
  CENTRAL_CONTABLE: "OFICINA",
  CAJA_SEGURIDAD: "OFICINA",
  BANCO: "OFICINA",
};

const PERMISO_POR_SCOPE: Readonly<Record<CajaScope, string>> = {
  OFICINA: "caja:operar_oficina",
  TRENQUE: "caja:operar_trenque",
};

export function scopeDeTipoCaja(tipo: string | null | undefined): CajaScope | null {
  return (tipo && SCOPE_POR_TIPO[tipo]) || null;
}

/**
 * Exige el permiso de CADA scope involucrado: [Oficina, Trenque] requiere
 * caja:operar_oficina Y caja:operar_trenque.
 */
export async function requireCajaPermission(
  cajaIds: readonly (string | null | undefined)[],
): Promise<{ error: string } | null> {
  const ids = Array.from(new Set(cajaIds.filter((id): id is string => !!id && id.trim() !== "")));
  if (ids.length === 0) return null;

  const cajas = await prisma.caja.findMany({ where: { id: { in: ids } }, select: { id: true, tipo: true } });
  const tipoById = new Map(cajas.map((c) => [c.id, c.tipo as string]));

  const scopes = new Set<CajaScope>();
  for (const id of ids) {
    const scope = scopeDeTipoCaja(tipoById.get(id));
    if (!scope) {
      const session = await auth();
      if (!session?.user?.id) return { error: "Sin sesión activa" };
      return deny(session.user.id, "CAJA_SIN_SCOPE", `caja ${id} sin scope conocido`, DENIED);
    }
    scopes.add(scope);
  }

  for (const scope of (["OFICINA", "TRENQUE"] as const).filter((s) => scopes.has(s))) {
    const denied = await requireActionPermission(PERMISO_POR_SCOPE[scope]);
    if (denied) return denied;
  }
  return null;
}

// ── Cuenta propia ───────────────────────────────────────────────────────────

/**
 * Guard para acciones sobre la cuenta propia (perfil, contraseña, 2FA).
 * Exige sesión, usuario existente y activo, actor real (no "ver como") y no
 * readOnlyPreview. El 2FA previo solo se omite si allowWithout2FA (necesario
 * para poder activarlo). Devuelve el id del actor real.
 */
export async function requireOwnAccountGuard(opts: { allowWithout2FA: boolean }):
  Promise<{ userId: string } | { error: string }> {
  const session = await auth();
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) return { error: "Sin sesión activa" };

  if (readOnlyPreview) return deny(sessionUserId, "GLOBAL_READ_ONLY", "cuenta propia", "Modo lectura activo");

  const subject = await loadSubject(sessionUserId);
  if (!subject) return deny(sessionUserId, "USER_NOT_FOUND", "cuenta propia", INACTIVE_DENIED);
  if (!subject.activo) return deny(subject.id, "USER_INACTIVE", `${subject.name}: cuenta propia`, INACTIVE_DENIED);

  // La cookie de "ver como" solo tiene efecto para un ADMIN vigente (igual que
  // en requireActionPermission); para cualquier otro rol es inerte.
  if (subject.role === "ADMIN" && (await getPreviewUserId())) {
    return deny(subject.id, "PREVIEW_READ_ONLY", `${subject.name}: cuenta propia`, PREVIEW_DENIED);
  }

  if (!opts.allowWithout2FA && ROLES_2FA_OBLIGATORIO.has(subject.role) && !subject.twoFactorEnabled) {
    return deny(subject.id, "TWO_FACTOR_REQUIRED", `${subject.name}: cuenta propia`, TWO_FA_DENIED);
  }

  return { userId: subject.id };
}

/** ADMIN vigente según DB (activo + 2FA). Para "ver como" y rutas solo-ADMIN. */
export async function isCurrentAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  const subject = await loadSubject(session.user.id);
  return !!subject && subject.activo && subject.role === "ADMIN" && subject.twoFactorEnabled;
}

/**
 * Para UI (mostrar/ocultar botones). Misma resolución que el guard. En "ver como"
 * evalúa al usuario previsualizado para que la vista sea fiel (la mutación igual
 * será rechazada por el guard).
 */
export async function canDoAction(permissionKey: string): Promise<boolean> {
  const def = getPermissionDef(permissionKey);
  if (!def) return false;

  const session = await auth();
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) return false;
  if (readOnlyPreview && def.kind === "accion") return false;

  let subject = await loadSubject(sessionUserId);
  if (!subject || !subject.activo) return false;

  if (subject.role === "ADMIN") {
    const previewId = await getPreviewUserId();
    if (previewId) {
      const previewSubject = await loadSubject(previewId);
      if (previewSubject) subject = previewSubject;
    }
  }

  if (ROLES_2FA_OBLIGATORIO.has(subject.role) && !subject.twoFactorEnabled) return false;

  if (subject.role === "ADMIN") return true;
  return effectivePermission(subject.role, permissionKey, await loadOverrideRows(subject.id, permissionKey));
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/**
 * Para páginas. Clave desconocida → false incluso para ADMIN. ADMIN en
 * "ver como" evalúa al usuario previsualizado.
 */
export async function hasPermission(permissionKey: string): Promise<boolean> {
  if (!getPermissionDef(permissionKey)) return false;

  const session = await auth();
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) return false;

  let subject = await loadSubject(sessionUserId);
  if (!subject || !subject.activo) return false;
  // Lecturas sensibles también exigen 2FA del usuario REAL (no se apoya solo en el middleware).
  if (ROLES_2FA_OBLIGATORIO.has(subject.role) && !subject.twoFactorEnabled) return false;

  if (subject.role === "ADMIN") {
    const previewId = await getPreviewUserId();
    if (!previewId) return true;
    const previewSubject = await loadSubject(previewId);
    if (!previewSubject) return true;
    subject = previewSubject;
  }

  return effectivePermission(subject.role, permissionKey, await loadOverrideRows(subject.id, permissionKey));
}

export async function requirePermission(permissionKey: string): Promise<void> {
  const allowed = await hasPermission(permissionKey);
  if (!allowed) redirect("/");
}

/** Set de claves efectivas (registro canónico) para sidebar / notificaciones. */
export async function getEffectivePermissions(userId: string, role: string): Promise<Set<string>> {
  const userOverrides = await prisma.userPermiso.findMany({
    where: { userId },
    select: {
      concedido: true,
      temporal: true,
      fechaExpiracion: true,
      Permiso: { select: { modulo: true, accion: true } },
    },
  });

  const rows = userOverrides.map(toOverrideRow);
  const allowed = new Set<string>();
  for (const p of PERMISSIONS) {
    if (effectivePermission(role, p.key, rows)) allowed.add(p.key);
  }
  return allowed;
}
