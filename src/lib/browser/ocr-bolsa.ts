import type { Worker as TesseractWorker } from "tesseract.js";
import type {
  BolsaImageRawOp,
  BolsaImageBloque,
  BolsaImageParseResult,
  BolsaImageOpBase,
} from "@/lib/importers/bolsa-image/types";
import {
  planGridFromGray,
  classifyTableHeader,
  trimColumnBandsToCount,
  trimBlankEdgeBands,
  CAUCION_COLUMN_ORDER,
  COMPRA_VENTA_COLUMN_ORDER,
  type GrayscaleGrid,
  type Band,
} from "./grid-detect";

export type { Worker as TesseractWorker } from "tesseract.js";

// ── Shared types (pure, no browser/Tesseract deps — used in tests) ─────────

export interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
}

type ColKey =
  | "OPERACION"
  | "FECHA"
  | "TICKER"
  | "CANTIDAD"
  | "PRECIO"
  | "MONTO"
  | "PLAZO"
  | "VTO"
  | "TASA"
  | "MONTO_INICIAL"
  | "MONTO_COBRAR_PAGAR";

type ColMap = Partial<Record<ColKey, { cx: number }>>;

// ── Column keyword patterns ────────────────────────────────────────────────

// FECHA y MONTO usan un patrón "empieza con" (no anclado al final) porque en
// tablas reales el OCR frecuentemente funde el encabezado de dos palabras con
// la siguiente ("FECHA CONC." → "FECHACONC.", "MONTO NETO" → "MONTONETO") por
// el kerning ajustado de la celda — el anclado exacto perdía la columna entera.
const COL_KEYWORDS: Array<{ key: ColKey; patterns: RegExp[] }> = [
  { key: "OPERACION", patterns: [/OPERACI/i, /^OPERAC$/i] },
  { key: "FECHA", patterns: [/^FECHA/i, /^FEC\.?$/i] },
  { key: "TICKER", patterns: [/^BONO$/i, /^TICKER$/i, /^INSTRUM/i, /^ESPECIE$/i] },
  { key: "CANTIDAD", patterns: [/^VN$/i, /^CANT\.?$/i, /^NOMINAL$/i, /^VN\.?$/i] },
  { key: "PRECIO", patterns: [/^PRECIO$/i, /^PX$/i] },
  { key: "MONTO", patterns: [/^MONTO/i, /^NETO$/i, /^IMPORTE$/i] },
  { key: "PLAZO", patterns: [/^PLAZO$/i, /^PLZO\.?$/i] },
  { key: "VTO", patterns: [/^VTO\.?$/i, /^VCTO\.?$/i, /^VENC\.?$/i, /^VCTO$/i] },
  { key: "TASA", patterns: [/^TASA$/i, /^TNA$/i, /^TASA\.?$/i] },
];

const IGNORED_PATTERNS = [
  /resultado\s*pesos/i,
  /resultado\s*usd/i,
  /tipo\s*de\s*cambio/i,
  /subtotal/i,
  /observaci[oó]n/i,
  /comisi[oó]n/i,
];

// ── Pure helpers ───────────────────────────────────────────────────────────

function yCenter(w: OcrWord): number {
  return (w.bbox.y0 + w.bbox.y1) / 2;
}

function xCenter(w: OcrWord): number {
  return (w.bbox.x0 + w.bbox.x1) / 2;
}

/**
 * Groups words into rows by Y proximity.
 * Words within rowGap pixels of each other's Y center form a row.
 */
export function groupWordsIntoRows(words: OcrWord[], rowGap = 10): OcrWord[][] {
  if (words.length === 0) return [];
  const sorted = [...words].sort((a, b) => yCenter(a) - yCenter(b));
  const rows: OcrWord[][] = [];
  let current: OcrWord[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevY = yCenter(current[current.length - 1]);
    if (yCenter(sorted[i]) - prevY <= rowGap) {
      current.push(sorted[i]);
    } else {
      rows.push(current.sort((a, b) => a.bbox.x0 - b.bbox.x0));
      current = [sorted[i]];
    }
  }
  rows.push(current.sort((a, b) => a.bbox.x0 - b.bbox.x0));
  return rows;
}

function buildColMapFromRow(row: OcrWord[]): { colMap: ColMap; hits: number } {
  const colMap: ColMap = {};
  let hits = 0;

  for (const word of row) {
    for (const { key, patterns } of COL_KEYWORDS) {
      if (patterns.some((p) => p.test(word.text))) {
        if (!(key in colMap)) {
          colMap[key] = { cx: xCenter(word) };
          hits++;
        }
        break;
      }
    }
  }

  return { colMap, hits };
}

/**
 * Cauciones print two distinct "MONTO" columns — "MONTO COL./TOM." (monto
 * colocado/tomado, the principal) and "MONTO A COBRAR/PAGAR" (settlement
 * amount incl. interest). The generic keyword matcher above only keeps the
 * first "MONTO" it sees, so the second one is invisible to it — leaving its
 * data column unmapped and at risk of bleeding into TASA or elsewhere.
 * This scans for MONTO-family header words and disambiguates each by the
 * qualifier words immediately to its right, stopping as soon as another
 * recognized column keyword appears so the bounding box never bleeds into
 * the next real column.
 */
