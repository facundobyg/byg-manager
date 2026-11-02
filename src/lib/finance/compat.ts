// MACRO 2 — Adaptadores PUROS de la salida canónica a las formas que ya
// consumen las pantallas (getUtilidadMes, getResultadoCambioMensual,
// getBalanceGeneral). No calculan nada propio: solo reexpresan el motor.
//
// Contrato de calidad (quality.ts): cada adaptador expone quality,
// qualityReasons y knownSubtotalUSD. Con calidad INCOMPLETE todo total/agregado
// USD es null — nunca 0 — y knownSubtotalUSD queda solo como diagnóstico.

import type { FinanceDataset } from "./dataset";
import type { Ledger } from "./ledger";
import type { PatrimonioNeto } from "./patrimonio";
import type { Quality, QualityReason } from "./quality";
import type { CategoriaResultado, ResultadoRealizado } from "./resultado";
import { D, rangoMes, ultimoDiaMes, type Moneda } from "./types";

export interface CalidadCompat {
  quality: Quality;
  qualityReasons: QualityReason[];
  knownSubtotalUSD: number;
}

/** ARS por 1 USD a una fecha (ventana ±31 días). null si no hay TC utilizable. */
export function arsPorUsd(ds: FinanceDataset, fecha: string): number | null {
  const tc = ds.tc.resolver("ARS", fecha);
  return tc ? D(1).div(tc.usdPorUnidad).toNumber() : null;
}

const CATS_INGRESO_EGRESO: CategoriaResultado[] = [
  "RESULTADO_OPERATIVO", "HONORARIO_CAMBIO", "INTERES_CC", "INTERES_PF",
  "INMUEBLE_RENTA", "INMUEBLE_IMPUESTO", "CARTERA_VENTA",
];

const LABEL_CAT: Record<CategoriaResultado, string> = {
  FX_REALIZADO: "Cambio FX", RESULTADO_OPERATIVO: "Resultado operativo", HONORARIO_CAMBIO: "Honorario (op. cambio)",
  ARBITRAJE: "Arbitraje", INTERES_CC: "Interés CC", INTERES_PF: "Interés PF", INMUEBLE_RENTA: "Renta inmueble",
  INMUEBLE_IMPUESTO: "Impuesto inmueble", CARTERA_VENTA: "Venta cartera propia",
};

const siCompleto = (q: Quality, v: number | null): number | null => (q === "INCOMPLETE" ? null : v);

export interface UtilidadMesCompat extends CalidadCompat {
  mes: string;
  cambioUSD: number | null;
  arbitrajesARS: number;
  arbitrajesUSD: number;
  ingresosARS: number | null;
  egresosARS: number | null;
  /** montoARS = equivalente al TC del HECHO; null si ese TC no existe. */
  ingresosItems: { label: string; montoARS: number | null }[];
  egresosItems: { label: string; montoARS: number | null }[];
  /** Resultado realizado canónico; null si INCOMPLETE. */
  utilidadTotalUSD: number | null;
  /** ARS/USD del corte (último día del mes); null si no hay TC utilizable. */
  tcBlue: number | null;
  ingresosUSD: number | null;
  egresosUSD: number | null;
  arbitrajesUSDEquiv: number | null;
  corte: { desde: string; hasta: string; tcFecha: string };
  advertencias: string[];
}

export function mapUtilidadMes(r: ResultadoRealizado, ds: FinanceDataset): UtilidadMesCompat {
  const tcFecha = ultimoDiaMes(r.mes);
  const ingresosItems: UtilidadMesCompat["ingresosItems"] = [];
  const egresosItems: UtilidadMesCompat["egresosItems"] = [];
  for (const p of r.partidas) {
    if (!CATS_INGRESO_EGRESO.includes(p.categoria)) continue;
    // Equivalente ARS al TC del HECHO (no al TC actual).
    const tcHecho = p.moneda === "ARS" ? 1 : arsPorUsd(ds, p.fecha);
    const montoARS = p.moneda === "ARS" ? p.monto : p.usd !== null && tcHecho !== null ? p.usd * tcHecho : null;
    const label = `${p.subtipo && p.categoria === "RESULTADO_OPERATIVO" ? p.subtipo : LABEL_CAT[p.categoria]}${p.moneda !== "ARS" ? ` (${p.monto.toFixed(2)} ${p.moneda})` : ""}`;
    if (p.monto >= 0) ingresosItems.push({ label, montoARS });
    else egresosItems.push({ label, montoARS: montoARS === null ? null : -montoARS });
  }
  const suma = (xs: { montoARS: number | null }[]) =>
    xs.some((x) => x.montoARS === null) ? null : xs.reduce((s, x) => s + (x.montoARS ?? 0), 0);
  return {
    quality: r.quality,
    qualityReasons: r.qualityReasons,
    knownSubtotalUSD: r.knownSubtotalUSD,
    mes: r.mes,
    cambioUSD: siCompleto(r.quality, r.porCategoria.FX_REALIZADO.usd),
    arbitrajesARS: r.porCategoria.ARBITRAJE.nativo.ARS,
    arbitrajesUSD: r.porCategoria.ARBITRAJE.nativo.USD,
    ingresosARS: suma(ingresosItems),
    egresosARS: suma(egresosItems),
    ingresosItems, egresosItems,
    utilidadTotalUSD: r.totalUSD,
    tcBlue: arsPorUsd(ds, tcFecha),
    ingresosUSD: r.ingresosUSD,
    egresosUSD: r.egresosUSD,
    arbitrajesUSDEquiv: siCompleto(r.quality, r.porCategoria.ARBITRAJE.usd),
    corte: { desde: r.desde, hasta: r.hasta, tcFecha },
    advertencias: r.advertencias,
  };
}

