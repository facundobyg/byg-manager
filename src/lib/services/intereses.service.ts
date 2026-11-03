import { Decimal } from "@prisma/client/runtime/library";
import { TipoMovCC } from "@prisma/client";

export interface MovimientoCCInput {
  fecha: Date;
  tipo: TipoMovCC;
  monto: Decimal;
}

export interface PeriodoInteres {
  fechaDesde: Date;
  fechaHasta: Date;
  dias: number;
  saldo: Decimal;
  interes: Decimal;
}

export interface ResultadoInteresCCRealista {
  interesTotal: Decimal;
  periodos: PeriodoInteres[];
}

export function calcularDiasEntreFechas(fechaInicio: Date, fechaFin: Date): number {
  const msInicio = Date.UTC(
    fechaInicio.getFullYear(),
    fechaInicio.getMonth(),
    fechaInicio.getDate()
  );
  const msFin = Date.UTC(
    fechaFin.getFullYear(),
    fechaFin.getMonth(),
    fechaFin.getDate()
  );
  return Math.round((msFin - msInicio) / (1000 * 60 * 60 * 24));
}

export function calcularInteresCC({
  saldo,
  tasa,
  dias,
}: {
  saldo: Decimal;
  tasa: Decimal;
  dias: number;
}): Decimal {
  return saldo.mul(tasa).mul(new Decimal(dias)).div(new Decimal(365));
}

export function calcularInteresPF({
  capital,
  tasa,
  fechaInicio,
  fechaVencimiento,
}: {
  capital: Decimal;
  tasa: Decimal;
  fechaInicio: Date;
  fechaVencimiento: Date;
}): Decimal {
  const dias = calcularDiasEntreFechas(fechaInicio, fechaVencimiento);
  return capital.mul(tasa).mul(new Decimal(dias)).div(new Decimal(365));
}

/**
 * Calculates interest on a CuentaCorriente using weighted daily balance.
 *
 * Each period between movements uses the balance active during that period.
 * Formula per period: saldo * tasa * (dias / 365)
 *
 * Only periods where saldo > 0 generate interest (debtor balance logic).
 * Adjust the condition below if creditor accounts also accrue interest.
 */
export function calcularInteresCCRealista({
  movimientos,
  tasa,
  fechaInicio,
  fechaFin,
  saldoInicial = new Decimal(0),
}: {
  movimientos: MovimientoCCInput[];
  tasa: Decimal;
  fechaInicio: Date;
  fechaFin: Date;
  saldoInicial?: Decimal;
}): ResultadoInteresCCRealista {
  // Normalize to midnight UTC to avoid DST-induced day drift
  const normalize = (d: Date): Date =>
    new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

  const inicio = normalize(fechaInicio);
  const fin = normalize(fechaFin);

  // Filter movimientos strictly within [fechaInicio, fechaFin) and sort ASC
  const movsFiltrados = movimientos
    .map((m) => ({ ...m, fecha: normalize(m.fecha) }))
    .filter((m) => m.fecha >= inicio && m.fecha < fin)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  // MACRO 4: tramos explícitos. saldoInicial = saldo al comienzo de fechaInicio
  // (antes de los movimientos de ese día). Un movimiento con fecha D impacta DESDE
  // D: se devenga [desde, D) con el saldo vigente y recién después se aplican todos
  // los movimientos de D (una sola vez). Antes cada tramo usaba el saldo del corte
  // ANTERIOR (off-by-one): un movimiento impactaba un corte tarde y el del último
  // corte no impactaba nunca.
  const periodos: PeriodoInteres[] = [];
  let interesTotal = new Decimal(0);
  let saldo = saldoInicial;
  let desde = inicio;

  const devengar = (hasta: Date) => {
    const dias = calcularDiasEntreFechas(desde, hasta);
    // Only accrue interest on positive balances (creditor account convention)
    const interes = saldo.greaterThan(0)
      ? saldo.mul(tasa).mul(new Decimal(dias)).div(new Decimal(365))
      : new Decimal(0);
    interesTotal = interesTotal.add(interes);
    periodos.push({ fechaDesde: desde, fechaHasta: hasta, dias, saldo, interes });
    desde = hasta;
  };

  for (const mov of movsFiltrados) {
    if (mov.fecha.getTime() > desde.getTime()) devengar(mov.fecha);
    if (mov.tipo === TipoMovCC.INGRESO || mov.tipo === TipoMovCC.AJUSTE) {
      saldo = saldo.add(mov.monto);
    } else if (mov.tipo === TipoMovCC.EGRESO) {
      saldo = saldo.sub(mov.monto);
    }
    // INTERES movements are excluded from balance reconstruction
  }
  // Último tramo hasta fechaFin (exclusiva); siempre se informa, aun con 0 días.
  devengar(fin);

  return { interesTotal, periodos };
}
