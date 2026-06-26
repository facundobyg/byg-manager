import type { BindInstrumentType, BindNativeCurrency, BindSectionType } from "./types";

/**
 * Parsea un número en formato es-AR ("1.477,0000", "$ 33.173,42", "-1237173,07").
 * Devuelve null si el string no contiene ningún dígito (celda vacía).
 */
export function parseEsArNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/\d/.test(trimmed)) return null;

  // El "-" puede venir después de un prefijo como "$ " (ej. "$ -938.527,52"),
  // así que no alcanza con mirar el primer caracter del string.
  const negative = trimmed.includes("-") || trimmed.includes("(");
  // Sacar símbolos de moneda y signos — el signo se vuelve a aplicar al final.
  const cleaned = trimmed.replace(/[^\d.,]/g, "");
  // es-AR: punto = separador de miles, coma = separador decimal.
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -Math.abs(value) : value;
}

// Nombres de sección tal como aparecen impresos en el PDF (case-sensitive,
// confirmado contra los 2 PDFs reales de 4.12A). Cualquier sección que no
// matchee cae en UNKNOWN_SECTION — nunca se inventa un tipo nuevo.
const SECTION_NAME_MAP: Record<string, BindSectionType> = {
  "Dolar Cable (exterior)": "CASH_USD_CABLE",
  "Dolar MEP (local)": "CASH_USD_MEP",
  Pesos: "CASH_ARS",
  Acciones: "EQUITY_SECTION_MIXED",
  Cedears: "CEDEAR",
  "Títulos Públicos": "BOND",
  FCI: "FCI",
  Cauciones: "CAUCION_ALERT",
  Caución: "CAUCION_ALERT",
};

export function normalizeSectionType(sectionName: string): BindSectionType {
  return SECTION_NAME_MAP[sectionName.trim()] ?? "UNKNOWN_SECTION";
}

export function isKnownSectionName(text: string): boolean {
  return text.trim() in SECTION_NAME_MAP;
}

export interface ParsedDenominacion {
  ticker: string | null;
  brokerCode: string | null;
  description: string;
  matched: boolean;
}

// "{TICKER} - {CODIGO} / {DESCRIPCION}". El ticker puede tener guion interno
// propio (BBD-US, SUPV-US) — el separador real es " - " (con espacios), así
// que no hay ambigüedad: la clase de caracteres del ticker no incluye espacio.
const DENOMINACION_PATTERN = /^([A-Z0-9.\-]+)\s+-\s+(\d+)\s*\/\s*(.*)$/;

export function parseDenominacion(firstLine: string): ParsedDenominacion {
  const match = DENOMINACION_PATTERN.exec(firstLine.trim());
  if (!match) {
    return { ticker: null, brokerCode: null, description: firstLine.trim(), matched: false };
  }
  return { ticker: match[1], brokerCode: match[2], description: match[3].trim(), matched: true };
}

/**
 * Inferencia SOLO para preview — nunca se usa para escribir nada ni para
 * resolver contra Data912 (eso es responsabilidad de un módulo posterior).
 */
export function inferInstrumentAndCurrency(
  sectionType: BindSectionType,
  ticker: string | null,
): { instrumentType: BindInstrumentType; nativeCurrency: BindNativeCurrency } {
  switch (sectionType) {
    case "CASH_USD_CABLE":
    case "CASH_USD_MEP":
      return { instrumentType: "CASH", nativeCurrency: "USD" };
    case "CASH_ARS":
      return { instrumentType: "CASH", nativeCurrency: "ARS" };
    case "CEDEAR":
      return { instrumentType: "CEDEAR", nativeCurrency: "ARS" };
    case "BOND":
      return { instrumentType: "BONO", nativeCurrency: "USD" };
    case "FCI":
      // Moneda real a confirmar por fila o manualmente — no inventar (4.12A regla 8).
      return { instrumentType: "FCI", nativeCurrency: "UNKNOWN" };
    case "CAUCION_ALERT":
      return { instrumentType: "CAUCION", nativeCurrency: "UNKNOWN" };
    case "EQUITY_SECTION_MIXED": {
      // La sección "Acciones" mezcla acciones locales en pesos con ADRs/
      // extranjeras en dólares — la única señal confiable hoy es el sufijo
      // "-US" (confirmado con BBD-US, EWZ-US, NU-US, SUPV-US en 4.12A).
      const isUsSuffixed = !!ticker && /-US$/i.test(ticker.trim());
      return isUsSuffixed
        ? { instrumentType: "ACCION_USD_ADR", nativeCurrency: "USD" }
        : { instrumentType: "ACCION_ARS", nativeCurrency: "ARS" };
    }
    case "UNKNOWN_SECTION":
    default:
      return { instrumentType: "UNKNOWN", nativeCurrency: "UNKNOWN" };
  }
}
