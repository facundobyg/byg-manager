"use client";

import { useActionState } from "react";
import { saveConfigComisionesBolsa } from "./actions";
import { CheckCircle2 } from "lucide-react";

const iCls =
  "w-24 border border-byg-border p-2 rounded-lg text-[12px] tabular-nums font-bold bg-byg-bg focus:outline-none focus:ring-1 focus:ring-byg-accent/40 text-right text-byg-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const lCls = "text-[10px] font-black uppercase tracking-widest text-byg-muted";

type Props = {
  iibbPct:  number;
  bancoPct: number;
  ipsPct:   number;
  otroPct:  number;
};

export function ConfigComisionesBolsaForm({ iibbPct, bancoPct, ipsPct, otroPct }: Props) {
  const [state, action, pending] = useActionState(saveConfigComisionesBolsa, null);

  return (
    <form action={action} className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label className={lCls}>IIBB %</label>
        <input type="number" name="iibbPct"  defaultValue={iibbPct}  step="any" min="0" className={iCls} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={lCls}>Banco %</label>
        <input type="number" name="bancoPct" defaultValue={bancoPct} step="any" min="0" className={iCls} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={lCls}>IPS %</label>
        <input type="number" name="ipsPct"   defaultValue={ipsPct}   step="any" min="0" className={iCls} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={lCls}>Otro %</label>
        <input type="number" name="otroPct"  defaultValue={otroPct}  step="any" min="0" className={iCls} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-[11px] font-black px-4 py-2 rounded-lg bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-widest disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>

      {state && "ok" in state && state.ok && (
        <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-black uppercase tracking-widest">
          <CheckCircle2 size={13} /> Guardado
        </span>
      )}
      {state && "error" in state && (
        <span className="text-rose-400 text-[11px] font-semibold">{state.error}</span>
      )}
    </form>
  );
}
