// MACRO 1 — Registro canónico de permisos.
//
// ÚNICA fuente de verdad del vocabulario de permisos y de los defaults por rol.
// Lo consultan tanto el guard de Server Actions (requireActionPermission) como
// el gating de páginas/sidebar (requirePermission / hasPermission /
// getEffectivePermissions). La tabla UserPermiso solo guarda overrides por
// usuario con ESTAS mismas claves; RolPermiso queda deprecada (ya no se lee).
//
// Módulo puro, sin imports: se puede usar desde componentes cliente y tests.

export type RoleName = "ADMIN" | "SOCIO" | "EMPLEADO" | "CLIENTE";

type Kind = "accion" | "vista";

interface PermissionDef {
  key: string;
  label: string;
  kind: Kind;
  /** Roles que lo tienen sin override. ADMIN no figura: siempre lo tiene. */
  defaults: readonly Exclude<RoleName, "ADMIN">[];
  /** Solo ADMIN, sin override posible (ni grant ni revoke). */
  adminOnly?: boolean;
}

const S = ["SOCIO"] as const;
const SE = ["SOCIO", "EMPLEADO"] as const;
const NONE = [] as const;

export const PERMISSIONS = [
  // ── Bolsa / holdings / mesa ────────────────────────────────────────────────
  { key: "bolsa:crear",               label: "Bolsa — crear / importar op",        kind: "accion", defaults: S },
  { key: "bolsa:concertar",           label: "Bolsa — concertar",                  kind: "accion", defaults: S },
  { key: "bolsa:anular",              label: "Bolsa — anular op",                  kind: "accion", defaults: S },
  { key: "bolsa:transferir_custodia", label: "Bolsa — transferir a custodia",      kind: "accion", defaults: S },
  { key: "holdings:comprar",          label: "Holdings — comprar",                 kind: "accion", defaults: SE },
  { key: "holdings:vender",           label: "Holdings — vender",                  kind: "accion", defaults: SE },
  { key: "holdings:editar",           label: "Holdings — editar / importar",       kind: "accion", defaults: SE },
  { key: "holdings:eliminar",         label: "Holdings — eliminar",                kind: "accion", defaults: S },
  { key: "comitentes:editar",         label: "Comitentes — alta / edición / baja", kind: "accion", defaults: S },
  { key: "saldos:editar",             label: "Saldos cartera/comitente — editar",  kind: "accion", defaults: [...SE] },

  // ── Caja ───────────────────────────────────────────────────────────────────
  { key: "caja:operar_oficina",       label: "Caja — operar Oficina (y cajas no-Trenque)", kind: "accion", defaults: S },
  { key: "caja:operar_trenque",       label: "Caja — operar Trenque",              kind: "accion", defaults: SE },
  { key: "caja:editar_movimiento",    label: "Caja — editar movimiento",           kind: "accion", defaults: S },
  { key: "caja:eliminar_movimiento",  label: "Caja — eliminar / revertir movimiento", kind: "accion", defaults: S },
  { key: "caja:transferir",           label: "Caja — transferir entre cajas / cartera", kind: "accion", defaults: S },

  // ── Operativa ──────────────────────────────────────────────────────────────
  { key: "cambio:operar",             label: "Cambio — crear / liquidar / revertir op", kind: "accion", defaults: S },
  { key: "operativa:crear",           label: "Operativa — crear (mov. diarios, rulos, div/int, LP)", kind: "accion", defaults: SE },
  { key: "operativa:eliminar",        label: "Operativa — eliminar",               kind: "accion", defaults: S },

  // ── Clientes / CC / PF ─────────────────────────────────────────────────────
  { key: "clientes:crear",            label: "Clientes — crear",                   kind: "accion", defaults: SE },
  { key: "clientes:editar",           label: "Clientes — editar",                  kind: "accion", defaults: S },
  { key: "clientes:eliminar",         label: "Clientes — eliminar",                kind: "accion", defaults: S },
  { key: "cc:crear_movimiento",       label: "CC — crear / revertir movimiento",   kind: "accion", defaults: SE },
  { key: "cc:intereses",              label: "CC — intereses / tasa",              kind: "accion", defaults: S },
  { key: "cc:eliminar_movimiento",    label: "CC — revertir operación",            kind: "accion", defaults: S },
  { key: "cc:reconciliar",            label: "CC — reconciliar saldo",             kind: "accion", defaults: NONE },
  { key: "pf:crear",                  label: "PF — crear",                         kind: "accion", defaults: SE },
  { key: "pf:editar",                 label: "PF — editar",                        kind: "accion", defaults: S },

  // ── Comisiones / productores ───────────────────────────────────────────────
  { key: "comisiones:gestionar",      label: "Comisiones — revisar / asignar productor", kind: "accion", defaults: S },

  // ── Administración (por defecto solo ADMIN, otorgable por override) ────────
  { key: "configuracion:editar",      label: "Configuración — editar",             kind: "accion", defaults: NONE },
  { key: "configuracion:cajas",       label: "Configuración — cajas",              kind: "accion", defaults: NONE },
  { key: "mes:editar",                label: "Mes contable activo — editar",       kind: "accion", defaults: NONE },
  { key: "inmobiliarias:editar",      label: "Inmobiliarias — editar",             kind: "accion", defaults: NONE },

  // ── Solo ADMIN (nunca otorgable) ───────────────────────────────────────────
  { key: "usuarios:administrar",      label: "Usuarios y permisos — administrar",  kind: "accion", defaults: NONE, adminOnly: true },
  { key: "sistema:admin",             label: "Sistema — cierres, sync de precios, metadata", kind: "accion", defaults: NONE, adminOnly: true },

  // ── Vistas (páginas / sidebar) ─────────────────────────────────────────────
  { key: "posicion:leer",             label: "Ver — posición / inicio",            kind: "vista", defaults: SE },
  { key: "patrimonio:leer",           label: "Ver — reportes",                     kind: "vista", defaults: S },
  { key: "analisis:leer",             label: "Ver — análisis",                     kind: "vista", defaults: S },
  { key: "caja:leer",                 label: "Ver — caja",                         kind: "vista", defaults: S },
  { key: "mov_diarios:leer",          label: "Ver — movimientos diarios",          kind: "vista", defaults: S },
  { key: "rulos:leer",                label: "Ver — rulos",                        kind: "vista", defaults: S },
  { key: "div_intereses:leer",        label: "Ver — div / intereses",              kind: "vista", defaults: S },
  { key: "largo_plazo:leer",          label: "Ver — largo plazo",                  kind: "vista", defaults: S },
  { key: "historial:leer",            label: "Ver — historial",                    kind: "vista", defaults: S },
  { key: "clientes:leer",             label: "Ver — clientes",                     kind: "vista", defaults: SE },
  { key: "cuentas_corrientes:leer",   label: "Ver — cuentas corrientes",           kind: "vista", defaults: SE },
  { key: "plazos_fijos:leer",         label: "Ver — plazos fijos",                 kind: "vista", defaults: S },
  { key: "recordatorios:leer",        label: "Ver — pendientes",                   kind: "vista", defaults: S },
  { key: "activos:leer",              label: "Ver — precios / activos",            kind: "vista", defaults: SE },
  { key: "carteras:leer",             label: "Ver — carteras",                     kind: "vista", defaults: S },
  { key: "banco_industrial:leer",     label: "Ver — cuentas de inversión",         kind: "vista", defaults: S },
  { key: "bolsa:leer",                label: "Ver — bolsa (notificaciones)",       kind: "vista", defaults: S },
  { key: "operaciones_rulo:leer",     label: "Ver — bolsa (sidebar)",              kind: "vista", defaults: S },
  { key: "configuracion:leer",        label: "Ver — configuración / comisiones / cierres", kind: "vista", defaults: NONE },
  { key: "auditoria:leer",            label: "Ver — auditoría",                    kind: "vista", defaults: NONE },
  { key: "usuarios:leer",             label: "Ver — usuarios y permisos",          kind: "vista", defaults: NONE },
  { key: "backups:leer",              label: "Ver — backup / import legacy",       kind: "vista", defaults: NONE },
] as const satisfies readonly PermissionDef[];

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

