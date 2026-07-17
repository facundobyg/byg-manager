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
  resolveTickerAgainstCatalog,
  checkCantidadCoherence,
  checkCaucionPrincipalCoherence,
  ESTADOS_REANALIZABLES,
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
  /**
   * Si el hash de contenido coincide con un archivo ya existente, en vez de
   * devolver DUPLICADO reemplaza las filas de ese archivo con este nuevo
   * resultado — solo si el lote sigue en un estado reanalizable.
   */
  reanalizar?: boolean;
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

type FilaDataImg = {
  op: BolsaImageRawOp;
  bloque: BolsaImageBloque;
  resolucion: ComitenteResolucion;
  estado: "ADVERTENCIA" | "ERROR";
  allErrors: string[];
  allWarnings: string[];
  /** Ticker efectivo para la columna `ticker` — null si no pasó la
   * validación de catálogo (E4.6C.1/E4.6C.2). El OCR original queda intacto
   * en `op`/rawJson de todas formas. */
  tickerResuelto: string | null;
  /** Cantidad efectiva para la columna `cantidad` — puede diferir del OCR
   * original (op.cantidad) cuando se re-derivó por coherencia (E4.6C.2). El
   * valor OCR original queda intacto en rawJson y el warning documenta la
   * corrección. */
  cantidadResuelta: string | null;
};

// E4.6C.1/E4.6C.2 — endurecimiento SOLO del flujo GRID (lectura por celda):
// un valor financiero corrupto (separador/cero perdido por el OCR, ticker
// inexistente) nunca debe quedar como fila lista para enviar sin revisión
// humana. El flujo GENERIC_OCR (fallback de página completa) no se toca acá.

export interface TickerCatalog {
  tickers: string[];
  aliases: Record<string, string>;
}

/**
 * Misma fuente exacta que usa el alta manual de operaciones de bolsa
 * (bolsa/nueva/page.tsx: prisma.activo.findMany() sin filtro) — se trae UNA
 * sola vez por request y se reutiliza para todas las filas, en vez de una
 * consulta findUnique por fila.
 */
async function fetchTickerCatalog(): Promise<TickerCatalog> {
  const [activos, brokerAliases] = await Promise.all([
    prisma.activo.findMany({ select: { ticker: true } }),
    prisma.brokerTickerAlias.findMany({
      where: { enabled: true },
      select: { brokerTicker: true, Activo: { select: { ticker: true } } },
    }),
  ]);

  const aliases: Record<string, string> = {};
  for (const a of brokerAliases) aliases[a.brokerTicker] = a.Activo.ticker;

  return { tickers: activos.map((a) => a.ticker), aliases };
}

interface FinancialCoherenceResult {
  tickerResuelto: string | null;
  cantidadResuelta: string | null;
  extraErrors: string[];
  extraWarnings: string[];
}

function validateFinancialCoherenceGrid(op: BolsaImageRawOp, catalog: TickerCatalog): FinancialCoherenceResult {
  const extraErrors: string[] = [];
  const extraWarnings: string[] = [];
  let tickerResuelto = op.ticker;
  let cantidadResuelta = op.cantidad;

  const isCaucion = op.operacionBase === "CAUCION_COLOCADORA" || op.operacionBase === "CAUCION_TOMADORA";

  if (isCaucion) {
    // Cauciones no llevan ticker — el "cantidad" de la fila es el principal,
    // que debe ser coherente con el monto a cobrar/pagar (nunca al revés: no
    // se infiere el principal desde el monto, solo se anula si es imposible).
    const montoReferencia = op.operacionBase === "CAUCION_COLOCADORA" ? op.montoCobrarReferencia : op.montoPagarReferencia;
    const { error } = checkCaucionPrincipalCoherence(op.cantidad, montoReferencia);
    if (error) {
      extraErrors.push(error);
      cantidadResuelta = null;
    }
    return { tickerResuelto, cantidadResuelta, extraErrors, extraWarnings };
  }

  if (op.operacionBase !== "COMPRA" && op.operacionBase !== "VENTA") {
    return { tickerResuelto, cantidadResuelta, extraErrors, extraWarnings };
  }

  if (tickerResuelto) {
    const { ticker, warning } = resolveTickerAgainstCatalog([tickerResuelto], catalog.tickers, catalog.aliases);
    if (ticker) {
      tickerResuelto = ticker;
      if (warning) extraWarnings.push(warning);
    } else {
      extraErrors.push(`Ticker no reconocido: ${tickerResuelto}`);
      tickerResuelto = null;
    }
  }

  if (op.cantidad !== null && !(Number(op.cantidad) > 0)) {
    extraErrors.push("Cantidad inválida.");
  }
  if (op.precio !== null && !(Number(op.precio) > 0)) {
    extraErrors.push("Precio inválido.");
  }

  // Coherencia cantidad × precio ≈ monto neto — SOLO para rechazar, nunca
  // para "confirmar" ni reemplazar: precio y monto pueden estar tan
  // corruptos como cantidad, así que su coincidencia numérica no es
  // suficiente evidencia de que cantidad esté bien leída (E4.6C.3).
  const { error: coherenceError } = checkCantidadCoherence(op.cantidad, op.precio, op.montoNetoReferencia);
  if (coherenceError) {
    extraErrors.push(coherenceError);
    cantidadResuelta = null;
  }

  return { tickerResuelto, cantidadResuelta, extraErrors, extraWarnings };
}

