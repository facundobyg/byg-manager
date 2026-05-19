import { prisma } from "@/lib/prisma";

export async function getPlazoFijoById(pfId: string) {
  try {
    return await prisma.plazoFijo.findUnique({
      where: { id: pfId },
      include: {
        Cliente: true,
        PlazoFijoMovimiento: { orderBy: { fecha: "asc" } },
      },
    });
  } catch {
    // Fallback if query engine doesn't know PlazoFijoMovimiento yet (pending regenerate)
    const pf = await prisma.plazoFijo.findUnique({
      where: { id: pfId },
      include: { Cliente: true },
    });
    if (!pf) return null;
    return { ...pf, PlazoFijoMovimiento: [] as never[] };
  }
}

export async function getVencimientosPF() {
  return prisma.plazoFijo.findMany({
    where: { estado: "ACTIVO" },
    include: {
      Cliente: { select: { id: true, nombre: true } },
    },
    orderBy: { fechaVencimiento: "asc" },
  });
}
