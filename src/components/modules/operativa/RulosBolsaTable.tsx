"use client";

import { useState, useMemo, Fragment, useActionState } from "react";
import { RuloBolsaRow } from "@/lib/data/rulos-bolsa";
import { CUENTAS_OPERATIVAS_ACTUALES } from "@/lib/constants/cuentas-operativas";
import { Trash2, CalendarDays } from "lucide-react";
import { eliminarOperacionRulo } from "@/app/(dashboard)/operativa/rulos-bolsa/actions";

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

function EliminarButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(eliminarOperacionRulo, null);
  const [confirmed, setConfirmed] = useState(false);

  if (state?.ok) {
    return <span className="text-[9px] font-black text-slate-400 uppercase">Eliminado</span>;
  }

  if (!confirmed) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        disabled={pending}
        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
        title="Eliminar"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-1 items-center">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-1">
        <button
          type="submit"
          disabled={pending}
          className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {pending ? "…" : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
      {state?.error && (
        <span className="text-[9px] text-red-500 font-semibold">{state.error}</span>
      )}
    </form>
  );
}

type Props = {
  rows: RuloBolsaRow[];
};

export function RulosBolsaTable({ rows }: Props) {
  const [filtroCuenta, setFiltroCuenta] = useState("Todas");

  const filtered = useMemo(() => {
    if (filtroCuenta === "Todas") return rows;
    return rows.filter((r) => r.cuenta === filtroCuenta);
  }, [rows, filtroCuenta]);

  // Agrupar por fecha
  const groups = useMemo(() => {
    const map = new Map<string, RuloBolsaRow[]>();
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
              filtroCuenta === c ? "bg-slate-900 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Cuenta</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Descripción</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">USD</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">ARS</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Notas</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 font-medium italic">No se registraron rulos para esta selección.</td>
                </tr>
              ) : (
                groups.map(([day, dayRows]) => {
                  const { dateStr, fullDate } = fmtFecha(new Date(day));
                  return (
                    <Fragment key={day}>
                      <tr className="bg-slate-100/50">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-slate-400" />
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
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
                          <td className="px-6 py-4 text-[13px] font-bold text-slate-700">{row.descripcion}</td>
                          <td className={`px-6 py-4 text-right tabular-nums font-black text-[15px] ${row.usd >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {formatMoney(row.usd, "USD")}
                          </td>
                          <td className={`px-6 py-4 text-right tabular-nums font-black text-[15px] ${row.ars >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {formatMoney(row.ars, "ARS")}
                          </td>
                          <td className="px-6 py-4 text-[12px] text-slate-400 italic max-w-xs truncate">{row.notas}</td>
                          <td className="px-6 py-4 text-center">
                            <EliminarButton id={row.id} />
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
