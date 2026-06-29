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

  const cajaIds = cajas.map((c) => c.id);

  // Una sola query agregada (en vez de un findMany de movimientos por caja)
  // para eliminar el N+1: agrupa por caja+moneda+tipo y suma montos en DB.
  const grouped = cajaIds.length > 0
    ? await prisma.movimientoCaja.groupBy({
        by: ["cajaId", "moneda", "tipo"],
        where: { cajaId: { in: cajaIds }, confirmado: true },
        _sum: { monto: true },
      })
    : [];

  const deltasPorCaja = new Map<string, { USD: Decimal; ARS: Decimal }>();
  for (const g of grouped) {
    const monto = g._sum.monto ? new Decimal(g._sum.monto.toString()) : new Decimal(0);
    const esEntrada = g.tipo === "ENTRADA" || g.tipo === "TRANSFERENCIA_IN";
    const bucket = deltasPorCaja.get(g.cajaId) ?? { USD: new Decimal(0), ARS: new Decimal(0) };
    if (g.moneda === "USD") {
      bucket.USD = esEntrada ? bucket.USD.add(monto) : bucket.USD.sub(monto);
    } else if (g.moneda === "ARS") {
      bucket.ARS = esEntrada ? bucket.ARS.add(monto) : bucket.ARS.sub(monto);
    }
    deltasPorCaja.set(g.cajaId, bucket);
  }

  return cajas.map((caja) => {
    const delta = deltasPorCaja.get(caja.id) ?? { USD: new Decimal(0), ARS: new Decimal(0) };
    return {
      id: caja.id,
      slug: caja.slug,
      label: caja.label,
      tipo: caja.tipo,
      esPrincipal: caja.esPrincipal,
      saldoInicialUSD: caja.saldoInicialUSD,
      saldoInicialARS: caja.saldoInicialARS,
      saldoActualUSD: new Decimal(caja.saldoInicialUSD).add(delta.USD),
      saldoActualARS: new Decimal(caja.saldoInicialARS).add(delta.ARS),
      totalMovimientos: caja._count.MovimientoCaja
    };
  });
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
