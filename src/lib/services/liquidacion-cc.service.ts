import { Decimal } from "@prisma/client/runtime/library";
import { TipoMovCC } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calcularInteresCCRealista,
  PeriodoInteres,
} from "@/lib/services/intereses.service";

export interface LiquidacionCCInput {
  cuentaId: string;
  fechaInicio: Date;
  fechaFin: Date;
  tasa: Decimal;
  interesAplicado: Decimal;
}

export interface LiquidacionCCResult {
  interesCalculado: Decimal;
  interesAplicado: Decimal;
  diferencia: Decimal;
  movimientoId: string;
  periodos: PeriodoInteres[];
}

function formatFecha(fecha: Date): string {
  const d = fecha.getUTCDate().toString().padStart(2, "0");
  const m = (fecha.getUTCMonth() + 1).toString().padStart(2, "0");
  const y = fecha.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

export async function liquidarInteresCC({
  cuentaId,
  fechaInicio,
  fechaFin,
  tasa,
  interesAplicado,
}: LiquidacionCCInput): Promise<LiquidacionCCResult> {
  if (interesAplicado.lt(0)) {
    throw new Error("El interés aplicado no puede ser negativo.");
  }

  if (fechaFin <= fechaInicio) {
    throw new Error("fechaFin debe ser posterior a fechaInicio.");
  }

  // 1. Fetch account with ALL movements in range (ordered ASC for the engine)
  const cuenta = await prisma.cuentaCorriente.findUnique({
    where: { id: cuentaId },
    include: {
      MovimientoCC: {
        where: {
          fecha: {
            gte: fechaInicio,
            lt: fechaFin,
          },
        },
        orderBy: [{ fecha: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!cuenta) {
    throw new Error(`CuentaCorriente no encontrada: ${cuentaId}`);
  }

  // 2. Reconstruct saldoInicial as of fechaInicio by replaying all movements BEFORE that date
  const movimientosAnteriores = await prisma.movimientoCC.findMany({
    where: {
      cuentaCorrienteId: cuentaId,
      fecha: { lt: fechaInicio },
    },
    orderBy: [{ fecha: "asc" }, { createdAt: "asc" }],
  });

  let saldoInicial = new Decimal(0);
  for (const mov of movimientosAnteriores) {
    if (mov.tipo === TipoMovCC.INGRESO || mov.tipo === TipoMovCC.AJUSTE) {
      saldoInicial = saldoInicial.add(mov.monto);
    } else if (mov.tipo === TipoMovCC.EGRESO) {
      saldoInicial = saldoInicial.sub(mov.monto);
    }
    // INTERES excluded — never compound previously posted interest
  }

  // 3. Run the calculation engine
  const { interesTotal, periodos } = calcularInteresCCRealista({
    movimientos: cuenta.MovimientoCC.map((m) => ({
      fecha: m.fecha,
      tipo: m.tipo,
      monto: m.monto,
    })),
    tasa,
    fechaInicio,
    fechaFin,
    saldoInicial,
  });

  const interesCalculado = interesTotal;

  // 4. Validate: partial application is allowed, excess is not
  const aAplicar = interesAplicado.gt(0) ? interesAplicado : interesCalculado;

  if (aAplicar.greaterThan(interesCalculado)) {
    throw new Error(
      `El interés aplicado (${aAplicar.toFixed(2)}) no puede superar el interés calculado (${interesCalculado.toFixed(2)}).`
    );
  }

  if (aAplicar.lte(0)) {
    throw new Error("No hay interés a aplicar en el período seleccionado (saldo insuficiente o período vacío).");
  }

  const diferencia = interesCalculado.sub(aAplicar);
  const descripcion = `Interés CC período ${formatFecha(fechaInicio)} - ${formatFecha(fechaFin)}`;

  // 5. Atomic transaction: create movement + update balance
  const movimientoId = await prisma.$transaction(async (tx) => {
    const cuentaActual = await tx.cuentaCorriente.findUnique({
      where: { id: cuentaId },
      select: { saldo: true },
    });

    if (!cuentaActual) {
      throw new Error(`CuentaCorriente no encontrada dentro de la transacción: ${cuentaId}`);
    }

    const nuevoSaldo = cuentaActual.saldo.add(aAplicar);

    const movimiento = await tx.movimientoCC.create({
      data: {
        id: crypto.randomUUID(),
        cuentaCorrienteId: cuentaId,
        fecha: fechaFin,
        tipo: TipoMovCC.INTERES,
        monto: aAplicar,
        descripcion,
      },
    });

    await tx.cuentaCorriente.update({
      where: { id: cuentaId },
      data: { saldo: nuevoSaldo },
    });

    return movimiento.id;
  });

  return {
    interesCalculado,
    interesAplicado: aAplicar,
    diferencia,
    movimientoId,
    periodos,
  };
}
