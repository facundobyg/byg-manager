import { prisma } from "@/lib/prisma";

export async function getClientesActivos() {
  return prisma.cliente.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });
}

export async function getCarteraPropia() {
  return prisma.posicionCartera.findMany({
    select: {
      id: true,
      cantidad: true,
      precioCompra: true,
      Activo: {
        select: {
          ticker: true,
          descripcion: true,
        },
      },
      Cartera: {
        select: {
          nombre: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCustodiaClientes() {
  return prisma.custodiaCliente.findMany({
    include: {
      Activo: true,
      Cliente: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
