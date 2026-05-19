"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { revertirOperacion } from "@/app/(dashboard)/clientes/actions";

export interface LedgerRow {
  operationRef: string | null;
  fecha: Date;
  clienteId: string;
  clienteNombre: string;
  tipoOperacion: string;
  descripcion: string;
  cantidadMovimientos: number;
  montoPrincipal: number;
  moneda: string;
  revertida: boolean;
  generoPlazoFijo: boolean;
  plazoFijoId: string | null;
  pfRevertido: boolean;
}

const OP_BADGE: Record<string, string> = {
  RULO: "bg-blue-50 text-blue-600",
  DIVISA: "bg-purple-50 text-purple-600",
  LP: "bg-green-50 text-green-600",
  INTERES: "bg-amber-50 text-amber-600",
  TRANSFERENCIA: "bg-slate-100 text-slate-500",
  REVERSO: "bg-red-50 text-red-500",
  MOV: "bg-slate-50 text-slate-400",
};

function opBadge(op: string) { return OP_BADGE[op] ?? OP_BADGE.MOV; }
function opLabel(op: string) {
  const map: Record<string, string> = {
    RULO: "RULO", DIVISA: "DIVISA", LP: "LP",
    INTERES: "INTERÉS", TRANSFERENCIA: "TRANSF.", REVERSO: "REVERSO",
  };
  return map[op] ?? "MOV";
}

function fmtFecha(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RevertButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-40 whitespace-nowrap"
    >
      {pending ? "..." : "Revertir"}
    </button>
  );
}

function RevertForm({ operationRef }: { operationRef: string }) {
  const [state, action] = useActionState<{ success?: boolean; error?: string } | null, FormData>(
    (_prev: { success?: boolean; error?: string } | null, fd: FormData) => revertirOperacion(fd),
    null
  );

  if (state?.success) return <span className="text-green-600 text-xs font-semibold">Revertido</span>;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <form action={action}>
        <input type="hidden" name="operationRef" value={operationRef} />
        <RevertButton />
      </form>
      {state?.error && <span className="text-red-500 text-[10px] max-w-[120px] text-right">{state.error}</span>}
    </div>
  );
}

export function OperacionHistoryTable({ rows }: { rows: LedgerRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-xs text-slate-400 text-center py-8 border border-slate-100 rounded-xl bg-slate-50">
        Sin operaciones registradas
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {["Fecha", "Operación", "Cliente", "Tipo", "Movs", "Monto", "Estado", "Resultado", "Acción"].map((h, i) => (
              <th
                key={h}
                className={`py-3 px-4 font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${
                  i >= 4 && i !== 8 ? "text-right" : i === 8 ? "text-center" : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-slate-50 last:border-0 transition-colors ${
                row.revertida ? "bg-red-50/30 hover:bg-red-50/60" : "hover:bg-slate-50"
              }`}
            >
              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{fmtFecha(row.fecha)}</td>
              <td className="py-3 px-4">
                {row.operationRef ? (
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {row.operationRef.slice(0, 8)}
                  </span>
                ) : (
                  <span className="text-slate-300 text-[10px]">—</span>
                )}
              </td>
              <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                <Link href={`/clientes/${row.clienteId}`} className="hover:text-blue-600 transition-colors">
                  {row.clienteNombre}
                </Link>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${opBadge(row.tipoOperacion)}`}>
                  {opLabel(row.tipoOperacion)}
                </span>
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-slate-400">{row.cantidadMovimientos}</td>
              <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-800">
                {row.moneda} {fmtNum(row.montoPrincipal)}
              </td>
              <td className="py-3 px-4 text-right">
                {row.revertida ? (
                  <span className="px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[10px] bg-red-50 text-red-500">
                    REVERTIDA
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[10px] bg-blue-50 text-blue-600">
                    ACTIVA
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {row.tipoOperacion === "LP" ? (
                  row.pfRevertido ? (
                    <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-red-50 text-red-500 whitespace-nowrap">
                      PF revertido
                    </span>
                  ) : row.generoPlazoFijo && row.plazoFijoId ? (
                    <Link
                      href={`/clientes/${row.clienteId}/pf/${row.plazoFijoId}`}
                      className="px-2 py-0.5 rounded-full font-black text-[10px] bg-green-50 text-green-600 hover:bg-green-100 transition-colors whitespace-nowrap"
                    >
                      PF creado
                    </Link>
                  ) : (
                    <span className="text-[10px] text-slate-400">LP generado</span>
                  )
                ) : (
                  <span className="text-slate-200">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                {row.operationRef && !row.revertida && row.tipoOperacion !== "INTERES" && row.tipoOperacion !== "REVERSO" ? (
                  <RevertForm operationRef={row.operationRef} />
                ) : (
                  <span className="text-slate-200">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
