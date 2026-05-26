"use client";

import { useActionState } from "react";
import { crearProductor } from "@/app/(dashboard)/comisiones/actions";

type State = { success: true } | { error: string } | null;

export function CrearProductorForm() {
  const [state, action, pending] = useActionState<State, FormData>(crearProductor, null);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 p-4 bg-byg-bg rounded-xl border border-byg-border">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Nombre</label>
        <input
          name="nombre"
          required
          placeholder="IPS / ALEJO / …"
          className="px-3 py-2 rounded-lg bg-byg-surface border border-byg-border text-byg-text text-sm font-medium w-40 focus:outline-none focus:ring-2 focus:ring-byg-accent/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">% Comisión</label>
        <input
          name="porcentaje"
          type="number"
          min="0"
          max="100"
          step="0.01"
          required
          placeholder="30"
          className="px-3 py-2 rounded-lg bg-byg-surface border border-byg-border text-byg-text text-sm font-medium w-24 focus:outline-none focus:ring-2 focus:ring-byg-accent/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Notas</label>
        <input
          name="notas"
          placeholder="Opcional"
          className="px-3 py-2 rounded-lg bg-byg-surface border border-byg-border text-byg-text text-sm font-medium w-40 focus:outline-none focus:ring-2 focus:ring-byg-accent/40"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded-lg bg-byg-accent text-white text-sm font-bold hover:bg-byg-accent/90 disabled:opacity-50 transition-colors"
      >
        {pending ? "Creando…" : "Crear"}
      </button>
      {state && "error" in state && (
        <p className="w-full text-xs text-red-400 font-medium">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="w-full text-xs text-emerald-400 font-medium">Productor creado</p>
      )}
    </form>
  );
}
