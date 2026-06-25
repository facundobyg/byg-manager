// Sync manual real de precios Data912 -> BYG. A diferencia del preview
// (data912-price-sync-preview.service.ts, 100% read-only), este servicio SÍ
// puede escribir en DB, pero solo dentro del alcance explícito de seguridad:
// nunca toca CRIPTO/FCI, nunca escribe un precio que no vino de una fila
// MATCHED con precio válido, y para todo lo demás (NOT_FOUND/PROVIDER_ERROR/
// AMBIGUOUS) solo actualiza metadata, nunca precioActual/precioAnterior/
// PrecioHistorico.
//
// dryRun por defecto es true: hay que pasar dryRun:false explícitamente para
// que escriba algo en la base real.

import { prisma } from "@/lib/prisma";
import type { Moneda } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { buildData912PriceSyncPreview, type PriceSyncPreviewRow } from "./data912-price-sync-preview.service";
import type { Data912EndpointKey } from "./data912.service";

export type SyncRowAction =
  | "UPDATED"
  | "MARKED_NOT_FOUND"
  | "MARKED_ERROR"
  | "SKIPPED_MANUAL_ONLY"
  | "SKIPPED_INVALID_PRICE"
  | "FAILED";

export interface SyncRowResult {
  origin:        "ACTIVO" | "HOLDING";
  id:            string;
  ticker:        string;
  endpoint:      Data912EndpointKey | null;
  data912Symbol: string | null;
  previousPrice: number | null;
  newPrice:      number | null;
  action:        SyncRowAction;
  message:       string;
}

export interface ApplyData912PriceSyncResult {
  fetchedAt: Date;
  dryRun:    boolean;
  summary: {
    totalRows:            number;
    updatedActivos:       number;
    updatedHoldings:      number;
    historyUpserts:       number;
    markedNotFound:       number;
    markedProviderError:  number;
    skippedManualOnly:    number;
    skippedInvalidPrice:  number;
    failedWrites:         number;
  };
  rows: SyncRowResult[];
}

export interface ApplyData912PriceSyncOptions {
  timeoutMs?: number;
  /** Default true — hay que pasar explícitamente false para escribir en DB real. */
  dryRun?: boolean;
  /** Límite de filas a procesar (sobre el plan ya armado), para corridas controladas. */
  limit?: number;
}

function isValidPrice(price: number | null): price is number {
  return typeof price === "number" && Number.isFinite(price) && price > 0;
}

function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

