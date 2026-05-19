"use client";

import { useActionState, useEffect, useRef } from "react";
import { asignarACustodia } from "@/app/(dashboard)/carteras/actions";
import { Modal } from "@/components/ui/Modal";

type Cliente = { id: string; nombre: string };

type Props = {
  posicionId:  string;
  carteraSlug: string;
  cantidadMax: number;
  clientes:    Cliente[];
  onClose:     () => void;
};

const iCls =
  "text-[12px] font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none w-full";

export function AsignarCustodiaForm({ posicionId, carteraSlug, cantidadMax, clientes, onClose }: Props) {
  const [state, action, pending] = useActionState(asignarACustodia, null);
  const cantidadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state && "success" in state) onClose();
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal title="Asignar a custodia" accentColor="text-amber-700" onClose={onClose}>
      <form action={action} className="px-5 py-4 flex flex-col gap-3">
        <input type="hidden" name="posicionId"  value={posicionId} />
        <input type="hidden" name="carteraSlug" value={carteraSlug} />

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cliente</label>
          <select name="clienteId" className={iCls}>
            {clientes.length === 0 && <option value="" disabled>Sin clientes activos</option>}
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cantidad</label>
            <button
              type="button"
              onClick={() => { if (cantidadRef.current) cantidadRef.current.value = String(cantidadMax); }}
              className="text-[9px] font-black uppercase text-amber-600 hover:text-amber-800"
            >
              Todo ({cantidadMax})
            </button>
          </div>
          <input ref={cantidadRef} name="cantidad" type="number" step="any" min="0.000001" max={cantidadMax} placeholder="0.00" className={iCls} />
        </div>

        <p className="text-[9px] text-slate-400 leading-snug">
          Se descuenta de la posición propia y no suma al valor de cartera.
        </p>

        {state && "error" in state && (
          <p className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">{state.error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={pending || clientes.length === 0} className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
            {pending ? "…" : "Asignar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
