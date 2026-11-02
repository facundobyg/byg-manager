// MACRO 2 — Contrato COMÚN de calidad para toda cifra financiera del motor.
//
//   EXACT       → totalUSD válido.
//   APPROXIMATE → totalUSD válido pero aproximado (p. ej. TC de otra fecha ≤31 días).
//   INCOMPLETE  → totalUSD = null. Puede informarse knownSubtotalUSD (lo calculable
//                 con datos conocidos), que NUNCA es un total ni una utilidad final.
//
// La calidad agregada es la PEOR de sus dependencias. Se propaga motor → compat
// → pantallas → snapshot de cierre (JSON, sin schema nuevo).

export type Quality = "EXACT" | "APPROXIMATE" | "INCOMPLETE";

export type QualityReasonCode =
  | "TC_APPROXIMATE"
  | "TC_MISSING"
  | "FX_MISSING_COST_BASIS"
  | "ARBITRAGE_INCOMPLETE"
  | "CARTERA_MISSING_COST"
  | "MISSING_MARKET_PRICE"
  | "HISTORICAL_STATE_UNAVAILABLE"
  | "LEGACY_UNCLASSIFIED"
  | "OWNER_UNRESOLVED";

export interface QualityReason {
  code: QualityReasonCode;
  /** Calidad a la que degrada este motivo. */
  severity: Exclude<Quality, "EXACT">;
  detail: string;
}

export interface Calidad {
  quality: Quality;
  qualityReasons: QualityReason[];
  /** Subtotal calculable con lo conocido. Diagnóstico: NO es un total. */
  knownSubtotalUSD: number;
  /** null salvo EXACT / APPROXIMATE. */
  totalUSD: number | null;
}

const RANK: Record<Quality, number> = { EXACT: 0, APPROXIMATE: 1, INCOMPLETE: 2 };

export function peorCalidad(...qs: Quality[]): Quality {
  return qs.reduce<Quality>((a, b) => (RANK[b] > RANK[a] ? b : a), "EXACT");
}

export function calidadDe(reasons: readonly QualityReason[]): Quality {
  return peorCalidad(...reasons.map((r) => r.severity));
}

/** Arma el contrato: si la calidad es INCOMPLETE, totalUSD es null. */
export function construirCalidad(knownSubtotalUSD: number, reasons: readonly QualityReason[]): Calidad {
  const quality = calidadDe(reasons);
  return {
    quality,
    qualityReasons: dedupeReasons(reasons),
    knownSubtotalUSD,
    totalUSD: quality === "INCOMPLETE" ? null : knownSubtotalUSD,
  };
}

/** Une motivos iguales (mismo código y detalle) conservando el orden. */
export function dedupeReasons(reasons: readonly QualityReason[]): QualityReason[] {
  const vistos = new Set<string>();
  const out: QualityReason[] = [];
  for (const r of reasons) {
    const k = `${r.code}|${r.detail}`;
    if (vistos.has(k)) continue;
    vistos.add(k);
    out.push(r);
  }
  return out;
}

/** Etiqueta mínima para pantallas. */
export function etiquetaCalidad(q: Quality): string {
  return q === "EXACT" ? "Exacto" : q === "APPROXIMATE" ? "Aproximado" : "Incompleto";
}

/**
 * Presentación de un total según su calidad (sin JSX, reutilizable y testeable).
 *   EXACT       → el total.
 *   APPROXIMATE → el total + nota "Aproximado".
 *   INCOMPLETE  → "Incompleto"; el subtotal conocido solo como nota PARCIAL / NO ES TOTAL.
 */
export function presentarTotal(
  c: Pick<Calidad, "quality" | "totalUSD" | "knownSubtotalUSD">,
  fmt: (n: number) => string,
): { principal: string; esTotal: boolean; nota: string | null } {
  if (c.quality === "INCOMPLETE" || c.totalUSD === null) {
    return { principal: "Incompleto", esTotal: false, nota: `Parcial conocido ${fmt(c.knownSubtotalUSD)} — NO es total` };
  }
  return { principal: fmt(c.totalUSD), esTotal: true, nota: c.quality === "APPROXIMATE" ? "Aproximado" : null };
}
