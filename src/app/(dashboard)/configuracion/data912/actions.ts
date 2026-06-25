"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionPermission } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/services/audit.service";
import { buildData912PriceSyncPreview } from "@/lib/services/data912-price-sync-preview.service";
import { applyData912PriceSync } from "@/lib/services/data912-price-sync.service";
import type { PriceSource, PriceStatus, UserRole } from "@prisma/client";

export interface Data912StatusBucket {
  DATA912:   number;
  MANUAL:    number;
  NOT_FOUND: number;
  ERROR:     number;
  STALE:     number;
}

export interface Data912StatusResult {
  lastSyncedAt: Date | null;
  activos:      Data912StatusBucket;
  holdings:     Data912StatusBucket;
}

function emptyBucket(): Data912StatusBucket {
  return { DATA912: 0, MANUAL: 0, NOT_FOUND: 0, ERROR: 0, STALE: 0 };
}

function bucketize(rows: { priceSource: PriceSource; priceStatus: PriceStatus }[]): Data912StatusBucket {
  const bucket = emptyBucket();
  for (const r of rows) {
    if (r.priceStatus === "NOT_FOUND") bucket.NOT_FOUND++;
    else if (r.priceStatus === "ERROR") bucket.ERROR++;
    else if (r.priceStatus === "STALE") bucket.STALE++;
    else if (r.priceSource === "DATA912") bucket.DATA912++;
    else bucket.MANUAL++;
  }
  return bucket;
}

/** Estado actual de cobertura de precios — solo lectura. */
export async function getData912Status(): Promise<Data912StatusResult> {
  const denied = await requireActionPermission("configuracion:leer");
  if (denied) return { lastSyncedAt: null, activos: emptyBucket(), holdings: emptyBucket() };

  const [activos, holdings, activoMax, holdingMax] = await Promise.all([
    prisma.activo.findMany({ select: { priceSource: true, priceStatus: true } }),
    prisma.holdingComitenteInversion.findMany({ select: { priceSource: true, priceStatus: true } }),
    prisma.activo.aggregate({ _max: { priceSyncedAt: true } }),
    prisma.holdingComitenteInversion.aggregate({ _max: { priceSyncedAt: true } }),
  ]);

  const dates = [activoMax._max.priceSyncedAt, holdingMax._max.priceSyncedAt].filter((d): d is Date => d != null);
  const lastSyncedAt = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;

  return { lastSyncedAt, activos: bucketize(activos), holdings: bucketize(holdings) };
}

export interface ProblematicRow {
  origin:        "ACTIVO" | "HOLDING";
  ticker:        string;
  category:      string | null;
  resolveStatus: string;
  reason:        string;
}

export type PreviewActionResult =
  | {
      ok: true;
      fetchedAt: Date;
      summary: {
        totalActivos: number; totalHoldings: number; totalUniqueInputs: number;
        matched: number; manualOnly: number; notFound: number; ambiguous: number; providerErrors: number;
      };
      dataStatus: { okCount: number; failedCount: number };
      problematicRows: ProblematicRow[];
    }
  | { ok: false; error: string };

/** Dry-run de cobertura — nunca escribe nada. */
export async function runData912Preview(): Promise<PreviewActionResult> {
  const denied = await requireActionPermission("configuracion:leer");
  if (denied) return { ok: false, error: "No tenés permisos para ver esta información." };

  try {
    const preview = await buildData912PriceSyncPreview();
    const problematicRows: ProblematicRow[] = preview.rows
      .filter((r) => r.resolveStatus !== "MATCHED")
      .map((r) => ({ origin: r.origin, ticker: r.ticker, category: r.category, resolveStatus: r.resolveStatus, reason: r.reason }));

    return {
      ok: true,
      fetchedAt: preview.fetchedAt,
      summary: preview.summary,
      dataStatus: { okCount: preview.data912.okCount, failedCount: preview.data912.failedCount },
      problematicRows,
    };
  } catch {
    return { ok: false, error: "No se pudo generar la previsualización. Intentá nuevamente en unos minutos." };
  }
}

export interface FailedSyncRow {
  ticker:  string;
  message: string;
}

export type SyncActionResult =
  | {
      ok: true;
      fetchedAt: Date;
      summary: {
        totalRows: number; updatedActivos: number; updatedHoldings: number; historyUpserts: number;
        markedNotFound: number; markedProviderError: number; skippedManualOnly: number;
        skippedInvalidPrice: number; failedWrites: number;
      };
      failedRows: FailedSyncRow[];
    }
  | { ok: false; error: string };

/**
 * Ejecuta el sync real (escribe precios). Solo ADMIN — chequeo explícito de
 * rol, no la matriz de permisos genérica (ahí SOCIO tiene acceso total a
 * cualquier acción, y este botón debe quedar reservado solo a ADMIN).
 */
export async function runData912Sync(): Promise<SyncActionResult> {
  const session = await auth();
  const role = (session?.user as { role?: UserRole } | undefined)?.role;

  if (!session?.user?.id || role !== "ADMIN") {
    await writeAuditLog({
      userId: session?.user?.id ?? null,
      accion: "ACCESO_DENEGADO",
      entidad: "Data912Sync",
      description: `Intento de ejecutar sync Data912 sin rol ADMIN (role=${role ?? "sin sesión"})`,
    });
    return { ok: false, error: "Solo un administrador puede ejecutar la sincronización." };
  }

  try {
    const result = await applyData912PriceSync({ dryRun: false });

    await writeAuditLog({
      userId: session.user.id,
      accion: "DATA912_SYNC",
      entidad: "Activo",
      description: `Sync Data912: ${result.summary.updatedActivos} activos, ${result.summary.updatedHoldings} holdings, ${result.summary.markedNotFound} no encontrados, ${result.summary.failedWrites} fallidos`,
    });

    revalidatePath("/configuracion/data912");

    const failedRows: FailedSyncRow[] = result.rows
      .filter((r) => r.action === "FAILED")
      .map((r) => ({ ticker: r.ticker, message: r.message }));

    return { ok: true, fetchedAt: result.fetchedAt, summary: result.summary, failedRows };
  } catch {
    return { ok: false, error: "No se pudo completar la sincronización. Verificá la conexión e intentá nuevamente." };
  }
}
