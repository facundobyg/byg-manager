"use client";

import { useActionState } from "react";
import { updatePrecioActivo } from "@/app/(dashboard)/configuracion/actions";
import { formatearNumeroAR } from "@/lib/numero-ar";
import { Check, Loader2 } from "lucide-react";

type Props = {
  activoId: string;
  /** Precio actual CANÓNICO ("1.707824") o "" si no tiene. */
  precioActual: string;
  moneda: string;
};

const init: { error?: string; ok?: boolean } = {};

// P1-03B: input de TEXTO en formato argentino (el server lo valida estricto). Un
// type="number" mandaría el valor con punto decimal según el navegador.
export function UpdatePrecioActivoForm({ activoId, precioActual, moneda }: Props) {
  const [state, action, pending] = useActionState(updatePrecioActivo, init);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input type="hidden" name="activoId" value={activoId} />
        <div className="relative flex items-center">
          <span className="absolute left-2.5 text-[9px] font-bold text-byg-muted uppercase pointer-events-none">
            {moneda}
          </span>
          <input
            name="precioActual"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={precioActual ? formatearNumeroAR(precioActual) : ""}
            placeholder="1.234,56"
            title="Formato argentino: miles con punto, decimales con coma"
            className="w-28 text-[12px] font-black tabular-nums font-mono border border-byg-border rounded-lg pl-9 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-byg-accent/40 bg-byg-surface-2 text-byg-text"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="p-1.5 bg-byg-accent hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors shadow-sm shadow-blue-600/20"
          title="Actualizar precio"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        </button>
      </div>
      {state.error && <p className="text-[9px] text-red-500 font-bold max-w-[260px] text-right">{state.error}</p>}
      {state.ok && <p className="text-[9px] text-emerald-400 font-bold uppercase">✓ Guardado</p>}
    </form>
  );
}
