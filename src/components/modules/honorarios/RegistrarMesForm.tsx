"use client";

import { useActionState } from "react";
import { registrarHonorarioMes, marcarEstadoHonorario } from "@/app/(dashboard)/honorarios/actions";

type MesRow = {
  id:           string;
  mes:          string;
  saldoCartera: number | null;
  monedaSaldo:  string;
  porcentaje:   number;
  honorarioUSD: number | null;
  tcMep:        number | null;
  honorarioARS: number | null;
  estado:       string;
  notas:        string | null;
};

type Props = {
  honorarioId:    string;
  nombre:         string;
  pctAnual:       number;
  monedaBase:     string;
  meses:          MesRow[];
  tcMepActual:    number | null;
};

const ESTADO_CLS: Record<string, string> = {
  PENDIENTE:       "bg-amber-500/10 text-amber-400 border-amber-500/30",
  COBRADO:         "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  NO_CORRESPONDE:  "bg-byg-bg text-byg-muted border-byg-border",
};

const init: { error?: string; ok?: boolean } = {};

function fmt(n: number | null, dec = 2) {
  if (n === null) return "—";
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function RegistrarMesForm({ honorarioId, nombre, pctAnual, monedaBase, meses, tcMepActual }: Props) {
  const [regState, regAction, regPending] = useActionState(registrarHonorarioMes, init);
  const [estState, estAction]             = useActionState(marcarEstadoHonorario, init);

  const mesActual = new Date().toISOString().slice(0, 7);

  return (
    <div className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
      <div className="px-5 py-4 border-b border-byg-border/50 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Honorario</p>
          <p className="text-base font-black text-byg-text">{nombre}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">% Anual</p>
          <p className="text-base font-black tabular-nums font-mono text-amber-400">{pctAnual}%</p>
        </div>
      </div>

      {/* Historial de meses */}
      {meses.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="bg-byg-bg border-b border-byg-border">
                {["Mes", "Saldo", "Mon.", "%", "TC MEP", "Honorario USD", "Honorario ARS", "Estado", ""].map((h, i) => (
                  <th key={i} className={`px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-byg-muted ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meses.map((m) => (
                <tr key={m.id} className="border-b border-byg-border/40 last:border-0 bg-byg-surface hover:bg-byg-surface-2 transition-colors">
                  <td className="px-3 py-2 font-mono text-byg-muted">{m.mes}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono text-byg-text">{fmt(m.saldoCartera)}</td>
                  <td className="px-3 py-2 text-right text-byg-muted">{m.monedaSaldo}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono text-byg-muted">{m.porcentaje.toFixed(2)}%</td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono text-byg-muted">
                    {m.tcMep !== null ? fmt(m.tcMep) : <span className="text-amber-400 text-[9px] font-bold">FALTANTE</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-byg-text">{fmt(m.honorarioUSD)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-byg-text">{fmt(m.honorarioARS)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${ESTADO_CLS[m.estado] ?? ""}`}>
                      {m.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {m.estado === "PENDIENTE" && (
                        <form action={estAction}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="estado" value="COBRADO" />
                          <button type="submit" className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 transition-colors">Cobrado</button>
                        </form>
                      )}
                      {m.estado !== "PENDIENTE" && (
                        <form action={estAction}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="estado" value="PENDIENTE" />
                          <button type="submit" className="text-[9px] font-black text-byg-muted hover:text-byg-text transition-colors">↩</button>
                        </form>
                      )}
                      <form action={estAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="estado" value="NO_CORRESPONDE" />
                        <button type="submit" className="text-[9px] font-black text-byg-muted hover:text-byg-text transition-colors">N/C</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Registrar mes */}
      <details className="border-t border-byg-border/50">
        <summary className="px-5 py-3 cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-byg-muted hover:bg-byg-surface-2 transition-colors">
          + Registrar mes
        </summary>
        <form action={regAction} className="px-5 py-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <input type="hidden" name="honorarioId" value={honorarioId} />

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-byg-muted mb-0.5 block">Mes</label>
            <input name="mes" type="month" required defaultValue={mesActual}
              className="w-full px-3 py-2 text-xs bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none" />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-byg-muted mb-0.5 block">Saldo cartera</label>
            <input name="saldoCartera" type="number" step="0.01" min="0" placeholder="0.00"
              className="w-full px-3 py-2 text-xs bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none [appearance:textfield]" />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-byg-muted mb-0.5 block">Moneda saldo</label>
            <select name="monedaSaldo" defaultValue={monedaBase}
              className="w-full px-3 py-2 text-xs bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none">
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-byg-muted mb-0.5 block">% (anual)</label>
            <input name="porcentaje" type="number" step="0.01" min="0" max="100" defaultValue={pctAnual}
              className="w-full px-3 py-2 text-xs bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none [appearance:textfield]" />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-byg-muted mb-0.5 block">
              TC MEP {tcMepActual === null && <span className="text-amber-400">(sin dato)</span>}
            </label>
            <input name="tcMep" type="number" step="0.01" min="0"
              placeholder={tcMepActual !== null ? String(tcMepActual) : "ej: 1250"}
              defaultValue={tcMepActual !== null ? tcMepActual : undefined}
              className="w-full px-3 py-2 text-xs bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none [appearance:textfield]" />
          </div>

          <div className="col-span-2 md:col-span-5">
            <input name="notas" type="text" placeholder="Notas opcionales…"
              className="w-full px-3 py-2 text-xs bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none" />
          </div>

          {regState.error && <p className="col-span-2 md:col-span-5 text-xs text-red-400">{regState.error}</p>}
          {regState.ok    && <p className="col-span-2 md:col-span-5 text-xs text-emerald-400">Mes registrado.</p>}
          {estState.error && <p className="col-span-2 md:col-span-5 text-xs text-red-400">{estState.error}</p>}

          <button type="submit" disabled={regPending}
            className="col-span-2 md:col-span-1 self-end px-4 py-2 bg-byg-accent hover:bg-byg-accent/80 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-colors">
            {regPending ? "Guardando…" : "Guardar mes"}
          </button>
        </form>
      </details>
    </div>
  );
}
