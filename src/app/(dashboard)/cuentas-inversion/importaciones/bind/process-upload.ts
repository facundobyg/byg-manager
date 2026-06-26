// Lógica real de la carga de PDFs Bind — deliberadamente NO es "use server".
// Esto la hace inalcanzable como Server Action sin importar qué se exporte
// de acá: solo un archivo con la directiva "use server" puede convertir sus
// exports en endpoints invocables desde el cliente. El único punto de
// entrada gateado para la UI es uploadBindPdfsAction en actions.ts, que
// chequea permisos y después llama a processBindPdfUpload de este módulo.
// Mantenerlo separado también permite probarlo con un script (sin sesión).

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { parseBindTenenciasPdf } from "@/lib/importers/bind-tenencias/parser";
import type { BindTenenciasParsedFile, BindTenenciasRow } from "@/lib/importers/bind-tenencias/types";
import type { Activo, BindImportBatchStatus, BindImportFileStatus, BindSectionType, CategoriaActivo } from "@prisma/client";

// Límites de esta primera versión (Módulo 4.12D). El cuello de botella real
// no es el tamaño de archivo (los 2 PDFs de referencia pesan ~16-20kb cada
// uno) sino el tiempo de ejecución de una Server Action en serverless — 100
// PDFs parseados + persistidos uno por uno en una sola request son varios
// segundos y arriesgan el timeout de la función. Por eso el tope es por
// CANTIDAD de archivos por envío, no por bytes. Subir 100 PDFs en total se
// soporta agregándolos al mismo batchId en varias tandas (ver UI).
export const MAX_FILES_PER_SUBMIT = 15;
const MAX_TOTAL_BYTES_PER_SUBMIT = 8 * 1024 * 1024; // 8mb
const MAX_SINGLE_FILE_BYTES = 5 * 1024 * 1024; // 5mb

const PDF_MAGIC = Buffer.from("%PDF");

function isPdfBuffer(buf: Buffer): boolean {
  return buf.subarray(0, 4).equals(PDF_MAGIC);
}

function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export interface UploadResultRow {
  fileName: string;
  status: "PARSED" | "ERROR" | "DUPLICATE" | "NEEDS_ACCOUNT_MAPPING" | "NEEDS_TICKER_MAPPING" | "READY";
  message: string;
  fileId?: string;
}

export interface UploadBindPdfsResult {
  ok: boolean;
  error?: string;
  batchId?: string;
  results: UploadResultRow[];
}

async function matchComitente(accountNumber: string | null): Promise<{ id: string | null; reason: string }> {
  if (!accountNumber) return { id: null, reason: "El PDF no tiene número de cuenta detectado." };

  const alias = await prisma.brokerAccountAlias.findFirst({
    where: { broker: "BIND", accountNumber, enabled: true },
  });
  if (alias) return { id: alias.comitenteId, reason: "Match por alias guardado." };

  const matches = await prisma.comitenteInversion.findMany({
    where: { nroComitente: accountNumber },
    select: { id: true },
  });
  if (matches.length === 1) return { id: matches[0].id, reason: "Match directo por nroComitente." };
  if (matches.length > 1) return { id: null, reason: `Ambiguo: ${matches.length} comitentes con nroComitente=${accountNumber}.` };
  return { id: null, reason: `Ningún comitente con nroComitente=${accountNumber}.` };
}

function isCashSection(sectionType: BindSectionType): boolean {
  return sectionType === "CASH_ARS" || sectionType === "CASH_USD_MEP" || sectionType === "CASH_USD_CABLE";
}

/**
 * Compatibilidad de moneda/categoría entre la fila parseada y un Activo
 * candidato (sea por alias o por ticker exacto). Existe específicamente
 * para evitar el caso real encontrado en 4.12D: "SUPV" local (acción
 * argentina en pesos, sección Acciones) NO debe matchear con el Activo
 * SUPV ya cargado como ADR/ACCION_USD (Módulo 4.7B) solo porque el string
 * del ticker coincide. Mismo criterio para BBD/BBD-US, EWZ/EWZ-US.
 */
