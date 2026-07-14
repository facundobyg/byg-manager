export type BolsaExcelOpBase =
  | "COMPRA"
  | "VENTA"
  | "CAUCION_COLOCADORA"
  | "CAUCION_TOMADORA"
  | "DESCONOCIDA";

export type BolsaMonedaDetectada = "ARS" | "USD";

export interface BolsaExcelColumnMapping {
  operacion?: string;
  fecha?: string;
  ticker?: string;
  cantidad?: string;
  precio?: string;
  montoNeto?: string;
  plazo?: string;
  vencimiento?: string;
  tasa?: string;
  montoCobrar?: string;
  montoPagar?: string;
}

export interface BolsaExcelRawOp {
  numeroFila: number;
  rawCells: Record<string, unknown>;
  rawOperacion: string;
  operacionBase: BolsaExcelOpBase;
  fechaConcertacion: string | null;
  ticker: string | null;
  cantidad: string | null;
  precio: string | null;
  monedaDetectada: BolsaMonedaDetectada | null;
  monedaEsInferencia: boolean;
  montoNetoReferencia: string | null;
  plazo: string | null;
  plazoNormalizado: string | null;
  fechaVencimiento: string | null;
  tasaCaucion: string | null;
  montoCobrarReferencia: string | null;
  montoPagarReferencia: string | null;
  instrumentoHint: string | null;
  warnings: string[];
  errors: string[];
}

export interface BolsaExcelBloque {
  numeroBloque: number;
  filaInicio: number;
  filaFin: number;
  nombreDetectado: string | null;
  nroComitenteDetectado: string | null;
  encabezadosDetectados: string[];
  columnMapping: BolsaExcelColumnMapping;
  operaciones: BolsaExcelRawOp[];
  warnings: string[];
  errors: string[];
}

export interface BolsaExcelParseResult {
  hojaProceada: string;
  hojasNoVacias: number;
  bloques: BolsaExcelBloque[];
  operaciones: BolsaExcelRawOp[];
  warningsGlobales: string[];
  erroresGlobales: string[];
  estadisticas: {
    totalBloques: number;
    totalOperaciones: number;
    totalCompras: number;
    totalVentas: number;
    totalCauciones: number;
    totalDesconocidas: number;
    totalWarnings: number;
    totalErrors: number;
    bloquesSinComitente: number;
    operacionesSinComitente: number;
  };
}

export interface BolsaExcelParseOptions {
  sheetName?: string;
  fallbackFechaOperativa?: string;
}
