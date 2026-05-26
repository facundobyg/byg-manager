import { prisma } from "@/lib/prisma";

export async function getClienteById(id: string) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      CuentaCorriente: {
        orderBy: { moneda: "asc" },
      },
      PlazoFijo: {
        orderBy: { fechaVencimiento: "asc" },
      },
      CustodiaCliente: {
        include: { Activo: true },
      },
    },
  });

  if (!cliente) return null;

  const [operaciones, transferencias] = await Promise.all([
    prisma.operacionCambio.findMany({
      where: {
        OR: [
          { clienteId: cliente.id },
          { clienteNombre: { equals: cliente.nombre, mode: "insensitive" } },
        ],
      },
      orderBy: { fecha: "desc" },
      take: 50,
    }),
    prisma.transferenciaActivo.findMany({
      where: { clienteDestinoId: id },
      include: {
        Activo: { select: { ticker: true, descripcion: true } },
        Cartera: { select: { nombre: true } },
        User: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pfCapitalMap: Record<string, number> = {};
  try {
    const pfIds = cliente.PlazoFijo.map((pf) => pf.id);
    if (pfIds.length > 0) {
      const moves = await prisma.plazoFijoMovimiento.findMany({
        where: { plazoFijoId: { in: pfIds }, tipo: { in: ["APERTURA", "CIERRE_RENOV"] } },
        orderBy: [{ plazoFijoId: "asc" }, { fecha: "desc" }],
        select: { plazoFijoId: true, monto: true },
      });
      for (const m of moves) {
        if (!(m.plazoFijoId in pfCapitalMap)) {
          pfCapitalMap[m.plazoFijoId] = Number(m.monto.toString());
        }
      }
    }
  } catch {
    // stale binary fallback — pages use pf.capital
  }

  return { ...cliente, operaciones, pfCapitalMap, transferencias };
}
