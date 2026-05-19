import "server-only";

import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { CUENTAS_OPERATIVAS_ACTUALES } from "@/lib/constants/cuentas-operativas";

export interface RuloBolsaRow {
  id: string;
  fecha: Date;
  cuenta: string;
  descripcion: string;
  usd: number;
  ars: number;
  notas: string;
}

export async function getRulosBolsa(filters?: { mes?: string; cuenta?: string }): Promise<RuloBolsaRow[]> {
  const where: any = {};
  if (filters?.mes) where.mesContable = filters.mes;
  // Note: Since 'cuenta' is inside JSON 'detalles', filtering by cuenta in DB depends on Prisma version/DB support.
  // We'll filter in memory for now if needed, or just fetch all for the month.

  const ops = await prisma.operacionRulo.findMany({
    where,
    orderBy: { fecha: "desc" },
  });

  const rows: RuloBolsaRow[] = ops.map((op) => {
    const detalles = op.detalles as any;
    return {
      id: op.id,
      fecha: op.fecha,
      cuenta: detalles.cuenta || "—",
      descripcion: op.descripcion || "—",
      usd: Number(detalles.usd || 0),
      ars: Number(detalles.ars || 0),
      notas: op.notas || "—",
    };
  });

  if (filters?.cuenta && filters.cuenta !== "Todas") {
    return rows.filter((r) => r.cuenta === filters.cuenta);
  }

  return rows;
}

export async function getTotalesRulos(mes: string) {
  const rows = await getRulosBolsa({ mes });
  return rows.reduce(
    (acc, r) => {
      acc.usd += r.usd;
      acc.ars += r.ars;
      return acc;
    },
    { usd: 0, ars: 0 }
  );
}
