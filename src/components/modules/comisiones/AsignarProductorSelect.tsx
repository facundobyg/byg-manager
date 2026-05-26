"use client";

import { useActionState } from "react";
import { asignarProductor } from "@/app/(dashboard)/comisiones/actions";

type ProductorOpt = { id: string; nombre: string; porcentaje: number };
type State = { success: true } | { error: string } | null;

export function AsignarProductorSelect({
  clienteId,
  productorIdActual,
  productores,
}: {
  clienteId: string;
  productorIdActual: string | null;
  productores: ProductorOpt[];
}) {
  const [state, action, pending] = useActionState<State, FormData>(asignarProductor, null);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="clienteId" value={clienteId} />
      <select
        name="productorId"
        defaultValue={productorIdActual ?? ""}
        className="px-2 py-1.5 rounded-lg bg-byg-surface border border-byg-border text-byg-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-byg-accent/40"
      >
        <option value="">— Sin productor —</option>
        {productores.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre} ({p.porcentaje}%)
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1.5 rounded-lg bg-byg-surface border border-byg-border text-byg-muted text-xs font-bold hover:bg-byg-surface-2 hover:text-byg-text disabled:opacity-50 transition-colors"
      >
        {pending ? "…" : "Guardar"}
      </button>
      {state && "error" in state && <span className="text-xs text-red-400">{state.error}</span>}
      {state && "success" in state && <span className="text-xs text-emerald-400">✓</span>}
    </form>
  );
}
