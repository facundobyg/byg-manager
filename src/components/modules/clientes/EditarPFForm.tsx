"use client";

import { useActionState, useState } from "react";
import { editarPlazoFijo } from "@/app/(dashboard)/clientes/actions";
import { Pencil, X, Check } from "lucide-react";

type Props = {
  pfId: string;
  clienteId: string;
  capital: number;
  tasaAnual: number;
  fechaInicio: string;
  fechaVencimiento: string;
  saldoActual: number;
  estado: string;
};

const ESTADOS = ["ACTIVO", "VENCIDO", "CANCELADO", "RENOVADO"] as const;

export function EditarPFForm({ pfId, clienteId, capital, tasaAnual, fechaInicio, fechaVencimiento, saldoActual, estado }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(editarPlazoFijo, null);

  if (state?.ok) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest">
        <Check size={14} /> Guardado
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors uppercase tracking-wider"
      >
        <Pencil size={12} /> Editar PF
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Editar Plazo Fijo</h2>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
      <form action={action} className="px-6 py-5">
        <input type="hidden" name="pfId" value={pfId} />
        <input type="hidden" name="clienteId" value={clienteId} />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capital</label>
            <input
              name="capital"
              type="number"
              step="0.01"
              defaultValue={capital}
              required
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tasa anual (%)</label>
            <input
              name="tasaAnual"
              type="number"
              step="0.0001"
              defaultValue={tasaAnual}
              required
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saldo actual</label>
            <input
              name="saldoActual"
              type="number"
              step="0.01"
              defaultValue={saldoActual}
              required
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha inicio</label>
            <input
              name="fechaInicio"
              type="date"
              defaultValue={fechaInicio}
              required
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha vencimiento</label>
            <input
              name="fechaVencimiento"
              type="date"
              defaultValue={fechaVencimiento}
              required
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</label>
            <select
              name="estado"
              defaultValue={estado}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        {state?.error && (
          <p className="mt-3 text-xs text-red-500 font-medium">{state.error}</p>
        )}

        <div className="flex items-center gap-3 mt-5">
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 text-[10px] font-black px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-blue-600 transition-colors uppercase tracking-wider disabled:opacity-50"
          >
            <Check size={12} /> {pending ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[10px] font-black px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors uppercase tracking-wider"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
