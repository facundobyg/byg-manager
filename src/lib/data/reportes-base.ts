import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Datos crudos compartidos entre getExposicionPorMoneda, getBalanceGeneral y
// getAperturaMoneda (consumidos juntos en /reportes). cache() dedupea estas
// queries dentro del mismo request — sin esto, las 3 funciones las corrían
// cada una por su cuenta. No persiste entre requests, así que no hay riesgo
// de servir datos viejos en la próxima carga de página.
export const getReportesBaseData = cache(async () => {
  const [movCaja, cuentasCorrientes, plazosFijos, posicionesCartera, posicionesCustodia] = await Promise.all([
    prisma.movimientoCaja.findMany({
      where: { confirmado: true },
      select: { moneda: true, tipo: true, monto: true },
    }),
    prisma.cuentaCorriente.findMany({
      select: { moneda: true, saldo: true },
    }),
    prisma.plazoFijo.findMany({
      where: { estado: "ACTIVO" },
      select: { moneda: true, capital: true },
    }),
    prisma.posicionCartera.findMany({
      select: {
        cantidad: true,
        precioCompra: true,
        Activo: {
          select: {
            precioActual: true,
            monedaPrecio: true,
          },
        },
      },
    }),
    prisma.custodiaCliente.findMany({
      select: {
        cantidadTotal: true,
        precioPromedio: true,
        Activo: {
          select: {
            precioActual: true,
            monedaPrecio: true,
          },
        },
      },
    }),
  ]);

  return { movCaja, cuentasCorrientes, plazosFijos, posicionesCartera, posicionesCustodia };
});
