"use client";

import { useActionState, useEffect, useRef } from "react";
import { transferirEntreCajas } from "@/app/(dashboard)/caja/actions";
import { ArrowRightLeft, Banknote } from "lucide-react";

const fieldCls = "w-full border border-byg-border p-3 rounded-xl text-sm bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 transition-all font-medium";

export function TransferenciaForm({ cajas }: { cajas: any[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(transferirEntreCajas, null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="mb-8 w-full max-w-4xl">
      <form
        ref={formRef}
        action={action}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-byg-border pb-4 mb-2">
          <div className="p-2 bg-byg-accent/10 text-byg-accent rounded-lg">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">
              Transferencia entre Cajas
            </h3>
            <p className="text-[10px] text-byg-muted font-bold uppercase mt-0.5">
              Movimiento de disponibilidades internas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Caja Origen</label>
            <select name="origenId" required className={fieldCls}>
              <option value="">Seleccionar Origen</option>
              {cajas.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Caja Destino</label>
            <select name="destinoId" required className={fieldCls}>
              <option value="">Seleccionar Destino</option>
              {cajas.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Moneda</label>
            <select name="moneda" className={fieldCls + " font-bold"}>
              <option value="USD">Dólares (USD)</option>
              <option value="ARS">Pesos (ARS)</option>
            </select>
          </div>

          <div className="space-y-1 lg:col-span-1">
            <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Monto a Transferir</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-byg-muted">
                <Banknote size={16} />
              </div>
              <input
                name="monto"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                className={fieldCls + " pl-10 font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"}
              />
            </div>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Motivo / Descripción</label>
            <input
              name="descripcion"
              placeholder="Ej: Fondeo para pagos, arqueo, etc..."
              className={fieldCls + " placeholder:text-byg-muted/50"}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full md:w-auto px-8 bg-byg-accent hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {isPending ? "Procesando..." : (
            <>
              <ArrowRightLeft size={16} />
              Ejecutar Transferencia
            </>
          )}
        </button>

        {state?.error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            <p className="text-rose-400 text-xs font-bold">{state.error}</p>
          </div>
        )}

        {state?.success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-tight">Transferencia realizada con éxito</p>
          </div>
        )}
      </form>
    </div>
  );
}
