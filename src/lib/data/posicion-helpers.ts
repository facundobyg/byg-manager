import { Decimal } from "@prisma/client/runtime/library";

/**
 * Returns the available quantity for operations on a cartera position.
 *
 * PosicionCartera.cantidad is ALREADY the "disponible" amount:
 * every call to asignarACustodia or a VENTA concertación reduces this field
 * atomically inside a transaction. Custody is tracked separately in
 * CustodiaCliente + TransferenciaActivo.
 *
 * Rule: never allow an operation that would make this value go below zero.
 */
export function getDisponiblePosicion(cantidad: Decimal | number): number {
  return Number(cantidad);
}

/**
 * Returns true if a requested operation quantity exceeds available stock.
 */
export function exceedsDisponible(
  cantidadSolicitada: Decimal | number,
  cantidadDisponible: Decimal | number,
): boolean {
  return Number(cantidadSolicitada) > Number(cantidadDisponible);
}

/**
 * Formats a stock-insufficient error message for user display.
 */
export function stockInsuficienteError(
  ticker: string,
  disponible: Decimal | number,
  solicitado: Decimal | number,
): string {
  const d = Number(disponible);
  const s = Number(solicitado);
  return `Stock insuficiente para ${ticker}. Disponible: ${d.toLocaleString("es-AR", { maximumFractionDigits: 6 })}, solicitado: ${s.toLocaleString("es-AR", { maximumFractionDigits: 6 })}.`;
}
