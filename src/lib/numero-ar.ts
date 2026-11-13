// P1-03B — Números en notación ARGENTINA (es-AR), estricta.
//
//   separador de miles  = "."   (grupos EXACTOS de 3 dígitos)
//   separador decimal   = ","
//
//   "30.088"      → 30088         "51.385"     → 51385
//   "1,707824"    → 1.707824      "1.234.567,5" → 1234567.5
//
// Reemplaza, para las cargas manuales de precio, al parser inseguro
// parseFloat(raw.replace(",", ".")) — que leía "51.385" como 51,385 y "1.707,82" como 1,707
// en silencio. Todo lo que no sea inequívocamente es-AR se RECHAZA (no se adivina):
//   "1.5" / "1.2345" (punto que no agrupa de a 3), "1,234,5", "1.234.5", "-5", "1e3",
//   "0.123" (grupo que empieza en 0), "12 345", "$100", "", más decimales que la escala.
//
// Funciones puras sobre strings (sin Decimal ni Number): sirven en server y en cliente.
// El server convierte el string canónico a Decimal; NUNCA a Number.

export class NumeroARError extends Error {}

export interface OpcionesNumeroAR {
  /** Nombre del campo para el mensaje de error. */
  campo?: string;
  /** Máximo de decimales admitidos (escala de la columna). Default 6. */
  maxDecimales?: number;
  /** Máximo de dígitos enteros (precisión − escala). Default 12 (Decimal(18,6)). */
  maxEnteros?: number;
}

const SIN_MILES = /^(\d+)(?:,(\d+))?$/;
const CON_MILES = /^([1-9]\d{0,2}(?:\.\d{3})+)(?:,(\d+))?$/;

/**
 * Valida un número es-AR y devuelve su forma CANÓNICA ("1234567.5": sin miles, punto
 * decimal, sin ceros superfluos a la izquierda). Lanza NumeroARError si es ambiguo/malformado.
 */
export function normalizarNumeroAR(raw: string | null | undefined, op: OpcionesNumeroAR = {}): string {
  const campo = op.campo ?? "valor";
  const maxDec = op.maxDecimales ?? 6;
  const maxEnt = op.maxEnteros ?? 12;
  const s = (raw ?? "").trim();
  if (s === "") throw new NumeroARError(`${campo}: vacío`);

  const m = SIN_MILES.exec(s) ?? CON_MILES.exec(s);
  if (!m) {
    throw new NumeroARError(
      `${campo}: "${s}" no es un número en formato argentino (miles con "." en grupos de 3, decimales con ","; ej. 51.385 o 1,707824)`,
    );
  }
  const entero = m[1].replace(/\./g, "").replace(/^0+(?=\d)/, "");
  const dec = m[2] ?? "";
  if (dec.length > maxDec) throw new NumeroARError(`${campo}: "${s}" tiene ${dec.length} decimales (máximo ${maxDec})`);
  if (entero.length > maxEnt) throw new NumeroARError(`${campo}: "${s}" excede el máximo de ${maxEnt} dígitos enteros`);
  return dec ? `${entero}.${dec}` : entero;
}

/**
 * Formatea un número CANÓNICO ("1234567.5", "-3.25", "51385") en es-AR ("1.234.567,5").
 * Opera sobre el string (sin pasar por Number): no pierde precisión.
 */
export function formatearNumeroAR(canonico: string, op: { minDecimales?: number } = {}): string {
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(canonico.trim());
  if (!m) return canonico;
  const [, signo, ent, decRaw = ""] = m;
  let dec = decRaw.replace(/0+$/, "");
  const min = op.minDecimales ?? 0;
  if (dec.length < min) dec = dec.padEnd(min, "0");
  const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${signo}${miles}${dec ? `,${dec}` : ""}`;
}

/** Fecha "YYYY-MM-DD" válida en el calendario (rechaza 2026-02-30, formatos libres, etc.). */
export function esFechaISOValida(s: string | null | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
