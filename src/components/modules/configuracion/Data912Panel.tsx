"use client";

import { useState, useTransition } from "react";
import {
  getData912Status,
  runData912Preview,
  runData912Sync,
  setData912AutoSync,
  type Data912StatusResult,
  type PreviewActionResult,
  type SyncActionResult,
} from "@/app/(dashboard)/configuracion/data912/actions";

type Props = {
  initialStatus: Data912StatusResult;
  isAdmin: boolean;
  initialAutoSyncEnabled: boolean;
};

const BUCKET_LABELS: { key: keyof Data912StatusResult["activos"]; label: string; cls: string }[] = [
  { key: "DATA912",   label: "Data912",       cls: "bg-emerald-100 text-emerald-700" },
  { key: "MANUAL",    label: "Manual",        cls: "bg-slate-100 text-slate-600" },
  { key: "NOT_FOUND", label: "No encontrado", cls: "bg-amber-100 text-amber-700" },
  { key: "ERROR",     label: "Error",         cls: "bg-rose-100 text-rose-700" },
  { key: "STALE",     label: "Desactualizado", cls: "bg-orange-100 text-orange-700" },
];

function fmtDate(d: Date | null) {
  if (!d) return "Nunca";
  return new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function BucketRow({ title, bucket }: { title: string; bucket: Data912StatusResult["activos"] }) {
  const total = Object.values(bucket).reduce((a, b) => a + b, 0);
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
        {title} <span className="text-slate-300">({total})</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {BUCKET_LABELS.map(({ key, label, cls }) => (
          <span key={key} className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${cls}`}>
            {label}: {bucket[key]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Data912Panel({ initialStatus, isAdmin, initialAutoSyncEnabled }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [preview, setPreview] = useState<PreviewActionResult | null>(null);
  const [syncResult, setSyncResult] = useState<SyncActionResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(initialAutoSyncEnabled);
  const [autoSyncError, setAutoSyncError] = useState<string | null>(null);
  const [previewPending, startPreview] = useTransition();
  const [syncPending, startSync] = useTransition();
  const [autoSyncPending, startAutoSyncToggle] = useTransition();

  function handleToggleAutoSync() {
    const next = !autoSyncEnabled;
    setAutoSyncError(null);
    startAutoSyncToggle(async () => {
      const result = await setData912AutoSync(next);
      if (result.ok) setAutoSyncEnabled(next);
      else setAutoSyncError(result.error);
    });
  }

  function handlePreview() {
    setSyncResult(null);
    startPreview(async () => {
      const result = await runData912Preview();
      setPreview(result);
    });
  }

  function handleSyncClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    startSync(async () => {
      const result = await runData912Sync();
      setSyncResult(result);
      if (result.ok) {
        const refreshed = await getData912Status();
        setStatus(refreshed);
      }
    });
  }

  const matchedHint = preview?.ok ? preview.summary.matched : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Estado actual */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Estado actual</h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Última actualización: <span className="font-semibold text-slate-600">{fmtDate(status.lastSyncedAt)}</span>
          </p>
        </div>
        <div className="px-6 py-5 flex flex-col gap-5">
          <BucketRow title="Activos" bucket={status.activos} />
          <BucketRow title="Holdings" bucket={status.holdings} />
        </div>
      </section>

      {/* Cron diario */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Sincronización automática diaria</h2>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${autoSyncEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {autoSyncEnabled ? "ACTIVADO" : "DESACTIVADO"}
          </span>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3">
          <p className="text-[12px] text-slate-500">
            Corre todos los días a las 20:00 (Argentina) si está activado. Si Data912 falla, nunca borra ni pone en 0 precios existentes — solo marca el estado.
          </p>
          {isAdmin ? (
            <button
              onClick={handleToggleAutoSync}
              disabled={autoSyncPending}
              className={`self-start rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                autoSyncEnabled ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {autoSyncPending ? "Guardando..." : autoSyncEnabled ? "Desactivar cron" : "Activar cron"}
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 self-start">
              Solo un administrador puede activar/desactivar el cron.
            </span>
          )}
          {autoSyncError && <p className="text-[11px] text-rose-600 font-bold">{autoSyncError}</p>}
        </div>
      </section>

      {/* Acciones */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Acciones</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePreview}
              disabled={previewPending}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {previewPending ? "Previsualizando..." : "Previsualizar actualización"}
            </button>

            {isAdmin ? (
              <button
                onClick={handleSyncClick}
                disabled={syncPending}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  confirming ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-slate-800 text-white hover:bg-slate-900"
                }`}
              >
                {syncPending
                  ? "Sincronizando..."
                  : confirming
                    ? `Confirmar y sincronizar${matchedHint != null ? ` (${matchedHint})` : ""}`
                    : "Sincronizar precios ahora"}
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                Solo un administrador puede sincronizar precios.
              </span>
            )}

            {confirming && (
              <button
                onClick={() => setConfirming(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>

          {confirming && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Esto va a actualizar <strong>precioActual</strong> de los activos/holdings que matcheen con Data912
              {matchedHint != null ? <> (aprox. <strong>{matchedHint}</strong> registros)</> : null}. Los que no matcheen
              quedan en modo manual sin cambios de precio. ¿Confirmás?
            </div>
          )}
        </div>
      </section>

      {/* Resultado del sync (si se ejecutó) */}
      {syncResult && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Resultado de la sincronización</h2>
          </div>
          <div className="px-6 py-5">
            {!syncResult.ok ? (
              <p className="text-sm text-rose-600 font-medium">{syncResult.error}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <SummaryCard label="Activos actualizados" value={syncResult.summary.updatedActivos} />
                  <SummaryCard label="Holdings actualizados" value={syncResult.summary.updatedHoldings} />
                  <SummaryCard label="Historial creado" value={syncResult.summary.historyUpserts} />
                  <SummaryCard label="No encontrados" value={syncResult.summary.markedNotFound} />
                  <SummaryCard label="Errores de proveedor" value={syncResult.summary.markedProviderError} />
                  <SummaryCard label="Manuales (sin tocar)" value={syncResult.summary.skippedManualOnly} />
                  <SummaryCard label="Precio inválido" value={syncResult.summary.skippedInvalidPrice} />
                  <SummaryCard label="Fallidos" value={syncResult.summary.failedWrites} warn={syncResult.summary.failedWrites > 0} />
                </div>
                {syncResult.failedRows.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Filas fallidas</p>
                    <ProblematicTable rows={syncResult.failedRows.map((r) => ({ origin: "ACTIVO" as const, ticker: r.ticker, category: null, resolveStatus: "FAILED", reason: r.message }))} />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Resultado del preview */}
      {preview && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Previsualización (dry-run)</h2>
          </div>
          <div className="px-6 py-5">
            {!preview.ok ? (
              <p className="text-sm text-rose-600 font-medium">{preview.error}</p>
            ) : (
              <>
                <p className="text-[11px] text-slate-400 mb-3">
                  Data912: {preview.dataStatus.okCount}/{preview.dataStatus.okCount + preview.dataStatus.failedCount} endpoints OK
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <SummaryCard label="Matched" value={preview.summary.matched} />
                  <SummaryCard label="Manual only" value={preview.summary.manualOnly} />
                  <SummaryCard label="No encontrados" value={preview.summary.notFound} />
                  <SummaryCard label="Ambiguos" value={preview.summary.ambiguous} />
                  <SummaryCard label="Errores proveedor" value={preview.summary.providerErrors} warn={preview.summary.providerErrors > 0} />
                </div>
                {preview.problematicRows.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Casos problemáticos ({preview.problematicRows.length})
                    </p>
                    <ProblematicTable rows={preview.problematicRows} />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      <p className="text-[11px] text-slate-400 italic px-1">
        Data912 actualiza solo instrumentos compatibles. FCI, cripto y tickers no encontrados quedan en modo manual.
      </p>
    </div>
  );
}

function SummaryCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${warn ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"}`}>
      <p className={`text-2xl font-black tabular-nums ${warn ? "text-rose-700" : "text-slate-900"}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function ProblematicTable({
  rows,
}: {
  rows: { origin: "ACTIVO" | "HOLDING"; ticker: string; category: string | null; resolveStatus: string; reason: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-[11px]">
        <thead className="bg-slate-50 text-slate-400 uppercase tracking-wide">
          <tr>
            <th className="text-left px-3 py-2 font-bold">Origen</th>
            <th className="text-left px-3 py-2 font-bold">Ticker</th>
            <th className="text-left px-3 py-2 font-bold">Categoría</th>
            <th className="text-left px-3 py-2 font-bold">Estado</th>
            <th className="text-left px-3 py-2 font-bold">Motivo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={`${r.origin}-${r.ticker}-${i}`}>
              <td className="px-3 py-1.5 text-slate-500">{r.origin}</td>
              <td className="px-3 py-1.5 font-bold text-slate-800">{r.ticker}</td>
              <td className="px-3 py-1.5 text-slate-500">{r.category ?? "—"}</td>
              <td className="px-3 py-1.5 text-slate-500">{r.resolveStatus}</td>
              <td className="px-3 py-1.5 text-slate-400">{r.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
