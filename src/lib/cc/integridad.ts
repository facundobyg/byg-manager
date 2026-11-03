// MACRO 4 — Reglas PURAS de integridad de Cuentas Corrientes + Plazos Fijos (sin DB).
//
// Invariantes:
//   - Saldo CC = Σ movimientos (INGRESO / INTERES / AJUSTE suman, EGRESO resta).
//     Ningún cambio de saldo sin su MovimientoCC.
//   - Crear un PF desde CC = EGRESO en la CC + PF, en la misma transacción
//     (vinculados por op:<ref> en la descripción del movimiento y en las notas del PF).
//   - Un PF no cambia capital / saldoActual / estado por edición directa:
//     eso tiene efecto económico sin contraparte (lifecycle → Macro 7).

import { Decimal } from "@prisma/client/runtime/library";
import { calcularInteresCCRealista, type PeriodoInteres } from "../services/intereses.service";

export type TipoMovCCStr = "INGRESO" | "EGRESO" | "INTERES" | "AJUSTE";

/** Signo de un movimiento CC sobre el saldo. */
export const signoMovCC = (tipo: string): 1 | -1 => (tipo === "EGRESO" ? -1 : 1);

/** Delta con signo que un movimiento aplica al saldo. */
export const deltaMovCC = (tipo: string, monto: Decimal.Value): Decimal => new Decimal(monto).mul(signoMovCC(tipo));

/** Saldo reconstruido a partir de los movimientos (única definición canónica). */
export function saldoReconstruido(movs: readonly { tipo: string; monto: Decimal.Value | { toString(): string } }[]): Decimal {
  return movs.reduce<Decimal>((s, m) => s.plus(deltaMovCC(m.tipo, m.monto.toString())), new Decimal(0));
}

/** Inverso de un movimiento CC (INTERES y AJUSTE suman → su inverso es EGRESO). */
export const tipoInversoCC = (tipo: string): "INGRESO" | "EGRESO" => (tipo === "EGRESO" ? "INGRESO" : "EGRESO");

/** operationRef exacto ("op:<ref>") de una descripción / notas, o null. */
export const refOperacion = (texto: string | null | undefined): string | null => texto?.match(/op:([a-zA-Z0-9-]+)/)?.[1] ?? null;

/** ref exacto de reversa grupal ("ref:<ref>" como token propio, no "movref:"), o null. */
export const refReversaGrupal = (texto: string | null | undefined): string | null =>
  texto?.match(/(?:^|[\s|])ref:([a-zA-Z0-9-]+)/)?.[1] ?? null;

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esOperationRef = (v: unknown): v is string => typeof v === "string" && RE_UUID.test(v);

/** Operaciones agrupadas (op:<ref>) que también crean / cancelan un PlazoFijo. */
export const TIPOS_OPERACION_CON_PF = ["LP", "PF"] as const;
export const tipoOperacionCC = (desc: string | null | undefined): string => (desc ?? "").split(" ")[0]?.toUpperCase() || "MOV";

// ── Interés CC: única semántica para vista previa y aplicación ──
//
// Un INTERES vigente con fecha D cubre los días ANTERIORES a D (liquidación por
// período: fecha = fechaFin exclusiva; aplicación del pendiente: fecha = hoy, fin
// exclusivo). El inicio de cada período no está persistido de forma estructurada,
// así que la cobertura se controla con una marca de agua: "liquidado hasta" = la
// fecha más tardía de un INTERES vigente. Un período nuevo debe empezar ahí o
// después (sin solapamiento; rellenar huecos anteriores queda rechazado).

export interface MovCCInteres { id: string; fecha: Date; tipo: string; monto: Decimal.Value | { toString(): string }; descripcion: string | null }

/** Ids de INTERES revertidos: individual "movref:<id>" o grupal "ref:<op del interés>" (mismas reglas que estaRevertidoCC). */
export function interesesRevertidos(movs: readonly MovCCInteres[]): Set<string> {
  const intereses = movs.filter((m) => m.tipo === "INTERES");
  const porOp = new Map(intereses.flatMap((m) => { const op = refOperacion(m.descripcion); return op ? [[op, m.id] as const] : []; }));
  const ids = new Set(intereses.map((m) => m.id));
  const out = new Set<string>();
  for (const m of movs) {
    const movref = m.descripcion?.match(/movref:([a-zA-Z0-9-]+)/)?.[1];
    if (movref && ids.has(movref)) out.add(movref);
    const grupal = refReversaGrupal(m.descripcion);
    if (grupal && porOp.has(grupal)) out.add(porOp.get(grupal)!);
  }
  return out;
}

