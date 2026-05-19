import { getHistorialCajaMensual } from "@/lib/data/historial-caja";
import { HistorialCajaTable } from "@/components/modules/historial/HistorialCajaTable";
import { TrendingUp, TrendingDown, DollarSign, Wallet, Activity } from "lucide-react";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default async function HistorialPage() {
  const historial = await getHistorialCajaMensual();
  const actual = historial[0];
  const anterior = historial[1];

  const variacion = actual && anterior ? actual.totalEquivalenteUSD - anterior.totalEquivalenteUSD : 0;
  const variacionPorc = actual && anterior && anterior.totalEquivalenteUSD !== 0 
    ? (variacion / anterior.totalEquivalenteUSD) * 100 
    : 0;

  return (
    <div className="flex flex-col gap-10">
      <header className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Reportería Operativa</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Historial mensual</h1>
        <p className="text-[13px] font-medium text-slate-500 mt-1 max-w-2xl">
          Evolución comparativa de la Caja Oficina y posición operativa consolidada expresada en USD.
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Posición Consolidada</p>
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tabular-nums">
            {actual ? fmt(actual.totalEquivalenteUSD) : "—"}
            <span className="text-sm font-bold text-slate-400 ml-2">USD</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Saldo USD Caja</p>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tabular-nums">
            {actual ? fmt(actual.saldoFinalUSD) : "—"}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Saldo ARS Caja</p>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tabular-nums">
            {actual ? fmt(actual.saldoFinalARS, 0) : "—"}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Variación Mensual</p>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${variacion >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
              <Activity size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-black tabular-nums ${variacion >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {variacion >= 0 ? "+" : ""}{fmt(variacion)}
            </p>
            <p className={`text-xs font-bold ${variacion >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              ({variacionPorc >= 0 ? "+" : ""}{variacionPorc.toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>

      <HistorialCajaTable historial={historial} />
    </div>
  );
}