/**
 * Resuelve comitentes y prepara las filas a persistir — usado tanto por el
 * alta normal como por el reanálisis, para no duplicar esta lógica.
 */
async function buildFilaDataImagen(
  parseResult: BolsaImageParseResult,
  fechaOperativaISO: string,
): Promise<FilaDataImg[]> {
  const esGrid = parseResult.modo === "GRID";
  const catalog: TickerCatalog = esGrid ? await fetchTickerCatalog() : { tickers: [], aliases: {} };
  const filaData: FilaDataImg[] = [];
  for (const bloque of parseResult.bloques) {
    const resolucion = await resolveComitente(bloque.nroComitenteDetectado, bloque.nombreDetectado);
    for (const rawOp of bloque.operaciones) {
      const { op, extraErrors: sanitizeErrors } = sanitizeNumericFields(rawOp);

      let tickerResuelto = op.ticker;
      let cantidadResuelta = op.cantidad;
      let financialErrors: string[] = [];
      let financialWarnings: string[] = [];
      if (esGrid) {
        const result = validateFinancialCoherenceGrid(op, catalog);
        tickerResuelto = result.tickerResuelto;
        cantidadResuelta = result.cantidadResuelta;
        financialErrors = result.extraErrors;
        financialWarnings = result.extraWarnings;
      }

      // La fecha operativa del lote reemplaza la fechaConcertacion de cada
      // fila, así que "Fecha no detectada" del OCR deja de ser un error real.
      const allErrors = [...op.errors.filter((e) => e !== "Fecha no detectada."), ...sanitizeErrors, ...financialErrors];
      const allWarnings = [...op.warnings, ...financialWarnings];
      if (op.fechaConcertacion && op.fechaConcertacion !== fechaOperativaISO) {
        allWarnings.push(
          `Fecha detectada (${op.fechaConcertacion}) difiere de la fecha operativa seleccionada (${fechaOperativaISO}).`,
        );
      }
      if (resolucion.errorMsg) allErrors.push(resolucion.errorMsg);
      if (resolucion.warningMsg) allWarnings.push(resolucion.warningMsg);

      // OCR: minimum estado = ADVERTENCIA. Never RESUELTA — always requires review.
      const estado: "ADVERTENCIA" | "ERROR" =
        allErrors.length > 0 || resolucion.estado === "ERROR" ? "ERROR" : "ADVERTENCIA";

      filaData.push({ op, bloque, resolucion, estado, allErrors, allWarnings, tickerResuelto, cantidadResuelta });
    }
  }
  return filaData;
}

function filaCreateDataImg(
  f: FilaDataImg,
  loteId: string,
  archivoId: string,
  fechaOperativa: Date,
) {
  const { op, bloque, resolucion, estado, allErrors, allWarnings, tickerResuelto, cantidadResuelta } = f;
  return {
    id: crypto.randomUUID(),
    loteId,
    archivoId,
    estado,
    numeroBloque: bloque.numeroBloque,
    numeroFila: op.numeroFila,
    // El texto OCR original (incluido un ticker que no pasó el catálogo)
    // siempre queda intacto acá, aunque la columna `ticker` resuelta sea null.
    rawJson: op as object,
    nombreDetectado: bloque.nombreDetectado ?? undefined,
    nroComitenteDetectado: bloque.nroComitenteDetectado ?? undefined,
    tipoOperacionDetectada: op.rawOperacion || undefined,
    comitenteResueltoId: resolucion.comitenteResueltoId ?? undefined,
    carteraResueltaId: resolucion.carteraResueltaId ?? undefined,
    tipoSujeto: resolucion.tipoSujeto ?? undefined,
    conflictoNombre: resolucion.conflictoNombre,
    tipoOperacionResuelta: mapOpBaseImg(op) ?? undefined,
    ticker: tickerResuelto ?? undefined,
    instrumento: op.instrumentoHint ?? undefined,
    moneda: (op.monedaDetectada as "ARS" | "USD" | null) ?? undefined,
    cantidad: cantidadResuelta ?? undefined,
    precio: op.precio ?? undefined,
    montoNetoReferencia: op.montoNetoReferencia ?? undefined,
    // La fila siempre usa la fecha operativa del lote, no la detectada por
    // el OCR — esa queda solo en rawJson como referencia.
    fechaConcertacion: fechaOperativa,
    plazo: op.plazoNormalizado ?? op.plazo ?? undefined,
    fechaVencimiento: op.fechaVencimiento ? new Date(op.fechaVencimiento) : undefined,
    tasaCaucion: op.tasaCaucion ?? undefined,
    montoCobrarReferencia: op.montoCobrarReferencia ?? undefined,
    montoPagarReferencia: op.montoPagarReferencia ?? undefined,
    erroresJson: allErrors.length > 0 ? allErrors : undefined,
    warningsJson: allWarnings.length > 0 ? allWarnings : undefined,
    fingerprint: computeFingerprintImg(op, bloque),
    updatedAt: new Date(),
  };
}

