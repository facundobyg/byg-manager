"use client";

import { useActionState, useState } from "react";
import { updatePreciosActivosBatch } from "@/app/(dashboard)/configuracion/actions";
import { ChevronDown, ChevronUp, Save, Loader2, AlertCircle } from "lucide-react";

type Activo = {
  id: string;
  ticker: string;
  categoria: string;
  precioActual: number | string | null;
  monedaPrecio: string;
};

type Props = {
  activos: Activo[];
};

const init: { error?: string; ok?: boolean; count?: number } = {};

export function PreciosActivosBatchForm({ activos }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, pending] = useActionState(updatePreciosActivosBatch, init);

  return (
    <div className="flex flex-col border-t border-slate-100 bg-slate-50/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
            <Save size={14} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">Edición masiva de precios</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {isOpen && (
        <form action={action} className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-inner-sm overflow-hidden mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-500">Ticker</th>
                  <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-500">Categoría</th>
                  <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-500 text-right">Precio Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activos.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 text-[12px] font-black text-slate-900">{a.ticker}</td>
                    <td className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {a.categoria.replace("_", " ")}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input type="hidden" name="activoId" value={a.id} />
                      <div className="relative flex items-center justify-end">
                        <span className="absolute left-2 text-[9px] font-bold text-slate-400">
                          {a.monedaPrecio}
                        </span>
                        <input
                          name="precioActual"
                          type="number"
                          step="0.000001"
                          min="0"
                          defaultValue={a.precioActual?.toString() ?? ""}
                          className="w-32 text-[12px] font-black tabular-nums border border-slate-200 rounded-md pl-8 pr-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-[0.2em] py-3 rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Actualizando {activos.length} activos…
                </>
              ) : (
                <>
                  <Save size={16} />
                  Guardar todos los precios
                </>
              )}
            </button>

            {state.error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600">
                <AlertCircle size={14} />
                <span className="text-[11px] font-bold uppercase">{state.error}</span>
              </div>
            )}
            
            {state.ok && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-600">
                <div className="p-0.5 bg-emerald-600 text-white rounded-full">
                  <ChevronDown size={10} className="rotate-180" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-tight">
                  ✓ {state.count} precios actualizados correctamente
                </span>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
