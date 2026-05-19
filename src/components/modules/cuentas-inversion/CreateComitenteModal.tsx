"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createComitente } from "@/app/(dashboard)/cuentas-inversion/actions";
import type { ProductorOption } from "@/lib/services/config.service";
import { UserPlus, X } from "lucide-react";

const iCls =
  "w-full border border-byg-border p-2 rounded-lg text-sm bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 transition-all font-medium";

const DEFAULT_PRODUCTORES: ProductorOption[] = [
  { label: "BYG", value: "BYG", activo: true },
  { label: "Otro", value: "OTRO", activo: true },
];

export function CreateComitenteModal({
  cuentaInversionId,
  productores = DEFAULT_PRODUCTORES,
}: {
  cuentaInversionId: string;
  productores?: ProductorOption[];
}) {
  const [open, setOpen]          = useState(false);
  const formRef                  = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createComitente, null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest bg-byg-accent text-white hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/20"
      >
        <UserPlus size={13} />
        Nuevo Comitente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-byg-bg/70 backdrop-blur-[12px]">
          <div className="bg-byg-surface rounded-2xl shadow-2xl w-full max-w-xl border border-byg-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-byg-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-byg-accent/10 text-byg-accent rounded-lg">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">Nuevo Comitente</h3>
                  <p className="text-[10px] text-byg-muted font-bold uppercase mt-0.5">Alta de comitente en esta cuenta</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-byg-surface-2 transition-colors"
              >
                <X size={16} className="text-byg-muted" />
              </button>
            </div>

            <form ref={formRef} action={action} className="p-6 space-y-4">
              <input type="hidden" name="cuentaInversionId" value={cuentaInversionId} />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-byg-muted uppercase ml-0.5">N° Comitente *</label>
                  <input name="nroComitente" required placeholder="ej: 12345" className={iCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-byg-muted uppercase ml-0.5">Nombre *</label>
                  <input name="nombre" required placeholder="Nombre del titular" className={iCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-byg-muted uppercase ml-0.5">Razón social</label>
                  <input name="razonSocial" placeholder="Opcional" className={iCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-byg-muted uppercase ml-0.5">Productor *</label>
                  <select name="productor" required className={iCls}>
                    {productores.filter((p) => p.activo).map((p) => (
                      <option key={p.label} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-byg-muted uppercase ml-0.5">Notas</label>
                  <input name="notas" placeholder="Opcional" className={iCls} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="esPropioBYG"
                    value="true"
                    className="w-4 h-4 rounded border-byg-border accent-byg-accent"
                  />
                  <span className="text-sm font-medium text-byg-text">Comitente propio BYG</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1 border-t border-byg-border">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2 bg-byg-accent hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  <UserPlus size={14} />
                  {pending ? "Guardando…" : "Crear comitente"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-byg-muted hover:text-byg-text transition-colors"
                >
                  Cancelar
                </button>
                {state?.error && <p className="text-rose-400 text-xs font-bold">{state.error}</p>}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
