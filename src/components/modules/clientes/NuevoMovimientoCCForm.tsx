"use client"

import { useActionState, useEffect, useRef } from "react";
import { crearMovimientoCC } from "@/app/(dashboard)/clientes/actions";
import { PlusCircle, Loader2 } from "lucide-react";
import { readOnlyPreview } from "@/lib/config";

interface NuevoMovimientoCCFormProps {
  cuentaId: string;
  clienteId: string;
}

export function NuevoMovimientoCCForm({ cuentaId, clienteId }: NuevoMovimientoCCFormProps) {
  const [state, action, isPending] = useActionState(crearMovimientoCC, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  if (readOnlyPreview) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
        <PlusCircle size={16} className="text-blue-600" />
        Registrar Movimiento
      </h3>

      <form ref={formRef} action={action} className="flex flex-col gap-4">
        <input type="hidden" name="cuentaId" value={cuentaId} />
        <input type="hidden" name="clienteId" value={clienteId} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Tipo</label>
            <select
              name="tipo"
              required
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
            >
              <option value="INGRESO">INGRESO (+)</option>
              <option value="EGRESO">EGRESO (-)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Monto</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="monto"
                required
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Descripción / Motivo</label>
          <input
            type="text"
            name="descripcion"
            placeholder="Ej: Depósito por ventanilla, Pago de honorarios..."
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
          />
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Confirmar y Registrar"
            )}
          </button>

          {state?.error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-bold text-center">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-bold text-center">
              {state.message}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
