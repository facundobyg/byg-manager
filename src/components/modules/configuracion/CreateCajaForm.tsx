"use client";

import { useActionState, useState } from "react";
import { createCaja } from "@/app/(dashboard)/configuracion/actions";
import { Plus, X } from "lucide-react";

export function CreateCajaForm() {
  const [state, action, pending] = useActionState(createCaja, null);
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={18} /> Nueva Caja
      </button>
    );
  }

  return (
    <div className="p-6 bg-slate-50 border-t border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Nueva Caja</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre / Label</label>
          <input
            name="label"
            placeholder="Ej: Trenque Lauquen"
            required
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Slug (identificador único)</label>
          <input
            name="slug"
            placeholder="ej: trenque_lauquen"
            required
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none font-mono"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
          <select
            name="tipo"
            required
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white"
          >
            <option value="SUCURSAL_OPERATIVA">Sucursal Operativa</option>
            <option value="CAJA_SEGURIDAD">Caja de Seguridad</option>
            <option value="BANCO">Banco</option>
            <option value="CENTRAL_CONTABLE">Central Contable</option>
          </select>
        </div>

        <div className="md:col-span-3 flex items-center justify-end gap-3 mt-2">
          {state?.error && <p className="text-xs text-red-500 font-medium mr-auto">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-xs hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            {pending ? "Creando..." : "Crear Caja"}
          </button>
        </div>
      </form>
    </div>
  );
}
