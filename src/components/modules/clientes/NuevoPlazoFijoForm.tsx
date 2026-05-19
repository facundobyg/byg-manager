"use client";

import { useState, useEffect, useActionState } from "react";
import { Plus, X } from "lucide-react";
import { crearPlazoFijoSimple } from "@/app/(dashboard)/clientes/actions";

export function NuevoPlazoFijoForm({ clienteId }: { clienteId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(crearPlazoFijoSimple, null);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  const today = new Date().toISOString().split("T")[0];
  const INPUT_CLS = "border border-byg-border rounded-xl px-3 py-2 text-sm text-byg-text font-bold bg-byg-bg focus:outline-none focus:ring-1 focus:ring-emerald-400/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-byg-surface-2 text-byg-muted hover:bg-emerald-500/10 hover:text-emerald-400 border border-byg-border transition-colors uppercase tracking-wider"
      >
        <Plus size={11} /> Nuevo PF
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-byg-bg/70 backdrop-blur-[12px]"
          onClick={() => setOpen(false)}
        >
          <form
            action={action}
            className="bg-byg-surface rounded-2xl shadow-2xl p-6 flex flex-col gap-4 w-full max-w-sm mx-4 border border-byg-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Registrar Plazo Fijo</span>
              <button type="button" onClick={() => setOpen(false)} className="text-byg-muted hover:text-byg-text transition-colors">
                <X size={14} />
              </button>
            </div>
            <p className="text-[10px] text-byg-muted font-medium -mt-2">
              Solo registra el PF. No mueve saldo de CC.
            </p>

            <input type="hidden" name="clienteId" value={clienteId} />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Moneda</label>
                <select
                  name="moneda"
                  required
                  defaultValue="USD"
                  className={INPUT_CLS}
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                  <option value="EUR">EUR</option>
                  <option value="BRL">BRL</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Capital</label>
                <input
                  name="capital"
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className={INPUT_CLS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Tasa anual %</label>
                <input
                  name="tasaAnual"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={INPUT_CLS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Inicio</label>
                <input
                  name="fechaInicio"
                  required
                  type="date"
                  defaultValue={today}
                  className={INPUT_CLS}
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Vencimiento</label>
                <input
                  name="fechaVencimiento"
                  required
                  type="date"
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {state?.error && (
              <p className="text-xs text-rose-400 font-semibold">{state.error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-50 shadow-sm shadow-emerald-600/20"
              >
                {pending ? "Guardando…" : "Registrar PF"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 border border-byg-border text-byg-muted rounded-xl py-2.5 text-sm font-medium hover:bg-byg-surface-2 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
