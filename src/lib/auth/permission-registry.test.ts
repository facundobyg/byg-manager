import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  OVERRIDABLE_KEYS,
  resolvePermission,
  overrideVigente,
  isPermissionKey,
  type PermissionKey,
} from "./permission-registry";
import { FRANCISCO_POLICY, AUGUSTO_POLICY, SOLO_LECTURA_POLICY, type UserPolicy } from "./user-policy";

function can(role: string, policy: UserPolicy, key: PermissionKey): boolean {
  const o = policy[key];
  return resolvePermission(role, key, o === undefined ? null : o);
}

const facundo = (k: PermissionKey) => can("ADMIN", {}, k);
const francisco = (k: PermissionKey) => can("SOCIO", FRANCISCO_POLICY, k);
const augusto = (k: PermissionKey) => can("SOCIO", AUGUSTO_POLICY, k);

describe("registro canónico", () => {
  it("claves únicas y con formato modulo:accion", () => {
    const keys = PERMISSIONS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k).toMatch(/^[a-z_]+:[a-z_]+$/);
  });

  it("adminOnly no está entre las claves otorgables", () => {
    expect(OVERRIDABLE_KEYS).not.toContain("usuarios:administrar");
    expect(OVERRIDABLE_KEYS).not.toContain("sistema:admin");
  });

  it("las políticas solo usan claves del registro y nunca adminOnly", () => {
    for (const policy of [FRANCISCO_POLICY, AUGUSTO_POLICY, SOLO_LECTURA_POLICY]) {
      for (const k of Object.keys(policy)) {
        expect(isPermissionKey(k)).toBe(true);
        expect(OVERRIDABLE_KEYS).toContain(k);
      }
    }
  });

  it("override vencido no aplica; permanente sí", () => {
    const ayer = new Date(Date.now() - 86_400_000);
    expect(overrideVigente({ temporal: true, fechaExpiracion: ayer })).toBe(false);
    expect(overrideVigente({ temporal: false, fechaExpiracion: null })).toBe(true);
  });

  it("CLIENTE no tiene nada", () => {
    for (const p of PERMISSIONS) expect(resolvePermission("CLIENTE", p.key, null)).toBe(false);
  });
});

describe("K. Facundo (ADMIN)", () => {
  it("todo permitido, incluidas claves solo-ADMIN", () => {
    for (const p of PERMISSIONS) expect(facundo(p.key)).toBe(true);
  });
});

describe("I. Francisco — Operativa / mesa", () => {
  const permitido: PermissionKey[] = [
    "bolsa:crear", "bolsa:concertar", "bolsa:anular", "bolsa:transferir_custodia",
    "holdings:comprar", "holdings:vender", "holdings:editar", "comitentes:editar",
    "operativa:crear", "operativa:eliminar", "comisiones:gestionar",
    "posicion:leer", "mov_diarios:leer", "clientes:leer", "plazos_fijos:leer",
  ];
  const prohibido: PermissionKey[] = [
    "configuracion:editar", "configuracion:cajas", "mes:editar", "usuarios:administrar", "sistema:admin",
    "cc:crear_movimiento", "cc:intereses", "cc:eliminar_movimiento", "cc:reconciliar",
    "pf:crear", "pf:editar", "clientes:crear", "clientes:editar", "clientes:eliminar",
    "caja:operar_oficina", "caja:operar_trenque", "caja:editar_movimiento", "caja:eliminar_movimiento",
    "caja:transferir", "cambio:operar", "inmobiliarias:editar",
    "configuracion:leer", "auditoria:leer", "usuarios:leer", "backups:leer",
  ];
  it.each(permitido)("permite %s", (k) => expect(francisco(k)).toBe(true));
  it.each(prohibido)("rechaza %s", (k) => expect(francisco(k)).toBe(false));
});

describe("J. Augusto — Trenque + CC/PF", () => {
  const permitido: PermissionKey[] = [
    "caja:operar_trenque", "caja:editar_movimiento", "caja:eliminar_movimiento", "cambio:operar",
    "cc:crear_movimiento", "cc:intereses", "cc:eliminar_movimiento",
    "pf:crear", "pf:editar", "clientes:crear", "clientes:editar",
    "posicion:leer", "caja:leer", "cuentas_corrientes:leer", "plazos_fijos:leer",
  ];
  const prohibido: PermissionKey[] = [
    "caja:operar_oficina", "caja:transferir",
    "configuracion:editar", "configuracion:cajas", "mes:editar", "usuarios:administrar", "sistema:admin",
    "bolsa:concertar", "bolsa:anular", "operativa:crear", "operativa:eliminar",
    "saldos:editar", "clientes:eliminar", "cc:reconciliar", "inmobiliarias:editar",
    "configuracion:leer", "auditoria:leer", "usuarios:leer", "backups:leer",
  ];
  it.each(permitido)("permite %s", (k) => expect(augusto(k)).toBe(true));
  it.each(prohibido)("rechaza %s", (k) => expect(augusto(k)).toBe(false));
});

describe("Solo lectura", () => {
  it("ninguna acción permitida a un SOCIO con preset solo_lectura; vistas operativas sí", () => {
    for (const p of PERMISSIONS) {
      const ok = can("SOCIO", SOLO_LECTURA_POLICY, p.key);
      if (p.kind === "accion") expect({ key: p.key, ok }).toEqual({ key: p.key, ok: false });
    }
    expect(can("SOCIO", SOLO_LECTURA_POLICY, "posicion:leer")).toBe(true);
  });
});
