"use client";

import { useActionState } from "react";
import { upsertComisionConfig, deleteComisionConfig } from "@/app/(dashboard)/comisiones/config-actions";

type Productor = { id: string; nombre: string };
type Config = {
  id:            string;
  productorId:   string;
  pctProductor:  number;
  pctBYG:        number;
  pctIIBB:       number;
  aplicaSenebi:  boolean;
  otrosImpuestos: number;
  vigenciaDesde: string;
  notas:         string | null;
};

type Props = {
  productores: Productor[];
  configs:     Config[];
};

const init: { error?: string; ok?: boolean } = {};

const lCls = "text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-0.5 block";
const iCls = "w-full px-3 py-2 text-xs bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40";

export function ComisionConfigForm({ productores, configs }: Props) {
  const [state, action, pending] = useActionState(upsertComisionConfig, init);
  const [delState, delAction]    = useActionState(deleteComisionConfig, init);

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      {/* Config existentes */}
      {configs.length > 0 && (
        <div className="rounded-xl border border-byg-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-byg-bg border-b border-byg-border">
                {["Productor", "% Prod.", "% BYG", "IIBB %", "SENEBI", "Otros", "Vigencia desde", "Notas", ""].map((h, i) => (
                  <th key={i} className={`px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-byg-muted ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => {
                const prod = productores.find((p) => p.id === c.productorId);
                return (
                  <tr key={c.id} className="border-b border-byg-border/40 last:border-0 bg-byg-surface">
                    <td className="px-3 py-2 font-bold text-byg-text">{prod?.nombre ?? c.productorId}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-amber-400">{c.pctProductor.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-byg-accent">{c.pctBYG.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-byg-muted">{c.pctIIBB.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${c.aplicaSenebi ? "bg-amber-500/10 text-amber-400" : "bg-byg-bg text-byg-muted"}`}>
                        {c.aplicaSenebi ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-byg-muted">{c.otrosImpuestos.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right font-mono text-byg-muted">{c.vigenciaDesde}</td>
                    <td className="px-3 py-2 text-right text-byg-muted">{c.notas ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <form action={delAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-[9px] font-black text-red-400 hover:text-red-300 transition-colors">✕</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {delState.error && <p className="text-xs text-red-400">{delState.error}</p>}

      {/* Nueva configuración */}
      <details className="bg-byg-bg rounded-xl border border-byg-border">
        <summary className="px-4 py-3 cursor-pointer select-none flex items-center gap-3 hover:bg-byg-surface transition-colors rounded-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-byg-muted">+ Nueva config de comisión</span>
        </summary>
        <form action={action} className="px-4 pb-4 pt-2 flex flex-col gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className={lCls}>Productor</label>
              <select name="productorId" required className={iCls}>
                <option value="">Seleccionar…</option>
                {productores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={lCls}>% Productor</label>
              <input name="pctProductor" type="number" step="0.1" min="0" max="100" required defaultValue="50" className={iCls} />
            </div>

            <div>
              <label className={lCls}>% BYG (retención)</label>
              <input name="pctBYG" type="number" step="0.1" min="0" max="100" required defaultValue="50" className={iCls} />
            </div>

            <div>
              <label className={lCls}>IIBB %</label>
              <input name="pctIIBB" type="number" step="0.1" min="0" max="100" defaultValue="5.5" className={iCls} />
            </div>

            <div>
              <label className={lCls}>Aplica SENEBI</label>
              <select name="aplicaSenebi" className={iCls}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>

            <div>
              <label className={lCls}>Otros impuestos %</label>
              <input name="otrosImpuestos" type="number" step="0.1" min="0" max="100" defaultValue="0" className={iCls} />
            </div>

            <div>
              <label className={lCls}>Vigencia desde</label>
              <input name="vigenciaDesde" type="date" required defaultValue={hoy} className={iCls} />
            </div>

            <div className="col-span-2 md:col-span-2">
              <label className={lCls}>Notas</label>
              <input name="notas" type="text" placeholder="Ej: Renegociado Q1 2025…" className={iCls} />
            </div>
          </div>

          {state.error && <p className="text-xs text-red-400">{state.error}</p>}
          {state.ok    && <p className="text-xs text-emerald-400">Config guardada.</p>}

          <button
            type="submit"
            disabled={pending}
            className="self-start px-4 py-2 bg-byg-accent hover:bg-byg-accent/80 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-colors"
          >
            {pending ? "Guardando…" : "Guardar configuración"}
          </button>
        </form>
      </details>

      <p className="text-[10px] text-byg-muted">
        Fórmula: (Base bruta − SENEBI si aplica − IIBB% − otros%) × % productor = A cobrar neto.
        La config vigente para un mes se determina por la última vigente antes del primer día del mes.
      </p>
    </div>
  );
}
