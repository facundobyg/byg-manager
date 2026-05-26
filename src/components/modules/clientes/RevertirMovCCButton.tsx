"use client";

import { useActionState, useState } from "react";
import { revertirMovimientoCC } from "@/app/(dashboard)/clientes/actions";
import { RotateCcw, X } from "lucide-react";

export function RevertirMovCCButton({ id }: { id: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const [state, action, pending] = useActionState(revertirMovimientoCC, null);

  if (state?.ok) {
    return <span className="text-[9px] text-slate-400 font-bold uppercase">Revertido</span>;
  }

  if (!confirmed) {
    return (
      <button
        type="button"
        onClick={() => setConfirmed(true)}
        title="Revertir movimiento"
        className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors rounded-lg hover:bg-amber-50"
      >
        <RotateCcw size={13} />
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-[9px] font-black uppercase text-amber-700 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
      >
        {pending ? "..." : "Revertir"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmed(false)}
        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={10} />
      </button>
      {state?.error && (
        <span className="text-[9px] text-red-500 font-semibold ml-1">{state.error}</span>
      )}
    </form>
  );
}
