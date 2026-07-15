"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireActionPermission } from "@/lib/auth/permissions";
import { processBolsaExcelUpload, type ProcessBolsaResult } from "./process-upload";
import { processBolsaImageUpload } from "./process-upload-image";

export type { ProcessBolsaResult } from "./process-upload";

/**
 * Único punto de entrada gateado para la UI — Excel.
 * La lógica real vive en process-upload.ts, que NO tiene "use server".
 */
export async function importarBolsaExcelAction(
  _prev: ProcessBolsaResult | null,
  formData: FormData,
): Promise<ProcessBolsaResult> {
  const denied = await requireActionPermission("bolsa:crear");
  if (denied) {
    return {
      ok: false,
      error: denied.error,
      nombreArchivo: "",
      totalFilas: 0,
      filasResuelta: 0,
      filasConAdvertencia: 0,
      filasConError: 0,
    };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      error: "Sesión no válida.",
      nombreArchivo: "",
      totalFilas: 0,
      filasResuelta: 0,
      filasConAdvertencia: 0,
      filasConError: 0,
    };
  }

  const result = await processBolsaExcelUpload(formData, session.user.id);

  if (result.ok) {
    try {
      revalidatePath("/bolsa");
    } catch {
      // nunca tirar abajo un import ya exitoso por un revalidate fallido
    }
  }

  return result;
}

/**
 * Punto de entrada gateado para la UI — una imagen por request.
 * La UI llama esto secuencialmente para cada imagen seleccionada.
 * El formData incluye:
 *   - "file": la imagen ya comprimida por el cliente
 *   - "loteId" (opcional): ID del lote creado en la primera request de la tanda
 *
 * ANTHROPIC_API_KEY es server-only — nunca se expone al cliente.
 */
export async function importarBolsaImagenAction(
  formData: FormData,
): Promise<ProcessBolsaResult> {
  const denied = await requireActionPermission("bolsa:crear");
  if (denied) {
    return {
      ok: false,
      error: denied.error,
      nombreArchivo: "",
      totalFilas: 0,
      filasResuelta: 0,
      filasConAdvertencia: 0,
      filasConError: 0,
    };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      error: "Sesión no válida.",
      nombreArchivo: "",
      totalFilas: 0,
      filasResuelta: 0,
      filasConAdvertencia: 0,
      filasConError: 0,
    };
  }

  const loteId = formData.get("loteId");
  const existingLoteId =
    typeof loteId === "string" && loteId.length > 0 ? loteId : undefined;

  const result = await processBolsaImageUpload(
    formData,
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
