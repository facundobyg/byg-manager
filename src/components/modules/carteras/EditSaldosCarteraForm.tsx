"use client";

import { useActionState } from "react";
import { updateSaldosCartera } from "@/app/(dashboard)/carteras/actions";

interface Props {
  carteraId:    string;
  slug:         string;
  saldoPesos:   number;
  saldoUSDCable: number;
  saldoUSDMep:  number;
  isCripto:     boolean;
}

const iCls =
  "text-[13px] font-bold text-byg-text border border-byg-border rounded-lg px-3 py-2 bg-byg-bg focus:ring-1 focus:ring-byg-accent/40 focus:border-byg-accent outline-none w-full tabular-nums";

const init: { error?: string; ok?: boolean } = {};

export function EditSaldosCarteraForm({
  carteraId,
  slug,
  saldoPesos,
  saldoUSDCable,
  saldoUSDMep,
  isCripto,
}: Props) {
  const [state, action, pending] = useActionState(updateSaldosCartera, init);

  return (
    <form action={action} className="p-5 flex flex-col gap-4">
      <input type="hidden" name="carteraId" value={carteraId} />
      <input type="hidden" name="slug" value={slug} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-byg-muted">
            {isCripto ? "USD (Exchange)" : "USD Cable"}
          </label>
          <input
            name="saldoUSDCable"
            type="number"
            step="0.01"
            min="0"
            defaultValue={saldoUSDCable}
            className={iCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-byg-muted">
            {isCripto ? "USD (Billetera)" : "USD MEP"}
          </label>
          <input
            name="saldoUSDMep"
            type="number"
            step="0.01"
            min="0"
            defaultValue={saldoUSDMep}
            className={iCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-byg-muted">
            {isCripto ? "ARS" : "Pesos (ARS)"}
          </label>
          <input
            name="saldoPesos"
            type="number"
            step="0.01"
            min="0"
            defaultValue={saldoPesos}
            className={iCls}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-byg-accent text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20"
        >
          {pending ? "Guardando…" : "Guardar saldos"}
        </button>
        {state.error && <span className="text-[11px] font-bold text-rose-400">{state.error}</span>}
        {state.ok    && <span className="text-[11px] font-bold text-emerald-400">✓ Guardado</span>}
      </div>
    </form>
  );
}
