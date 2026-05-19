import { prisma } from "@/lib/prisma";

export async function getCuentaCorrienteById(cuentaId: string) {
  return prisma.cuentaCorriente.findUnique({
    where: { id: cuentaId },
    include: {
      Cliente: true,
      MovimientoCC: {
        orderBy: { fecha: "desc" },
        take: 50,
      },
    },
  });
}
