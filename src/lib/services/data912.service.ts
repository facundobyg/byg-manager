// Cliente aislado de Data912 (data912.com) — solo lectura de mercado.
// No escribe en DB, no aplica matching/alias todavía (eso es de un módulo
// posterior). Si un endpoint falla, no afecta a los demás ni rompe el caller.

const DATA912_BASE_URL = "https://data912.com";
const DEFAULT_TIMEOUT_MS = 8_000;

export type Data912EndpointKey =
  | "arg_bonds"
  | "arg_corp"
  | "arg_stocks"
  | "arg_cedears"
  | "usa_stocks"
  | "usa_adrs"
  | "arg_notes";

const ENDPOINT_PATHS: Record<Data912EndpointKey, string> = {
  arg_bonds:   "/live/arg_bonds",
  arg_corp:    "/live/arg_corp",
  arg_stocks:  "/live/arg_stocks",
  arg_cedears: "/live/arg_cedears",
  usa_stocks:  "/live/usa_stocks",
  usa_adrs:    "/live/usa_adrs",
  arg_notes:   "/live/arg_notes",
};

const ALL_ENDPOINTS: Data912EndpointKey[] = [
  "arg_bonds", "arg_corp", "arg_stocks", "arg_cedears", "usa_stocks", "usa_adrs", "arg_notes",
];

// Shape real confirmado en Módulo 4.1 contra los 7 endpoints — sin moneda,
// sin timestamp propio.
export interface Data912RawQuote {
  symbol:      string;
  q_bid:       number | null;
  px_bid:      number | null;
  px_ask:      number | null;
  q_ask:       number | null;
  v:           number | null;
  q_op:        number | null;
  c:           number | null;
  pct_change:  number | null;
}

export type InferredCurrency = "ARS" | "USD" | null;

export interface Data912NormalizedQuote {
  endpoint:           Data912EndpointKey;
  symbol:             string;
  price:              number | null; // viene de "c" (cierre/referencia)
  bid:                number | null;
  ask:                number | null;
  volume:             number | null;
  operationsQuantity: number | null;
  pctChange:          number | null;
  inferredCurrency:   InferredCurrency;
}

export interface Data912EndpointResult {
  endpoint:  Data912EndpointKey;
  ok:        boolean;
  quotes:    Data912NormalizedQuote[];
  fetchedAt: Date;
  error?:    string;
}

export interface Data912FetchAllResult {
  fetchedAt:    Date;
  results:      Record<Data912EndpointKey, Data912EndpointResult>;
  okCount:      number;
  failedCount:  number;
}

export interface FetchData912Options {
  timeoutMs?: number;
}

function endsWithD(symbol: string): boolean {
  return symbol.trim().toUpperCase().endsWith("D");
}

// Excepciones confirmadas: el sufijo "D" en BYMA generalmente indica la
// variante dólar/MEP del mismo instrumento (AL30 vs AL30D), pero para
// algunas acciones en arg_stocks la "D" es parte del ticker real de la
// empresa (clase de acción), no un sufijo de moneda. Confirmado con datos
// reales: YPFD es la acción Clase D de YPF y cotiza en pesos, no dólares.
const ARG_STOCKS_D_NO_ES_DOLAR: ReadonlySet<string> = new Set(["YPFD"]);

// Reglas confirmadas con datos reales en Módulo 4.1 (matriz de matching).
// arg_notes queda en null a propósito: ningún ticker de BYG matcheó ese
// endpoint todavía, así que la moneda real nunca se confirmó con evidencia.
function inferCurrency(endpoint: Data912EndpointKey, symbol: string): InferredCurrency {
  switch (endpoint) {
    case "arg_stocks": {
      const upper = symbol.trim().toUpperCase();
      if (ARG_STOCKS_D_NO_ES_DOLAR.has(upper)) return "ARS";
      return endsWithD(upper) ? "USD" : "ARS";
    }
    case "arg_bonds":
    case "arg_corp":
      // El sufijo "D" en BYMA distingue la variante dólar/MEP de la variante
      // peso del mismo instrumento (confirmado con AL30/AL30D, GD30/GD30D).
      return endsWithD(symbol) ? "USD" : "ARS";
    case "arg_cedears":
      // Confirmado: MELI, META, TSLA, etc. cotizan en pesos en este endpoint.
      return "ARS";
    case "usa_stocks":
    case "usa_adrs":
      return "USD";
    case "arg_notes":
      return null;
  }
}

