"use client";

import { useActionState, useRef, useEffect } from "react";
import { createActivo } from "@/app/(dashboard)/configuracion/actions";
import { Loader2, Plus } from "lucide-react";
import { CategoriaActivo } from "@prisma/client";

const CATEGORIES: { value: CategoriaActivo; label: string }[] = [
  { value: "BONO_USD",       label: "Bonos USD (Soberanos)" },
  { value: "ON_USD",         label: "ONs en USD" },
  { value: "ACCION_ARS",     label: "Acciones Argentinas" },
  { value: "ACCION_USD",     label: "Acciones USD (Cable)" },
  { value: "ACCION_USD_EXT", label: "Acciones USD (MEP)" },
  { value: "CEDEAR",         label: "CEDEARs" },
  { value: "FCI",            label: "FCI / Fondos" },
  { value: "CRIPTO",         label: "Cripto" },
  { value: "BONO_ARS",       label: "Bonos ARS" },
];

export function CreateActivoForm() {
  const [state, action, pending] = useActionState(createActivo, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <details className="group">
      <summary className="list-none">
        <div className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer">
          <Plus size={14} />
          Agregar Activo
        </div>
      </summary>
      
      <div className="mt-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
        <form ref={formRef} action={action} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ticker</label>
            <input
              name="ticker"
              required
              placeholder="AL30, GGAL, BTC..."
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría</label>
            <select
              name="categoria"
              required
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</label>
            <input
              name="descripcion"
              placeholder="Ej: Bonos República Argentina 2030"
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Moneda Precio</label>
            <select
              name="monedaPrecio"
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precio Inicial (opcional)</label>
            <input
              name="precioActual"
              type="number"
              step="0.000001"
              placeholder="0.00"
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-2 pt-2 border-t border-slate-50">
            {state?.error && <p className="text-[10px] text-rose-600 font-bold flex-1 flex items-center">{state.error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-md"
            >
              {pending ? <Loader2 size={12} className="animate-spin" /> : "Crear Activo"}
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
