"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Upload, AlertCircle, FileText } from "lucide-react";
import {
  uploadBindPdfsAction,
  getBindImportBatch,
  getBindImportFileDetail,
  type UploadBindPdfsResult,
} from "@/app/(dashboard)/cuentas-inversion/importaciones/bind/actions";
import { Modal } from "@/components/ui/Modal";

type Batch = Awaited<ReturnType<typeof getBindImportBatch>>;
type FileDetail = Awaited<ReturnType<typeof getBindImportFileDetail>>;

const STATUS_BADGE: Record<string, string> = {
  PARSED: "bg-emerald-100 text-emerald-700",
  READY: "bg-emerald-100 text-emerald-700",
  ERROR: "bg-rose-100 text-rose-700",
  DUPLICATE: "bg-amber-100 text-amber-700",
  NEEDS_ACCOUNT_MAPPING: "bg-orange-100 text-orange-700",
  NEEDS_TICKER_MAPPING: "bg-orange-100 text-orange-700",
  PARTIAL_ERROR: "bg-rose-100 text-rose-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-slate-100 text-slate-600",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${STATUS_BADGE[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return "—";
  return `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BindImportUpload({ initialBatch }: { initialBatch: Batch }) {
  const [batch, setBatch] = useState<Batch>(initialBatch);
  const [uploadResult, setUploadResult] = useState<UploadBindPdfsResult | null>(null);
  const [detail, setDetail] = useState<FileDetail | null>(null);
  const [detailLoading, startDetailLoad] = useTransition();
  const [state, formAction, pending] = useActionState<UploadBindPdfsResult | null, FormData>(uploadBindPdfsAction, null);

  useEffect(() => {
    if (!state) return;
    setUploadResult(state);
    if (state.ok && state.batchId) {
      startDetailLoad(async () => {
        const refreshed = await getBindImportBatch(state.batchId!);
        setBatch(refreshed);
      });
    }
  }, [state]);

  function openDetail(fileId: string) {
    startDetailLoad(async () => {
      const d = await getBindImportFileDetail(fileId);
      setDetail(d);
    });
  }

  const duplicateCount = uploadResult?.results.filter((r) => r.status === "DUPLICATE").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Upload */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
          {batch ? "Agregar más archivos a este lote" : "1 — Subir PDFs"}
        </p>
        <form action={formAction} className="flex flex-wrap items-end gap-4">
          <input type="hidden" name="batchId" value={batch?.id ?? ""} />
          <div className="space-y-1 flex-1 min-w-64">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">PDFs Bind (hasta 15 por tanda)</label>
            <input
              name="files"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all disabled:bg-slate-300 cursor-pointer"
          >
            <Upload size={14} />
            {pending ? "Procesando…" : "Subir y previsualizar"}
          </button>
        </form>
        {uploadResult && !uploadResult.ok && (
          <p className="mt-3 text-sm text-red-600 font-bold flex items-center gap-2">
            <AlertCircle size={14} /> {uploadResult.error}
          </p>
        )}
        {uploadResult?.ok && uploadResult.results.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resultado de esta tanda</p>
            {uploadResult.results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <StatusBadge status={r.status} />
                <span className="font-mono text-slate-600">{r.fileName}</span>
                <span className="text-slate-400">— {r.message}</span>
              </div>
            ))}
            {duplicateCount > 0 && (
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                {duplicateCount} archivo(s) ya estaban importados — no se duplicaron filas.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Resumen del lote */}
      {batch && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">2 — Resumen del lote</p>
            <StatusBadge status={batch.status} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              { label: "Total archivos", value: batch.totalFiles },
              { label: "Parseados OK", value: batch.parsedFiles },
              { label: "Con error", value: batch.errorFiles },
              { label: "Confirmados", value: batch.confirmedFiles },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <p className="text-[10px] font-bold uppercase text-slate-400">{item.label}</p>
                <p className="text-2xl font-black text-slate-900 tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Archivo", "Cuenta", "Denominación", "Fecha reporte", "Comitente", "Total ARS", "Estado", ""].map((h, i) => (
                    <th key={i} className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batch.Files.map((f) => (
                  <tr key={f.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-3 py-2 font-mono text-slate-600 max-w-40 truncate">{f.fileName}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">{f.accountNumber ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-600 max-w-40 truncate">{f.accountName ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-500">{f.reportDate ? new Date(f.reportDate).toLocaleDateString("es-AR") : "—"}</td>
                    <td className="px-3 py-2">
                      {f.MatchedComitente
                        ? <span className="text-emerald-700 font-bold">{f.MatchedComitente.nombre}</span>
                        : <span className="text-orange-600 font-bold">Vincular</span>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-800">{fmtMoney(f.totalAmountARS ? Number(f.totalAmountARS) : null)}</td>
                    <td className="px-3 py-2"><StatusBadge status={f.status} /></td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => openDetail(f.id)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold">
                        <FileText size={12} /> Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              disabled
              title="Próximo módulo"
              className="px-5 py-2 bg-slate-200 text-slate-400 rounded-lg text-sm font-bold cursor-not-allowed"
            >
              Confirmar importación real (Próximo módulo)
            </button>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {(detail || detailLoading) && (
        <Modal title="Detalle del archivo" accentColor="text-blue-600" maxWidth="max-w-2xl" onClose={() => setDetail(null)}>
          <div className="p-5 max-h-[70vh] overflow-y-auto">
            {detailLoading && !detail ? (
              <p className="text-sm text-slate-400">Cargando…</p>
            ) : detail ? (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <p><span className="text-slate-400">Archivo:</span> <span className="font-mono">{detail.file.fileName}</span></p>
                  <p><span className="text-slate-400">Cuenta:</span> {detail.file.accountNumber} — {detail.file.accountName}</p>
                  <p><span className="text-slate-400">Comitente vinculado:</span> {detail.file.MatchedComitente?.nombre ?? "sin vincular"}</p>
                  <p><span className="text-slate-400">Total general:</span> {fmtMoney(detail.file.totalAmountARS ? Number(detail.file.totalAmountARS) : null)}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Secciones</p>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {detail.sections.map((s) => (
                      <div key={s.name} className="px-3 py-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{s.name}</span>
                        <span className="text-slate-400">{s.rows.length} filas</span>
                        <span className="font-mono font-bold text-slate-800">{fmtMoney(s.totalAmountARS)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {detail.unmappedTickers.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">
                      Tickers sin mapear ({detail.unmappedTickers.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.unmappedTickers.map((t, i) => (
                        <span key={i} className="text-[11px] font-mono bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                          {t.ticker ?? t.descripcion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {detail.cauciones.length > 0 && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">
                      ⚠ Cauciones detectadas ({detail.cauciones.length})
                    </p>
                    {detail.cauciones.map((c) => (
                      <p key={c.id} className="text-xs text-rose-700">{c.descriptionClean}</p>
                    ))}
                  </div>
                )}

                {detail.file.warningsJson != null && Array.isArray(detail.file.warningsJson) && detail.file.warningsJson.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Warnings del parser</p>
                    <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-0.5">
                      {(detail.file.warningsJson as string[]).map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </Modal>
      )}
    </div>
  );
}
