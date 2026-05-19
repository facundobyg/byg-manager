import { prisma } from "@/lib/prisma";

export async function getPlazosFijosVencimientos() {
  return prisma.plazoFijo.findMany({
    where: { estado: { in: ["ACTIVO", "VENCIDO"] } },
    orderBy: { fechaVencimiento: "asc" },
    include: { Cliente: true },
  });
}
