import type { BolsaExcelOpBase, BolsaMonedaDetectada } from "./types";

export type NumberField = "cantidad" | "precio" | "monto" | "tasa";

export interface ParseArNumberResult {
  value: string | null;
  rawStr: string;
  warnings: string[];
}

// Campos críticos: fórmula sin cache → error bloqueante en la operación
const CRITICAL_NUMERIC_FIELDS: NumberField[] = ["cantidad", "precio", "tasa"];

// ── Celda cruda (para tests unitarios y parser interno) ──────────────────────

export interface RawCell {
  v?: unknown;
  f?: string;
  hasFormula: boolean;
  hasValue: boolean;
}

export interface CellInterpretResult {
  value: string | null;
  rawStr: string;
  formula: string | undefined;
  warnings: string[];
  errors: string[];
}

export interface TextCellResult {
  value: string | null;
  formula: string | undefined;
  warnings: string[];
  errors: string[];
}

/** Interpreta celda de texto (ticker, operacion, plazo). isCritical determina error vs warning en fórmula sin cache. */
export function interpretTextCell(
  cell: RawCell,
  field: string,
  isCritical: boolean
): TextCellResult {
  const formula = cell.f;
  if (cell.hasFormula && !cell.hasValue) {
    const msg = `Fórmula sin valor cacheado (${field}): =${formula ?? "?"}`;
    return {
      value: null,
      formula,
      warnings: isCritical ? [] : [msg],
      errors: isCritical ? [msg] : [],
    };
  }
  if (!cell.hasValue && !cell.hasFormula) {
    return { value: null, formula, warnings: [], errors: [] };
  }
  const str = cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : null;
  return { value: str || null, formula, warnings: [], errors: [] };
}

/** Interpreta celda de fecha (fecha de concertación, vencimiento). Fórmula sin cache → null + error (nunca usa fallback). */
export function interpretDateCell(
  cell: RawCell,
  field: string,
  fallback: string | null
): TextCellResult & { value: string | null } {
  const formula = cell.f;
  if (cell.hasFormula && !cell.hasValue) {
    // Fórmula sin cache: dato bloqueante. NO usar fallback ni heredar fecha.
    const msg = `Fórmula sin valor cacheado (${field}): =${formula ?? "?"}`;
    return { value: null, formula, warnings: [], errors: [msg] };
  }
  if (!cell.hasValue && !cell.hasFormula) {
    // Celda vacía sin fórmula: puede heredar fallback
    return { value: fallback, formula, warnings: [], errors: [] };
  }
  const parsed = parseArDate(cell.v);
  if (parsed) return { value: parsed, formula, warnings: [], errors: [] };
  return {
    value: fallback,
    formula,
    warnings: fallback
      ? [`Fecha no reconocida "${String(cell.v)}", usando fallback`]
      : [`No se pudo parsear la fecha: "${String(cell.v)}"`],
    errors: [],
  };
}

/**
 * Interpreta una celda numérica considerando fórmulas y ausencia de cache.
 * Exportada para tests unitarios directos (sin round-trip de xlsx).
 */
export function interpretNumericCell(
  cell: RawCell,
  field: NumberField
): CellInterpretResult {
  const formula = cell.f;
  const baseRaw = cell.hasValue && cell.v !== undefined && cell.v !== null
    ? String(cell.v)
    : formula ? `=${formula}` : "";

  if (cell.hasFormula && !cell.hasValue) {
    const msg = `Fórmula sin valor cacheado (${field}): =${formula ?? "?"}`;
    const isCritical = CRITICAL_NUMERIC_FIELDS.includes(field);
    return {
      value: null,
      rawStr: baseRaw,
      formula,
      warnings: isCritical ? [] : [msg],
      errors: isCritical ? [msg] : [],
    };
  }

  if (!cell.hasValue && !cell.hasFormula) {
    return { value: null, rawStr: "", formula, warnings: [], errors: [] };
  }

  const rawInput =
    typeof cell.v === "number"
      ? cell.v
      : String(cell.v ?? "");
  const parsed = parseArNumber(rawInput, field);

  return {
    value: parsed.value,
    rawStr: cell.hasFormula ? `=${formula} [→ ${parsed.rawStr}]` : parsed.rawStr,
    formula,
    warnings: parsed.warnings,
    errors: [],
  };
}

