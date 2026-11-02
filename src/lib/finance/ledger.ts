// MACRO 2 — LIBRO DE HECHOS normalizado (en código, derivado de las tablas
// existentes; NO es una tabla nueva ni otra fuente de verdad persistida).
//
// Cada hecho económico relevante aparece UNA vez, con: fecha económica, moneda
// nativa, importe con signo (+ = a favor de BYG), categoría, origen, dueño,
// estado, vínculo de reversa e impactos (realizado / patrimonial).
//
// Clasificación de MovimientoCaja por las marcas que escribe el propio sistema
// (no por texto libre del usuario):
//   [RESULTADO_OPERATIVO:SUB]   → resultado (SUB=DISTRIBUCION_UTILIDADES → retiro)
//   [MOVIMIENTO_CAJA:SUB]       → flujo patrimonial sin resultado
//   [TRANSFERENCIA:IN/OUT], TRANSFERENCIA_IN/OUT → transferencia interna (neutra)
//   [Cambio id] / [Cobro Cambio id] / [REVERSO Cambio id] → patas de cambio (conversión)
//   REVERSO | ref:<id>          → reversa del movimiento <id>
//   Pago parcial de pendiente   → cancelación de un pendiente
//   cualquier otro              → flujo patrimonial SIN_CLASIFICAR (informado)

import { Decimal } from "@prisma/client/runtime/library";
import type { DsMovCaja, DsOpBolsa, FinanceDataset } from "./dataset";
import type { FxOperacion } from "./fx-cost-basis";
import { resolverOwnerCuentaOperativa, type OwnerEconomico } from "./owner";
import type { QualityReason } from "./quality";
import { D, type Moneda } from "./types";

export type Categoria =
  | "FX_COMPRA" | "FX_VENTA"
  | "RESULTADO_OPERATIVO"
  | "HONORARIO_CAMBIO"
  | "NO_CLASIFICADO_LEGACY"
  | "ARBITRAJE"
  | "INTERES_CC" | "INTERES_PF"
  | "INMUEBLE_RENTA" | "INMUEBLE_IMPUESTO" | "INMUEBLE_APORTE" | "INMUEBLE_RETIRO"
  | "CARTERA_VENTA" | "CARTERA_VENTA_SIN_COSTO"
  | "DISTRIBUCION"
  | "TRANSFERENCIA_INTERNA"
  | "CAMBIO_LIQUIDACION"
  | "PAGO_PENDIENTE"
  | "FLUJO_PATRIMONIAL"
  | "REVERSA"
  | "OWNER_NO_RESUELTO";

export type EstadoHecho = "CONFIRMADO" | "PENDIENTE" | "ANULADO" | "REVERTIDO" | "DUPLICADO";

export type Origen = "CAJA" | "CAMBIO" | "BOLSA" | "CC" | "PF" | "INMUEBLE" | "RULO" | "DIVINT" | "LP";

export interface HechoEconomico {
  id: string;
  origen: Origen;
  origenId: string;
  fecha: string;
  fechaLiquidacion: string | null;
  moneda: Moneda;
  /** Con signo: + favorece a BYG (ingreso / entrada), − la perjudica. */
  importe: Decimal;
  categoria: Categoria;
  subtipo: string | null;
  owner: OwnerEconomico;
  estado: EstadoHecho;
  reversaDe: string | null;
  revertidoPor: string | null;
  impactoRealizado: boolean;
  impactoPatrimonial: boolean;
  /** Clave de unicidad del hecho económico (protección contra doble conteo). */
  dedupeKey: string;
  descripcion: string | null;
}

const RE_RO = /^\[RESULTADO_OPERATIVO:([^\]]+)\]/;
const RE_MC = /^\[MOVIMIENTO_CAJA:([^\]]+)\]/;
const RE_REVERSO_REF = /^REVERSO \| ref:([^\s|]+)/;

