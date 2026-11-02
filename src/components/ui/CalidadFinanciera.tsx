import type { Quality, QualityReason } from "@/lib/finance/quality";

// MACRO 2 — Señal mínima del contrato de calidad en pantallas. Sin estado ni hooks
// (usable en Server y Client Components). INCOMPLETE nunca muestra un total:
// solo "Incompleto" y, si se pide, el subtotal conocido rotulado como PARCIAL.

const ETIQUETA: Record<Quality, string> = { EXACT: "Exacto", APPROXIMATE: "Aproximado", INCOMPLETE: "Incompleto" };
const COLOR: Record<Quality, string> = {
  EXACT: "text-emerald-500 border-emerald-500/30",
  APPROXIMATE: "text-amber-500 border-amber-500/40",
  INCOMPLETE: "text-red-500 border-red-500/40",
};

export function CalidadBadge({ quality, reasons }: { quality: Quality; reasons?: readonly QualityReason[] }) {
  if (quality === "EXACT") return null;
  const title = (reasons ?? []).map((r) => `${r.code}: ${r.detail}`).join("\n");
  return (
    <span title={title} className={`inline-block border rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${COLOR[quality]}`}>
      {ETIQUETA[quality]}
    </span>
  );
}

/** Texto para un total: null → "Incompleto" (nunca 0). */
export function textoTotal(v: number | null, fmt: (n: number) => string): string {
  return v === null ? "Incompleto" : fmt(v);
}

/** Línea de detalle para totales incompletos: subtotal conocido rotulado como parcial + motivos. */
export function DetalleIncompleto({ quality, reasons, knownSubtotalUSD, fmt }: {
  quality: Quality; reasons: readonly QualityReason[]; knownSubtotalUSD: number; fmt: (n: number) => string;
}) {
  if (quality === "EXACT") return null;
  const codigos = Array.from(new Set(reasons.map((r) => r.code))).join(", ");
  return (
    <p className="text-[10px] font-medium text-byg-muted">
      {quality === "INCOMPLETE" ? `Faltan datos históricos · subtotal PARCIAL conocido ${fmt(knownSubtotalUSD)} (no es un total)` : "Valor aproximado"}
      {codigos ? ` · ${codigos}` : ""}
    </p>
  );
}
