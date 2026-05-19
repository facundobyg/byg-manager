"use client";

import { useState, useEffect, useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import { anularOperacion } from "@/app/(dashboard)/bolsa/actions";

export function AnularForm({ operacionId }: { operacionId: string }) {
  const [open, setOpen]          = useState(false);
  const [state, action, pending] = useActionState(anularOperacion, null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      window.location.href = "/bolsa";
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/15 transition-colors uppercase tracking-wider border border-rose-500/20"
      >
        <AlertTriangle size={11} />
        Anular operación
      </button>
    );
  }

  return (
    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-5 flex flex-col gap-3">
      <p className="text-[11px] font-black text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
        <AlertTriangle size={13} />
        Confirmar anulación — acción irreversible
      </p>
      <p className="text-[11px] text-rose-400/70 leading-snug">
        La operación quedará marcada como ANULADA. No se borra físicamente.
      </p>

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="operacionId" value={operacionId} />
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">
            Motivo de anulación (obligatorio)
          </label>
          <textarea
            name="motivoAnulacion"
            rows={2}
            required
            placeholder="Describir el motivo…"
            className="w-full px-3 py-2 text-[12px] border border-rose-500/30 rounded-lg bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-rose-400/30 resize-none placeholder:text-byg-muted/50"
          />
        </div>

        {state && "error" in state && (
          <p className="text-[11px] text-rose-400 font-semibold">{state.error}</p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="text-[11px] font-black px-4 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors uppercase tracking-widest disabled:opacity-50"
          >
            {pending ? "Anulando…" : "Confirmar Anulación"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-byg-surface-2 text-byg-muted hover:bg-byg-border border border-byg-border transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
