import { prisma } from "@/lib/prisma";

export async function getClientes() {
  return prisma.cliente.findMany({
    where: { activo: true },
    orderBy: { createdAt: "desc" },
    include: {
      CuentaCorriente: {
        include: {
          MovimientoCC: true,
        },
      },
      PlazoFijo: true,
      CustodiaCliente: { include: { Activo: true } },
    },
  });
}

export async function getClientesAll() {
  return prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: {
        select: {
          CuentaCorriente: true,
          PlazoFijo:       true,
          OperacionCambio: true,
          CustodiaCliente: true,
        },
      },
    },
  });
}
