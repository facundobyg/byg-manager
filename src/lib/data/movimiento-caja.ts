import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { Moneda, TipoMovCaja } from "@prisma/client";
import { idsRevertidos } from "@/lib/caja/integridad.service";

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
  // MACRO 3: solo pagos VÁLIDOS (confirmados, no anulados, no revertidos).
  const pagos = await prisma.movimientoCaja.findMany({
    where: { pagoDeId: { in: ids }, confirmado: true, anulado: false },
    select: { id: true, pagoDeId: true, monto: true },
  });
  const revertidos = await idsRevertidos(prisma, pagos.map((p) => p.id));

  const cubiertoMap = new Map<string, Decimal>();
  for (const p of pagos) {
    if (!p.pagoDeId || revertidos.has(p.id)) continue;
    cubiertoMap.set(p.pagoDeId, (cubiertoMap.get(p.pagoDeId) ?? new Decimal(0)).plus(new Decimal(p.monto.toString())));
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
