"use client";

// P1-03B — Instrumentos MANUALES (FCI/CRIPTO): el banco informa VN + valuación total.
// El usuario NO calcula el precio: el server lo calcula (valuación ÷ VN, Decimal, 6 decimales),
// valida que el VN coincida con la tenencia registrada (no lo modifica) y audita la carga.

import { useActionState } from "react";
import { registrarValuacionManual, type ValuacionManualState } from "@/app/(dashboard)/configuracion/actions";
import { formatearNumeroAR } from "@/lib/numero-ar";
import { Check, Loader2 } from "lucide-react";

type Props = {
  activoId: string;
  moneda: string;
  /** Tenencia registrada (canónica, ej. "30088"): prellena el VN. */
  vnRegistrado: string | null;
  /** Hoy argentino "YYYY-MM-DD": default y máximo de la fecha valor. */
  hoy: string;
};

const init: ValuacionManualState = {};
const inputCls =
  "text-[12px] font-black tabular-nums font-mono border border-byg-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-byg-accent/40 bg-byg-surface-2 text-byg-text";

export function ValuacionManualForm({ activoId, moneda, vnRegistrado, hoy }: Props) {
  const [state, action, pending] = useActionState(registrarValuacionManual, init);
  const r = state.resultado;

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="activoId" value={activoId} />
      <div className="flex flex-wrap items-end justify-end gap-2">
        <label className="flex flex-col items-start gap-0.5">
          <span className="text-[8px] font-black uppercase tracking-widest text-byg-muted">VN</span>
          <input name="vn" type="text" inputMode="decimal" required autoComplete="off"
            defaultValue={vnRegistrado ? formatearNumeroAR(vnRegistrado) : ""} placeholder="30.088" className={`w-24 ${inputCls}`} />
        </label>
        <label className="flex flex-col items-start gap-0.5">
          <span className="text-[8px] font-black uppercase tracking-widest text-byg-muted">Valuación total {moneda}</span>
          <input name="valuacionTotal" type="text" inputMode="decimal" required autoComplete="off"
            placeholder="51.385" className={`w-28 ${inputCls}`} />
        </label>
        <label className="flex flex-col items-start gap-0.5">
          <span className="text-[8px] font-black uppercase tracking-widest text-byg-muted">Fecha valor</span>
          <input name="fechaValor" type="date" required defaultValue={hoy} max={hoy} className={`w-32 ${inputCls}`} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="p-1.5 bg-byg-accent hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors shadow-sm shadow-blue-600/20"
          title="Registrar valuación (el precio unitario se calcula)"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        </button>
      </div>
      <p className="text-[9px] text-byg-muted">Formato argentino: 51.385 = cincuenta y un mil · decimales con coma</p>
      {state.error && <p className="text-[9px] text-red-500 font-bold max-w-[340px] text-right">{state.error}</p>}
      {state.ok && r && (
        <p className="text-[9px] text-emerald-400 font-bold text-right">
          ✓ {r.ticker}: precio {formatearNumeroAR(r.precioNuevo)} {r.moneda} al {r.fechaValor}
          {r.valuacionResultante && <> · valuación {formatearNumeroAR(r.valuacionResultante, { minDecimales: 2 })}</>}
          {r.diferencia && <> (dif. redondeo {formatearNumeroAR(r.diferencia)})</>}
        </p>
      )}
    </form>
  );
}
