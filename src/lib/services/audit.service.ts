import { prisma } from "@/lib/prisma";

export async function writeAuditLog({
  userId,
  accion,
  entidad,
  entidadId,
  description,
}: {
  userId?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  description?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        id:        crypto.randomUUID(),
        userId:    userId ?? null,
        accion,
        entidad,
        entidadId: entidadId ?? null,
        datosNuevos: description ? { description } : undefined,
      },
    });
  } catch {
    // audit failure must never break the main flow
  }
}