export function isCompatibleActivo(
  sectionType: BindSectionType,
  ticker: string,
  activo: Pick<Activo, "categoria" | "monedaPrecio">,
): boolean {
  const isUsSuffix = /-US$/i.test(ticker.trim());

  switch (sectionType) {
    case "EQUITY_SECTION_MIXED":
      if (isUsSuffix) {
        return (activo.categoria === "ACCION_USD" || activo.categoria === "ACCION_USD_EXT") && activo.monedaPrecio === "USD";
      }
      return activo.categoria === "ACCION_ARS" && activo.monedaPrecio === "ARS";
    case "CEDEAR":
      return activo.categoria === "CEDEAR";
    case "BOND": {
      const bondCategorias: CategoriaActivo[] = ["BONO_ARS", "BONO_USD"];
      return bondCategorias.includes(activo.categoria);
    }
    case "FCI":
      // Sin regla automática confiable todavía (4.12A): el matching por
      // ticker exacto nunca se intenta para FCI (ver matchActivo). Pero un
      // alias EXPLÍCITO sí puede apuntar a un Activo realmente FCI — el
      // chequeo acá solo valida que la categoría sea coherente.
      return activo.categoria === "FCI";
    default:
      return false;
  }
}

async function matchActivo(
  row: BindTenenciasRow,
  sectionType: BindSectionType,
): Promise<{ id: string | null; requiresMapping: boolean; warning?: string }> {
  if (isCashSection(sectionType) || !row.ticker) return { id: null, requiresMapping: false };

  const alias = await prisma.brokerTickerAlias.findFirst({
    where: { broker: "BIND", brokerTicker: row.ticker, brokerCode: row.brokerCode, enabled: true },
  });
  if (alias) {
    // El alias explícito tiene prioridad y resuelve igual aunque la
    // compatibilidad automática no alcance — pero avisamos sin bloquear.
    const aliasActivo = await prisma.activo.findUnique({ where: { id: alias.activoId }, select: { categoria: true, monedaPrecio: true } });
    const warning = aliasActivo && !isCompatibleActivo(sectionType, row.ticker, aliasActivo)
      ? `Alias para "${row.ticker}" apunta a un Activo cuya categoría/moneda no coincide con lo esperado para esta sección — revisar.`
      : undefined;
    return { id: alias.activoId, requiresMapping: false, warning };
  }

  if (sectionType === "FCI") {
    // Regla 6 (4.12D): sin alias, FCI siempre queda pendiente de mapeo.
    return { id: null, requiresMapping: true };
  }

  const activo = await prisma.activo.findUnique({ where: { ticker: row.ticker } });
  if (activo && isCompatibleActivo(sectionType, row.ticker, activo)) {
    return { id: activo.id, requiresMapping: false };
  }
  if (activo) {
    // Ticker exacto existe, pero no es compatible (caso SUPV local vs SUPV
    // ADR) — no lo aceptamos a ciegas, queda pendiente de mapeo manual.
    return {
      id: null,
      requiresMapping: true,
      warning: `Ticker "${row.ticker}" exacto encontrado pero incompatible por moneda/categoría. Requiere mapeo manual.`,
    };
  }

  return { id: null, requiresMapping: true };
}

function fileStatusFromParse(parsed: BindTenenciasParsedFile, comitenteId: string | null, anyRowNeedsMapping: boolean) {
  if (parsed.errors.length > 0) return "ERROR" as const;
  if (!comitenteId) return "NEEDS_ACCOUNT_MAPPING" as const;
  if (anyRowNeedsMapping) return "NEEDS_TICKER_MAPPING" as const;
  return "READY" as const;
}

