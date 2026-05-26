"use client";

import { useActionState } from "react";
import { crearHonorario } from "@/app/(dashboard)/honorarios/actions";

type Comitente = { id: string; nombre: string };
type Cliente   = { id: string; nombre: string };
type Props = { comitentes: Comitente[]; clientes: Cliente[] };

const init: { error?: string; ok?: boolean } = {};
const lCls = "text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-0.5 block";
const iCls = "w-full px-3 py-2 text-xs bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40";

export function CrearHonorarioForm({ comitentes, clientes }: Props) {
  const [state, action, pending] = useActionState(crearHonorario, init);
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <details className="bg-byg-bg rounded-xl border border-byg-border">
      <summary className="px-4 py-3 cursor-pointer select-none flex items-center gap-3 hover:bg-byg-surface transition-colors rounded-xl">
        <span className="text-[10px] font-black uppercase tracking-widest text-byg-muted">+ Nuevo honorario</span>
      </summary>
      <form action={action} className="px-4 pb-4 pt-2 flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={lCls}>Nombre / Etiqueta</label>
            <input name="nombre" type="text" required placeholder="Ej: Honorario Cartera X" className={iCls} />
          </div>
          <div>
            <label className={lCls}>Comitente (opcional)</label>
            <select name="comitenteId" className={iCls}>
              <option value="">— Sin comitente —</option>
              {comitentes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={lCls}>Cliente (opcional)</label>
            <select name="clienteId" className={iCls}>
              <option value="">— Sin cliente —</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={lCls}>% Anual</label>
            <input name="porcentajeAnual" type="number" step="0.01" min="0" max="100" required defaultValue="10" className={iCls} />
          </div>
          <div>
            <label className={lCls}>Moneda base</label>
            <select name="moneda" className={iCls}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
          <div>
            <label className={lCls}>Fecha inicio</label>
            <input name="fechaInicio" type="date" required defaultValue={hoy} className={iCls} />
          </div>
          <div className="col-span-1 md:col-span-3">
            <label className={lCls}>Notas</label>
            <input name="notas" type="text" placeholder="Opcional…" className={iCls} />
          </div>
        </div>
        {state.error && <p className="text-xs text-red-400">{state.error}</p>}
        {state.ok    && <p className="text-xs text-emerald-400">Honorario creado.</p>}
        <button type="submit" disabled={pending} className="self-start px-4 py-2 bg-byg-accent hover:bg-byg-accent/80 disabled:opacity-50 text-white text-xs font-black rounded-lg transition-colors">
          {pending ? "Guardando…" : "Crear honorario"}
        </button>
      </form>
    </details>
  );
}
