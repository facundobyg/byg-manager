"use client";

import { useState, useEffect, useActionState, Fragment } from "react";
import Link from "next/link";
import { anularOperacion } from "@/app/(dashboard)/bolsa/actions";

export type OpsBolsaRow = {
  id: string;
  fechaOperativa: string | null;
  fechaCarga: string;
  tipoOperacion: string;
  ticker: string;
  cantidad: number;
  precio: number;
  moneda: string;
  estado: string;
  anulada: boolean;
  resultadoNeto: number | null;
  operadorNombre: string;
};

type Props = {
  ops: OpsBolsaRow[];
  canWrite: boolean;
};

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

const ESTADO_CLS: Record<string, string> = {
  PENDIENTE_CONCERTACION: "bg-amber-50 text-amber-700",
  CONCERTADA:             "bg-blue-50 text-blue-700",
  LIQUIDADA:              "bg-emerald-50 text-emerald-700",
  ANULADA:                "bg-slate-100 text-slate-500",
};
const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE_CONCERTACION: "Pendiente",
  CONCERTADA:             "Concertada",
  LIQUIDADA:              "Liquidada",
  ANULADA:                "Anulada",
};

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtDate(iso: string | null, utc = false) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    ...(utc ? { timeZone: "UTC" } : {}),
  });
}

