"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireActionPermission } from "@/lib/auth/permissions";
import { processBolsaExcelUpload, type ProcessBolsaResult } from "./process-upload";

export type { ProcessBolsaResult } from "./process-upload";

/**
 * Único punto de entrada gateado para la UI. La lógica real vive en
 * process-upload.ts, que NO tiene "use server" — no es invocable como
 * Server Action bajo ningún escenario, sin importar qué exporte.
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
