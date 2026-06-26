// Resolución de ticker BYG -> símbolo Data912, basada en las reglas reales
// confirmadas en Módulo 4.1 + tabla de alias manual (PriceTickerAlias).
//
// IMPORTANTE: este servicio NO hace fetch a Data912 y NO toca la DB.
// Recibe snapshots ya descargados (fetchAllData912Endpoints) y una lista de
// alias ya cargada por el caller — es puro y testeable. No escribe precios.

import type { CategoriaActivo } from "@prisma/client";
import {
  findQuoteInSnapshot,
  type Data912EndpointKey,
  type Data912FetchAllResult,
} from "./data912.service";

export type ResolveSource = "RULE" | "ALIAS" | "MANUAL_ONLY" | "NOT_FOUND" | "AMBIGUOUS";
export type ResolveConfidence = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export type MonedaPrecio = "ARS" | "USD";

export interface TickerResolveInput {
  bygTicker:     string;
  category:      CategoriaActivo | null;
  monedaPrecio?: MonedaPrecio | null;
}

export interface TickerResolveResult {
  ok:            boolean;
  source:        ResolveSource;
  bygTicker:     string;
  category:      CategoriaActivo | null;
  endpoint:      Data912EndpointKey | null;
  data912Symbol: string | null;
  reason:        string;
  confidence:    ResolveConfidence;
}

// Shape de alias desacoplado de Prisma — el caller (módulo posterior) mapea
// filas de PriceTickerAlias a esto antes de pasarlas.
export interface PriceTickerAliasInput {
  bygTicker:       string;
  bygCategory?:    CategoriaActivo | null;
  data912Endpoint: Data912EndpointKey;
  data912Symbol:   string;
  enabled:         boolean;
  note?:           string | null;
}

interface Candidate {
  endpoint: Data912EndpointKey;
  symbol:   string;
}

// Categorías que nunca deben consultar Data912 — confirmado en 4.1: cobertura
// real nula para CRIPTO y FCI, y para CRIPTO además hay riesgo de falso
// positivo (ej. "BTC" matchea por casualidad una acción no relacionada en
// usa_stocks). Nunca llegan ni a mirar snapshots ni alias.
function normalizeTicker(t: string): string {
  return t.trim().toUpperCase();
}

function endsWith(ticker: string, suffix: string): boolean {
  return normalizeTicker(ticker).endsWith(suffix);
}

function stripSuffix(ticker: string, suffix: string): string {
  const t = normalizeTicker(ticker);
  return t.slice(0, t.length - suffix.length);
}

/**
 * Devuelve el motivo por el que una categoría/ticker es siempre manual, o
 * null si no aplica. No depende de snapshots ni alias.
 */
export function getManualOnlyReason(category: CategoriaActivo | null): string | null {
  if (category === "CRIPTO") {
    return "CRIPTO: cobertura real nula en Data912 confirmada en Módulo 4.1, nunca se consulta.";
  }
  if (category === "FCI") {
    return "FCI: cobertura real nula en Data912 confirmada en Módulo 4.1, nunca se consulta.";
  }
  return null;
}

/**
 * Candidatos ordenados a probar para un ticker, según las reglas confirmadas
 * en Módulo 4.1. No verifica si el candidato existe en un snapshot — eso lo
 * hace resolveTickerForData912. Devuelve [] si la categoría no tiene regla
 * automática definida (ej. ACCION_USD_EXT, sin registros reales hoy; o
 * CEDEAR ".BA" sin monedaPrecio ARS conocido).
 */
