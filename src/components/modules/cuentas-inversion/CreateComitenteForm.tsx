"use client";

import { useActionState, useEffect, useRef } from "react";
import { createComitente } from "@/app/(dashboard)/cuentas-inversion/actions";
import type { ProductorOption } from "@/lib/services/config.service";
import { UserPlus } from "lucide-react";

const iCls = "w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium";

const DEFAULT_PRODUCTORES: ProductorOption[] = [
  { label: "BYG", value: "BYG", activo: true },
  { label: "Otro", value: "OTRO", activo: true },
];

export function CreateComitenteForm({
  cuentaInversionId,
  productores = DEFAULT_PRODUCTORES,
}: {
  cuentaInversionId: string;
  productores?: ProductorOption[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createComitente, null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <UserPlus size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Nuevo Comitente</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Alta de comitente en esta cuenta</p>
        </div>
      </div>

      <form ref={formRef} action={action} className="space-y-4">
        <input type="hidden" name="cuentaInversionId" value={cuentaInversionId} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">N° Comitente *</label>
            <input name="nroComitente" required placeholder="ej: 12345" className={iCls} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre *</label>
            <input name="nombre" required placeholder="Nombre del titular" className={iCls} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Razón social</label>
            <input name="razonSocial" placeholder="Opcional" className={iCls} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Productor *</label>
            <select name="productor" required className={iCls}>
              {productores.filter((p) => p.activo).map((p) => (
                <option key={p.label} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Notas</label>
            <input name="notas" placeholder="Opcional" className={iCls} />
          </div>
          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="esPropioBYG"
                value="true"
                className="w-4 h-4 rounded border-slate-300 accent-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Comitente propio BYG</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-blue-100 disabled:bg-slate-300 disabled:shadow-none cursor-pointer flex items-center gap-2"
          >
            <UserPlus size={15} />
            {pending ? "Guardando…" : "Crear comitente"}
          </button>
          {state?.error && <p className="text-red-600 text-xs font-bold">{state.error}</p>}
          {state?.success && <p className="text-blue-600 text-xs font-bold">Comitente creado correctamente</p>}
        </div>
      </form>
    </div>
  );
}
