"use client";

import { useActionState } from "react";
import { Loader2, TrendingUp, CheckCircle2 } from "lucide-react";
import { liquidarInteresCCAction } from "@/app/(dashboard)/clientes/actions";
import { EditarTasaCCForm } from "@/components/modules/clientes/EditarTasaCCForm";

interface Props {
  cuentaId: string;
  clienteId: string;
  tasaCC: number;
  vigenteDesde?: string;
  fechaInicio: string;
  fechaFin: string;
}

export function AplicarInteresPanel({ cuentaId, clienteId, tasaCC, vigenteDesde, fechaInicio, fechaFin }: Props) {
  const [state, action, isPending] = useActionState(liquidarInteresCCAction, null);

  const tasaPct = (tasaCC * 100).toFixed(4).replace(/\.?0+$/, "");

  return (
    <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
      <div className="px-6 py-4 border-b border-byg-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-byg-accent" />
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text">Aplicar Interés</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-byg-accent bg-byg-accent/10 px-2.5 py-1 rounded-md border border-byg-accent/20">
            {tasaPct}% TNA
          </span>
          {vigenteDesde && (
            <span className="text-[10px] font-medium text-byg-muted">
              desde {vigenteDesde}
            </span>
          )}
          <EditarTasaCCForm clienteId={clienteId} cuentaId={cuentaId} tasaActual={tasaCC} />
        </div>
      </div>

      {state && 'success' in state && state.success ? (
        <div className="px-6 py-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={16} />
            <span className="text-sm font-bold">Interés aplicado correctamente</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-byg-muted mb-0.5">Calculado</p>
              <p className="font-black text-byg-text tabular-nums font-mono">{Number(state.interesCalculado).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-byg-muted mb-0.5">Aplicado</p>
              <p className="font-black text-emerald-400 tabular-nums font-mono">{Number(state.interesAplicado).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-byg-muted mb-0.5">Diferencia</p>
              <p className={`font-black tabular-nums font-mono ${Number(state.diferencia) !== 0 ? "text-amber-400" : "text-byg-muted"}`}>
                {Number(state.diferencia).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form action={action} className="px-6 py-5 flex flex-col gap-4">
          <input type="hidden" name="cuentaId" value={cuentaId} />
          <input type="hidden" name="clienteId" value={clienteId} />

          <input type="hidden" name="fechaInicio" value={fechaInicio} />
          <input type="hidden" name="fechaFin" value={fechaFin} />
          <input type="hidden" name="tasa" value={tasaCC} />
          <input type="hidden" name="interesAplicado" value="0" />

          <p className="text-sm text-byg-muted">
            Se calculará y aplicará automáticamente el interés generado desde el inicio del mes o el último corte hasta hoy.
          </p>

          {state && 'error' in state && state.error && (
            <p className="text-xs text-rose-400 font-semibold">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-byg-accent hover:bg-blue-500 text-white rounded-xl px-5 py-3 text-sm font-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wide shadow-sm shadow-blue-600/20"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            Aplicar interés del período
          </button>
        </form>
      )}
    </section>
  );
}
