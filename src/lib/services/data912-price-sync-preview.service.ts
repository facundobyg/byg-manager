// Preview / dry-run de sincronización de precios Data912 -> BYG.
//
// IMPORTANTE: este servicio es 100% read-only. Lee Activo, Holding,
// PriceTickerAlias y los snapshots de Data912, y devuelve un plan de
// actualización — NUNCA escribe precioActual, priceSource, priceStatus ni
// ninguna otra columna. Aplicar el plan es responsabilidad de un módulo
// posterior, no de este.

import { prisma } from "@/lib/prisma";
import type { CategoriaActivo, PriceSource, PriceStatus } from "@prisma/client";
import {
  fetchAllData912Endpoints,
  findQuoteInSnapshot,
  type Data912EndpointKey,
  type Data912FetchAllResult,
  type InferredCurrency,
} from "./data912.service";
import {
  applyAliasOverride,
  applyRuleBasedCandidates,
  resolveTickerForData912,
  type MonedaPrecio,
  type PriceTickerAliasInput,
  type ResolveSource,
  type TickerResolveInput,
} from "./price-ticker-resolver.service";

export type PriceSyncResolveStatus = "MATCHED" | "MANUAL_ONLY" | "NOT_FOUND" | "AMBIGUOUS" | "PROVIDER_ERROR";

export interface PriceSyncPreviewRow {
  origin:          "ACTIVO" | "HOLDING";
  id:              string;
  ticker:          string;
  category:        CategoriaActivo | null;
  currentPrice:    number | null;
  currentSource:   PriceSource | null;
  currentStatus:   PriceStatus | null;
  monedaPrecio:    string | null;
  resolveStatus:   PriceSyncResolveStatus;
  resolveSource:   ResolveSource;
  endpoint:        Data912EndpointKey | null;
  data912Symbol:   string | null;
  data912Price:    number | null;
  inferredCurrency: InferredCurrency;
  confidence:      "HIGH" | "MEDIUM" | "LOW" | "NONE";
  reason:          string;
  wouldUpdate:     boolean;
}

export interface Data912PriceSyncPreviewResult {
  fetchedAt: Date;
  data912: {
    okCount:     number;
    failedCount: number;
    endpointResults: Record<Data912EndpointKey, { ok: boolean; error?: string; quoteCount: number }>;
  };
  summary: {
    totalActivos:      number;
    totalHoldings:     number;
    totalUniqueInputs: number;
    matched:           number;
    manualOnly:        number;
    notFound:          number;
    ambiguous:         number;
    providerErrors:    number;
  };
  rows: PriceSyncPreviewRow[];
}

export interface BuildPriceSyncPreviewOptions {
  timeoutMs?: number;
}

interface ClassifyResult {
  resolveStatus:    PriceSyncResolveStatus;
  resolveSource:    ResolveSource;
  endpoint:         Data912EndpointKey | null;
  data912Symbol:    string | null;
  data912Price:     number | null;
  inferredCurrency: InferredCurrency;
  confidence:       "HIGH" | "MEDIUM" | "LOW" | "NONE";
  reason:           string;
}

function attemptedEndpoints(
  input: TickerResolveInput,
  aliases: PriceTickerAliasInput[],
): Data912EndpointKey[] {
  const aliasResult = applyAliasOverride(input, aliases);
  if (aliasResult === "AMBIGUOUS") return [];
  if (aliasResult) return [aliasResult.candidate.endpoint];
  return applyRuleBasedCandidates(input).map((c) => c.endpoint);
}

function classifyTicker(
  input: TickerResolveInput,
  snapshots: Data912FetchAllResult,
  aliases: PriceTickerAliasInput[],
): ClassifyResult {
  const result = resolveTickerForData912(input, snapshots, aliases);

  if (result.source === "MANUAL_ONLY") {
    return {
      resolveStatus: "MANUAL_ONLY", resolveSource: result.source, endpoint: null, data912Symbol: null,
      data912Price: null, inferredCurrency: null, confidence: result.confidence, reason: result.reason,
    };
  }

  if (result.ok) {
    const quote = result.endpoint && result.data912Symbol
      ? findQuoteInSnapshot(snapshots, result.endpoint, result.data912Symbol)
      : null;
    return {
      resolveStatus: "MATCHED", resolveSource: result.source, endpoint: result.endpoint, data912Symbol: result.data912Symbol,
      data912Price: quote?.price ?? null, inferredCurrency: quote?.inferredCurrency ?? null,
      confidence: result.confidence, reason: result.reason,
    };
  }

  if (result.source === "AMBIGUOUS") {
    return {
      resolveStatus: "AMBIGUOUS", resolveSource: result.source, endpoint: null, data912Symbol: null,
      data912Price: null, inferredCurrency: null, confidence: result.confidence, reason: result.reason,
    };
  }

  // NOT_FOUND o ALIAS configurado pero ausente en el snapshot actual: antes
  // de aceptar "no existe", verificar si el/los endpoint(s) que se habrían
  // consultado realmente fallaron (red/timeout) — en ese caso no se puede
  // afirmar que el símbolo no existe, es un error del proveedor.
  const attempted = attemptedEndpoints(input, aliases);
  const failedEndpoint = attempted.find((ep) => !snapshots.results[ep]?.ok);
  if (failedEndpoint) {
    const err = snapshots.results[failedEndpoint]?.error ?? "error desconocido";
    return {
      resolveStatus: "PROVIDER_ERROR", resolveSource: result.source, endpoint: result.endpoint, data912Symbol: result.data912Symbol,
      data912Price: null, inferredCurrency: null, confidence: "NONE",
      reason: `El endpoint "${failedEndpoint}" de Data912 falló (${err}); no se puede confirmar si el símbolo existe.`,
    };
  }

  return {
    resolveStatus: "NOT_FOUND", resolveSource: result.source, endpoint: result.endpoint, data912Symbol: result.data912Symbol,
    data912Price: null, inferredCurrency: null, confidence: result.confidence, reason: result.reason,
  };
}

