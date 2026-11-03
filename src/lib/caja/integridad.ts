// MACRO 3 — Reglas PURAS de integridad de Caja + Cambio (sin DB).
//
// Invariantes:
//   - Caja = saldo inicial + ENTRADAS confirmadas − SALIDAS confirmadas.
//   - Pendiente / anulado: no impactan caja.
//   - Una reversa neutraliza exactamente el movimiento original.
//   - Montos siempre > 0, decimales estrictos; moneda y tipo válidos.
//   - Pendiente con pagos parciales: residual = monto − Σ pagos VÁLIDOS
//     (confirmados, no anulados, no revertidos). Confirmar solo impacta el residual.
//   - Transferencia / cambio entre cajas: patas inseparables (transferenciaRef).
//   - Liquidación de cambio: nunca más que el total de la operación.

import { Decimal } from "@prisma/client/runtime/library";
import { parseMontoEstricto } from "../parse-monto";

export const MONEDAS_VALIDAS = ["ARS", "USD", "EUR", "BRL"] as const;
export type MonedaValida = (typeof MONEDAS_VALIDAS)[number];
export const TIPOS_MOV_MANUAL = ["ENTRADA", "SALIDA"] as const;
export type TipoMovManual = (typeof TIPOS_MOV_MANUAL)[number];

export function esMonedaValida(v: unknown): v is MonedaValida {
  return typeof v === "string" && (MONEDAS_VALIDAS as readonly string[]).includes(v);
}
export function esTipoManual(v: unknown): v is TipoMovManual {
  return typeof v === "string" && (TIPOS_MOV_MANUAL as readonly string[]).includes(v);
}

/** Monto estricto y > 0. Rechaza vacío, 0, negativos, NaN, Infinity, hex, exponentes, "12abc". */
export function parseMontoPositivo(raw: FormDataEntryValue | string | null | undefined): Decimal | null {
  const p = parseMontoEstricto(raw);
  if (!p.ok || p.value === null || !p.value.gt(0)) return null;
  return p.value;
}

// ── Marcas internas reservadas (L1) ──
//
// Prefijos/tokens que SOLO escribe el sistema y que luego se leen estructuralmente
// (reversas, pagos de pendientes, patas de cambio, clasificación, CC, imports).
// El texto libre del usuario no puede contenerlos: si pudiera, un movimiento común
// se haría pasar por reversa / pago / pata de cambio.

export const MARCAS_RESERVADAS = [
  "REVERSO | ref:", "REVERSO INTERES", "REVERSO EGRESO", "[REVERSO",
  "movref:",
  "[Cambio ", "[Cobro Cambio ", "[REVERTIDA", "[PARCIAL]", "[CC]",
  "[TRANSFERENCIA:", "[RESULTADO_OPERATIVO:", "[MOVIMIENTO_CAJA:", "[MOV_CC]",
  "Pago parcial de pendiente", "Pago final de pendiente", "COBERTURA PARCIAL",
  "[IMPORT LEGACY", "IMPORT LEGACY",
  "| ANULADO:", "AJUSTE INICIAL",
] as const;

/** Tokens de referencia ("op:<id>", "ref:<id>", "usr:<nombre>") como palabra propia. */
const RE_TOKEN_RESERVADO = /(?:^|[^a-z0-9])(op|ref|usr):/i;

/** Marcas reservadas presentes en un texto (case-insensitive). */
export function marcasReservadasEn(texto: string | null | undefined): string[] {
  const t = (texto ?? "").toLowerCase();
  if (!t) return [];
  const out: string[] = [];
  if (t.trimStart().startsWith("reverso")) out.push("REVERSO");
  for (const x of MARCAS_RESERVADAS) if (t.includes(x.toLowerCase())) out.push(x);
  for (const tok of Array.from(t.matchAll(new RegExp(RE_TOKEN_RESERVADO, "gi")))) out.push(`${tok[1]}:`);
  return Array.from(new Set(out));
}

