"use client";

import { useActionState } from "react";
import { reconciliarSaldoCC } from "@/app/(dashboard)/clientes/actions";
import { RefreshCw } from "lucide-react";

type State = { error?: string; ok?: boolean; diferencia?: string } | null;

export function ReconcileSaldoCCButton({
  cuentaId,
  clienteId,
}: {
  cuentaId: string;
  clienteId: string;
}) {
  const [state, dispatch, pending] = useActionState<State, FormData>(reconciliarSaldoCC, null);

  return (
    <form action={dispatch} className="flex items-center gap-2">
      <input type="hidden" name="cuentaId" value={cuentaId} />
      <input type="hidden" name="clienteId" value={clienteId} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={11} className={pending ? "animate-spin" : ""} />
        Reconciliar saldo
      </button>
      {state?.error && (
        <span className="text-[10px] text-red-600 font-medium">{state.error}</span>
      )}
      {state?.ok && state.diferencia !== undefined && (
        <span className="text-[10px] font-medium text-emerald-600">
          {state.diferencia === "0.00" ? "Saldo correcto" : `Ajustado: ${state.diferencia}`}
        </span>
      )}
    </form>
  );
}
