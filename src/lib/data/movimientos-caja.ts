import { prisma } from "@/lib/prisma";
import { TipoMovCaja, Moneda } from "@prisma/client";

export interface MovimientoCajaLedgerRow {
  id: string;
  fecha: Date;
  cajaLabel: string;
  tipo: TipoMovCaja;
  moneda: Moneda;
  monto: string;
  descripcion: string | null;
  transferenciaRef: string | null;
  confirmado: boolean;
  createdAt: Date;
}

export async function getMovimientosCaja({
  cajaId,
  desde,
  hasta,
  tipo,
}: {
  cajaId?: string;
  desde?: Date;
  hasta?: Date;
  tipo?: TipoMovCaja;
} = {}): Promise<MovimientoCajaLedgerRow[]> {
  const rows = await prisma.movimientoCaja.findMany({
    where: {
      ...(cajaId ? { cajaId } : {}),
      ...(tipo ? { tipo } : {}),
      ...(desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: desde } : {}),
              ...(hasta ? { lte: hasta } : {}),
            },
          }
        : {}),
    },
    include: { Caja: { select: { label: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows.map((r) => ({
    id: r.id,
    fecha: r.fecha,
    cajaLabel: r.Caja.label,
    tipo: r.tipo,
    moneda: r.moneda,
    monto: r.monto.toString(),
    descripcion: r.descripcion,
    transferenciaRef: r.transferenciaRef,
    confirmado: r.confirmado,
    createdAt: r.createdAt,
  }));
}
