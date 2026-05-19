import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { Moneda } from "@prisma/client";

export async function getExposicionPorCliente() {
  const clientes = await prisma.cliente.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      CuentaCorriente: { select: { saldo: true } },
      PlazoFijo: { where: { estado: "ACTIVO" }, select: { capital: true } },
      CustodiaCliente: { select: { cantidadTotal: true, precioPromedio: true, Activo: { select: { precioActual: true } } } },
    },
  });

  const rows = clientes.map((c) => {
    const ccSaldo = c.CuentaCorriente.reduce(
      (acc, cc) => acc.plus(new Decimal(cc.saldo.toString())),
      new Decimal(0),
    );
    const plazosFijos = c.PlazoFijo.reduce(
      (acc, pf) => acc.plus(new Decimal(pf.capital.toString())),
      new Decimal(0),
    );
    const custodia = c.CustodiaCliente.reduce((acc, cu) => {
      const precio = cu.Activo.precioActual != null
        ? new Decimal(cu.Activo.precioActual.toString())
        : new Decimal(cu.precioPromedio.toString());
      return acc.plus(new Decimal(cu.cantidadTotal.toString()).mul(precio));
    }, new Decimal(0));

    const exposicionTotal = ccSaldo.abs().plus(plazosFijos).plus(custodia);

    const estado: "NORMAL" | "ATENCION" | "RIESGO" =
      ccSaldo.lt(0) ? "RIESGO" :
      plazosFijos.gt(0) ? "ATENCION" :
      "NORMAL";

    return {
      clienteId:       c.id,
      clienteNombre:   c.nombre,
      ccSaldo:         Number(ccSaldo),
      plazosFijos:     Number(plazosFijos),
      custodia:        Number(custodia),
      exposicionTotal: Number(exposicionTotal),
      estado,
    };
  });

  rows.sort((a, b) => b.exposicionTotal - a.exposicionTotal);
  return rows;
}

