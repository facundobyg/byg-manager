"use client";

import { useActionState } from "react";
import { deleteComitente } from "@/app/(dashboard)/cuentas-inversion/actions";
import { Trash2 } from "lucide-react";

type Props = { id: string; cuentaInversionId: string };

export function DeleteComitenteButton({ id, cuentaInversionId }: Props) {
  const [state, action, pending] = useActionState(deleteComitente, null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("¿Eliminar este comitente? Esta acción no se puede deshacer.")) {
          e.preventDefault();
        }
      }}
      className="inline-flex flex-col items-start gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="cuentaInversionId" value={cuentaInversionId} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Trash2 size={12} />
        {pending ? "…" : "Eliminar"}
      </button>
      {state?.error && (
        <p className="text-red-600 text-[10px] font-bold max-w-40">{state.error}</p>
      )}
    </form>
  );
}
