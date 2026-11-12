// P1-03A.1 — FECHA DE NEGOCIO (día calendario en Argentina).
//
// BYG opera en Argentina: un hecho "del día" (p. ej. la vigencia de un TC) pertenece al
// día calendario de America/Argentina/Buenos_Aires en que ocurrió, NO al día UTC del
// servidor (Vercel corre en UTC: después de las 21:00 ART el día UTC ya es el siguiente).
//
// Se deriva con Intl (zona IANA), nunca restando horas a mano: no depende del TZ del
// proceso ni de supuestos sobre el offset.

export const ZONA_NEGOCIO = "America/Argentina/Buenos_Aires";

const formateador = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_NEGOCIO, year: "numeric", month: "2-digit", day: "2-digit",
});

/** Día calendario en Argentina del instante dado, como "YYYY-MM-DD". */
export function fechaNegocio(instante: Date = new Date()): string {
  if (Number.isNaN(instante.getTime())) throw new Error("fechaNegocio: instante inválido");
  const p = Object.fromEntries(formateador.formatToParts(instante).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Mismo día de negocio como Date a medianoche UTC: la representación que Prisma usa
 * para columnas @db.Date (p. ej. TipoCambio.fecha).
 */
export function fechaNegocioDate(instante: Date = new Date()): Date {
  return new Date(`${fechaNegocio(instante)}T00:00:00.000Z`);
}
