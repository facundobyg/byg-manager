"use client";

import { useActionState, useState } from "react";
import { eliminarPosicion } from "@/app/(dashboard)/carteras/actions";
import { Modal } from "@/components/ui/Modal";

type Props = {
  posicionId:  string;
  carteraSlug: string;
  ticker:      string;
  onClose:     () => void;
};

export function EliminarPosicionButton({ posicionId, carteraSlug, ticker, onClose }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [state, action, pending]  = useActionState(eliminarPosicion, null);

  return (
    <Modal title="Baja de posición (ajuste)" accentColor="text-rose-700" onClose={onClose}>
      <div className="px-5 py-4 flex flex-col gap-4">
        {!confirmed ? (
          <>
            <p className="text-[12px] text-slate-600 leading-snug">
              ¿Dar de baja la posición de{" "}
              <span className="font-black text-slate-900 font-mono">{ticker}</span>?
              Esta acción no se puede deshacer.
            </p>
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 leading-snug">
              Es un <strong>AJUSTE / APERTURA</strong>: elimina la tenencia <strong>sin movimiento de cash</strong> y
              <strong> no es una venta</strong> (no registra resultado). Para vender, usá Bolsa.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={() => setConfirmed(true)} className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors">
                Sí, eliminar
              </button>
            </div>
          </>
        ) : (
          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="posicionId"  value={posicionId} />
            <input type="hidden" name="carteraSlug" value={carteraSlug} />

            <label className="flex items-start gap-2 text-[11px] text-slate-700">
              <input type="checkbox" name="confirmarAjuste" value="on" required className="mt-0.5" />
              <span>Confirmo que la baja de <strong className="font-mono">{ticker}</strong> es un <strong>ajuste sin movimiento de cash</strong>, no una venta.</span>
            </label>

            {state && "error" in state && (
              <p className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">{state.error}</p>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmed(false)} className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                Atrás
              </button>
              <button type="submit" disabled={pending} className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 transition-colors">
                {pending ? "…" : "Confirmar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
