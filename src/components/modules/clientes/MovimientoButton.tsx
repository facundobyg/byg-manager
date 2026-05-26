"use client";

import { useState, useEffect, useActionState, useRef } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { crearMovimientoCC } from "@/app/(dashboard)/clientes/actions";
import { readOnlyPreview } from "@/lib/config";

type CajaOption = { id: string; label: string };

export function MovimientoButton({
  cuentaId,
  clienteId,
  cajas = [],
}: {
  cuentaId: string;
  clienteId: string;
  cajas?: CajaOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(crearMovimientoCC, null);
  const [impactaCaja, setImpactaCaja] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setImpactaCaja(false);
      setOpen(false);
    }
  }, [state]);

  if (readOnlyPreview) return null;

  const INPUT_CLS = "border border-byg-border rounded-xl px-3 py-2 text-sm text-byg-text bg-byg-bg focus:outline-none focus:ring-1 focus:ring-byg-accent/40";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] font-black px-4 py-2 rounded-xl bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-wider shadow-sm shadow-blue-600/20"
      >
        <Plus size={13} /> Movimiento
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-byg-bg/70 backdrop-blur-[12px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-byg-surface rounded-2xl shadow-2xl p-5 flex flex-col gap-3 w-full max-w-xs mx-4 border border-byg-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-byg-text uppercase tracking-widest">Nuevo Movimiento</span>
              <button type="button" onClick={() => setOpen(false)} className="text-byg-muted hover:text-byg-text transition-colors">
                <X size={15} />
              </button>
            </div>

            <form ref={formRef} action={action} className="flex flex-col gap-3">
              <input type="hidden" name="cuentaId" value={cuentaId} />
              <input type="hidden" name="clienteId" value={clienteId} />

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Tipo</label>
                <select name="tipo" required className={`${INPUT_CLS} font-bold`}>
                  <option value="INGRESO">INGRESO (Haber +)</option>
                  <option value="EGRESO">EGRESO (Debe −)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-byg-muted font-bold text-sm">$</span>
                  <input
                    type="number"
                    name="monto"
                    required
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="w-full border border-byg-border rounded-xl pl-7 pr-3 py-2 text-sm font-black text-byg-text bg-byg-bg focus:outline-none focus:ring-1 focus:ring-byg-accent/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Descripción</label>
                <input
                  type="text"
                  name="descripcion"
                  placeholder="Motivo o referencia..."
                  className={`${INPUT_CLS} placeholder:text-byg-muted/50`}
                />
              </div>

              {/* Impacta caja */}
              <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
                <input
                  type="checkbox"
                  name="impactaCaja"
                  checked={impactaCaja}
                  onChange={(e) => setImpactaCaja(e.target.checked)}
                  className="w-4 h-4 accent-byg-accent cursor-pointer"
                />
                <span className="text-[10px] font-bold text-byg-muted group-hover:text-byg-text transition-colors uppercase tracking-wider">
                  Impacta Caja
                </span>
              </label>

              {impactaCaja && cajas.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Caja</label>
                  <select name="cajaImpactoId" required={impactaCaja} className={`${INPUT_CLS} font-medium`}>
                    <option value="">Seleccionar caja…</option>
                    {cajas.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {state?.error && (
                <p className="text-[11px] text-rose-400 font-bold leading-tight">{state.error}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-byg-accent hover:bg-blue-500 text-white rounded-xl py-2 text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm shadow-blue-600/20"
                >
                  {isPending ? <Loader2 size={15} className="animate-spin" /> : "Registrar"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 border border-byg-border text-byg-muted rounded-xl py-2 text-sm font-medium hover:bg-byg-surface-2 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