export const marcaReservadaEn = (texto: string | null | undefined): string | null => marcasReservadasEn(texto)[0] ?? null;

const errorMarca = (campo: string, m: string) => `${campo} no puede contener la marca interna del sistema "${m}"`;

/** Alta: el texto libre del usuario no puede contener ni comenzar con una marca reservada. */
export function validarTextoUsuario(texto: string | null | undefined, campo = "La descripción"): string | null {
  const m = marcaReservadaEn(texto);
  return m ? errorMarca(campo, m) : null;
}

/**
 * Edición: el formulario precarga el texto actual, así que se toleran las marcas que
 * YA estaban en la descripción original (legacy / del sistema); se rechaza cualquier
 * marca nueva que el usuario agregue.
 */
export function validarTextoEditado(original: string | null | undefined, nuevo: string | null | undefined, campo = "La descripción"): string | null {
  const previas = new Set(marcasReservadasEn(original));
  const nueva = marcasReservadasEn(nuevo).find((m) => !previas.has(m));
  return nueva ? errorMarca(campo, nueva) : null;
}

// ── Clasificación operativa de Movimientos Diarios (lista cerrada) ──

export const SUBTIPOS_OPERATIVOS = {
  RESULTADO_OPERATIVO: [
    "COMISION", "HONORARIO_CLIENTE", "HONORARIO_BANCO", "RENTA_ALQUILER", "OTRO_INGRESO", "AJUSTE_INGRESO",
    "ALQUILER", "EXPENSAS", "SUELDO", "MONOTRIBUTO", "LUZ_GAS_CABLE", "HONORARIO_CONTADOR", "COMISION_PAGADA", "IMPUESTO", "OTRO_EGRESO", "AJUSTE_EGRESO",
  ],
  MOVIMIENTO_CAJA: [
    "INGRESO_CC_CLIENTE", "EGRESO_CC_CLIENTE", "INGRESO_PF_CLIENTE", "EGRESO_PF_CLIENTE", "GUARDA_CLIENTE",
    "DEVOLUCION_GUARDA_CLIENTE", "PRESTAMO_CLIENTE", "DEVOLUCION_PRESTAMO", "ADELANTO_FUTURA_OP", "DIFERENCIA_LIQUIDACION", "AJUSTE_CAJA",
  ],
} as const;
export type ClasificacionOperativa = keyof typeof SUBTIPOS_OPERATIVOS | "TRANSFERENCIA";

/** clasificacion ∈ {RESULTADO_OPERATIVO, MOVIMIENTO_CAJA, TRANSFERENCIA}; subtipo de la lista cerrada de su clasificación. */
export function validarClasificacion(clasificacion: unknown, subtipo: unknown): string | null {
  if (clasificacion === "TRANSFERENCIA") return null; // las patas las arma el sistema
  if (clasificacion !== "RESULTADO_OPERATIVO" && clasificacion !== "MOVIMIENTO_CAJA") return "Clasificación inválida";
  const lista = SUBTIPOS_OPERATIVOS[clasificacion] as readonly string[];
  if (typeof subtipo !== "string" || !lista.includes(subtipo)) return "Subtipo operativo inválido";
  return null;
}

// ── Vínculos financieros (campos estructurados + marcas que escribe el sistema) ──

export type Vinculo = "TRANSFERENCIA" | "CAMBIO" | "CC" | "REVERSO" | "PAGO_PARCIAL";

export interface MovVinculable {
  tipo: string;
  descripcion: string | null;
  transferenciaRef: string | null;
  operacionCambioId: string | null;
  pagoDeId: string | null;
}

const PREFIJOS_CAMBIO = ["[Cambio ", "[Cobro Cambio ", "[REVERSO Cambio "];

/** Prefijo del movimiento original revertido ("REVERSO | ref:<id>"). */
export const prefijoReverso = (id: string) => `REVERSO | ref:${id} |`;

