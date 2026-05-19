"use client";

import { useActionState } from "react";
import { updateComitente } from "@/app/(dashboard)/cuentas-inversion/actions";
import { ProductorInversion } from "@prisma/client";
import type { ProductorOption } from "@/lib/services/config.service";
import { Save } from "lucide-react";

const DEFAULT_PRODUCTORES: ProductorOption[] = [
  { label: "BYG", value: "BYG", activo: true },
  { label: "Otro", value: "OTRO", activo: true },
];

const iCls = "w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all font-medium";

type Props = {
  id: string;
  cuentaInversionId: string;
  nroComitente: string;
  nombre: string;
  razonSocial: string | null;
  productor: ProductorInversion;
  notas: string | null;
  activo: boolean;
  esPropioBYG: boolean;
  cancelHref: string;
  productores?: ProductorOption[];
};

export function EditComitenteForm(props: Props) {
  const [state, action, pending] = useActionState(updateComitente, null);
  const productores = props.productores ?? DEFAULT_PRODUCTORES;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Editar comitente</p>
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={props.id} />
        <input type="hidden" name="cuentaInversionId" value={props.cuentaInversionId} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">N° Comitente *</label>
            <input name="nroComitente" required defaultValue={props.nroComitente} className={iCls} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre *</label>
            <input name="nombre" required defaultValue={props.nombre} className={iCls} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Razón social</label>
            <input name="razonSocial" defaultValue={props.razonSocial ?? ""} className={iCls} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Productor *</label>
            <select name="productor" defaultValue={props.productor} className={iCls}>
              {productores.filter((p) => p.activo || p.value === props.productor).map((p) => (
                <option key={p.label} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Notas</label>
            <input name="notas" defaultValue={props.notas ?? ""} className={iCls} />
          </div>
          <div className="space-y-1 flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="activo"
                value="true"
                defaultChecked={props.activo}
                className="w-4 h-4 rounded border-slate-300 accent-amber-500"
              />
              <span className="text-sm font-medium text-slate-700">Activo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="esPropioBYG"
                value="true"
                defaultChecked={props.esPropioBYG}
                className="w-4 h-4 rounded border-slate-300 accent-amber-500"
              />
              <span className="text-sm font-medium text-slate-700">Comitente propio BYG</span>
            </label>
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
          {state?.error && <p className="text-red-600 text-xs font-bold">{state.error}</p>}
          {state?.success && <p className="text-amber-700 text-xs font-bold">Guardado correctamente</p>}
        </div>
      </form>
    </div>
  );
}
