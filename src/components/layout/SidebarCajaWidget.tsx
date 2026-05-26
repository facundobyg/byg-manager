// EXPERIMENTAL: removable operational caja widget

import { getTopbarOperationalSummary } from "@/lib/data/topbar";

function fmtUSD(n: number) {
  const abs = Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${n < 0 ? "-" : ""}USD ${abs}`;
}

function fmtARS(n: number) {
  const abs = Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${n < 0 ? "-" : ""}$ ${abs}`;
}

export async function SidebarCajaWidget() {
  try {
    const summary = await getTopbarOperationalSummary();
    return (
      <div className="mx-3 mb-3 rounded-xl bg-byg-surface border border-byg-border p-3 flex flex-col gap-1.5">
        <p className="text-[8px] font-black uppercase tracking-widest text-byg-accent mb-0.5">Cajas</p>
        <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto">
          {summary.allCajas.map(c => (
            <div key={c.id} className="flex items-start justify-between gap-2">
              <span className="text-[9px] font-bold text-byg-muted shrink-0 truncate max-w-[80px]">{c.label}</span>
              <div className="flex flex-col items-end shrink-0">
                <span className={`text-[10px] font-black font-mono tabular-nums leading-tight ${c.usd < 0 ? "text-rose-400" : "text-byg-text"}`}>
                  {fmtUSD(c.usd)}
                </span>
                <span className={`text-[8px] font-mono leading-tight ${c.ars < 0 ? "text-rose-400" : "text-byg-muted"}`}>
                  {fmtARS(c.ars)}
                </span>
              </div>
            </div>
          ))}
        </div>
        {summary.allCajas.length > 1 && (
          <div className="border-t border-byg-border pt-1.5 flex items-start justify-between gap-2">
            <span className="text-[9px] font-black text-byg-text uppercase shrink-0">Total</span>
            <div className="flex flex-col items-end shrink-0">
              <span className={`text-[10px] font-black font-mono tabular-nums leading-tight ${summary.totalUSD < 0 ? "text-rose-400" : "text-byg-text"}`}>
                {fmtUSD(summary.totalUSD)}
              </span>
              <span className={`text-[8px] font-mono leading-tight ${summary.totalARS < 0 ? "text-rose-400" : "text-byg-muted"}`}>
                {fmtARS(summary.totalARS)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  } catch {
    return null;
  }
}
