"use client";

import { useActionState } from "react";
import { transferirActivo } from "@/app/(dashboard)/cartera/actions";

type Cliente = { id: string; nombre: string };

type Props = {
  posicionId: string;
  clientes: Cliente[];
};

const initialState = null as { error?: string; success?: boolean } | null;

export function TransferirActivoForm({ posicionId, clientes }: Props) {
  const [state, action, pending] = useActionState(transferirActivo, initialState);

  if (state?.success) {
    return <span className="text-[10px] font-semibold text-green-600">Transferido</span>;
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      <form action={action} className="flex items-center gap-1">
        <input type="hidden" name="posicionId" value={posicionId} />
        <select
          name="clienteId"
          required
          className="text-[10px] border border-slate-200 rounded px-1.5 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-200"
        >
          <option value="">Cliente...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <input
          type="number"
          name="cantidad"
          step="0.000001"
          min="0.000001"
          placeholder="Cant."
          required
          className="w-20 text-[10px] border border-slate-200 rounded px-1.5 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-200 tabular-nums"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-[10px] font-black px-2 py-1 rounded bg-slate-900 text-white hover:bg-blue-600 transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          {pending ? "..." : "Transferir"}
        </button>
      </form>
      {state?.error && (
        <span className="text-[10px] text-red-500 max-w-[200px] text-right">{state.error}</span>
      )}
    </div>
  );
}
