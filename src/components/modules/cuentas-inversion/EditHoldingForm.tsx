"use client";

import { useActionState } from "react";
import { editHolding } from "@/app/(dashboard)/cuentas-inversion/holdings-actions";
import { CategoriaHoldingInversion } from "@prisma/client";
import { Save } from "lucide-react";

const iCls = "w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all font-medium";

const CATEGORIAS: { value: CategoriaHoldingInversion; label: string }[] = [
  { value: "BONO",    label: "Bono" },
  { value: "ON",      label: "ON" },
  { value: "ACCION",  label: "Acción" },
  { value: "CEDEAR",  label: "CEDEAR" },
  { value: "FCI",     label: "FCI" },
  { value: "CAUCION", label: "Caución" },
];

type Props = {
  holdingId: string;
  comitenteId: string;
  cuentaInversionId: string;
  ticker: string;
  descripcion: string | null;
  categoria: CategoriaHoldingInversion;
  cantidad: number;
  precioPromedio: number;
  precioActual: number | null;
  fechaCompra: Date | null;
  cancelHref: string;
};

function toDateInput(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

export function EditHoldingForm(props: Props) {
  const [state, action, pending] = useActionState(editHolding, null);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Editar holding</p>
      <form action={action} className="space-y-4">
        <input type="hidden" name="holdingId" value={props.holdingId} />
        <input type="hidden" name="comitenteId" value={props.comitenteId} />
        <input type="hidden" name="cuentaInversionId" value={props.cuentaInversionId} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ticker *</label>
            <input name="ticker" required defaultValue={props.ticker} className={`${iCls} uppercase`} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
            <input name="descripcion" defaultValue={props.descripcion ?? ""} className={iCls} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Categoría *</label>
            <select name="categoria" defaultValue={props.categoria} className={iCls}>
              {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Cantidad *</label>
            <input name="cantidad" type="number" step="0.000001" min="0.000001" required defaultValue={props.cantidad} className={`${iCls} tabular-nums`} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Precio promedio *</label>
            <input name="precioPromedio" type="number" step="0.000001" min="0" required defaultValue={props.precioPromedio} className={`${iCls} tabular-nums`} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Precio actual</label>
            <input name="precioActual" type="number" step="0.000001" min="0" defaultValue={props.precioActual ?? ""} placeholder="—" className={`${iCls} tabular-nums`} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha compra</label>
            <input name="fechaCompra" type="date" defaultValue={toDateInput(props.fechaCompra)} className={iCls} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all disabled:bg-slate-300 cursor-pointer flex items-center gap-2"
          >
            <Save size={14} />
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
          <a href={props.cancelHref} className="px-5 py-2 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-700 transition-colors">
            Cancelar
          </a>
          {state?.error   && <p className="text-red-600 text-xs font-bold">{state.error}</p>}
          {state?.success && <p className="text-amber-700 text-xs font-bold">Guardado correctamente</p>}
        </div>
      </form>
    </div>
  );
}