export function applyRuleBasedCandidates(input: TickerResolveInput): Candidate[] {
  const { bygTicker, category, monedaPrecio } = input;
  if (category == null) return [];

  switch (category) {
    case "BONO_USD": {
      // Regla 1: nunca usar el match sin "D" (es otra escala/variante peso).
      // Siempre agregar "D" y buscar en arg_bonds.
      return [{ endpoint: "arg_bonds", symbol: normalizeTicker(bygTicker) + "D" }];
    }

    case "ON_USD": {
      // Regla 5: arg_corp primero, arg_bonds como fallback (caso real: BDC33).
      const t = normalizeTicker(bygTicker);
      return [
        { endpoint: "arg_corp", symbol: t },
        { endpoint: "arg_bonds", symbol: t },
      ];
    }

    case "ACCION_ARS": {
      // Acciones locales argentinas en pesos (YPFD, BBAR, BHIP, METR
      // confirmados en Módulo 4.10) -> exacto en arg_stocks. No usar
      // arg_cedears (no son CEDEARs) ni aplicar ningún ajuste de escala
      // (eso es exclusivo de renta fija, ver normalizeData912PriceForByg).
      return [{ endpoint: "arg_stocks", symbol: normalizeTicker(bygTicker) }];
    }

    case "ACCION_USD": {
      const t = normalizeTicker(bygTicker);
      if (endsWith(t, "D")) {
        // Regla 2: ya viene con "D" en BYG -> exacto en arg_stocks.
        return [{ endpoint: "arg_stocks", symbol: t }];
      }
      // Extensión confirmada en 4.1 (no enumerada explícitamente en la
      // consigna, pero evidenciada con MSFT/AMC/JMIA/NIO/HIMS/ROKU/etc.):
      // ACCION_USD sin "D" matchea exacto en usa_stocks.
      return [{ endpoint: "usa_stocks", symbol: t }];
    }

    case "ACCION_USD_EXT": {
      // Regla 7: sin registros reales hoy — no inventar uso todavía.
      return [];
    }

    case "CEDEAR": {
      const t = normalizeTicker(bygTicker);
      if (endsWith(t, ".BA")) {
        // Regla 4: ambiguo en general. Solo se resuelve por regla cuando
        // monedaPrecio es ARS (consistente con lo que ".BA" significa) —
        // confirmado con AAPL.BA/GOOGL.BA/MELI.BA en 4.1. Si no hay
        // monedaPrecio o es USD, no hay patrón confirmado: queda ambiguo.
        if (monedaPrecio === "ARS") {
          return [{ endpoint: "arg_cedears", symbol: stripSuffix(t, ".BA") }];
        }
        return [];
      }
      if (endsWith(t, "D")) {
        // Regla 3: NO usar exacto (esa variante es otra cosa, confirmado con
        // AAPLD). Quitar "D" y buscar en arg_cedears. Confianza media: hay
        // excepciones reales dentro de esta misma categoría (ej. tickers que
        // en realidad son acciones locales, ver categoría ACCION_ARS).
        return [{ endpoint: "arg_cedears", symbol: stripSuffix(t, "D") }];
      }
      // Regla 6: CEDEAR sin sufijos conflictivos -> exacto en arg_cedears.
      return [{ endpoint: "arg_cedears", symbol: t }];
    }

    case "BONO_ARS": {
      // No hay tickers reales BONO_ARS verificados contra Data912 en 4.1 —
      // no inventar una regla sin evidencia.
      return [];
    }

    default:
      return [];
  }
}

function endpointDefaultCurrency(endpoint: Data912EndpointKey): MonedaPrecio | null {
  switch (endpoint) {
    case "arg_cedears":
      return "ARS";
    case "usa_stocks":
    case "usa_adrs":
      return "USD";
    default:
      // arg_bonds / arg_corp / arg_stocks / arg_notes: la moneda depende del
      // símbolo puntual (sufijo "D"), no del endpoint en sí — no se puede
      // usar para desambiguar alias acá sin mirar el símbolo.
      return null;
  }
}

/**
 * Busca overrides manuales habilitados para este ticker. Si hay más de uno
 * (ej. PBR: arg_cedears para ARS, usa_adrs para USD), desambigua por
 * monedaPrecio. Si no se puede desambiguar, devuelve null (el caller decide
 * AMBIGUOUS).
 */
export function applyAliasOverride(
  input: TickerResolveInput,
  aliases: PriceTickerAliasInput[] | undefined,
): { candidate: Candidate; note?: string | null } | "AMBIGUOUS" | null {
  if (!aliases || aliases.length === 0) return null;

  const ticker = normalizeTicker(input.bygTicker);
  const matches = aliases.filter((a) => a.enabled && normalizeTicker(a.bygTicker) === ticker);
  if (matches.length === 0) return null;
  if (matches.length === 1) {
    const a = matches[0];
    return { candidate: { endpoint: a.data912Endpoint, symbol: a.data912Symbol }, note: a.note };
  }

  // Múltiples alias para el mismo ticker -> desambiguar por monedaPrecio.
  if (input.monedaPrecio) {
    const filtered = matches.filter((a) => endpointDefaultCurrency(a.data912Endpoint) === input.monedaPrecio);
    if (filtered.length === 1) {
      const a = filtered[0];
      return { candidate: { endpoint: a.data912Endpoint, symbol: a.data912Symbol }, note: a.note };
    }
  }
  return "AMBIGUOUS";
}

