"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearMovimientoCaja } from "@/app/(dashboard)/caja/actions";

export function NuevoMovimientoForm({ cajaId, slug }: { cajaId: string, slug: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(crearMovimientoCaja, null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  const fieldCls = "w-full border border-byg-border p-2.5 rounded-lg text-sm bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 transition-all font-medium";

  return (
    <form ref={formRef} action={action} className="max-w-2xl space-y-4">
      <h3 className="text-sm font-black text-byg-muted uppercase tracking-widest mb-4">Registrar Nuevo Movimiento</h3>

      <input type="hidden" name="cajaId" value={cajaId} />
      <input type="hidden" name="slug" value={slug} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Tipo</label>
          <select name="tipo" required className={fieldCls}>
            <option value="ENTRADA">Entrada (+)</option>
            <option value="SALIDA">Salida (-)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Moneda</label>
          <select name="moneda" required className={fieldCls}>
            <option value="USD">Dólares (USD)</option>
            <option value="ARS">Pesos (ARS)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Monto</label>
          <input
            name="monto"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            className={fieldCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Descripción</label>
          <input
            name="descripcion"
            placeholder="Ej: Depósito inicial..."
            className={fieldCls + " placeholder:text-byg-muted/50"}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-byg-accent hover:bg-blue-500 text-white py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-50 shadow-sm shadow-blue-600/20 cursor-pointer"
      >
        {isPending ? "Procesando..." : "Registrar en Libro"}
      </button>

      {state?.error && (
        <p className="text-center text-rose-400 text-xs font-bold bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-center text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
          {state.message}
        </p>
      )}
    </form>
  );
}
