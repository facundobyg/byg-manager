// MACRO 2 — RESULTADO REALIZADO de un mes (función pura).
//
// resultado(mes) = Σ hechos del libro con impactoRealizado y estado CONFIRMADO
//                  y fecha económica ∈ [desde, hasta)
//                + resultado FX por costo promedio móvil de las ventas del mes.
//
// Excluye por construcción: pendientes / NO_LIQUIDADA, anuladas, revertidas
// (y sus reversas), duplicados, valuaciones, transferencias internas, patas de
// cambio, distribuciones, flujos patrimoniales. Lo excluido se INFORMA.
//
// Consolidado USD: cada partida al TC de SU fecha (TcBitacora, ventana ±31 días).
//
// CALIDAD (contrato común, quality.ts) — peor de:
//   TC aproximado → APPROXIMATE ; TC faltante → INCOMPLETE ;
//   venta FX sin costo base → INCOMPLETE (FX_MISSING_COST_BASIS) ;
//   arbitraje inconsistente / venta de cartera sin costo → INCOMPLETE ;
//   legacy ambiguo / dueño no resuelto en el mes → INCOMPLETE (no se sabe si corresponden).
// INCOMPLETE ⇒ totalUSD = null (knownSubtotalUSD queda como diagnóstico).

import { Decimal } from "@prisma/client/runtime/library";
import type { FinanceDataset } from "./dataset";
import { calcularFxPorEpocas, type MonedaFx } from "./fx-cost-basis";
import type { Categoria, HechoEconomico, Ledger } from "./ledger";
import { construirCalidad, type Calidad, type QualityReason } from "./quality";
import { TcBitacora } from "./tc";
import { montosANumero, montosVacios, rangoMes, sumarMonto, type Moneda, type Montos } from "./types";

export type CategoriaResultado =
  | "FX_REALIZADO" | "RESULTADO_OPERATIVO" | "HONORARIO_CAMBIO" | "ARBITRAJE"
  | "INTERES_CC" | "INTERES_PF" | "INMUEBLE_RENTA" | "INMUEBLE_IMPUESTO" | "CARTERA_VENTA";

export interface PartidaResultado {
  categoria: CategoriaResultado;
  origen: string;
  origenId: string;
  fecha: string;
  moneda: Moneda;
  monto: number;
  usd: number | null;
  subtipo: string | null;
  descripcion: string | null;
}

export interface Excluido { cantidad: number; nativo: Record<Moneda, number> }

export interface ResultadoRealizado extends Calidad {
  mes: string;
  desde: string;
  hasta: string;
  partidas: PartidaResultado[];
  /** usd = null si alguna partida de la categoría no pudo convertirse. */
  porCategoria: Record<CategoriaResultado, { nativo: Record<Moneda, number>; usd: number | null }>;
  porMoneda: Record<Moneda, number>;
  /** Ingresos / egresos en USD: null si la calidad es INCOMPLETE. */
  ingresosUSD: number | null;
  egresosUSD: number | null;
  fx: Record<MonedaFx, { cantidadVendida: number; producidoARS: number; costoVendidoARS: number; resultadoARS: number; ventaSinBase: number }>;
  excluidos: Record<"pendientes" | "revertidos" | "duplicados" | "legacyNoClasificado" | "ownerNoResuelto" | "carteraSinCosto" | "distribuciones", Excluido>;
  tc: ReturnType<TcBitacora["resumen"]>;
  advertencias: string[];
}

const CAT_LEDGER_A_RESULTADO: Partial<Record<Categoria, CategoriaResultado>> = {
  RESULTADO_OPERATIVO: "RESULTADO_OPERATIVO",
  HONORARIO_CAMBIO: "HONORARIO_CAMBIO",
  ARBITRAJE: "ARBITRAJE",
  INTERES_CC: "INTERES_CC",
  INTERES_PF: "INTERES_PF",
  INMUEBLE_RENTA: "INMUEBLE_RENTA",
  INMUEBLE_IMPUESTO: "INMUEBLE_IMPUESTO",
  CARTERA_VENTA: "CARTERA_VENTA",
};

