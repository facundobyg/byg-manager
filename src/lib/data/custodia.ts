import { prisma } from "@/lib/prisma";

export async function getCustodiaByClienteId(clienteId: string) {
  return prisma.custodiaCliente.findMany({
    where: { clienteId },
    include: {
      Activo: true,
    },
    orderBy: {
      Activo: {
        ticker: "asc",
      },
    },
  });
}

export async function getResumenCustodiaByClienteId(clienteId: string) {
  const posiciones = await getCustodiaByClienteId(clienteId);

  return posiciones.map((pos) => ({
    id: pos.id,
    activoNombre: pos.Activo.ticker, // Usamos ticker como nombre principal en resumen
    descripcion: pos.Activo.descripcion,
    ticker: pos.Activo.ticker,
    cantidad: pos.cantidadTotal,
    precioPromedio: pos.precioPromedio,
    valuación: pos.Activo.precioActual 
      ? pos.cantidadTotal.mul(pos.Activo.precioActual) 
      : null,
    moneda: pos.Activo.monedaPrecio,
  }));
}