export async function processBindPdfUpload(formData: FormData): Promise<UploadBindPdfsResult> {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: "Adjuntá al menos un PDF.", results: [] };
  if (files.length > MAX_FILES_PER_SUBMIT) {
    return { ok: false, error: `Máximo ${MAX_FILES_PER_SUBMIT} archivos por carga. Subí el resto en otra tanda al mismo lote.`, results: [] };
  }
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES_PER_SUBMIT) {
    return { ok: false, error: `El total de archivos supera ${(MAX_TOTAL_BYTES_PER_SUBMIT / 1024 / 1024).toFixed(0)}mb. Subí menos archivos por tanda.`, results: [] };
  }
  for (const f of files) {
    if (f.size > MAX_SINGLE_FILE_BYTES) {
      return { ok: false, error: `"${f.name}" supera ${(MAX_SINGLE_FILE_BYTES / 1024 / 1024).toFixed(0)}mb — no se procesó nada.`, results: [] };
    }
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      return { ok: false, error: `"${f.name}" no es un PDF — no se procesó nada.`, results: [] };
    }
  }

  const existingBatchId = formData.get("batchId")?.toString().trim() || null;
  let batchId = existingBatchId;
  if (!batchId) {
    const batch = await prisma.bindTenenciasImportBatch.create({
      data: { id: crypto.randomUUID(), updatedAt: new Date(), status: "DRAFT" },
    });
    batchId = batch.id;
  } else {
    const batch = await prisma.bindTenenciasImportBatch.findUnique({ where: { id: batchId } });
    if (!batch) return { ok: false, error: "El lote indicado no existe.", results: [] };
    if (batch.status === "CONFIRMED" || batch.status === "CANCELLED") {
      return { ok: false, error: "Este lote ya está cerrado, no se le pueden agregar archivos.", results: [] };
    }
  }

  const results: UploadResultRow[] = [];
  let parsedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      if (!isPdfBuffer(buf)) {
        results.push({ fileName: file.name, status: "ERROR", message: "El contenido no es un PDF válido (firma de archivo incorrecta)." });
        errorCount++;
        continue;
      }

      const hash = sha256(buf);
      const existing = await prisma.bindTenenciasImportFile.findUnique({ where: { fileHashSha256: hash } });
      if (existing) {
        results.push({
          fileName: file.name,
          status: "DUPLICATE",
          message: `Ya fue importado (archivo "${existing.fileName}", lote ${existing.batchId}, ${existing.createdAt.toLocaleString("es-AR")}).`,
          fileId: existing.id,
        });
        continue;
      }

      const parsed = await parseBindTenenciasPdf(new Uint8Array(buf), file.name);
      const { id: matchedComitenteId, reason: comitenteReason } = await matchComitente(parsed.accountNumber);

      const allRows = parsed.sections.flatMap((s) => s.rows.map((r) => ({ row: r, sectionType: s.normalizedType })));
      const rowMatches = await Promise.all(allRows.map(({ row, sectionType }) => matchActivo(row, sectionType)));
      const anyRowNeedsMapping = rowMatches.some((m) => m.requiresMapping);

      const status = fileStatusFromParse(parsed, matchedComitenteId, anyRowNeedsMapping);

      const created = await prisma.$transaction(async (tx) => {
        const importFile = await tx.bindTenenciasImportFile.create({
          data: {
            id: crypto.randomUUID(),
            batchId: batchId!,
            fileName: file.name,
            fileHashSha256: hash,
            status,
            reportDate: parsed.reportDate ? new Date(parsed.reportDate) : null,
            reportTime: parsed.reportTime,
            accountNumber: parsed.accountNumber,
            accountName: parsed.accountName,
            matchedComitenteId,
            totalAmountARS: parsed.totals.grandTotalAmountARS,
            rawJson: parsed as object,
            warningsJson: parsed.warnings.length > 0 ? parsed.warnings : undefined,
            errorMessage: parsed.errors[0] ?? (matchedComitenteId ? null : comitenteReason),
            updatedAt: new Date(),
          },
        });

        for (let i = 0; i < allRows.length; i++) {
          const { row, sectionType } = allRows[i];
          const match = rowMatches[i];
          const warnings = match.warning ? [...row.warnings, match.warning] : row.warnings;
          await tx.bindTenenciasImportRow.create({
            data: {
              id: crypto.randomUUID(),
              importFileId: importFile.id,
              sectionName: row.sectionName,
              sectionType: sectionType as BindSectionType,
              ticker: row.ticker,
              brokerCode: row.brokerCode,
              descriptionRaw: row.descriptionRaw,
              descriptionClean: row.descriptionClean,
              quote: row.quote,
              saldoVencidoQuantity: row.saldoVencidoQuantity,
              saldoVencidoAmountARS: row.saldoVencidoAmountARS,
              pending24AmountARS: row.pending24AmountARS,
              pending48AmountARS: row.pending48AmountARS,
              pendingFutureAmountARS: row.pendingFutureAmountARS,
              garantiaQuantity: row.garantiaQuantity,
              garantiaAmountARS: row.garantiaAmountARS,
              totalQuantity: row.totalQuantity,
              totalAmountARS: row.totalAmountARS,
              inferredInstrumentType: row.inferredInstrumentType,
              inferredNativeCurrency: row.inferredNativeCurrency,
              matchedActivoId: match.id,
              requiresMapping: match.requiresMapping,
              warningsJson: warnings.length > 0 ? warnings : undefined,
              rawJson: row as object,
              updatedAt: new Date(),
            },
          });
        }

        return importFile;
      });

      results.push({
        fileName: file.name,
        status,
        message:
          status === "ERROR" ? parsed.errors.join("; ") :
          status === "NEEDS_ACCOUNT_MAPPING" ? comitenteReason :
          status === "NEEDS_TICKER_MAPPING" ? "Cuenta vinculada, pero hay tickers sin mapear." :
          "Parseado y vinculado correctamente.",
        fileId: created.id,
      });
      if (status === "ERROR") errorCount++; else parsedCount++;
    } catch (e) {
      results.push({ fileName: file.name, status: "ERROR", message: e instanceof Error ? e.message : "Error desconocido procesando el archivo." });
      errorCount++;
    }
  }

  const finalBatch = await prisma.bindTenenciasImportBatch.update({
    where: { id: batchId },
    data: {
      totalFiles: { increment: files.length },
      parsedFiles: { increment: parsedCount },
      errorFiles: { increment: errorCount },
      status: errorCount > 0 ? "PARTIAL_ERROR" : "PARSED",
      updatedAt: new Date(),
    },
  });

  return { ok: true, batchId: finalBatch.id, results };
}

