"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireActionPermission } from "@/lib/auth/permissions";
import { processBolsaExcelUpload, type ProcessBolsaResult } from "./process-upload";
import { processBolsaImageUpload } from "./process-upload-image";
import { parseFechaOperativa } from "./fecha-operativa";
import type { BolsaImageParseResult, BolsaImageMime } from "@/lib/importers/bolsa-image/types";

export type { ProcessBolsaResult } from "./process-upload";

const EMPTY: Omit<ProcessBolsaResult, "ok"> = {
  nombreArchivo: "",
  totalFilas: 0,
  filasResuelta: 0,
  filasConAdvertencia: 0,
  filasConError: 0,
};

/**
 * Único punto de entrada gateado para la UI — Excel.
 */
export async function importarBolsaExcelAction(
  _prev: ProcessBolsaResult | null,
  formData: FormData,
): Promise<ProcessBolsaResult> {
  const denied = await requireActionPermission("bolsa:crear");
  if (denied) return { ok: false, error: denied.error, ...EMPTY };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sesión no válida.", ...EMPTY };

  const result = await processBolsaExcelUpload(formData, session.user.id);

  if (result.ok) {
    try {
      revalidatePath("/bolsa");
    } catch {
      // no tirar el import por un revalidate fallido
    }
  }

  return result;
}

/**
 * Punto de entrada gateado para la UI — resultado OCR de una imagen.
 *
 * La imagen permanece en el navegador; el cliente envía únicamente el JSON
 * estructurado producido por el OCR local (ocr-bolsa.ts).
 *
 * FormData esperado:
 *   - "result"   : JSON de BolsaImageParseResult
 *   - "fileName" : nombre original del archivo
 *   - "fileSize" : tamaño en bytes (string)
 *   - "mimeType" : "image/jpeg" | "image/png"
 *   - "loteId"   : (opcional) ID del lote de la primera imagen de la tanda
 */
export async function importarBolsaImagenAction(
  formData: FormData,
): Promise<ProcessBolsaResult> {
  const denied = await requireActionPermission("bolsa:crear");
  if (denied) return { ok: false, error: denied.error, ...EMPTY };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sesión no válida.", ...EMPTY };

  const resultJson = formData.get("result");
  const fileName = formData.get("fileName");
  const fileSize = formData.get("fileSize");
  const mimeTypeRaw = formData.get("mimeType");
  const loteIdRaw = formData.get("loteId");

  if (typeof resultJson !== "string" || typeof fileName !== "string") {
    return { ok: false, error: "Datos de imagen inválidos.", ...EMPTY };
  }

  const fechaOperativa = parseFechaOperativa(formData.get("fechaOperativa"));
  if (!fechaOperativa) {
    return {
      ok: false,
      error: "La fecha de operaciones es obligatoria y debe tener formato válido (YYYY-MM-DD).",
      ...EMPTY,
    };
  }

  let parseResult: BolsaImageParseResult;
  try {
    parseResult = JSON.parse(resultJson) as BolsaImageParseResult;
  } catch {
    return { ok: false, error: "Formato de resultado OCR inválido.", ...EMPTY };
  }

  const mimeType: BolsaImageMime =
    mimeTypeRaw === "image/png" ? "image/png" : "image/jpeg";

  const existingLoteId =
    typeof loteIdRaw === "string" && loteIdRaw.length > 0 ? loteIdRaw : undefined;
  const reanalizar = formData.get("reanalizar") === "true";

  const result = await processBolsaImageUpload(
    {
      parseResult,
      fileName,
      fileSize: Number(fileSize) || 0,
      mimeType,
      fechaOperativa,
      reanalizar,
    },
    session.user.id,
    existingLoteId,
  );

  if (result.ok && result.estado === "REVISION_PENDIENTE") {
    try {
      revalidatePath("/bolsa");
    } catch {
      // no tirar el import por un revalidate fallido
    }
  }

  return result;
}
