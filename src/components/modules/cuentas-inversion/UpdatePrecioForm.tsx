"use client";

import { useActionState, useRef, useEffect } from "react";
import { updatePreciosByTicker } from "@/app/(dashboard)/cuentas-inversion/holdings-actions";
import { Check } from "lucide-react";

type Props = { cuentaId: string; ticker: string; precioActual: number | null };

export function UpdatePrecioForm({ cuentaId, ticker, precioActual }: Props) {
  const [state, action, pending] = useActionState(updatePreciosByTicker, null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset success flash after 3 s
  useEffect(() => {
    if (state?.success && inputRef.current) {
      const t = setTimeout(() => {
        // no-op — state stays, but we let the badge auto-fade via CSS
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name="cuentaId" value={cuentaId} />
      <input type="hidden" name="ticker"   value={ticker} />
      <input
        ref={inputRef}
        name="precioActual"
        type="number"
        step="0.000001"
        min="0"
        required
        defaultValue={precioActual ?? ""}
        placeholder="0.000000"
        className="w-28 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs tabular-nums font-medium bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 transition-colors cursor-pointer flex items-center gap-1"
      >
        {pending ? "…" : "Guardar"}
      </button>
      {state?.success && (
        <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold animate-pulse">
          <Check size={12} /> OK
        </span>
      )}
      {state?.error && (
        <span className="text-red-600 text-[10px] font-bold">{state.error}</span>
      )}
    </form>
  );
}
