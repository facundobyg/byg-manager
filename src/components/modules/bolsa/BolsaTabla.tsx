"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export type BolsaRow = {
  id: string;
  fechaCarga: string;
  sujeto: string;
  tipoOperacion: string;
  ticker: string;
  cantidad: number;
  precio: number;
  moneda: string;
  estado: string;
  operador: string;
  anulada: boolean;
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

const ESTADO_STYLE: Record<string, string> = {
  PENDIENTE_CONCERTACION: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  CONCERTADA:             "bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20",
  LIQUIDADA:              "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  ANULADA:                "bg-byg-surface-2 text-byg-muted",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE_CONCERTACION: "Pendiente",
  CONCERTADA:             "Concertada",
  LIQUIDADA:              "Liquidada",
  ANULADA:                "Anulada",
};

const ALL_ESTADOS = ["PENDIENTE_CONCERTACION", "CONCERTADA", "LIQUIDADA", "ANULADA"] as const;
const ALL_TIPOS = [
  "COMPRA_BONO","VENTA_BONO","COMPRA_ACCION","VENTA_ACCION",
  "COMPRA_CEDEAR","VENTA_CEDEAR","CAUCION_COLOCADORA","CAUCION_TOMADORA",
  "FUTURO","OPCION_CALL","OPCION_PUT","MEP","SENEBI",
] as const;

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
    });
  } catch { return "—"; }
}

function fmt(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BolsaTabla({ rows }: { rows: BolsaRow[] }) {
  const [q,          setQ]          = useState("");
  const [estadoFil,  setEstadoFil]  = useState<string>("ALL");
  const [tipoFil,    setTipoFil]    = useState<string>("ALL");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (estadoFil !== "ALL" && r.estado !== estadoFil) return false;
      if (tipoFil   !== "ALL" && r.tipoOperacion !== tipoFil) return false;
      if (ql && !r.ticker.toLowerCase().includes(ql) && !r.sujeto.toLowerCase().includes(ql) && !(r.operador ?? "").toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [rows, q, estadoFil, tipoFil]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-byg-muted" />
          <input
            type="text"
            placeholder="Ticker, cliente…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-[12px] border border-byg-border rounded-lg bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 w-48 placeholder:text-byg-muted/50"
          />
        </div>

        <div className="flex items-center gap-1">
          {(["ALL", ...ALL_ESTADOS] as string[]).map((e) => (
            <button
              key={e}
              onClick={() => setEstadoFil(e)}
              className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide transition-colors ${
                estadoFil === e
                  ? e === "ALL"
                    ? "bg-byg-text text-byg-bg"
                    : ESTADO_STYLE[e]
                  : "bg-byg-surface-2 text-byg-muted hover:bg-byg-border border border-byg-border"
              }`}
            >
              {e === "ALL" ? "Todos" : ESTADO_LABEL[e]}
            </button>
          ))}
        </div>

        <select
          value={tipoFil}
          onChange={(e) => setTipoFil(e.target.value)}
          className="text-[11px] border border-byg-border rounded-lg px-2 py-1.5 bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40"
        >
          <option value="ALL">Todos los tipos</option>
          {ALL_TIPOS.map((t) => (
            <option key={t} value={t}>{TIPO_LABEL[t]}</option>
          ))}
        </select>

        <span className="ml-auto text-[11px] text-byg-muted font-medium tabular-nums">
          {filtered.length} / {rows.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-byg-muted italic">Sin operaciones con esos filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-byg-border bg-byg-bg">
                  {["Fecha","Sujeto","Tipo","Ticker","Cantidad","Precio","Mon.","Estado","Operador",""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-[0.15em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-byg-border/40">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-byg-surface-2 transition-colors ${r.anulada ? "opacity-40" : ""}`}
                  >
                    <td className="px-4 py-3 text-[11px] text-byg-muted whitespace-nowrap font-mono">
                      {fmtDate(r.fechaCarga)}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-byg-text max-w-[140px] truncate">
                      {r.sujeto}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-byg-muted whitespace-nowrap">
                      {TIPO_LABEL[r.tipoOperacion] ?? r.tipoOperacion}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-black text-byg-text tracking-tight">{r.ticker}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-right tabular-nums font-mono text-byg-text whitespace-nowrap">
                      {fmt(r.cantidad)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-right tabular-nums font-mono text-byg-text whitespace-nowrap">
                      {fmt(r.precio)}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-byg-muted">{r.moneda}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${ESTADO_STYLE[r.estado] ?? "bg-byg-surface-2 text-byg-muted"}`}>
                        {ESTADO_LABEL[r.estado] ?? r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-byg-muted whitespace-nowrap">
                      {r.operador}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bolsa/${r.id}`}
                        className="inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-lg bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-widest shadow-sm shadow-blue-600/20"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