export const TIPOS_FX_COMPRA = new Set(["COMPRA_USD", "COMPRA_EUR", "COMPRA_BRL"]);
export const TIPOS_FX_VENTA = new Set(["VENTA_USD", "VENTA_EUR", "VENTA_BRL"]);
/** Tipos no-FX de OperacionCambio con categoría económica inequívoca (ingreso). */
const TIPOS_HONORARIO = new Set(["HONORARIO_CLIENTE", "HONORARIO_EXTERNO", "COMISION"]);
/**
 * Tipos no-FX AMBIGUOS: el import legacy mapea a GASTO_OPERATIVO gastos,
 * impuestos, alquiler, pago_intereses_pf y utilidades_dist (ver backup/actions
 * CAMBIO_TIPO_MAP). Contarlos como gasto duplicaría el interés PF devengado y
 * trataría distribuciones como gasto → se informan aparte, no entran en utilidad.
 */
const TIPOS_AMBIGUOS = new Set(["GASTO_OPERATIVO", "AJUSTE", "OTRO"]);

const VENTA_BOLSA = new Set(["VENTA_BONO", "VENTA_ACCION", "VENTA_CEDEAR", "CAUCION_COLOCADORA"]);
const COMPRA_BOLSA = new Set(["COMPRA_BONO", "COMPRA_ACCION", "COMPRA_CEDEAR", "CAUCION_TOMADORA"]);
const VENTA_ACTIVO = new Set(["VENTA_BONO", "VENTA_ACCION", "VENTA_CEDEAR"]);
const ESTADOS_BOLSA_CERRADOS = new Set(["CONCERTADA", "LIQUIDADA"]);

function estadoCaja(m: DsMovCaja): EstadoHecho {
  if (m.confirmado) return "CONFIRMADO";
  return m.anulado ? "ANULADO" : "PENDIENTE";
}

function signoCaja(m: DsMovCaja): 1 | -1 {
  return m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN" ? 1 : -1;
}

/** Categoría de un movimiento de caja según las marcas del sistema. */
export function clasificarMovCaja(m: DsMovCaja): { categoria: Categoria; subtipo: string | null; reversaDe: string | null } {
  const d = m.descripcion ?? "";
  const ro = d.match(RE_RO);
  if (ro) {
    return ro[1] === "DISTRIBUCION_UTILIDADES"
      ? { categoria: "DISTRIBUCION", subtipo: ro[1], reversaDe: null }
      : { categoria: "RESULTADO_OPERATIVO", subtipo: ro[1], reversaDe: null };
  }
  const rev = d.match(RE_REVERSO_REF);
  if (rev) return { categoria: "REVERSA", subtipo: null, reversaDe: rev[1] };
  if (m.tipo === "TRANSFERENCIA_IN" || m.tipo === "TRANSFERENCIA_OUT" || d.startsWith("[TRANSFERENCIA:")) {
    return { categoria: "TRANSFERENCIA_INTERNA", subtipo: null, reversaDe: null };
  }
  if (d.startsWith("[Cambio ") || d.startsWith("[Cobro Cambio ") || d.startsWith("[REVERSO Cambio ")) {
    return { categoria: "CAMBIO_LIQUIDACION", subtipo: null, reversaDe: null };
  }
  if (m.pagoDeId) return { categoria: "PAGO_PENDIENTE", subtipo: null, reversaDe: m.pagoDeId };
  const mc = d.match(RE_MC);
  if (mc) return { categoria: "FLUJO_PATRIMONIAL", subtipo: mc[1], reversaDe: null };
  return { categoria: "FLUJO_PATRIMONIAL", subtipo: "SIN_CLASIFICAR", reversaDe: null };
}

/** Neto (con signo) de una operación de bolsa: + venta, − compra. null si el lado no es inequívoco. */
export function netoBolsa(op: DsOpBolsa): { neto: Decimal; sinCostos: boolean } | null {
  const esVenta = VENTA_BOLSA.has(op.tipoOperacion);
  const esCompra = COMPRA_BOLSA.has(op.tipoOperacion);
  if (!esVenta && !esCompra) return null;
  const bruto = D(op.cantidad).mul(D(op.precio));
  let neto: Decimal;
  let sinCostos = false;
  if (op.netoLiquidado != null) neto = D(op.netoLiquidado).abs();
  else if (op.costoReal != null) neto = esVenta ? bruto.minus(D(op.costoReal)) : bruto.plus(D(op.costoReal));
  else { neto = bruto; sinCostos = true; }
  return { neto: esVenta ? neto : neto.neg(), sinCostos };
}

