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
    <Modal title="Eliminar posición" accentColor="text-rose-700" onClose={onClose}>
      <div className="px-5 py-4 flex flex-col gap-4">
        {!confirmed ? (
          <>
            <p className="text-[12px] text-slate-600 leading-snug">
              ¿Eliminar la posición de{" "}
              <span className="font-black text-slate-900 font-mono">{ticker}</span>?
              Esta acción no se puede deshacer.
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

            <p className="text-[11px] text-slate-500">Confirmando eliminación de <span className="font-black text-slate-800 font-mono">{ticker}</span>…</p>

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
