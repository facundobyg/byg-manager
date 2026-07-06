// Motor de confirmación real de un BindTenenciasImportFile a holdings definitivos.
// Deliberadamente NO tiene "use server" — mismo patrón que process-upload.ts.
// El único punto de entrada gateado es confirmBindFileImportAction en actions.ts.
// Esta función SÍ escribe en HoldingComitenteInversion y SaldoComitenteInversion.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import type { CategoriaActivo, CategoriaHoldingInversion } from "@prisma/client";

// ── Categoria mapping ─────────────────────────────────────────────────────────

const CATEGORIA_MAP: Partial<Record<CategoriaActivo, CategoriaHoldingInversion>> = {
  BONO_ARS:      "BONO",
  BONO_USD:      "BONO",
  ON_USD:        "ON",
  ACCION_ARS:    "ACCION",
  ACCION_USD:    "ACCION",
  ACCION_USD_EXT: "ACCION",
  CEDEAR:        "CEDEAR",
  FCI:           "FCI",
  // CRIPTO has no CategoriaHoldingInversion equivalent — rows are skipped with warning
};

const CASH_SECTION_TYPES = new Set(["CASH_ARS", "CASH_USD_MEP", "CASH_USD_CABLE"]);

// ── Public types ──────────────────────────────────────────────────────────────

export type QuantityDiscrepancy = {
  ticker:         string;
  pdfQuantity:    number;
  actualQuantity: number;
};

export type ConfirmBindFileResult = {
  ok:                    boolean;
  error?:                string;
  created:               string[];   // tickers de holdings nuevos
  updated:               string[];   // tickers de holdings existentes (solo precioActual)
  skipped:               string[];   // tickers omitidos (CAUCION_ALERT, CRIPTO, sin activo)
  warnings:              string[];
  quantityDiscrepancies: QuantityDiscrepancy[];
  cashUpdated:           boolean;
};

const EMPTY_RESULT: Omit<ConfirmBindFileResult, "ok" | "error"> = {
  created: [], updated: [], skipped: [], warnings: [], quantityDiscrepancies: [], cashUpdated: false,
};

// ── Main function ─────────────────────────────────────────────────────────────

