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

  // Build timeline: unique date breakpoints within the period
  const breakpoints: Date[] = [inicio];
  for (const mov of movsFiltrados) {
    const last = breakpoints[breakpoints.length - 1];
    if (mov.fecha.getTime() !== last.getTime()) {
      breakpoints.push(mov.fecha);
    }
  }
  breakpoints.push(fin);

  // Pre-compute running balance at each breakpoint start
  // saldoInicial is the balance as of fechaInicio (before any movimiento that day)
  let saldoCorrente = saldoInicial;
  const saldoPorBreakpoint: Decimal[] = [saldoCorrente];

  let movIdx = 0;
  for (let i = 1; i < breakpoints.length - 1; i++) {
    const punto = breakpoints[i];
    // Apply all movimientos that fall on the previous breakpoint date
    const anterior = breakpoints[i - 1];
    while (
      movIdx < movsFiltrados.length &&
      movsFiltrados[movIdx].fecha.getTime() === anterior.getTime()
    ) {
      const mov = movsFiltrados[movIdx];
      if (mov.tipo === TipoMovCC.INGRESO || mov.tipo === TipoMovCC.AJUSTE) {
        saldoCorrente = saldoCorrente.add(mov.monto);
      } else if (mov.tipo === TipoMovCC.EGRESO) {
        saldoCorrente = saldoCorrente.sub(mov.monto);
      }
      // INTERES movements are excluded from balance reconstruction
      movIdx++;
    }
    saldoPorBreakpoint.push(saldoCorrente);
  }

  // Calculate interest per period
  const periodos: PeriodoInteres[] = [];
  let interesTotal = new Decimal(0);

  for (let i = 0; i < breakpoints.length - 1; i++) {
    const fechaDesde = breakpoints[i];
    const fechaHasta = breakpoints[i + 1];
    const dias = calcularDiasEntreFechas(fechaDesde, fechaHasta);
    const saldo = saldoPorBreakpoint[i];

    // Only accrue interest on positive balances (creditor account convention)
    // Change condition to saldo.isNegative() for debtor-side accrual
    const interes = saldo.greaterThan(0)
      ? saldo.mul(tasa).mul(new Decimal(dias)).div(new Decimal(365))
      : new Decimal(0);

    interesTotal = interesTotal.add(interes);
    periodos.push({ fechaDesde, fechaHasta, dias, saldo, interes });
  }

  return { interesTotal, periodos };
}
