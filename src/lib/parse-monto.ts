import { Decimal } from "@prisma/client/runtime/library";

// Parser ESTRICTO de montos ingresados por el usuario (MACRO 1 / H1).
//
// Acepta solo decimales simples no negativos: "123", "123.45", "123,45".
// Rechaza todo lo que distintos parsers interpretan distinto (hex "0x10",
// binario "0b101", octal "0o17", exponentes "1e3", separadores "1_000",
// espacios internos, signos, Infinity/NaN). Así la autorización y la escritura
// operan sobre EL MISMO valor canónico.

const MONTO_RE = /^\d+(\.\d+)?$/;

export type MontoParse =
  | { ok: true; value: Decimal | null } // null = campo vacío
  | { ok: false };

export function parseMontoEstricto(raw: FormDataEntryValue | string | null | undefined): MontoParse {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw !== "string") return { ok: false };
  const s = raw.trim();
  if (s === "") return { ok: true, value: null };
  const normalizado = s.replace(",", ".");
  if (!MONTO_RE.test(normalizado)) return { ok: false };
  return { ok: true, value: new Decimal(normalizado) };
}

export interface LiquidacionPorCaja {
  cajaId: string;
  div: Decimal;
  /** Monto ARS explícito; null = calcular div × TC. */
  ars: Decimal | null;
}

/**
 * Lee del FormData los montos por caja con claves `${prefix}${cajaId}_div` /
 * `${prefix}${cajaId}_ars`. Devuelve SOLO las cajas con div > 0. Cualquier
 * valor no vacío que no sea un decimal estricto invalida todo el formulario.
 */
export function leerLiquidacionesPorCaja(
  formData: FormData,
  prefix: string,
): { ok: true; items: LiquidacionPorCaja[] } | { ok: false; error: string } {
  const escapado = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const divRe = new RegExp(`^${escapado}(.+)_div$`);
  const items: LiquidacionPorCaja[] = [];
  const vistos = new Set<string>();

  for (const [key, raw] of Array.from(formData.entries())) {
    const m = divRe.exec(key);
    if (!m) continue;
    const cajaId = m[1];
    if (vistos.has(cajaId)) return { ok: false, error: "Monto de caja duplicado en el formulario" };
    vistos.add(cajaId);

    const div = parseMontoEstricto(raw);
    if (!div.ok) return { ok: false, error: "Monto inválido: usá solo números (ej. 1500 o 1500,50)" };
    if (div.value === null || div.value.lte(0)) continue;

    const ars = parseMontoEstricto(formData.get(`${prefix}${cajaId}_ars`));
    if (!ars.ok) return { ok: false, error: "Monto ARS inválido: usá solo números (ej. 1500 o 1500,50)" };

    items.push({ cajaId, div: div.value, ars: ars.value && ars.value.gt(0) ? ars.value : null });
  }
  return { ok: true, items };
}
