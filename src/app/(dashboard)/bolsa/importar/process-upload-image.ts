// Lógica de guardado de resultado OCR de imagen bolsa — NO es "use server".
// El único punto de entrada gateado para la UI es importarBolsaImagenAction
// en actions.ts.
//
// El OCR ocurre íntegramente en el navegador (ocr-bolsa.ts).
// Esta función recibe el resultado ya estructurado y lo persiste en staging.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { BolsaImageParseResult, BolsaImageMime } from "@/lib/importers/bolsa-image/types";
import type {
  BolsaImageRawOp,
  BolsaImageBloque,
} from "@/lib/importers/bolsa-image/types";
import type { TipoOpBolsa } from "@prisma/client";
import {
  resolveComitente,
  type ComitenteResolucion,
  type ProcessBolsaResult,
} from "./process-upload";

export interface BolsaImageUploadInput {
  parseResult: BolsaImageParseResult;
  fileName: string;
  fileSize: number;
  mimeType: BolsaImageMime;
}

const EMPTY_COUNTS = {
  totalFilas: 0,
  filasResuelta: 0,
  filasConAdvertencia: 0,
  filasConError: 0,
};

function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function validateParseResult(r: unknown): BolsaImageParseResult {
  if (!r || typeof r !== "object") throw new Error("Estructura inválida.");
  const obj = r as Record<string, unknown>;
  if (!Array.isArray(obj.bloques)) throw new Error("Estructura inválida: bloques.");
  for (const bloque of obj.bloques as unknown[]) {
    const b = bloque as Record<string, unknown>;
    if (!Array.isArray(b.operaciones)) throw new Error("Estructura inválida: operaciones.");
    for (const op of b.operaciones as unknown[]) {
      if (typeof (op as Record<string, unknown>).rawOperacion !== "string") {
        throw new Error("Estructura inválida: rawOperacion.");
      }
    }
  }
  return r as BolsaImageParseResult;
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

/**
 * Persiste el resultado OCR de una imagen en las tablas de staging.
 *
 * La imagen NO llega aquí — solo el resultado estructurado del OCR.
 * Todas las filas quedan en ADVERTENCIA mínima (nunca RESUELTA)
 * para forzar revisión humana antes de confirmar.
 */
export async function processBolsaImageUpload(
  input: BolsaImageUploadInput,
  userId: string,
  existingLoteId?: string,
): Promise<ProcessBolsaResult> {
  const { fileName, fileSize, mimeType } = input;
  const baseResult = { nombreArchivo: fileName, ...EMPTY_COUNTS };

  // ── Validar estructura recibida del cliente ───────────────────────────────
  let parseResult: BolsaImageParseResult;
  try {
    parseResult = validateParseResult(input.parseResult);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Resultado OCR inválido.",
      ...baseResult,
    };
  }

  // ── Deduplicación por hash de contenido ──────────────────────────────────
  const contentHash = sha256(Buffer.from(JSON.stringify(parseResult)));
  const existing = await prisma.bolsaImportArchivo.findUnique({
    where: { fileHashSha256: contentHash },
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

  // ── Resolución de comitentes ──────────────────────────────────────────────
  type FilaData = {
    op: BolsaImageRawOp;
    bloque: BolsaImageBloque;
    resolucion: ComitenteResolucion;
    estado: "ADVERTENCIA" | "ERROR";
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

      // OCR: minimum estado = ADVERTENCIA. Never RESUELTA — always requires review.
      const estado: "ADVERTENCIA" | "ERROR" =
        allErrors.length > 0 || resolucion.estado === "ERROR" ? "ERROR" : "ADVERTENCIA";

      filaData.push({ op, bloque, resolucion, estado, allErrors, allWarnings });
    }
  }

  const totalFilas = filaData.length;

  // Guard: never create an empty staging lote — return a clear error instead.
  if (totalFilas === 0) {
    return {
      ok: false,
      error: "La imagen fue procesada pero no se detectaron operaciones de bolsa.",
      ...baseResult,
    };
  }

  const filasConError = filaData.filter((f) => f.estado === "ERROR").length;
  const filasConAdvertencia = filaData.filter((f) => f.estado === "ADVERTENCIA").length;
  const filasResuelta = 0; // always 0 for OCR imports

  // ── Transacción: lote (nuevo o append) + archivo + filas ─────────────────
  let loteId: string;
  let archivoId: string;
  try {
    const created = await prisma.$transaction(async (tx) => {
      let loteIdTx: string;

      if (existingLoteId) {
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
            estado: "REVISION_PENDIENTE",
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
          nombreOriginal: fileName,
          mimeType,
          tamano: fileSize,
          fileHashSha256: contentHash,
          estado: "LISTO",
          origen: "IMAGEN",
          rawJson: parseResult as object,
          errorMessage: null,
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
    if (
      e instanceof Error &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return { ok: true, estado: "DUPLICADO", ...baseResult, nombreArchivo: fileName };
    }
    const msg = e instanceof Error ? e.message : "Error desconocido.";
    return { ok: false, error: `Error al guardar: ${msg}`, ...baseResult };
  }

  return {
    ok: true,
    estado: "REVISION_PENDIENTE",
    loteId,
    archivoId,
    nombreArchivo: fileName,
    totalFilas,
    filasResuelta,
    filasConAdvertencia,
    filasConError,
  };
}