function detectCaucionMontoColumns(
  row: OcrWord[],
): Partial<Record<"MONTO_INICIAL" | "MONTO_COBRAR_PAGAR", { cx: number }>> {
  const sorted = [...row].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  const result: Partial<Record<"MONTO_INICIAL" | "MONTO_COBRAR_PAGAR", { cx: number }>> = {};

  for (let i = 0; i < sorted.length; i++) {
    const word = sorted[i];
    if (!/^MONTO/i.test(word.text) && !/^(NETO|IMPORTE)$/i.test(word.text)) continue;

    const span = [word];
    let j = i + 1;
    while (j < sorted.length && span.length <= 2) {
      const next = sorted[j];
      // Una nueva palabra que arranca con "MONTO" es una SEGUNDA columna
      // monto (p.ej. caución con MONTO COL. y MONTO A COBRAR), nunca una
      // continuación del calificador — hay que cortar ahí. "NETO"/"IMPORTE"
      // sueltos sí matchean la clave MONTO pero son parte del mismo rótulo
      // ("MONTO NETO"), así que esos no cortan el span.
      const startsNewMonto = /^MONTO/i.test(next.text);
      const isOtherKeyword =
        startsNewMonto ||
        COL_KEYWORDS.some(({ key, patterns }) => key !== "MONTO" && patterns.some((p) => p.test(next.text)));
      if (isOtherKeyword) break;
      span.push(next);
      j++;
    }

    // El calificador puede venir en palabras separadas ("MONTO" + "COL.") o
    // fundido en la misma palabra por el OCR ("MONTOCOL.") — se busca en todo
    // el span, incluida la propia palabra "MONTO".
    const qualifierText = span
      .map((w) => w.text)
      .join(" ")
      .toUpperCase();
    const x0 = Math.min(...span.map((w) => w.bbox.x0));
    const x1 = Math.max(...span.map((w) => w.bbox.x1));
    const cx = (x0 + x1) / 2;

    if (/COL|TOM/.test(qualifierText) && !result.MONTO_INICIAL) {
      result.MONTO_INICIAL = { cx };
    } else if (/COBRAR|PAGAR/.test(qualifierText) && !result.MONTO_COBRAR_PAGAR) {
      result.MONTO_COBRAR_PAGAR = { cx };
    }
  }

  return result;
}

/**
 * Detects if a row is a table header (3+ recognized column keywords).
 * Returns the column map or null.
 */
export function detectTableHeader(row: OcrWord[]): ColMap | null {
  const { colMap, hits } = buildColMapFromRow(row);
  if (hits < 3) return null;
  const merged: ColMap = { ...colMap, ...detectCaucionMontoColumns(row) };

  // Inferencia posicional de VTO/TASA: en cauciones reales el OCR a veces no
  // logra leer esas dos palabras de encabezado en absoluto (celda ilegible),
  // aunque sí reconoce OPERACION/FECHA/MONTO_INICIAL/MONTO_COBRAR_PAGAR. Se
  // asume el orden estándar de la tabla — OPERACION | FECHA | VTO | MONTO
  // COL./TOM. | TASA | MONTO A COBRAR/PAGAR — y se ubica cada columna faltante
  // en el punto medio entre sus dos vecinas ya conocidas.
  if (merged.FECHA && merged.MONTO_INICIAL && merged.MONTO_COBRAR_PAGAR) {
    if (!merged.VTO) {
      merged.VTO = { cx: (merged.FECHA.cx + merged.MONTO_INICIAL.cx) / 2 };
    }
    if (!merged.TASA) {
      merged.TASA = { cx: (merged.MONTO_INICIAL.cx + merged.MONTO_COBRAR_PAGAR.cx) / 2 };
    }
  }

  return merged;
}

/**
 * Merges consecutive rows that each carry a few header keywords but not
 * enough alone to qualify (e.g. a header printed across two text lines).
 * Only merges when the combined hits reach the header threshold.
 */
function mergeVerticalHeaderRows(rows: OcrWord[][]): OcrWord[][] {
  const result: OcrWord[][] = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    const { hits } = buildColMapFromRow(row);
    // Una fila ignorada (p.ej. "Tipo de cambio Neto" — "Neto" matchea la
    // keyword MONTO) nunca debe fusionarse con el encabezado siguiente: si se
    // fusionara, el texto "tipo de cambio" seguiría estando en la fila
    // resultante y isIgnoredRow() la descartaría entera — destruyendo el
    // encabezado real que iba pegado.
    if (hits > 0 && hits < 3 && i + 1 < rows.length && !isIgnoredRow(row)) {
      const merged = [...row, ...rows[i + 1]];
      const { hits: mergedHits } = buildColMapFromRow(merged);
      if (mergedHits >= 3) {
        result.push(merged);
        i += 2;
        continue;
      }
    }
    result.push(row);
    i++;
  }
  return result;
}

/**
 * Detects a comitente name+number in a row.
 * Looks for a 5–6 digit number alongside name text.
 * Returns null if no comitente pattern found.
 */
export function detectComitenteInRow(
  row: OcrWord[],
): { nombre: string | null; numero: string | null } | null {
  const text = row.map((w) => w.text).join(" ");
  const numMatch = text.match(/\b(\d{5,6})\b/);
  if (!numMatch) return null;

  const numero = numMatch[1];
  const nombre = text
    .replace(numMatch[0], "")
    .replace(/[\/\-_|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { nombre: nombre.length >= 2 ? nombre : null, numero };
}

/**
 * Returns true if this row should be skipped entirely
 * (subtotals, results, exchange rates, etc.).
 */
export function isIgnoredRow(row: OcrWord[]): boolean {
  const text = row.map((w) => w.text).join(" ");
  return IGNORED_PATTERNS.some((p) => p.test(text));
}

/**
 * Parses an Argentine-formatted number ("1.234.567,89") into a standard
 * numeric string.  Returns null if the string can't be parsed as a number.
 */
export function parseArgNumber(s: string): string | null {
  if (!s) return null;
  // La tasa de caución real viene como "22,90%" — el % es ruido alrededor
  // del valor, igual que "$", nunca parte de la cantidad.
  const clean = s.replace(/[\$%]/g, "").replace(/\s/g, "").trim();
  if (!clean) return null;

  // Argentine thousands+decimal: "1.234.567,89" or "1.234,56"
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(clean)) {
    return clean.replace(/\./g, "").replace(",", ".");
  }
  // Argentine integer with thousands: "1.234.567"
  if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
    return clean.replace(/\./g, "");
  }
  // Already standard decimal or bare integer
  if (/^\d+(\.\d+)?$/.test(clean)) return clean;

  return null;
}

/**
 * Detects the currency straight from a monto cell's raw text — "USD" marks
 * dollars, "$" marks pesos. Never inferred from the ticker or any other
 * column. Returns null when the cell has neither marker.
 */
export function detectMonedaFromText(s: string): "ARS" | "USD" | null {
  if (/USD/i.test(s)) return "USD";
  if (/\$/.test(s)) return "ARS";
  return null;
}

