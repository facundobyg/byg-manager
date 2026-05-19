"use client";

import { useState } from "react";
import { Download, Upload, FileJson, AlertTriangle, CheckCircle2, Search, Info, Layers, Database } from "lucide-react";
import {
  exportarBackup,
  analizarViabilidadBackup,
  importarEtapa1Legacy, type ImportEtapa1Result,
  importarEtapa2Legacy, type ImportEtapa2Result,
  importarEtapa3Legacy, type ImportEtapa3Result,
} from "./actions";

type FormatoBackup = "NEW" | "LEGACY_BYG" | "INVALIDO" | null;

interface LegacySummary {
  clientes:     number;
  cajas:        number;
  ops_cambio:   number;
  ops_rulos:    number;
  ops_divint:   number;
  ops_lp:       number;
  pn_hist:      number;
  cart_hist:    number;
}

const MAPEO_LEGACY: { key: string; label: string }[] = [
  { key: "config",      label: "Configuración"                    },
  { key: "cajas",       label: "Cajas"                            },
  { key: "clientes",    label: "Clientes / CC / PF / Custodia"    },
  { key: "ops_cambio",  label: "Operaciones / Caja"               },
  { key: "ops_rulos",   label: "Rulos"                            },
  { key: "ops_divint",  label: "Dividendos e intereses"           },
  { key: "pn_hist",     label: "Historial Patrimonio Neto"        },
  { key: "cart_hist",   label: "Historial Carteras"               },
  { key: "inmob_movs / providencia", label: "Inmobiliarias"       },
];

function detectFormat(p: Record<string, unknown>): FormatoBackup {
  if (p.version && (p.exportedAt || p.fechaExport) && p.data && typeof p.data === "object") {
    return "NEW";
  }
  const legacyKeys = ["config", "cajas", "clientes", "ops_cambio", "ops_rulos", "pn_hist", "cart_hist"];
  if (legacyKeys.some((k) => k in p)) return "LEGACY_BYG";
  return "INVALIDO";
}

function buildLegacySummary(p: Record<string, unknown>): LegacySummary {
  const arr = (key: string): number => {
    const v = p[key];
    return Array.isArray(v) ? v.length : typeof v === "object" && v !== null ? Object.keys(v).length : 0;
  };
  return {
    clientes:   arr("clientes"),
    cajas:      arr("cajas"),
    ops_cambio: arr("ops_cambio"),
    ops_rulos:  arr("ops_rulos"),
    ops_divint: arr("ops_divint"),
    ops_lp:     arr("ops_largoplazo"),
    pn_hist:    arr("pn_hist"),
    cart_hist:  arr("cart_hist"),
  };
}

interface Preview2 {
  clientes:    number;
  conSaldoUSD: number;
  conSaldoARS: number;
  movsUSD:     number;
  movsARS:     number;
  pfs:         number;
  pfMovs:      number;
}

function buildPreview2(p: Record<string, unknown>): Preview2 {
  const arr: Record<string, unknown>[] = Array.isArray(p.clientes)
    ? (p.clientes as Record<string, unknown>[])
    : typeof p.clientes === "object" && p.clientes !== null
      ? (Object.values(p.clientes) as Record<string, unknown>[])
      : [];
  const pf = (c: Record<string, unknown>) =>
    Array.isArray(c.pfs) ? (c.pfs as Record<string, unknown>[]) : [];
  return {
    clientes:    arr.length,
    conSaldoUSD: arr.filter(c => (parseFloat(String(c.saldo_usd ?? c.saldo ?? 0)) || 0) !== 0).length,
    conSaldoARS: arr.filter(c => (parseFloat(String(c.saldo_ars ?? c.saldo_pesos ?? 0)) || 0) !== 0).length,
    movsUSD:     arr.reduce((s, c) => s + (Array.isArray(c.movs)     ? (c.movs     as unknown[]).length : 0), 0),
    movsARS:     arr.reduce((s, c) => s + (Array.isArray(c.movs_ars) ? (c.movs_ars as unknown[]).length : 0), 0),
    pfs:         arr.reduce((s, c) => s + pf(c).length, 0),
    pfMovs:      arr.reduce((s, c) => s + pf(c).reduce((a, p2) => a + (Array.isArray(p2.movs) ? (p2.movs as unknown[]).length : 0), 0), 0),
  };
}

