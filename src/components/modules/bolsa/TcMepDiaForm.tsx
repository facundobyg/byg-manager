"use client";

import { useActionState } from "react";
import { actualizarTcMepDia } from "@/app/(dashboard)/bolsa/actions";

type Props = {
  valorHoy:    number | null;
  valorUltimo: number | null;
  fechaUltima: string | null;
};

const init: { error?: string; ok?: boolean } = {};

export function TcMepDiaForm({ valorHoy, valorUltimo, fechaUltima }: Props) {
  const [state, action, pending] = useActionState(actualizarTcMepDia, init);

  const placeholder = valorHoy != null
    ? String(valorHoy)
    : valorUltimo != null
    ? String(valorUltimo)
    : "0.00";

  return (
    <div className="bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">TC MEP del día</p>
        {valorHoy == null && valorUltimo != null && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
            ⚠ Sin TC hoy — usando {fechaUltima}
          </span>
        )}
        {valorHoy != null && (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
            Cargado hoy
          </span>
        )}
      </div>

      {valorHoy != null && (
        <p className="text-2xl font-black tabular-nums font-mono text-byg-text">
          $ {valorHoy.toFixed(2)}
        </p>
      )}

      <form action={action} className="flex items-center gap-2">
        <input
          name="valor"
          type="number"
          step="0.01"
          min="0"
          placeholder={placeholder}
          className="w-32 px-3 py-2 text-sm bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-byg-accent hover:bg-byg-accent/80 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-colors"
        >
          {pending ? "Guardando…" : valorHoy != null ? "Actualizar" : "Cargar"}
        </button>
      </form>

      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state.ok    && <p className="text-xs text-emerald-400">TC MEP guardado.</p>}
    </div>
  );
}
