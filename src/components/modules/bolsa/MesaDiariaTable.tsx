"use client";

import { useState, useEffect, useActionState, Fragment } from "react";
import Link from "next/link";
import type { MesaDiariaResult, GrupoPropias, GrupoClientes, OpDiaRow } from "@/lib/data/operacion-bolsa";
import { ChevronDown, ChevronRight, Link2 } from "lucide-react";
import { agruparOperacionesArbitraje, anularOperacion } from "@/app/(dashboard)/bolsa/actions";

type Props = { data: MesaDiariaResult; canWrite: boolean };

const TIPO_LABEL: Record<string, string> = {
  COMPRA_BONO:        "Compra Bono",
  VENTA_BONO:         "Venta Bono",
  COMPRA_ACCION:      "Compra Acción",
  VENTA_ACCION:       "Venta Acción",
  COMPRA_CEDEAR:      "Compra CEDEAR",
  VENTA_CEDEAR:       "Venta CEDEAR",
  CAUCION_COLOCADORA: "Caución Coloc.",
  CAUCION_TOMADORA:   "Caución Tomad.",
  FUTURO:             "Futuro",
  OPCION_CALL:        "Opción Call",
  OPCION_PUT:         "Opción Put",
  MEP:                "MEP",
  SENEBI:             "SENEBI",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE_CONCERTACION: "Pendiente",
  CONCERTADA:             "Concertada",
  LIQUIDADA:              "Liquidada",
  ANULADA:                "Anulada",
};

const ESTADO_STYLE: Record<string, string> = {
  PENDIENTE_CONCERTACION: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  CONCERTADA:             "bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20",
  LIQUIDADA:              "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  ANULADA:                "bg-byg-surface-2 text-byg-muted",
};

