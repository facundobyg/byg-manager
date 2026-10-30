import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  ACTION_KEYS,
  LEGACY_REVOCATION_BRIDGE,
  effectiveOverride,
  resolvePermission,
  isPermissionKey,
  type OverrideRow,
  type PermissionKey,
} from "./permission-registry";
import { FRANCISCO_POLICY, AUGUSTO_POLICY, type UserPolicy } from "./user-policy";

// MACRO 1 — Estados de transición código ↔ datos (R3).
//
//   STATE A  código viejo + DB vieja   = estado actual de producción.
//   STATE B  código nuevo + DB vieja   = SEGURO: nunca más acceso que A (puente legacy).
//   STATE C  código nuevo + DB migrada = política final.
//   STATE D  código viejo + DB migrada = PROHIBIDO (inseguro, demostrado abajo).
//
// Fixtures: overrides REALES de TEST V5 antes de migrar (por perfil, sin nombres
// en el código de producción).

const row = (clave: string, concedido: boolean): OverrideRow => ({ clave, concedido, temporal: false, fechaExpiracion: null });

const DB_VIEJA = {
  // Perfil "operativa/mesa" (20 overrides)
  OPERATIVA: [
    "clientes:crear", "clientes:editar", "clientes:eliminar", "caja:crear", "caja:editar", "caja:eliminar",
    "configuracion:leer", "auditoria:leer", "usuarios:leer", "recordatorios:leer", "caja:escribir",
    "mov_diarios:crear", "mov_diarios:editar", "mov_diarios:eliminar", "mov_diarios:escribir",
    "cc:crear_movimiento", "cc:intereses", "cc:eliminar_movimiento", "pf:crear", "pf:editar",
  ].map((k) => row(k, false)),
  // Perfil "trenque + CC/PF" (10 overrides)
  TRENQUE: [
    "configuracion:leer", "configuracion:editar", "auditoria:leer", "usuarios:leer", "bolsa:concertar",
    "bolsa:anular", "caja:transferir", "operativa:crear", "operativa:eliminar", "saldos:editar",
  ].map((k) => row(k, false)),
};
const POLITICA: Record<keyof typeof DB_VIEJA, UserPolicy> = { OPERATIVA: FRANCISCO_POLICY, TRENQUE: AUGUSTO_POLICY };

/** Aplica la migración (misma lógica que 02_migrate.sql) sobre filas en memoria. */
function migrar(rows: OverrideRow[], policy: UserPolicy): OverrideRow[] {
  const legacy = new Set(Object.keys(LEGACY_REVOCATION_BRIDGE));
  const out = rows.filter((r) => !legacy.has(r.clave)).map((r) => ({ ...r }));
  for (const [clave, v] of Object.entries(policy)) {
    const ex = out.find((r) => r.clave === clave);
    if (ex) ex.concedido = !!v;
    else out.push(row(clave, !!v));
  }
  return out;
}

// ── Modelo del CÓDIGO VIEJO (b49aa4d), reconstruido del código anterior ──────
// requireActionPermission viejo: ADMIN → todo; override de la clave EXACTA; SOCIO → todo.
// Equivalencia nueva → vieja (qué chequeaba el código viejo para esa capacidad):
const OLD_KEY: Partial<Record<PermissionKey, string | "SIN_GUARD" | "ROL_ADMIN_SOCIO">> = {
  "cambio:operar": "caja:operar_oficina",       // el cambio exigía caja:operar_oficina
  "cc:reconciliar": "saldos:editar",
  "usuarios:administrar": "configuracion:editar", // /permisos usaba configuracion:editar (escalada histórica)
  "sistema:admin": "configuracion:editar",        // backup/relocalizar usaban configuracion:editar
  "comitentes:editar": "SIN_GUARD",               // acciones sin control antes de MACRO 1
  "inmobiliarias:editar": "SIN_GUARD",
  "comisiones:gestionar": "ROL_ADMIN_SOCIO",
};
function oldAllows(role: string, key: PermissionKey, rows: OverrideRow[]): boolean {
  if (role === "ADMIN") return true;
  const old = OLD_KEY[key] ?? key;
  if (old === "SIN_GUARD") return true;
  if (old === "ROL_ADMIN_SOCIO") return role === "SOCIO";
  const ov = rows.find((r) => r.clave === old);
  if (ov) return ov.concedido;
  return role === "SOCIO";
}
const newAllows = (role: string, key: PermissionKey, rows: OverrideRow[]) =>
  resolvePermission(role, key, effectiveOverride(key, rows));

