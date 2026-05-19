"use client";

import { useActionState, useRef } from "react";
import { importPreciosExcel } from "@/app/(dashboard)/configuracion/actions";
import { Loader2, Upload } from "lucide-react";

const init: { error?: string; ok?: boolean; report?: { updated: string[]; created: string[]; skipped: number; errors: string[] } } = {};

export function PreciosBatchTextareaForm() {
  const [state, action, pending] = useActionState(importPreciosExcel, init);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const formData = new FormData();
      formData.append("csv", text);
      action(formData);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-6">
      <form ref={formRef} action={action} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pega el contenido o sube un archivo</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
          >
            <Upload size={12} />
            Subir archivo CSV
          </button>
          <input
            type="file"
            ref={fileRef}
            onChange={handleFileChange}
            accept=".csv,.txt"
            className="hidden"
          />
        </div>

        <textarea
          name="csv"
          rows={8}
          placeholder={"ticker;descripcion;categoria;monedaPrecio;precioActual;nuevoPrecio\nAL30;Bonos;BONO_USD;USD;65.20;66.00"}
          className="font-mono text-[12px] px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y bg-slate-50/50 placeholder:text-slate-300"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-[0.2em] py-3 rounded-xl transition-all shadow-sm"
        >
          {pending ? <><Loader2 size={14} className="animate-spin" /> Procesando…</> : "Procesar cambios"}
        </button>

        {"error" in state && state.error && (
          <p className="text-[11px] text-rose-600 font-bold">{state.error}</p>
        )}

        {state.report && (
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold">
            {state.report.updated.length > 0 && (
              <p className="text-emerald-600">✓ Actualizados ({state.report.updated.length}): {state.report.updated.join(", ")}</p>
            )}
            {state.report.created.length > 0 && (
              <p className="text-blue-600">+ Creados ({state.report.created.length}): {state.report.created.join(", ")}</p>
            )}
            {state.report.skipped > 0 && (
              <p className="text-slate-400">Omitidos: {state.report.skipped}</p>
            )}
            {state.report.errors.length > 0 && (
              <div className="flex flex-col gap-0.5 mt-1">
                <p className="text-rose-600">Errores ({state.report.errors.length}):</p>
                <ul className="list-disc list-inside text-rose-500 font-medium">
                  {state.report.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {state.report.errors.length > 5 && <li>Y {state.report.errors.length - 5} más...</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
