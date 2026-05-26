"use server";

import { writeAuditLog } from "@/lib/services/audit.service";
import { auth } from "@/auth";

export async function logIdleTimeout(): Promise<void> {
  const session = await auth() as { user?: { id?: string; email?: string } } | null;
  await writeAuditLog({
    accion:      "SESSION_IDLE_TIMEOUT",
    entidad:     "Auth",
    userId:      session?.user?.id,
    description: `Sesión cerrada por inactividad: ${session?.user?.email ?? "desconocido"}`,
  }).catch(() => {});
}
