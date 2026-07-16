// Fecha operativa del lote de importación (Excel e imagen) — pura, sin
// dependencias de browser/Prisma, para que sea testeable directamente.

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fecha de hoy en el huso horario LOCAL, como "YYYY-MM-DD".
 * Usa el offset local para no correrse de día respecto de UTC.
 */
export function todayLocalISODate(date: Date = new Date()): string {
  const localMs = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(localMs).toISOString().slice(0, 10);
}

/**
 * Parsea y valida una fecha operativa recibida como string ("YYYY-MM-DD").
 * Devuelve `null` si falta, tiene formato inválido, o no es una fecha
 * calendario real (p.ej. "2026-13-40").
 */
export function parseFechaOperativa(raw: unknown): Date | null {
  if (typeof raw !== "string" || !ISO_DATE_RE.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Rechazar fechas que "desbordan" (ej. 2026-02-30 → new Date la corrige a marzo).
  if (d.toISOString().slice(0, 10) !== raw) return null;
  return d;
}

/** Convierte una fecha operativa ya validada de vuelta a "YYYY-MM-DD" (UTC). */
export function isoDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
