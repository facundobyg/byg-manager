"use client";

import { useActionState, useEffect } from "react";
import { editarPosicion } from "@/app/(dashboard)/carteras/actions";
import { Modal } from "@/components/ui/Modal";

type Props = {
  posicionId:         string;
  carteraSlug:        string;
  cantidadActual:     number;
  precioCompraActual: number;
  onClose:            () => void;
};

const iCls =
  "text-[12px] font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full";

export function EditarPosicionForm({
  posicionId,
  carteraSlug,
  cantidadActual,
  precioCompraActual,
  onClose,
}: Props) {
  const [state, action, pending] = useActionState(editarPosicion, null);

  useEffect(() => {
    if (state && "success" in state) onClose();
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal title="Ajuste de posición" accentColor="text-amber-600" onClose={onClose}>
      <form action={action} className="px-5 py-4 flex flex-col gap-3">
        <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Este ajuste modifica la posición manualmente y NO mueve el saldo de la cartera. Para registrar una compra o venta real, usá Bolsa.
        </p>
        <input type="hidden" name="posicionId"  value={posicionId} />
        <input type="hidden" name="carteraSlug" value={carteraSlug} />

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cantidad</label>
          <input name="cantidad" type="number" step="any" min="0.000001" defaultValue={cantidadActual} className={iCls} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Precio de costo / apertura</label>
          <input name="precioCompra" type="number" step="any" min="0.000001" defaultValue={precioCompraActual} className={iCls} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fecha del ajuste (opcional)</label>
          <input name="fecha" type="date" className={iCls} />
        </div>

        <label className="flex items-start gap-2 text-[11px] text-slate-700">
          <input type="checkbox" name="confirmarAjuste" value="on" required className="mt-0.5" />
          <span>Confirmo que es un <strong>ajuste sin movimiento de cash</strong>, no una compra ni una venta.</span>
        </label>

        {state && "error" in state && (
          <p className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">{state.error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-slate-900 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
            {pending ? "…" : "Registrar ajuste"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
