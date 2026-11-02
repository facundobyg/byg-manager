// MACRO 2 — VALUACIÓN / resultado NO realizado a una fecha de corte (pura).
// Separada del resultado realizado: Δprecio y ΔTC sobre posiciones abiertas
// NUNCA entran en la utilidad mensual.
//
//   FX     : posición remanente del costo promedio móvil (cantidad, costo ARS),
//            con la base de la época del corte (apertura solo si corte ≥ su fecha).
//            valor = cantidad × TC corte ; noRealizado = valor − costo (al TC ARS del corte).
//   Cartera: por posición, valor = cantidad × precioActual ; costo = cantidad × precioCompra.
//            Sin precio → NO se valúa (ni a 0 ni a costo): MISSING_MARKET_PRICE → INCOMPLETE.
//   Inmuebles: no hay valor de mercado en el modelo → sin valuación separada.
// Custodia de clientes: excluida.

import { Decimal } from "@prisma/client/runtime/library";
import type { FinanceDataset } from "./dataset";
import { calcularFxPorEpocas } from "./fx-cost-basis";
import type { Ledger } from "./ledger";
import { construirCalidad, type Calidad, type QualityReason } from "./quality";
import { TcBitacora } from "./tc";
import { D, fechaISO, type Moneda } from "./types";

export interface Valuacion extends Calidad {
  corte: string;
  fx: { moneda: Moneda; cantidad: number; costoARS: number; valorUSD: number | null; costoUSD: number | null; noRealizadoUSD: number | null }[];
  cartera: {
    cartera: string; ticker: string; moneda: Moneda; cantidad: number;
    valor: number | null; costo: number; noRealizado: number | null; noRealizadoUSD: number | null;
  }[];
  inmuebles: { nota: string };
  /** Igual a totalUSD (null si INCOMPLETE). */
  totalNoRealizadoUSD: number | null;
  tc: ReturnType<TcBitacora["resumen"]>;
  advertencias: string[];
}

function diaSiguiente(f: string): string {
  const d = new Date(`${f}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return fechaISO(d);
}

export function calcularValuacion(ds: FinanceDataset, ledger: Ledger, corte: string = ds.hoy): Valuacion {
  const tc = new TcBitacora(ds.tc);
  const advertencias: string[] = [];
  const reasons: QualityReason[] = [];
  let conocido = new Decimal(0);
  const sumar = (v: Decimal | null) => { if (v) conocido = conocido.plus(v); };

  const cb = calcularFxPorEpocas(ledger.fxOperaciones, { hastaExcl: diaSiguiente(corte), apertura: ds.fxApertura });
  const fx: Valuacion["fx"] = [];
  for (const m of ["USD", "EUR", "BRL"] as const) {
    const p = cb.posiciones[m];
    // Si alguna venta de la época de esta posición no tuvo base, la cantidad remanente no es confiable.
    const sinBase = cb.ventas.filter((v) => v.moneda === m && v.epoca === p.epoca && v.fecha <= corte && v.ventaSinBase.gt(0));
    if (sinBase.length > 0) {
      reasons.push({ code: "FX_MISSING_COST_BASIS", severity: "INCOMPLETE", detail: `Posición ${m}: ${sinBase.length} venta(s) sin costo base antes del corte` });
    }
    if (p.cantidad.isZero() && p.costoARS.isZero()) continue;
    const valor = tc.aUSD(p.cantidad, m, corte);
    const costo = tc.aUSD(p.costoARS, "ARS", corte);
    const nr = valor && costo ? valor.minus(costo) : null;
    sumar(nr);
    fx.push({
      moneda: m, cantidad: p.cantidad.toNumber(), costoARS: p.costoARS.toNumber(),
      valorUSD: valor?.toNumber() ?? null, costoUSD: costo?.toNumber() ?? null, noRealizadoUSD: nr?.toNumber() ?? null,
    });
  }

  if (corte < ds.hoy) {
    reasons.push({ code: "HISTORICAL_STATE_UNAVAILABLE", severity: "INCOMPLETE", detail: "Posiciones de cartera sin historial: no hay estado al corte" });
  }
  const cartera: Valuacion["cartera"] = [];
  for (const c of ds.carteras) {
    for (const p of c.posiciones) {
      const cant = D(p.cantidad);
      const costo = cant.mul(D(p.precioCompra));
      if (p.precioActual == null) {
        if (!cant.isZero()) {
          reasons.push({ code: "MISSING_MARKET_PRICE", severity: "INCOMPLETE", detail: `${c.nombre}/${p.ticker}: sin precio de mercado` });
        }
        cartera.push({ cartera: c.nombre, ticker: p.ticker, moneda: p.monedaPrecio, cantidad: cant.toNumber(), valor: null, costo: costo.toNumber(), noRealizado: null, noRealizadoUSD: null });
        continue;
      }
      const valor = cant.mul(D(p.precioActual));
      const nr = valor.minus(costo);
      const nrUSD = tc.aUSD(nr, p.monedaPrecio, corte);
      sumar(nrUSD);
      cartera.push({
        cartera: c.nombre, ticker: p.ticker, moneda: p.monedaPrecio, cantidad: cant.toNumber(),
        valor: valor.toNumber(), costo: costo.toNumber(), noRealizado: nr.toNumber(), noRealizadoUSD: nrUSD?.toNumber() ?? null,
      });
    }
  }

  reasons.push(...tc.motivos());
  const calidad = construirCalidad(conocido.toNumber(), reasons);
  return {
    ...calidad,
    corte, fx, cartera,
    inmuebles: { nota: "Sin valor de mercado en el modelo: el inmueble se mide a base patrimonial (costo)" },
    totalNoRealizadoUSD: calidad.totalUSD,
    tc: tc.resumen(), advertencias,
  };
}
