"use client";

import { useActionState } from "react";
import { deleteHolding } from "@/app/(dashboard)/cuentas-inversion/holdings-actions";
import { Trash2 } from "lucide-react";

type Props = { holdingId: string; comitenteId: string; cuentaInversionId: string };

export function DeleteHoldingButton({ holdingId, comitenteId, cuentaInversionId }: Props) {
  const [state, action, pending] = useActionState(deleteHolding, null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("¿Eliminar este holding? Se eliminará también su historial.")) {
          e.preventDefault();
        }
      }}
      className="inline-flex flex-col items-start gap-1"
    >
      <input type="hidden" name="holdingId" value={holdingId} />
      <input type="hidden" name="comitenteId" value={comitenteId} />
      <input type="hidden" name="cuentaInversionId" value={cuentaInversionId} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Trash2 size={12} />
        {pending ? "…" : "Eliminar"}
      </button>
      {state?.error && <p className="text-red-600 text-[10px] font-bold max-w-40">{state.error}</p>}
    </form>
  );
}
