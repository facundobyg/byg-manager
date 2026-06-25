import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { TipoCaja } from "@prisma/client";

export interface CajaEnriquecida {
  id: string;
  slug: string;
  label: string;
  tipo: TipoCaja;
  esPrincipal: boolean;
  saldoInicialUSD: Decimal;
  saldoInicialARS: Decimal;
  saldoActualUSD: Decimal;
  saldoActualARS: Decimal;
  totalMovimientos: number;
}

export async function getCajasWithBalances(): Promise<CajaEnriquecida[]> {
  const cajas = await prisma.caja.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
    include: {
      _count: {
        select: { MovimientoCaja: true }
      }
    }
  });

  const cajasConSaldos = await Promise.all(
    cajas.map(async (caja) => {
      const movs = await prisma.movimientoCaja.findMany({
        where: { cajaId: caja.id, confirmado: true },
        select: { tipo: true, moneda: true, monto: true },
      });

      let saldoUSD = new Decimal(caja.saldoInicialUSD);
      let saldoARS = new Decimal(caja.saldoInicialARS);

      for (const m of movs) {
        const monto    = new Decimal(m.monto.toString());
        const esEntrada = m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN";
        if (m.moneda === "USD") {
          saldoUSD = esEntrada ? saldoUSD.add(monto) : saldoUSD.sub(monto);
        } else if (m.moneda === "ARS") {
          saldoARS = esEntrada ? saldoARS.add(monto) : saldoARS.sub(monto);
        }
      }

      return {
        id: caja.id,
        slug: caja.slug,
        label: caja.label,
        tipo: caja.tipo,
        esPrincipal: caja.esPrincipal,
        saldoInicialUSD: caja.saldoInicialUSD,
        saldoInicialARS: caja.saldoInicialARS,
        saldoActualUSD: saldoUSD,
        saldoActualARS: saldoARS,
        totalMovimientos: caja._count.MovimientoCaja
      };
    })
  );

  return cajasConSaldos;
}

export interface PendingPrincipalSummary {
  count: number;
  totalUSD: number;
  totalARS: number;
}

export async function getPendingPrincipalSummary(): Promise<PendingPrincipalSummary> {
  const principal = await prisma.caja.findFirst({ where: { esPrincipal: true }, select: { id: true } });
  if (!principal) return { count: 0, totalUSD: 0, totalARS: 0 };

  const rows = await prisma.movimientoCaja.groupBy({
    by: ["moneda"],
    where: { cajaId: principal.id, confirmado: false, anulado: false },
    _sum: { monto: true },
    _count: { id: true },
  });

  let count = 0;
  let totalUSD = 0;
  let totalARS = 0;

  for (const r of rows) {
    count += r._count.id;
    const monto = Number(r._sum.monto ?? 0);
    if (r.moneda === "USD") totalUSD += monto;
    else if (r.moneda === "ARS") totalARS += monto;
  }

  return { count, totalUSD, totalARS };
}