// ─── Resolución manual de cuentas/tickers (Módulo 4.12E) ───────────────────────
// Todo lo de acá hereda la misma regla de oro: nunca toca holdings/precios/
// carteras reales. Solo escribe en BrokerAccountAlias/BrokerTickerAlias y en
// las propias tablas de staging (BindTenenciasImportFile/Row).

/** Recalcula el status de un archivo a partir de su estado real en DB. ERROR y DUPLICATE son permanentes — nunca se recalculan hacia otra cosa. */
export async function recalcFileStatus(fileId: string): Promise<BindImportFileStatus> {
  const file = await prisma.bindTenenciasImportFile.findUnique({ where: { id: fileId } });
  if (!file) throw new Error(`BindTenenciasImportFile ${fileId} no existe.`);
  if (file.status === "ERROR" || file.status === "DUPLICATE" || file.status === "CONFIRMED" || file.status === "SKIPPED") {
    return file.status;
  }
  if (!file.matchedComitenteId) return "NEEDS_ACCOUNT_MAPPING";

  const pendingCount = await prisma.bindTenenciasImportRow.count({ where: { importFileId: fileId, requiresMapping: true } });
  return pendingCount > 0 ? "NEEDS_TICKER_MAPPING" : "READY";
}

/** Recalcula el status del lote a partir del status real de sus archivos. */
export async function recalcBatchStatus(batchId: string): Promise<BindImportBatchStatus> {
  const files = await prisma.bindTenenciasImportFile.findMany({ where: { batchId }, select: { status: true } });
  let status: BindImportBatchStatus;
  if (files.length === 0) {
    status = "DRAFT";
  } else if (files.some((f) => f.status === "ERROR")) {
    status = "PARTIAL_ERROR";
  } else if (files.every((f) => f.status === "READY" || f.status === "CONFIRMED")) {
    status = "READY_TO_CONFIRM";
  } else {
    status = "PARSED";
  }
  await prisma.bindTenenciasImportBatch.update({ where: { id: batchId }, data: { status, updatedAt: new Date() } });
  return status;
}

