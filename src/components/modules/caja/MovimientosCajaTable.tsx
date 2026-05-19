"use client";

import { useActionState } from "react";
import { MovimientoCajaLedgerRow } from "@/lib/data/movimientos-caja";
import { confirmarMovimientoCajaPendiente, revertirMovimientoCaja } from "@/app/(dashboard)/caja/actions";
import { readOnlyPreview } from "@/lib/config";

const TIPO_BADGE: Record<string, string> = {
  ENTRADA:           "bg-green-100 text-green-700",
  SALIDA:            "bg-red-100 text-red-700",
  TRANSFERENCIA_IN:  "bg-blue-100 text-blue-700",
  TRANSFERENCIA_OUT: "bg-amber-100 text-amber-700",
};

function fmtFecha(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  });
}

function fmtMonto(m: string) {
  return parseFloat(m).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function shortRef(ref: string | null) {
  if (!ref) return "—";
  return ref.slice(0, 8) + "…";
}

function ConfirmarButton({ movimientoId }: { movimientoId: string }) {
  const [state, action, pending] = useActionState(confirmarMovimientoCajaPendiente, null);

  if (state?.ok) {
    return (
      <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide bg-green-100 text-green-700">
        Confirmado
      </span>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-1 items-start">
      <input type="hidden" name="movimientoId" value={movimientoId} />
      <button
        type="submit"
        disabled={pending || readOnlyPreview}
        className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide bg-slate-800 text-white hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "…" : "Confirmar"}
      </button>
      {state?.error && (
        <span className="text-[9px] text-red-500 font-semibold">{state.error}</span>
      )}
    </form>
  );
}

function RevertirButton({ movimientoId }: { movimientoId: string }) {
  const [state, action, pending] = useActionState(revertirMovimientoCaja, null);

  if (state?.ok) {
    return (
      <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide bg-orange-100 text-orange-700">
        Revertido
      </span>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-1 items-start">
      <input type="hidden" name="movimientoId" value={movimientoId} />
      <button
        type="submit"
        disabled={pending || readOnlyPreview}
        title="Revertir movimiento"
        className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "…" : "Revertir"}
      </button>
      {state?.error && (
        <span className="text-[9px] text-red-500 font-semibold">{state.error}</span>
      )}
    </form>
  );
}

export function MovimientosCajaTable({ rows }: { rows: MovimientoCajaLedgerRow[] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-slate-400 py-6 text-center">Sin movimientos registrados.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left">
            {["Fecha", "Caja", "Tipo", "Moneda", "Monto", "Descripción", "Ref", "Estado", "Acciones"].map((h) => (
              <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0 ${!r.confirmado ? "bg-amber-50/40" : ""}`}>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtFecha(r.fecha)}</td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">{r.cajaLabel}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${TIPO_BADGE[r.tipo] ?? "bg-slate-100 text-slate-500"}`}>
                  {r.tipo.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3 text-xs font-bold text-slate-500">{r.moneda}</td>
              <td className={`px-4 py-3 text-xs font-black tabular-nums whitespace-nowrap ${
                r.tipo === "ENTRADA" || r.tipo === "TRANSFERENCIA_IN" ? "text-green-600" : "text-red-600"
              }`}>
                {r.tipo === "SALIDA" || r.tipo === "TRANSFERENCIA_OUT" ? "−" : "+"}{fmtMonto(r.monto)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 max-w-[220px] truncate">{r.descripcion ?? "—"}</td>
              <td className="px-4 py-3 text-[10px] font-mono text-slate-400 whitespace-nowrap">{shortRef(r.transferenciaRef)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex flex-col gap-1 items-start">
                  {!r.confirmado ? (
                    <ConfirmarButton movimientoId={r.id} />
                  ) : (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide bg-green-100 text-green-700">
                      Confirmado
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {r.confirmado && !r.descripcion?.startsWith("REVERSO |") && (
                  <RevertirButton movimientoId={r.id} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
