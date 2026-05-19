"use client";

import { useActionState } from "react";
import { venderHolding } from "@/app/(dashboard)/cuentas-inversion/holdings-actions";
import { TrendingDown } from "lucide-react";

const iCls = "w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all font-medium";

type Props = {
  holdingId: string;
  comitenteId: string;
  cuentaInversionId: string;
  ticker: string;
  cantidadDisponible: number;
  cancelHref: string;
};

export function VenderHoldingForm({ holdingId, comitenteId, cuentaInversionId, ticker, cantidadDisponible, cancelHref }: Props) {
  const [state, action, pending] = useActionState(venderHolding, null);

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-red-700">
        Vender — <span className="font-mono">{ticker}</span>
        <span className="ml-2 text-red-400 normal-case font-medium">Disponible: {cantidadDisponible}</span>
      </p>
      <form action={action} className="space-y-4">
        <input type="hidden" name="holdingId" value={holdingId} />
        <input type="hidden" name="comitenteId" value={comitenteId} />
        <input type="hidden" name="cuentaInversionId" value={cuentaInversionId} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Cantidad *</label>
            <input
              name="cantidad"
              type="number"
              step="0.000001"
              min="0.000001"
              max={cantidadDisponible}
              required
              placeholder="0"
              className={`${iCls} tabular-nums`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Precio venta *</label>
            <input name="precio" type="number" step="0.000001" min="0.000001" required placeholder="0.00" className={`${iCls} tabular-nums`} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha</label>
            <input name="fecha" type="date" className={iCls} />
          </div>
          <div className="space-y-1 md:col-span-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Notas</label>
            <input name="notas" placeholder="Opcional" className={iCls} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all disabled:bg-slate-300 cursor-pointer flex items-center gap-2"
          >
            <TrendingDown size={14} />
            {pending ? "Vendiendo…" : "Confirmar venta"}
          </button>
          <a href={cancelHref} className="px-5 py-2 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-700 transition-colors">
            Cancelar
          </a>
          {state?.error   && <p className="text-red-600 text-xs font-bold">{state.error}</p>}
          {state?.success && <p className="text-emerald-700 text-xs font-bold">Venta registrada</p>}
        </div>
      </form>
    </div>
  );
}
