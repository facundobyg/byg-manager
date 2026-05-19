"use client";

import { useActionState } from "react";
import { comprarHolding } from "@/app/(dashboard)/cuentas-inversion/holdings-actions";
import { ShoppingCart } from "lucide-react";

const iCls = "w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium";

const CATEGORIAS = [
  { value: "BONO",    label: "Bono" },
  { value: "ON",      label: "ON" },
  { value: "ACCION",  label: "Acción" },
  { value: "CEDEAR",  label: "CEDEAR" },
  { value: "FCI",     label: "FCI" },
  { value: "CAUCION", label: "Caución" },
];

type Props = { comitenteId: string; cuentaInversionId: string; cancelHref: string };

export function ComprarHoldingForm({ comitenteId, cuentaInversionId, cancelHref }: Props) {
  const [state, action, pending] = useActionState(comprarHolding, null);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Nueva compra</p>
      <form action={action} className="space-y-4">
        <input type="hidden" name="comitenteId" value={comitenteId} />
        <input type="hidden" name="cuentaInversionId" value={cuentaInversionId} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ticker *</label>
            <input name="ticker" required placeholder="ej. AL30" className={`${iCls} uppercase`} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
            <input name="descripcion" placeholder="ej. Bono AL30 2030" className={iCls} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Categoría *</label>
            <select name="categoria" defaultValue="BONO" className={iCls}>
              {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Cantidad *</label>
            <input name="cantidad" type="number" step="0.000001" min="0.000001" required placeholder="0" className={`${iCls} tabular-nums`} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Precio *</label>
            <input name="precio" type="number" step="0.000001" min="0.000001" required placeholder="0.00" className={`${iCls} tabular-nums`} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha compra</label>
            <input name="fechaCompra" type="date" className={iCls} />
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Notas</label>
            <input name="notas" placeholder="Opcional" className={iCls} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:bg-slate-300 cursor-pointer flex items-center gap-2"
          >
            <ShoppingCart size={14} />
            {pending ? "Comprando…" : "Confirmar compra"}
          </button>
          <a href={cancelHref} className="px-5 py-2 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-700 transition-colors">
            Cancelar
          </a>
          {state?.error   && <p className="text-red-600 text-xs font-bold">{state.error}</p>}
          {state?.success && <p className="text-blue-700 text-xs font-bold">Compra registrada</p>}
        </div>
      </form>
    </div>
  );
}
