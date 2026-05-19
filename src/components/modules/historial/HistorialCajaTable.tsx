"use client";

import { HistorialMes } from "@/lib/data/historial-caja";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtMes(mes: string) {
  const [year, month] = mes.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" }).toUpperCase();
}

type Props = {
  historial: HistorialMes[];
};

export function HistorialCajaTable({ historial }: Props) {
  if (historial.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
          <Minus size={32} />
        </div>
        <p className="text-slate-500 font-bold italic">No hay historial de caja disponible.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Mes</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right bg-blue-50/30">Inicial USD</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right text-emerald-600">Ingresos USD</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right text-red-600">Egresos USD</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right bg-blue-50/50 font-black">Final USD</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right bg-amber-50/30">Inicial ARS</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right text-emerald-600">Ingresos ARS</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right text-red-600">Egresos ARS</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right bg-amber-50/50 font-black">Final ARS</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">TC Blue</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-900 tracking-widest text-right bg-slate-900 text-white rounded-tr-3xl">Total USD Eq.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {historial.map((row, i) => {
              const prevRow = historial[i + 1];
              const variacion = prevRow ? row.totalEquivalenteUSD - prevRow.totalEquivalenteUSD : 0;

              return (
                <tr key={row.mes} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-[13px] font-black text-slate-800 uppercase whitespace-nowrap">{fmtMes(row.mes)}</td>
                  
                  {/* USD */}
                  <td className="px-6 py-4 text-right tabular-nums text-[13px] font-bold text-slate-500 bg-blue-50/10">{fmt(row.saldoInicialUSD)}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-[13px] font-bold text-emerald-600">+{fmt(row.ingresosUSD)}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-[13px] font-bold text-red-600">-{fmt(row.egresosUSD)}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-[14px] font-black text-slate-900 bg-blue-50/20">{fmt(row.saldoFinalUSD)}</td>
                  
                  {/* ARS */}
                  <td className="px-6 py-4 text-right tabular-nums text-[13px] font-bold text-slate-500 bg-amber-50/10">{fmt(row.saldoInicialARS, 0)}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-[13px] font-bold text-emerald-600">+{fmt(row.ingresosARS, 0)}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-[13px] font-bold text-red-600">-{fmt(row.egresosARS, 0)}</td>
                  <td className="px-6 py-4 text-right tabular-nums text-[14px] font-black text-slate-900 bg-amber-50/20">{fmt(row.saldoFinalARS, 0)}</td>

                  <td className="px-6 py-4 text-center tabular-nums text-[12px] font-bold text-slate-400">{fmt(row.tcBlue)}</td>
                  
                  <td className="px-6 py-4 text-right tabular-nums bg-slate-900 text-white font-black text-[15px]">
                    <div className="flex flex-col items-end gap-0.5">
                      {fmt(row.totalEquivalenteUSD)}
                      {prevRow && (
                        <div className={`flex items-center gap-0.5 text-[9px] ${variacion >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {variacion >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {fmt(Math.abs(variacion))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
