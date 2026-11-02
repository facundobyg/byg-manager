import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { construirLedger } from "./ledger";
import { cargarFinanceDataset } from "./load";
import { calcularPatrimonioNeto } from "./patrimonio";
import { conciliarPeriodo } from "./reconciliacion";
import { calcularResultadoRealizado } from "./resultado";
import { calcularValuacion } from "./valuacion";

// MACRO 2 — API canónica del motor financiero. Posición, Home, Reportes,
// Análisis, Mov. diarios y Cierre consumen SOLO estas funciones.
// cache(): una carga por request (no persiste entre requests).

export const getFinanceDataset = cache(() => cargarFinanceDataset(prisma));
export const getLedger = cache(async () => construirLedger(await getFinanceDataset()));

export const getResultadoRealizadoMes = cache(async (mes: string) =>
  calcularResultadoRealizado(await getFinanceDataset(), await getLedger(), mes));

export const getPatrimonioNeto = cache(async (corte?: string) => {
  const ds = await getFinanceDataset();
  return calcularPatrimonioNeto(ds, corte ?? ds.hoy);
});

export const getValuacion = cache(async (corte?: string) => {
  const ds = await getFinanceDataset();
  return calcularValuacion(ds, await getLedger(), corte ?? ds.hoy);
});

export const getConciliacion = cache(async (inicio: string, fin: string) =>
  conciliarPeriodo(await getFinanceDataset(), await getLedger(), inicio, fin));

export type { ResultadoRealizado } from "./resultado";
export type { PatrimonioNeto } from "./patrimonio";
export type { Valuacion } from "./valuacion";
export type { Conciliacion } from "./reconciliacion";
