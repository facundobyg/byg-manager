"use client";

import { useState, useEffect, useActionState } from "react";
import { Pencil, X, Loader2 } from "lucide-react";
import { actualizarTasaCC } from "@/app/(dashboard)/clientes/actions";
import { readOnlyPreview } from "@/lib/config";

interface Props {
  clienteId: string;
  cuentaId: string;
  tasaActual: number;
}

export function EditarTasaCCForm({ clienteId, cuentaId, tasaActual }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(actualizarTasaCC, null);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  if (readOnlyPreview) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border border-byg-border text-byg-muted hover:border-byg-accent hover:text-byg-accent transition-colors uppercase tracking-wider"
      >
        <Pencil size={10} />
        Cambiar tasa
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-byg-bg/60 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="bg-byg-surface rounded-2xl shadow-2xl p-5 flex flex-col gap-4 w-full max-w-xs mx-4 border border-byg-border"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-byg-text uppercase tracking-widest">Modificar Tasa CC</span>
              <button type="button" onClick={() => setOpen(false)} className="text-byg-muted hover:text-byg-text">
                <X size={15} />
              </button>
            </div>

            <form action={action} className="flex flex-col gap-3">
              <input type="hidden" name="clienteId" value={clienteId} />
              <input type="hidden" name="cuentaId" value={cuentaId} />

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">
                  Tasa TNA (%)
                </label>
                <input
                  type="number"
                  name="tasaCC"
                  required
                  step="0.01"
                  min="0"
                  defaultValue={+(tasaActual * 100).toFixed(4)}
                  placeholder="5"
                  className="border border-byg-border rounded-xl px-3 py-2 text-sm font-black text-byg-text bg-byg-bg focus:outline-none focus:ring-1 focus:ring-byg-accent/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <p className="text-[10px] text-byg-muted">Ejemplo: 2 = 2% anual</p>
              </div>

              {state?.error && (
                <p className="text-[11px] text-rose-400 font-bold">{state.error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-byg-accent hover:bg-blue-500 text-white rounded-xl py-2 text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm shadow-blue-600/20"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 border border-byg-border text-byg-muted rounded-xl py-2 text-sm font-medium hover:bg-byg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
