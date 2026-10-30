// MACRO 1 — Política canónica por socio, expresada como overrides sobre los
// defaults del rol SOCIO (permission-registry). La usan los presets de
// /permisos, la migración de overrides (prisma/data-migrations/) y los tests.
//
// Solo se listan DESVÍOS del default SOCIO. Lo administrativo (configuración,
// cajas, mes, inmobiliarias, reconciliar CC, usuarios, auditoría, backups) ya
// es "no" por default de rol, así que no hace falta repetirlo acá.

import type { PermissionKey } from "./permission-registry";

export type UserPolicy = Readonly<Partial<Record<PermissionKey, boolean>>>;

/**
 * Francisco — Operativa / mesa (bolsa, holdings, comitentes, rulos/div/LP).
 * Sin Caja (Oficina ni Trenque), sin cambio, sin CC/PF/clientes.
 * Pendiente de negocio: si "Operativa" incluye operaciones de cambio
 * (hoy: no, ver informe MACRO 1, decisión D1).
 */
export const FRANCISCO_POLICY: UserPolicy = {
  "caja:operar_oficina": false,
  "caja:operar_trenque": false,
  "caja:editar_movimiento": false,
  "caja:eliminar_movimiento": false,
  "caja:transferir": false,
  "cambio:operar": false,
  "cc:crear_movimiento": false,
  "cc:intereses": false,
  "cc:eliminar_movimiento": false,
  "pf:crear": false,
  "pf:editar": false,
  "clientes:crear": false,
  "clientes:editar": false,
  "clientes:eliminar": false,
  "recordatorios:leer": false, // preservado de su override previo
};

/**
 * Augusto — Trenque + cambio liquidado en Trenque + CC/PF.
 * Sin Caja Oficina (el scope de caja lo hace cumplir también en cambio,
 * reversas y edición), sin transferencias, sin concertar/anular bolsa
 * (decisión D2 pendiente), sin operativa (rulos/div/LP), sin saldos, sin
 * eliminar clientes.
 *
 * Trenque y cambio van EXPLÍCITOS (true): sin Caja Oficina, la implicación
 * histórica (cambio:operar implícito exige oficina; confirmar pendientes exige
 * oficina u override explícito de Trenque) los bloquearía. La migración los
 * materializa como `PRE AND política`: nunca amplían respecto del estado previo.
 */
export const AUGUSTO_POLICY: UserPolicy = {
  "caja:operar_oficina": false,
  "caja:operar_trenque": true,
  "caja:transferir": false,
  "cambio:operar": true,
  "bolsa:concertar": false,
  "bolsa:anular": false,
  "operativa:crear": false,
  "operativa:eliminar": false,
  "saldos:editar": false,
  "clientes:eliminar": false,
};

/** Solo lectura: revoca toda acción no-administrativa que SOCIO tiene por default. */
export const SOLO_LECTURA_POLICY: UserPolicy = {
  "bolsa:crear": false,
  "bolsa:concertar": false,
  "bolsa:anular": false,
  "bolsa:transferir_custodia": false,
  "holdings:comprar": false,
  "holdings:vender": false,
  "holdings:editar": false,
  "holdings:eliminar": false,
  "comitentes:editar": false,
  "saldos:editar": false,
  "caja:operar_oficina": false,
  "caja:operar_trenque": false,
  "caja:editar_movimiento": false,
  "caja:eliminar_movimiento": false,
  "caja:transferir": false,
  "cambio:operar": false,
  "operativa:crear": false,
  "operativa:eliminar": false,
  "clientes:crear": false,
  "clientes:editar": false,
  "clientes:eliminar": false,
  "cc:crear_movimiento": false,
  "cc:intereses": false,
  "cc:eliminar_movimiento": false,
  "pf:crear": false,
  "pf:editar": false,
  "comisiones:gestionar": false,
};

export function toPresetRules(policy: UserPolicy): Array<{ modulo: string; accion: string; concedido: boolean }> {
  return Object.entries(policy).map(([key, concedido]) => {
    const [modulo, accion] = key.split(":");
    return { modulo, accion, concedido: !!concedido };
  });
}
