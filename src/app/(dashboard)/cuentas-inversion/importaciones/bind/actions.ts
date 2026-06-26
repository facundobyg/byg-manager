"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionPermission } from "@/lib/auth/permissions";
import { processBindPdfUpload, type UploadBindPdfsResult } from "./process-upload";

export type { UploadResultRow, UploadBindPdfsResult } from "./process-upload";

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
