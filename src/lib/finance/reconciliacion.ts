// MACRO 2 — INVARIANTE de patrimonio (pura).
//
//   PN(fin) − PN(inicio) = resultado realizado + Δvaluación + aportes − retiros
//                          + flujos patrimoniales clasificados
//
// Se verifica sobre los componentes del PN que tienen HISTORIAL fechado
// (cajas, pendientes, inmuebles). Carteras, CC y PF solo existen en su estado
// actual: el resultado cuya contrapartida está ahí (intereses CC/PF, arbitraje,
// venta de cartera) se lista aparte, no se esconde.
//
// Por moneda nativa: ΔPN = Σ hechos del período (clasificados) ; residual debe ser 0.
// En USD: ΔPN_USD = Σ hechos × TC del hecho + diferencia de conversión, donde
//   conversión = Σ_m PN0_m × (TC1_m − TC0_m) + Σ hechos_m × (TC1_m − TC_hecho_m)
// es la Δvaluación por tipo de cambio de los saldos no-USD (explícita, no un ajuste).

import { Decimal } from "@prisma/client/runtime/library";
import type { FinanceDataset } from "./dataset";
import { clasificarMovCaja, fechaReversaPorMovimiento, type Ledger } from "./ledger";
import { calcularPatrimonioNeto } from "./patrimonio";
import { D, MONEDAS, montosANumero, montosVacios, sumarMonto, type Moneda, type Montos } from "./types";

export type BucketConciliacion =
  | "RESULTADO_REALIZADO" | "REVERSAS_Y_REVERTIDOS" | "DISTRIBUCION" | "APORTES_INMUEBLE" | "RETIROS_INMUEBLE"
  | "FLUJO_PATRIMONIAL" | "TRANSFERENCIA_INTERNA" | "LIQUIDACION_CAMBIO" | "PENDIENTE_REGISTRADO" | "PENDIENTE_CANCELADO"
  | "PAGO_PENDIENTE" | "PENDIENTE_REABIERTO";

export interface Conciliacion {
  inicio: string;
  fin: string;
  componentes: readonly string[];
  variacionNativa: Record<Moneda, number>;
  explicado: Record<BucketConciliacion, Record<Moneda, number>>;
  residualNativo: Record<Moneda, number>;
  flujosPatrimonialesPorSubtipo: Record<string, Record<Moneda, number>>;
  usd: { variacion: number | null; hechosAlTcDelHecho: number | null; diferenciaConversion: number | null; residual: number | null };
  realizadoFueraDeComponentesHistoricos: Record<string, Record<Moneda, number>>;
  advertencias: string[];
}

const COMPONENTES_HISTORICOS = ["cajas", "pendientesCobrar", "pendientesPagar", "inmuebles"] as const;

