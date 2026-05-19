"use client";

import { useActionState } from "react";
import { updateMesActivo } from "@/app/(dashboard)/configuracion/actions";

type Props = { mesActual: string | null };

const init: { error?: string; ok?: boolean } = {};

export function MesActivoForm({ mesActual }: Props) {
  const [state, action, pending] = useActionState(updateMesActivo, init);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Mes activo (YYYY-MM)
          </label>
          <input
            name="mes"
            type="month"
            defaultValue={mesActual ?? ""}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-200"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black px-5 py-2 rounded-lg transition-colors"
        >
          {pending ? "Guardando…" : "Activar"}
        </button>
      </div>

      {state.error && <p className="text-xs text-red-500">{state.error}</p>}
      {state.ok    && <p className="text-xs text-green-600">Mes activo actualizado.</p>}
    </form>
  );
}
