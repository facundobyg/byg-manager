"use client";

import { useActionState } from "react";
import { cerrarMes, reabrirMes } from "./actions";
import { useState } from "react";

type AR = { success: true } | { error: string } | null;

function fmtResult(r: AR) {
  if (!r) return null;
  if ("error" in r)
    return <p className="text-xs text-red-600 font-semibold mt-1">{r.error}</p>;
  return <p className="text-xs text-emerald-600 font-semibold mt-1">Operación exitosa.</p>;
}

export function CerrarMesForm({ mesSugerido }: { mesSugerido: string }) {
  const [result, action, pending] = useActionState<AR, FormData>(cerrarMes, null);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Cerrar mes</h2>
          <p className="text-xs text-slate-400 mt-0.5">Congela el estado financiero del mes seleccionado.</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          {expanded ? "Cancelar" : "Nuevo cierre →"}
        </button>
      </div>
      {expanded && (
        <form action={action} className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mes a cerrar</label>
              <input
                type="month"
                name="mes"
                defaultValue={mesSugerido}
                required
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notas (opcional)</label>
              <input
                type="text"
                name="notas"
                placeholder="Ej: Cierre correcto, sin pendientes"
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 font-medium">
            Al cerrar se congela el estado financiero actual. Las operaciones futuras no modificarán el snapshot histórico.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {pending ? "Cerrando..." : "Confirmar cierre"}
            </button>
            {fmtResult(result)}
          </div>
        </form>
      )}
    </div>
  );
}

export function ReopenMesButton({ mes }: { mes: string }) {
  const [result, action, pending] = useActionState<AR, FormData>(reabrirMes, null);
  const [confirm, setConfirm] = useState(false);

  if (!confirm)
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-[11px] font-bold text-amber-600 hover:text-amber-800 transition-colors"
      >
        Reabrir
      </button>
    );

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] text-red-600 font-bold">
        Modificar un mes cerrado puede alterar reportes históricos.
      </p>
      <div className="flex items-center gap-2">
        <form action={action}>
          <input type="hidden" name="mes" value={mes} />
          <button
            type="submit"
            disabled={pending}
            className="text-[11px] font-black text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
          >
            {pending ? "..." : "Confirmar"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
      {result && "error" in result && (
        <p className="text-[10px] text-red-600">{result.error}</p>
      )}
    </div>
  );
}
