"use client";

import { useActionState } from "react";
import { updateSociosPorcentaje } from "@/app/(dashboard)/configuracion/actions";
import { readOnlyPreview } from "@/lib/config";

type Socio = { id: string; nombre: string; porcentaje: number; activo: boolean };

export function SociosForm({ socios }: { socios: Socio[] }) {
  const [state, action, pending] = useActionState(updateSociosPorcentaje, null);

  return (
    <form action={action}>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Nombre</th>
            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Porcentaje</th>
            <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {socios.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-3 text-sm font-medium text-slate-800">
                <input type="hidden" name="socioId" value={s.id} />
                {s.nombre}
              </td>
              <td className="px-6 py-3 text-right">
                <input
                  type="number"
                  name="porcentaje"
                  defaultValue={s.porcentaje}
                  step="0.01"
                  min="0"
                  max="100"
                  disabled={readOnlyPreview || !s.activo}
                  className="w-24 text-right text-sm tabular-nums font-semibold text-slate-700 border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
                <span className="ml-1 text-sm text-slate-400">%</span>
              </td>
              <td className="px-6 py-3 text-center">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${s.activo ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                  {s.activo ? "Activo" : "Inactivo"}
                </span>
              </td>
            </tr>
          ))}
          <tr className="bg-slate-50 border-t border-slate-200">
            <td className="px-6 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Total activos</td>
            <td className="px-6 py-3 text-sm tabular-nums text-right font-black text-slate-800">
              {socios.filter((s) => s.activo).reduce((acc, s) => acc + s.porcentaje, 0).toFixed(2)}%
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      {!readOnlyPreview && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar distribución"}
          </button>
          {state?.error && (
            <p className="text-xs font-bold text-red-600">{state.error}</p>
          )}
          {state?.ok && (
            <p className="text-xs font-bold text-green-600">Guardado correctamente</p>
          )}
        </div>
      )}
    </form>
  );
}
