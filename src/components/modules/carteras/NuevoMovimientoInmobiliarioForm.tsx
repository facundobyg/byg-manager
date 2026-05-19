"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearMovimientoInmobiliario } from "@/app/(dashboard)/carteras/inmobiliarias/actions";
import { PlusCircle, Loader2 } from "lucide-react";

type Propiedad = { id: string; nombre: string };

type Props = {
  propiedades: Propiedad[];
};

const init: { error?: string; ok?: boolean } = {};

export function NuevoMovimientoInmobiliarioForm({ propiedades }: Props) {
  const [state, action, pending] = useActionState(crearMovimientoInmobiliario, init);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
          <PlusCircle size={14} className="text-blue-600" />
          Nuevo Movimiento
        </h2>
      </div>

      <form ref={formRef} action={action} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Propiedad */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Propiedad</label>
          <select
            name="propiedadId"
            required
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Seleccionar...</option>
            {propiedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</label>
          <input
            name="fecha"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</label>
          <select
            name="tipo"
            required
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="INGRESO">INGRESO (Aporte)</option>
            <option value="RENTA">RENTA (Cobro)</option>
            <option value="EGRESO">EGRESO (Gasto)</option>
            <option value="MEJORA">MEJORA (Inversión)</option>
            <option value="IMPUESTO">IMPUESTO</option>
          </select>
        </div>

        {/* Moneda */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Moneda</label>
          <select
            name="moneda"
            required
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </div>

        {/* Monto */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monto</label>
          <input
            name="monto"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Quién */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quién (Responsable)</label>
          <input
            name="quien"
            type="text"
            required
            placeholder="Nombre del socio/cliente"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Descripción */}
        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</label>
          <input
            name="descripcion"
            type="text"
            placeholder="Detalle del movimiento..."
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Submit */}
        <div className="lg:col-span-4 flex flex-col gap-3 mt-2">
          <button
            type="submit"
            disabled={pending}
            className="bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                Registrar Movimiento
              </>
            )}
          </button>

          {state.error && (
            <p className="text-[11px] font-black uppercase text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
              ⚠️ {state.error}
            </p>
          )}
          {state.ok && (
            <p className="text-[11px] font-black uppercase text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              ✓ Movimiento registrado correctamente
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
