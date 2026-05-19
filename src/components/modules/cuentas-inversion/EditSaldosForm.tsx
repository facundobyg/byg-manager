"use client";

import { useActionState } from "react";
import { updateSaldos } from "@/app/(dashboard)/cuentas-inversion/actions";
import { Save } from "lucide-react";

const iCls = "w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all font-bold tabular-nums";

type Props = {
  comitenteId: string;
  cuentaInversionId: string;
  saldoARS: number;
  saldoUSDCable: number;
  saldoUSDMep: number;
  cancelHref: string;
};

export function EditSaldosForm(props: Props) {
  const [state, action, pending] = useActionState(updateSaldos, null);

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Editar saldos</p>
      <form action={action} className="space-y-4">
        <input type="hidden" name="comitenteId" value={props.comitenteId} />
        <input type="hidden" name="cuentaInversionId" value={props.cuentaInversionId} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">ARS</label>
            <input
              name="saldoARS"
              type="number"
              step="0.01"
              min="0"
              defaultValue={props.saldoARS}
              className={iCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">USD Cable</label>
            <input
              name="saldoUSDCable"
              type="number"
              step="0.01"
              min="0"
              defaultValue={props.saldoUSDCable}
              className={iCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">USD MEP</label>
            <input
              name="saldoUSDMep"
              type="number"
              step="0.01"
              min="0"
              defaultValue={props.saldoUSDMep}
              className={iCls}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all disabled:bg-slate-300 cursor-pointer flex items-center gap-2"
          >
            <Save size={14} />
            {pending ? "Guardando…" : "Guardar saldos"}
          </button>
          <a href={props.cancelHref} className="px-5 py-2 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-700 transition-colors">
            Cancelar
          </a>
          {state?.error && <p className="text-red-600 text-xs font-bold">{state.error}</p>}
          {state?.success && <p className="text-emerald-700 text-xs font-bold">Saldos actualizados</p>}
        </div>
      </form>
    </div>
  );
}