function computeWouldUpdate(c: ClassifyResult): boolean {
  if (c.resolveStatus !== "MATCHED") return false;
  return typeof c.data912Price === "number" && Number.isFinite(c.data912Price) && c.data912Price > 0;
}

/**
 * Construye el plan de sincronización de precios contra Data912, sin
 * aplicar nada. Lee Activo, HoldingComitenteInversion y PriceTickerAlias
 * (solo enabled:true), descarga los snapshots de Data912, y resuelve cada
 * ticker con price-ticker-resolver.service. No escribe en DB.
 */
export async function buildData912PriceSyncPreview(
  options?: BuildPriceSyncPreviewOptions,
): Promise<Data912PriceSyncPreviewResult> {
  const [activos, holdings, aliasRows, snapshots] = await Promise.all([
    prisma.activo.findMany({
      select: { id: true, ticker: true, categoria: true, precioActual: true, monedaPrecio: true, priceSource: true, priceStatus: true },
    }),
    prisma.holdingComitenteInversion.findMany({
      select: { id: true, ticker: true, precioActual: true, precioPromedio: true, cantidad: true, priceSource: true, priceStatus: true },
    }),
    prisma.priceTickerAlias.findMany({ where: { enabled: true } }),
    fetchAllData912Endpoints(options?.timeoutMs != null ? { timeoutMs: options.timeoutMs } : undefined),
  ]);

  const aliasInputs: PriceTickerAliasInput[] = aliasRows.map((a) => ({
    bygTicker:       a.bygTicker,
    bygCategory:     a.bygCategory,
    data912Endpoint: a.data912Endpoint as Data912EndpointKey,
    data912Symbol:   a.data912Symbol,
    enabled:         a.enabled,
    note:            a.note,
  }));

  const activoByTicker = new Map(activos.map((a) => [a.ticker.trim().toUpperCase(), a]));

  const cache = new Map<string, ClassifyResult>();
  function resolveCached(ticker: string, category: CategoriaActivo | null, monedaPrecio: MonedaPrecio | null): ClassifyResult {
    const key = `${ticker.trim().toUpperCase()}|${category ?? ""}|${monedaPrecio ?? ""}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const computed = classifyTicker({ bygTicker: ticker, category, monedaPrecio }, snapshots, aliasInputs);
    cache.set(key, computed);
    return computed;
  }

  const rows: PriceSyncPreviewRow[] = [];

  for (const a of activos) {
    const moneda = (a.monedaPrecio as MonedaPrecio | null) ?? null;
    const c = resolveCached(a.ticker, a.categoria, moneda);
    rows.push({
      origin: "ACTIVO",
      id: a.id,
      ticker: a.ticker,
      category: a.categoria,
      currentPrice: a.precioActual != null ? Number(a.precioActual) : null,
      currentSource: a.priceSource,
      currentStatus: a.priceStatus,
      monedaPrecio: a.monedaPrecio,
      resolveStatus: c.resolveStatus,
      resolveSource: c.resolveSource,
      endpoint: c.endpoint,
      data912Symbol: c.data912Symbol,
      data912Price: c.data912Price,
      inferredCurrency: c.inferredCurrency,
      confidence: c.confidence,
      reason: c.reason,
      wouldUpdate: computeWouldUpdate(c),
    });
  }

  for (const h of holdings) {
    const matchedActivo = activoByTicker.get(h.ticker.trim().toUpperCase()) ?? null;
    const category = matchedActivo?.categoria ?? null;
    const moneda = (matchedActivo?.monedaPrecio as MonedaPrecio | null) ?? null;
    const c = resolveCached(h.ticker, category, moneda);
    rows.push({
      origin: "HOLDING",
      id: h.id,
      ticker: h.ticker,
      category,
      currentPrice: h.precioActual != null ? Number(h.precioActual) : null,
      currentSource: h.priceSource,
      currentStatus: h.priceStatus,
      monedaPrecio: matchedActivo?.monedaPrecio ?? null,
      resolveStatus: c.resolveStatus,
      resolveSource: c.resolveSource,
      endpoint: c.endpoint,
      data912Symbol: c.data912Symbol,
      data912Price: c.data912Price,
      inferredCurrency: c.inferredCurrency,
      confidence: c.confidence,
      reason: c.reason,
      wouldUpdate: computeWouldUpdate(c),
    });
  }

  const endpointResults = {} as Data912PriceSyncPreviewResult["data912"]["endpointResults"];
  (Object.keys(snapshots.results) as Data912EndpointKey[]).forEach((key) => {
    const r = snapshots.results[key];
    endpointResults[key] = { ok: r.ok, error: r.error, quoteCount: r.quotes.length };
  });

  const summary = {
    totalActivos: activos.length,
    totalHoldings: holdings.length,
    totalUniqueInputs: cache.size,
    matched: rows.filter((r) => r.resolveStatus === "MATCHED").length,
    manualOnly: rows.filter((r) => r.resolveStatus === "MANUAL_ONLY").length,
    notFound: rows.filter((r) => r.resolveStatus === "NOT_FOUND").length,
    ambiguous: rows.filter((r) => r.resolveStatus === "AMBIGUOUS").length,
    providerErrors: rows.filter((r) => r.resolveStatus === "PROVIDER_ERROR").length,
  };

  return { fetchedAt: snapshots.fetchedAt, data912: { okCount: snapshots.okCount, failedCount: snapshots.failedCount, endpointResults }, summary, rows };
}