const CATEGORIAS: CategoriaResultado[] = [
  "FX_REALIZADO", "RESULTADO_OPERATIVO", "HONORARIO_CAMBIO", "ARBITRAJE",
  "INTERES_CC", "INTERES_PF", "INMUEBLE_RENTA", "INMUEBLE_IMPUESTO", "CARTERA_VENTA",
];

function excluidoVacio(): { cantidad: number; nativo: Montos } {
  return { cantidad: 0, nativo: montosVacios() };
}

export function calcularResultadoRealizado(ds: FinanceDataset, ledger: Ledger, mes: string): ResultadoRealizado {
  const { desde, hasta } = rangoMes(mes);
  const enMes = (f: string) => f >= desde && f < hasta;
  const tc = new TcBitacora(ds.tc);
  const advertencias: string[] = [...ledger.advertencias];
  const reasons: QualityReason[] = [];
  const partidas: PartidaResultado[] = [];

  const agregar = (p: Omit<PartidaResultado, "usd">) => {
    const usd = tc.aUSD(p.monto, p.moneda, p.fecha);
    partidas.push({ ...p, usd: usd === null ? null : usd.toNumber() });
  };

  // FX realizado: costo promedio móvil; cada venta con la base de SU época (M2-F03).
  const fxCb = calcularFxPorEpocas(ledger.fxOperaciones, { hastaExcl: hasta, apertura: ds.fxApertura });
  advertencias.push(...fxCb.advertencias);
  const fx = {} as ResultadoRealizado["fx"];
  for (const m of ["USD", "EUR", "BRL"] as const) {
    fx[m] = { cantidadVendida: 0, producidoARS: 0, costoVendidoARS: 0, resultadoARS: 0, ventaSinBase: 0 };
  }
  for (const v of fxCb.ventas) {
    if (!enMes(v.fecha)) continue;
    const f = fx[v.moneda];
    f.cantidadVendida += v.cantidad.toNumber();
    f.producidoARS += v.producidoARS.toNumber();
    f.costoVendidoARS += v.costoVendidoARS.toNumber();
    f.resultadoARS += v.resultadoARS.toNumber();
    f.ventaSinBase += v.ventaSinBase.toNumber();
    if (v.ventaSinBase.gt(0)) {
      // M2-F04: sin costo base el resultado de la venta es DESCONOCIDO, no cero.
      reasons.push({
        code: "FX_MISSING_COST_BASIS", severity: "INCOMPLETE",
        detail: `Venta FX ${v.opId} (${v.fecha}): ${v.ventaSinBase} ${v.moneda} sin costo base (época ${v.epoca})`,
      });
    }
    agregar({
      categoria: "FX_REALIZADO", origen: "CAMBIO", origenId: v.opId, fecha: v.fecha, moneda: "ARS",
      monto: v.resultadoARS.toNumber(), subtipo: v.moneda, descripcion: `Venta ${v.cantidad} ${v.moneda}`,
    });
  }

  // Hechos del libro
  const excl = {
    pendientes: excluidoVacio(), revertidos: excluidoVacio(), duplicados: excluidoVacio(),
    legacyNoClasificado: excluidoVacio(), ownerNoResuelto: excluidoVacio(), carteraSinCosto: excluidoVacio(),
    distribuciones: excluidoVacio(),
  };
  const contar = (k: keyof typeof excl, h: HechoEconomico) => {
    excl[k].cantidad++;
    sumarMonto(excl[k].nativo, h.moneda, h.importe);
  };
  const CAT_RESULTADO_CANDIDATAS = new Set<Categoria>([...Object.keys(CAT_LEDGER_A_RESULTADO) as Categoria[], "FX_VENTA"]);

  for (const h of ledger.hechos) {
    if (!enMes(h.fecha)) continue;
    if (h.categoria === "NO_CLASIFICADO_LEGACY") { if (h.estado === "CONFIRMADO") contar("legacyNoClasificado", h); continue; }
    if (h.categoria === "OWNER_NO_RESUELTO") { contar("ownerNoResuelto", h); continue; }
    if (h.categoria === "CARTERA_VENTA_SIN_COSTO") { contar("carteraSinCosto", h); continue; }
    if (h.categoria === "DISTRIBUCION" && h.estado === "CONFIRMADO") { contar("distribuciones", h); continue; }
    if (!CAT_RESULTADO_CANDIDATAS.has(h.categoria)) continue;
    if (h.estado === "PENDIENTE") { contar("pendientes", h); continue; }
    if (h.estado === "REVERTIDO") { contar("revertidos", h); continue; }
    if (h.estado === "DUPLICADO") { contar("duplicados", h); continue; }
    if (!h.impactoRealizado || h.categoria === "FX_VENTA") continue;
    const cat = CAT_LEDGER_A_RESULTADO[h.categoria];
    if (!cat) continue;
    agregar({
      categoria: cat, origen: h.origen, origenId: h.origenId, fecha: h.fecha, moneda: h.moneda,
      monto: h.importe.toNumber(), subtipo: h.subtipo, descripcion: h.descripcion,
    });
  }

  // Incidencias fechadas del libro (arbitraje inconsistente, venta de cartera sin costo).
  for (const i of ledger.incidencias) if (enMes(i.fecha)) reasons.push(i.reason);
  if (excl.legacyNoClasificado.cantidad > 0) {
    reasons.push({
      code: "LEGACY_UNCLASSIFIED", severity: "INCOMPLETE",
      detail: `${excl.legacyNoClasificado.cantidad} operaciones legacy GASTO/AJUSTE/OTRO sin clasificación inequívoca (el import mezcla gastos, pago de intereses PF y distribuciones)`,
    });
  }
  if (excl.ownerNoResuelto.cantidad > 0) {
    reasons.push({
      code: "OWNER_UNRESOLVED", severity: "INCOMPLETE",
      detail: `${excl.ownerNoResuelto.cantidad} registros Rulo/Div-Int/LP sin dueño económico resuelto`,
    });
  }

  // Agregados
  const porCategoria = {} as ResultadoRealizado["porCategoria"];
  for (const c of CATEGORIAS) porCategoria[c] = { nativo: montosANumero(montosVacios()), usd: 0 };
  const porMoneda = montosVacios();
  let conocido = new Decimal(0);
  let ingresos = new Decimal(0);
  let egresos = new Decimal(0);
  const nativosCat = new Map<CategoriaResultado, Montos>();
  for (const p of partidas) {
    sumarMonto(porMoneda, p.moneda, p.monto);
    const nm = nativosCat.get(p.categoria) ?? montosVacios();
    sumarMonto(nm, p.moneda, p.monto);
    nativosCat.set(p.categoria, nm);
    const pc = porCategoria[p.categoria];
    if (p.usd === null || pc.usd === null) pc.usd = null;
    else pc.usd += p.usd;
    if (p.usd !== null) {
      conocido = conocido.plus(p.usd);
      if (p.usd >= 0) ingresos = ingresos.plus(p.usd);
      else egresos = egresos.plus(-p.usd);
    }
  }
  for (const [c, m] of Array.from(nativosCat.entries())) porCategoria[c].nativo = montosANumero(m);

  reasons.push(...tc.motivos());
  const calidad = construirCalidad(conocido.toNumber(), reasons);

  const excluidos = {} as ResultadoRealizado["excluidos"];
  for (const [k, v] of Object.entries(excl)) {
    excluidos[k as keyof typeof excl] = { cantidad: v.cantidad, nativo: montosANumero(v.nativo) };
  }

  return {
    ...calidad,
    mes, desde, hasta, partidas, porCategoria,
    porMoneda: montosANumero(porMoneda),
    ingresosUSD: calidad.totalUSD === null ? null : ingresos.toNumber(),
    egresosUSD: calidad.totalUSD === null ? null : egresos.toNumber(),
    fx, excluidos, tc: tc.resumen(), advertencias,
  };
}