export interface ResultadoCambioCompat extends CalidadCompat {
  USD: { netoDivisa: number; netoARS: number; resultado: number | null };
  EUR: { netoDivisa: number; netoARS: number; resultado: number | null };
  BRL: { netoDivisa: number; netoARS: number; resultado: number | null };
  /** Resultado realizado CANÓNICO total del mes (mismo número en todas las pantallas); null si INCOMPLETE. */
  totalUSD: number | null;
  tcBlue: number | null;
}

export function mapResultadoCambio(r: ResultadoRealizado, ledger: Ledger, ds: FinanceDataset): ResultadoCambioCompat {
  const { desde, hasta } = rangoMes(r.mes);
  const out = {
    USD: { netoDivisa: 0, netoARS: 0, resultado: 0 as number | null },
    EUR: { netoDivisa: 0, netoARS: 0, resultado: 0 as number | null },
    BRL: { netoDivisa: 0, netoARS: 0, resultado: 0 as number | null },
  };
  // Flujo neto informativo de las operaciones LIQUIDADAS del mes (unidades nativas, sin conversión).
  for (const op of ledger.fxOperaciones) {
    if (op.fecha < desde || op.fecha >= hasta) continue;
    const s = op.lado === "COMPRA" ? 1 : -1;
    out[op.moneda].netoDivisa += D(op.cantidad).mul(s).toNumber();
    out[op.moneda].netoARS += D(op.totalARS).mul(-s).toNumber();
  }
  for (const p of r.partidas) {
    if (p.categoria !== "FX_REALIZADO" || !p.subtipo) continue;
    const c = out[p.subtipo as Exclude<Moneda, "ARS">];
    if (!c) continue;
    c.resultado = p.usd === null || c.resultado === null ? null : c.resultado + p.usd;
  }
  for (const m of ["USD", "EUR", "BRL"] as const) out[m].resultado = siCompleto(r.quality, out[m].resultado);
  return {
    ...out,
    quality: r.quality,
    qualityReasons: r.qualityReasons,
    knownSubtotalUSD: r.knownSubtotalUSD,
    totalUSD: r.totalUSD,
    tcBlue: arsPorUsd(ds, ultimoDiaMes(r.mes)),
  };
}

export interface BalanceGeneralCompat extends CalidadCompat {
  activoTotal: number | null;
  pasivoTotal: number | null;
  patrimonioNeto: number | null;
  activo: { cajas: number | null; cuentasCorrientes: number | null; cartera: number | null; inmuebles: number | null; pendientes: number | null; custodia: number | null };
  pasivo: { plazosFijos: number | null; cuentasNegativas: number | null; pendientes: number | null };
}

export function mapBalanceGeneral(pn: PatrimonioNeto): BalanceGeneralCompat {
  const c = pn.componentes;
  return {
    quality: pn.quality,
    qualityReasons: pn.qualityReasons,
    knownSubtotalUSD: pn.knownSubtotalUSD,
    activoTotal: pn.activoUSD,
    pasivoTotal: pn.pasivoUSD,
    patrimonioNeto: pn.pnUSD,
    activo: {
      cajas: c.cajas.usd,
      cuentasCorrientes: c.ccDeudora.usd,
      cartera: c.carteras.usd,
      inmuebles: c.inmuebles.usd,
      pendientes: c.pendientesCobrar.usd,
      custodia: pn.custodiaExcluidaUSD,
    },
    pasivo: {
      plazosFijos: c.pf.usd,
      cuentasNegativas: c.ccAcreedora.usd,
      pendientes: c.pendientesPagar.usd,
    },
  };
}
