// Tipos del parser de "Reporte de Tenencia Valorizada" (Bind Inversiones).
// Puro — sin dependencias de Prisma/DB. Ver Módulo 4.12A/4.12B (Sesión 12)
// para el análisis y las decisiones de negocio detrás de estos campos.

export type BindSectionType =
  | "CASH_USD_CABLE"
  | "CASH_USD_MEP"
  | "CASH_ARS"
  | "EQUITY_SECTION_MIXED"
  | "CEDEAR"
  | "BOND"
  | "FCI"
  | "CAUCION_ALERT"
  | "UNKNOWN_SECTION";

// "Moneda nativa" de la posición — no necesariamente la moneda del Importe,
// que en este reporte siempre viene valorizado en ARS (confirmado en 4.12A).
export type BindNativeCurrency = "ARS" | "USD" | "UNKNOWN";

export type BindInstrumentType =
  | "CASH"
  | "ACCION_ARS"
  | "ACCION_USD_ADR"
  | "CEDEAR"
  | "BONO"
  | "FCI"
  | "CAUCION"
  | "UNKNOWN";

export interface BindTenenciasRow {
  sectionName: string;
  ticker: string | null;
  brokerCode: string | null;
  descriptionRaw: string;
  descriptionClean: string;
  quote: number | null;
  saldoVencidoQuantity: number | null;
  saldoVencidoAmountARS: number | null;
  pending24AmountARS: number | null;
  pending48AmountARS: number | null;
  pendingFutureAmountARS: number | null;
  garantiaQuantity: number | null;
  garantiaAmountARS: number | null;
  // Derivados — nunca leídos directo del PDF, siempre calculados (ver reglas de 4.12B).
  totalQuantity: number | null;
  totalAmountARS: number | null;
  inferredInstrumentType: BindInstrumentType;
  inferredNativeCurrency: BindNativeCurrency;
  warnings: string[];
}

export interface BindTenenciasSection {
  name: string;
  normalizedType: BindSectionType;
  rows: BindTenenciasRow[];
  // Total impreso por el PDF al cierre de la sección (no el calculado).
  totalAmountARS: number | null;
}

export interface BindTenenciasParsedFile {
  fileName: string;
  reportDate: string | null;
  reportTime: string | null;
  accountNumber: string | null;
  accountName: string | null;
  pages: number;
  sections: BindTenenciasSection[];
  totals: {
    grandTotalAmountARS: number | null;
    computedGrandTotalAmountARS: number | null;
    matchesGrandTotal: boolean;
  };
  warnings: string[];
  errors: string[];
}
