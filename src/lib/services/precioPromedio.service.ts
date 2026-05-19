import { Decimal } from "@prisma/client/runtime/library";

export function calcularPrecioPromedio({
  cantidadActual,
  precioActual,
  cantidadNueva,
  precioNuevo,
}: {
  cantidadActual: Decimal;
  precioActual: Decimal;
  cantidadNueva: Decimal;
  precioNuevo: Decimal;
}) {
  const totalActual = cantidadActual.mul(precioActual);
  const totalNuevo = cantidadNueva.mul(precioNuevo);
  const cantidadTotal = cantidadActual.plus(cantidadNueva);

  if (cantidadTotal.equals(0)) return new Decimal(0);

  return totalActual.plus(totalNuevo).div(cantidadTotal);
}
