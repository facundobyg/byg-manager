import { prisma } from "@/lib/prisma";

export async function getTransferenciasActivos() {
  const [logs, reversiones] = await Promise.all([
    prisma.auditLog.findMany({
      where: { accion: "TRANSFERENCIA_ACTIVO" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: { accion: "TRANSFERENCIA_ACTIVO_REVERTIDA" },
      select: { datosNuevos: true },
    }),
  ]);

  const revertidaIds = new Set(
    reversiones
      .map((r) => (r.datosNuevos as { logOriginalId?: string } | null)?.logOriginalId)
      .filter((id): id is string => !!id)
  );

  const clienteIds = Array.from(new Set(
    logs.map((l) => (l.datosNuevos as { clienteId?: string } | null)?.clienteId).filter((id): id is string => !!id)
  ));
  const activoIds = Array.from(new Set(
    logs.map((l) => (l.datosNuevos as { activoId?: string } | null)?.activoId).filter((id): id is string => !!id)
  ));

  const [clientes, activos] = await Promise.all([
    prisma.cliente.findMany({ where: { id: { in: clienteIds } }, select: { id: true, nombre: true } }),
    prisma.activo.findMany({ where: { id: { in: activoIds } }, select: { id: true, ticker: true } }),
  ]);

  const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]));
  const activoMap  = new Map(activos.map((a) => [a.id, a.ticker]));

  return logs.map((log) => {
    const datos = (log.datosNuevos ?? {}) as {
      clienteId?: string;
      activoId?: string;
      cantidad?: string;
      descripcion?: string;
    };
    const clienteId = datos.clienteId ?? null;
    const activoId  = datos.activoId  ?? null;
    return {
      id: log.id,
      fecha: log.createdAt,
      clienteNombre: clienteId ? (clienteMap.get(clienteId) ?? clienteId) : null,
      activoTicker:  activoId  ? (activoMap.get(activoId)   ?? activoId)  : null,
      cantidad: datos.cantidad ?? null,
      descripcion: datos.descripcion ?? null,
      revertida: revertidaIds.has(log.id),
    };
  });
}

export type TransferenciaActivoRow = Awaited<ReturnType<typeof getTransferenciasActivos>>[number];