/**
 * Parses a date in DD/MM/YYYY, DD-MM-YYYY, DD-MM-YY, or YYYY-MM-DD to ISO
 * YYYY-MM-DD. Bolsa boletas real-world use a 2-digit year ("14-07-26" for
 * 2026-07-14) — assumed 20XX since these are always recent operations.
 */
export function parseDate(s: string): string | null {
  // ISO primero: "2024-07-10" contiene la subcadena "24-07-10", que la regex
  // DD-MM-YY de abajo matchearía mal (día 24, año 2010) si se probara antes.
  const trimmed = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // \b evita matchear en medio de una tira de dígitos más larga (como la del
  // ISO de arriba). El año va primero como \d{4} en la alternancia: la regex
  // prueba las alternativas en orden, así que \d{2}|\d{4} truncaría "2024" a "20".
  const m = s.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}|\d{2})\b/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${mo}-${d}`;
  }
  return null;
}

function normalizePlazoOcr(s: string | null): string | null {
  if (!s) return null;
  const u = s.trim().toUpperCase();
  if (/^CI$|^CONTADO/.test(u)) return "CI";
  if (/^24\s*H/.test(u)) return "24HS";
  if (/^48\s*H/.test(u)) return "48HS";
  if (/^72\s*H/.test(u)) return "72HS";
  if (/^\d+$/.test(u)) return u; // caución days
  return s.trim();
}

// Decimal(8,4) column capacity in BolsaImportFila.tasaCaucion — 4 integer
// digits + 4 decimals. Anything beyond this can only be a misassigned monto,
// never a real caución rate, so it must be rejected before it reaches Prisma.
const TASA_CAUCION_MAX = 9999.9999;

function isTasaCaucionValid(value: string): boolean {
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= TASA_CAUCION_MAX;
}

function detectOpBase(text: string): BolsaImageOpBase {
  const t = text.toUpperCase();
  if (/COMPRA/.test(t)) return "COMPRA";
  if (/VENTA/.test(t)) return "VENTA";
  const isCaucion = /CAUCI/.test(t) || /\bCAUC\b/.test(t);
  if (isCaucion) {
    if (/COLOC/.test(t)) return "CAUCION_COLOCADORA";
    if (/\bTOM/.test(t)) return "CAUCION_TOMADORA";
    return "CAUCION_COLOCADORA";
  }
  return "DESCONOCIDA";
}

/**
 * True when a row's own text starts an operation directly — COMPRA, VENTA,
 * CAUCION COLOCADORA or CAUCION TOMADORA — regardless of whether a table
 * header/column map was ever detected above it.
 */
function isOpCandidateRow(row: OcrWord[]): boolean {
  const text = row.map((w) => w.text).join(" ");
  return detectOpBase(text) !== "DESCONOCIDA";
}

// Vocabulario de operación/columna que nunca puede aparecer en un encabezado
// de comitente real — si aparece, la fila es una fila de datos (probablemente
// corrupta por el OCR) y su número no es un nroComitente.
const COMITENTE_EXCLUDED_WORDS =
  /\b(COMPRA|VENTA|CAUCI|COLOC|TOM|BONO|VN|PRECIO|MONTO|NETO|PLAZO|TASA|USD|ARS|OPERACI[OÓ]N?|COBRAR|PAGAR|COL)\b/i;

/**
 * Valida que una fila corta sea realmente un encabezado de comitente
 * ("NOMBRE NUMERO") y no una fila de datos financieros corrupta que por
 * casualidad contiene una tira de 5-6 dígitos (un monto sin separadores, un
 * ticker pegado a una cantidad, etc.). Un encabezado de comitente real:
 *   - nunca es una fila de operación, de encabezado de tabla, o ignorada;
 *   - nunca lleva vocabulario de columna/operación (COMPRA, MONTO, TASA...);
 *   - nunca lleva un número con separador decimal (precio/cantidad/monto/tasa
 *     argentinos siempre llevan "," o "." pegado a un dígito; un nroComitente
 *     nunca);
 *   - el texto restante tras quitar el número debe ser puramente alfabético
 *     (un nombre real, no un fragmento de ticker+dígito como "GGAL 5").
 */
function isValidComitenteRow(row: OcrWord[]): { nombre: string; numero: string } | null {
  if (row.length === 0 || row.length > 5) return null;
  if (isOpCandidateRow(row)) return null;
  if (isIgnoredRow(row)) return null;

  const text = row.map((w) => w.text).join(" ");
  if (COMITENTE_EXCLUDED_WORDS.test(text)) return null;
  if (/\d[.,]\d/.test(text)) return null;

  const found = detectComitenteInRow(row);
  if (!found || !found.nombre || !found.numero) return null;
  if (!/^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/.test(found.nombre)) return null;
  if (found.nombre.replace(/\s/g, "").length < 3) return null;

  return { nombre: found.nombre, numero: found.numero };
}

/**
 * Compara la posición X de las palabras de una fila contra las columnas de un
 * mapa ya conocido. Un mapa geométricamente ajeno (p.ej. el de una tabla de
 * caución — solo OPERACION/FECHA/MONTO_INICIAL/MONTO_COBRAR_PAGAR — reusado
 * para una fila de compra/venta con TICKER/CANTIDAD/PRECIO) hace que la
 * mayoría de las palabras de la fila queden lejos de cualquier columna
 * conocida. Exige que al menos la mitad caigan dentro de una tolerancia
 * razonable antes de permitir la reutilización.
 */
function isColMapCompatibleWithRow(colMap: ColMap, row: OcrWord[]): boolean {
  const centers = Object.values(colMap)
    .filter((c): c is { cx: number } => c !== undefined)
    .map((c) => c.cx);
  if (centers.length === 0 || row.length === 0) return false;

  const TOLERANCE = 80;
  const matched = row.filter((word) => {
    const cx = xCenter(word);
    return centers.some((c) => Math.abs(cx - c) <= TOLERANCE);
  }).length;

  return matched / row.length >= 0.5;
}

const FALLBACK_COLUMN_ORDER: ColKey[] = [
  "FECHA",
  "TICKER",
  "CANTIDAD",
  "PRECIO",
  "MONTO",
  "PLAZO",
  "VTO",
  "TASA",
];

/**
 * Builds a best-effort column map straight from one row's own word
 * positions, for when no table header (real or reconstructed) is
 * available at all. The leading COMPRA/VENTA/CAUCION [COLOCADORA|TOMADORA]
 * words become OPERACION; the rest are assigned left-to-right following
 * the conventional bolsa column order.
 */
function positionalColMapFromRow(row: OcrWord[]): ColMap {
  const sorted = [...row].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  const colMap: ColMap = {};

  let idx = 0;
  const opWords: OcrWord[] = [];
  while (idx < sorted.length && /COMPRA|VENTA|CAUCI|COLOC|^TOM/i.test(sorted[idx].text)) {
    opWords.push(sorted[idx]);
    idx++;
  }
  if (opWords.length > 0) {
    colMap.OPERACION = { cx: xCenter(opWords[0]) };
  }

  for (let orderIdx = 0; idx < sorted.length && orderIdx < FALLBACK_COLUMN_ORDER.length; idx++, orderIdx++) {
    colMap[FALLBACK_COLUMN_ORDER[orderIdx]] = { cx: xCenter(sorted[idx]) };
  }

  return colMap;
}

function assignToColumn(word: OcrWord, colMap: ColMap): ColKey | null {
  const cx = xCenter(word);
  let best: ColKey | null = null;
  let bestDist = Infinity;
  for (const [key, bounds] of Object.entries(colMap) as [ColKey, { cx: number }][]) {
    const dist = Math.abs(cx - bounds.cx);
    if (dist < bestDist) {
      bestDist = dist;
      best = key;
    }
  }
  return best;
}

/**
 * Parses one row of OCR words into a BolsaImageRawOp using the column map.
 */
export function parseDataRow(
  row: OcrWord[],
  colMap: ColMap,
  rowNum: number,
): BolsaImageRawOp {
  const cols: Partial<Record<ColKey, string[]>> = {};

  for (const word of row) {
    if (word.confidence < 40) continue;
    const key = assignToColumn(word, colMap);
    if (key) {
      cols[key] = [...(cols[key] ?? []), word.text];
    }
  }

  const get = (k: ColKey): string => (cols[k] ?? []).join(" ").trim();

  const operacionText = get("OPERACION");
  const tickerText = get("TICKER");
  const rawOperacion = [operacionText, tickerText].filter(Boolean).join(" ") || operacionText;
  const operacionBase = detectOpBase(operacionText || rawOperacion);

  const fechaRaw = get("FECHA");
  const allRowText = row.map((w) => w.text).join(" ");
  const fechaConcertacion =
    parseDate(fechaRaw) ??
    (() => {
      const m = allRowText.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}|\d{2})\b/);
      return m ? parseDate(m[0]) : null;
    })();

  const tickerUpper = tickerText.toUpperCase();
  const tickerMatch = tickerUpper.match(/\b([A-Z][A-Z0-9]{1,5})\b/);
  const ticker = tickerMatch ? tickerMatch[1] : null;

  const plazoRaw = get("PLAZO") || null;
  const plazoNorm = normalizePlazoOcr(plazoRaw);

  const isCaucion = operacionBase === "CAUCION_COLOCADORA" || operacionBase === "CAUCION_TOMADORA";

  // Cauciones report their principal under "MONTO COL./TOM." rather than the
  // CANTIDAD column used by compra/venta — fall back to CANTIDAD when the
  // dedicated column wasn't detected (e.g. older/simpler caución layouts).
  const montoInicialText = get("MONTO_INICIAL");
  const cantidad = parseArgNumber(isCaucion && montoInicialText ? montoInicialText : get("CANTIDAD"));

  const montoCobrarPagarText = get("MONTO_COBRAR_PAGAR");
  const montoCobrarPagarValue = isCaucion ? parseArgNumber(montoCobrarPagarText) : null;

  // La moneda se lee de la celda de monto misma ("$" → ARS, "USD" → USD),
  // nunca inferida del ticker ni de otra columna.
  const monedaDetectada =
    detectMonedaFromText(get("MONTO")) ??
    detectMonedaFromText(montoInicialText) ??
    detectMonedaFromText(montoCobrarPagarText);

  const errors: string[] = [];
  if (!fechaConcertacion) errors.push("Fecha no detectada.");
  if (operacionBase === "DESCONOCIDA") errors.push("Tipo de operación no reconocido.");
  // Compra/venta sin ticker legible: la fila se conserva igual en staging con
  // ticker=null (nunca se descarta) para que pueda corregirse manualmente
  // desde la revisión del lote — el error bloqueante marca su estado ERROR.
  if ((operacionBase === "COMPRA" || operacionBase === "VENTA") && !ticker) {
    errors.push("Ticker no detectado.");
  }

  // Never let a stray monto (or any corrupted/out-of-range value) reach
  // Prisma's Decimal(8,4) tasaCaucion column — null it out and flag the row.
  let tasaCaucion = parseArgNumber(get("TASA"));
  if (tasaCaucion !== null && !isTasaCaucionValid(tasaCaucion)) {
    errors.push("Tasa de caución fuera de rango válido.");
    tasaCaucion = null;
  }

  return {
    numeroFila: rowNum,
    rawOperacion,
    operacionBase,
    fechaConcertacion,
    ticker,
    cantidad,
    precio: parseArgNumber(get("PRECIO")),
    monedaDetectada,
    montoNetoReferencia: parseArgNumber(get("MONTO")),
    plazo: plazoRaw,
    plazoNormalizado: plazoNorm,
    fechaVencimiento: parseDate(get("VTO")),
    tasaCaucion,
    montoCobrarReferencia: operacionBase === "CAUCION_COLOCADORA" ? montoCobrarPagarValue : null,
    montoPagarReferencia: operacionBase === "CAUCION_TOMADORA" ? montoCobrarPagarValue : null,
    instrumentoHint: null,
    warnings: [],
    errors,
  };
}

// ── Grid mode (E4.6C) — lectura por celda, sin agrupar por proximidad ──────
//
// A diferencia de parseDataRow (que arma una fila juntando palabras sueltas
// por cercanía X a un colMap), en modo GRID cada celda ya viene OCR'd por
// separado según su banda de columna real (ver grid-detect.ts) — así que acá
// no hace falta agrupar nada: cada campo llega directo en su propia clave.
// Nunca se infiere una columna por cercanía entre palabras de filas
// distintas; la geometría de la grilla ya resolvió eso.

export interface GridCellTexts {
  OPERACION?: string;
  FECHA_CONC?: string;
  TICKER?: string;
  CANTIDAD?: string;
  PRECIO?: string;
  MONTO?: string;
  PLAZO?: string;
  VTO?: string;
  TASA?: string;
  MONTO_INICIAL?: string;
  MONTO_COBRAR_PAGAR?: string;
}

/**
 * Construye una operación a partir de las celdas ya recortadas y OCR'd de una
 * fila de grilla. Reutiliza exactamente las mismas reglas de negocio que
 * parseDataRow (parseo de fecha/número, detección de moneda, validación de
 * tasa, error de ticker faltante) — la única diferencia es el origen del
 * texto por campo.
 */
export function buildOpFromGridRow(cells: GridCellTexts, rowNum: number): BolsaImageRawOp {
  const operacionText = (cells.OPERACION ?? "").trim();
  const tickerText = (cells.TICKER ?? "").trim();
  const rawOperacion = [operacionText, tickerText].filter(Boolean).join(" ") || operacionText;
  const operacionBase = detectOpBase(operacionText || rawOperacion);

  const fechaConcertacion = parseDate(cells.FECHA_CONC ?? "");

  const tickerUpper = tickerText.toUpperCase();
  const tickerMatch = tickerUpper.match(/\b([A-Z][A-Z0-9]{1,5})\b/);
  const ticker = tickerMatch ? tickerMatch[1] : null;

  const plazoRaw = cells.PLAZO?.trim() || null;
  const plazoNorm = normalizePlazoOcr(plazoRaw);

  const isCaucion = operacionBase === "CAUCION_COLOCADORA" || operacionBase === "CAUCION_TOMADORA";

  const montoInicialText = cells.MONTO_INICIAL ?? "";
  const cantidad = parseArgNumber(isCaucion && montoInicialText ? montoInicialText : (cells.CANTIDAD ?? ""));

  const montoCobrarPagarText = cells.MONTO_COBRAR_PAGAR ?? "";
  const montoCobrarPagarValue = isCaucion ? parseArgNumber(montoCobrarPagarText) : null;

  const monedaDetectada =
    detectMonedaFromText(cells.MONTO ?? "") ??
    detectMonedaFromText(montoInicialText) ??
    detectMonedaFromText(montoCobrarPagarText);

  const errors: string[] = [];
  if (!fechaConcertacion) errors.push("Fecha no detectada.");
  if (operacionBase === "DESCONOCIDA") errors.push("Tipo de operación no reconocido.");
  if ((operacionBase === "COMPRA" || operacionBase === "VENTA") && !ticker) {
    errors.push("Ticker no detectado.");
  }

  let tasaCaucion = parseArgNumber(cells.TASA ?? "");
  if (tasaCaucion !== null && !isTasaCaucionValid(tasaCaucion)) {
    errors.push("Tasa de caución fuera de rango válido.");
    tasaCaucion = null;
  }

  return {
    numeroFila: rowNum,
    rawOperacion,
    operacionBase,
    fechaConcertacion,
    ticker,
    cantidad,
    precio: parseArgNumber(cells.PRECIO ?? ""),
    monedaDetectada,
    montoNetoReferencia: parseArgNumber(cells.MONTO ?? ""),
    plazo: plazoRaw,
    plazoNormalizado: plazoNorm,
    fechaVencimiento: parseDate(cells.VTO ?? ""),
    tasaCaucion,
    montoCobrarReferencia: operacionBase === "CAUCION_COLOCADORA" ? montoCobrarPagarValue : null,
    montoPagarReferencia: operacionBase === "CAUCION_TOMADORA" ? montoCobrarPagarValue : null,
    instrumentoHint: null,
    warnings: [],
    errors,
  };
}

/**
 * Extrae "NOMBRE NUMERO" de un único texto OCR'd (el encabezado del
 * comitente, leído como una sola celda por encima de la primera tabla) — el
 * comitente solo se toma de esta franja, nunca de una fila financiera.
 */
export function parseComitenteHeaderText(text: string): { nombre: string; numero: string } | null {
  const numMatch = text.match(/\b(\d{5,6})\b/);
  if (!numMatch) return null;

  const numero = numMatch[1];
  const nombre = text
    .replace(numMatch[0], "")
    .replace(/[\/\-_|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return nombre.length >= 2 ? { nombre, numero } : null;
}

/**
 * Reconstructs bolsa blocks from a flat array of OCR words with bounding boxes.
 * Pure function — no browser or Tesseract dependencies.
 */
export function reconstructBolsaBlocks(words: OcrWord[]): BolsaImageBloque[] {
  const filtered = words.filter((w) => w.confidence >= 30 && w.text.trim().length > 0);
  const rows = mergeVerticalHeaderRows(groupWordsIntoRows(filtered));

  const blocks: BolsaImageBloque[] = [];
  let currentNombre: string | null = null;
  let currentNumero: string | null = null;
  let currentColMap: ColMap | null = null;
  // Last column map derived from a real (or reconstructed) header — reused
  // as a fallback for later tables under the same comitente whose header
  // is missing or unreadable.
  let lastGoodColMap: ColMap | null = null;
  let currentOps: BolsaImageRawOp[] = [];
  let blockCount = 0;
  let rowNum = 0;

  function flushBlock() {
    if (currentOps.length > 0 || currentColMap !== null) {
      blocks.push({
        numeroBloque: blockCount + 1,
        nombreDetectado: currentNombre,
        nroComitenteDetectado: currentNumero,
        operaciones: currentOps,
        warnings: [],
        errors: [],
      });
      blockCount++;
    }
    currentOps = [];
    currentColMap = null;
  }

  for (const row of rows) {
    if (row.length === 0) continue;
    if (isIgnoredRow(row)) continue;

    // Table header takes highest priority
    const header = detectTableHeader(row);
    if (header) {
      if (currentColMap !== null && currentOps.length > 0) flushBlock();
      currentColMap = header;
      lastGoodColMap = header;
      rowNum = 0;
      continue;
    }

    // Comitente header: a short, clean "NOMBRE NUMERO" row — never a data row
    // that happens to carry a 5-6 digit substring (ver isValidComitenteRow).
    // Mientras no aparezca un encabezado fuerte y válido, el comitente activo
    // se mantiene sin cambios (nunca se resetea por una fila corrupta).
    const comitente = isValidComitenteRow(row);
    if (comitente) {
      if (currentOps.length > 0) flushBlock();
      currentNombre = comitente.nombre;
      currentNumero = comitente.numero;
      currentColMap = null;
      rowNum = 0;
      continue;
    }

    // Data row under a known column map — solo se convierte en operación si
    // la fila realmente empieza/contiene COMPRA, VENTA o CAUCION. Una fila sin
    // tipo reconocible (ruido de OCR) nunca se persiste como fantasma.
    if (currentColMap !== null) {
      if (isOpCandidateRow(row)) {
        rowNum++;
        currentOps.push(parseDataRow(row, currentColMap, rowNum));
      }
      continue;
    }

    // No column map yet (missing/unreadable header) — a row that starts a
    // COMPRA/VENTA/CAUCION operation directly is still a valid candidate.
    if (isOpCandidateRow(row)) {
      rowNum++;
      if (lastGoodColMap !== null && isColMapCompatibleWithRow(lastGoodColMap, row)) {
        // A real header was found earlier AND its column geometry actually
        // matches this row's word positions — safe to reuse across tables.
        currentColMap = lastGoodColMap;
        currentOps.push(parseDataRow(row, currentColMap, rowNum));
      } else {
        // No real header available, or the last one belongs to a
        // structurally different table (e.g. a caución's OPERACION/FECHA/
        // MONTO_INICIAL/MONTO_COBRAR_PAGAR reused for a compra/venta row) —
        // build a one-off positional guess from THIS row's own word
        // positions instead. This must NOT be cached as currentColMap/
        // lastGoodColMap: it only reflects where this row's own words happen
        // to sit, and a differently-shaped row reused under it would have
        // its dates/montos misassigned by nearest-x distance entirely.
        currentOps.push(parseDataRow(row, positionalColMapFromRow(row), rowNum));
      }
    }
  }

  flushBlock();
  return blocks;
}

// ── OCR word extraction — pure, testable ──────────────────────────────────────

/**
 * Minimal Page shape needed by extractOcrWords — a subset of Tesseract.Page.
 * Exported so tests can build mock pages without importing tesseract.js.
 */
export interface OcrPage {
  blocks: Array<{
    paragraphs: Array<{
      lines: Array<{
        words: Array<{
          text: string;
          confidence: number;
          bbox: { x0: number; y0: number; x1: number; y1: number };
        }>;
      }>;
    }>;
  }> | null;
  text: string;
  tsv: string | null;
}

/**
 * Parses Tesseract TSV output into OcrWord[].
 * TSV columns (tab-separated, header on first line):
 *   level page_num block_num par_num line_num word_num left top width height conf text
 * Level 5 = word; conf < 0 = non-word structural row.
 */
function wordsFromTsv(tsv: string): OcrWord[] {
  const words: OcrWord[] = [];
  const lines = tsv.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split("\t");
    if (parts.length < 12) continue;
    if (parseInt(parts[0], 10) !== 5) continue;
    const conf = parseFloat(parts[10]);
    if (conf < 0) continue;
    const text = parts.slice(11).join("\t").trim();
    if (!text) continue;
    const left = parseInt(parts[6], 10);
    const top = parseInt(parts[7], 10);
    const width = parseInt(parts[8], 10);
    const height = parseInt(parts[9], 10);
    words.push({
      text,
      confidence: conf,
      bbox: { x0: left, y0: top, x1: left + width, y1: top + height },
    });
  }
  return words;
}

/**
 * Extracts OcrWord[] from a Tesseract page result.
 * Primary source: data.blocks (full bbox per word).
 * Fallback: data.tsv (also contains bbox per word).
 * Returns [] if neither is available — caller should validate.
 */
export function extractOcrWords(page: OcrPage): OcrWord[] {
  if (page.blocks && page.blocks.length > 0) {
    const words = page.blocks.flatMap((block) =>
      block.paragraphs.flatMap((para) =>
        para.lines.flatMap((line) =>
          line.words.map((w) => ({
            text: w.text,
            confidence: w.confidence,
            bbox: w.bbox,
          })),
        ),
      ),
    );
    if (words.length > 0) return words;
  }
  if (page.tsv) return wordsFromTsv(page.tsv);
  return [];
}

// ── Browser-dependent functions ─────────────────────────────────────────────

/**
 * Preprocesses an image for OCR:
 * - scales to optimal resolution (min 1200px, max 2400px on long side)
 * - converts to greyscale with contrast enhancement
 */
export async function preprocessImageForOcr(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => {
      URL.revokeObjectURL(url);
      resolve(el);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen."));
    };
    el.src = url;
  });

  // Bumped from 2400/1200 after a real dry-run: at ~1200px Tesseract fuses
  // tightly-kerned two-word headers ("FECHA CONC." → "FECHACONC.") and drops
  // whole cells (a VTO date read as empty); at ~2600-4000px those separate
  // and read correctly.
  const MAX_DIM = 3600;
  const MIN_DIM = 2600;
  let tw = img.naturalWidth;
  let th = img.naturalHeight;
  const longSide = Math.max(tw, th);

  if (longSide > MAX_DIM) {
    const ratio = MAX_DIM / longSide;
    tw = Math.round(tw * ratio);
    th = Math.round(th * ratio);
  } else if (longSide < MIN_DIM) {
    const ratio = MIN_DIM / longSide;
    tw = Math.round(tw * ratio);
    th = Math.round(th * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible.");

  ctx.drawImage(img, 0, 0, tw, th);

  // Greyscale + contrast stretch [40, 220] → [0, 255]
  const imageData = ctx.getImageData(0, 0, tw, th);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const contrasted = Math.max(0, Math.min(255, ((lum - 40) / 180) * 255));
    d[i] = d[i + 1] = d[i + 2] = contrasted;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

/**
 * Creates a reusable Tesseract worker (spa+eng).
 * Call `worker.terminate()` after processing the whole batch.
 *
 * Assets servidos desde el mismo origen (/tesseract/) para evitar dependencias
 * de CDN externas en producción. Los archivos se copian vía postinstall
 * (scripts/copy-tesseract-public.mjs → public/tesseract/).
 */
export async function createOcrWorker(): Promise<TesseractWorker> {
  const { createWorker } = await import("tesseract.js");
  return createWorker(["spa", "eng"], 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract",
    langPath: "/tesseract/lang-data",
    workerBlobURL: false,
    gzip: true,
  });
}

/**
 * OCR genérico de página completa (modo GENERIC_OCR) — el pipeline original,
 * ahora usado solo como fallback cuando el modo GRID no logra detectar una
 * grilla de tabla válida en la imagen.
 *
 * @param onProgress - callback con uno de:
 *   "Preparando imagen" | "Leyendo texto" | "Armando operaciones"
 */
export async function ocrBolsaImageGeneric(
  file: File,
  worker: TesseractWorker,
  onProgress: (msg: string) => void,
): Promise<BolsaImageParseResult> {
  onProgress("Preparando imagen");
  const canvas = await preprocessImageForOcr(file);

  onProgress("Leyendo texto");
  // Request blocks+tsv explicitly — in v7 these are null unless asked for.
  const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true, tsv: true });

  onProgress("Armando operaciones");
  const ocrWords = extractOcrWords(data as OcrPage);

  if (ocrWords.length === 0) {
    const hasText = data.text?.trim().length > 0;
    if (hasText) {
      throw new Error(
        "El OCR leyó texto, pero no pudo reconstruir la tabla (sin coordenadas de palabras). Intentá con una imagen más nítida.",
      );
    }
    throw new Error(
      "El OCR no encontró texto en la imagen. Verificá que sea una imagen clara del detalle de operaciones.",
    );
  }

  const bloques = reconstructBolsaBlocks(ocrWords);
  const totalOperaciones = bloques.reduce((s, b) => s + b.operaciones.length, 0);

  if (totalOperaciones === 0) {
    throw new Error(
      "El OCR procesó la imagen pero no detectó operaciones de bolsa. Verificá que la imagen corresponda a un detalle de operaciones con encabezado de tabla visible.",
    );
  }

  return { bloques, warningsGlobales: [], erroresGlobales: [], totalOperaciones, modo: "GENERIC_OCR" };
}

// ── Grid mode (E4.6C) — Canvas + OCR por celda ──────────────────────────────

const TESS_PSM_SINGLE_LINE = "7";
const TESS_PSM_SINGLE_WORD = "8";
const TESS_PSM_SPARSE_TEXT = "11";

// Letras que efectivamente aparecen en el vocabulario de operación —
// COMPRA/VENTA/CAUCION/COLOCADORA/TOMADORA/COL./TOM. — más espacio y punto
// para las abreviaturas. Restringir el whitelist a esto reduce falsos
// reconocimientos frente a un alfabeto completo.
const WHITELIST_OPERACION = "ACDEILMNOPRTUV. ";
const WHITELIST_FECHA = "0123456789-/";
const WHITELIST_NUMERICO = "0123456789,.$%";
const WHITELIST_TICKER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/";
const WHITELIST_COMITENTE = "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ0123456789 ";
const WHITELIST_HEADER = "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ./ ";

function fieldWhitelist(field: string): string {
  switch (field) {
    case "OPERACION":
      return WHITELIST_OPERACION;
    case "FECHA_CONC":
    case "VTO":
      return WHITELIST_FECHA;
    case "TICKER":
      return WHITELIST_TICKER;
    case "PLAZO":
      return WHITELIST_OPERACION + "0123456789";
    default:
      return WHITELIST_NUMERICO;
  }
}

/** Carga la imagen a su resolución NATIVA (sin upscale) — el upscale global
 * emborrona las líneas finas de la grilla; el modo GRID necesita la
 * resolución original para detectarlas, y solo escala cada celda recortada. */
async function loadOriginalCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => {
      URL.revokeObjectURL(url);
      resolve(el);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen."));
    };
    el.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible.");
  ctx.drawImage(img, 0, 0);
  return canvas;
}

function grayscaleGridFromCanvas(canvas: HTMLCanvasElement): GrayscaleGrid {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible.");
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }
  return { data: gray, width, height };
}

function cropCanvasRegion(
  source: HTMLCanvasElement,
  rect: { x0: number; y0: number; x1: number; y1: number },
  upscale: number,
): HTMLCanvasElement {
  const w = Math.max(1, rect.x1 - rect.x0);
  const h = Math.max(1, rect.y1 - rect.y0);
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(w * upscale));
  out.height = Math.max(1, Math.round(h * upscale));
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible.");
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, rect.x0, rect.y0, w, h, 0, 0, out.width, out.height);
  return out;
}

async function ocrCellText(
  worker: TesseractWorker,
  cellCanvas: HTMLCanvasElement,
  whitelist: string,
  psm: string,
): Promise<string> {
  await worker.setParameters({
    tessedit_char_whitelist: whitelist,
    tessedit_pageseg_mode: psm as never,
  });
  const { data } = await worker.recognize(cellCanvas, {}, { text: true });
  return (data.text ?? "").trim();
}

/**
 * Modo principal (E4.6C): detecta la grilla visual de la tabla (líneas
 * horizontales/verticales vía proyección de píxeles) y lee cada celda por
 * separado con Tesseract — nunca agrupa palabras por cercanía entre filas
 * distintas. Devuelve null cuando la imagen no tiene líneas suficientes para
 * reconstruir al menos una tabla válida; la llamadora cae al OCR genérico.
 */
export async function ocrBolsaImageGrid(
  file: File,
  worker: TesseractWorker,
  onProgress: (msg: string) => void,
): Promise<BolsaImageParseResult | null> {
  onProgress("Detectando grilla");
  const canvas = await loadOriginalCanvas(file);
  const gray = grayscaleGridFromCanvas(canvas);
  const plan = planGridFromGray(gray);
  if (!plan) return null;

  onProgress("Leyendo encabezado de comitente");
  const headerCanvas = cropCanvasRegion(
    canvas,
    { x0: 0, y0: Math.max(0, plan.comitenteHeaderBand.start), x1: gray.width, y1: plan.comitenteHeaderBand.end },
    3,
  );
  const comitenteText = await ocrCellText(worker, headerCanvas, WHITELIST_COMITENTE, TESS_PSM_SINGLE_LINE);
  const comitente = parseComitenteHeaderText(comitenteText);

  const bloques: BolsaImageBloque[] = [];

  const ocrHeaderBand = (band: Band) =>
    ocrCellText(
      worker,
      cropCanvasRegion(canvas, { x0: 0, y0: band.start, x1: gray.width, y1: band.end }, 2),
      WHITELIST_HEADER,
      TESS_PSM_SINGLE_LINE,
    );

  for (const table of plan.tables) {
    onProgress("Leyendo tabla");
    let headerBand = table.headerBand;
    let dataRowBands = table.dataRowBands;
    let headerText = await ocrHeaderBand(headerBand);
    let kind = classifyTableHeader([headerText]);

    // Una banda vacía (espacio en blanco entre el borde de cierre de la tabla
    // anterior y el borde de apertura de esta, sin línea de separación
    // suficientemente grande entre ambas) a veces queda asignada como si
    // fuera el encabezado — el OCR sobre una celda casi en blanco puede
    // alucinar 1-2 caracteres de ruido, así que un texto muy corto cuenta
    // igual como "sin encabezado real". Se prueba la banda siguiente antes
    // de descartar la tabla entera.
    if (kind === "DESCONOCIDA" && headerText.trim().length <= 4 && dataRowBands.length > 0) {
      headerBand = dataRowBands[0];
      dataRowBands = dataRowBands.slice(1);
      headerText = await ocrHeaderBand(headerBand);
      kind = classifyTableHeader([headerText]);
    }

    // Tabla no clasificable (encabezado ilegible o ninguna palabra clave
    // reconocida) — nunca se inventan operaciones sin saber qué columnas son.
    if (kind === "DESCONOCIDA") continue;

    const columnOrder = kind === "CAUCION" ? CAUCION_COLUMN_ORDER : COMPRA_VENTA_COLUMN_ORDER;
    // CAUCION comparte la grilla física con las tablas de compra/venta pero
    // tiene menos columnas reales — el margen sobrante a recortar puede ser
    // TAN ANCHO O MÁS que una columna real (nunca el más angosto), así que un
    // recorte por ancho puro elegiría el lado equivocado. Se decide por
    // contenido real (tinta) en cada extremo en vez de por ancho.
    // COMPRA/VENTA: el margen sobrante sí es angosto — el recorte por ancho
    // ya alcanza.
    const rowBandsForInk = dataRowBands.length > 0 ? dataRowBands : [headerBand];
    const columnBands =
      kind === "CAUCION"
        ? trimBlankEdgeBands(table.columnBands, gray, rowBandsForInk, columnOrder.length)
        : trimColumnBandsToCount(table.columnBands, columnOrder.length);
    const ops: BolsaImageRawOp[] = [];
    let rowNum = 0;

    for (const rowBand of dataRowBands) {
      const cells: GridCellTexts = {};
      const lastCol = Math.min(columnOrder.length, columnBands.length);
      for (let colIdx = 0; colIdx < lastCol; colIdx++) {
        const field = columnOrder[colIdx];
        const colBand = columnBands[colIdx];
        const cellCanvas = cropCanvasRegion(
          canvas,
          { x0: colBand.start, y0: rowBand.start, x1: colBand.end, y1: rowBand.end },
          3,
        );
        const whitelist = fieldWhitelist(field);
        const psm = field === "OPERACION" ? TESS_PSM_SINGLE_LINE : TESS_PSM_SINGLE_WORD;
        cells[field as keyof GridCellTexts] = await ocrCellText(worker, cellCanvas, whitelist, psm);
      }

      // "Tipo de cambio Neto", "Resultado pesos/USD" y subtotales a veces
      // viven en su propia caja con borde (detectada geométricamente como una
      // fila de datos más) — nunca se convierten en operación, a diferencia
      // de una fila real con datos ilegibles, que sí se conserva.
      const rowText = Object.values(cells).join(" ");
      if (IGNORED_PATTERNS.some((p) => p.test(rowText))) continue;

      // Cada fila visual real detectada por la grilla se conserva siempre —
      // si falta un dato, el campo queda null con su error puntual, nunca se
      // descarta la fila.
      rowNum++;
      ops.push(buildOpFromGridRow(cells, rowNum));
    }

    bloques.push({
      numeroBloque: bloques.length + 1,
      nombreDetectado: comitente?.nombre ?? null,
      nroComitenteDetectado: comitente?.numero ?? null,
      operaciones: ops,
      warnings: [],
      errors: [],
    });
  }

  const totalOperaciones = bloques.reduce((s, b) => s + b.operaciones.length, 0);
  if (totalOperaciones === 0) return null;

  return { bloques, warningsGlobales: [], erroresGlobales: [], totalOperaciones, modo: "GRID" };
}

/**
 * OCRs a single image using the provided worker.
 * The image is NOT sent to any server — all processing is local.
 *
 * Modo principal: lectura por grilla visual (GRID). Si la imagen no tiene
 * líneas de tabla suficientes para reconstruir una grilla válida, cae al OCR
 * genérico de página completa (GENERIC_OCR) — el resultado siempre indica
 * `modo` para que quede trazado qué motor produjo el staging.
 *
 * @param onProgress - callback con mensajes de progreso.
 */
export async function ocrBolsaImage(
  file: File,
  worker: TesseractWorker,
  onProgress: (msg: string) => void,
): Promise<BolsaImageParseResult> {
  const gridResult = await ocrBolsaImageGrid(file, worker, onProgress).catch(() => null);
  if (gridResult) return gridResult;

  return ocrBolsaImageGeneric(file, worker, onProgress);
}