const BY_KEY: ReadonlyMap<string, PermissionDef> = new Map(
  (PERMISSIONS as readonly PermissionDef[]).map((p) => [p.key, p]),
);

export function isPermissionKey(key: string): key is PermissionKey {
  return BY_KEY.has(key);
}

export function getPermissionDef(key: string): PermissionDef | undefined {
  return BY_KEY.get(key);
}

/** Claves que un ADMIN puede otorgar/revocar por usuario (excluye adminOnly). */
export const OVERRIDABLE_KEYS: readonly PermissionKey[] = PERMISSIONS
  .filter((p) => !("adminOnly" in p && p.adminOnly))
  .map((p) => p.key);

export const ACTION_KEYS: readonly PermissionKey[] = PERMISSIONS
  .filter((p) => p.kind === "accion")
  .map((p) => p.key);

/**
 * Roles con 2FA OBLIGATORIO (sin 2FA activo: no operan ni navegan fuera de
 * /configuracion/2fa y /configuracion/mi-cuenta). Decisión de negocio PRE-CUTOVER
 * (2026-11-04): solo ADMIN. Para SOCIO / EMPLEADO el 2FA es VOLUNTARIO: pueden
 * activarlo desde /configuracion/2fa y, si lo activan, el login lo exige igual.
 * SSOT: lo usan el middleware (auth.config.ts) y los guards (permissions.ts).
 */
