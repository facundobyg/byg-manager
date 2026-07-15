// Lógica de carga de una imagen bolsa — deliberadamente NO es "use server".
// El único punto de entrada gateado para la UI es importarBolsaImagenAction
// en actions.ts.
//
// Diseño: una imagen por request. La UI procesa secuencialmente y pasa
// el loteId de la primera respuesta a las siguientes para agrupar todo
// en el mismo BolsaImportLote.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { parseBolsaImage } from "@/lib/importers/bolsa-image/parser";
import type { BolsaImageMime } from "@/lib/importers/bolsa-image/types";
import type {
  BolsaImageRawOp,
  BolsaImageBloque,
  BolsaImageParseResult,
} from "@/lib/importers/bolsa-image/types";
import type { TipoOpBolsa } from "@prisma/client";
import {
  resolveComitente,
  type ComitenteResolucion,
  type ProcessBolsaResult,
} from "./process-upload";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB — guarda de seguridad server-side

function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function detectMimeFromName(name: string): BolsaImageMime | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  return null;
}

function mapOpBaseImg(op: BolsaImageRawOp): TipoOpBolsa | null {
  if (op.operacionBase === "CAUCION_COLOCADORA") return "CAUCION_COLOCADORA";
  if (op.operacionBase === "CAUCION_TOMADORA") return "CAUCION_TOMADORA";
  return null;
}

function computeFingerprintImg(
  op: BolsaImageRawOp,
  bloque: BolsaImageBloque,
): string {
  const parts = [
    bloque.nroComitenteDetectado ?? "",
    op.fechaConcertacion ?? "",
    op.rawOperacion,
    op.ticker ?? "",
    op.cantidad ?? "",
    op.precio ?? "",
  ];
  return crypto
    .createHash("sha256")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, 32);
}

const EMPTY_COUNTS = {
  totalFilas: 0,
  filasResuelta: 0,
  filasConAdvertencia: 0,
  filasConError: 0,
};

/**
 * Procesa una sola imagen y la agrega a un BolsaImportLote.
 *
 * Si `existingLoteId` está presente, se valida que pertenezca al userId y se
 * agregan el archivo y las filas a ese lote (actualizando sus contadores).
 * Si no, se crea un lote nuevo.
 */
