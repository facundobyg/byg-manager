"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, AlertCircle, FileText, Link2, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle2, UserPlus } from "lucide-react";
import {
  uploadBindPdfsAction,
  getBindImportBatch,
  getBindImportFileDetail,
  getPendingBindMappings,
  getComitentesForSelect,
  getActivosForSelect,
  resolveBindAccountAliasAction,
  resolveBindTickerAliasAction,
  resolveBindTickerAliasesBulkAction,
  reprocessBindFileMappingsAction,
  confirmBindFileImportAction,
  getBindFileConfirmPreview,
  createAndResolveBindAccountAction,
  type UploadBindPdfsResult,
  type ResolveResult,
  type BulkResolveResult,
  type ReprocessResult,
  type PendingAccountMapping,
  type PendingTickerMapping,
  type ConfirmBindFileResult,
  type BindFileConfirmPreview,
  type CreateAndResolveResult,
} from "@/app/(dashboard)/cuentas-inversion/importaciones/bind/actions";
import { Modal } from "@/components/ui/Modal";

type Batch = Awaited<ReturnType<typeof getBindImportBatch>>;
type FileDetail = Awaited<ReturnType<typeof getBindImportFileDetail>>;
type Comitentes = Awaited<ReturnType<typeof getComitentesForSelect>>;
type Activos = Awaited<ReturnType<typeof getActivosForSelect>>;
type PendingMappings = { accounts: PendingAccountMapping[]; tickers: PendingTickerMapping[] } | null;

