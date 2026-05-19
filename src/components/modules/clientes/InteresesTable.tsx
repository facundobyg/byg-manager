"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { aplicarInteresCC } from "@/app/(dashboard)/clientes/actions";
import { readOnlyPreview } from "@/lib/config";

const fmt = (value: string) =>
  parseFloat(value).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type InteresRow = {
  cliente: string;
  tipo: "CC" | "PF";
  base: string;
  tasa: string;
  dias: number;
  calculado: string;
  aplicado: string;
  nuevoSaldo: string;
  cuentaId?: string;
  puedeAplicar?: boolean;
};

type ActionResult = { success?: boolean; error?: string } | null;

const HEADERS = ["Cliente", "Tipo", "Base", "Tasa", "Días", "Calculado", "Aplicado", "Diferencia", "Nuevo Saldo", "Acción"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-md px-3 py-1.5 hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
    >
      {pending ? "Aplicando..." : "Aplicar"}
    </button>
  );
}

function AplicarForm({ cuentaId, aplicado }: { cuentaId: string; aplicado: string }) {
  const [state, action] = useActionState<ActionResult, FormData>(
    (_prev: ActionResult, fd: FormData) => aplicarInteresCC(fd),
    null
  );

  if (state?.success) {
    return <span className="text-green-600 text-xs font-semibold">Aplicado</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="cuentaId" value={cuentaId} />
        <input type="hidden" name="montoAplicado" value={aplicado} />
        <input type="hidden" name="descripcion" value="Interés CC" />
        <SubmitButton />
      </form>
      {state?.error && <span className="text-red-500 text-xs">{state.error}</span>}
    </div>
  );
}

export function InteresesTable({ items }: { items: InteresRow[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl py-12 px-6 shadow-sm flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
          <span className="text-slate-300 text-sm leading-none">-</span>
        </div>
        <p className="text-xs font-medium text-slate-500">Sin períodos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              {HEADERS.map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap ${
                    i >= 2 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row, i) => {
              const diferencia = parseFloat(row.calculado) - parseFloat(row.aplicado);
              const diferenciaColor = diferencia === 0 ? "text-emerald-600" : "text-amber-600";

              return (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-800 whitespace-nowrap">{row.cliente}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                        row.tipo === "CC" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {row.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-600 tabular-nums">{fmt(row.base)}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-500 tabular-nums">{row.tasa}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-500 tabular-nums">{row.dias}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold text-emerald-600 tabular-nums tracking-tight">{fmt(row.calculado)}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      defaultValue={row.aplicado}
                      className="w-24 text-right bg-white border border-slate-200 rounded-md px-2 py-1 text-[13px] tabular-nums font-semibold text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
                    />
                  </td>
                  <td className={`px-4 py-3 text-right text-[13px] font-semibold tabular-nums tracking-tight ${diferenciaColor}`}>
                    {fmt(diferencia.toFixed(2))}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-black text-slate-900 tabular-nums tracking-tight">{fmt(row.nuevoSaldo)}</td>
                  <td className="px-4 py-3 text-right">
                    {row.tipo === "CC" && row.cuentaId ? (
                      readOnlyPreview ? (
                        <span className="text-slate-300 text-xs">—</span>
                      ) : row.puedeAplicar ? (
                        <AplicarForm cuentaId={row.cuentaId} aplicado={row.aplicado} />
                      ) : (
                        <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Aplicado</span>
                      )
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