// ── Number parsing ────────────────────────────────────────────────────────────

function trimTrailingZeros(s: string): string {
  if (!s.includes(".")) return s;
  const trimmed = s.replace(/0+$/, "");
  return trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
}

function roundForField(value: number, field: NumberField): string {
  switch (field) {
    case "cantidad":
    case "precio":
      return trimTrailingZeros(value.toFixed(6));
    case "monto":
      return value.toFixed(2);
    case "tasa":
      return trimTrailingZeros(value.toFixed(4));
  }
}

export function parseArNumber(
  raw: string | number | null | undefined,
  field: NumberField
): ParseArNumberResult {
  if (raw === null || raw === undefined || raw === "") {
    return { value: null, rawStr: String(raw ?? ""), warnings: [] };
  }

  const rawStr = typeof raw === "number" ? String(raw) : raw;
  const warnings: string[] = [];

  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) {
      return { value: null, rawStr, warnings: [`Valor no finito: ${rawStr}`] };
    }
    return { value: roundForField(raw, field), rawStr, warnings };
  }

  const trimmed = raw.trim();
  if (!trimmed || !/[0-9]/.test(trimmed)) {
    return { value: null, rawStr: trimmed, warnings: [] };
  }

  // Detectar signo negativo: prefijo "-" o paréntesis "()"
  const negative =
    /^\(.*\)$/.test(trimmed) || /^-/.test(trimmed.replace(/[^-0-9.,]/g, "").trim());

  // Limpiar símbolos de moneda, espacios, %
  const cleaned = trimmed
    .replace(/[ARS$USD€\s%]/g, "")
    .replace(/[()]/g, "")
    .replace(/^-/, "");

  if (!cleaned || !/[0-9]/.test(cleaned)) {
    return { value: null, rawStr, warnings: [] };
  }

  let intStr: string;
  let decStr: string = "";

  if (cleaned.includes(",")) {
    // Formato AR: punto = miles, coma = decimal
    const commaIdx = cleaned.lastIndexOf(",");
    intStr = cleaned.slice(0, commaIdx).replace(/\./g, "");
    decStr = cleaned.slice(commaIdx + 1);
  } else if ((cleaned.match(/\./g) ?? []).length > 1) {
    // Múltiples puntos → todos son miles
    intStr = cleaned.replace(/\./g, "");
    decStr = "";
  } else if (cleaned.includes(".")) {
    // Punto único: ambigüedad resuelta por campo
    const dotIdx = cleaned.indexOf(".");
    const before = cleaned.slice(0, dotIdx);
    const after = cleaned.slice(dotIdx + 1);

    if (after.length === 3) {
      // Para cantidad y monto: probable separador de miles (16.480 → 16480)
      // Para precio y tasa: probable decimal (978.112 → 978.112)
      if (field === "cantidad" || field === "monto") {
        intStr = before + after;
        decStr = "";
        warnings.push(
          `Punto único con 3 decimales interpretado como separador de miles para "${field}": "${trimmed}" → ${intStr}`
        );
      } else {
        // precio / tasa: tratar como decimal
        intStr = before;
        decStr = after;
      }
    } else {
      // Longitud distinta de 3 → decimal
      intStr = before;
      decStr = after;
    }
  } else {
    intStr = cleaned;
    decStr = "";
  }

  const canonical = decStr ? `${intStr}.${decStr}` : intStr;
  const value = parseFloat(canonical);

  if (!Number.isFinite(value)) {
    return { value: null, rawStr, warnings: [`No se pudo parsear el número: "${trimmed}"`] };
  }

  const signed = negative ? -Math.abs(value) : value;
  return { value: roundForField(signed, field), rawStr, warnings };
}

// ── Date parsing ─────────────────────────────────────────────────────────────

export function excelSerialToISO(serial: number): string {
  // Época Excel: 1899-12-30 (contempla el bug del año 1900 bisiesto)
  const epoch = new Date(1899, 11, 30);
  const ms = epoch.getTime() + Math.round(serial) * 86400000;
  return dateToISO(new Date(ms));
}

function dateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseArDate(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;

  if (raw instanceof Date) {
    return !isNaN(raw.getTime()) ? dateToISO(raw) : null;
  }

  if (typeof raw === "number") {
    return raw > 1 && raw < 100000 ? excelSerialToISO(raw) : null;
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/);
    if (m) {
      const [, d, mo, yRaw] = m;
      const y = yRaw.length === 2 ? 2000 + parseInt(yRaw) : parseInt(yRaw);
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  return null;
}

// ── Plazo normalization ───────────────────────────────────────────────────────

export function normalizePlazo(raw: string): { raw: string; normalized: string | null } {
  const s = raw.trim();
  if (/^ci$|^contado\s*inmediato$/i.test(s)) return { raw: s, normalized: "CI" };
  if (/^24\s*(hs?\.?|horas?)$/i.test(s)) return { raw: s, normalized: "24HS" };
  if (/^48\s*(hs?\.?|horas?)$/i.test(s)) return { raw: s, normalized: "48HS" };
  if (/^72\s*(hs?\.?|horas?)$/i.test(s)) return { raw: s, normalized: "72HS" };
  return { raw: s, normalized: null };
}

// ── Moneda detection ─────────────────────────────────────────────────────────

export function detectMoneda(
  raw: string | null | undefined
): { moneda: BolsaMonedaDetectada | null; esInferencia: boolean } {
  if (!raw) return { moneda: null, esInferencia: false };
  const s = String(raw).trim();
  if (/\bARS\b/i.test(s) || /\$(?!\s*USD)/i.test(s) || /\bpesos?\b/i.test(s)) {
    return { moneda: "ARS", esInferencia: false };
  }
  if (/\bUSD\b/i.test(s) || /\bU\$S\b/i.test(s) || /\bdólares?\b/i.test(s)) {
    return { moneda: "USD", esInferencia: false };
  }
  return { moneda: null, esInferencia: false };
}

export function inferMonedaFromTicker(
  ticker: string | null
): { moneda: BolsaMonedaDetectada | null; esInferencia: boolean } {
  if (!ticker) return { moneda: null, esInferencia: false };
  if (/D$/i.test(ticker.trim())) return { moneda: "USD", esInferencia: true };
  return { moneda: null, esInferencia: false };
}

// ── Operation base normalization ──────────────────────────────────────────────

const OP_MAP: [RegExp, BolsaExcelOpBase][] = [
  [/cauci[oó]n\s*(col\.?|colocadora)/i, "CAUCION_COLOCADORA"],
  [/cauci[oó]n\s*(tom\.?|tomadora)/i, "CAUCION_TOMADORA"],
  [/\bcompra\b/i, "COMPRA"],
  [/\bventa\b/i, "VENTA"],
];

export function normalizeOpBase(raw: string): BolsaExcelOpBase {
  const s = raw.trim();
  for (const [pattern, base] of OP_MAP) {
    if (pattern.test(s)) return base;
  }
  return "DESCONOCIDA";
}

// ── Column header normalization ───────────────────────────────────────────────

const HEADER_CANONICAL: [RegExp, string][] = [
  [/^operaci[oó]n$/i, "operacion"],
  [/^tipo\s+de\s+operaci[oó]n$/i, "operacion"],
  [/^fecha\s*(conc\.?|concertaci[oó]n)?$/i, "fecha"],
  [/^(bono|ticker|especie|activo|instrumento|c[oó]digo)$/i, "ticker"],
  [/^(vn|v\.n\.|cantidad|nominal|nominales?)$/i, "cantidad"],
  [/^precio$/i, "precio"],
  [/^(monto\s*neto|neto|importe\s*neto|resultado)$/i, "montoNeto"],
  [/^plazo$/i, "plazo"],
  [/^(vencimiento|fecha\s*venc\.?|vto\.?)$/i, "vencimiento"],
  [/^(tasa|tasa\s*cauc\.?|tasa\s*%?)$/i, "tasa"],
  [/^monto\s*a?\s*cobrar$/i, "montoCobrar"],
  [/^monto\s*a?\s*pagar$/i, "montoPagar"],
];

export function normalizeHeaderCell(raw: string): string | null {
  const clean = raw.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  for (const [pattern, canonical] of HEADER_CANONICAL) {
    if (pattern.test(clean)) return canonical;
  }
  return null;
}
