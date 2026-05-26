import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function recalculateCuentaCorriente(cuentaId: string): Promise<Decimal> {
  const movimientos = await prisma.movimientoCC.findMany({
    where: { cuentaCorrienteId: cuentaId },
    select: { tipo: true, monto: true },
  });

  let saldo = new Decimal(0);
  for (const m of movimientos) {
    if (m.tipo === "INGRESO" || m.tipo === "INTERES") {
      saldo = saldo.plus(m.monto);
    } else if (m.tipo === "EGRESO") {
      saldo = saldo.minus(m.monto);
    }
    // AJUSTE: add directly (positive adjustment)
  }
  return saldo;
}