async function recalcAffectedFiles(fileIds: string[]): Promise<void> {
  const uniqueFileIds = Array.from(new Set(fileIds));
  for (const fileId of uniqueFileIds) {
    const status = await recalcFileStatus(fileId);
    await prisma.bindTenenciasImportFile.update({ where: { id: fileId }, data: { status, updatedAt: new Date() } });
  }
  const batchIds = new Set(
    (await prisma.bindTenenciasImportFile.findMany({ where: { id: { in: uniqueFileIds } }, select: { batchId: true } })).map((f) => f.batchId),
  );
  for (const batchId of Array.from(batchIds)) await recalcBatchStatus(batchId);
}

export type ResolveResult = { ok: true; affectedCount: number } | { ok: false; error: string };

/**
 * Vincula una cuenta externa Bind a un ComitenteInversion ya existente.
 * Nunca crea comitentes. Aplica a TODOS los archivos pendientes con ese
 * accountNumber (no solo el del lote en pantalla), porque el alias es una
 * decisión que vale para cualquier import futuro/pasado con esa cuenta.
 */
export async function resolveBindAccountAlias(accountNumber: string, comitenteId: string): Promise<ResolveResult> {
  const accNum = accountNumber.trim();
  const comId = comitenteId.trim();
  if (!accNum || !comId) return { ok: false, error: "Faltan datos (cuenta o comitente)." };

  const comitente = await prisma.comitenteInversion.findUnique({ where: { id: comId } });
  if (!comitente) return { ok: false, error: "El comitente indicado no existe." };

  const pendingFiles = await prisma.bindTenenciasImportFile.findMany({
    where: { accountNumber: accNum, status: "NEEDS_ACCOUNT_MAPPING" },
    select: { id: true, accountName: true },
  });

  await prisma.brokerAccountAlias.upsert({
    where: { broker_accountNumber: { broker: "BIND", accountNumber: accNum } },
    update: { comitenteId: comId, enabled: true, accountNameLastSeen: pendingFiles[0]?.accountName ?? undefined, updatedAt: new Date() },
    create: {
      id: crypto.randomUUID(),
      broker: "BIND",
      accountNumber: accNum,
      accountNameLastSeen: pendingFiles[0]?.accountName ?? null,
      comitenteId: comId,
      enabled: true,
      updatedAt: new Date(),
    },
  });

  if (pendingFiles.length > 0) {
    await prisma.bindTenenciasImportFile.updateMany({
      where: { id: { in: pendingFiles.map((f) => f.id) } },
      data: { matchedComitenteId: comId, updatedAt: new Date() },
    });
    await recalcAffectedFiles(pendingFiles.map((f) => f.id));
  }

  return { ok: true, affectedCount: pendingFiles.length };
}

/**
 * Vincula un ticker/código Bind a un Activo BYG existente. Bloquea (no
 * fuerza) si el Activo elegido no es compatible con la sección de origen —
 * caso obligatorio: SUPV local nunca debe poder mapearse al Activo SUPV
 * ADR/USD. Nunca crea Activos.
 */
