import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { Moneda, TipoMovCaja } from "@prisma/client";

export type EstadoPendienteVisual = "PENDIENTE" | "PARCIAL" | "PAGADO" | "ANULADO";

export interface MovimientoPendienteRow {
  id: string;
  cajaId: string;
  cajaLabel: string;
  fecha: Date;
  tipo: TipoMovCaja;
  moneda: Moneda;
  descripcion: string | null;
  montoTotal: number;
  montoCubierto: number;
  montoPendiente: number;
  estadoVisual: EstadoPendienteVisual;
  anulado: boolean;
}

/**
 * Pendientes (MovimientoCaja confirmado:false) con su cobertura real,
 * calculada vía pagoDeId — sin depender de descripcion/regex.
 */
export async function getMovimientosPendientesConCobertura(): Promise<MovimientoPendienteRow[]> {
  const pendientes = await prisma.movimientoCaja.findMany({
    where: { confirmado: false },
    orderBy: { fecha: "asc" },
    include: { Caja: { select: { label: true } } },
  });
  if (pendientes.length === 0) return [];

  const ids = pendientes.map((p) => p.id);
  const pagos = await prisma.movimientoCaja.groupBy({
    by: ["pagoDeId"],
    where: { pagoDeId: { in: ids }, confirmado: true, anulado: false },
    _sum: { monto: true },
  });

  const cubiertoMap = new Map<string, Decimal>();
  for (const p of pagos) {
    if (p.pagoDeId) cubiertoMap.set(p.pagoDeId, new Decimal(p._sum.monto?.toString() ?? "0"));
  }

  return pendientes.map((m) => {
    const montoTotal = new Decimal(m.monto.toString());
    const montoCubierto = cubiertoMap.get(m.id) ?? new Decimal(0);
    const montoPendienteDec = Decimal.max(montoTotal.minus(montoCubierto), new Decimal(0));

    let estadoVisual: EstadoPendienteVisual;
    if (m.anulado) estadoVisual = "ANULADO";
    else if (montoPendienteDec.lte(0)) estadoVisual = "PAGADO";
    else if (montoCubierto.gt(0)) estadoVisual = "PARCIAL";
    else estadoVisual = "PENDIENTE";

    return {
      id: m.id,
      cajaId: m.cajaId,
      cajaLabel: m.Caja.label,
      fecha: m.fecha,
      tipo: m.tipo,
      moneda: m.moneda,
      descripcion: m.descripcion,
      montoTotal: montoTotal.toNumber(),
      montoCubierto: montoCubierto.toNumber(),
      montoPendiente: montoPendienteDec.toNumber(),
      estadoVisual,
      anulado: m.anulado,
    };
  });
}