/**
 * Resuelve un único ticker BYG contra los snapshots ya descargados de
 * Data912. No hace fetch. No escribe nada. El orden de prioridad es:
 * 1) categorías manual-only (CRIPTO/FCI) -> nunca se consulta nada.
 * 2) alias manual habilitado (si hay ambigüedad sin desambiguar -> AMBIGUOUS).
 * 3) reglas automáticas confirmadas en 4.1, probadas en orden contra los
 *    snapshots reales — solo se devuelve ok:true si el símbolo realmente
 *    aparece en el snapshot, nunca por confianza ciega en la regla.
 */
export function resolveTickerForData912(
  input: TickerResolveInput,
  snapshots: Data912FetchAllResult,
  aliases?: PriceTickerAliasInput[],
): TickerResolveResult {
  const base = {
    bygTicker: input.bygTicker,
    category:  input.category,
  };

  const manualReason = getManualOnlyReason(input.category);
  if (manualReason) {
    return { ...base, ok: false, source: "MANUAL_ONLY", endpoint: null, data912Symbol: null, reason: manualReason, confidence: "NONE" };
  }

  const aliasResult = applyAliasOverride(input, aliases);
  if (aliasResult === "AMBIGUOUS") {
    return {
      ...base, ok: false, source: "AMBIGUOUS", endpoint: null, data912Symbol: null,
      reason: "Hay más de un alias habilitado para este ticker y no se pudo desambiguar por monedaPrecio.",
      confidence: "NONE",
    };
  }
  if (aliasResult) {
    const quote = findQuoteInSnapshot(snapshots, aliasResult.candidate.endpoint, aliasResult.candidate.symbol);
    if (quote) {
      return {
        ...base, ok: true, source: "ALIAS", endpoint: aliasResult.candidate.endpoint, data912Symbol: aliasResult.candidate.symbol,
        reason: aliasResult.note ? `Alias manual: ${aliasResult.note}` : "Resuelto por alias manual.",
        confidence: "HIGH",
      };
    }
    return {
      ...base, ok: false, source: "ALIAS", endpoint: aliasResult.candidate.endpoint, data912Symbol: aliasResult.candidate.symbol,
      reason: "Hay un alias configurado para este ticker, pero el símbolo no aparece en el snapshot actual de Data912.",
      confidence: "LOW",
    };
  }

  const candidates = applyRuleBasedCandidates(input);
  for (const candidate of candidates) {
    const quote = findQuoteInSnapshot(snapshots, candidate.endpoint, candidate.symbol);
    if (quote) {
      // CEDEAR con sufijo D (regla 3) y ON_USD vía arg_bonds (fallback de
      // regla 5) tienen una excepción real confirmada en la misma categoría
      // (YPFD y BDC33 respectivamente) -> confianza media, no alta.
      const isLowerConfidenceRule =
        (input.category === "CEDEAR" && endsWith(input.bygTicker, "D") && candidate.endpoint === "arg_cedears") ||
        (input.category === "ON_USD" && candidate.endpoint === "arg_bonds") ||
        (input.category === "CEDEAR" && endsWith(input.bygTicker, ".BA"));
      return {
        ...base, ok: true, source: "RULE", endpoint: candidate.endpoint, data912Symbol: candidate.symbol,
        reason: `Resuelto por regla automática (categoría ${input.category}).`,
        confidence: isLowerConfidenceRule ? "MEDIUM" : "HIGH",
      };
    }
  }

  if (candidates.length === 0) {
    return {
      ...base, ok: false, source: "NOT_FOUND", endpoint: null, data912Symbol: null,
      reason: "La categoría no tiene una regla automática definida todavía (o el caso es ambiguo sin monedaPrecio) y no hay alias configurado.",
      confidence: "NONE",
    };
  }

  return {
    ...base, ok: false, source: "NOT_FOUND", endpoint: null, data912Symbol: null,
    reason: "Se probaron las reglas automáticas pero el símbolo no aparece en ningún snapshot de Data912.",
    confidence: "NONE",
  };
}

/**
 * Resuelve una lista de tickers en lote. Nunca lanza por ítem individual.
 */
export function resolveManyTickersForData912(
  inputs: TickerResolveInput[],
  snapshots: Data912FetchAllResult,
  aliases?: PriceTickerAliasInput[],
): TickerResolveResult[] {
  return inputs.map((input) => resolveTickerForData912(input, snapshots, aliases));
}