export const TIPO_INVERSO: Record<string, "ENTRADA" | "SALIDA" | "TRANSFERENCIA_IN" | "TRANSFERENCIA_OUT"> = {
  ENTRADA: "SALIDA", SALIDA: "ENTRADA", TRANSFERENCIA_IN: "TRANSFERENCIA_OUT", TRANSFERENCIA_OUT: "TRANSFERENCIA_IN",
};

const RE_REVERSO_REF = /^REVERSO \| ref:([^\s|]+)/;

/** Id del original que dice revertir una descripción "REVERSO | ref:<id> |", o null. */
export const refReverso = (desc: string | null | undefined): string | null => (desc ?? "").match(RE_REVERSO_REF)?.[1] ?? null;

export interface MovReversible {
  id: string; cajaId: string; tipo: string; moneda: string; monto: Decimal.Value | { toString(): string };
  confirmado: boolean; descripcion: string | null;
}

/**
 * L1 — Reversa ESTRUCTURAL: la marca "REVERSO | ref:<id>" sola no alcanza. Debe
 * apuntar al original, estar confirmada y neutralizarlo exactamente: misma caja,
 * moneda y monto, tipo inverso. Cualquier otra cosa no revierte nada (fail closed).
 */
export function esReversaValida(original: MovReversible, reverso: MovReversible): boolean {
  return (
    reverso.id !== original.id &&
    reverso.confirmado &&
    refReverso(reverso.descripcion) === original.id &&
    reverso.cajaId === original.cajaId &&
    reverso.moneda === original.moneda &&
    TIPO_INVERSO[original.tipo] === reverso.tipo &&
    new Decimal(reverso.monto.toString()).eq(new Decimal(original.monto.toString()))
  );
}

export function esReverso(desc: string | null | undefined): boolean {
  return (desc ?? "").startsWith("REVERSO | ref:") || (desc ?? "").startsWith("[REVERSO Cambio ");
}

export function vinculoFinanciero(m: MovVinculable): Vinculo | null {
  const d = m.descripcion ?? "";
  if (esReverso(d)) return "REVERSO";
  if (m.operacionCambioId || PREFIJOS_CAMBIO.some((p) => d.startsWith(p))) return "CAMBIO";
  // Pata de caja de un movimiento CC (Macro 4): se revierte junto con la CC, nunca sola.
  if (d.startsWith("[MOV_CC]")) return "CC";
  if (m.transferenciaRef || m.tipo === "TRANSFERENCIA_IN" || m.tipo === "TRANSFERENCIA_OUT" || d.startsWith("[TRANSFERENCIA:")) {
    return "TRANSFERENCIA";
  }
  if (m.pagoDeId) return "PAGO_PARCIAL";
  return null;
}

/** Marca de clasificación del sistema al inicio de la descripción ("[RESULTADO_OPERATIVO:X]", "[MOVIMIENTO_CAJA:X]"). */
export function prefijoSistema(desc: string | null | undefined): string | null {
  return (desc ?? "").match(/^\[(RESULTADO_OPERATIVO|MOVIMIENTO_CAJA):[^\]]+\]/)?.[0] ?? null;
}

/** Nueva descripción preservando la marca de clasificación original (el usuario solo edita texto libre). */
export function descripcionEditada(original: string | null, nueva: string | null | undefined): string | null {
  const prefijo = prefijoSistema(original);
  const texto = (nueva ?? "").trim();
  const sinPrefijo = prefijo && texto.startsWith(prefijo) ? texto.slice(prefijo.length).trim() : texto;
  if (!prefijo) return sinPrefijo || null;
  return `${prefijo} ${sinPrefijo || "Movimiento operativo manual"}`;
}

// ── Pendientes + pagos parciales ──

export function residualPendiente(montoOriginal: Decimal.Value, pagosValidos: readonly Decimal.Value[]): Decimal {
  return pagosValidos.reduce<Decimal>((r, p) => r.minus(new Decimal(p)), new Decimal(montoOriginal));
}