// ── Inline anular ────────────────────────────────────────────────────────────

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
      className="flex items-center gap-2 flex-wrap px-3 py-2.5 bg-red-50 rounded-lg border border-red-200"
    >
      <input type="hidden" name="operacionId" value={opId} />
      <input
        type="text"
        name="motivoAnulacion"
        required
        autoFocus
        placeholder="Motivo de anulación (obligatorio)…"
        className="flex-1 min-w-[200px] px-2.5 py-1 text-[11px] bg-white border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 uppercase tracking-widest transition-colors whitespace-nowrap"
      >
        {pending ? "Anulando…" : "Confirmar"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest"
      >
        Cancelar
      </button>
      {state && "error" in state && state.error && (
        <span className="text-[10px] text-red-600 font-semibold">{state.error}</span>
      )}
    </form>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

type EstadoFilter = "todas" | "PENDIENTE_CONCERTACION" | "CONCERTADA" | "ANULADA";

export function OpsBolsaTable({ ops, canWrite }: Props) {
  const [estadoFilter,   setEstadoFilter]   = useState<EstadoFilter>("todas");
  const [tickerFilter,   setTickerFilter]   = useState("");
  const [tipoFilter,     setTipoFilter]     = useState("");
  const [anularingId,    setAnularingId]    = useState<string | null>(null);

  // Stats from full (unfiltered) ops
  const pendientes   = ops.filter((o) => o.estado === "PENDIENTE_CONCERTACION").length;
  const concertadas  = ops.filter((o) => o.estado === "CONCERTADA").length;
  const anuladas     = ops.filter((o) => o.anulada).length;
  const resultadoARS = ops
    .filter((o) => o.estado === "CONCERTADA" && o.moneda === "ARS" && o.resultadoNeto !== null)
    .reduce((s, o) => s + (o.resultadoNeto ?? 0), 0);
  const resultadoUSD = ops
    .filter((o) => o.estado === "CONCERTADA" && o.moneda === "USD" && o.resultadoNeto !== null)
    .reduce((s, o) => s + (o.resultadoNeto ?? 0), 0);

  const filtered = ops.filter((o) => {
    if (estadoFilter !== "todas" && o.estado !== estadoFilter) return false;
    if (tickerFilter && !o.ticker.toLowerCase().includes(tickerFilter.toLowerCase())) return false;
    if (tipoFilter   && o.tipoOperacion !== tipoFilter) return false;
    return true;
  });

  const hasFilters = estadoFilter !== "todas" || tickerFilter || tipoFilter;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Pendientes",  value: pendientes,  color: pendientes  > 0 ? "text-amber-600"   : "text-slate-400", top: pendientes  > 0 ? "border-t-amber-400"   : "border-t-slate-200" },
          { label: "Concertadas", value: concertadas, color: "text-blue-600",                                          top: "border-t-blue-400"   },
          { label: "Anuladas",    value: anuladas,    color: anuladas    > 0 ? "text-red-500"      : "text-slate-400", top: anuladas    > 0 ? "border-t-red-400"      : "border-t-slate-200" },
          { label: "Res. ARS",    value: resultadoARS !== 0 ? `$ ${fmt(resultadoARS)}` : "—", color: resultadoARS >= 0 ? "text-emerald-600" : "text-red-500", top: "border-t-emerald-400" },
          { label: "Res. USD",    value: resultadoUSD !== 0 ? `USD ${fmt(resultadoUSD)}` : "—", color: resultadoUSD >= 0 ? "text-emerald-600" : "text-red-500", top: "border-t-emerald-400" },
        ].map(({ label, value, color, top }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 border-t-[3px] ${top} p-3`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className={`text-lg font-black tabular-nums font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Estado pills */}
        <div className="flex rounded-lg overflow-hidden border border-slate-200 text-[10px] font-black uppercase tracking-widest shrink-0">
          {(["todas", "PENDIENTE_CONCERTACION", "CONCERTADA", "ANULADA"] as EstadoFilter[]).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEstadoFilter(e)}
              className={`px-2.5 py-1.5 transition-colors ${
                estadoFilter === e
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-50"
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

        {/* Ticker */}
        <input
          type="text"
          value={tickerFilter}
          onChange={(e) => setTickerFilter(e.target.value)}
          placeholder="Ticker…"
          className="w-28 px-2.5 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-300 uppercase"
        />

        {/* Tipo */}
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="px-2.5 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => { setEstadoFilter("todas"); setTickerFilter(""); setTipoFilter(""); }}
            className="text-[10px] font-black text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-widest"
          >
            Limpiar
          </button>
        )}
        {hasFilters && (
          <span className="text-[10px] text-slate-400 font-mono">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-400 italic">
            {hasFilters ? "Sin resultados para los filtros aplicados." : "Sin operaciones bolsa."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Fecha", "Estado", "Tipo", "Ticker", "Cant.", "Precio", "Mon.", "Resultado", "Operador", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${
                        i < 3 || i === 8 || i === 9 ? "text-left" : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((op) => {
                  const isPending   = op.estado === "PENDIENTE_CONCERTACION";
                  const isAnulada   = op.estado === "ANULADA";
                  const isAnularing = anularingId === op.id;

                  return (
                    <Fragment key={op.id}>
                      <tr className={`border-b border-slate-50 last:border-0 transition-colors ${isAnulada ? "opacity-50" : "bg-white hover:bg-slate-50/60"}`}>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {op.fechaOperativa
                            ? fmtDate(op.fechaOperativa, true)
                            : fmtDate(op.fechaCarga)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ESTADO_CLS[op.estado] ?? "bg-slate-100 text-slate-500"}`}>
                            {ESTADO_LABEL[op.estado] ?? op.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{op.ticker}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                          {fmt(op.cantidad, 0)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                          {fmt(op.precio, 4)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400">{op.moneda}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-700">
                          {op.resultadoNeto !== null ? fmt(op.resultadoNeto) : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{op.operadorNombre}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-nowrap">
                            <Link
                              href={`/bolsa/${op.id}`}
                              className="inline-flex text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors uppercase tracking-widest whitespace-nowrap"
                            >
                              Ver
                            </Link>
                            {canWrite && isPending && !isAnularing && (
                              <Link
                                href={`/bolsa/${op.id}`}
                                className="inline-flex text-[10px] font-black px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors uppercase tracking-widest whitespace-nowrap"
                              >
                                Concertar →
                              </Link>
                            )}
                            {canWrite && !isAnulada && !isAnularing && (
                              <button
                                type="button"
                                onClick={() => setAnularingId(op.id)}
                                className="inline-flex text-[10px] font-black px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors uppercase tracking-widest whitespace-nowrap"
                              >
                                Anular
                              </button>
                            )}
                            {isAnularing && (
                              <button
                                type="button"
                                onClick={() => setAnularingId(null)}
                                className="inline-flex text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isAnularing && (
                        <tr>
                          <td colSpan={10} className="px-4 pb-3 pt-1">
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
        </div>
      )}
    </div>
  );
}