export default function BackupPage() {
  const [loadingExport,  setLoadingExport]  = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [viabilidad,     setViabilidad]     = useState<any>(null);
  const [error,          setError]          = useState<string | null>(null);
  const [validacion,     setValidacion]     = useState<{ valid: boolean; missing: string[] } | null>(null);
  const [formato,        setFormato]        = useState<FormatoBackup>(null);
  const [legacySummary,  setLegacySummary]  = useState<LegacySummary | null>(null);
  const [legacyParsed,   setLegacyParsed]   = useState<Record<string, unknown> | null>(null);
  const [loadingImport1, setLoadingImport1] = useState(false);
  const [importResult1,  setImportResult1]  = useState<ImportEtapa1Result | null>(null);
  const [loadingImport2, setLoadingImport2] = useState(false);
  const [importResult2,  setImportResult2]  = useState<ImportEtapa2Result | null>(null);
  const [loadingImport3, setLoadingImport3] = useState(false);
  const [importResult3,  setImportResult3]  = useState<ImportEtapa3Result | null>(null);

  type PreviewRow = { label: string; imported: number };
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);

  type SnapshotEntry = { filename: string; importedAt: string; version: string; valid: boolean; totalRows: number };
  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);

  const handleExport = async () => {
    setLoadingExport(true);
    const res = await exportarBackup();
    if (res.ok && res.backup) {
      const blob = new Blob([JSON.stringify(res.backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `byg_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setLoadingExport(false);
  };

  const handleAnalyze = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingAnalyze(true);
    setError(null);
    setViabilidad(null);
    setValidacion(null);
    setPreview(null);
    setFormato(null);
    setLegacySummary(null);

    const fileInput = (e.currentTarget.elements as HTMLFormControlsCollection & { backup: HTMLInputElement }).backup;
    const file = fileInput?.files?.[0];

    if (file) {
      try {
        const text = await file.text();
        const p = JSON.parse(text) as Record<string, unknown>;
        const fmt = detectFormat(p);
        setFormato(fmt);

        if (fmt === "LEGACY_BYG") {
          const summary = buildLegacySummary(p);
          setLegacySummary(summary);
          setLegacyParsed(p);
          setImportResult1(null);
          setImportResult2(null);
          setImportResult3(null);
          const totalRows = Object.values(summary).reduce((s, n) => s + n, 0);
          setSnapshots((prev) => [
            { filename: file.name, importedAt: new Date().toISOString(), version: "LEGACY_BYG", valid: true, totalRows },
            ...prev,
          ]);
          setLoadingAnalyze(false);
          return;
        }

        if (fmt === "NEW") {
          const REQUIRED_COLLECTIONS = [
            "clientes", "cuentasCorrientes", "movimientosCuentaCorriente",
            "plazosFijos", "cajas", "movimientosCaja",
          ];
          const missing: string[] = [];
          if (!p.version) missing.push("version");
          if (!p.exportedAt && !p.fechaExport) missing.push("exportedAt");
          if (!p.data || typeof p.data !== "object") {
            missing.push("data");
            REQUIRED_COLLECTIONS.forEach((k) => missing.push(k));
          } else {
            const data = p.data as Record<string, unknown>;
            for (const key of REQUIRED_COLLECTIONS) {
              const alias = key === "movimientosCuentaCorriente" ? "movimientosCC" : null;
              if (!Array.isArray(data[key]) && !(alias && Array.isArray(data[alias]))) {
                missing.push(key);
              }
            }
          }
          const isValid = missing.length === 0;
          setValidacion({ valid: isValid, missing });

          let totalRows = 0;
          if (p.data && typeof p.data === "object") {
            const data = p.data as Record<string, unknown>;
            const cnt = (key: string, alias?: string): number => {
              if (Array.isArray(data[key])) return (data[key] as unknown[]).length;
              if (alias && Array.isArray(data[alias])) return (data[alias] as unknown[]).length;
              return 0;
            };
            const rows = [
              { label: "Clientes",           imported: cnt("clientes") },
              { label: "Cuentas Corrientes", imported: cnt("cuentasCorrientes") },
              { label: "Movimientos CC",     imported: cnt("movimientosCuentaCorriente", "movimientosCC") },
              { label: "Plazos Fijos",       imported: cnt("plazosFijos") },
              { label: "Cajas",              imported: cnt("cajas") },
              { label: "Movimientos Caja",   imported: cnt("movimientosCaja") },
            ];
            totalRows = rows.reduce((s, r) => s + r.imported, 0);
            if (isValid) setPreview(rows);
          }

          setSnapshots((prev) => [
            {
              filename: file.name,
              importedAt: new Date().toISOString(),
              version: typeof p.version === "string" ? p.version : "—",
              valid: isValid,
              totalRows,
            },
            ...prev,
          ]);
        } else {
          // INVALIDO
          setValidacion({ valid: false, missing: ["Formato no reconocido"] });
          setSnapshots((prev) => [
            { filename: file.name, importedAt: new Date().toISOString(), version: "—", valid: false, totalRows: 0 },
            ...prev,
          ]);
        }
      } catch {
        setFormato("INVALIDO");
        setValidacion({ valid: false, missing: ["JSON inválido o corrupto"] });
        setSnapshots((prev) => [
          { filename: file.name, importedAt: new Date().toISOString(), version: "—", valid: false, totalRows: 0 },
          ...prev,
        ]);
        setLoadingAnalyze(false);
        return;
      }
    }

    const formData = new FormData(e.currentTarget);
    const res = await analizarViabilidadBackup(formData);
    if (res.error) {
      setError(res.error);
    } else {
      setViabilidad(res);
    }
    setLoadingAnalyze(false);
  };

  const handleImportEtapa2 = async () => {
    if (!legacyParsed) return;
    setLoadingImport2(true);
    setImportResult2(null);
    try {
      const result = await importarEtapa2Legacy({ clientes: legacyParsed.clientes });
      setImportResult2(result);
    } catch (e) {
      setImportResult2({
        success:  false,
        imported: { clientes: 0, cuentas: 0, movsCC: 0, plazosFijos: 0 },
        skipped:  { clientes: 0, cuentas: 0, movsCC: 0, plazosFijos: 0 },
        errors:   [e instanceof Error ? e.message : "Error desconocido"],
        log:      [],
      });
    }
    setLoadingImport2(false);
  };

  const handleImportEtapa3 = async () => {
    if (!legacyParsed) return;
    setLoadingImport3(true);
    setImportResult3(null);
    try {
      const result = await importarEtapa3Legacy({
        ops_cambio:    legacyParsed.ops_cambio,
        ops_rulos:     legacyParsed.ops_rulos,
        ops_divint:    legacyParsed.ops_divint,
        ops_largoplazo: legacyParsed.ops_largoplazo,
      });
      setImportResult3(result);
    } catch (e) {
      setImportResult3({
        success:  false,
        imported: { opsCambio: 0, movsCaja: 0, rulos: 0, divint: 0, largoplazo: 0 },
        skipped:  { opsCambio: 0, movsCaja: 0, rulos: 0, divint: 0, largoplazo: 0 },
        errors:   [e instanceof Error ? e.message : "Error desconocido"],
        log:      [],
      });
    }
    setLoadingImport3(false);
  };

  const handleImportEtapa1 = async () => {
    if (!legacyParsed) return;
    setLoadingImport1(true);
    setImportResult1(null);
    try {
      const result = await importarEtapa1Legacy({
        config: legacyParsed.config,
        cajas:  legacyParsed.cajas,
        pnHist: legacyParsed.pn_hist,
      });
      setImportResult1(result);
    } catch (e) {
      setImportResult1({
        success: false,
        imported: { config: 0, cajas: 0, pnHist: 0 },
        skipped:  { config: 0, cajas: 0, pnHist: 0 },
        errors:   [e instanceof Error ? e.message : "Error desconocido"],
        log:      [],
      });
    }
    setLoadingImport1(false);
  };

  return (
    <div className="flex flex-col gap-10">
      <header className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Administración de Datos</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Carga y Backup</h1>
        <p className="text-[13px] font-medium text-slate-500 mt-1 max-w-2xl">
          Gestione la persistencia de datos en Neon/Postgres y la interoperabilidad con archivos JSON históricos.
        </p>
      </header>

      <div className="bg-blue-600 rounded-3xl p-6 text-white flex items-center gap-6 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Database size={24} />
        </div>
        <p className="text-sm font-bold leading-relaxed">
          En Vercel el JSON no queda guardado como archivo permanente. La persistencia real reside en Neon (PostgreSQL).
          Los backups generados se descargan directamente a su PC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exportar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
              <Download size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Exportar Backup Actual</h2>
              <p className="text-sm text-slate-500">Persistencia local segura desde la nube.</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-4">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Descargue un snapshot completo de su base de datos Neon. Utilice este archivo para restauraciones rápidas o auditoría externa.
            </p>
            <button
              onClick={handleExport}
              disabled={loadingExport}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
            >
              {loadingExport ? "Consultando Neon..." : (
                <>
                  <FileJson size={18} />
                  Descargar backup JSON
                </>
              )}
            </button>
          </div>
        </div>

        {/* Importar / Analizar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
              <Upload size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Importación Histórica</h2>
              <p className="text-sm text-slate-500">Analizar viabilidad de migración por etapas.</p>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seleccionar byg_datos.json</label>
              <input
                name="backup"
                type="file"
                accept=".json"
                required
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all border border-slate-200 p-2 rounded-xl"
              />
            </div>
            <button
              type="submit"
              disabled={loadingAnalyze}
              className="w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loadingAnalyze ? "Analizando JSON..." : (
                <>
                  <Search size={18} />
                  Analizar Viabilidad
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {/* Legacy BYG detected */}
          {formato === "LEGACY_BYG" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
              <p className="text-xs font-black uppercase tracking-widest text-amber-700">
                Backup Legacy BYG detectado
              </p>
            </div>
          )}

          {/* New format validation */}
          {formato === "NEW" && validacion && (
            <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${validacion.valid ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className={validacion.valid ? "text-emerald-600" : "text-red-500"} />
                <p className={`text-xs font-black uppercase tracking-widest ${validacion.valid ? "text-emerald-700" : "text-red-600"}`}>
                  {validacion.valid ? "Backup válido" : "Backup inválido"}
                </p>
              </div>
              {!validacion.valid && validacion.missing.length > 0 && (
                <ul className="text-[11px] text-red-700 flex flex-col gap-0.5 pl-5 list-disc">
                  {validacion.missing.map((m) => (
                    <li key={m} className="font-mono">{m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Invalid */}
          {formato === "INVALIDO" && validacion && (
            <div className="p-4 rounded-2xl border bg-red-50 border-red-200 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                <p className="text-xs font-black uppercase tracking-widest text-red-600">Backup inválido</p>
              </div>
              <ul className="text-[11px] text-red-700 flex flex-col gap-0.5 pl-5 list-disc">
                {validacion.missing.map((m) => (
                  <li key={m} className="font-mono">{m}</li>
                ))}
              </ul>
            </div>
          )}

          {viabilidad && formato === "NEW" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                viabilidad.formatoDetectado === "backup_actual" ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"
              }`}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={viabilidad.formatoDetectado === "backup_actual" ? "text-emerald-600" : "text-blue-600"} size={20} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Formato Detectado</p>
                    <p className="text-sm font-bold text-slate-900">
                      {viabilidad.formatoDetectado === "backup_actual" ? "Backup Sistema v2 (Actual)" : "BYG Histórico v1"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Layers size={12} /> Viabilidad de Importación por Etapas
                </p>
                <div className="flex flex-col gap-2">
                  {viabilidad.etapas.map((e: any, i: number) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-bold text-slate-800">{e.nombre}</p>
                        <p className="text-[10px] text-slate-500 italic">{e.motivo}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        e.estado === "listo" ? "bg-emerald-100 text-emerald-700" :
                        e.estado === "requiere_revision" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-500"
                      }`}>
                        {e.estado.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {viabilidad.advertencias.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col gap-2">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={12} /> Advertencias Críticas
                  </p>
                  <ul className="text-[11px] text-amber-800 flex flex-col gap-1 list-disc pl-4">
                    {viabilidad.advertencias.map((a: string, i: number) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legacy BYG summary */}
      {formato === "LEGACY_BYG" && legacySummary && (
        <div className="bg-white rounded-3xl border border-amber-200 shadow-xl p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <FileJson size={20} className="text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Resumen Backup Legacy BYG</h2>
              <p className="text-xs text-slate-500 font-medium">Análisis de contenido — sin escritura en base de datos</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Clientes",        value: legacySummary.clientes   },
              { label: "Cajas",           value: legacySummary.cajas      },
              { label: "Ops. Cambio",     value: legacySummary.ops_cambio },
              { label: "Rulos",           value: legacySummary.ops_rulos  },
              { label: "Div / Intereses", value: legacySummary.ops_divint },
              { label: "Largo Plazo",     value: legacySummary.ops_lp     },
              { label: "PN Historial",    value: legacySummary.pn_hist    },
              { label: "Cart. Historial", value: legacySummary.cart_hist  },
            ].map((row) => (
              <div key={row.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{row.label}</p>
                <p className="text-2xl font-black text-slate-900 tabular-nums">{row.value.toLocaleString("es-AR")}</p>
                <p className="text-[10px] text-slate-400 font-medium">registros</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Mapeo sugerido</p>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Clave legacy</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Destino en BYG Manager</th>
                  </tr>
                </thead>
                <tbody>
                  {MAPEO_LEGACY.map((row) => (
                    <tr key={row.key} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono text-slate-600">{row.key}</td>
                      <td className="px-4 py-2.5 text-slate-700 font-medium">{row.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              La importación es incremental e idempotente. Ejecutar dos veces no duplica datos.
            </p>
          </div>
        </div>
      )}

      {/* Importación por etapas — Stage 1 */}
      {formato === "LEGACY_BYG" && legacySummary && legacyParsed && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Layers size={20} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Importación por Etapas</h2>
              <p className="text-xs text-slate-500 font-medium">Migración controlada desde backup legacy</p>
            </div>
          </div>

          {/* Etapa 1 */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etapa 1</p>
                <h3 className="text-sm font-black text-slate-800">Config + Cajas + Historial PN</h3>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Disponible
              </span>
            </div>

            {/* Preview counts */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Config",      value: legacyParsed.config != null ? (Array.isArray(legacyParsed.config) ? (legacyParsed.config as unknown[]).length : Object.keys(legacyParsed.config as object).length) : 0, desc: "claves detectadas" },
                { label: "Cajas",       value: legacySummary.cajas,   desc: "registros en backup" },
                { label: "PN Historial", value: legacySummary.pn_hist, desc: "snapshots en backup" },
              ].map((row) => (
                <div key={row.label} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{row.label}</p>
                  <p className="text-2xl font-black text-slate-900 tabular-nums">{row.value.toLocaleString("es-AR")}</p>
                  <p className="text-[10px] text-slate-400">{row.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleImportEtapa1}
              disabled={loadingImport1}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
            >
              {loadingImport1 ? (
                "Importando…"
              ) : (
                <>
                  <Upload size={16} />
                  Importar Etapa 1
                </>
              )}
            </button>

            {importResult1 && (
              <div className={`rounded-xl border p-4 flex flex-col gap-3 ${importResult1.success ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className={importResult1.success ? "text-emerald-600" : "text-amber-600"} />
                  <p className={`text-xs font-black uppercase tracking-widest ${importResult1.success ? "text-emerald-700" : "text-amber-700"}`}>
                    {importResult1.success ? "Importación completada" : "Completada con advertencias"}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(["config", "cajas", "pnHist"] as const).map((key) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <p className="text-[9px] font-black uppercase text-slate-400">{key === "pnHist" ? "PN Hist" : key}</p>
                      <p className="text-xs font-bold text-emerald-700 tabular-nums">{importResult1.imported[key]} importados</p>
                      <p className="text-[10px] text-slate-400 tabular-nums">{importResult1.skipped[key]} omitidos</p>
                    </div>
                  ))}
                </div>
                {importResult1.log.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-slate-200 pt-3">
                    <p className="text-[9px] font-black uppercase text-slate-500">Detalle de importación ({importResult1.log.length} eventos)</p>
                    <ul className="text-[11px] text-slate-600 flex flex-col gap-0.5 max-h-52 overflow-y-auto pr-1">
                      {importResult1.log.map((entry, i) => (
                        <li key={i} className={`font-mono py-0.5 border-b border-slate-100 last:border-0 ${entry.startsWith("✓") ? "text-emerald-700" : entry.startsWith("  ✓") ? "text-emerald-600 pl-3" : entry.startsWith("  —") ? "text-slate-400 pl-3" : "text-slate-400"}`}>
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {importResult1.errors.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-red-100 pt-2">
                    <p className="text-[9px] font-black uppercase text-red-600">Errores ({importResult1.errors.length})</p>
                    <ul className="text-[11px] text-red-700 list-disc pl-4 flex flex-col gap-0.5">
                      {importResult1.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Etapa 2 */}
          {(() => {
            const preview2 = legacyParsed ? buildPreview2(legacyParsed) : null;
            return (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etapa 2</p>
                    <h3 className="text-sm font-black text-slate-800">Clientes + CC + Plazos Fijos</h3>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Disponible
                  </span>
                </div>

                {preview2 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([
                      { label: "Clientes",      value: preview2.clientes,    desc: "en backup",    dim: false },
                      { label: "Saldo USD",      value: preview2.conSaldoUSD, desc: "clientes",     dim: false },
                      { label: "Saldo ARS",      value: preview2.conSaldoARS, desc: "clientes",     dim: false },
                      { label: "Movs CC USD",    value: preview2.movsUSD,     desc: "movimientos",  dim: false },
                      { label: "Movs CC ARS",    value: preview2.movsARS,     desc: "movimientos",  dim: false },
                      { label: "Plazos Fijos",   value: preview2.pfs,         desc: "registros",    dim: false },
                      { label: "Movs PF",        value: preview2.pfMovs,      desc: "no disponible", dim: true },
                    ] as { label: string; value: number; desc: string; dim: boolean }[]).map((row) => (
                      <div key={row.label} className={`bg-white border rounded-xl p-3 flex flex-col gap-1 ${row.dim ? "border-slate-100 opacity-40" : "border-slate-200"}`}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{row.label}</p>
                        <p className="text-2xl font-black tabular-nums text-slate-900">{row.value.toLocaleString("es-AR")}</p>
                        <p className="text-[10px] text-slate-400">{row.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleImportEtapa2}
                  disabled={loadingImport2}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                >
                  {loadingImport2 ? "Importando…" : (<><Upload size={16} />Importar Etapa 2</>)}
                </button>

                {importResult2 && (
                  <div className={`rounded-xl border p-4 flex flex-col gap-3 ${importResult2.success ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className={importResult2.success ? "text-emerald-600" : "text-amber-600"} />
                      <p className={`text-xs font-black uppercase tracking-widest ${importResult2.success ? "text-emerald-700" : "text-amber-700"}`}>
                        {importResult2.success ? "Importación completada" : "Completada con advertencias"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(["clientes", "cuentas", "movsCC", "plazosFijos"] as const).map((key) => (
                        <div key={key} className="flex flex-col gap-0.5">
                          <p className="text-[9px] font-black uppercase text-slate-400">
                            {key === "movsCC" ? "Movs CC" : key === "plazosFijos" ? "PF" : key}
                          </p>
                          <p className="text-xs font-bold text-emerald-700 tabular-nums">{importResult2.imported[key]} importados</p>
                          <p className="text-[10px] text-slate-400 tabular-nums">{importResult2.skipped[key]} omitidos</p>
                        </div>
                      ))}
                    </div>
                    {importResult2.log.length > 0 && (
                      <div className="flex flex-col gap-1 border-t border-slate-200 pt-3">
                        <p className="text-[9px] font-black uppercase text-slate-500">Detalle ({importResult2.log.length} eventos)</p>
                        <ul className="text-[11px] text-slate-600 flex flex-col gap-0.5 max-h-52 overflow-y-auto pr-1">
                          {importResult2.log.map((entry, i) => (
                            <li key={i} className={`font-mono py-0.5 border-b border-slate-100 last:border-0 ${
                              entry.startsWith("✓") ? "text-emerald-700" :
                              entry.startsWith("  ✓") ? "text-emerald-600 pl-3" :
                              entry.startsWith("  —") ? "text-slate-400 pl-3" : "text-slate-400"
                            }`}>{entry}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {importResult2.errors.length > 0 && (
                      <div className="flex flex-col gap-1 border-t border-red-100 pt-2">
                        <p className="text-[9px] font-black uppercase text-red-600">Errores ({importResult2.errors.length})</p>
                        <ul className="text-[11px] text-red-700 list-disc pl-4 flex flex-col gap-0.5">
                          {importResult2.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Etapa 3 */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etapa 3</p>
                <h3 className="text-sm font-black text-slate-800">Operaciones + Rulos + Dividendos + Largo Plazo</h3>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Disponible
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Ops Cambio",    value: legacySummary.ops_cambio, desc: "en backup" },
                { label: "Rulos",         value: legacySummary.ops_rulos,  desc: "en backup" },
                { label: "Div/Intereses", value: legacySummary.ops_divint, desc: "en backup" },
                { label: "Largo Plazo",   value: legacySummary.ops_lp,     desc: "en backup" },
              ].map((row) => (
                <div key={row.label} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{row.label}</p>
                  <p className="text-2xl font-black tabular-nums text-slate-900">{row.value.toLocaleString("es-AR")}</p>
                  <p className="text-[10px] text-slate-400">{row.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleImportEtapa3}
              disabled={loadingImport3}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
            >
              {loadingImport3 ? "Importando…" : (<><Upload size={16} />Importar Etapa 3</>)}
            </button>

            {importResult3 && (
              <div className={`rounded-xl border p-4 flex flex-col gap-3 ${importResult3.success ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className={importResult3.success ? "text-emerald-600" : "text-amber-600"} />
                  <p className={`text-xs font-black uppercase tracking-widest ${importResult3.success ? "text-emerald-700" : "text-amber-700"}`}>
                    {importResult3.success ? "Importación completada" : "Completada con advertencias"}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(["opsCambio", "movsCaja", "rulos", "divint", "largoplazo"] as const).map((key) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <p className="text-[9px] font-black uppercase text-slate-400">
                        { key === "opsCambio" ? "Op Cambio" : key === "movsCaja" ? "Mov Caja" : key === "divint" ? "Div/Int" : key === "largoplazo" ? "LP" : key }
                      </p>
                      <p className="text-xs font-bold text-emerald-700 tabular-nums">{importResult3.imported[key]} imp.</p>
                      <p className="text-[10px] text-slate-400 tabular-nums">{importResult3.skipped[key]} omit.</p>
                    </div>
                  ))}
                </div>
                {importResult3.log.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-slate-200 pt-3">
                    <p className="text-[9px] font-black uppercase text-slate-500">Detalle ({importResult3.log.length} eventos)</p>
                    <ul className="text-[11px] text-slate-600 flex flex-col gap-0.5 max-h-52 overflow-y-auto pr-1">
                      {importResult3.log.map((entry, i) => (
                        <li key={i} className={`font-mono py-0.5 border-b border-slate-100 last:border-0 ${
                          entry.startsWith("  ✓") ? "text-emerald-600 pl-3" :
                          entry.startsWith("──") ? "text-slate-500 font-bold" : "text-slate-400"
                        }`}>{entry}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {importResult3.errors.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-red-100 pt-2">
                    <p className="text-[9px] font-black uppercase text-red-600">Errores ({importResult3.errors.length})</p>
                    <ul className="text-[11px] text-red-700 list-disc pl-4 flex flex-col gap-0.5">
                      {importResult3.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Etapa 4 */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center justify-between opacity-50">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etapa 4</p>
              <p className="text-sm font-bold text-slate-500">Historial de carteras</p>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
              Próximamente
            </span>
          </div>
        </div>
      )}

      {/* Restore Preview (new format only) */}
      {preview && validacion?.valid && formato === "NEW" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Info size={20} className="text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Restore Preview</h2>
              <p className="text-xs text-slate-500 font-medium">Simulación sin escritura en base de datos</p>
            </div>
            <span className="ml-auto text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-700">
              Dry Run
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {preview.map((row) => (
              <div key={row.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{row.label}</p>
                <p className="text-2xl font-black text-slate-900 tabular-nums">{row.imported.toLocaleString("es-AR")}</p>
                <p className="text-[10px] text-slate-400 font-medium">filas a importar</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Colecciones afectadas</p>
            <div className="flex flex-wrap gap-2">
              {preview.filter((r) => r.imported > 0).map((r) => (
                <span key={r.label} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {r.label} ({r.imported.toLocaleString("es-AR")})
                </span>
              ))}
              {preview.every((r) => r.imported === 0) && (
                <span className="text-[11px] text-slate-400 italic">Sin filas detectadas</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total aproximado: <span className="font-black text-slate-700">
                {preview.reduce((s, r) => s + r.imported, 0).toLocaleString("es-AR")} filas
              </span>
            </p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-700 font-medium">
              Esta es una vista previa de solo lectura. No se han escrito datos en la base de datos.
            </p>
          </div>
        </div>
      )}

      {/* Historial de snapshots */}
      {snapshots.length > 0 && (() => {
        const totalAnalizados = snapshots.length;
        const invalidos       = snapshots.filter((s) => !s.valid).length;
        const ultimoValido    = snapshots.find((s) => s.valid);
        return (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col gap-6">
            <h2 className="text-lg font-black text-slate-900">Historial de snapshots</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Último válido</p>
                <p className="text-sm font-black text-slate-800 truncate">{ultimoValido ? ultimoValido.filename : "—"}</p>
                {ultimoValido && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    {new Date(ultimoValido.importedAt).toLocaleString("es-AR")}
                  </p>
                )}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total analizados</p>
                <p className="text-3xl font-black text-slate-900 tabular-nums">{totalAnalizados}</p>
              </div>
              <div className={`rounded-2xl p-4 flex flex-col gap-1 border ${invalidos > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${invalidos > 0 ? "text-red-500" : "text-emerald-600"}`}>Inválidos</p>
                <p className={`text-3xl font-black tabular-nums ${invalidos > 0 ? "text-red-600" : "text-emerald-700"}`}>{invalidos}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Archivo", "Fecha", "Versión", "Estado", "Filas"].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i >= 3 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-slate-700 max-w-[180px] truncate">{s.filename}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(s.importedAt).toLocaleString("es-AR")}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{s.version}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          s.version === "LEGACY_BYG"
                            ? "bg-amber-100 text-amber-700"
                            : s.valid
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600"
                        }`}>
                          {s.version === "LEGACY_BYG" ? "Legacy" : s.valid ? "Válido" : "Inválido"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">
                        {s.totalRows.toLocaleString("es-AR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Referencia de estructura */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <FileJson size={200} />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Referencia Técnica</h3>
          <h2 className="text-2xl font-black">Estructura de Datos Soportada</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "config", "pn_hist", "cajas", "ops_cambio",
            "ops_rulos", "ops_divint", "ops_lp", "clientes",
            "plazos_fijos", "movimientos", "propiedades", "recordatorios"
          ].map(tag => (
            <div key={tag} className="bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-xs font-mono text-slate-400">
              {tag}
            </div>
          ))}
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0" size={20} />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            <span className="font-bold text-amber-400 uppercase tracking-widest block mb-1">Atención</span>
            La restauración completa se hará de forma controlada por módulos para evitar inconsistencias en saldos históricos y relaciones de base de datos.
          </p>
        </div>
      </div>
    </div>
  );
}