export type PlanConfirmacion =
  | { accion: "CONFIRMAR_ORIGINAL" }
  | { accion: "PAGO_RESIDUAL"; monto: Decimal }
  | { accion: "RECHAZAR"; motivo: string };

/**
 * Confirmar un pendiente:
 *   - sin pagos válidos → se confirma el original (impacta su monto completo, una vez);
 *   - con pagos válidos y residual > 0 → solo un pago final por el residual;
 *   - residual = 0 → nada que impactar (ya cubierto);
 *   - residual < 0 → inconsistencia, se rechaza.
 */
export function planConfirmacion(montoOriginal: Decimal.Value, pagosValidos: readonly Decimal.Value[]): PlanConfirmacion {
  if (pagosValidos.length === 0) return { accion: "CONFIRMAR_ORIGINAL" };
  const r = residualPendiente(montoOriginal, pagosValidos);
  if (r.lt(0)) return { accion: "RECHAZAR", motivo: "Los pagos parciales superan el monto del pendiente" };
  if (r.isZero()) return { accion: "RECHAZAR", motivo: "Este pendiente ya está totalmente cubierto por pagos parciales" };
  return { accion: "PAGO_RESIDUAL", monto: r };
}

/** Pago parcial: (0, residual]. */
export function validarPagoParcial(montoOriginal: Decimal.Value, pagosValidos: readonly Decimal.Value[], pago: Decimal): string | null {
  const r = residualPendiente(montoOriginal, pagosValidos);
  if (r.lte(0)) return "Este pendiente ya está totalmente cubierto";
  if (!pago.gt(0)) return "El monto debe ser mayor a 0";
  if (pago.gt(r)) return `El monto supera el restante (${r.toFixed(2)})`;
  return null;
}

// ── Reversas por neto (cambio, transferencias) ──

export interface MovNeto { cajaId: string; moneda: string; tipo: string; monto: Decimal.Value }

const signoCaja = (tipo: string) => (tipo === "ENTRADA" || tipo === "TRANSFERENCIA_IN" ? 1 : -1);

/**
 * Neto por (caja, moneda) de un conjunto de movimientos (patas + reversas previas).
 * Revertir = crear el inverso de cada neto ≠ 0. Así una segunda reversa tras una
 * re-liquidación no vuelve a revertir lo ya revertido.
 */
export function netoPorCajaMoneda(movs: readonly MovNeto[]): { cajaId: string; moneda: string; neto: Decimal }[] {
  const m = new Map<string, Decimal>();
  for (const x of movs) {
    const k = `${x.cajaId}|${x.moneda}`;
    m.set(k, (m.get(k) ?? new Decimal(0)).plus(new Decimal(x.monto).mul(signoCaja(x.tipo))));
  }
  return Array.from(m.entries())
    .map(([k, neto]) => { const [cajaId, moneda] = k.split("|"); return { cajaId, moneda, neto }; })
    .filter((x) => !x.neto.isZero());
}

/** Neto por cuenta corriente de los movimientos CC de una operación (INGRESO/INTERES/AJUSTE suman, EGRESO resta). */
export function netoPorCuentaCC(movs: readonly { cuentaCorrienteId: string; tipo: string; monto: Decimal.Value }[]): { cuentaCorrienteId: string; neto: Decimal }[] {
  const m = new Map<string, Decimal>();
  for (const x of movs) {
    const s = x.tipo === "EGRESO" ? -1 : 1;
    m.set(x.cuentaCorrienteId, (m.get(x.cuentaCorrienteId) ?? new Decimal(0)).plus(new Decimal(x.monto).mul(s)));
  }
  return Array.from(m.entries()).map(([cuentaCorrienteId, neto]) => ({ cuentaCorrienteId, neto })).filter((x) => !x.neto.isZero());
}

// ── Operación de cambio: liquidación ──

export interface OpCambioMin { tipo: string; moneda: string; cantidad: Decimal.Value; tipoCambio: Decimal.Value }

