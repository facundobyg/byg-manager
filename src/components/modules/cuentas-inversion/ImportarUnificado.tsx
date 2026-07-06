"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { ImportarXlsx } from "./ImportarXlsx";
import { BindImportUpload } from "./BindImportUpload";
import type { getBindImportBatch } from "@/app/(dashboard)/cuentas-inversion/importaciones/bind/actions";

type Batch = Awaited<ReturnType<typeof getBindImportBatch>>;
type Tab = "excel" | "bind";

type HistorialRow = {
  id: string;
  fecha: string;
  cuentaNombre: string;
  nombreArchivo: string;
  filasTotal: number;
  filasImportadas: number;
};

export function ImportarUnificado({
  cuentas,
  historial,
  initialBatch,
  defaultTab,
}: {
  cuentas: { id: string; nombre: string }[];
  historial: HistorialRow[];
  initialBatch: Batch;
  defaultTab: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div className="flex flex-col gap-8">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab("excel")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "excel"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileSpreadsheet size={14} />
          Excel / XLSX
        </button>
        <button
          type="button"
          onClick={() => setTab("bind")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "bind"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText size={14} />
          PDF Bind
        </button>
      </div>

      {/* Excel tab */}
      {tab === "excel" && (
        <>
          <ImportarXlsx cuentas={cuentas} />

          {historial.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Historial de importaciones Excel
              </h2>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["Fecha", "Cuenta", "Archivo", "Filas totales", "Importadas"].map((h, i) => (
                        <th
                          key={i}
                          className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i >= 3 ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((h) => (
                      <tr key={h.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 text-slate-500">{h.fecha}</td>
                        <td className="px-4 py-2.5 text-slate-700 font-medium">{h.cuentaNombre}</td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono">{h.nombreArchivo}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{h.filasTotal}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold text-emerald-700">{h.filasImportadas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* Bind tab */}
      {tab === "bind" && (
        <div className="pb-20">
          <BindImportUpload initialBatch={initialBatch} />
        </div>
      )}
    </div>
  );
}