async function processRow(
  row: PriceSyncPreviewRow,
  dryRun: boolean,
  syncRunAt: Date,
): Promise<{ result: SyncRowResult; historyUpsert: boolean }> {
  const base = {
    origin: row.origin,
    id: row.id,
    ticker: row.ticker,
    endpoint: row.endpoint,
    data912Symbol: row.data912Symbol,
    previousPrice: row.currentPrice,
  };

  if (row.resolveStatus === "MANUAL_ONLY") {
    return {
      historyUpsert: false,
      result: { ...base, newPrice: null, action: "SKIPPED_MANUAL_ONLY", message: row.reason },
    };
  }

  if (row.resolveStatus === "MATCHED") {
    if (!isValidPrice(row.data912Price)) {
      return {
        historyUpsert: false,
        result: { ...base, newPrice: null, action: "SKIPPED_INVALID_PRICE", message: "Resolución MATCHED pero data912Price es null/<=0 — no se escribe nada por seguridad." },
      };
    }

    const newPrice = row.data912Price;
    const moneda = row.inferredCurrency as Moneda | null;

    try {
      if (!dryRun) {
        if (row.origin === "ACTIVO") {
          const fecha = todayUtcMidnight();
          await prisma.$transaction([
            prisma.activo.update({
              where: { id: row.id },
              data: {
                precioAnterior: row.currentPrice != null ? new Decimal(row.currentPrice) : null,
                precioActual: new Decimal(newPrice),
                ...(moneda ? { monedaPrecio: moneda } : {}),
                priceSource: "DATA912",
                priceStatus: "OK",
                priceSyncedAt: syncRunAt,
                providerUpdatedAt: null,
                priceErrorMessage: null,
                updatedAt: syncRunAt,
              },
            }),
            prisma.precioHistorico.upsert({
              where: { activoId_fecha: { activoId: row.id, fecha } },
              update: { precio: new Decimal(newPrice) },
              create: { id: crypto.randomUUID(), activoId: row.id, fecha, precio: new Decimal(newPrice), userId: null },
            }),
          ]);
        } else {
          await prisma.holdingComitenteInversion.update({
            where: { id: row.id },
            data: {
              precioActual: new Decimal(newPrice),
              priceSource: "DATA912",
              priceStatus: "OK",
              priceSyncedAt: syncRunAt,
              providerUpdatedAt: null,
              priceErrorMessage: null,
              updatedAt: syncRunAt,
            },
          });
        }
      }
      return {
        historyUpsert: row.origin === "ACTIVO",
        result: { ...base, newPrice, action: "UPDATED", message: dryRun ? "DRY RUN — no se escribió, esto es lo que se habría aplicado." : "Actualizado desde Data912." },
      };
    } catch (e) {
      return {
        historyUpsert: false,
        result: { ...base, newPrice, action: "FAILED", message: e instanceof Error ? e.message : "Error desconocido al escribir." },
      };
    }
  }

  // NOT_FOUND / PROVIDER_ERROR / AMBIGUOUS: nunca tocan precioActual,
  // precioAnterior ni PrecioHistorico — solo metadata.
  const isProviderError = row.resolveStatus === "PROVIDER_ERROR";
  const isAmbiguous = row.resolveStatus === "AMBIGUOUS";
  const priceStatus = isProviderError ? "ERROR" : "NOT_FOUND"; // AMBIGUOUS se trata como NOT_FOUND (ver justificación en el reporte)
  const message = isProviderError
    ? row.reason
    : isAmbiguous
      ? "Resolución ambigua, requiere alias manual"
      : "Ticker no encontrado en Data912";
  const action: SyncRowAction = isProviderError ? "MARKED_ERROR" : "MARKED_NOT_FOUND";

  try {
    if (!dryRun) {
      const data = {
        priceStatus,
        priceErrorMessage: message,
        priceSyncedAt: syncRunAt,
        updatedAt: syncRunAt,
      } as const;
      if (row.origin === "ACTIVO") {
        await prisma.activo.update({ where: { id: row.id }, data });
      } else {
        await prisma.holdingComitenteInversion.update({ where: { id: row.id }, data });
      }
    }
    return {
      historyUpsert: false,
      result: { ...base, newPrice: null, action, message: dryRun ? `DRY RUN — ${message}` : message },
    };
  } catch (e) {
    return {
      historyUpsert: false,
      result: { ...base, newPrice: null, action: "FAILED", message: e instanceof Error ? e.message : "Error desconocido al escribir." },
    };
  }
}

/**
 * Construye el preview Data912 y aplica las actualizaciones seguras.
 * dryRun por defecto es true — para escribir en la base real hay que pasar
 * explícitamente { dryRun: false }.
 */
export async function applyData912PriceSync(
  options?: ApplyData912PriceSyncOptions,
): Promise<ApplyData912PriceSyncResult> {
  const dryRun = options?.dryRun ?? true;
  const syncRunAt = new Date();

  const preview = await buildData912PriceSyncPreview(options?.timeoutMs != null ? { timeoutMs: options.timeoutMs } : undefined);
  const rowsToProcess = options?.limit != null ? preview.rows.slice(0, options.limit) : preview.rows;

  const results: SyncRowResult[] = [];
  let historyUpserts = 0;
  let updatedActivos = 0;
  let updatedHoldings = 0;

  for (const row of rowsToProcess) {
    const { result, historyUpsert } = await processRow(row, dryRun, syncRunAt);
    results.push(result);
    if (result.action === "UPDATED") {
      if (historyUpsert) historyUpserts++;
      if (row.origin === "ACTIVO") updatedActivos++;
      else updatedHoldings++;
    }
  }

  const summary = {
    totalRows: rowsToProcess.length,
    updatedActivos,
    updatedHoldings,
    historyUpserts,
    markedNotFound: results.filter((r) => r.action === "MARKED_NOT_FOUND").length,
    markedProviderError: results.filter((r) => r.action === "MARKED_ERROR").length,
    skippedManualOnly: results.filter((r) => r.action === "SKIPPED_MANUAL_ONLY").length,
    skippedInvalidPrice: results.filter((r) => r.action === "SKIPPED_INVALID_PRICE").length,
    failedWrites: results.filter((r) => r.action === "FAILED").length,
  };

  return { fetchedAt: preview.fetchedAt, dryRun, summary, rows: results };
}
