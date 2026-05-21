import Link from "next/link";
import { ChevronLeft, GitMerge } from "lucide-react";
import { getArbitrajesData } from "@/lib/data/operacion-bolsa";
import { TabsNav } from "@/components/modules/bolsa/TabsNav";

const TIPO_LABEL: Record<string, string> = {
  COMPRA_BONO:        "Compra Bono",
  VENTA_BONO:         "Venta Bono",
  COMPRA_ACCION:      "Compra Acción",
  VENTA_ACCION:       "Venta Acción",
  COMPRA_CEDEAR:      "Compra CEDEAR",
  VENTA_CEDEAR:       "Venta CEDEAR",
  CAUCION_COLOCADORA: "Caución Coloc.",
  CAUCION_TOMADORA:   "Caución Tomad.",
  MEP:                "MEP",
  SENEBI:             "SENEBI",
};

const ESTADO_STYLE: Record<string, string> = {
  PENDIENTE_CONCERTACION: "bg-amber-500/10 text-amber-400",
  CONCERTADA:             "bg-byg-accent/10 text-byg-accent",
  LIQUIDADA:              "bg-emerald-500/10 text-emerald-400",
  ANULADA:                "bg-byg-surface-2 text-byg-muted",
};

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ResultBadge({ value, moneda }: { value: number; moneda: string }) {
  if (value === 0) return <span className="text-byg-muted text-[11px] font-mono">—</span>;
  const color = value > 0 ? "text-emerald-400" : "text-red-400";
  return (
    <span className={`${color} font-black text-[12px] font-mono tabular-nums`}>
      {value > 0 ? "+" : ""}{fmt(value)} {moneda}
    </span>
  );
}

export default async function ArbitrajesPage() {
  const groups = await getArbitrajesData();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="bg-byg-surface rounded-2xl border border-byg-border p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-byg-accent" />
        <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em] mb-1">Operativa</p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-byg-text tracking-tight flex items-center gap-3">
              <GitMerge size={28} className="text-byg-accent" />
              Arbitrajes
            </h1>
            <p className="text-xs font-medium text-byg-muted mt-1">
              {groups.length} grupo{groups.length !== 1 ? "s" : ""} registrado{groups.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <TabsNav fecha="" tab="historial" isArbitrajes />

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-byg-border bg-byg-surface p-12 text-center">
          <GitMerge size={32} className="text-byg-muted mx-auto mb-3" />
          <p className="text-byg-muted text-sm">Sin grupos de arbitraje registrados.</p>
          <p className="text-byg-muted/60 text-xs mt-1">
            Agregar operaciones desde la mesa diaria y agruparlas con el botón ARB.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.grupoId} className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-3 border-b border-byg-border flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20 tracking-wider font-mono uppercase">
                    ARB {g.grupoId}
                  </span>
                  <span className="text-[11px] text-byg-muted font-mono">{fmtDate(g.fecha)}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                    g.isClosed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {g.isClosed ? "Cerrado" : "Abierto"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {g.resultadoARS !== 0 && <ResultBadge value={g.resultadoARS} moneda="ARS" />}
                  {g.resultadoUSD !== 0 && <ResultBadge value={g.resultadoUSD} moneda="USD" />}
                  {g.resultadoARS === 0 && g.resultadoUSD === 0 && (
                    <span className="text-[11px] text-byg-muted font-mono">Sin resultado</span>
                  )}
                </div>
              </div>

              {/* Ops table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-byg-border/60 bg-byg-bg/40">
                      {["Cuenta", "Tipo", "Ticker", "Cantidad", "Precio", "Total", "Mon.", "Estado", ""].map((h) => (
                        <th key={h} className="px-4 py-2 text-[9px] font-black uppercase text-byg-muted tracking-[0.15em] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-byg-border/30">
                    {g.ops.map((op) => (
                      <tr key={op.id} className="hover:bg-byg-surface-2/50 transition-colors">
                        <td className="px-4 py-2.5 text-[11px] text-byg-text font-medium max-w-[160px] truncate">
                          {op.cuentaNombre}
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-byg-muted whitespace-nowrap">
                          {TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] font-black text-byg-text tracking-tight">
                          {op.ticker}
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-right tabular-nums font-mono text-byg-text">
                          {fmt(op.cantidad, 0)}
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-right tabular-nums font-mono text-byg-text">
                          {fmt(op.precio)}
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-right tabular-nums font-mono font-bold text-byg-text whitespace-nowrap">
                          {fmt(op.valorBruto)}
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-byg-muted">{op.moneda}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${ESTADO_STYLE[op.estado] ?? "bg-byg-surface-2 text-byg-muted"}`}>
                            {op.estado.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/bolsa/${op.id}`}
                            className="text-[10px] font-black px-2 py-1 rounded-lg bg-byg-accent/10 text-byg-accent hover:bg-byg-accent/20 transition-colors uppercase tracking-widest"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
