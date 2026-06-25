"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearDivInteres } from "@/app/(dashboard)/operativa/div-intereses/actions";
import { Coins, Loader2, Plus } from "lucide-react";
import { CUENTAS_OPERATIVAS_ACTUALES } from "@/lib/constants/cuentas-operativas";

const init: { error?: string; ok?: boolean } = {};

export function NuevoDivInteresForm() {
  const [state, action, pending] = useActionState(crearDivInteres, init);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  const cuentas = CUENTAS_OPERATIVAS_ACTUALES;

  return (
    <section className="bg-byg-surface rounded-2xl border border-byg-border shadow-sm overflow-hidden flex flex-col relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
      <div className="px-6 py-4 border-b border-byg-border bg-byg-bg/50">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text flex items-center gap-2">
          <Coins size={14} className="text-amber-500" />
          Registrar Dividendo / Interés
        </h2>
      </div>

      <form ref={formRef} action={action} className="p-6 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Fecha</label>
            <input
              name="fecha"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="bg-byg-bg border border-byg-border rounded-xl px-3 py-2 text-sm text-byg-text focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* Ticker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Ticker</label>
            <input
              name="ticker"
              type="text"
              required
              placeholder="Ej: AL30, AAPL, AMZ"
              className="bg-byg-bg border border-byg-border rounded-xl px-3 py-2 text-sm text-byg-text focus:outline-none focus:ring-2 focus:ring-amber-100 uppercase font-black"
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Descripción</label>
            <input
              name="descripcion"
              type="text"
              required
              placeholder="Ej: Cobro Cupón AL30..."
              className="bg-byg-bg border border-byg-border rounded-xl px-3 py-2 text-sm text-byg-text focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {/* Cuentas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cuentas.map((cuenta) => (
            <div key={cuenta} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-byg-text border-b border-amber-500/20 pb-2">{cuenta}</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-byg-muted uppercase">USD</label>
                  <input
                    name={`usd_${cuenta}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="bg-byg-surface border border-byg-border rounded-lg px-2 py-1.5 text-xs font-bold tabular-nums text-byg-text focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-byg-muted uppercase">ARS</label>
                  <input
                    name={`ars_${cuenta}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="bg-byg-surface border border-byg-border rounded-lg px-2 py-1.5 text-xs font-bold tabular-nums text-byg-text focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-slate-900 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Plus size={16} />
                Registrar Operación
              </>
            )}
          </button>

          {state.error && (
            <p className="text-[11px] font-black uppercase text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 text-center">
              ⚠️ {state.error}
            </p>
          )}
          {state.ok && (
            <p className="text-[11px] font-black uppercase text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center">
              ✓ Operaciones registradas con éxito
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