describe.each(Object.keys(DB_VIEJA) as (keyof typeof DB_VIEJA)[])("perfil %s", (perfil) => {
  const vieja = DB_VIEJA[perfil];
  const migrada = migrar(vieja, POLITICA[perfil]);

  it("STATE B ⊆ STATE A: el código nuevo con la DB vieja nunca concede algo que hoy no se tenga", () => {
    const amplia = ACTION_KEYS.filter((k) => newAllows("SOCIO", k, vieja) && !oldAllows("SOCIO", k, vieja));
    expect(amplia).toEqual([]);
  });

  it("STATE B: toda revocación existente (canónica o legacy) sigue restringiendo", () => {
    for (const r of vieja) {
      const afectadas: string[] = isPermissionKey(r.clave) ? [r.clave] : [...(LEGACY_REVOCATION_BRIDGE[r.clave] ?? [])];
      for (const k of afectadas) expect({ k, ok: newAllows("SOCIO", k as PermissionKey, vieja) }).toEqual({ k, ok: false });
    }
  });

  it("STATE C: DB migrada + código nuevo = exactamente la política final", () => {
    const soloPolitica = Object.entries(POLITICA[perfil]).map(([k, v]) => row(k, !!v));
    for (const p of PERMISSIONS) {
      expect({ k: p.key, ok: newAllows("SOCIO", p.key, migrada) }).toEqual({ k: p.key, ok: newAllows("SOCIO", p.key, soloPolitica) });
    }
  });

  it("STATE C ⊆ STATE B: migrar solo restringe, nunca amplía", () => {
    const amplia = PERMISSIONS.filter((p) => newAllows("SOCIO", p.key, migrada) && !newAllows("SOCIO", p.key, vieja));
    expect(amplia.map((p) => p.key)).toEqual([]);
  });
});

describe("STATE D (código viejo + DB migrada) — no objetivo", () => {
  it.each(Object.keys(DB_VIEJA) as (keyof typeof DB_VIEJA)[])(
    "%s: la migración CONSERVADORA no empeora el código viejo (D ⊆ A en backend)", (perfil) => {
      const vieja = DB_VIEJA[perfil];
      const migrada = migrar(vieja, POLITICA[perfil]);
      const amplia = ACTION_KEYS.filter((k) => oldAllows("SOCIO", k, migrada) && !oldAllows("SOCIO", k, vieja));
      expect(amplia).toEqual([]);
    });

  it("pero A y D conservan la escalada HISTÓRICA del código viejo: el perfil OPERATIVA llega a /permisos", () => {
    // Por eso volver al código viejo (rollback) debe ser excepcional y breve:
    // el riesgo es del CÓDIGO viejo, existe hoy en producción (STATE A).
    expect(oldAllows("SOCIO", "usuarios:administrar", DB_VIEJA.OPERATIVA)).toBe(true);
    expect(newAllows("SOCIO", "usuarios:administrar", DB_VIEJA.OPERATIVA)).toBe(false);
  });
});

describe("Propiedades del puente legacy", () => {
  it("D. una revocación legacy nunca amplía acceso (para cualquier clave y cualquier override canónico)", () => {
    for (const legacy of Object.keys(LEGACY_REVOCATION_BRIDGE)) {
      for (const p of PERMISSIONS) {
        for (const canon of [null, true, false] as const) {
          const base: OverrideRow[] = canon === null ? [] : [row(p.key, canon)];
          const con = [...base, row(legacy, false)];
          const sin = resolvePermission("SOCIO", p.key, effectiveOverride(p.key, base));
          const conLegacy = resolvePermission("SOCIO", p.key, effectiveOverride(p.key, con));
          if (conLegacy) expect(sin).toBe(true);
        }
      }
    }
  });

  it("un grant legacy no concede nada", () => {
    for (const legacy of Object.keys(LEGACY_REVOCATION_BRIDGE)) {
      for (const p of PERMISSIONS) {
        expect(effectiveOverride(p.key, [row(legacy, true)])).toBeNull();
      }
    }
  });

  it("E. una clave legacy desconocida no tiene efecto", () => {
    for (const p of PERMISSIONS) {
      expect(effectiveOverride(p.key, [row("inventada:escribir", false), row("caja:borrar_todo", true)])).toBeNull();
    }
  });

  it("revocación legacy temporal vencida no aplica", () => {
    const ayer = new Date(Date.now() - 86_400_000);
    expect(effectiveOverride("caja:operar_oficina", [{ clave: "caja:escribir", concedido: false, temporal: true, fechaExpiracion: ayer }])).toBeNull();
  });

  it("el puente solo apunta a claves canónicas registradas", () => {
    for (const canon of Object.values(LEGACY_REVOCATION_BRIDGE).flat()) expect(isPermissionKey(canon)).toBe(true);
    for (const legacy of Object.keys(LEGACY_REVOCATION_BRIDGE)) expect(isPermissionKey(legacy)).toBe(false);
  });
});