export const ROLES_2FA_OBLIGATORIO: ReadonlySet<string> = new Set(["ADMIN"]);

/**
 * Resolución pura. Orden:
 *  1. clave desconocida → false (fail closed);
 *  2. ADMIN → true siempre;
 *  3. adminOnly → false para cualquier otro rol (override ignorado);
 *  4. override vigente del usuario (true/false);
 *  5. default del rol.
 */
export function resolvePermission(
  role: string | null | undefined,
  key: string,
  override: boolean | null,
): boolean {
  const def = BY_KEY.get(key);
  if (!def) return false;
  if (role === "ADMIN") return true;
  if (def.adminOnly) return false;
  if (override !== null) return override;
  return (def.defaults as readonly string[]).includes(role ?? "");
}

// ── Puente de compatibilidad TEMPORAL (transición MACRO 1) ──────────────────
//
// Mientras existan overrides con el vocabulario viejo (antes de correr
// prisma/data-migrations/20261029_macro1_permisos), una REVOCACIÓN legacy
// restringe también las claves canónicas equivalentes. Así "código nuevo +
// overrides viejos" nunca amplía acceso respecto del estado previo.
//   - Solo revocaciones (concedido=false) tienen efecto; un grant legacy se ignora.
//   - Una clave legacy fuera de este mapa no tiene ningún efecto (nunca concede).
//   - Una revocación legacy gana sobre un override canónico (fail closed).
// Es el MISMO mapping que borra la migración (bloque LEGACY de 02_migrate.sql,
// validado por test). La migración materializa primero las revocaciones
// canónicas equivalentes (estado efectivo) y recién después borra las legacy.
// REMOVE ONLY AFTER: producción migrada; TEST migrado; todos los ambientes
// relevantes migrados; verificación de que no quedan legacy rows
// (03_postcheck "ningún override no canónico en toda la tabla" = ok en cada uno).
const CAJA_ESCRITURA = ["caja:operar_oficina", "caja:operar_trenque", "caja:editar_movimiento", "caja:eliminar_movimiento", "caja:transferir"] as const;

export const LEGACY_REVOCATION_BRIDGE: Readonly<Record<string, readonly PermissionKey[]>> = {
  // Mapping de grupo, igual al README de la migración (fail closed: cada clave
  // legacy de caja restringe toda la escritura de caja).
  "caja:crear":           CAJA_ESCRITURA,
  "caja:editar":          CAJA_ESCRITURA,
  "caja:eliminar":        CAJA_ESCRITURA,
  "caja:escribir":        CAJA_ESCRITURA,
  "mov_diarios:crear":    ["cambio:operar"],
  "mov_diarios:editar":   ["cambio:operar"],
  "mov_diarios:eliminar": ["cambio:operar"],
  "mov_diarios:escribir": ["cambio:operar"],
};

/** Claves legacy cuya revocación restringe `key` (vía el puente). */
export function legacyKeysFor(key: string): string[] {
  return Object.entries(LEGACY_REVOCATION_BRIDGE)
    .filter(([, canon]) => (canon as readonly string[]).includes(key))
    .map(([legacy]) => legacy);
}

export interface OverrideRow {
  clave: string;
  concedido: boolean;
  temporal: boolean;
  fechaExpiracion: Date | null;
}

/**
 * Override efectivo de `key` a partir de las filas vigentes del usuario
 * (canónica + legacy). Revocación legacy → false; si no, el override canónico;
 * si no hay, null (default de rol).
 */
export function effectiveOverride(key: string, rows: readonly OverrideRow[], now: Date = new Date()): boolean | null {
  const vigentes = rows.filter((r) => overrideVigente(r, now));
  const legacy = legacyKeysFor(key);
  if (vigentes.some((r) => legacy.includes(r.clave) && !r.concedido)) return false;
  const canon = vigentes.find((r) => r.clave === key);
  return canon ? canon.concedido : null;
}