function fmt(n: number | null, decimals = 2) {
  if (n === null) return "—";
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ── Inline anular form ───────────────────────────────────────────────────────

function AnularInlineForm({
  opId,
  onCancel,
  onSuccess,
}: {
  opId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState(anularOperacion, null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form
      action={action}
      className="flex items-center gap-2 flex-wrap px-3 py-2.5 bg-red-500/5 rounded-lg border border-red-500/20"
    >
      <input type="hidden" name="operacionId" value={opId} />
      <input
        type="text"
        name="motivoAnulacion"
        required
        autoFocus
        placeholder="Motivo de anulación (obligatorio)…"
        className="flex-1 min-w-[200px] px-2.5 py-1 text-[11px] bg-byg-bg border border-byg-border rounded-md text-byg-text placeholder:text-byg-muted/50 focus:outline-none focus:ring-1 focus:ring-red-500/40"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 uppercase tracking-widest transition-colors whitespace-nowrap"
      >
        {pending ? "Anulando…" : "Confirmar anulación"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-byg-surface border border-byg-border text-byg-muted hover:text-byg-text transition-colors uppercase tracking-widest"
      >
        Cancelar
      </button>
      {state && "error" in state && state.error && (
        <span className="text-[10px] text-red-400 font-semibold">{state.error}</span>
      )}
    </form>
  );
}

// ── Ops table ────────────────────────────────────────────────────────────────

type SelectionProps = {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
};

function OpsTable({
  ops,
  selectedIds,
  onToggle,
  canWrite,
}: { ops: OpDiaRow[]; canWrite: boolean } & SelectionProps) {
  const [anularingId, setAnularingId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[960px]">
        <thead>
          <tr className="border-b border-byg-border/60 bg-byg-bg/50">
            <th className="px-3 py-2 w-8" />
            {["Tipo", "Ticker", "Cant.", "Precio", "Mon.", "TC MEP", "Caución", "Estado", "Operador", ""].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-[9px] font-black uppercase text-byg-muted tracking-[0.15em] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-byg-border/30">
          {ops.map((op) => {
            const isPending    = op.estado === "PENDIENTE_CONCERTACION";
            const isAnulada    = op.estado === "ANULADA";
            const isChecked    = selectedIds.has(op.id);
            const isAnularing  = anularingId === op.id;

            return (
              <Fragment key={op.id}>
                <tr
                  className={`hover:bg-byg-surface-2/50 transition-colors ${isChecked ? "bg-violet-500/5" : ""} ${isAnulada ? "opacity-50" : ""}`}
                >
                  <td className="px-3 py-2.5 w-8">
                    {isPending && !isAnulada && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggle(op.id)}
                        className="accent-violet-500 cursor-pointer"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-byg-muted whitespace-nowrap">
                    {TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[12px] font-black text-byg-text tracking-tight">{op.ticker}</span>
                      {op.grupoArbitrajeId && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20 tracking-wider whitespace-nowrap">
                          ARB {op.grupoArbitrajeId.slice(0, 6)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-right tabular-nums font-mono text-byg-text whitespace-nowrap">
                    {fmt(op.cantidad, 0)}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-right tabular-nums font-mono text-byg-text whitespace-nowrap">
                    {fmt(op.precio)}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-byg-muted">{op.moneda}</td>
                  <td className="px-3 py-2.5 text-[11px] text-right tabular-nums font-mono text-byg-muted whitespace-nowrap">
                    {op.tcMepDia !== null ? fmt(op.tcMepDia, 4) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-byg-muted whitespace-nowrap">
                    {op.diasCaucion !== null
                      ? `${op.diasCaucion}d${op.tasaCaucion !== null ? ` @ ${fmt(op.tasaCaucion, 2)}%` : ""}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${ESTADO_STYLE[op.estado] ?? "bg-byg-surface-2 text-byg-muted"}`}
                    >
                      {ESTADO_LABEL[op.estado] ?? op.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-byg-muted whitespace-nowrap">
                    {op.operadorNombre}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 flex-nowrap">
                      <Link
                        href={`/bolsa/${op.id}`}
                        className="inline-flex items-center text-[10px] font-black px-2 py-1 rounded-lg bg-byg-surface border border-byg-border text-byg-muted hover:text-byg-text transition-colors uppercase tracking-widest whitespace-nowrap"
                      >
                        Ver
                      </Link>
                      {canWrite && isPending && !isAnularing && (
                        <Link
                          href={`/bolsa/${op.id}`}
                          className="inline-flex items-center text-[10px] font-black px-2 py-1 rounded-lg bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-widest whitespace-nowrap"
                        >
                          Concertar →
                        </Link>
                      )}
                      {canWrite && !isAnulada && !isAnularing && (
                        <button
                          type="button"
                          onClick={() => setAnularingId(op.id)}
                          className="inline-flex items-center text-[10px] font-black px-2 py-1 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 transition-colors uppercase tracking-widest whitespace-nowrap"
                        >
                          Anular
                        </button>
                      )}
                      {isAnularing && (
                        <button
                          type="button"
                          onClick={() => setAnularingId(null)}
                          className="inline-flex items-center text-[10px] font-black px-2 py-1 rounded-lg bg-byg-surface border border-byg-border text-byg-muted hover:text-byg-text transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {isAnularing && (
                  <tr>
                    <td colSpan={11} className="px-3 pb-3 pt-1">
                      <AnularInlineForm
                        opId={op.id}
                        onCancel={() => setAnularingId(null)}
                        onSuccess={() => setAnularingId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Group components ─────────────────────────────────────────────────────────

function PropiaGroup({
  g,
  selectedIds,
  onToggle,
  canWrite,
}: { g: GrupoPropias; canWrite: boolean } & SelectionProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-byg-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-byg-bg hover:bg-byg-surface-2 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={13} className="text-byg-muted" /> : <ChevronRight size={13} className="text-byg-muted" />}
          <span className="text-[12px] font-black text-byg-text">{g.carteraNombre}</span>
          <span className="text-[10px] text-byg-muted font-medium">
            ({g.ops.length} op{g.ops.length !== 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono tabular-nums">
          {g.totalResultadoARS !== 0 && (
            <span className={g.totalResultadoARS >= 0 ? "text-emerald-400" : "text-red-400"}>
              {fmt(g.totalResultadoARS)} ARS
            </span>
          )}
          {g.totalResultadoUSD !== 0 && (
            <span className={g.totalResultadoUSD >= 0 ? "text-emerald-400" : "text-red-400"}>
              {fmt(g.totalResultadoUSD)} USD
            </span>
          )}
        </div>
      </button>
      {open && (
        <OpsTable ops={g.ops} selectedIds={selectedIds} onToggle={onToggle} canWrite={canWrite} />
      )}
    </div>
  );
}

function ClienteGroup({
  g,
  selectedIds,
  onToggle,
  canWrite,
}: { g: GrupoClientes; canWrite: boolean } & SelectionProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-byg-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-byg-bg hover:bg-byg-surface-2 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={13} className="text-byg-muted" /> : <ChevronRight size={13} className="text-byg-muted" />}
          <span className="text-[12px] font-black text-byg-text">{g.comitenteNombre}</span>
          <span className="text-[10px] text-byg-muted font-medium"># {g.nroComitente}</span>
          <span className="text-[10px] text-byg-muted font-medium">
            ({g.ops.length} op{g.ops.length !== 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono tabular-nums">
          {g.totalResultadoARS !== 0 && (
            <span className={g.totalResultadoARS >= 0 ? "text-emerald-400" : "text-red-400"}>
              {fmt(g.totalResultadoARS)} ARS
            </span>
          )}
          {g.totalResultadoUSD !== 0 && (
            <span className={g.totalResultadoUSD >= 0 ? "text-emerald-400" : "text-red-400"}>
              {fmt(g.totalResultadoUSD)} USD
            </span>
          )}
        </div>
      </button>
      {open && (
        <OpsTable ops={g.ops} selectedIds={selectedIds} onToggle={onToggle} canWrite={canWrite} />
      )}
    </div>
  );
}

// ── Main table ───────────────────────────────────────────────────────────────

type EstadoFilter = "todas" | "PENDIENTE_CONCERTACION" | "CONCERTADA" | "ANULADA";

export function MesaDiariaTable({ data, canWrite }: Props) {
  const [vista,          setVista]          = useState<"propias" | "clientes" | "todas">("todas");
  const [estadoFilter,   setEstadoFilter]   = useState<EstadoFilter>("todas");
  const [tickerFilter,   setTickerFilter]   = useState("");
  const [operadorFilter, setOperadorFilter] = useState("");
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [arbState, arbAction, arbPending]   = useActionState(agruparOperacionesArbitraje, null);

  const { propias, clientes, resumen } = data;

  useEffect(() => {
    if (arbState && "ok" in arbState && arbState.ok) {
      setSelectedIds(new Set());
    }
  }, [arbState]);

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function filterOps(ops: OpDiaRow[]): OpDiaRow[] {
    return ops.filter((op) => {
      if (estadoFilter !== "todas" && op.estado !== estadoFilter) return false;
      if (tickerFilter   && !op.ticker.toLowerCase().includes(tickerFilter.toLowerCase())) return false;
      if (operadorFilter && !op.operadorNombre.toLowerCase().includes(operadorFilter.toLowerCase())) return false;
      return true;
    });
  }

  const filteredPropias  = propias .map((g) => ({ ...g, ops: filterOps(g.ops) })).filter((g) => g.ops.length > 0);
  const filteredClientes = clientes.map((g) => ({ ...g, ops: filterOps(g.ops) })).filter((g) => g.ops.length > 0);

  const totalOps = resumen.totalPropias + resumen.totalClientes;
  const hasAnyOps = totalOps > 0 || resumen.totalAnuladas > 0;
  const filteredTotal = filteredPropias.reduce((s, g) => s + g.ops.length, 0)
    + filteredClientes.reduce((s, g) => s + g.ops.length, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Resumen cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          {
            label: "Res. Mesa ARS",
            value: fmt(resumen.resultadoMesaARS),
            color: resumen.resultadoMesaARS >= 0 ? "text-emerald-400" : "text-red-400",
            top:   "border-t-emerald-500",
          },
          {
            label: "Res. Mesa USD",
            value: fmt(resumen.resultadoMesaUSD),
            color: resumen.resultadoMesaUSD >= 0 ? "text-emerald-400" : "text-red-400",
            top:   "border-t-emerald-500",
          },
          {
            label: "Propias",
            value: String(resumen.totalPropias),
            color: "text-byg-text",
            top:   "border-t-byg-border-2",
          },
          {
            label: "Clientes",
            value: String(resumen.totalClientes),
            color: "text-byg-text",
            top:   "border-t-byg-border-2",
          },
          {
            label: "Pend. revisión",
            value: String(resumen.pendientesRevision),
            color: resumen.pendientesRevision > 0 ? "text-amber-400" : "text-byg-muted",
            top:   resumen.pendientesRevision > 0 ? "border-t-amber-400" : "border-t-byg-border-2",
          },
          {
            label: "Anuladas",
            value: String(resumen.totalAnuladas),
            color: resumen.totalAnuladas > 0 ? "text-red-400" : "text-byg-muted",
            top:   resumen.totalAnuladas > 0 ? "border-t-red-500" : "border-t-byg-border-2",
          },
        ].map(({ label, value, color, top }) => (
          <div key={label} className={`bg-byg-surface rounded-xl border border-byg-border border-t-[3px] ${top} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-1">{label}</p>
            <p className={`text-2xl font-black tabular-nums font-mono tracking-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Vista toggle + arbitrage bar */}
      {hasAnyOps && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {(["todas", "propias", "clientes"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors ${
                  vista === v
                    ? "bg-byg-accent text-white"
                    : "bg-byg-surface border border-byg-border text-byg-muted hover:text-byg-text"
                }`}
              >
                {v === "todas"
                  ? `Todas (${totalOps})`
                  : v === "propias"
                  ? `Propias (${resumen.totalPropias})`
                  : `Clientes (${resumen.totalClientes})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {arbState && "ok" in arbState && arbState.ok && selectedIds.size === 0 && (
              <span className="text-[11px] font-semibold text-violet-400">
                Grupo ARB {arbState.grupoId} creado
              </span>
            )}
            {arbState && "error" in arbState && arbState.error && (
              <span className="text-[11px] font-semibold text-red-400">{arbState.error}</span>
            )}
            {selectedIds.size >= 2 && (
              <form action={arbAction} className="flex items-center gap-2">
                <input type="hidden" name="operationIds" value={Array.from(selectedIds).join(",")} />
                <span className="text-[10px] text-byg-muted font-medium">{selectedIds.size} selec.</span>
                <button
                  type="submit"
                  disabled={arbPending}
                  className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition-colors uppercase tracking-widest shadow-sm shadow-violet-600/20"
                >
                  <Link2 size={11} />
                  {arbPending ? "Agrupando…" : "Agrupar arbitraje"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Filter bar */}
      {hasAnyOps && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Estado pills */}
          <div className="flex rounded-lg overflow-hidden border border-byg-border text-[10px] font-black uppercase tracking-widest shrink-0">
            {(["todas", "PENDIENTE_CONCERTACION", "CONCERTADA", "ANULADA"] as EstadoFilter[]).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEstadoFilter(e)}
                className={`px-2.5 py-1.5 transition-colors ${
                  estadoFilter === e
                    ? "bg-byg-accent text-white"
                    : "bg-byg-bg text-byg-muted hover:bg-byg-surface-2"
                }`}
              >
                {e === "todas"
                  ? "Todos"
                  : e === "PENDIENTE_CONCERTACION"
                  ? "Pendientes"
                  : e === "CONCERTADA"
                  ? "Concertadas"
                  : "Anuladas"}
              </button>
            ))}
          </div>
          {/* Ticker search */}
          <input
            type="text"
            value={tickerFilter}
            onChange={(e) => setTickerFilter(e.target.value)}
            placeholder="Ticker…"
            className="w-28 px-2.5 py-1.5 text-[11px] bg-byg-bg border border-byg-border rounded-lg text-byg-text placeholder:text-byg-muted/50 focus:outline-none focus:ring-1 focus:ring-byg-accent/40 uppercase"
          />
          {/* Operador search */}
          <input
            type="text"
            value={operadorFilter}
            onChange={(e) => setOperadorFilter(e.target.value)}
            placeholder="Operador…"
            className="w-32 px-2.5 py-1.5 text-[11px] bg-byg-bg border border-byg-border rounded-lg text-byg-text placeholder:text-byg-muted/50 focus:outline-none focus:ring-1 focus:ring-byg-accent/40"
          />
          {(tickerFilter || operadorFilter || estadoFilter !== "todas") && (
            <button
              type="button"
              onClick={() => { setTickerFilter(""); setOperadorFilter(""); setEstadoFilter("todas"); }}
              className="text-[10px] font-black text-byg-muted hover:text-byg-text transition-colors uppercase tracking-widest"
            >
              Limpiar
            </button>
          )}
          {(tickerFilter || operadorFilter || estadoFilter !== "todas") && (
            <span className="text-[10px] text-byg-muted font-mono">{filteredTotal} resultado{filteredTotal !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}

      {/* Groups */}
      {!hasAnyOps ? (
        <div className="bg-byg-surface rounded-2xl border border-byg-border px-6 py-12 text-center">
          <p className="text-sm text-byg-muted italic">Sin operaciones para esta fecha.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(vista === "todas" || vista === "propias") &&
            filteredPropias.map((g) => (
              <PropiaGroup
                key={g.carteraId}
                g={g}
                selectedIds={selectedIds}
                onToggle={toggleId}
                canWrite={canWrite}
              />
            ))}
          {(vista === "todas" || vista === "clientes") &&
            filteredClientes.map((g) => (
              <ClienteGroup
                key={g.comitenteId}
                g={g}
                selectedIds={selectedIds}
                onToggle={toggleId}
                canWrite={canWrite}
              />
            ))}
          {filteredTotal === 0 && (
            <div className="bg-byg-surface rounded-2xl border border-byg-border px-6 py-8 text-center">
              <p className="text-sm text-byg-muted italic">Sin resultados para los filtros aplicados.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
