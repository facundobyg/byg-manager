// Lógica real de carga del Excel de bolsa — deliberadamente NO es "use server".
// Esto la hace inalcanzable como Server Action sin importar qué se exporte
// de acá: solo un archivo con la directiva "use server" puede convertir sus
// exports en endpoints invocables desde el cliente. El único punto de entrada
// gateado para la UI es importarBolsaExcelAction en actions.ts.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { parseBolsaExcel } from "@/lib/importers/bolsa-excel/parser";
import type { BolsaExcelBloque, BolsaExcelRawOp } from "@/lib/importers/bolsa-excel/types";
import type { TipoOpBolsa } from "@prisma/client";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export interface ProcessBolsaResult {
  ok: boolean;
  error?: string;
  estado?: "DUPLICADO" | "FALLIDO" | "REVISION_PENDIENTE";
  loteId?: string;
  archivoId?: string;
  nombreArchivo: string;
  totalFilas: number;
  filasResuelta: number;
  filasConAdvertencia: number;
  filasConError: number;
  archivoExistente?: {
    loteId: string;
    creadoEl: string;
    estadoArchivo?: string;
  };
  advertencias?: string[];
}

export interface ComitenteResolucion {
  estado: "RESUELTA" | "ADVERTENCIA" | "ERROR";
  comitenteResueltoId: string | null;
  carteraResueltaId: string | null;
  tipoSujeto: "COMITENTE" | "CARTERA" | null;
  conflictoNombre: boolean;
  errorMsg: string | null;
}