function isValidRawQuote(item: unknown): item is Data912RawQuote {
  if (typeof item !== "object" || item === null) return false;
  const q = item as Record<string, unknown>;
  if (typeof q.symbol !== "string" || q.symbol.trim() === "") return false;

  const numericOrNullish = (v: unknown) => v === null || v === undefined || typeof v === "number";
  return (
    numericOrNullish(q.q_bid) &&
    numericOrNullish(q.px_bid) &&
    numericOrNullish(q.px_ask) &&
    numericOrNullish(q.q_ask) &&
    numericOrNullish(q.v) &&
    numericOrNullish(q.q_op) &&
    numericOrNullish(q.c) &&
    numericOrNullish(q.pct_change)
  );
}

function normalizeQuote(endpoint: Data912EndpointKey, raw: Data912RawQuote): Data912NormalizedQuote {
  return {
    endpoint,
    symbol:             raw.symbol,
    price:              raw.c ?? null,
    bid:                raw.px_bid ?? null,
    ask:                raw.px_ask ?? null,
    volume:             raw.v ?? null,
    operationsQuantity: raw.q_op ?? null,
    pctChange:          raw.pct_change ?? null,
    inferredCurrency:   inferCurrency(endpoint, raw.symbol),
  };
}

function isTimeoutOrAbort(err: unknown): boolean {
  return err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
}

/**
 * Descarga y normaliza un único endpoint de Data912. Nunca lanza — cualquier
 * falla (red, timeout, JSON inválido, shape inesperado) se devuelve como
 * `{ ok: false, error }` para que el caller decida qué hacer.
 */
export async function fetchData912Endpoint(
  endpointKey: Data912EndpointKey,
  options?: FetchData912Options,
): Promise<Data912EndpointResult> {
  const fetchedAt = new Date();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = `${DATA912_BASE_URL}${ENDPOINT_PATHS[endpointKey]}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return { endpoint: endpointKey, ok: false, quotes: [], fetchedAt, error: `HTTP ${res.status}` };
    }

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return { endpoint: endpointKey, ok: false, quotes: [], fetchedAt, error: "Respuesta no es JSON válido" };
    }

    if (!Array.isArray(body)) {
      return { endpoint: endpointKey, ok: false, quotes: [], fetchedAt, error: "Respuesta no es un array" };
    }

    const quotes = body.filter(isValidRawQuote).map((raw) => normalizeQuote(endpointKey, raw));
    return { endpoint: endpointKey, ok: true, quotes, fetchedAt };
  } catch (err) {
    const error = isTimeoutOrAbort(err)
      ? `Timeout tras ${timeoutMs}ms`
      : err instanceof Error
        ? err.message
        : "Error de red desconocido";
    return { endpoint: endpointKey, ok: false, quotes: [], fetchedAt, error };
  }
}

/**
 * Descarga los 7 endpoints en paralelo. Si alguno falla, los demás siguen
 * normalmente — nunca rechaza ni lanza a nivel global.
 */
export async function fetchAllData912Endpoints(
  options?: FetchData912Options,
): Promise<Data912FetchAllResult> {
  const fetchedAt = new Date();
  const settled = await Promise.allSettled(
    ALL_ENDPOINTS.map((key) => fetchData912Endpoint(key, options)),
  );

  const results = {} as Record<Data912EndpointKey, Data912EndpointResult>;
  let okCount = 0;
  let failedCount = 0;

  settled.forEach((settledResult, i) => {
    const key = ALL_ENDPOINTS[i];
    if (settledResult.status === "fulfilled") {
      results[key] = settledResult.value;
      if (settledResult.value.ok) okCount++; else failedCount++;
    } else {
      // fetchData912Endpoint ya atrapa todo internamente; esta rama es una
      // red de seguridad adicional, no se espera que se use en la práctica.
      results[key] = {
        endpoint: key,
        ok: false,
        quotes: [],
        fetchedAt,
        error: settledResult.reason instanceof Error ? settledResult.reason.message : "Error desconocido",
      };
      failedCount++;
    }
  });

  return { fetchedAt, results, okCount, failedCount };
}

/**
 * Búsqueda exacta (normalizada a upper/trim) dentro de un snapshot ya
 * descargado. No aplica reglas de matching ni alias — eso es de un módulo
 * posterior. Devuelve null si el endpoint falló o el símbolo no está.
 */
export function findQuoteInSnapshot(
  snapshot: Data912FetchAllResult,
  endpointKey: Data912EndpointKey,
  symbol: string,
): Data912NormalizedQuote | null {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const endpointResult = snapshot.results[endpointKey];
  if (!endpointResult || !endpointResult.ok) return null;
  return endpointResult.quotes.find((q) => q.symbol.trim().toUpperCase() === normalizedSymbol) ?? null;
}
