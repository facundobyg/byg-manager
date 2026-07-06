"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionPermission } from "@/lib/auth/permissions";
import { auth } from "@/auth";
import {
  processBindPdfUpload,
  resolveBindAccountAlias,
  resolveBindTickerAlias,
  resolveBindTickerAliasesBulk,
  reprocessBindFileMappings,
  getPendingBindMappings as getPendingBindMappingsImpl,
  type UploadBindPdfsResult,
  type ResolveResult,
  type BulkTickerSelection,
  type BulkTickerResolveItemResult,
  type ReprocessResult,
} from "./process-upload";
import {
  confirmBindFileImport,
  type ConfirmBindFileResult,
} from "./confirm-import";

export type {
  UploadResultRow, UploadBindPdfsResult, ResolveResult, PendingAccountMapping, PendingTickerMapping,
  BulkTickerSelection, BulkTickerResolveItemResult, ReprocessResult,
} from "./process-upload";
export type { ConfirmBindFileResult, QuantityDiscrepancy } from "./confirm-import";

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

/**
 * Reintenta el matching de las rows pendientes de un archivo ya parseado,
 * contra el catálogo/aliases actuales — sin volver a subir el PDF (Módulo
 * E2.5-BUG1). Útil después de cargar Activos nuevos al catálogo.
 */
export async function reprocessBindFileMappingsAction(
  _prev: ReprocessResult | null,
  formData: FormData,
): Promise<ReprocessResult> {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return { ok: false, error: denied.error };

  const fileId = formData.get("fileId")?.toString().trim() ?? "";
  if (!fileId) return { ok: false, error: "Falta el ID del archivo." };

  const result = await reprocessBindFileMappings(fileId);
  if (result.ok) {
    try { revalidatePath("/cuentas-inversion/importaciones/bind"); } catch { /* no bloquear por esto */ }
  }
  return result;
}

/**
 * Confirmación real de un archivo de import Bind a holdings definitivos (Módulo E3.2).
 * Escribe en HoldingComitenteInversion y SaldoComitenteInversion.
 * NO conectado a botón UI todavía — se conecta en E3.3.
 */
export async function confirmBindFileImportAction(
  _prev: ConfirmBindFileResult | null,
  formData: FormData,
): Promise<ConfirmBindFileResult> {
  const EMPTY: ConfirmBindFileResult = {
    ok: false, created: [], updated: [], skipped: [], warnings: [], quantityDiscrepancies: [], cashUpdated: false,
  };

  const denied = await requireActionPermission("holdings:editar");
  if (denied) return { ...EMPTY, error: denied.error };

  const fileId = formData.get("fileId")?.toString().trim() ?? "";
  if (!fileId) return { ...EMPTY, error: "Falta el ID del archivo." };

  const session  = await auth();
  const userId   = (session?.user?.id as string | undefined) ?? null;

  const result = await confirmBindFileImport(fileId, userId);

  if (result.ok) {
    try { revalidatePath("/cuentas-inversion/importaciones/bind"); } catch { /* no bloquear */ }
    try { revalidatePath("/cuentas-inversion", "layout"); } catch { /* no bloquear */ }
  }

  return result;
}

// ── Preflight: resumen de lo que haría la confirmación (read-only, no toca DB) ──

export type BindFileConfirmPreview = {
  fileId: string;
  fileName: string;
  comitente: string;
  nroComitente: string;
  cuentaBind: string | null;
  reportDate: string | null;
  totalAmountARS: number;
  toCreate: string[];
  toUpdate: string[];
  cashARS: number;
  cashMEP: number;
  cashCable: number;
};

export async function getBindFileConfirmPreview(fileId: string): Promise<BindFileConfirmPreview | null> {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return null;

  const file = await prisma.bindTenenciasImportFile.findUnique({
    where: { id: fileId },
    include: {
      MatchedComitente: { select: { id: true, nombre: true, nroComitente: true } },
      Rows: {
        include: { MatchedActivo: { select: { id: true, ticker: true } } },
      },
    },
  });

  if (!file || !file.MatchedComitente || file.status !== "READY") return null;

  const CASH_TYPES = new Set(["CASH_ARS", "CASH_USD_MEP", "CASH_USD_CABLE"]);
  const cashRows    = file.Rows.filter((r) => CASH_TYPES.has(r.sectionType));
  const holdingRows = file.Rows.filter(
    (r) => !CASH_TYPES.has(r.sectionType) && r.sectionType !== "CAUCION_ALERT" && r.MatchedActivo,
  );

  const toCreate: string[] = [];
  const toUpdate: string[] = [];
  for (const row of holdingRows) {
    const ticker = row.MatchedActivo!.ticker;
    const existing = await prisma.holdingComitenteInversion.findUnique({
      where: { comitenteId_ticker: { comitenteId: file.MatchedComitente.id, ticker } },
      select: { id: true },
    });
    if (existing) toUpdate.push(ticker);
    else toCreate.push(ticker);
  }

  // cashARS: saldo ARS del PDF (totalAmountARS).
  // cashMEP / cashCable: USD nominal real (saldoVencidoQuantity) — NO totalAmountARS que es ARS equivalente.
  const cashARS   = cashRows.find((r) => r.sectionType === "CASH_ARS")?.totalAmountARS;
  const cashMEP   = cashRows.find((r) => r.sectionType === "CASH_USD_MEP")?.saldoVencidoQuantity;
  const cashCable = cashRows.find((r) => r.sectionType === "CASH_USD_CABLE")?.saldoVencidoQuantity;

  return {
    fileId:         file.id,
    fileName:       file.fileName,
    comitente:      file.MatchedComitente.nombre,
    nroComitente:   file.MatchedComitente.nroComitente,
    cuentaBind:     file.accountNumber ?? null,
    reportDate:     file.reportDate ? file.reportDate.toISOString().split("T")[0] : null,
    totalAmountARS: file.totalAmountARS ? Number(file.totalAmountARS) : 0,
    toCreate,
    toUpdate,
    cashARS:   cashARS   ? Number(cashARS)   : 0,
    cashMEP:   cashMEP   ? Number(cashMEP)   : 0,
    cashCable: cashCable ? Number(cashCable) : 0,
  };
}