// ── Implicación histórica (R4, monotonicidad B ⊆ A) ─────────────────────────
//
// En el código anterior (b49aa4d) TODA la operatoria de cambio (crear, editar,
// cobrar, liquidar, revertir, cambio entre cajas) exigía `caja:operar_oficina`.
// Ahora se guarda con `cambio:operar` (+ scope de las cajas liquidadas; sin
// liquidación el scope es vacío). Para que una revocación de
// `caja:operar_oficina` siga bloqueando lo que bloqueaba, `cambio:operar` exige
// además `caja:operar_oficina` efectiva cuando NO hay override canónico propio:
//   - override explícito de la clave (true/false) ⇒ manda ese valor (decisión
//     explícita; la migración los materializa para que la política final no
//     dependa de la implicación);
//   - sin override explícito ⇒ default del rol AND caja:operar_oficina efectiva.
// Una revocación legacy de la clave siempre gana (ver effectiveOverride).
// REMOVE ONLY AFTER: producción, TEST y todo ambiente relevante migrados Y una
// migración posterior materialice override explícito para todo usuario con
// caja:operar_oficina revocada (si no, retirarla ampliaría acceso).
// (Confirmar pendientes también exigía oficina siempre: ver
// requireActionPermission(..., { orExplicitGrant }) en confirmarMovimientoCajaPendiente.
// No se implica caja:operar_trenque globalmente: el código viejo daba Trenque a
// EMPLEADO sin oficina.)
export const REQUIERE_OFICINA_SI_IMPLICITO: readonly PermissionKey[] = ["cambio:operar"];

/**
 * Claves cuyo override EXPLÍCITO concedido=true habilita algo más que su
 * default (orExplicitGrant). Un grant explícito sobre ellas no puede aparecer
 * por migración si antes no existía esa capacidad (ver 02_migrate.sql, ALT_EXPLICIT).
 */
export const EXPLICIT_ALTERNATIVE_KEYS: readonly PermissionKey[] = ["caja:operar_trenque"];

/**
 * PRECHECK TRANSITION MONOTONICITY: claves NUEVAS o REMAPEADAS respecto del
 * código anterior (o usadas como alternativa explícita). Un override vigente
 * concedido=true de un no-ADMIN sobre ellas haría que el código nuevo diera algo
 * que el viejo no daba ⇒ 01_precheck (bloque 8) y 02_migrate abortan (FAIL CLOSED).
 */
export const TRANSITION_MONOTONIC_KEYS: readonly PermissionKey[] = [
  "cambio:operar", "caja:operar_trenque", "comitentes:editar", "comisiones:gestionar",
  "cc:reconciliar", "inmobiliarias:editar", "usuarios:administrar", "sistema:admin",
];

/** true solo si hay override canónico VIGENTE concedido=true y ninguna revocación legacy. */
export function explicitGrant(key: string, rows: readonly OverrideRow[], now: Date = new Date()): boolean {
  return effectiveOverride(key, rows, now) === true;
}

/** Claves cuyas filas hacen falta para evaluar `key` (canónica, legacy, implicaciones). */
export function rowKeysFor(key: string): string[] {
  const out = new Set<string>([key, ...legacyKeysFor(key)]);
  if ((REQUIERE_OFICINA_SI_IMPLICITO as readonly string[]).includes(key)) {
    for (const k of rowKeysFor("caja:operar_oficina")) out.add(k);
  }
  return Array.from(out);
}

/**
 * Permiso EFECTIVO: registro + override (canónico y puente legacy) + implicación
 * histórica. Única función de resolución que usan guard, UI y páginas.
 */
export function effectivePermission(role: string | null | undefined, key: string, rows: readonly OverrideRow[], now: Date = new Date()): boolean {
  const ov = effectiveOverride(key, rows, now);
  const allowed = resolvePermission(role, key, ov);
  if (!allowed || role === "ADMIN" || ov !== null) return allowed;
  if ((REQUIERE_OFICINA_SI_IMPLICITO as readonly string[]).includes(key)) {
    return effectivePermission(role, "caja:operar_oficina", rows, now);
  }
  return allowed;
}

/** Un override es vigente si no es temporal o si su vencimiento es futuro. */
export function overrideVigente(
  o: { temporal: boolean; fechaExpiracion: Date | null },
  now: Date = new Date(),
): boolean {
  return !(o.temporal && o.fechaExpiracion !== null && o.fechaExpiracion < now);
}
