import { prisma } from "@/lib/prisma";

export async function writeAuditLog({
  userId,
  accion,
  entidad,
  entidadId,
  description,
  metadata,
}: {
  userId?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  description?: string;
  /** Campos estructurados (p. ej. reason code de un rechazo). Nunca secretos. */
  metadata?: Record<string, string>;
}): Promise<void> {
  try {
    const datosNuevos = description || metadata ? { ...(metadata ?? {}), ...(description ? { description } : {}) } : undefined;
    await prisma.auditLog.create({
      data: {
        id:        crypto.randomUUID(),
        userId:    userId ?? null,
        accion,
        entidad,
        entidadId: entidadId ?? null,
        datosNuevos,
      },
    });
  } catch (e) {
    // audit failure must never break the main flow — pero queda reportado server-side
    // (solo acción/entidad y el mensaje del error; nunca el payload).
    console.error("[audit] no se pudo escribir AuditLog", { accion, entidad, error: e instanceof Error ? e.message : "desconocido" });
  }
}
