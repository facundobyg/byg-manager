// MACRO 2 — Motor financiero canónico: tipos compartidos.
//
// Todo el motor trabaja en MONEDA NATIVA (Montos por moneda) y consolida a USD
// con el TC de la fecha que corresponda (hecho para resultado, corte para PN).
// Ningún monto se convierte 1:1 entre monedas distintas.

import { Decimal } from "@prisma/client/runtime/library";

export const MONEDAS = ["ARS", "USD", "EUR", "BRL"] as const;
export type Moneda = (typeof MONEDAS)[number];

export type Montos = Record<Moneda, Decimal>;

export const D = (v: Decimal.Value | null | undefined): Decimal => new Decimal(v ?? 0);

export function montosVacios(): Montos {
  return { ARS: new Decimal(0), USD: new Decimal(0), EUR: new Decimal(0), BRL: new Decimal(0) };
}

export function sumarMonto(m: Montos, moneda: Moneda, v: Decimal.Value): void {
  m[moneda] = m[moneda].plus(D(v));
}

export function sumarMontos(a: Montos, b: Montos, signo = 1): Montos {
  const out = montosVacios();
  for (const k of MONEDAS) out[k] = a[k].plus(b[k].mul(signo));
  return out;
}

export function montosANumero(m: Montos): Record<Moneda, number> {
  return { ARS: m.ARS.toNumber(), USD: m.USD.toNumber(), EUR: m.EUR.toNumber(), BRL: m.BRL.toNumber() };
}

export function esMoneda(v: string): v is Moneda {
  return (MONEDAS as readonly string[]).includes(v);
}

/** Fecha económica normalizada "YYYY-MM-DD" (UTC, como @db.Date). */
export function fechaISO(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/** Rango [desde, hasta) de un mes "YYYY-MM". */
export function rangoMes(mes: string): { desde: string; hasta: string } {
  if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error(`Mes inválido: ${mes}`);
  const [y, m] = mes.split("-").map(Number);
  const desde = `${y}-${String(m).padStart(2, "0")}-01`;
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return { desde, hasta: `${ny}-${String(nm).padStart(2, "0")}-01` };
}

/** Último día de un mes "YYYY-MM" (corte de cierre). */
export function ultimoDiaMes(mes: string): string {
  const { hasta } = rangoMes(mes);
  const d = new Date(`${hasta}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return fechaISO(d);
}