export async function getResumenConsolidado() {
  const [
    totalClientes,
    totalCuentasCorrientes,
    totalPlazosFijos,
    totalPosicionesCartera,
    totalPosicionesCustodia,
    saldoCCAgg,
    capitalPFAgg,
    posicionesCartera,
    posicionesCustodia,
    tcConfig,
  ] = await Promise.all([
    prisma.cliente.count({ where: { activo: true } }),
    prisma.cuentaCorriente.count(),
    prisma.plazoFijo.count({ where: { estado: "ACTIVO" } }),
    prisma.posicionCartera.count(),
    prisma.custodiaCliente.count(),
    prisma.cuentaCorriente.aggregate({ _sum: { saldo: true } }),
    prisma.plazoFijo.aggregate({ _sum: { capital: true }, where: { estado: "ACTIVO" } }),
    prisma.posicionCartera.findMany({ 
      include: { Activo: { select: { precioActual: true } } } 
    }),
    prisma.custodiaCliente.findMany({ 
      include: { Activo: { select: { precioActual: true } } } 
    }),
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);

  const totalSaldoCC = new Decimal(saldoCCAgg._sum.saldo?.toString() ?? "0");
  const totalCapitalPF = new Decimal(capitalPFAgg._sum.capital?.toString() ?? "0");

  const totalValorCartera = posicionesCartera.reduce(
    (acc, p) => {
      const precio = p.Activo?.precioActual != null
        ? new Decimal(p.Activo.precioActual.toString())
        : new Decimal(p.precioCompra.toString());
      return acc.plus(new Decimal(p.cantidad.toString()).mul(precio));
    },
    new Decimal(0)
  );

  const totalValorCustodia = posicionesCustodia.reduce(
    (acc, p) => {
      const precio = p.Activo?.precioActual != null
        ? new Decimal(p.Activo.precioActual.toString())
        : new Decimal(p.precioPromedio.toString());
      return acc.plus(new Decimal(p.cantidadTotal.toString()).mul(precio));
    },
    new Decimal(0)
  );

  const tcBlue = new Decimal(tcConfig?.valor ?? "1");
  const patrimonioTotalARS = totalSaldoCC
    .plus(totalCapitalPF)
    .plus(totalValorCartera)
    .plus(totalValorCustodia);
  const patrimonioTotalUSD = tcBlue.gt(0) ? patrimonioTotalARS.div(tcBlue) : new Decimal(0);

  return {
    totalClientes,
    totalCuentasCorrientes,
    totalPlazosFijos,
    totalPosicionesCartera,
    totalPosicionesCustodia,
    totalSaldoCC,
    totalCapitalPF,
    totalValorCartera,
    totalValorCustodia,
    tcBlue,
    patrimonioTotalARS,
    patrimonioTotalUSD,
  };
}

export async function getExposicionPorMoneda() {
  const [movCaja, cuentasCorrientes, plazosFijos] = await Promise.all([
    prisma.movimientoCaja.findMany({
      where: { confirmado: true },
      select: { moneda: true, tipo: true, monto: true },
    }),
    prisma.cuentaCorriente.findMany({
      select: { moneda: true, saldo: true },
    }),
    prisma.plazoFijo.findMany({
      where: { estado: "ACTIVO" },
      select: { moneda: true, capital: true },
    }),
  ]);

  const monedas = new Set<Moneda>();
  const caja = new Map<Moneda, Decimal>();
  const cc   = new Map<Moneda, Decimal>();
  const pf   = new Map<Moneda, Decimal>();

  for (const m of movCaja) {
    monedas.add(m.moneda);
    const sign = m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN" ? 1 : -1;
    caja.set(m.moneda, (caja.get(m.moneda) ?? new Decimal(0)).plus(new Decimal(m.monto.toString()).mul(sign)));
  }

  for (const c of cuentasCorrientes) {
    monedas.add(c.moneda);
    cc.set(c.moneda, (cc.get(c.moneda) ?? new Decimal(0)).plus(new Decimal(c.saldo.toString())));
  }

  for (const p of plazosFijos) {
    monedas.add(p.moneda);
    pf.set(p.moneda, (pf.get(p.moneda) ?? new Decimal(0)).plus(new Decimal(p.capital.toString())));
  }

  const rows = Array.from(monedas).map((moneda) => {
    const cajaVal = caja.get(moneda) ?? new Decimal(0);
    const ccVal   = cc.get(moneda)   ?? new Decimal(0);
    const pfVal   = pf.get(moneda)   ?? new Decimal(0);
    const total   = cajaVal.plus(ccVal).plus(pfVal);
    return {
      moneda,
      caja:             Number(cajaVal),
      cuentasCorrientes: Number(ccVal),
      plazosFijos:       Number(pfVal),
      operaciones:       0,
      total:             Number(total),
    };
  });

  rows.sort((a, b) => b.total - a.total);
  return rows;
}

export async function getBalanceGeneral() {
  const [movCaja, cuentasCorrientes, plazosFijos, posicionesCartera, posicionesCustodia, tcConfig] = await Promise.all([
    prisma.movimientoCaja.findMany({
      where: { confirmado: true },
      select: { moneda: true, tipo: true, monto: true },
    }),
    prisma.cuentaCorriente.findMany({
      select: { moneda: true, saldo: true },
    }),
    prisma.plazoFijo.findMany({
      where: { estado: "ACTIVO" },
      select: { moneda: true, capital: true },
    }),
    prisma.posicionCartera.findMany({
      include: { Activo: { select: { precioActual: true } } },
    }),
    prisma.custodiaCliente.findMany({
      include: { Activo: { select: { precioActual: true } } },
    }),
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);

  const TC_FALLBACK = new Decimal(1000);
  const tc = tcConfig?.valor ? new Decimal(tcConfig.valor) : TC_FALLBACK;

  const toUSD = (amount: Decimal, moneda: string): Decimal => {
    if (moneda === "USD") return amount;
    if (moneda === "ARS") return tc.gt(0) ? amount.div(tc) : amount.div(TC_FALLBACK);
    return amount;
  };

  // Cajas: net confirmed balance per currency → convert to USD
  const cajaByMoneda = new Map<string, Decimal>();
  for (const m of movCaja) {
    const sign = m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN" ? 1 : -1;
    cajaByMoneda.set(m.moneda, (cajaByMoneda.get(m.moneda) ?? new Decimal(0)).plus(new Decimal(m.monto.toString()).mul(sign)));
  }
  let cajasUSD = new Decimal(0);
  for (const moneda of Array.from(cajaByMoneda.keys())) {
    cajasUSD = cajasUSD.plus(toUSD(cajaByMoneda.get(moneda)!, moneda));
  }

  // CC: split positive (activo) vs negative (pasivo)
  let ccActivoUSD = new Decimal(0);
  let ccPasivoUSD = new Decimal(0);
  for (const c of cuentasCorrientes) {
    const saldoUSD = toUSD(new Decimal(c.saldo.toString()), c.moneda);
    if (saldoUSD.gte(0)) {
      ccActivoUSD = ccActivoUSD.plus(saldoUSD);
    } else {
      ccPasivoUSD = ccPasivoUSD.plus(saldoUSD.abs());
    }
  }

  // Cartera propia (USD-priced)
  const carteraUSD = posicionesCartera.reduce((acc, p) => {
    const precio = p.Activo?.precioActual != null
      ? new Decimal(p.Activo.precioActual.toString())
      : new Decimal(p.precioCompra.toString());
    return acc.plus(new Decimal(p.cantidad.toString()).mul(precio));
  }, new Decimal(0));

  // Custodia: informational only
  const custodiaUSD = posicionesCustodia.reduce((acc, p) => {
    const precio = p.Activo?.precioActual != null
      ? new Decimal(p.Activo.precioActual.toString())
      : new Decimal(p.precioPromedio.toString());
    return acc.plus(new Decimal(p.cantidadTotal.toString()).mul(precio));
  }, new Decimal(0));

  // PF: pasivo
  let pfUSD = new Decimal(0);
  for (const p of plazosFijos) {
    pfUSD = pfUSD.plus(toUSD(new Decimal(p.capital.toString()), p.moneda));
  }

  const activoTotal    = cajasUSD.plus(ccActivoUSD).plus(carteraUSD);
  const pasivoTotal    = pfUSD.plus(ccPasivoUSD);
  const patrimonioNeto = activoTotal.minus(pasivoTotal);

  return {
    activoTotal:    Number(activoTotal),
    pasivoTotal:    Number(pasivoTotal),
    patrimonioNeto: Number(patrimonioNeto),
    activo: {
      cajas:             Number(cajasUSD),
      cuentasCorrientes: Number(ccActivoUSD),
      cartera:           Number(carteraUSD),
      custodia:          Number(custodiaUSD),
    },
    pasivo: {
      plazosFijos:      Number(pfUSD),
      cuentasNegativas: Number(ccPasivoUSD),
    },
  };
}
