"use client";

import { useActionState, useState, useRef } from "react";
import { parseXlsxAction, importHoldingsAction, ParsedRow, ParseState, ImportState } from "@/app/(dashboard)/cuentas-inversion/importar/actions";
import { CategoriaHoldingInversion } from "@prisma/client";
import { Upload, Check, AlertCircle } from "lucide-react";

const CATEGORIAS: CategoriaHoldingInversion[] = ["BONO", "ON", "ACCION", "CEDEAR", "FCI", "CAUCION"];
const CAT_LABEL: Record<CategoriaHoldingInversion, string> = {
  BONO: "Bono", ON: "ON", ACCION: "Acción", CEDEAR: "CEDEAR", FCI: "FCI", CAUCION: "Caución",
};

const iCls = "border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all";

type Cuenta = { id: string; nombre: string };

export function ImportarXlsx({ cuentas }: { cuentas: Cuenta[] }) {
  const [parseState, parseAction, parsePending] = useActionState<ParseState | null, FormData>(parseXlsxAction, null);
  const [importState, importAction, importPending] = useActionState<ImportState | null, FormData>(importHoldingsAction, null);

  // Categoria overrides: index → new value
  const [catOverrides, setCatOverrides] = useState<Record<number, CategoriaHoldingInversion>>({});
  const [createNew, setCreateNew] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Merged rows with overrides
  const rows: ParsedRow[] = (parseState?.rows ?? []).map((r, i) => ({
    ...r,
    categoria: catOverrides[i] ?? r.categoria,
  }));

  const newCount      = rows.filter((r) => !r.exists).length;
  const existsCount   = rows.filter((r) => r.exists).length;
  const hasRows       = rows.length > 0;
  const importDone    = importState?.done;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Step 1: Upload ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">1 — Cargar archivo</p>
        <form action={parseAction} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1 flex-1 min-w-48">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Cuenta de inversión *</label>
            <select name="cuentaId" required className={`w-full ${iCls} font-medium`}>
              <option value="">Seleccionar…</option>
              {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1 flex-1 min-w-48">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Archivo .xlsx *</label>
            <input ref={fileRef} name="file" type="file" accept=".xlsx,.xls" required className={`w-full ${iCls} file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700`} />
          </div>
          <button
            type="submit"
            disabled={parsePending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all disabled:bg-slate-300 cursor-pointer"
          >
            <Upload size={14} />
            {parsePending ? "Procesando…" : "Parsear archivo"}
          </button>
        </form>
        {parseState?.error && (
          <p className="mt-3 text-sm text-red-600 font-bold flex items-center gap-2">
            <AlertCircle size={14} /> {parseState.error}
          </p>
        )}
      </div>

      {/* ── Step 2: Preview ─────────────────────────────────────────────── */}
      {hasRows && !importDone && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">2 — Vista previa</p>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-600">{existsCount} existentes</span>
              <span className="text-amber-600">{newCount} nuevos</span>
              <span className="text-slate-500">{rows.length} total</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Estado", "N° Comitente", "Nombre", "Ticker", "Descripción", "Categoría", "Cantidad", "Precio", "Moneda"].map((h, i) => (
                    <th key={i} className={`px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i >= 6 ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 bg-white hover:bg-slate-50/60">
                    <td className="px-3 py-2">
                      {r.exists
                        ? <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Existe</span>
                        : <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">Nuevo</span>}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-700">{r.nroComitente}</td>
                    <td className="px-3 py-2 text-slate-600 max-w-32 truncate">{r.nombre}</td>
                    <td className="px-3 py-2 font-mono font-bold text-slate-800">{r.ticker}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-40 truncate">{r.descripcion || "—"}</td>
                    <td className="px-3 py-2">
                      <select
                        value={catOverrides[i] ?? r.categoria}
                        onChange={(e) => setCatOverrides((prev) => ({ ...prev, [i]: e.target.value as CategoriaHoldingInversion }))}
                        className="border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        {CATEGORIAS.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">{r.cantidad.toLocaleString("es-AR", { minimumFractionDigits: 4 })}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">{r.precio > 0 ? r.precio.toLocaleString("es-AR", { minimumFractionDigits: 4 }) : "—"}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{r.moneda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Confirm form */}
          <form action={importAction} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center gap-4">
            <input type="hidden" name="cuentaId"  value={parseState?.cuentaId ?? ""} />
            <input type="hidden" name="filename"  value={parseState?.filename  ?? ""} />
            <input type="hidden" name="rows"      value={JSON.stringify(rows)} />
            <input type="hidden" name="createNew" value={createNew ? "1" : "0"} />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createNew}
                onChange={(e) => setCreateNew(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Crear comitentes nuevos ({newCount})
              </span>
            </label>

            <p className="text-xs text-slate-400 flex-1">
              Holdings existentes: solo actualiza precio actual. Holdings nuevos: se crean con los datos del archivo.
            </p>

            <button
              type="submit"
              disabled={importPending}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all disabled:bg-slate-300 cursor-pointer"
            >
              <Check size={14} />
              {importPending ? "Importando…" : "Confirmar importación"}
            </button>
          </form>
        </div>
      )}

      {/* ── Step 3: Result ──────────────────────────────────────────────── */}
      {importDone && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Importación completada</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Holdings creados",    value: importState.created ?? 0 },
              { label: "Precios actualizados", value: importState.updated ?? 0 },
              { label: "Omitidos",            value: importState.skipped ?? 0 },
              { label: "Comitentes nuevos",   value: importState.newComitentes ?? 0 },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <p className="text-[10px] font-bold uppercase text-emerald-600">{item.label}</p>
                <p className="text-2xl font-black text-emerald-900 tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
          {(importState.errors?.length ?? 0) > 0 && (
            <div className="mt-2">
              <p className="text-xs font-bold text-red-700 mb-1">Errores parciales:</p>
              {importState.errors!.map((e, i) => (
                <p key={i} className="text-xs text-red-600">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
