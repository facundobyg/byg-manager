"use client";

import { useState, useMemo, Fragment } from "react";
import { DivInteresRow } from "@/lib/data/div-intereses";
import { CUENTAS_OPERATIVAS_ACTUALES } from "@/lib/constants/cuentas-operativas";
import { Trash2, CalendarDays, Coins } from "lucide-react";

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
  rows: DivInteresRow[];
};

export function DivInteresesTable({ rows }: Props) {
  const [filtroCuenta, setFiltroCuenta] = useState("Todas");

  const filtered = useMemo(() => {
    if (filtroCuenta === "Todas") return rows;
    return rows.filter((r) => r.cuenta === filtroCuenta);
  }, [rows, filtroCuenta]);

  // Agrupar por fecha
  const groups = useMemo(() => {
    const map = new Map<string, DivInteresRow[]>();
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
      <div className="flex items-center gap-4 bg-byg-surface p-4 rounded-2xl border border-byg-border shadow-sm overflow-x-auto whitespace-nowrap">
        <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted px-2">Filtrar Cuenta:</p>
        {cuentas.map((c) => (
          <button
            key={c}
            onClick={() => setFiltroCuenta(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filtroCuenta === c ? "bg-amber-500 text-white shadow-md" : "bg-byg-bg text-byg-muted hover:bg-byg-border"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-byg-surface rounded-3xl border border-byg-border shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-byg-bg border-b border-byg-border">
                <th className="px-6 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest">Cuenta</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest text-center">Ticker</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest">Descripción</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest text-right">USD</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest text-right">ARS</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-byg-border">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-byg-muted font-medium italic">No se registraron dividendos para esta selección.</td>
                </tr>
              ) : (
                groups.map(([day, dayRows]) => {
                  const { dateStr, fullDate } = fmtFecha(new Date(day));
                  return (
                    <Fragment key={day}>
                      <tr className="bg-amber-500/10">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-amber-500" />
                            <span className="text-[11px] font-black text-byg-text uppercase tracking-widest">
                              {dateStr} — {fullDate}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {dayRows.map((row) => (
                        <tr key={row.id} className="hover:bg-byg-surface-2 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-black bg-byg-surface-2 text-byg-text px-3 py-1 rounded-full uppercase tracking-tighter">
                              {row.cuenta}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[11px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded uppercase tracking-tighter">
                              {row.ticker}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[13px] font-bold text-byg-text">{row.descripcion}</td>
                          <td className={`px-6 py-4 text-right tabular-nums font-black text-[15px] ${row.usd >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {formatMoney(row.usd, "USD")}
                          </td>
                          <td className={`px-6 py-4 text-right tabular-nums font-black text-[15px] ${row.ars >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {formatMoney(row.ars, "ARS")}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button disabled className="p-2 text-byg-muted hover:text-red-500 transition-colors">
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
