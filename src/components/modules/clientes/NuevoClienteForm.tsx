"use client";

import { useState, useEffect, useActionState } from "react";
import { PlusCircle, X } from "lucide-react";
import { crearCliente } from "@/app/(dashboard)/clientes/actions";

export function NuevoClienteForm({ socios = [] }: { socios?: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(crearCliente, null);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  const INPUT_CLS = "border border-byg-border rounded-xl px-3 py-2.5 text-sm font-medium text-byg-text bg-byg-bg focus:outline-none focus:ring-1 focus:ring-byg-accent/40 placeholder:text-byg-muted/50";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-byg-accent hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm shadow-blue-600/20"
      >
        <PlusCircle size={18} />
        Nuevo Cliente
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-byg-bg/70 backdrop-blur-[12px]"
          onClick={() => setOpen(false)}
        >
          <form
            action={action}
            className="bg-byg-surface rounded-2xl shadow-2xl p-6 flex flex-col gap-3 w-full max-w-sm mx-4 border border-byg-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-byg-text uppercase tracking-widest">Nuevo Cliente</span>
              <button type="button" onClick={() => setOpen(false)} className="text-byg-muted hover:text-byg-text transition-colors">
                <X size={15} />
              </button>
            </div>

            <input
              name="nombre"
              required
              placeholder="Nombre *"
              autoFocus
              className={INPUT_CLS}
            />
            <input
              name="email"
              type="email"
              placeholder="Email (opcional)"
              className={INPUT_CLS}
            />
            <input
              name="telefono"
              placeholder="Teléfono (opcional)"
              className={INPUT_CLS}
            />
            {socios.length > 0 && (
              <select name="socio" className={INPUT_CLS}>
                <option value="">Socio responsable (opcional)</option>
                {socios.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            {state?.error && (
              <p className="text-xs text-rose-400 font-semibold">{state.error}</p>
            )}

            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 bg-byg-accent hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-50 shadow-sm shadow-blue-600/20"
              >
                {pending ? "Guardando…" : "Crear cliente"}
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