export async function confirmBindFileImport(
  fileId: string,
  userId: string | null,
): Promise<ConfirmBindFileResult> {

  // ── Pre-flight reads (outside transaction) ────────────────────────────────

  const file = await prisma.bindTenenciasImportFile.findUnique({
    where: { id: fileId },
    include: {
      Batch: true,
      MatchedComitente: true,
      Rows: {
        include: {
          MatchedActivo: {
            select: { id: true, ticker: true, descripcion: true, categoria: true },
          },
        },
      },
    },
  });

  if (!file) return { ok: false, error: "Archivo de import no encontrado.", ...EMPTY_RESULT };
  if (file.status !== "READY") {
    return { ok: false, error: `Estado inválido del archivo: '${file.status}' (se esperaba READY).`, ...EMPTY_RESULT };
  }
  if (file.Batch.status !== "READY_TO_CONFIRM") {
    return { ok: false, error: `Estado inválido del lote: '${file.Batch.status}' (se esperaba READY_TO_CONFIRM).`, ...EMPTY_RESULT };
  }

  const comitente = file.MatchedComitente;
  if (!comitente) return { ok: false, error: "El archivo no tiene comitente vinculado.", ...EMPTY_RESULT };
  if (!comitente.activo) return { ok: false, error: `Comitente '${comitente.nombre}' está inactivo.`, ...EMPTY_RESULT };
  if (comitente.esPropioBYG && comitente.carteraId) {
    return { ok: false, error: "No se puede importar a un comitente espejo de cartera propia BYG.", ...EMPTY_RESULT };
  }

  const pendingMapping = file.Rows.filter((r) => r.requiresMapping);
  if (pendingMapping.length > 0) {
    return { ok: false, error: `${pendingMapping.length} fila(s) aún pendientes de vinculación de ticker.`, ...EMPTY_RESULT };
  }

  // Classify rows
  const cashRows   = file.Rows.filter((r) => CASH_SECTION_TYPES.has(r.sectionType));
  const holdingRows = file.Rows.filter((r) => !CASH_SECTION_TYPES.has(r.sectionType) && r.sectionType !== "CAUCION_ALERT");

  // Non-cash rows without matchedActivoId are a data integrity issue
  const unmappedNonCash = holdingRows.filter((r) => !r.matchedActivoId);
  if (unmappedNonCash.length > 0) {
    return {
      ok: false,
      error: `${unmappedNonCash.length} fila(s) no-cash sin activo mapeado — el archivo no debería estar en estado READY.`,
      ...EMPTY_RESULT,
    };
  }

  // Defensive: CASH_USD_* deben tener saldoVencidoQuantity (USD nominal real del PDF).
  // Si es null no podemos determinar el monto en USD → bloquear antes de escribir datos incorrectos.
  const mepCashRow   = cashRows.find((r) => r.sectionType === "CASH_USD_MEP");
  const cableCashRow = cashRows.find((r) => r.sectionType === "CASH_USD_CABLE");
  if (mepCashRow && mepCashRow.saldoVencidoQuantity === null) {
    return {
      ok: false,
      error: "CASH_USD_MEP row sin saldoVencidoQuantity (USD nominal) — confirmación bloqueada para no guardar equivalente ARS como USD.",
      ...EMPTY_RESULT,
    };
  }
  if (cableCashRow && cableCashRow.saldoVencidoQuantity === null) {
    return {
      ok: false,
      error: "CASH_USD_CABLE row sin saldoVencidoQuantity (USD nominal) — confirmación bloqueada para no guardar equivalente ARS como USD.",
      ...EMPTY_RESULT,
    };
  }

  // Pre-validate categoria mappings — filter out rows that can't be written
  const warnings: string[] = [];
  const skipped: string[] = [];

  const cauciones = file.Rows.filter((r) => r.sectionType === "CAUCION_ALERT");
  for (const r of cauciones) {
    skipped.push(r.ticker ?? "(caucion)");
  }

  const validHoldingRows = holdingRows.filter((row) => {
    const activo = row.MatchedActivo!;
    const catH = CATEGORIA_MAP[activo.categoria];
    if (!catH) {
      const msg = `${row.ticker} (${activo.categoria}) sin mapeo de categoría — omitido`;
      warnings.push(msg);
      skipped.push(row.ticker ?? "?");
      return false;
    }
    return true;
  });

  // ── Transaction ───────────────────────────────────────────────────────────

  const created: string[] = [];
  const updated: string[] = [];
  const quantityDiscrepancies: QuantityDiscrepancy[] = [];

  try {
    await prisma.$transaction(async (tx) => {

      // Re-check statuses inside transaction (anti double-confirm race condition)
      const freshFile = await tx.bindTenenciasImportFile.findUnique({
        where:  { id: fileId },
        select: { status: true },
      });
      if (!freshFile || freshFile.status !== "READY") {
        throw new Error(
          `El archivo ya no está en estado READY (estado actual: ${freshFile?.status ?? "no encontrado"}).`
        );
      }

      const freshBatch = await tx.bindTenenciasImportBatch.findUnique({
        where:  { id: file.batchId },
        select: { status: true },
      });
      if (!freshBatch || freshBatch.status !== "READY_TO_CONFIRM") {
        throw new Error(
          `El lote ya no está en estado READY_TO_CONFIRM (estado actual: ${freshBatch?.status ?? "no encontrado"}).`
        );
      }

      // 1. Cash: replace SaldoComitenteInversion ────────────────────────────

      if (cashRows.length > 0) {
        const arsRow    = cashRows.find((r) => r.sectionType === "CASH_ARS");
        const mepRow    = cashRows.find((r) => r.sectionType === "CASH_USD_MEP");
        const cableRow  = cashRows.find((r) => r.sectionType === "CASH_USD_CABLE");

        // CASH_ARS:    totalAmountARS        = saldo ARS (puede ser negativo por pendientes).
        // CASH_USD_*:  saldoVencidoQuantity  = USD nominal real del PDF.
        //              totalAmountARS        = equivalente ARS calculado por Bind — NO usar para saldoUSDMep/Cable.
        const saldoARS   = arsRow?.totalAmountARS        ?? new Decimal(0);
        const saldoMEP   = mepRow?.saldoVencidoQuantity   ?? new Decimal(0);
        const saldoCable = cableRow?.saldoVencidoQuantity  ?? new Decimal(0);

        await tx.saldoComitenteInversion.upsert({
          where: { comitenteId: comitente.id },
          create: {
            id:            crypto.randomUUID(),
            comitenteId:   comitente.id,
            saldoARS,
            saldoUSDMep:   saldoMEP,
            saldoUSDCable: saldoCable,
            updatedAt:     new Date(),
          },
          update: {
            saldoARS,
            saldoUSDMep:   saldoMEP,
            saldoUSDCable: saldoCable,
            updatedAt:     new Date(),
          },
        });
      }

      // 2. Holdings ─────────────────────────────────────────────────────────

      const reportDate = file.reportDate ?? new Date();

      for (const row of validHoldingRows) {
        const activo = row.MatchedActivo!;
        const catH   = CATEGORIA_MAP[activo.categoria]!;
        const ticker = activo.ticker;
        const pdfQty   = new Decimal(row.totalQuantity ?? 0);
        const pdfPrice = new Decimal(row.quote ?? 0);

        const existing = await tx.holdingComitenteInversion.findUnique({
          where: { comitenteId_ticker: { comitenteId: comitente.id, ticker } },
        });

        if (existing) {
          // Detect quantity discrepancy (report, never overwrite)
          const diff = Math.abs(Number(existing.cantidad) - Number(pdfQty));
          if (diff > 0.0001) {
            quantityDiscrepancies.push({
              ticker,
              pdfQuantity:    Number(pdfQty),
              actualQuantity: Number(existing.cantidad),
            });
          }

          // Update precioActual only
          await tx.holdingComitenteInversion.update({
            where: { id: existing.id },
            data:  {
              precioActual: pdfPrice.isZero() ? null : pdfPrice,
              updatedAt:    new Date(),
            },
          });

          // Audit AJUSTE for update
          await tx.operacionHoldingInversion.create({
            data: {
              id:            crypto.randomUUID(),
              comitenteId:   comitente.id,
              holdingId:     existing.id,
              tipo:          "AJUSTE",
              ticker,
              categoria:     catH,
              cantidad:      existing.cantidad,
              precio:        pdfPrice,
              fecha:         reportDate,
              precioPromedio: existing.precioPromedio,
              notas:         `Import Bind batch:${file.batchId} file:${fileId} — precioActual actualizado a ${pdfPrice}`,
            },
          });

          updated.push(ticker);

        } else {
          // Create new holding
          const newHolding = await tx.holdingComitenteInversion.create({
            data: {
              id:             crypto.randomUUID(),
              comitenteId:    comitente.id,
              ticker,
              descripcion:    activo.descripcion ?? null,
              categoria:      catH,
              cantidad:       pdfQty,
              precioPromedio: pdfPrice,
              precioActual:   pdfPrice.isZero() ? null : pdfPrice,
              updatedAt:      new Date(),
            },
          });

          // Audit AJUSTE for creation
          await tx.operacionHoldingInversion.create({
            data: {
              id:             crypto.randomUUID(),
              comitenteId:    comitente.id,
              holdingId:      newHolding.id,
              tipo:           "AJUSTE",
              ticker,
              categoria:      catH,
              cantidad:       pdfQty,
              precio:         pdfPrice,
              fecha:          reportDate,
              precioPromedio: pdfPrice,
              notas:          `Import Bind batch:${file.batchId} file:${fileId} — holding creado`,
            },
          });

          created.push(ticker);
        }
      }

      // 3. Update file status → CONFIRMED ───────────────────────────────────

      await tx.bindTenenciasImportFile.update({
        where: { id: fileId },
        data:  { status: "CONFIRMED", updatedAt: new Date() },
      });

      // 4. Update batch: confirmedFiles + status ────────────────────────────

      const allFiles = await tx.bindTenenciasImportFile.findMany({
        where:  { batchId: file.batchId },
        select: { status: true },
      });

      // Terminal statuses (the file we just updated will already show CONFIRMED)
      const TERMINAL = new Set(["CONFIRMED", "SKIPPED", "ERROR", "DUPLICATE"]);
      const pendingLeft = allFiles.filter((f) => !TERMINAL.has(f.status)).length;
      const confirmedCount = allFiles.filter((f) => f.status === "CONFIRMED").length;

      await tx.bindTenenciasImportBatch.update({
        where: { id: file.batchId },
        data:  {
          confirmedFiles: confirmedCount,
          status:         pendingLeft === 0 ? "CONFIRMED" : "READY_TO_CONFIRM",
          updatedAt:      new Date(),
        },
      });

      // 5. AuditLog — dentro de la transacción: si falla, revierte todo ──────

      await tx.auditLog.create({
        data: {
          id:          crypto.randomUUID(),
          userId:      userId ?? null,
          accion:      "BIND_IMPORT_CONFIRM",
          entidad:     "BindTenenciasImportFile",
          entidadId:   fileId,
          datosNuevos: {
            description: [
              `Archivo: ${file.fileName}`,
              `Comitente: ${comitente.nombre} (${comitente.nroComitente})`,
              `Holdings creados: ${created.length}`,
              `Holdings actualizados: ${updated.length}`,
              `Omitidos: ${skipped.length}`,
              `Discrepancias de cantidad: ${quantityDiscrepancies.length}`,
              `Cash actualizado: ${cashRows.length > 0 ? "sí" : "no"}`,
              `Batch: ${file.batchId}`,
            ].join(" | "),
          },
        },
      });

    }, {
      timeout: 30_000,
    });

  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : String(err),
      ...EMPTY_RESULT,
    };
  }

  return {
    ok: true,
    created,
    updated,
    skipped,
    warnings,
    quantityDiscrepancies,
    cashUpdated: cashRows.length > 0,
  };
}
