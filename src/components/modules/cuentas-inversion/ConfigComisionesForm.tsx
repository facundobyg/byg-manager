"use client";

import { useActionState } from "react";
import { saveComisionesConfig } from "@/app/(dashboard)/cuentas-inversion/comisiones/actions";
import { Save } from "lucide-react";

const iCls = "w-24 border border-slate-200 p-2 rounded-lg text-sm tabular-nums font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-right";

type Props = { iibbPct: number; ipsPct: number; otroPct: number };

export function ConfigComisionesForm({ iibbPct, ipsPct, otroPct }: Props) {
  const [state, action, pending] = useActionState(saveComisionesConfig, null);

  return (
    <form action={action} className="flex flex-wrap items-end gap-6">
      <div className="space-y-1">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">IIBB %</label>
        <input name="iibb_pct" type="number" step="0.01" min="0" max="100" defaultValue={iibbPct} className={iCls} />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Participación IPS %</label>
        <input name="ips_pct"  type="number" step="0.01" min="0" max="100" defaultValue={ipsPct}  className={iCls} />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Participación OTRO %</label>
        <input name="otro_pct" type="number" step="0.01" min="0" max="100" defaultValue={otroPct} className={iCls} />
      </div>
      <div className="flex items-center gap-3 pb-0.5">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition-all disabled:bg-slate-300 cursor-pointer"
        >
          <Save size={13} />
          {pending ? "Guardando…" : "Guardar configuración"}
        </button>
        {state?.success && <p className="text-emerald-600 text-xs font-bold">Guardado</p>}
        {state?.error   && <p className="text-red-600 text-xs font-bold">{state.error}</p>}
      </div>
    </form>
  );
}
