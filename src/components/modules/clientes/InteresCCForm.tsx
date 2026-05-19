"use client";

import { useActionState } from "react";
import { liquidarInteresCCAction } from "@/app/(dashboard)/clientes/actions";
import { readOnlyPreview } from "@/lib/config";

type State = {
  error?: string;
  success?: boolean;
  interesCalculado?: string;
  interesAplicado?: string;
  diferencia?: string;
  movimientoId?: string;
} | null;

export function InteresCCForm({
  cuentaId,
  clienteId,
}: {
  cuentaId: string;
  clienteId: string;
}) {
  const [state, action, pending] = useActionState<State, FormData>(
    liquidarInteresCCAction,
    null
  );

  if (readOnlyPreview) return null;

  return (
    <form action={action} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-2 border-b border-slate-100 pb-4">
        Liquidar Interés Manual
      </h3>

      <input type="hidden" name="cuentaId" value={cuentaId} />
      <input type="hidden" name="clienteId" value={clienteId} />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Fecha inicio</label>
          <input
            type="date"
            name="fechaInicio"
            required
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13px] font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Fecha fin</label>
          <input
            type="date"
            name="fechaFin"
            required
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13px] font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Tasa anual decimal <span className="normal-case font-medium">(5% → 0.05)</span></label>
        <input
          type="number"
          name="tasa"
          step="0.0001"
          min="0"
          required
          placeholder="0.05"
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Interés a aplicar</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
          <input
            type="number"
            name="interesAplicado"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-[13px] font-black text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
          />
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {pending ? "Procesando..." : "Liquidar Interés"}
        </button>

        {state?.error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-bold text-center">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-[11px] font-medium flex flex-col gap-1">
            <span className="flex justify-between border-b border-emerald-100 pb-1">Calculado: <strong>{state.interesCalculado}</strong></span>
            <span className="flex justify-between border-b border-emerald-100 pb-1 pt-1">Aplicado: <strong>{state.interesAplicado}</strong></span>
            <span className="flex justify-between pt-1">Diferencia: <strong>{state.diferencia}</strong></span>
          </div>
        )}
      </div>
    </form>
  );
}
