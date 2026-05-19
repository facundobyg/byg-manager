"use client";

import { useState, useMemo, Fragment } from "react";
import { LargoPlazoRow } from "@/lib/data/largo-plazo";
import { CUENTAS_OPERATIVAS_ACTUALES } from "@/lib/constants/cuentas-operativas";
import { Trash2 } from "lucide-react";

function formatMoney(n: number | undefined, moneda: string = "USD") {
  if (n === undefined || n === null || n === 0) return "—";
  const absN = Math.abs(n);
  const formatted = absN.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prefix = moneda === "ARS" ? "$" : (moneda === "USD" ? "USD" : moneda);
  const sign = n < 0 ? "-" : "";
  return `${sign}${prefix} ${formatted}`;
}


function fmtFecha(d: string | Date) {
  const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "2-digit", month: "short" };
  const dateStr = new Date(d).toLocaleDateString("es-AR", { ...options, timeZone: "UTC" }).toUpperCase();
  const fullDate = new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  return { dateStr, fullDate };
}

type Props = {
  rows: LargoPlazoRow[];
};

export function LargoPlazoTable({ rows }: Props) {
  const [filtroCuenta, setFiltroCuenta] = useState("Todas");

  const filtered = useMemo(() => {
    if (filtroCuenta === "Todas") return rows;
    return rows.filter((r) => r.cuenta === filtroCuenta);
  }, [rows, filtroCuenta]);

  // Agrupar por fecha
  const groups = useMemo(() => {
    const map = new Map<string, LargoPlazoRow[]>();
    filtered.forEach((r) => {
      const day = new Date(r.fecha).toISOString().split("T")[0];
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const cuentas = ["Todas", ...CUENTAS_OPERATIVAS_ACTUALES];

  return (
    <div className="flex flex-col gap-6">
      {/* Filtro por Cuenta */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto whitespace-nowrap">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Filtrar Cuenta:</p>
        {cuentas.map((c) => (
          <button
            key={c}
            onClick={() => setFiltroCuenta(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filtroCuenta === c ? "bg-indigo-600 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Cuenta</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Tipo</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Ticker</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">USD</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Pesos</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Notas / Descripción</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400 font-medium italic">No se registraron operaciones para esta selección.</td>
                </tr>
              ) : (
                groups.map(([day, dayRows]) => {
                  const { dateStr, fullDate } = fmtFecha(day);
                  return (
                  <Fragment key={day}>
                    <tr className="bg-indigo-50/20">
                      <td colSpan={7} className="px-6 py-3">
                        <div className="flex items-center gap-2 text-indigo-500">
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            {dateStr} — {fullDate}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {dayRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-black bg-slate-100 text-slate-800 px-3 py-1 rounded-full uppercase tracking-tighter">
                            {row.cuenta}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest border ${
                            row.tipo === "COMPRA" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}>
                            {row.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[11px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded uppercase tracking-tighter">
                            {row.ticker}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums font-black text-[15px] text-slate-900">{formatMoney(row.totalUSD, "USD")}</td>
                        <td className="px-6 py-4 text-right tabular-nums font-black text-[15px] text-slate-900">{formatMoney(row.ars, "ARS")}</td>
                        <td className="px-6 py-4 text-[12px] text-slate-400 italic max-w-[300px] truncate">{row.notas}</td>
                        <td className="px-6 py-4 text-center">
                          <button disabled className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