function normalizeNombre(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export async function resolveComitente(
  nroComitenteDetectado: string | null,
  nombreDetectado: string | null,
): Promise<ComitenteResolucion> {
  const errorBase: ComitenteResolucion = {
    estado: "ERROR",
    comitenteResueltoId: null,
    carteraResueltaId: null,
    tipoSujeto: null,
    conflictoNombre: false,
    errorMsg: null,
  };

  if (!nroComitenteDetectado) {
    return { ...errorBase, errorMsg: "Sin número de comitente detectado." };
  }

  const matches = await prisma.comitenteInversion.findMany({
    where: { nroComitente: nroComitenteDetectado, activo: true },
    select: { id: true, nombre: true, esPropioBYG: true, carteraId: true },
  });

  let resolved: (typeof matches)[0] | null = null;

  if (matches.length === 0) {
    return { ...errorBase, errorMsg: `Comitente no encontrado: nro ${nroComitenteDetectado}` };
  } else if (matches.length === 1) {
    resolved = matches[0];
  } else {
    // Desambiguar por nombre
    const normNombre = normalizeNombre(nombreDetectado);
    const byName = matches.filter((m) => normalizeNombre(m.nombre) === normNombre);
    if (byName.length === 1) {
      resolved = byName[0];
    } else {
      return {
        ...errorBase,
        errorMsg: `Comitente ambiguo: ${matches.length} registros activos con nroComitente=${nroComitenteDetectado}`,
      };
    }
  }

  const conflictoNombre = normalizeNombre(resolved.nombre) !== normalizeNombre(nombreDetectado);

  // Resolver como CARTERA si esPropioBYG=true O si tiene carteraId asignado
  if (resolved.esPropioBYG || resolved.carteraId !== null) {
    if (!resolved.carteraId) {
      // esPropioBYG=true pero carteraId no asignado: error de configuración
      return {
        ...errorBase,
        errorMsg: `Comitente ${nroComitenteDetectado} marcado como propio BYG pero sin carteraId asignado.`,
      };
    }
    return {
      estado: conflictoNombre ? "ADVERTENCIA" : "RESUELTA",
      comitenteResueltoId: null,
      carteraResueltaId: resolved.carteraId,
      tipoSujeto: "CARTERA",
      conflictoNombre,
      errorMsg: null,
    };
  }

  return {
    estado: conflictoNombre ? "ADVERTENCIA" : "RESUELTA",
    comitenteResueltoId: resolved.id,
    carteraResueltaId: null,
    tipoSujeto: "COMITENTE",
    conflictoNombre,
    errorMsg: null,
  };
}

function mapOpBase(op: BolsaExcelRawOp): TipoOpBolsa | null {
  if (op.operacionBase === "CAUCION_COLOCADORA") return "CAUCION_COLOCADORA";
  if (op.operacionBase === "CAUCION_TOMADORA") return "CAUCION_TOMADORA";
  return null;
}

function computeFingerprint(op: BolsaExcelRawOp, bloque: BolsaExcelBloque): string {
  const parts = [
    bloque.nroComitenteDetectado ?? "",
    op.fechaConcertacion ?? "",
    op.rawOperacion,
    op.ticker ?? "",
    op.cantidad ?? "",
    op.precio ?? "",
  ];
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

export async function processBolsaExcelUpload(
  formData: FormData,
  userId: string,
): Promise<ProcessBolsaResult> {
  const file = formData.get("file");
  const nombreArchivo = file instanceof File ? file.name : "";

  const baseResult = {
    nombreArchivo,
    totalFilas: 0,
    filasResuelta: 0,
    filasConAdvertencia: 0,
    filasConError: 0,
  };

  // ── Validación del archivo ────────────────────────────────────────────────────
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No se adjuntó ningún archivo.", ...baseResult };
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { ok: false, error: `"${file.name}" no es un .xlsx — solo se aceptan archivos Excel .xlsx.`, ...baseResult };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: `El archivo supera los 5 MB permitidos.`, ...baseResult };
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // ── Deduplicación SHA-256 ─────────────────────────────────────────────────────
  const hash = sha256(buf);
  const existing = await prisma.bolsaImportArchivo.findUnique({ where: { fileHashSha256: hash } });
  if (existing) {
    // Siempre devolvemos DUPLICADO (sin crear un segundo lote), pero incluimos
    // estadoArchivo para que la UI pueda diferenciar LISTO de ERROR/FALLIDO.
    return {
      ok: true,
      estado: "DUPLICADO",
      loteId: existing.loteId,
      archivoId: existing.id,
      ...baseResult,
      archivoExistente: {
        loteId: existing.loteId,
        creadoEl: existing.createdAt.toISOString(),
        estadoArchivo: existing.estado as string,
      },
    };
  }

  // ── Parseo del Excel ──────────────────────────────────────────────────────────
  let parseResult: ReturnType<typeof parseBolsaExcel>;
  try {
    parseResult = parseBolsaExcel(buf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido en el parser.";

    // Parser crash → intentar registrar FALLIDO lote + ERROR archivo
    let fallbackLoteId: string | undefined;
    let fallbackArchivoId: string | undefined;
    try {
      const fallback = await prisma.$transaction(async (tx) => {
        const lote = await tx.bolsaImportLote.create({
          data: {
            id: crypto.randomUUID(),
            estado: "FALLIDO",
            origen: "EXCEL",
            creadoPorId: userId,
            updatedAt: new Date(),
          },
        });
        const archivo = await tx.bolsaImportArchivo.create({
          data: {
            id: crypto.randomUUID(),
            loteId: lote.id,
            nombreOriginal: file.name,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            tamano: file.size,
            fileHashSha256: hash,
            estado: "ERROR",
            origen: "EXCEL",
            errorMessage: msg,
            updatedAt: new Date(),
          },
        });
        return { lote, archivo };
      });
      fallbackLoteId = fallback.lote.id;
      fallbackArchivoId = fallback.archivo.id;
    } catch {
      // best-effort; no enmascarar el error del parser
    }

    return {
      ok: false,
      error: `Error al leer el archivo: ${msg}`,
      estado: "FALLIDO",
      loteId: fallbackLoteId,
      archivoId: fallbackArchivoId,
      ...baseResult,
    };
  }

  // ── Resolución de comitentes y preparación de filas ───────────────────────────
  const filaData: Array<{
    op: BolsaExcelRawOp;
    bloque: BolsaExcelBloque;
    resolucion: ComitenteResolucion;
    estado: "RESUELTA" | "ADVERTENCIA" | "ERROR";
    allErrors: string[];
    allWarnings: string[];
  }> = [];

  for (const bloque of parseResult.bloques) {
    const resolucion = await resolveComitente(bloque.nroComitenteDetectado, bloque.nombreDetectado);
    for (const op of bloque.operaciones) {
      const allErrors = [...op.errors];
      const allWarnings = [...op.warnings];
      if (resolucion.errorMsg) allErrors.push(resolucion.errorMsg);

      let estado: "RESUELTA" | "ADVERTENCIA" | "ERROR";
      if (allErrors.length > 0 || resolucion.estado === "ERROR") {
        estado = "ERROR";
      } else if (allWarnings.length > 0 || resolucion.estado === "ADVERTENCIA") {
        estado = "ADVERTENCIA";
      } else {
        estado = "RESUELTA";
      }

      filaData.push({ op, bloque, resolucion, estado, allErrors, allWarnings });
    }
  }

  const totalFilas = filaData.length;
  const filasConError = filaData.filter((f) => f.estado === "ERROR").length;
  const filasConAdvertencia = filaData.filter((f) => f.estado === "ADVERTENCIA").length;
  const filasResuelta = totalFilas - filasConError - filasConAdvertencia;

  // ── Transacción: lote + archivo + filas ───────────────────────────────────────
  let loteId: string;
  let archivoId: string;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const lote = await tx.bolsaImportLote.create({
        data: {
          id: crypto.randomUUID(),
          estado: "REVISION_PENDIENTE",
          origen: "EXCEL",
          creadoPorId: userId,
          totalFilas,
          filasConAdvertencia,
          filasConError,
          updatedAt: new Date(),
        },
      });

      const archivo = await tx.bolsaImportArchivo.create({
        data: {
          id: crypto.randomUUID(),
          loteId: lote.id,
          nombreOriginal: file.name,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          tamano: file.size,
          fileHashSha256: hash,
          estado: "LISTO",
          origen: "EXCEL",
          hojaDetectada: parseResult.hojaProceada,
          rawJson: parseResult as object,
          warningsJson: parseResult.warningsGlobales.length > 0 ? parseResult.warningsGlobales : undefined,
          errorMessage: parseResult.erroresGlobales.length > 0 ? parseResult.erroresGlobales.join("; ") : null,
          totalFilas,
          updatedAt: new Date(),
        },
      });

      for (const { op, bloque, resolucion, estado, allErrors, allWarnings } of filaData) {
        await tx.bolsaImportFila.create({
          data: {
            id: crypto.randomUUID(),
            loteId: lote.id,
            archivoId: archivo.id,
            estado,
            numeroBloque: bloque.numeroBloque,
            numeroFila: op.numeroFila,
            rawJson: op as object,
            nombreDetectado: bloque.nombreDetectado ?? undefined,
            nroComitenteDetectado: bloque.nroComitenteDetectado ?? undefined,
            tipoOperacionDetectada: op.rawOperacion || undefined,
            comitenteResueltoId: resolucion.comitenteResueltoId ?? undefined,
            carteraResueltaId: resolucion.carteraResueltaId ?? undefined,
            tipoSujeto: resolucion.tipoSujeto ?? undefined,
            conflictoNombre: resolucion.conflictoNombre,
            tipoOperacionResuelta: mapOpBase(op) ?? undefined,
            ticker: op.ticker ?? undefined,
            instrumento: op.instrumentoHint ?? undefined,
            moneda: (op.monedaDetectada as "ARS" | "USD" | null) ?? undefined,
            cantidad: op.cantidad ?? undefined,
            precio: op.precio ?? undefined,
            montoNetoReferencia: op.montoNetoReferencia ?? undefined,
            fechaConcertacion: op.fechaConcertacion ? new Date(op.fechaConcertacion) : undefined,
            plazo: op.plazoNormalizado ?? op.plazo ?? undefined,
            fechaVencimiento: op.fechaVencimiento ? new Date(op.fechaVencimiento) : undefined,
            tasaCaucion: op.tasaCaucion ?? undefined,
            montoCobrarReferencia: op.montoCobrarReferencia ?? undefined,
            montoPagarReferencia: op.montoPagarReferencia ?? undefined,
            erroresJson: allErrors.length > 0 ? allErrors : undefined,
            warningsJson: allWarnings.length > 0 ? allWarnings : undefined,
            fingerprint: computeFingerprint(op, bloque),
            updatedAt: new Date(),
          },
        });
      }

      return { lote, archivo };
    });

    loteId = created.lote.id;
    archivoId = created.archivo.id;
  } catch (e) {
    // Race en unique hash → retornar DUPLICADO
    if (e instanceof Error && "code" in e && (e as { code: string }).code === "P2002") {
      const existing2 = await prisma.bolsaImportArchivo.findUnique({ where: { fileHashSha256: hash } });
      return {
        ok: true,
        estado: "DUPLICADO",
        loteId: existing2?.loteId,
        archivoId: existing2?.id,
        ...baseResult,
        archivoExistente: existing2
          ? { loteId: existing2.loteId, creadoEl: existing2.createdAt.toISOString() }
          : undefined,
      };
    }
    const msg = e instanceof Error ? e.message : "Error desconocido.";
    return { ok: false, error: `Error al guardar: ${msg}`, ...baseResult };
  }

  return {
    ok: true,
    estado: "REVISION_PENDIENTE",
    loteId,
    archivoId,
    nombreArchivo,
    totalFilas,
    filasResuelta,
    filasConAdvertencia,
    filasConError,
  };
}
