// MACRO 6 — CUSTODIA FUERA DE LA BETA (decisión de negocio D).
//
// No está definida la semántica económica del traspaso BYG ↔ Custodia (compra por
// cuenta y orden / venta-cesión / salida sin contraprestación). Hasta definirla,
// TODA mutación que mueva activos propios ↔ Custodia se rechaza en el servidor.
// La custodia existente queda en SOLO LECTURA y sigue excluida del PN propio.
//
// Deuda post-Beta: "Definir semántica económica del traspaso BYG ↔ Custodia antes
// de rehabilitar mutaciones" (+ locks, reversa idempotente, costo, contrapartida).

export const MENSAJE_CUSTODIA_BLOQUEADA =
  "Las transferencias de activos a Custodia están temporalmente deshabilitadas durante la Beta.";

/** true mientras las mutaciones de custodia estén fuera de alcance (Beta). */
export function custodiaMutacionesBloqueadas(): boolean {
  return true;
}

/** Guard server-side: devuelve el error a retornar, o null si la mutación está habilitada. */
export function denegarMutacionCustodia(): { error: string } | null {
  return custodiaMutacionesBloqueadas() ? { error: MENSAJE_CUSTODIA_BLOQUEADA } : null;
}