export async function resolveBindTickerAlias(brokerTicker: string, brokerCode: string | null, activoId: string): Promise<ResolveResult> {
  const ticker = brokerTicker.trim();
  const actId = activoId.trim();
  if (!ticker || !actId) return { ok: false, error: "Faltan datos (ticker o activo)." };

  const activo = await prisma.activo.findUnique({ where: { id: actId } });
  if (!activo) return { ok: false, error: "El activo indicado no existe." };

  const pendingRows = await prisma.bindTenenciasImportRow.findMany({
    where: { ticker, brokerCode, requiresMapping: true },
  });
  if (pendingRows.length === 0) return { ok: false, error: "No hay filas pendientes para ese ticker/código." };

  const sectionType = pendingRows[0].sectionType;
  if (!isCompatibleActivo(sectionType, ticker, activo)) {
    return {
      ok: false,
      error: `No existe activo compatible. Crear/corregir activo en catálogo antes de mapear. (Activo "${activo.ticker}" es ${activo.categoria}/${activo.monedaPrecio}, incompatible con esta sección.)`,
    };
  }

  // No se usa el shorthand de upsert por clave compuesta porque Prisma no
  // permite null en el selector compuesto aunque la columna sea nullable
  // (cada NULL es distinto a nivel de índice). brokerCode siempre viene
  // poblado en datos reales de Bind, pero por si acaso se maneja a mano.
  const existingAlias = await prisma.brokerTickerAlias.findFirst({ where: { broker: "BIND", brokerTicker: ticker, brokerCode } });
  if (existingAlias) {
    await prisma.brokerTickerAlias.update({ where: { id: existingAlias.id }, data: { activoId: actId, enabled: true, updatedAt: new Date() } });
  } else {
    await prisma.brokerTickerAlias.create({
      data: { id: crypto.randomUUID(), broker: "BIND", brokerTicker: ticker, brokerCode, activoId: actId, enabled: true, updatedAt: new Date() },
    });
  }

  await prisma.bindTenenciasImportRow.updateMany({
    where: { id: { in: pendingRows.map((r) => r.id) } },
    data: { matchedActivoId: actId, requiresMapping: false, updatedAt: new Date() },
  });

  await recalcAffectedFiles(pendingRows.map((r) => r.importFileId));

  return { ok: true, affectedCount: pendingRows.length };
}

export interface PendingAccountMapping {
  fileId: string;
  fileName: string;
  accountNumber: string | null;
  accountName: string | null;
  reportDate: Date | null;
  totalAmountARS: number | null;
}

export interface PendingTickerMapping {
  ticker: string;
  brokerCode: string | null;
  descriptionClean: string;
  sectionType: BindSectionType;
  inferredInstrumentType: string;
  inferredNativeCurrency: string;
  occurrences: number;
  fileIds: string[];
  totalAmountARS: number;
}

/** Lectura agregada de lo pendiente en un lote — para armar la UI de resolución. No escribe nada. */
export async function getPendingBindMappings(batchId: string): Promise<{
  accounts: PendingAccountMapping[];
  tickers: PendingTickerMapping[];
}> {
  const files = await prisma.bindTenenciasImportFile.findMany({ where: { batchId } });

  const accounts: PendingAccountMapping[] = files
    .filter((f) => f.status === "NEEDS_ACCOUNT_MAPPING")
    .map((f) => ({
      fileId: f.id,
      fileName: f.fileName,
      accountNumber: f.accountNumber,
      accountName: f.accountName,
      reportDate: f.reportDate,
      totalAmountARS: f.totalAmountARS != null ? Number(f.totalAmountARS) : null,
    }));

  const fileIds = files.map((f) => f.id);
  const pendingRows = fileIds.length > 0
    ? await prisma.bindTenenciasImportRow.findMany({ where: { importFileId: { in: fileIds }, requiresMapping: true } })
    : [];

  const grouped = new Map<string, PendingTickerMapping>();
  for (const row of pendingRows) {
    const key = `${row.ticker ?? ""}|${row.brokerCode ?? ""}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        ticker: row.ticker ?? "(sin ticker)",
        brokerCode: row.brokerCode,
        descriptionClean: row.descriptionClean,
        sectionType: row.sectionType,
        inferredInstrumentType: row.inferredInstrumentType,
        inferredNativeCurrency: row.inferredNativeCurrency,
        occurrences: 0,
        fileIds: [],
        totalAmountARS: 0,
      });
    }
    const bucket = grouped.get(key)!;
    bucket.occurrences++;
    if (!bucket.fileIds.includes(row.importFileId)) bucket.fileIds.push(row.importFileId);
    bucket.totalAmountARS += row.totalAmountARS != null ? Number(row.totalAmountARS) : 0;
  }

  return { accounts, tickers: Array.from(grouped.values()) };
}