export function conciliarPeriodo(ds: FinanceDataset, ledger: Ledger, inicio: string, fin: string): Conciliacion {
  const advertencias: string[] = [];
  const pn0 = calcularPatrimonioNeto(ds, inicio);
  const pn1 = calcularPatrimonioNeto(ds, fin);
  const hist = (pn: typeof pn0): Montos => {
    const m = montosVacios();
    for (const k of COMPONENTES_HISTORICOS) {
      const c = pn.componentes[k];
      for (const mon of MONEDAS) sumarMonto(m, mon, D(c.nativo[mon]).mul(c.lado === "ACTIVO" ? 1 : -1));
    }
    return m;
  };
  const h0 = hist(pn0);
  const h1 = hist(pn1);
  const variacion = montosVacios();
  for (const m of MONEDAS) variacion[m] = h1[m].minus(h0[m]);

  const enPeriodo = (f: string) => f > inicio && f <= fin;
  const buckets = {} as Record<BucketConciliacion, Montos>;
  const hechosUSD: { moneda: Moneda; monto: Decimal; fecha: string }[] = [];
  const add = (b: BucketConciliacion, moneda: Moneda, monto: Decimal, fecha: string) => {
    buckets[b] ??= montosVacios();
    sumarMonto(buckets[b], moneda, monto);
    hechosUSD.push({ moneda, monto, fecha });
  };
  const subtipos: Record<string, Montos> = {};

  const revertidoEn = fechaReversaPorMovimiento(ds.movsCaja);
  // Caja: cada movimiento confirmado del período, por su clasificación.
  const reversos = new Set(revertidoEn.keys());
  for (const m of ds.movsCaja) {
    const signo = m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN" ? 1 : -1;
    const monto = D(m.monto).mul(signo);
    if (m.confirmado && enPeriodo(m.fecha)) {
      const c = clasificarMovCaja(m);
      const revertido = reversos.has(m.id);
      const b: BucketConciliacion =
        c.categoria === "REVERSA" || revertido ? "REVERSAS_Y_REVERTIDOS"
        : c.categoria === "RESULTADO_OPERATIVO" ? "RESULTADO_REALIZADO"
        : c.categoria === "DISTRIBUCION" ? "DISTRIBUCION"
        : c.categoria === "TRANSFERENCIA_INTERNA" ? "TRANSFERENCIA_INTERNA"
        : c.categoria === "CAMBIO_LIQUIDACION" ? "LIQUIDACION_CAMBIO"
        : c.categoria === "PAGO_PENDIENTE" ? "PAGO_PENDIENTE"
        : "FLUJO_PATRIMONIAL";
      add(b, m.moneda, monto, m.fecha);
      if (b === "FLUJO_PATRIMONIAL") {
        const k = c.subtipo ?? "SIN_CLASIFICAR";
        subtipos[k] ??= montosVacios();
        sumarMonto(subtipos[k], m.moneda, monto);
      }
    }
    // Pendientes: alta en el período (+ a cobrar / − a pagar).
    if (!m.confirmado && !m.anulado && (m.tipo === "ENTRADA" || m.tipo === "SALIDA") && enPeriodo(m.fecha)) {
      add("PENDIENTE_REGISTRADO", m.moneda, monto, m.fecha);
    }
    // Pago parcial confirmado en el período: baja el residual del pendiente (contrapartida de la pata de caja).
    if (m.pagoDeId && m.confirmado && !m.anulado) {
      const orig = ds.movsCaja.find((x) => x.id === m.pagoDeId);
      if (orig && !orig.confirmado && !orig.anulado) {
        if (enPeriodo(m.fecha)) add("PENDIENTE_CANCELADO", m.moneda, monto.neg(), m.fecha);
        // MACRO 3: si el pago se revierte en el período, el pendiente se reabre por ese monto.
        const rev = revertidoEn.get(m.id);
        if (rev && enPeriodo(rev) && rev >= m.fecha) add("PENDIENTE_REABIERTO", m.moneda, monto, rev);
      }
    }
  }

  // Inmuebles: base patrimonial.
  for (const m of ds.inmuebles) {
    if (!enPeriodo(m.fecha)) continue;
    if (m.tipo === "INGRESO" || m.tipo === "MEJORA") add("APORTES_INMUEBLE", m.moneda, D(m.monto).abs(), m.fecha);
    else if (m.tipo === "EGRESO") add("RETIROS_INMUEBLE", m.moneda, D(m.monto).abs().neg(), m.fecha);
  }

  const explicado = montosVacios();
  for (const b of Object.values(buckets)) for (const m of MONEDAS) explicado[m] = explicado[m].plus(b[m]);
  const residual = montosVacios();
  for (const m of MONEDAS) residual[m] = variacion[m].minus(explicado[m]);
  for (const m of MONEDAS) if (!residual[m].isZero()) advertencias.push(`Residual ${m} ${residual[m].toFixed(2)}: hay un flujo del período sin clasificar`);

  // Resultado realizado con contrapartida fuera de los componentes con historial.
  const fuera: Record<string, Montos> = {};
  for (const h of ledger.hechos) {
    if (!h.impactoRealizado || h.estado !== "CONFIRMADO" || !enPeriodo(h.fecha)) continue;
    if (h.origen === "CAJA" || h.categoria === "FX_VENTA") continue;
    const k = h.categoria;
    fuera[k] ??= montosVacios();
    sumarMonto(fuera[k], h.moneda, h.importe);
  }

  // USD: identidad con diferencia de conversión explícita.
  const r0 = new Map<Moneda, Decimal | null>();
  const r1 = new Map<Moneda, Decimal | null>();
  for (const m of MONEDAS) {
    r0.set(m, ds.tc.resolver(m, inicio)?.usdPorUnidad ?? null);
    r1.set(m, ds.tc.resolver(m, fin)?.usdPorUnidad ?? null);
  }
  let usd: Conciliacion["usd"] = { variacion: null, hechosAlTcDelHecho: null, diferenciaConversion: null, residual: null };
  const monedasConSaldo = MONEDAS.filter((m) => !h0[m].isZero() || !h1[m].isZero() || hechosUSD.some((x) => x.moneda === m));
  if (monedasConSaldo.every((m) => r0.get(m) && r1.get(m))) {
    let variacionUSD = new Decimal(0);
    let conversion = new Decimal(0);
    for (const m of monedasConSaldo) {
      variacionUSD = variacionUSD.plus(h1[m].mul(r1.get(m)!)).minus(h0[m].mul(r0.get(m)!));
      conversion = conversion.plus(h0[m].mul(r1.get(m)!.minus(r0.get(m)!)));
    }
    let hechos = new Decimal(0);
    let faltaTc = false;
    for (const x of hechosUSD) {
      const rh = ds.tc.resolver(x.moneda, x.fecha)?.usdPorUnidad;
      if (!rh) { faltaTc = true; break; }
      hechos = hechos.plus(x.monto.mul(rh));
      conversion = conversion.plus(x.monto.mul(r1.get(x.moneda)!.minus(rh)));
    }
    // El residual nativo (si lo hay) se valúa al TC final.
    let residualUSD = new Decimal(0);
    for (const m of monedasConSaldo) residualUSD = residualUSD.plus(residual[m].mul(r1.get(m)!));
    if (!faltaTc) {
      usd = {
        variacion: variacionUSD.toNumber(),
        hechosAlTcDelHecho: hechos.toNumber(),
        diferenciaConversion: conversion.toNumber(),
        residual: variacionUSD.minus(hechos).minus(conversion).toNumber(),
      };
      if (Math.abs(usd.residual! - residualUSD.toNumber()) > 0.01) advertencias.push("Identidad USD inconsistente con el residual nativo");
    }
  } else {
    advertencias.push("Falta TC en inicio o fin del período: conciliación USD no calculada");
  }

  const explicadoNum = {} as Conciliacion["explicado"];
  for (const [k, v] of Object.entries(buckets)) explicadoNum[k as BucketConciliacion] = montosANumero(v);
  const subNum: Record<string, Record<Moneda, number>> = {};
  for (const [k, v] of Object.entries(subtipos)) subNum[k] = montosANumero(v);
  const fueraNum: Record<string, Record<Moneda, number>> = {};
  for (const [k, v] of Object.entries(fuera)) fueraNum[k] = montosANumero(v);

  return {
    inicio, fin, componentes: COMPONENTES_HISTORICOS,
    variacionNativa: montosANumero(variacion),
    explicado: explicadoNum,
    residualNativo: montosANumero(residual),
    flujosPatrimonialesPorSubtipo: subNum,
    usd,
    realizadoFueraDeComponentesHistoricos: fueraNum,
    advertencias,
  };
}
