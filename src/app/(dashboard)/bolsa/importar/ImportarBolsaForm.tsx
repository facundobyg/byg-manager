"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  importarBolsaExcelAction,
  importarBolsaImagenAction,
  type ProcessBolsaResult,
} from "./actions";
import { resizeAndCompress } from "@/lib/browser/compress-image";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Modo = "excel" | "imagen";

type ImgFase =
  | { fase: "pendiente" }
  | { fase: "comprimiendo" }
  | { fase: "subiendo" }
  | { fase: "ok"; result: ProcessBolsaResult }
  | { fase: "duplicado"; loteId?: string; creadoEl?: string }
  | { fase: "error"; msg: string };

type ImagenEntry = { file: File; estado: ImgFase };

// ── Componente principal ──────────────────────────────────────────────────────

export function ImportarBolsaForm() {
  const [modo, setModo] = useState<Modo>("excel");

  // ── Excel (usa useActionState) ────────────────────────────────────────────
  const [excelState, excelDispatch, isExcelPending] = useActionState<
    ProcessBolsaResult | null,
    FormData
  >(importarBolsaExcelAction, null);

  // ── Imagen (manejo manual secuencial) ────────────────────────────────────
  const [imagenes, setImagenes] = useState<ImagenEntry[]>([]);
  const [loteActual, setLoteActual] = useState<string | undefined>();
  const [imgPending, startImgTransition] = useTransition();
  const imagenInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  function actualizarEntrada(idx: number, estado: ImgFase) {
    setImagenes((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, estado } : e)),
    );
  }

  async function procesarImagenes(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const files = Array.from(imagenInputRef.current?.files ?? []);
    if (files.length === 0) return;

    const inicial: ImagenEntry[] = files.map((f) => ({
      file: f,
      estado: { fase: "pendiente" },
    }));
    setImagenes(inicial);
    setLoteActual(undefined);

    let loteId: string | undefined;

    startImgTransition(async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Comprimir en el cliente
        actualizarEntrada(i, { fase: "comprimiendo" });
        let compressed: File;
        try {
          compressed = await resizeAndCompress(file);
        } catch (err) {
          actualizarEntrada(i, {
            fase: "error",
            msg:
              err instanceof Error
                ? err.message
                : "Error al comprimir la imagen.",
          });
          continue;
        }

        // Subir al servidor
        actualizarEntrada(i, { fase: "subiendo" });
        const fd = new FormData();
        fd.append("file", compressed);
        if (loteId) fd.append("loteId", loteId);

        let result: ProcessBolsaResult;
        try {
          result = await importarBolsaImagenAction(fd);
        } catch {
          actualizarEntrada(i, {
            fase: "error",
            msg: "Error de red al subir la imagen. Intentá de nuevo.",
          });
          continue;
        }

        if (result.loteId && !loteId) {
          loteId = result.loteId;
          setLoteActual(loteId);
        }

        if (result.estado === "DUPLICADO") {
          actualizarEntrada(i, {
            fase: "duplicado",
            loteId: result.archivoExistente?.loteId,
            creadoEl: result.archivoExistente?.creadoEl,
          });
        } else if (!result.ok || result.estado === "FALLIDO") {
          actualizarEntrada(i, {
            fase: "error",
            msg: result.error ?? "Error al procesar la imagen.",
          });
        } else {
          actualizarEntrada(i, { fase: "ok", result });
        }
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Selector de modo */}
      <div className="flex gap-1 p-1 rounded-xl bg-byg-border/30 self-start">
        {(["excel", "imagen"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModo(m)}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
              modo === m
                ? "bg-byg-accent text-white shadow-sm"
                : "text-byg-muted hover:text-byg-text"
            }`}
          >
            {m === "excel" ? "Excel (.xlsx)" : "Imagen (.jpg / .png)"}
          </button>
        ))}
      </div>

      {/* ── Formulario Excel ─────────────────────────────────────────────── */}
      {modo === "excel" && (
        <form action={excelDispatch} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="bolsa-xlsx"
              className="text-[10px] font-black uppercase tracking-[0.25em] text-byg-muted"
            >
              Archivo Excel (.xlsx)
            </label>
            <input
              ref={excelInputRef}
              id="bolsa-xlsx"
              type="file"
              name="file"
              accept=".xlsx"
              required
              disabled={isExcelPending}
              className="block w-full text-sm text-byg-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-black file:bg-byg-accent file:text-white hover:file:opacity-90 file:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <p className="text-[11px] text-byg-muted">
              Solo archivos .xlsx · máximo 5 MB · solo crea staging, no opera realmente
            </p>
          </div>
          <button
            type="submit"
            disabled={isExcelPending}
            className="self-start px-5 py-2.5 rounded-lg bg-byg-accent text-white text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isExcelPending ? "Procesando..." : "Importar Excel"}
          </button>
          {excelState && <ResultadoExcel result={excelState} />}
        </form>
      )}

      {/* ── Formulario Imágenes ──────────────────────────────────────────── */}
      {modo === "imagen" && (
        <form onSubmit={procesarImagenes} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="bolsa-imgs"
              className="text-[10px] font-black uppercase tracking-[0.25em] text-byg-muted"
            >
              Imágenes del detalle de operaciones
            </label>
            <input
              ref={imagenInputRef}
              id="bolsa-imgs"
              type="file"
              name="file"
              accept=".jpg,.jpeg,.png"
              multiple
              required
              disabled={imgPending}
              className="block w-full text-sm text-byg-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-black file:bg-byg-accent file:text-white hover:file:opacity-90 file:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <p className="text-[11px] text-byg-muted">
              .jpg / .jpeg / .png · podés seleccionar varias imágenes del mismo día ·
              solo crea staging, no opera realmente
            </p>
            <p className="text-[10px] text-byg-muted/70 flex items-center gap-1.5">
              <span className="text-byg-accent">⚠</span>
              Las imágenes se analizan con un servicio externo de inteligencia artificial
              para extraer las operaciones.
            </p>
          </div>
          <button
            type="submit"
            disabled={imgPending}
            className="self-start px-5 py-2.5 rounded-lg bg-byg-accent text-white text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {imgPending ? "Procesando con IA..." : "Importar imágenes"}
          </button>

          {imagenes.length > 0 && (
            <div className="flex flex-col gap-2">
              {imagenes.map((entry, i) => (
                <ImagenEntryCard key={i} entry={entry} />
              ))}
              {loteActual && (
                <p className="text-[11px] text-byg-muted font-mono mt-1">
                  Lote: {loteActual}
                </p>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

// ── Resultado Excel ────────────────────────────────────────────────────────────

function ResultadoExcel({ result }: { result: ProcessBolsaResult }) {
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
        className={`rounded-xl border p-4 ${previoFalló ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40" : "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40"}`}
      >
        <p
          className={`text-[11px] font-black uppercase tracking-wider mb-1 ${previoFalló ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}
        >
          {previoFalló ? "Importación previa fallida" : "Archivo duplicado"}
        </p>
        <p
          className={`text-sm ${previoFalló ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}
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
              Este archivo ya fue importado.
              {result.archivoExistente && (
                <> Importado el {new Date(result.archivoExistente.creadoEl).toLocaleString("es-AR")}.</>
              )}
            </>
          )}
        </p>
        {result.loteId && (
          <p
            className={`text-[11px] mt-2 font-mono ${previoFalló ? "text-red-600 dark:text-red-500" : "text-amber-600 dark:text-amber-500"}`}
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
    const hayProblemas =
      result.filasConError > 0 || result.filasConAdvertencia > 0;
    return (
      <div
        className={`rounded-xl border p-4 ${hayProblemas ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40" : "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40"}`}
      >
        <p
          className={`text-[11px] font-black uppercase tracking-wider mb-2 ${hayProblemas ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}
        >
          Importado — revisión pendiente
        </p>
        <StatRow result={result} />
        {result.loteId && (
          <p className="text-[11px] text-byg-muted mt-3 font-mono">
            Lote: {result.loteId}
          </p>
        )}
      </div>
    );
  }

  return null;
}

// ── Card de estado por imagen ─────────────────────────────────────────────────

function ImagenEntryCard({ entry }: { entry: ImagenEntry }) {
  const { file, estado } = entry;

  const baseClass =
    "rounded-xl border p-3 flex flex-col gap-1.5 transition-colors";

  if (estado.fase === "pendiente") {
    return (
      <div className={`${baseClass} border-byg-border bg-byg-surface`}>
        <p className="text-[11px] font-black text-byg-muted">{file.name}</p>
        <p className="text-[10px] text-byg-muted/60">En cola…</p>
      </div>
    );
  }

  if (estado.fase === "comprimiendo") {
    return (
      <div className={`${baseClass} border-byg-border bg-byg-surface`}>
        <p className="text-[11px] font-black text-byg-muted">{file.name}</p>
        <p className="text-[10px] text-byg-accent animate-pulse">
          Comprimiendo…
        </p>
      </div>
    );
  }

  if (estado.fase === "subiendo") {
    return (
      <div className={`${baseClass} border-byg-border bg-byg-surface`}>
        <p className="text-[11px] font-black text-byg-muted">{file.name}</p>
        <p className="text-[10px] text-byg-accent animate-pulse">
          Analizando con IA…
        </p>
      </div>
    );
  }

  if (estado.fase === "error") {
    return (
      <div
        className={`${baseClass} border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40`}
      >
        <p className="text-[11px] font-black text-red-600 dark:text-red-400">
          {file.name}
        </p>
        <p className="text-[11px] text-red-700 dark:text-red-300">
          {estado.msg}
        </p>
      </div>
    );
  }

  if (estado.fase === "duplicado") {
    return (
      <div
        className={`${baseClass} border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40`}
      >
        <p className="text-[11px] font-black text-amber-600 dark:text-amber-400">
          {file.name}
        </p>
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          Ya importada
          {estado.creadoEl && (
            <> el {new Date(estado.creadoEl).toLocaleString("es-AR")}</>
          )}
          .
        </p>
      </div>
    );
  }

  // fase: "ok"
  const { result } = estado;
  const hayProblemas =
    result.filasConError > 0 || result.filasConAdvertencia > 0;
  return (
    <div
      className={`${baseClass} ${hayProblemas ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40" : "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40"}`}
    >
      <p
        className={`text-[11px] font-black ${hayProblemas ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}
      >
        {file.name}
      </p>
      <StatRow result={result} compact />
    </div>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────────────

function StatRow({
  result,
  compact,
}: {
  result: ProcessBolsaResult;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-4 ${compact ? "text-xs" : "text-sm"}`}>
      <Stat label="Filas" value={result.totalFilas} />
      <Stat
        label="Resueltas"
        value={result.filasResuelta}
        color="text-emerald-600 dark:text-emerald-400"
      />
      {result.filasConAdvertencia > 0 && (
        <Stat
          label="Advertencias"
          value={result.filasConAdvertencia}
          color="text-amber-600 dark:text-amber-400"
        />
      )}
      {result.filasConError > 0 && (
        <Stat
          label="Errores"
          value={result.filasConError}
          color="text-red-600 dark:text-red-400"
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-byg-muted font-bold">
        {label}
      </span>
      <span
        className={`text-xl font-black tabular-nums ${color ?? "text-byg-text"}`}
      >
        {value}
      </span>
    </div>
  );
}