const STATUS_BADGE: Record<string, string> = {
  PARSED: "bg-emerald-100 text-emerald-700",
  READY: "bg-emerald-100 text-emerald-700",
  ERROR: "bg-rose-100 text-rose-700",
  DUPLICATE: "bg-amber-100 text-amber-700",
  NEEDS_ACCOUNT_MAPPING: "bg-orange-100 text-orange-700",
  NEEDS_TICKER_MAPPING: "bg-orange-100 text-orange-700",
  PARTIAL_ERROR: "bg-rose-100 text-rose-700",
  READY_TO_CONFIRM: "bg-emerald-100 text-emerald-700",
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

function fmtUSD(n: number | null | undefined) {
  if (n == null) return "—";
  return `USD ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function AccountResolveForm({ pending, comitentes, onResolved }: { pending: PendingAccountMapping; comitentes: Comitentes; onResolved: () => void }) {
  const [state, action, busy] = useActionState<ResolveResult | null, FormData>(resolveBindAccountAliasAction, null);

  useEffect(() => {
    if (state?.ok) onResolved();
  }, [state, onResolved]);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-slate-100 last:border-0">
      <input type="hidden" name="accountNumber" value={pending.accountNumber ?? ""} />
      <div className="flex-1 min-w-48 text-xs">
        <span className="font-mono font-bold text-slate-700">{pending.accountNumber}</span>
        <span className="text-slate-400"> — {pending.accountName} — {fmtMoney(pending.totalAmountARS)}</span>
      </div>
      <select name="comitenteId" required defaultValue="" className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
        <option value="" disabled>Elegir comitente…</option>
        {comitentes.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.nroComitente})</option>)}
      </select>
      <button type="submit" disabled={busy} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold">
        <Link2 size={12} /> {busy ? "Vinculando…" : "Vincular"}
      </button>
      {state && !state.ok && <p className="text-[11px] text-rose-600 font-bold w-full">{state.error}</p>}
    </form>
  );
}

function tickerKey(ticker: string, brokerCode: string | null) {
  return `${ticker}|${brokerCode ?? ""}`;
}

function TickerResolveForm({
  pending, activos, selectedActivoId, onSelectChange, onResolved,
}: {
  pending: PendingTickerMapping;
  activos: Activos;
  selectedActivoId: string;
  onSelectChange: (activoId: string) => void;
  onResolved: () => void;
}) {
  const [state, action, busy] = useActionState<ResolveResult | null, FormData>(resolveBindTickerAliasAction, null);

  useEffect(() => {
    if (state?.ok) onResolved();
  }, [state, onResolved]);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-slate-100 last:border-0">
      <input type="hidden" name="ticker" value={pending.ticker} />
      <input type="hidden" name="brokerCode" value={pending.brokerCode ?? ""} />
      <div className="flex-1 min-w-56 text-xs">
        <span className="font-mono font-bold text-slate-700">{pending.ticker}</span>
        {pending.brokerCode && <span className="text-slate-400 font-mono"> ({pending.brokerCode})</span>}
        <span className="text-slate-400"> — {pending.descriptionClean} — {pending.sectionType.replaceAll("_", " ")} — {pending.occurrences}x — {fmtMoney(pending.totalAmountARS)}</span>
      </div>
      <select
        name="activoId"
        required
        value={selectedActivoId}
        onChange={(e) => onSelectChange(e.target.value)}
        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white max-w-64"
      >
        <option value="" disabled>Elegir activo…</option>
        {activos.map((a) => <option key={a.id} value={a.id}>{a.ticker} — {a.categoria}/{a.monedaPrecio}</option>)}
      </select>
      <button type="submit" disabled={busy || !selectedActivoId} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold">
        <Link2 size={12} /> {busy ? "Vinculando…" : "Vincular"}
      </button>
      {state && !state.ok && <p className="text-[11px] text-rose-600 font-bold w-full">{state.error}</p>}
    </form>
  );
}

function CreateAndLinkForm({
  pending,
  productor,
  onProductorChange,
  onCreated,
}: {
  pending: PendingAccountMapping;
  productor: string;
  onProductorChange: (value: string) => void;
  onCreated: () => void;
}) {
  const [state, action, busy] = useActionState<CreateAndResolveResult | null, FormData>(
    createAndResolveBindAccountAction, null,
  );

  useEffect(() => { if (state?.ok) onCreated(); }, [state, onCreated]);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 px-3 py-2.5 bg-slate-50/50">
      <input type="hidden" name="accountNumber" value={pending.accountNumber ?? ""} />
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 w-full">
        <UserPlus size={10} /> Crear comitente nuevo y vincular
      </div>
      <input
        name="displayName"
        defaultValue={pending.accountName ?? ""}
        placeholder="Nombre del comitente"
        required
        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white min-w-48 flex-1"
      />
      <select
        name="productor"
        value={productor}
        onChange={(e) => onProductorChange(e.target.value)}
        required
        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
      >
        <option value="IPS">IPS</option>
        <option value="BYG">BYG</option>
        <option value="OTRO">Otro</option>
      </select>
      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold"
      >
        <UserPlus size={12} /> {busy ? "Creando…" : "Crear y vincular"}
      </button>
      {state && !state.ok && <p className="text-[11px] text-rose-600 font-bold w-full">{state.error}</p>}
      {state?.ok && <p className="text-[11px] text-emerald-600 font-bold w-full">✓ {state.comitenteName} creado y vinculado.</p>}
    </form>
  );
}

function ReprocessButton({ fileId, onDone }: { fileId: string; onDone: () => void }) {
  const [state, action, busy] = useActionState<ReprocessResult | null, FormData>(reprocessBindFileMappingsAction, null);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name="fileId" value={fileId} />
      <button type="submit" disabled={busy} className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-bold disabled:text-slate-300">
        <RefreshCw size={12} /> {busy ? "Recalculando…" : "Recalcular mappings"}
      </button>
      {state && (
        state.ok
          ? <span className="text-[10px] text-emerald-600">({state.resolvedCount}/{state.recheckedCount} resueltos)</span>
          : <span className="text-[10px] text-rose-600">{state.error}</span>
      )}
    </form>
  );
}

export function BindImportUpload({ initialBatch }: { initialBatch: Batch }) {
  const [batch, setBatch] = useState<Batch>(initialBatch);
  const [uploadResult, setUploadResult] = useState<UploadBindPdfsResult | null>(null);
  const [detail, setDetail] = useState<FileDetail | null>(null);
  const [pendingMappings, setPendingMappings] = useState<PendingMappings>(null);
  const [comitentes, setComitentes] = useState<Comitentes>([]);
  const [activos, setActivos] = useState<Activos>([]);
  const [tickerSelections, setTickerSelections] = useState<Record<string, string>>({});
  const [detailLoading, startDetailLoad] = useTransition();
  const [state, formAction, pending] = useActionState<UploadBindPdfsResult | null, FormData>(uploadBindPdfsAction, null);
  const [bulkState, bulkAction, bulkPending] = useActionState<BulkResolveResult | null, FormData>(resolveBindTickerAliasesBulkAction, null);

  // Confirm modal state
  const [confirmModalOpen, setConfirmModalOpen]     = useState(false);
  const [confirmPreviews, setConfirmPreviews]       = useState<BindFileConfirmPreview[]>([]);
  const [confirmResults, setConfirmResults]         = useState<ConfirmBindFileResult[]>([]);
  const [confirmPreviewLoading, startConfirmPreview]   = useTransition();
  const [confirmExecuting, startConfirmExecution]   = useTransition();

  const router = useRouter();

  // Bulk create comitentes — productor per account (default BYG)
  const [productorSelections, setProductorSelections] = useState<Record<string, string>>({});
  const [bulkCreating, startBulkCreate]               = useTransition();
  const [bulkCreateResults, setBulkCreateResults]     = useState<CreateAndResolveResult[]>([]);

  function refreshPendingData(batchId: string) {
    startDetailLoad(async () => {
      const [refreshedBatch, mappings] = await Promise.all([getBindImportBatch(batchId), getPendingBindMappings(batchId)]);
      setBatch(refreshedBatch);
      setPendingMappings(mappings);
    });
  }

  useEffect(() => {
    if (!state) return;
    setUploadResult(state);
    if (state.ok && state.batchId) {
      // Si TODO lo que se mandó ya estaba previsualizado antes, el lote
      // nuevo que se acaba de crear queda vacío (0 archivos reales) — mejor
      // abrir directamente el lote real donde sí está el archivo.
      const allDuplicates = state.results.length > 0 && state.results.every((r) => r.status === "DUPLICATE");
      const firstDup = state.results.find((r) => r.status === "DUPLICATE" && r.existingBatchId);
      const targetBatchId = allDuplicates && firstDup?.existingBatchId ? firstDup.existingBatchId : state.batchId;
      refreshPendingData(targetBatchId);
    }
  }, [state]);

  useEffect(() => {
    if (initialBatch?.id) refreshPendingData(initialBatch.id);
    getComitentesForSelect().then(setComitentes);
    getActivosForSelect().then(setActivos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (bulkState?.ok && batch?.id) {
      setTickerSelections({});
      refreshPendingData(batch.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkState]);

  function openDetail(fileId: string) {
    startDetailLoad(async () => {
      const d = await getBindImportFileDetail(fileId);
      setDetail(d);
    });
  }

  function handleBulkCreateAll() {
    const accounts = pendingMappings?.accounts ?? [];
    if (accounts.length === 0) return;
    setBulkCreateResults([]);
    startBulkCreate(async () => {
      const results: CreateAndResolveResult[] = [];
      for (const acc of accounts) {
        const fd = new FormData();
        fd.set("accountNumber", acc.accountNumber ?? "");
        fd.set("displayName",   acc.accountName   ?? "");
        fd.set("productor",     productorSelections[acc.accountNumber ?? ""] ?? "BYG");
        const r = await createAndResolveBindAccountAction(null, fd);
        results.push(r);
      }
      setBulkCreateResults(results);
      if (results.some((r) => r.ok) && batch?.id) refreshPendingData(batch.id);
    });
  }

  const readyFiles = batch?.Files.filter((f) => f.status === "READY") ?? [];
  const canConfirm =
    batch?.status === "READY_TO_CONFIRM" &&
    readyFiles.length > 0 &&
    readyFiles.every((f) => f.MatchedComitente != null);

  function handleOpenConfirmModal() {
    setConfirmResults([]);
    setConfirmPreviews([]);
    setConfirmModalOpen(true);
    startConfirmPreview(async () => {
      const previews = await Promise.all(readyFiles.map((f) => getBindFileConfirmPreview(f.id)));
      setConfirmPreviews(previews.filter((p): p is BindFileConfirmPreview => p !== null));
    });
  }

  function handleConfirmImport() {
    startConfirmExecution(async () => {
      const results: ConfirmBindFileResult[] = [];
      for (const preview of confirmPreviews) {
        const fd = new FormData();
        fd.set("fileId", preview.fileId);
        const r = await confirmBindFileImportAction(null, fd);
        results.push(r);
      }
      setConfirmResults(results);
      if (results.every((r) => r.ok) && batch?.id) {
        refreshPendingData(batch.id);
      }
    });
  }

  function handleCloseConfirmModal() {
    if (confirmExecuting) return;
    setConfirmModalOpen(false);
    setConfirmPreviews([]);
    setConfirmResults([]);
  }

  function setTickerSelection(ticker: string, brokerCode: string | null, activoId: string) {
    setTickerSelections((prev) => ({ ...prev, [tickerKey(ticker, brokerCode)]: activoId }));
  }

  const tickerBulkSelections = (pendingMappings?.tickers ?? [])
    .map((t) => ({ ticker: t.ticker, brokerCode: t.brokerCode, activoId: tickerSelections[tickerKey(t.ticker, t.brokerCode)] ?? "" }))
    .filter((s) => s.activoId);

  const duplicateCount = uploadResult?.results.filter((r) => r.status === "DUPLICATE").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Aviso de seguridad */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3">
        <ShieldAlert size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-[12px] text-blue-800">
          <strong>Esto es preview/staging.</strong> Nada de lo que pasa acá modifica holdings, carteras ni precios reales todavía.
          Los alias que vincules (cuenta → comitente, ticker → activo) sí se guardan y van a aplicarse automáticamente en futuros imports —
          si vinculás algo mal, podés corregirlo después editando o desactivando el alias.
          La confirmación real requiere aprobación explícita en el paso 2 y no se puede deshacer automáticamente.
        </div>
      </div>

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
                {r.status === "DUPLICATE" && r.existingBatchId && (
                  <button
                    type="button"
                    onClick={() => refreshPendingData(r.existingBatchId!)}
                    className="text-blue-600 hover:text-blue-800 font-bold underline"
                  >
                    Abrir lote existente →
                  </button>
                )}
              </div>
            ))}
            {duplicateCount > 0 && (
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                {duplicateCount} archivo(s) ya habían sido previsualizados antes — no se duplicaron filas, no se aplicó ningún import real.
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
                      <div className="flex items-center justify-end gap-3">
                        {f.status === "NEEDS_TICKER_MAPPING" && (
                          <ReprocessButton fileId={f.id} onDone={() => refreshPendingData(batch.id)} />
                        )}
                        <button onClick={() => openDetail(f.id)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold">
                          <FileText size={12} /> Ver detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              disabled={!canConfirm}
              onClick={canConfirm ? handleOpenConfirmModal : undefined}
              title={
                !canConfirm
                  ? batch?.status !== "READY_TO_CONFIRM"
                    ? `Estado del lote: ${batch?.status ?? "—"}`
                    : readyFiles.some((f) => !f.MatchedComitente)
                    ? "Todos los archivos deben tener comitente vinculado"
                    : "No hay archivos en estado READY"
                  : "Confirmar importación a holdings reales"
              }
              className={
                canConfirm
                  ? "flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold"
                  : "px-5 py-2 bg-slate-200 text-slate-400 rounded-lg text-sm font-bold cursor-not-allowed"
              }
            >
              Confirmar importación real
            </button>
            {batch?.status === "READY_TO_CONFIRM" && readyFiles.some((f) => !f.MatchedComitente) && (
              <p className="text-xs text-orange-600">Todos los archivos deben tener comitente vinculado.</p>
            )}
          </div>
        </div>
      )}

      {/* Resolución de cuentas pendientes */}
      {pendingMappings && pendingMappings.accounts.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">
              3 — Vincular cuentas pendientes ({pendingMappings.accounts.length})
            </p>
            {/* Bulk create all — uses per-row productor */}
            <button
              type="button"
              disabled={bulkCreating}
              onClick={handleBulkCreateAll}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold"
            >
              <UserPlus size={12} /> {bulkCreating ? "Creando…" : `Crear y vincular todos (${pendingMappings.accounts.length})`}
            </button>
          </div>

          {bulkCreateResults.length > 0 && (
            <div className="mb-3 flex flex-col gap-1">
              {bulkCreateResults.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <StatusBadge status={r.ok ? "READY" : "ERROR"} />
                  {r.ok
                    ? <span className="text-emerald-700 font-bold">{r.comitenteName} — vinculado</span>
                    : <span className="text-rose-600">{r.error}</span>}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {pendingMappings.accounts.map((a) => (
              <div key={a.fileId} className="divide-y divide-slate-50 border-b border-slate-100 last:border-0">
                <AccountResolveForm pending={a} comitentes={comitentes} onResolved={() => refreshPendingData(batch!.id)} />
                <CreateAndLinkForm
                  pending={a}
                  productor={productorSelections[a.accountNumber ?? ""] ?? "BYG"}
                  onProductorChange={(val) => setProductorSelections((prev) => ({ ...prev, [a.accountNumber ?? ""]: val }))}
                  onCreated={() => refreshPendingData(batch!.id)}
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Vinculá a un comitente existente (arriba) o creá uno nuevo directamente desde acá (abajo). Los alias se guardan para futuros imports.
          </p>
        </div>
      )}

      {/* Resolución de tickers pendientes */}
      {pendingMappings && pendingMappings.tickers.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">
              4 — Vincular tickers pendientes ({pendingMappings.tickers.length})
            </p>
            <form action={bulkAction}>
              <input type="hidden" name="selections" value={JSON.stringify(tickerBulkSelections)} />
              <button
                type="submit"
                disabled={bulkPending || tickerBulkSelections.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold"
              >
                <Link2 size={12} /> {bulkPending ? "Guardando…" : `Guardar vínculos seleccionados (${tickerBulkSelections.length})`}
              </button>
            </form>
          </div>

          {bulkState?.ok && bulkState.results && (
            <div className="mb-3 flex flex-col gap-1">
              {bulkState.results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <StatusBadge status={r.ok ? "READY" : "ERROR"} />
                  <span className="font-mono text-slate-600">{r.ticker}</span>
                  {!r.ok && <span className="text-rose-600">— {r.error}</span>}
                </div>
              ))}
            </div>
          )}
          {bulkState && !bulkState.ok && (
            <p className="mb-3 text-xs text-rose-600 font-bold">{bulkState.error}</p>
          )}

          <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {pendingMappings.tickers.map((t) => (
              <TickerResolveForm
                key={tickerKey(t.ticker, t.brokerCode)}
                pending={t}
                activos={activos}
                selectedActivoId={tickerSelections[tickerKey(t.ticker, t.brokerCode)] ?? ""}
                onSelectChange={(activoId) => setTickerSelection(t.ticker, t.brokerCode, activoId)}
                onResolved={() => {
                  setTickerSelections((prev) => {
                    const next = { ...prev };
                    delete next[tickerKey(t.ticker, t.brokerCode)];
                    return next;
                  });
                  refreshPendingData(batch!.id);
                }}
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Si elegís un activo incompatible por moneda/categoría (ej. SUPV local vs. SUPV ADR en USD), el sistema lo va a rechazar — hay que corregir el catálogo primero.
          </p>
        </div>
      )}

      {/* Modal de confirmación real */}
      {confirmModalOpen && (
        <Modal
          title={!confirmExecuting && confirmResults.length > 0 && confirmResults.every((r) => r.ok) ? "Importación confirmada" : "Confirmar importación real"}
          accentColor="text-rose-600"
          maxWidth="max-w-2xl"
          onClose={handleCloseConfirmModal}
        >
          <div className="p-5 max-h-[80vh] overflow-y-auto flex flex-col gap-5">

            {/* Fase: cargando preview */}
            {confirmPreviewLoading && (
              <p className="text-sm text-slate-400">Calculando resumen…</p>
            )}

            {/* Fase: preview cargado, sin resultados */}
            {!confirmPreviewLoading && confirmResults.length === 0 && (
              <>
                {confirmPreviews.length === 0 ? (
                  <p className="text-sm text-rose-600">No se pudo cargar la vista previa. Verificá que el archivo esté en estado READY.</p>
                ) : (
                  <>
                    {confirmPreviews.map((preview) => (
                      <div key={preview.fileId} className="flex flex-col gap-4">
                        {/* Datos del archivo */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div>
                            <span className="text-slate-400">Comitente:</span>{" "}
                            <span className="font-bold text-slate-800">{preview.comitente}</span>
                            <span className="text-slate-400"> ({preview.nroComitente})</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Cuenta Bind:</span>{" "}
                            <span className="font-mono font-bold text-slate-800">{preview.cuentaBind ?? "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Fecha reporte:</span>{" "}
                            <span className="font-bold text-slate-800">{preview.reportDate ?? "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Total ARS:</span>{" "}
                            <span className="font-mono font-bold text-slate-800">{fmtMoney(preview.totalAmountARS)}</span>
                          </div>
                        </div>

                        {/* Holdings */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-50 rounded-lg px-3 py-2">
                            <p className="text-[10px] font-bold uppercase text-emerald-600 mb-0.5">Holdings a crear</p>
                            <p className="text-2xl font-black text-emerald-800 tabular-nums">{preview.toCreate.length}</p>
                            {preview.toCreate.length > 0 && (
                              <p className="text-[10px] text-emerald-600 mt-1 break-all">{preview.toCreate.join(", ")}</p>
                            )}
                          </div>
                          <div className="bg-blue-50 rounded-lg px-3 py-2">
                            <p className="text-[10px] font-bold uppercase text-blue-600 mb-0.5">Holdings a actualizar precio</p>
                            <p className="text-2xl font-black text-blue-800 tabular-nums">{preview.toUpdate.length}</p>
                            {preview.toUpdate.length > 0 && (
                              <p className="text-[10px] text-blue-600 mt-1 break-all">{preview.toUpdate.join(", ")}</p>
                            )}
                          </div>
                        </div>

                        {/* Saldos cash */}
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Saldos cash a reemplazar</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-50 rounded-lg px-3 py-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">ARS</p>
                              <p className="font-mono font-bold text-sm text-slate-800">{fmtMoney(preview.cashARS)}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg px-3 py-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">USD MEP</p>
                              <p className="font-mono font-bold text-sm text-slate-800">{fmtUSD(preview.cashMEP)}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg px-3 py-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">USD Cable</p>
                              <p className="font-mono font-bold text-sm text-slate-800">{fmtUSD(preview.cashCable)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Advertencia */}
                    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <p className="text-[12px] text-rose-800">
                        <strong>Esta acción escribirá holdings y saldos reales. No se puede deshacer automáticamente.</strong>{" "}
                        Los holdings existentes solo actualizarán su precio actual; los nuevos se crearán con cantidad y precio del PDF.
                      </p>
                    </div>

                    {/* Botones */}
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        type="button"
                        onClick={handleCloseConfirmModal}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={confirmExecuting}
                        onClick={handleConfirmImport}
                        className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold"
                      >
                        {confirmExecuting ? "Confirmando…" : "Confirmar importación real"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Fase: ejecución en curso */}
            {confirmExecuting && (
              <p className="text-sm text-slate-400">Escribiendo holdings y saldos reales…</p>
            )}

            {/* Fase: resultados */}
            {!confirmExecuting && confirmResults.length > 0 && (
              <div className="flex flex-col gap-4">
                {confirmResults.map((result, i) => (
                  <div key={i}>
                    {result.ok ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                          <CheckCircle2 size={16} /> Confirmación exitosa
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800 space-y-1">
                          {result.created.length > 0 && (
                            <p><strong>Holdings creados ({result.created.length}):</strong> {result.created.join(", ")}</p>
                          )}
                          {result.updated.length > 0 && (
                            <p><strong>Holdings actualizados precio ({result.updated.length}):</strong> {result.updated.join(", ")}</p>
                          )}
                          {result.cashUpdated && <p><strong>Saldos cash reemplazados.</strong></p>}
                          {result.skipped.length > 0 && (
                            <p className="text-emerald-600">Omitidos: {result.skipped.join(", ")}</p>
                          )}
                          {result.quantityDiscrepancies.length > 0 && (
                            <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="font-bold text-amber-800">Discrepancias de cantidad ({result.quantityDiscrepancies.length}):</p>
                              {result.quantityDiscrepancies.map((d, j) => (
                                <p key={j} className="text-amber-700">{d.ticker}: PDF {d.pdfQuantity} / actual {d.actualQuantity}</p>
                              ))}
                            </div>
                          )}
                          {result.warnings.map((w, j) => (
                            <p key={j} className="text-amber-700">⚠ {w}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                        <p className="text-rose-800 font-bold text-sm flex items-center gap-2">
                          <AlertTriangle size={14} /> Error al confirmar
                        </p>
                        <p className="text-xs text-rose-700 mt-1">{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCloseConfirmModal}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-bold"
                  >
                    Cerrar
                  </button>
                  {confirmResults.every((r) => r.ok) && (
                    <button
                      type="button"
                      onClick={() => { handleCloseConfirmModal(); router.push("/cuentas-inversion"); }}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold"
                    >
                      Ir a Banco Industrial →
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </Modal>
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
