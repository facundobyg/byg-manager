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
import { isoDateString } from "./fecha-operativa";

export interface BolsaImageUploadInput {
  parseResult: BolsaImageParseResult;
  fileName: string;
  fileSize: number;
  mimeType: BolsaImageMime;
  /** Fecha operativa del lote — reemplaza la fechaConcertacion de cada fila. */
  fechaOperativa: Date;
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

// Precisión/escala real de las columnas Decimal de BolsaImportFila (ver
// prisma/schema.prisma). Un valor que no entra ahí haría fallar el INSERT
// con "numeric field overflow" — se valida y descarta acá, antes de Prisma.
const DECIMAL_LIMITS: Partial<
  Record<keyof BolsaImageRawOp, { precision: number; scale: number; label: string }>
> = {
  cantidad: { precision: 18, scale: 6, label: "Cantidad" },
  precio: { precision: 18, scale: 6, label: "Precio" },
  montoNetoReferencia: { precision: 18, scale: 2, label: "Monto neto" },
  tasaCaucion: { precision: 8, scale: 4, label: "Tasa de caución" },
  montoCobrarReferencia: { precision: 18, scale: 2, label: "Monto a cobrar" },
  montoPagarReferencia: { precision: 18, scale: 2, label: "Monto a pagar" },
};

function fitsDecimal(value: string, precision: number, scale: number): boolean {
  const n = Number(value);
  if (!Number.isFinite(n)) return false;
  const maxIntDigits = precision - scale;
  const max = Math.pow(10, maxIntDigits) - Math.pow(10, -scale);
  return Math.abs(n) <= max;
}

/**
 * Valida cantidad/precio/montos/tasa contra la precisión real de sus
 * columnas Decimal antes de construir el `data` de Prisma. Cualquier campo
 * fuera de rango se anula y queda registrado como error de la fila —
 * nunca se deja pasar un valor que Prisma vaya a rechazar.
 */
function sanitizeNumericFields(op: BolsaImageRawOp): { op: BolsaImageRawOp; extraErrors: string[] } {
  const extraErrors: string[] = [];
  const sanitized: BolsaImageRawOp = { ...op };

  for (const [key, limit] of Object.entries(DECIMAL_LIMITS) as Array<
    [keyof BolsaImageRawOp, { precision: number; scale: number; label: string }]
  >) {
    const value = sanitized[key];
    if (typeof value !== "string" || value === "") continue;
    if (!fitsDecimal(value, limit.precision, limit.scale)) {
      extraErrors.push(`${limit.label} fuera de rango válido y fue descartado.`);
      (sanitized as unknown as Record<string, unknown>)[key] = null;
    }
  }

  return { op: sanitized, extraErrors };
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
  const { fileName, fileSize, mimeType, fechaOperativa } = input;
  const baseResult = { nombreArchivo: fileName, ...EMPTY_COUNTS };
  const fechaOperativaISO = isoDateString(fechaOperativa);

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
    for (const rawOp of bloque.operaciones) {
      const { op, extraErrors } = sanitizeNumericFields(rawOp);
      // La fecha operativa del lote reemplaza la fechaConcertacion de cada
      // fila, así que "Fecha no detectada" del OCR deja de ser un error real.
      const allErrors = [
        ...op.errors.filter((e) => e !== "Fecha no detectada."),
        ...extraErrors,
      ];
      const allWarnings = [...op.warnings];
      if (op.fechaConcertacion && op.fechaConcertacion !== fechaOperativaISO) {
        allWarnings.push(
          `Fecha detectada (${op.fechaConcertacion}) difiere de la fecha operativa seleccionada (${fechaOperativaISO}).`,
        );
      }
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
            fechaOperativa,
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
            // La fila siempre usa la fecha operativa del lote, no la detectada
            // por el OCR — esa queda solo en rawJson como referencia.
            fechaConcertacion: fechaOperativa,
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
    // Nunca exponer el mensaje crudo de Prisma/Postgres a la UI — puede
    // incluir detalles de esquema o datos. El detalle técnico queda solo
    // en el log del servidor para diagnóstico.
    console.error("[processBolsaImageUpload] Error al guardar filas de staging:", e);
    return {
      ok: false,
      error: "No se pudo guardar una de las filas detectadas.",
      ...baseResult,
    };
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