/** Incidencia de calidad con fecha económica (para calificar el período que la contiene). */
export interface IncidenciaCalidad { fecha: string; reason: QualityReason }

export interface Ledger {
  hechos: HechoEconomico[];
  /** Operaciones FX liquidadas para el costo promedio (pendientes/revertidas excluidas). */
  fxOperaciones: FxOperacion[];
  incidencias: IncidenciaCalidad[];
  advertencias: string[];
}

const RE_OP_REF = /op:([a-zA-Z0-9-]+)/;
/** "ref:" como token propio (no el sufijo de "movref:"). */
const RE_REF = /(?:^|[\s|])ref:([a-zA-Z0-9-]+)/;
const RE_MOVREF = /movref:([a-zA-Z0-9-]+)/;

/**
 * Ids de intereses CC revertidos, según las dos formas REALES de reversa:
 *   - grupal: "REVERSO INTERES | op:<nuevo> | ref:<R>" revierte TODOS los movimientos con op:<R>;
 *   - individual: "… | movref:<id>" revierte ese movimiento.
 */
export function interesesCCRevertidos(ds: FinanceDataset): Map<string, string> {
  const porRef = new Map<string, string>();
  const porId = new Map<string, string>();
  for (const r of ds.movsCCReversas) {
    if (r.descripcion.startsWith("REVERSO INTERES")) {
      const ref = r.descripcion.match(RE_REF)?.[1];
      if (ref) porRef.set(ref, r.id);
    }
    const mid = r.descripcion.match(RE_MOVREF)?.[1];
    if (mid) porId.set(mid, r.id);
  }
  const out = new Map<string, string>();
  for (const m of ds.movsCCInteres) {
    const op = (m.descripcion ?? "").match(RE_OP_REF)?.[1];
    const rev = porId.get(m.id) ?? (op ? porRef.get(op) : undefined);
    if (rev) out.set(m.id, rev);
  }
  return out;
}

