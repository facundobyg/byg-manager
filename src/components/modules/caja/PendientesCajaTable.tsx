"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MovimientoCajaRow } from "@/lib/data/movimiento-caja";
import { cubrirParcialMovimientoCaja } from "@/app/(dashboard)/caja/actions";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFecha(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

const ESTADO_BADGE = {
  PENDIENTE: "bg-amber-50 text-amber-700",
  PARCIAL: "bg-blue-50 text-blue-600",
  CONFIRMADO: "bg-green-50 text-green-700",
};

const CATEGORIA_BADGE: Record<string, string> = {
  URGENCIA: "bg-red-50 text-red-600",
  ADELANTO: "bg-blue-50 text-blue-600",
  NORMAL: "bg-slate-100 text-slate-500",
};

const ROW_TINT: Record<string, string> = {
  URGENCIA: "bg-red-50/20 hover:bg-red-50/40",
  ADELANTO: "bg-blue-50/20 hover:bg-blue-50/40",
  NORMAL: "hover:bg-amber-50/30",
};

const HEADERS = ["Fecha", "Tipo", "Descripción", "Categoría", "Estado", "Total", "Cubierto", "Pendiente", "Acción"];

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-900 text-white hover:bg-blue-600 transition-colors disabled:opacity-40 whitespace-nowrap"
    >
      {pending ? "..." : "Cubrir"}
    </button>
  );
}

function CubrirForm({ movimientoId, cajaId, slug }: { movimientoId: string; cajaId: string; slug: string }) {
  const [state, action] = useActionState<{ success?: boolean; error?: string } | null, FormData>(
    cubrirParcialMovimientoCaja,
    null
  );

  if (state?.success) {
    return <span className="text-[10px] font-semibold text-green-600">Registrado</span>;
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <form action={action} className="flex items-center gap-1">
        <input type="hidden" name="movimientoId" value={movimientoId} />
        <input type="hidden" name="cajaId" value={cajaId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="descripcionExtra" value="" />
        <input
          type="number"
          name="montoCubierto"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          required
          className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-[10px] bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-200 tabular-nums"
        />
        <SubmitBtn />
      </form>
      {state?.error && <span className="text-[10px] text-red-500 max-w-[120px] text-right">{state.error}</span>}
    </div>
  );
}

export function PendientesCajaTable({ movimientos, slug }: { movimientos: MovimientoCajaRow[]; slug: string }) {
  if (movimientos.length === 0) {
    return (
      <div className="py-10 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
        <p className="text-sm text-slate-400 font-medium">No hay movimientos pendientes</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-amber-50/60 border-b border-amber-100">
            {HEADERS.map((h, i) => (
              <th
                key={h}
                className={`px-5 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider ${
                  i >= 5 && i < 8 ? "text-right" : i === 3 || i === 4 ? "text-center" : i === 8 ? "text-right" : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {movimientos.map((mov) => {
            const isEntry = mov.tipo === "ENTRADA" || mov.tipo === "TRANSFERENCIA_IN";
            return (
              <tr key={mov.id} className={`transition-colors ${ROW_TINT[mov.categoriaOperativa]}`}>
                <td className="px-5 py-3 text-xs text-slate-600 font-medium whitespace-nowrap">
                  {fmtFecha(mov.fecha)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    {isEntry ? (
                      <ArrowDownLeft size={14} className="text-green-600" />
                    ) : (
                      <ArrowUpRight size={14} className="text-red-500" />
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                      isEntry ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"
                    }`}>
                      {mov.tipo.replace("_", " ")}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500 italic max-w-[160px] truncate">
                  {mov.descripcion || "Sin descripción"}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase tracking-widest ${CATEGORIA_BADGE[mov.categoriaOperativa]}`}>
                    {mov.categoriaOperativa}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase tracking-widest ${ESTADO_BADGE[mov.estadoVisual]}`}>
                    {mov.estadoVisual}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-right tabular-nums font-semibold text-slate-700">
                  <span className="text-[10px] text-slate-400 mr-1">{mov.moneda}</span>
                  {fmtNum(mov.montoTotal)}
                </td>
                <td className="px-5 py-3 text-xs text-right tabular-nums font-semibold">
                  {mov.montoCubierto > 0 ? (
                    <span className="text-blue-600">{fmtNum(mov.montoCubierto)}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-right tabular-nums font-semibold">
                  {mov.montoPendiente > 0 ? (
                    <span className="text-amber-600">{fmtNum(mov.montoPendiente)}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {mov.estadoVisual !== "CONFIRMADO" ? (
                    <CubrirForm movimientoId={mov.id} cajaId={mov.cajaId} slug={slug} />
                  ) : (
                    <span className="text-[10px] text-green-600 font-semibold">Cubierto</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