/** Reversas de un INTERES: neutralizan un movimiento que no capitaliza, así que tampoco cuentan para el saldo de interés. */
function esReversaDeInteres(m: MovCCInteres, ids: Set<string>, ops: Set<string>): boolean {
  const movref = m.descripcion?.match(/movref:([a-zA-Z0-9-]+)/)?.[1];
  const grupal = refReversaGrupal(m.descripcion);
  return (!!movref && ids.has(movref)) || (!!grupal && ops.has(grupal));
}

/** Movimientos que forman el saldo que devenga interés: sin INTERES ni sus reversas. */
export function movimientosBaseInteres<T extends MovCCInteres>(movs: readonly T[]): T[] {
  const intereses = movs.filter((m) => m.tipo === "INTERES");
  const ids = new Set(intereses.map((m) => m.id));
  const ops = new Set(intereses.flatMap((m) => { const op = refOperacion(m.descripcion); return op ? [op] : []; }));
  return movs.filter((m) => m.tipo !== "INTERES" && !esReversaDeInteres(m, ids, ops));
}

/** Saldo canónico al comienzo de `inicio` (antes de los movimientos de ese día) para devengar interés. */
export function saldoInicialInteresCC(movs: readonly MovCCInteres[], inicio: Date): Decimal {
  return movimientosBaseInteres(movs)
    .filter((m) => m.fecha.getTime() < inicio.getTime())
    .reduce<Decimal>((s, m) => s.plus(deltaMovCC(m.tipo, m.monto.toString())), new Decimal(0));
}

/** "Liquidado hasta" (exclusivo): fecha más tardía de un INTERES vigente, o null si nunca hubo. */
export function interesLiquidadoHasta(movs: readonly MovCCInteres[]): Date | null {
  const revertidos = interesesRevertidos(movs);
  let max: Date | null = null;
  for (const m of movs) {
    if (m.tipo !== "INTERES" || revertidos.has(m.id)) continue;
    if (!max || m.fecha.getTime() > max.getTime()) max = m.fecha;
  }
  return max;
}

/** Error si [inicio, …) incluye días ya cubiertos por un INTERES vigente. */
export function validarSinSolapamientoInteres(movs: readonly MovCCInteres[], inicio: Date): string | null {
  const hasta = interesLiquidadoHasta(movs);
  return hasta && inicio.getTime() < hasta.getTime()
    ? `Ya hay interés liquidado hasta el ${hasta.toISOString().slice(0, 10)} (exclusivo): el período debe empezar en esa fecha o después`
    : null;
}

/** Tasa CC como decimal (0.045 = 4,5%); datos legacy pueden guardarla en porcentaje (4.5). */
export const tasaCCDecimal = (tasaCC: Decimal.Value | { toString(): string }): Decimal => {
  const t = new Decimal(tasaCC.toString());
  return t.gt(1) ? t.div(100) : t;
};

/**
 * Período pendiente de aplicar: [liquidado hasta | inicio de mes, hoy) en fechas UTC.
 * Hoy es exclusivo: el interés aplicado lleva fecha = hoy y cubre los días anteriores.
 */
export function periodoPendienteInteresCC(movs: readonly MovCCInteres[], ahora: Date): { inicio: Date; fin: Date } {
  const fin = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  const inicio = interesLiquidadoHasta(movs) ?? new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
  return { inicio, fin };
}

