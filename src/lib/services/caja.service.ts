import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Acepta tanto prisma como un tx de transacción interactiva.
export async function calcularSaldoCajaConCliente(
  db: Prisma.TransactionClient,
  cajaId: string,
  moneda: "USD" | "ARS"
): Promise<Decimal> {
  if (!cajaId || cajaId.trim() === "") return new Decimal(0);

  const caja = await db.caja.findUnique({ where: { id: cajaId } });
  if (!caja) return new Decimal(0);

  // Agrupamos manualmente para evitar errores de runtime con groupBy en campos Enum en algunas versiones/entornos
  const movimientosRaw = await db.movimientoCaja.findMany({
    where: { cajaId, moneda, confirmado: true },
    select: { tipo: true, monto: true },
  });

  const totals = movimientosRaw.reduce((acc, m) => {
    acc[m.tipo] = (acc[m.tipo] || new Decimal(0)).add(m.monto);
    return acc;
  }, {} as Record<string, Decimal>);

  let saldo = new Decimal(moneda === "USD" ? caja.saldoInicialUSD : caja.saldoInicialARS);

  Object.entries(totals).forEach(([tipo, monto]) => {
    const esEntrada = tipo === "ENTRADA" || tipo === "TRANSFERENCIA_IN";
    if (esEntrada) {
      saldo = saldo.add(monto);
    } else {
      saldo = saldo.sub(monto);
    }
  });

  return saldo;
}

// Wrapper que usa prisma directamente — mantiene compatibilidad con todos los imports existentes.
export async function calcularSaldoCaja(
  cajaId: string,
  moneda: "USD" | "ARS"
): Promise<Decimal> {
  return calcularSaldoCajaConCliente(prisma, cajaId, moneda);
}
