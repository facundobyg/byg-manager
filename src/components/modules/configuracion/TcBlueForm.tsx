"use client";

import { useActionState } from "react";
import { updateTCBlue } from "@/app/(dashboard)/configuracion/actions";
import { useConfigLock } from "./ConfigLockProvider";
import { isConfigFormEditable } from "@/lib/locks/configFormPredicate";

type Props = { valorActual: string | null };

const init: { error?: string; ok?: boolean } = {};

export function TcBlueForm({ valorActual }: Props) {
  const [state, action, pending] = useActionState(updateTCBlue, init);
  const { mode, ownerClientId } = useConfigLock();
  const canEdit = isConfigFormEditable(mode);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="ownerClientId" value={ownerClientId ?? ""} />
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Nuevo TC Blue (USD → ARS)
          </label>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            placeholder={valorActual ?? "0.00"}
            disabled={!canEdit}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-200 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>
        <button
          type="submit"
          disabled={pending || !canEdit}
          className="mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black px-5 py-2 rounded-lg transition-colors"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {state.error && <p className="text-xs text-red-500">{state.error}</p>}
      {state.ok    && <p className="text-xs text-green-600">TC Blue actualizado y guardado en historial.</p>}
    </form>
  );
}