/** Interés de [inicio, fin) con el saldo canónico: la ÚNICA fórmula (vista previa y servidor). */
export function calcularInteresPeriodoCC(movs: readonly MovCCInteres[], inicio: Date, fin: Date, tasa: Decimal):
  { interesTotal: Decimal; periodos: PeriodoInteres[]; saldoInicial: Decimal } {
  const saldoInicial = saldoInicialInteresCC(movs, inicio);
  const delPeriodo = movimientosBaseInteres(movs).filter((m) => m.fecha.getTime() >= inicio.getTime() && m.fecha.getTime() < fin.getTime());
  const r = calcularInteresCCRealista({
    movimientos: delPeriodo.map((m) => ({ fecha: m.fecha, tipo: m.tipo as never, monto: new Decimal(m.monto.toString()) })),
    tasa, fechaInicio: inicio, fechaFin: fin, saldoInicial,
  });
  return { ...r, saldoInicial };
}

/** Vista previa del interés pendiente de aplicar (lo que el servidor recalculará si la DB no cambia). */
export function previewInteresPendienteCC(movs: readonly MovCCInteres[], tasa: Decimal, ahora: Date) {
  const { inicio, fin } = periodoPendienteInteresCC(movs, ahora);
  if (fin.getTime() <= inicio.getTime()) {
    return { inicio, fin, dias: 0, interesTotal: new Decimal(0), periodos: [] as PeriodoInteres[], saldoInicial: saldoInicialInteresCC(movs, inicio) };
  }
  const r = calcularInteresPeriodoCC(movs, inicio, fin, tasa);
  return { inicio, fin, dias: r.periodos.reduce((s, p) => s + p.dias, 0), ...r };
}

// ── Plazo fijo: edición ──

export interface PfEconomico { capital: Decimal.Value; saldoActual: Decimal.Value; estado: string; moneda: string; clienteId: string }

/**
 * Edición directa de un PF: solo campos sin efecto económico inmediato (tasa,
 * fechas). Cambiar capital, saldoActual, estado, moneda o cliente → DENY.
 */
export function validarEdicionPF(actual: PfEconomico, nuevo: Partial<PfEconomico>): string | null {
  if (nuevo.capital !== undefined && !new Decimal(nuevo.capital).eq(actual.capital)) {
    return "El capital no se edita: tiene efecto económico (usar el flujo financiero del PF)";
  }
  if (nuevo.saldoActual !== undefined && !new Decimal(nuevo.saldoActual).eq(actual.saldoActual)) {
    return "El saldo actual no se edita: un interés sin movimiento ni fecha no entra al resultado";
  }
  if (nuevo.estado !== undefined && nuevo.estado !== actual.estado) {
    return "El estado no se edita directamente: cambia la obligación sin contraparte (usar el flujo financiero del PF)";
  }
  if (nuevo.moneda !== undefined && nuevo.moneda !== actual.moneda) return "La moneda de un PF no se edita";
  if (nuevo.clienteId !== undefined && nuevo.clienteId !== actual.clienteId) return "El cliente de un PF no se edita";
  return null;
}

// ── Cliente: eliminación ──

export interface HistoriaCliente {
  movimientosCC: number; saldosCCNoCero: number; plazosFijos: number; operacionesCambio: number;
  custodia: number; transferenciasActivo: number; operacionesBolsa: number; legacyPorNombre: number;
}

/** Un cliente con cualquier historia financiera no se elimina físicamente (la cascada la destruiría). */
export function motivoNoEliminable(h: HistoriaCliente): string | null {
  const partes: string[] = [];
  if (h.movimientosCC > 0) partes.push(`${h.movimientosCC} movimientos CC`);
  if (h.saldosCCNoCero > 0) partes.push(`${h.saldosCCNoCero} CC con saldo`);
  if (h.plazosFijos > 0) partes.push(`${h.plazosFijos} plazos fijos`);
  if (h.operacionesCambio > 0) partes.push(`${h.operacionesCambio} operaciones de cambio`);
  if (h.custodia > 0) partes.push(`${h.custodia} custodias`);
  if (h.transferenciasActivo > 0) partes.push(`${h.transferenciasActivo} transferencias de activos`);
  if (h.operacionesBolsa > 0) partes.push(`${h.operacionesBolsa} operaciones de bolsa`);
  if (h.legacyPorNombre > 0) partes.push(`${h.legacyPorNombre} operaciones importadas por nombre`);
  return partes.length ? `El cliente tiene historia financiera (${partes.join(", ")}): no se puede eliminar. Dalo de baja.` : null;
}