/**
 * Reanaliza un archivo ya existente (mismo hash de contenido): reemplaza sus
 * filas de staging con el resultado nuevo, dentro de una única transacción.
 * Nunca sobrescribe un lote EN_VALIDACION, APROBADO o CONFIRMADO — y solo el
 * creador del lote o un ADMIN pueden reanalizarlo.
 */
async function reanalizarArchivoImagen(
  archivoExistente: { id: string; loteId: string },
  parseResult: BolsaImageParseResult,
  input: { fileName: string; fileSize: number; mimeType: BolsaImageMime; fechaOperativa: Date },
  contentHash: string,
  userId: string,
): Promise<ProcessBolsaResult> {
  const baseResult = { nombreArchivo: input.fileName, ...EMPTY_COUNTS };

  const lote = await prisma.bolsaImportLote.findUnique({ where: { id: archivoExistente.loteId } });
  if (!lote) return { ok: false, error: "Lote no encontrado.", ...baseResult };

  if (lote.creadoPorId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== "ADMIN") {
      return { ok: false, error: "No tenés permisos para reanalizar este lote.", ...baseResult };
    }
  }
  if (!ESTADOS_REANALIZABLES.has(lote.estado)) {
    return {
      ok: false,
      error: `El lote está en estado ${lote.estado} y no admite reanálisis.`,
      ...baseResult,
    };
  }

  const fechaOperativaISO = isoDateString(input.fechaOperativa);
  const filaData = await buildFilaDataImagen(parseResult, fechaOperativaISO);
  if (filaData.length === 0) {
    return {
      ok: false,
      error: "La imagen fue procesada pero no se detectaron operaciones de bolsa.",
      ...baseResult,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Reemplazo atómico: solo las filas de ESTE archivo — un lote puede
      // tener otras imágenes cuyas filas no deben tocarse.
      await tx.bolsaImportFila.deleteMany({ where: { archivoId: archivoExistente.id } });

      await tx.bolsaImportArchivo.update({
        where: { id: archivoExistente.id },
        data: {
          nombreOriginal: input.fileName,
          mimeType: input.mimeType,
          tamano: input.fileSize,
          fileHashSha256: contentHash,
          estado: "LISTO",
          rawJson: parseResult as object,
          errorMessage: null,
          totalFilas: filaData.length,
          updatedAt: new Date(),
        },
      });

      for (const f of filaData) {
        await tx.bolsaImportFila.create({
          data: filaCreateDataImg(f, lote.id, archivoExistente.id, input.fechaOperativa),
        });
      }

      const todasLasFilas = await tx.bolsaImportFila.findMany({
        where: { loteId: lote.id },
        select: { estado: true },
      });
      await tx.bolsaImportLote.update({
        where: { id: lote.id },
        data: {
          estado: "REVISION_PENDIENTE",
          fechaOperativa: input.fechaOperativa,
          totalFilas: todasLasFilas.length,
          filasConAdvertencia: todasLasFilas.filter((f) => f.estado === "ADVERTENCIA").length,
          filasConError: todasLasFilas.filter((f) => f.estado === "ERROR").length,
          filasExcluidas: todasLasFilas.filter((f) => f.estado === "EXCLUIDA").length,
          filasListas: todasLasFilas.filter((f) => f.estado === "LISTA").length,
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          accion: "LOTE_REANALIZADO",
          entidad: "BolsaImportLote",
          entidadId: lote.id,
          datosNuevos: { description: `Archivo reanalizado (${filaData.length} filas nuevas).` },
        },
      });
    });
  } catch (e) {
    console.error("[reanalizarArchivoImagen] Error inesperado:", e);
    return { ok: false, error: "No se pudo reanalizar el archivo.", ...baseResult };
  }

  return {
    ok: true,
    estado: "REVISION_PENDIENTE",
    loteId: lote.id,
    archivoId: archivoExistente.id,
    nombreArchivo: input.fileName,
    totalFilas: filaData.length,
    filasResuelta: 0,
    filasConAdvertencia: filaData.filter((f) => f.estado === "ADVERTENCIA").length,
    filasConError: filaData.filter((f) => f.estado === "ERROR").length,
  };
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
    const loteExistente = await prisma.bolsaImportLote.findUnique({ where: { id: existing.loteId } });
    const reanalizable = !!loteExistente && ESTADOS_REANALIZABLES.has(loteExistente.estado);

    if (input.reanalizar && reanalizable) {
      return reanalizarArchivoImagen(existing, parseResult, input, contentHash, userId);
    }

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
        estadoLote: loteExistente?.estado,
        reanalizable,
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
  const filaData = await buildFilaDataImagen(parseResult, fechaOperativaISO);
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

      for (const f of filaData) {
        await tx.bolsaImportFila.create({
          data: filaCreateDataImg(f, loteIdTx, archivo.id, fechaOperativa),
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
