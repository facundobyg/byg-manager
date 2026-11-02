import { prisma } from "@/lib/prisma";
import { Moneda } from "@prisma/client";
import { getPatrimonioNeto, type PatrimonioNeto } from "@/lib/finance";
import { mapBalanceGeneral } from "@/lib/finance/compat";

export async function getExposicionPorCliente() {
  const [clientes, tcConfig] = await Promise.all([
    prisma.cliente.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        CuentaCorriente: { select: { saldo: true, moneda: true } },
        PlazoFijo: { where: { estado: "ACTIVO" }, select: { capital: true, moneda: true } },
        CustodiaCliente: { select: { cantidadTotal: true, precioPromedio: true, Activo: { select: { precioActual: true } } } },
      },
    }),
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);

  const tcBlue = tcConfig?.valor ? Number(tcConfig.valor) : 1;

  const rows = clientes.map((c) => {
    // Convert each CC balance to USD eq — ARS / tcBlue, USD as-is
    const ccSaldoUSD = c.CuentaCorriente.reduce((acc, cc) => {
      const saldo = Number(cc.saldo);
      return acc + (cc.moneda === "ARS" ? saldo / tcBlue : saldo);
    }, 0);

    // Same for PF capital
    const plazosFijosUSD = c.PlazoFijo.reduce((acc, pf) => {
      const capital = Number(pf.capital);
      return acc + (pf.moneda === "ARS" ? capital / tcBlue : capital);
    }, 0);

    // Custodia always in USD (activo prices are USD)
    const custodiaUSD = c.CustodiaCliente.reduce((acc, cu) => {
      const precio = cu.Activo.precioActual != null
        ? Number(cu.Activo.precioActual)
        : Number(cu.precioPromedio);
      return acc + Number(cu.cantidadTotal) * precio;
    }, 0);

    const exposicionTotal = Math.abs(ccSaldoUSD) + plazosFijosUSD + custodiaUSD;

    const estado: "NORMAL" | "ATENCION" | "RIESGO" =
      ccSaldoUSD < 0 ? "RIESGO" :
      plazosFijosUSD > 0 ? "ATENCION" :
      "NORMAL";

    return {
      clienteId:       c.id,
      clienteNombre:   c.nombre,
      ccSaldo:         ccSaldoUSD,
      plazosFijos:     plazosFijosUSD,
      custodia:        custodiaUSD,
      exposicionTotal,
      estado,
    };
  });

  rows.sort((a, b) => b.exposicionTotal - a.exposicionTotal);
  return rows;
}

/**
 * Conteos del Home. MACRO 2: ya no calcula un "patrimonio total" propio (sumaba
 * ARS y USD sin convertir e incluía custodia de clientes). El PN canónico es
 * getPatrimonioNeto (src/lib/finance).
 */
export async function getResumenConsolidado() {
  const [totalClientes, totalCuentasCorrientes, totalPlazosFijos, totalPosicionesCartera, totalPosicionesCustodia] =
    await Promise.all([
      prisma.cliente.count({ where: { activo: true } }),
      prisma.cuentaCorriente.count(),
      prisma.plazoFijo.count({ where: { estado: "ACTIVO" } }),
      prisma.posicionCartera.count(),
      prisma.custodiaCliente.count(),
    ]);
  return { totalClientes, totalCuentasCorrientes, totalPlazosFijos, totalPosicionesCartera, totalPosicionesCustodia };
}

/** Exposición por moneda NATIVA, desde el PN canónico (cajas con saldo inicial, CC y PF vigentes). */
export async function getExposicionPorMoneda() {
  const pn = await getPatrimonioNeto();
  const cc = new Map<Moneda, number>();
  for (const cl of pn.detalle.clientes) {
    for (const m of Object.keys(cl.ccNativo) as Moneda[]) cc.set(m, (cc.get(m) ?? 0) + cl.ccNativo[m]);
  }
  const rows = (["ARS", "USD", "EUR", "BRL"] as Moneda[]).map((moneda) => {
    const caja = pn.componentes.cajas.nativo[moneda];
    const cuentasCorrientes = cc.get(moneda) ?? 0;
    const plazosFijos = pn.componentes.pf.nativo[moneda];
    return { moneda, caja, cuentasCorrientes, plazosFijos, operaciones: 0, total: caja + cuentasCorrientes + plazosFijos };
  }).filter((r) => r.caja !== 0 || r.cuentasCorrientes !== 0 || r.plazosFijos !== 0);
  rows.sort((a, b) => b.total - a.total);
  return rows;
}

/**
 * Patrimonio Neto canónico (misma fuente que /posicion y /reportes) CON su calidad.
 * pnUSD = null si INCOMPLETE; knownSubtotalUSD es diagnóstico (no es el PN).
 */
export async function getPosicionPN(): Promise<Pick<PatrimonioNeto, "pnUSD" | "quality" | "qualityReasons" | "knownSubtotalUSD">> {
  const pn = await getPatrimonioNeto();
  return { pnUSD: pn.pnUSD, quality: pn.quality, qualityReasons: pn.qualityReasons, knownSubtotalUSD: pn.knownSubtotalUSD };
}

/** Balance de /reportes: reexpresión del PN canónico (sin fórmula propia). */
export async function getBalanceGeneral() {
  return mapBalanceGeneral(await getPatrimonioNeto());
}
