"use client";

import { useState, useEffect, useActionState } from "react";
import { Plus, X } from "lucide-react";
import { crearCuentaCorriente } from "@/app/(dashboard)/clientes/actions";

export function NuevaCuentaCorrienteForm({ clienteId }: { clienteId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(crearCuentaCorriente, null);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-byg-surface-2 text-byg-muted hover:bg-byg-accent/10 hover:text-byg-accent border border-byg-border transition-colors uppercase tracking-wider"
      >
        <Plus size={11} /> Nueva CC
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-byg-bg/70 backdrop-blur-[12px]"
          onClick={() => setOpen(false)}
        >
          <form
            action={action}
            className="bg-byg-surface rounded-2xl shadow-2xl p-6 flex flex-col gap-4 w-full max-w-xs mx-4 border border-byg-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-byg-text uppercase tracking-widest">Nueva Cuenta Corriente</span>
              <button type="button" onClick={() => setOpen(false)} className="text-byg-muted hover:text-byg-text transition-colors">
                <X size={15} />
              </button>
            </div>

            <input type="hidden" name="clienteId" value={clienteId} />

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Moneda</label>
              <select
                name="moneda"
                required
                defaultValue="USD"
                className="border border-byg-border rounded-xl px-3 py-2.5 text-sm font-bold text-byg-text bg-byg-bg focus:outline-none focus:ring-1 focus:ring-byg-accent/40"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>

            {state?.error && (
              <p className="text-xs text-rose-400 font-semibold">{state.error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 bg-byg-accent hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-50 shadow-sm shadow-blue-600/20"
              >
                {pending ? "Creando…" : "Crear cuenta"}
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