/** Divisa ya liquidada (neta de reversas): compra = Σ ENTRADA − Σ SALIDA de la divisa; venta, al revés. */
export function divisaLiquidada(op: OpCambioMin, movs: readonly MovNeto[]): Decimal {
  const esCompra = op.tipo.startsWith("COMPRA");
  let neto = new Decimal(0);
  for (const m of movs) {
    if (m.moneda !== op.moneda) continue;
    neto = neto.plus(new Decimal(m.monto).mul(signoCaja(m.tipo)));
  }
  return esCompra ? neto : neto.neg();
}

/** Valida una liquidación: total solicitado en (0, pendiente]. Devuelve el pendiente o un error. */
export function validarLiquidacion(op: OpCambioMin, liquidado: Decimal, solicitado: Decimal): { ok: true; pendiente: Decimal } | { ok: false; error: string } {
  const pendiente = new Decimal(op.cantidad).minus(liquidado);
  if (pendiente.lte(0)) return { ok: false, error: "La operación ya está totalmente liquidada" };
  if (!solicitado.gt(0)) return { ok: false, error: "El monto a liquidar debe ser mayor a 0" };
  if (solicitado.gt(pendiente)) return { ok: false, error: `Sobreliquidación: pendiente ${pendiente.toFixed(2)} ${op.moneda}` };
  return { ok: true, pendiente };
}

/** Patas de caja de una liquidación de cambio (compra: entra divisa / sale ARS; venta: al revés). */
export function patasLiquidacion(op: OpCambioMin, div: Decimal, ars: Decimal): { tipo: "ENTRADA" | "SALIDA"; moneda: string; monto: Decimal; etiqueta: string }[] {
  const esCompra = op.tipo.startsWith("COMPRA");
  return esCompra
    ? [
        { tipo: "ENTRADA", moneda: op.moneda, monto: div, etiqueta: "Compra divisa" },
        { tipo: "SALIDA", moneda: "ARS", monto: ars, etiqueta: "Pago ARS x Compra" },
      ]
    : [
        { tipo: "SALIDA", moneda: op.moneda, monto: div, etiqueta: "Venta divisa" },
        { tipo: "ENTRADA", moneda: "ARS", monto: ars, etiqueta: "Cobro ARS x Venta" },
      ];
}

export const esOpRevertida = (desc: string | null | undefined) => (desc ?? "").includes("[REVERTIDA POR:");

/** Marcas de estado del sistema al inicio de la descripción de una OperacionCambio. */
const RE_TAG_OP = /^\s*(\[REVERTIDA POR:[^\]]*\]|\[PARCIAL\]|\[CC\])\s*/;

/**
 * Nueva descripción de una operación de cambio preservando sus marcas de estado
 * ([REVERTIDA POR: …], [PARCIAL], [CC]): editar el texto libre no puede
 * "des-revertir" una operación ni borrar su estado parcial.
 */
export function descripcionOpEditada(original: string | null, nueva: string | null | undefined): string | null {
  let resto = original ?? "";
  const tags: string[] = [];
  for (let m = resto.match(RE_TAG_OP); m; m = resto.match(RE_TAG_OP)) {
    tags.push(m[1]);
    resto = resto.slice(m[0].length);
  }
  let texto = (nueva ?? "").trim();
  for (let m = texto.match(RE_TAG_OP); m; m = texto.match(RE_TAG_OP)) texto = texto.slice(m[0].length);
  const out = [...tags, texto].filter(Boolean).join(" ").trim();
  return out || null;
}

/** Pone o quita la marca [PARCIAL] entre las marcas iniciales, sin duplicarla. */
export function conMarcaParcial(desc: string | null, parcial: boolean): string {
  let resto = desc ?? "";
  const tags: string[] = [];
  for (let m = resto.match(RE_TAG_OP); m; m = resto.match(RE_TAG_OP)) {
    if (m[1] !== "[PARCIAL]") tags.push(m[1]);
    resto = resto.slice(m[0].length);
  }
  return [parcial ? "[PARCIAL]" : "", ...tags, resto.trim()].filter(Boolean).join(" ");
}
