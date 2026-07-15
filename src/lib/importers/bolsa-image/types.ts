export type BolsaImageOpBase =
  | "COMPRA"
  | "VENTA"
  | "CAUCION_COLOCADORA"
  | "CAUCION_TOMADORA"
  | "DESCONOCIDA";

export interface BolsaImageRawOp {
  numeroFila: number;
  rawOperacion: string;
  operacionBase: BolsaImageOpBase;
  fechaConcertacion: string | null;
  ticker: string | null;
  cantidad: string | null;
  precio: string | null;
  monedaDetectada: "ARS" | "USD" | null;
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

export interface BolsaImageBloque {
  numeroBloque: number;
  nombreDetectado: string | null;
  nroComitenteDetectado: string | null;
  operaciones: BolsaImageRawOp[];
  warnings: string[];
  errors: string[];
}

export interface BolsaImageParseResult {
  bloques: BolsaImageBloque[];
  warningsGlobales: string[];
  erroresGlobales: string[];
  totalOperaciones: number;
}

export type BolsaImageMime = "image/jpeg" | "image/png";
