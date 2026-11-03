"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { liquidarOperacion } from "@/app/(dashboard)/bolsa/actions";

/** CONCERTADA → LIQUIDADA (settlement). Posición y saldo ya se impactaron al concertar. */
export function LiquidarForm({ operacionId, fechaLiquidacion }: { operacionId: string; fechaLiquidacion: string | null }) {
  const [state, action, pending] = useActionState(liquidarOperacion, null);

  if (state && "ok" in state && state.ok) {
    return <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Operación liquidada</p>;
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="operacionId" value={operacionId} />
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Fecha de liquidación</label>
        <input
          type="date"
          name="fechaLiquidacion"
          defaultValue={fechaLiquidacion ?? ""}
          className="px-3 py-1.5 text-[12px] border border-byg-border rounded-lg bg-byg-bg text-byg-text"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 transition-colors uppercase tracking-wider border border-emerald-500/20 disabled:opacity-50"
      >
        <CheckCircle2 size={11} />
        {pending ? "Liquidando…" : "Marcar liquidada"}
      </button>
      {state && "error" in state && <p className="text-[11px] text-rose-400 font-semibold w-full">{state.error}</p>}
    </form>
  );
}
