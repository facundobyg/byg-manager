import "server-only";

import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { CUENTAS_OPERATIVAS_ACTUALES } from "@/lib/constants/cuentas-operativas";

export interface DivInteresRow {
  id: string;
  fecha: Date;
  cuenta: string;
  ticker: string;
  descripcion: string;
  usd: number;
  ars: number;
}

export async function getDivIntereses(filters?: { mes?: string; cuenta?: string }): Promise<DivInteresRow[]> {
  const where: any = {};
  if (filters?.mes) where.mesContable = filters.mes;

  const ops = await prisma.operacionDivInt.findMany({
    where,
    orderBy: { fecha: "desc" },
  });

  const rows: DivInteresRow[] = ops.map((op) => {
    const detalles = op.detalles as any;
    return {
      id: op.id,
      fecha: op.fecha,
      cuenta: detalles.cuenta || "—",
      ticker: op.ticker || "—",
      descripcion: op.descripcion || "—",
      usd: Number(detalles.usd || 0),
      ars: Number(detalles.ars || 0),
    };
  });

  if (filters?.cuenta && filters.cuenta !== "Todas") {
    return rows.filter((r) => r.cuenta === filters.cuenta);
  }

  return rows;
}

export async function getTotalesDivIntereses(mes: string) {
  const rows = await getDivIntereses({ mes });
  const config = await prisma.config.findUnique({ where: { clave: "tc_blue" } });
  const tcBlue = new Decimal(config?.valor || "1000");

  const totals = rows.reduce(
    (acc, r) => {
      acc.usd += r.usd;
      acc.ars += r.ars;
      return acc;
    },
    { usd: 0, ars: 0 }
  );

  const arsEnUSD = new Decimal(totals.ars).div(tcBlue).toNumber();

  return {
    ...totals,
    totalEquivalenteUSD: totals.usd + arsEnUSD,
    tcBlue: tcBlue.toNumber()
  };
}
