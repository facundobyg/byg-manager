"use client";

import { useActionState, useRef } from "react";
import { importarBolsaExcelAction, type ProcessBolsaResult } from "./actions";

export function ImportarBolsaForm() {
  const [state, dispatch, isPending] = useActionState<ProcessBolsaResult | null, FormData>(
    importarBolsaExcelAction,
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <form action={dispatch} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="bolsa-xlsx"
            className="text-[10px] font-black uppercase tracking-[0.25em] text-byg-muted"
          >
            Archivo Excel (.xlsx)
          </label>
          <input
            ref={inputRef}
            id="bolsa-xlsx"
            type="file"
            name="file"
            accept=".xlsx"
            required
            disabled={isPending}
            className="block w-full text-sm text-byg-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-black file:bg-byg-accent file:text-white hover:file:opacity-90 file:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <p className="text-[11px] text-byg-muted">Solo archivos .xlsx · máximo 5 MB</p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="self-start px-5 py-2.5 rounded-lg bg-byg-accent text-white text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Procesando..." : "Importar"}
        </button>
      </form>

      {state && <ResultadoImport result={state} />}
    </div>
  );
}

function ResultadoImport({ result }: { result: ProcessBolsaResult }) {
  if (!result.ok && !result.estado) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40 p-4">
        <p className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
          Error
        </p>
        <p className="text-sm text-red-700 dark:text-red-300">{result.error}</p>
      </div>
    );
  }

  if (result.estado === "DUPLICADO") {
    const previoFalló = result.archivoExistente?.estadoArchivo === "ERROR";
    return (
      <div
        className={`rounded-xl border p-4 ${
          previoFalló
            ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40"
            : "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40"
        }`}
      >
        <p
          className={`text-[11px] font-black uppercase tracking-wider mb-1 ${
            previoFalló
              ? "text-red-600 dark:text-red-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {previoFalló ? "Importación previa fallida" : "Archivo duplicado"}
        </p>
        <p
          className={`text-sm ${
            previoFalló ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"
          }`}
        >
          {previoFalló ? (
            <>
              Este archivo ya fue subido
              {result.archivoExistente && (
                <> el {new Date(result.archivoExistente.creadoEl).toLocaleString("es-AR")}</>
              )}{" "}
              pero su procesamiento falló. Podrá reintentarse en un módulo posterior.
            </>
          ) : (
            <>
              Este archivo ya fue importado anteriormente.
              {result.archivoExistente && (
                <> Importado el {new Date(result.archivoExistente.creadoEl).toLocaleString("es-AR")}.</>
              )}
            </>
          )}
        </p>
        {result.loteId && (
          <p
            className={`text-[11px] mt-2 font-mono ${
              previoFalló ? "text-red-600 dark:text-red-500" : "text-amber-600 dark:text-amber-500"
            }`}
          >
            Lote: {result.loteId}
          </p>
        )}
      </div>
    );
  }

  if (result.estado === "FALLIDO") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40 p-4">
        <p className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
          Error al procesar el archivo
        </p>
        <p className="text-sm text-red-700 dark:text-red-300">{result.error}</p>
        <p className="text-[11px] text-red-600 dark:text-red-500 mt-2">
          Verificá que el archivo sea un Excel de operaciones bolsa válido.
        </p>
      </div>
    );
  }

  if (result.estado === "REVISION_PENDIENTE") {
    const hayProblemas = result.filasConError > 0 || result.filasConAdvertencia > 0;
    return (
      <div
        className={`rounded-xl border p-4 ${
          hayProblemas
            ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40"
            : "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40"
        }`}
      >
        <p
          className={`text-[11px] font-black uppercase tracking-wider mb-2 ${
            hayProblemas
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          Importado — revisión pendiente
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Stat label="Total filas" value={result.totalFilas} />
          <Stat label="Resueltas" value={result.filasResuelta} color="text-emerald-600 dark:text-emerald-400" />
          {result.filasConAdvertencia > 0 && (
            <Stat label="Con advertencias" value={result.filasConAdvertencia} color="text-amber-600 dark:text-amber-400" />
          )}
          {result.filasConError > 0 && (
            <Stat label="Con errores" value={result.filasConError} color="text-red-600 dark:text-red-400" />
          )}
        </div>
        {result.loteId && (
          <p className="text-[11px] text-byg-muted mt-3 font-mono">Lote: {result.loteId}</p>
        )}
      </div>
    );
  }

  return null;
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-byg-muted font-bold">{label}</span>
      <span className={`text-xl font-black tabular-nums ${color ?? "text-byg-text"}`}>{value}</span>
    </div>
  );
}
