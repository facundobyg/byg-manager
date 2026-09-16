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

/**
 * Universo de PF que cuentan como inversión operativa vigente: /plazos-fijos
 * (listado y totales) e /intereses (cálculo de interés) solo deben considerar
 * PF ACTIVO — un PF CANCELADO (p. ej. por revertirOperacion, OPS-02), VENCIDO
 * o RENOVADO no debe seguir sumando capital ni devengando interés ahí. No
 * borra ni oculta el registro de la base, solo lo excluye de estos dos
 * listados operativos.
 */
export function soloPFActivos<T extends { estado: string }>(plazosFijos: T[]): T[] {
  return plazosFijos.filter((pf) => pf.estado === "ACTIVO");
}