export function construirLedger(ds: FinanceDataset): Ledger {
  const hechos: HechoEconomico[] = [];
  const advertencias: string[] = [];
  const fxOperaciones: FxOperacion[] = [];
  const incidencias: IncidenciaCalidad[] = [];
  const claves = new Set<string>();

  const push = (h: Omit<HechoEconomico, "dedupeKey" | "id"> & { dedupeKey?: string }) => {
    const dedupeKey = h.dedupeKey ?? `${h.origen}:${h.origenId}:${h.moneda}`;
    let estado = h.estado;
    let impactoRealizado = h.impactoRealizado;
    if (impactoRealizado && claves.has(dedupeKey)) {
      estado = "DUPLICADO";
      impactoRealizado = false;
      advertencias.push(`Hecho duplicado ignorado: ${h.origen} ${h.origenId} (clave ${dedupeKey})`);
    }
    if (impactoRealizado) claves.add(dedupeKey);
    hechos.push({ ...h, id: `${h.origen}:${h.origenId}:${h.moneda}:${h.categoria}`, estado, impactoRealizado, dedupeKey });
  };

  // ── 1. Operaciones de cambio (antes que caja: su clave gana el dedupe de honorarios) ──
  for (const op of ds.opsCambio) {
    const revertida = op.pendiente && (op.descripcion ?? "").includes("[REVERTIDA POR:");
    const estado: EstadoHecho = op.pendiente ? (revertida ? "REVERTIDO" : "PENDIENTE") : "CONFIRMADO";
    const base = {
      origen: "CAMBIO" as const, origenId: op.id, fecha: op.fecha, fechaLiquidacion: null,
      owner: "BYG" as const, reversaDe: null, revertidoPor: null, descripcion: op.descripcion,
    };
    if (TIPOS_FX_COMPRA.has(op.tipo) || TIPOS_FX_VENTA.has(op.tipo)) {
      const lado = TIPOS_FX_COMPRA.has(op.tipo) ? "COMPRA" : "VENTA";
      if (op.moneda === "ARS") {
        advertencias.push(`Operación FX ${op.id} con moneda ARS; ignorada`);
        continue;
      }
      push({
        ...base, moneda: op.moneda, importe: D(op.cantidad).mul(lado === "COMPRA" ? 1 : -1),
        categoria: lado === "COMPRA" ? "FX_COMPRA" : "FX_VENTA", subtipo: op.tipo, estado,
        impactoRealizado: lado === "VENTA" && estado === "CONFIRMADO", impactoPatrimonial: false,
        dedupeKey: `cambio:${op.id}`,
      });
      if (estado === "CONFIRMADO") {
        fxOperaciones.push({ id: op.id, fecha: op.fecha, createdAt: op.createdAt, moneda: op.moneda, lado, cantidad: op.cantidad, totalARS: op.totalARS });
      }
      continue;
    }
    const partes: [Moneda, Decimal][] = [];
    if (!D(op.totalARS).isZero()) partes.push(["ARS", D(op.totalARS)]);
    if (!D(op.cobroUSD).isZero()) partes.push(["USD", D(op.cobroUSD)]);
    const esHonorario = TIPOS_HONORARIO.has(op.tipo);
    const signo = op.tipo === "GASTO_OPERATIVO" ? -1 : 1;
    for (const [moneda, monto] of partes) {
      push({
        ...base, moneda, importe: monto.abs().mul(signo),
        categoria: esHonorario ? "HONORARIO_CAMBIO" : "NO_CLASIFICADO_LEGACY",
        subtipo: op.tipo, estado,
        impactoRealizado: esHonorario && estado === "CONFIRMADO", impactoPatrimonial: false,
        dedupeKey: `cambio:${op.id}:${moneda}`,
      });
    }
    if (!esHonorario && !TIPOS_AMBIGUOS.has(op.tipo)) advertencias.push(`Tipo de cambio desconocido ${op.tipo} (${op.id})`);
  }

  // ── 2. Movimientos de caja ──
  const revertidosCaja = new Map<string, string>();
  for (const m of ds.movsCaja) {
    const c = clasificarMovCaja(m);
    if (c.categoria === "REVERSA" && c.reversaDe && m.confirmado) revertidosCaja.set(c.reversaDe, m.id);
  }
  for (const m of ds.movsCaja) {
    const c = clasificarMovCaja(m);
    let estado = estadoCaja(m);
    const revertidoPor = revertidosCaja.get(m.id) ?? null;
    if (estado === "CONFIRMADO" && revertidoPor) estado = "REVERTIDO";
    const esResultado = c.categoria === "RESULTADO_OPERATIVO";
    push({
      origen: "CAJA", origenId: m.id, fecha: m.fecha, fechaLiquidacion: null, moneda: m.moneda,
      importe: D(m.monto).mul(signoCaja(m)), categoria: c.categoria, subtipo: c.subtipo,
      owner: "BYG", estado, reversaDe: c.reversaDe, revertidoPor,
      impactoRealizado: esResultado && estado === "CONFIRMADO",
      impactoPatrimonial: estado === "CONFIRMADO",
      // Un resultado operativo vinculado a una operación de cambio es el MISMO hecho
      // económico que esa operación: comparte su clave (no se cuenta dos veces).
      dedupeKey: esResultado && m.operacionCambioId ? `cambio:${m.operacionCambioId}:${m.moneda}` : `caja:${m.id}`,
      descripcion: m.descripcion,
    });
  }

  // ── 3. Bolsa: arbitrajes y ventas de cartera propia ──
  // M2-F02: el grupo se evalúa COMPLETO (incluidas las patas anuladas) ANTES de
  // calcular. Solo un grupo íntegro y cerrado (sin patas anuladas, con al menos
  // una compra y una venta, todas con neto liquidado) genera resultado.
  //   - todas las patas anuladas  → arbitraje cancelado: sin resultado, sin incidencia;
  //   - alguna abierta (sin anuladas) → arbitraje en curso: sin resultado, sin incidencia;
  //   - mezcla anulada/no anulada, falta un lado, tipo sin lado o sin neto
  //     → INCONSISTENTE: sin resultado + incidencia ARBITRAGE_INCOMPLETE.
  const grupos = new Map<string, DsOpBolsa[]>();
  for (const op of ds.opsBolsa) {
    if (!op.grupoArbitrajeId) continue;
    const g = grupos.get(op.grupoArbitrajeId) ?? [];
    g.push(op);
    grupos.set(op.grupoArbitrajeId, g);
  }
  for (const [gid, ops] of Array.from(grupos.entries())) {
    const anulada = (o: DsOpBolsa) => o.anulada || o.estado === "ANULADA";
    const vivas = ops.filter((o) => !anulada(o));
    const fechas = ops.map((o) => o.fechaOperativa ?? o.createdAt).sort();
    const fecha = fechas[fechas.length - 1] ?? ds.hoy;
    if (vivas.length === 0) continue; // cancelado por completo
    const inconsistente = (motivo: string) => {
      incidencias.push({ fecha, reason: { code: "ARBITRAGE_INCOMPLETE", severity: "INCOMPLETE", detail: `Arbitraje ${gid}: ${motivo}; no se reconoce resultado` } });
    };
    if (vivas.length < ops.length) { inconsistente("patas anuladas junto a patas vigentes"); continue; }
    if (!vivas.every((o) => ESTADOS_BOLSA_CERRADOS.has(o.estado))) continue; // en curso
    const netos = vivas.map((o) => ({ o, n: netoBolsa(o) }));
    if (netos.some((x) => !x.n)) { inconsistente("incluye tipos sin lado inequívoco (futuro/opción/MEP/SENEBI)"); continue; }
    if (!netos.some((x) => x.n!.neto.gt(0)) || !netos.some((x) => x.n!.neto.lt(0))) { inconsistente("falta la pata de compra o de venta"); continue; }
    if (netos.some((x) => x.n!.sinCostos)) { inconsistente("pata cerrada sin neto liquidado ni costo real (no se puede neto de comisión)"); continue; }
    const porMoneda = new Map<Moneda, Decimal>();
    for (const { o, n } of netos) porMoneda.set(o.moneda, (porMoneda.get(o.moneda) ?? new Decimal(0)).plus(n!.neto));
    for (const [moneda, neto] of Array.from(porMoneda.entries())) {
      push({
        origen: "BOLSA", origenId: gid, fecha, fechaLiquidacion: null, moneda, importe: neto,
        categoria: "ARBITRAJE", subtipo: null, owner: "BYG", estado: "CONFIRMADO",
        reversaDe: null, revertidoPor: null, impactoRealizado: true, impactoPatrimonial: false,
        dedupeKey: `arbitraje:${gid}:${moneda}`, descripcion: `Arbitraje ${ops.length} patas`,
      });
    }
  }

  const costoPorOp = new Map(ds.costosCartera.map((c) => [c.operacionId, D(c.costoUnitario)]));
  for (const op of ds.opsBolsa) {
    if (op.grupoArbitrajeId || op.anulada || !op.carteraId || !VENTA_ACTIVO.has(op.tipoOperacion)) continue;
    if (!ESTADOS_BOLSA_CERRADOS.has(op.estado)) continue;
    const n = netoBolsa(op);
    if (!n) continue;
    const fecha = op.fechaOperativa ?? op.createdAt;
    const costo = costoPorOp.get(op.id);
    const conCosto = costo != null;
    if (!conCosto) {
      incidencias.push({ fecha, reason: { code: "CARTERA_MISSING_COST", severity: "INCOMPLETE", detail: `Venta ${op.ticker} (${op.id}) de cartera propia sin costo registrado` } });
    }
    push({
      origen: "BOLSA", origenId: op.id, fecha, fechaLiquidacion: null, moneda: op.moneda,
      importe: conCosto ? n.neto.minus(D(op.cantidad).mul(costo)) : n.neto,
      categoria: conCosto ? "CARTERA_VENTA" : "CARTERA_VENTA_SIN_COSTO", subtipo: op.ticker,
      owner: "BYG", estado: "CONFIRMADO", reversaDe: null, revertidoPor: null,
      impactoRealizado: conCosto, impactoPatrimonial: false,
      dedupeKey: `bolsa:${op.id}`, descripcion: `Venta ${op.ticker} cartera propia`,
    });
  }

  // ── 4. Intereses devengados (CC y PF): costo de BYG ──
  // M2-F01: un interés con reversa real queda REVERTIDO y no genera resultado en
  // su período original, aunque la reversa tenga fecha posterior.
  const ccRevertidos = interesesCCRevertidos(ds);
  for (const m of ds.movsCCInteres) {
    const revertidoPor = ccRevertidos.get(m.id) ?? null;
    push({
      origen: "CC", origenId: m.id, fecha: m.fecha, fechaLiquidacion: null, moneda: m.moneda,
      importe: D(m.monto).neg(), categoria: "INTERES_CC", subtipo: null, owner: "BYG",
      estado: revertidoPor ? "REVERTIDO" : "CONFIRMADO", reversaDe: null, revertidoPor,
      impactoRealizado: !revertidoPor, impactoPatrimonial: true, descripcion: m.descripcion,
    });
  }
  for (const m of ds.pfMovs) {
    if (m.tipo !== "INTERES") continue;
    push({
      origen: "PF", origenId: m.id, fecha: m.fecha, fechaLiquidacion: null, moneda: m.moneda,
      importe: D(m.monto).neg(), categoria: "INTERES_PF", subtipo: null, owner: "BYG",
      estado: "CONFIRMADO", reversaDe: null, revertidoPor: null,
      impactoRealizado: true, impactoPatrimonial: true, descripcion: null,
    });
  }

  // ── 5. Inmuebles ──
  const CAT_INMUEBLE: Record<string, { categoria: Categoria; signo: 1 | -1; realizado: boolean }> = {
    RENTA:    { categoria: "INMUEBLE_RENTA",    signo: 1,  realizado: true },
    IMPUESTO: { categoria: "INMUEBLE_IMPUESTO", signo: -1, realizado: true },
    INGRESO:  { categoria: "INMUEBLE_APORTE",   signo: 1,  realizado: false },
    MEJORA:   { categoria: "INMUEBLE_APORTE",   signo: 1,  realizado: false },
    EGRESO:   { categoria: "INMUEBLE_RETIRO",   signo: -1, realizado: false },
  };
  for (const m of ds.inmuebles) {
    const c = CAT_INMUEBLE[m.tipo];
    if (!c) { advertencias.push(`Movimiento inmobiliario con tipo desconocido ${m.tipo}`); continue; }
    push({
      origen: "INMUEBLE", origenId: m.id, fecha: m.fecha, fechaLiquidacion: null, moneda: m.moneda,
      importe: D(m.monto).abs().mul(c.signo), categoria: c.categoria, subtipo: m.propiedadId, owner: "BYG",
      estado: "CONFIRMADO", reversaDe: null, revertidoPor: null,
      impactoRealizado: c.realizado, impactoPatrimonial: true, descripcion: null,
    });
  }

  // ── 6. Rulo / Div-Int / LP: dueño económico vía adapter ──
  for (const r of ds.registrosCuenta) {
    const o = resolverOwnerCuentaOperativa(r.cuenta);
    for (const [moneda, monto] of [["USD", D(r.usd)], ["ARS", D(r.ars)]] as [Moneda, Decimal][]) {
      if (monto.isZero()) continue;
      push({
        origen: r.origen, origenId: r.id, fecha: r.fecha, fechaLiquidacion: null, moneda, importe: monto,
        categoria: o.owner === "DESCONOCIDO" ? "OWNER_NO_RESUELTO" : "RESULTADO_OPERATIVO",
        subtipo: r.cuenta, owner: o.owner, estado: "CONFIRMADO", reversaDe: null, revertidoPor: null,
        impactoRealizado: o.owner === "BYG", impactoPatrimonial: false,
        dedupeKey: `${r.origen}:${r.id}:${moneda}`, descripcion: o.motivo,
      });
    }
  }

  return { hechos, fxOperaciones, incidencias, advertencias };
}
