import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { saldoReconstruido } from "@/lib/cc/integridad";

/** Saldo de la CC reconstruido desde sus movimientos (definición canónica en lib/cc/integridad). */
export async function recalculateCuentaCorriente(cuentaId: string): Promise<Decimal> {
  const movimientos = await prisma.movimientoCC.findMany({
    where: { cuentaCorrienteId: cuentaId },
    select: { tipo: true, monto: true },
  });
  return saldoReconstruido(movimientos);
}
