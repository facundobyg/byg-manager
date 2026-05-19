import "server-only";

import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { TipoOperacionLP } from "@prisma/client";
import { CUENTAS_OPERATIVAS_ACTUALES } from "@/lib/constants/cuentas-operativas";

export interface LargoPlazoRow {
  id: string;
  fecha: Date;
  cuenta: string;
  ticker: string;
  tipo: TipoOperacionLP;
  cantidad: number;
  precio: number;
  totalUSD: number;
  ars: number;
  notas: string;
}

export async function getLargoPlazo(filters?: { mes?: string; cuenta?: string }): Promise<LargoPlazoRow[]> {
  const where: any = {};
  if (filters?.mes) where.mesContable = filters.mes;

  const ops = await prisma.operacionLargoPlazo.findMany({
    where,
    orderBy: { fecha: "desc" },
  });

  const rows: LargoPlazoRow[] = ops.map((op) => {
    const detalles = op.detalles as any;
    return {
      id: op.id,
      fecha: op.fecha,
      cuenta: detalles.cuenta || "—",
      ticker: op.ticker || "—",
      tipo: op.tipo,
      cantidad: Number(detalles.cantidad || 0),
      precio: Number(detalles.precio || 0),
      totalUSD: Number(detalles.totalUSD || 0),
      ars: Number(detalles.ars || 0),
      notas: op.descripcion || "—",
    };
  });

  if (filters?.cuenta && filters.cuenta !== "Todas") {
    return rows.filter((r) => r.cuenta === filters.cuenta);
  }

  return rows;
}
