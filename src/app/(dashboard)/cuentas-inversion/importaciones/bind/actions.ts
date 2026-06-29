"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionPermission } from "@/lib/auth/permissions";
import {
  processBindPdfUpload,
  resolveBindAccountAlias,
  resolveBindTickerAlias,
  resolveBindTickerAliasesBulk,
  getPendingBindMappings as getPendingBindMappingsImpl,
  type UploadBindPdfsResult,
  type ResolveResult,
  type BulkTickerSelection,
  type BulkTickerResolveItemResult,
} from "./process-upload";

export type {
  UploadResultRow, UploadBindPdfsResult, ResolveResult, PendingAccountMapping, PendingTickerMapping,
  BulkTickerSelection, BulkTickerResolveItemResult,
} from "./process-upload";

/**
 * Único punto de entrada gateado para la UI. La lógica real vive en
 * process-upload.ts, que NO tiene "use server" — no es invocable como
 * Server Action bajo ningún escenario, sin importar qué exporte.
 */
export async function uploadBindPdfsAction(
  _prev: UploadBindPdfsResult | null,
  formData: FormData,
): Promise<UploadBindPdfsResult> {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return { ok: false, error: denied.error, results: [] };

  const result = await processBindPdfUpload(formData);

  if (result.ok) {
    try { revalidatePath("/cuentas-inversion/importaciones/bind"); } catch { /* nunca tirar abajo un import ya exitoso por esto */ }
  }

  return result;
}

// ─── Lectura para preview (solo lectura, no escribe nada) ──────────────────────

export async function getBindImportBatch(batchId: string) {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return null;

  return prisma.bindTenenciasImportBatch.findUnique({
    where: { id: batchId },
    include: {
      Files: {
        orderBy: { createdAt: "desc" },
        include: { MatchedComitente: { select: { nombre: true, nroComitente: true } } },
      },
    },
  });
}

export async function getBindImportFileDetail(fileId: string) {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return null;

  const file = await prisma.bindTenenciasImportFile.findUnique({
    where: { id: fileId },
    include: { Rows: true, MatchedComitente: { select: { nombre: true, nroComitente: true } } },
  });
  if (!file) return null;

  const bySection = new Map<string, { sectionType: string; rows: typeof file.Rows; totalAmountARS: number }>();
  for (const row of file.Rows) {
    if (!bySection.has(row.sectionName)) bySection.set(row.sectionName, { sectionType: row.sectionType, rows: [], totalAmountARS: 0 });
    const bucket = bySection.get(row.sectionName)!;
    bucket.rows.push(row);
    bucket.totalAmountARS += row.totalAmountARS != null ? Number(row.totalAmountARS) : 0;
  }

  const unmappedTickers = file.Rows.filter((r) => r.requiresMapping).map((r) => ({ ticker: r.ticker, descripcion: r.descriptionClean }));
  const cauciones = file.Rows.filter((r) => r.sectionType === "CAUCION_ALERT");

  return {
    file,
    sections: Array.from(bySection.entries()).map(([name, data]) => ({ name, ...data })),
    unmappedTickers,
    cauciones,
  };
}

/** Cuentas/tickers pendientes de un lote, agrupados para la UI de resolución. Solo lectura. */
export async function getPendingBindMappings(batchId: string) {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return null;
  return getPendingBindMappingsImpl(batchId);
}

/** Selector de comitentes existentes — nunca crea uno nuevo. */
export async function getComitentesForSelect() {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return [];
  return prisma.comitenteInversion.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, nroComitente: true },
    orderBy: { nombre: "asc" },
  });
}

/** Selector de activos existentes — nunca crea uno nuevo. */
export async function getActivosForSelect() {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return [];
  return prisma.activo.findMany({
    select: { id: true, ticker: true, descripcion: true, categoria: true, monedaPrecio: true },
    orderBy: { ticker: "asc" },
  });
}

// ─── Resolución manual (Módulo 4.12E) ──────────────────────────────────────────

export async function resolveBindAccountAliasAction(
  _prev: ResolveResult | null,
  formData: FormData,
): Promise<ResolveResult> {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return { ok: false, error: denied.error };

  const accountNumber = formData.get("accountNumber")?.toString() ?? "";
  const comitenteId = formData.get("comitenteId")?.toString() ?? "";
  if (!accountNumber.trim() || !comitenteId.trim()) return { ok: false, error: "Seleccioná un comitente." };

  const result = await resolveBindAccountAlias(accountNumber, comitenteId);
  if (result.ok) {
    try { revalidatePath("/cuentas-inversion/importaciones/bind"); } catch { /* no bloquear por esto */ }
  }
  return result;
}

export async function resolveBindTickerAliasAction(
  _prev: ResolveResult | null,
  formData: FormData,
): Promise<ResolveResult> {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return { ok: false, error: denied.error };

  const ticker = formData.get("ticker")?.toString() ?? "";
  const brokerCodeRaw = formData.get("brokerCode")?.toString() ?? "";
  const activoId = formData.get("activoId")?.toString() ?? "";
  if (!ticker.trim() || !activoId.trim()) return { ok: false, error: "Seleccioná un activo." };

  const result = await resolveBindTickerAlias(ticker, brokerCodeRaw || null, activoId);
  if (result.ok) {
    try { revalidatePath("/cuentas-inversion/importaciones/bind"); } catch { /* no bloquear por esto */ }
  }
  return result;
}

export interface BulkResolveResult {
  ok: boolean;
  error?: string;
  results?: BulkTickerResolveItemResult[];
}

/** Vinculación masiva asistida (Módulo E2.2) — mismo permiso y misma lógica de compatibilidad que la individual, solo cambia el transporte (varios ítems en un POST). */
export async function resolveBindTickerAliasesBulkAction(
  _prev: BulkResolveResult | null,
  formData: FormData,
): Promise<BulkResolveResult> {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return { ok: false, error: denied.error };

  const raw = formData.get("selections")?.toString() ?? "";
  let selections: BulkTickerSelection[];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Selección vacía.");
    selections = parsed.map((item) => {
      const s = item as Record<string, unknown>;
      return {
        ticker: String(s.ticker ?? "").trim(),
        brokerCode: s.brokerCode ? String(s.brokerCode) : null,
        activoId: String(s.activoId ?? "").trim(),
      };
    });
    if (selections.some((s) => !s.ticker || !s.activoId)) throw new Error("Selección con datos incompletos.");
  } catch {
    return { ok: false, error: "Selección inválida — no se guardó nada." };
  }

  const results = await resolveBindTickerAliasesBulk(selections);
  if (results.some((r) => r.ok)) {
    try { revalidatePath("/cuentas-inversion/importaciones/bind"); } catch { /* no bloquear por esto */ }
  }

  return { ok: true, results };
}