export async function processBolsaImageUpload(
  formData: FormData,
  userId: string,
  existingLoteId?: string,
): Promise<ProcessBolsaResult> {
  const file = formData.get("file");
  const nombreArchivo = file instanceof File ? file.name : "";

  const baseResult = { nombreArchivo, ...EMPTY_COUNTS };

  // ── Validación del archivo ────────────────────────────────────────────────
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No se adjuntó ninguna imagen.", ...baseResult };
  }

  const mimeType = detectMimeFromName(file.name);
  if (!mimeType) {
    return {
      ok: false,
      error: `"${file.name}" no es una imagen válida — se aceptan .jpg, .jpeg y .png.`,
      ...baseResult,
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `"${file.name}" supera los 4 MB permitidos por imagen.`,
      ...baseResult,
    };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const hash = sha256(buf);

  // ── Deduplicación por hash ────────────────────────────────────────────────
  const existing = await prisma.bolsaImportArchivo.findUnique({
    where: { fileHashSha256: hash },
  });
  if (existing) {
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

  // ── Validar lote existente ────────────────────────────────────────────────
  if (existingLoteId) {
    const lote = await prisma.bolsaImportLote.findFirst({
      where: { id: existingLoteId, creadoPorId: userId },
    });
    if (!lote) {
      return {
        ok: false,
        error: "Lote no encontrado o sin permisos para agregarle imágenes.",
        ...baseResult,
      };
    }
  }

  // ── Parseo Vision ─────────────────────────────────────────────────────────
  let parseResult: BolsaImageParseResult;
  let parseError: string | null = null;
  try {
    parseResult = await parseBolsaImage(buf, mimeType);
  } catch (e) {
    parseError = e instanceof Error ? e.message : "Error al procesar la imagen.";
    parseResult = { bloques: [], warningsGlobales: [], erroresGlobales: [parseError], totalOperaciones: 0 };
  }

  // ── Resolución de comitentes ──────────────────────────────────────────────
  type FilaData = {
    op: BolsaImageRawOp;
    bloque: BolsaImageBloque;
    resolucion: ComitenteResolucion;
    estado: "RESUELTA" | "ADVERTENCIA" | "ERROR";
    allErrors: string[];
    allWarnings: string[];
  };

  const filaData: FilaData[] = [];
  for (const bloque of parseResult.bloques) {
    const resolucion = await resolveComitente(
      bloque.nroComitenteDetectado,
      bloque.nombreDetectado,
    );
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

  const archivoEstado = parseError ? "ERROR" : "LISTO";
  const loteEstadoNuevo = parseError && !existingLoteId ? "FALLIDO" : "REVISION_PENDIENTE";

  // ── Transacción: lote (nuevo o append) + archivo + filas ─────────────────
  let loteId: string;
  let archivoId: string;
  try {
    const created = await prisma.$transaction(async (tx) => {
      let loteIdTx: string;

      if (existingLoteId) {
        // Agregar al lote existente y recalcular contadores
        await tx.bolsaImportLote.update({
          where: { id: existingLoteId },
          data: {
            totalFilas: { increment: totalFilas },
            filasConAdvertencia: { increment: filasConAdvertencia },
            filasConError: { increment: filasConError },
            updatedAt: new Date(),
          },
        });
        loteIdTx = existingLoteId;
      } else {
        const lote = await tx.bolsaImportLote.create({
          data: {
            id: crypto.randomUUID(),
            estado: loteEstadoNuevo,
            origen: "IMAGEN",
            creadoPorId: userId,
            totalFilas,
            filasConAdvertencia,
            filasConError,
            updatedAt: new Date(),
          },
        });
        loteIdTx = lote.id;
      }

      const archivo = await tx.bolsaImportArchivo.create({
        data: {
          id: crypto.randomUUID(),
          loteId: loteIdTx,
          nombreOriginal: file.name,
          mimeType,
          tamano: file.size,
          fileHashSha256: hash,
          estado: archivoEstado,
          origen: "IMAGEN",
          rawJson: parseResult as object,
          errorMessage: parseError ?? null,
          totalFilas,
          updatedAt: new Date(),
        },
      });

      for (const { op, bloque, resolucion, estado, allErrors, allWarnings } of filaData) {
        await tx.bolsaImportFila.create({
          data: {
            id: crypto.randomUUID(),
            loteId: loteIdTx,
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
            tipoOperacionResuelta: mapOpBaseImg(op) ?? undefined,
            ticker: op.ticker ?? undefined,
            instrumento: op.instrumentoHint ?? undefined,
            moneda: (op.monedaDetectada as "ARS" | "USD" | null) ?? undefined,
            cantidad: op.cantidad ?? undefined,
            precio: op.precio ?? undefined,
            montoNetoReferencia: op.montoNetoReferencia ?? undefined,
            fechaConcertacion: op.fechaConcertacion
              ? new Date(op.fechaConcertacion)
              : undefined,
            plazo: op.plazoNormalizado ?? op.plazo ?? undefined,
            fechaVencimiento: op.fechaVencimiento
              ? new Date(op.fechaVencimiento)
              : undefined,
            tasaCaucion: op.tasaCaucion ?? undefined,
            montoCobrarReferencia: op.montoCobrarReferencia ?? undefined,
            montoPagarReferencia: op.montoPagarReferencia ?? undefined,
            erroresJson: allErrors.length > 0 ? allErrors : undefined,
            warningsJson: allWarnings.length > 0 ? allWarnings : undefined,
            fingerprint: computeFingerprintImg(op, bloque),
            updatedAt: new Date(),
          },
        });
      }

      return { loteId: loteIdTx, archivoId: archivo.id };
    });

    loteId = created.loteId;
    archivoId = created.archivoId;
  } catch (e) {
    // Race en unique hash → duplicado concurrente
    if (
      e instanceof Error &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return { ok: true, estado: "DUPLICADO", ...baseResult, nombreArchivo };
    }
    const msg = e instanceof Error ? e.message : "Error desconocido.";
    return { ok: false, error: `Error al guardar: ${msg}`, ...baseResult };
  }

  const estadoFinal = parseError ? "FALLIDO" : "REVISION_PENDIENTE";

  return {
    ok: true,
    estado: estadoFinal,
    loteId,
    archivoId,
    nombreArchivo,
    totalFilas,
    filasResuelta,
    filasConAdvertencia,
    filasConError,
  };
}
