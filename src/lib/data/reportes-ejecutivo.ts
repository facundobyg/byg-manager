import "server-only";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { getReportesBaseData } from "@/lib/data/reportes-base";
import { getFinanceDataset, getResultadoRealizadoMes } from "@/lib/finance";
import { arsPorUsd, mapUtilidadMes } from "@/lib/finance/compat";

function mesRango(mes: string): { desde: Date; hasta: Date } {
  const [y, m] = mes.split("-").map(Number);
  return {
    desde: new Date(Date.UTC(y, m - 1, 1)),
    hasta: new Date(Date.UTC(y, m, 1)),
  };
}

// ── Bloque 1: Utilidad Real del Mes ─────────────────────────────────────────
// MACRO 2 — Delegado al motor canónico (src/lib/finance): resultado REALIZADO
// del mes (sin pendientes/revertidos/valuaciones; TC de la fecha de cada hecho).
// La forma de retorno se mantiene para las pantallas y el cierre.

export async function getUtilidadMes(mes: string) {
  const [r, ds] = await Promise.all([getResultadoRealizadoMes(mes), getFinanceDataset()]);
  return mapUtilidadMes(r, ds);
}

// ── Bloque 2: Apertura Moneda ────────────────────────────────────────────────

export async function getAperturaMoneda() {
  const [
    { movCaja: movsCaja, cuentasCorrientes: ccs, plazosFijos: pfs, posicionesCartera: cartera, posicionesCustodia: custodia },
    tcConfig,
  ] = await Promise.all([
    getReportesBaseData(),
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);

  const tc = new Decimal(tcConfig?.valor ?? "1000");

  const cajaByMoneda = new Map<string, Decimal>();
  for (const m of movsCaja) {
    const sign = m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN" ? 1 : -1;
    cajaByMoneda.set(m.moneda, (cajaByMoneda.get(m.moneda) ?? new Decimal(0)).plus(new Decimal(m.monto.toString()).mul(sign)));
  }

  const cajaUSD = cajaByMoneda.get("USD") ?? new Decimal(0);
  const cajaARS = cajaByMoneda.get("ARS") ?? new Decimal(0);

  let ccUSDPos = new Decimal(0), ccUSDNeg = new Decimal(0);
  let ccARSPos = new Decimal(0), ccARSNeg = new Decimal(0);
  for (const cc of ccs) {
    const s = new Decimal(cc.saldo.toString());
    if (cc.moneda === "USD") {
      if (s.gte(0)) ccUSDPos = ccUSDPos.plus(s); else ccUSDNeg = ccUSDNeg.plus(s.abs());
    } else if (cc.moneda === "ARS") {
      if (s.gte(0)) ccARSPos = ccARSPos.plus(s); else ccARSNeg = ccARSNeg.plus(s.abs());
    }
  }

  let pfUSD = new Decimal(0), pfARS = new Decimal(0);
  for (const pf of pfs) {
    const cap = new Decimal(pf.capital.toString());
    if (pf.moneda === "USD") pfUSD = pfUSD.plus(cap);
    else if (pf.moneda === "ARS") pfARS = pfARS.plus(cap);
  }

  // Convert ARS-priced positions to USD using TC before aggregating
  const carteraUSD = cartera.reduce((acc, p) => {
    const rawPrecio = p.Activo?.precioActual != null
      ? new Decimal(p.Activo.precioActual.toString())
      : new Decimal(p.precioCompra.toString());
    const precioUSD = p.Activo?.monedaPrecio === "ARS"
      ? (tc.gt(0) ? rawPrecio.div(tc) : rawPrecio)
      : rawPrecio;
    return acc.plus(new Decimal(p.cantidad.toString()).mul(precioUSD));
  }, new Decimal(0));

  const custodiaUSD = custodia.reduce((acc, p) => {
    const rawPrecio = p.Activo?.precioActual != null
      ? new Decimal(p.Activo.precioActual.toString())
      : new Decimal(p.precioPromedio.toString());
    const precioUSD = p.Activo?.monedaPrecio === "ARS"
      ? (tc.gt(0) ? rawPrecio.div(tc) : rawPrecio)
      : rawPrecio;
    return acc.plus(new Decimal(p.cantidadTotal.toString()).mul(precioUSD));
  }, new Decimal(0));

  // Activos BYG USD: caja propia + cartera propia + recobros (CC neg = clientes deben a BYG)
  // Pasivos BYG USD: CC positivas (BYG debe a clientes) + PF (BYG debe a clientes)
  const usdDisponible = cajaUSD;                                   // caja bruta sin mezclar pasivos
  const usdActivos    = carteraUSD;                                // cartera propia (custodia excluida)
  const ccUSDRecobros = ccUSDNeg;                                  // asset: clientes deben a BYG
  const usdDeuda      = ccUSDPos.plus(pfUSD);                      // pasivo: BYG debe a clientes
  const usdNeto       = usdDisponible.plus(usdActivos).plus(ccUSDRecobros).minus(usdDeuda);
  const arsDeuda      = ccARSPos.plus(pfARS);                      // pasivo ARS a clientes
  const arsNeto       = cajaARS.plus(ccARSNeg).minus(arsDeuda);

  return {
    usdDisponible:       Number(usdDisponible),
    usdActivos:          Number(usdActivos),
    ccUSDRecobros:       Number(ccUSDRecobros),
    usdDeuda:            Number(usdDeuda),
    usdNeto:             Number(usdNeto),
    arsNeto:             Number(arsNeto),
    carteraUSD:          Number(carteraUSD),
    custodiaUSD:         Number(custodiaUSD),
    tcBlue:              Number(tc),
    sensibilidadPorMil:  Number(usdNeto.mul(1000)),
    // breakdown clientes (administrado — no afecta P&L BYG)
    pfClientesUSD:       Number(pfUSD),
    pfClientesARS:       Number(pfARS),
    ccClientesUSDPos:    Number(ccUSDPos),
    ccClientesARSPos:    Number(ccARSPos),
  };
}

// ── Bloque 3: KPIs Ejecutivos ────────────────────────────────────────────────

export async function getKPIsEjecutivos(mes: string) {
  const { desde, hasta } = mesRango(mes);
  const hoy   = new Date();
  const en30d = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    cantClientes,
    cantComitentes,
    pfActivos,
    pfVencidos,
    pfProximos,
    pfStats,
    ccStats,
    ccTasaAvg,
    opsBolsaMes,
    arbsMes,
    opsByIndustrial,
    opsPropias,
    comisionesMes,
  ] = await Promise.all([
    prisma.cliente.count({ where: { activo: true } }),
    prisma.comitenteInversion.count({ where: { activo: true } }),
    prisma.plazoFijo.count({ where: { estado: "ACTIVO" } }),
    prisma.plazoFijo.count({ where: { estado: "VENCIDO" } }),
    prisma.plazoFijo.count({
      where: { estado: "ACTIVO", fechaVencimiento: { gte: hoy, lte: en30d } },
    }),
    prisma.plazoFijo.aggregate({
      where: { estado: "ACTIVO" },
      _sum: { capital: true },
      _avg: { tasaAnual: true },
    }),
    prisma.cuentaCorriente.aggregate({
      _count: { id: true },
      _sum:   { saldo: true },
    }),
    prisma.cliente.aggregate({
      where: { activo: true },
      _avg:  { tasaCC: true },
    }),
    prisma.operacionBolsa.count({
      where: { fechaOperativa: { gte: desde, lt: hasta }, anulada: false },
    }),
    prisma.operacionBolsa.count({
      where: { grupoArbitrajeId: { not: null }, fechaOperativa: { gte: desde, lt: hasta }, anulada: false },
    }),
    prisma.operacionBolsa.count({
      where: {
        alyc: { contains: "Industrial", mode: "insensitive" },
        fechaOperativa: { gte: desde, lt: hasta },
        anulada: false,
      },
    }),
    prisma.operacionBolsa.count({
      where: {
        fechaOperativa: { gte: desde, lt: hasta },
        anulada: false,
        OR: [
          { ComitenteInversion: { esPropioBYG: true } },
          { carteraId: { not: null } },
        ],
      },
    }),
    // MACRO 2: comisiones/honorarios del resultado canónico (ambas fuentes, sin duplicados).
    getResultadoRealizadoMes(mes),
  ]);
  const SUB_COMISION = new Set(["COMISION", "HONORARIO_CLIENTE", "HONORARIO_EXTERNO", "HONORARIO_BANCO"]);
  const ds = await getFinanceDataset();

  const rawTasaCC = ccTasaAvg._avg?.tasaCC;
  const tasaCC = rawTasaCC != null ? Number(rawTasaCC) : null;

  return {
    cantClientes,
    cantComitentes,
    pfActivos,
    pfVencidos,
    pfProximos,
    pfCapitalTotal:  Number(pfStats._sum.capital ?? 0),
    pfTasaPromedio:  pfStats._avg.tasaAnual != null ? Number(pfStats._avg.tasaAnual) : null,
    ccCount:         ccStats._count.id,
    ccSaldoTotal:    Number(ccStats._sum.saldo ?? 0),
    ccTasaPromedio:  tasaCC != null ? (tasaCC > 1 ? tasaCC : tasaCC * 100) : null,
    opsBolsaMes,
    arbsMes,
    opsByIndustrial,
    opsPropias,
    // Equivalente ARS al TC de la fecha de cada partida; null si alguna no es convertible (nunca 0).
    comisionesMes:   comisionesMes.partidas
      .filter((p) => (p.categoria === "HONORARIO_CAMBIO" || p.categoria === "RESULTADO_OPERATIVO") && SUB_COMISION.has(p.subtipo ?? ""))
      .reduce<number | null>((s, p) => {
        if (s === null) return null;
        if (p.moneda === "ARS") return s + p.monto;
        const tc = arsPorUsd(ds, p.fecha);
        return p.usd === null || tc === null ? null : s + p.usd * tc;
      }, 0),
  };
}

// ── Bloque 4: Reporte Productores ────────────────────────────────────────────

export type ProductorRow = {
  productor: string;
  ops: number;
  clientes: number;
  comisionARS: number;
  comisionUSD: number;
  senebiBruto: number;
};

export async function getReporteProductores(mes: string): Promise<ProductorRow[]> {
  const { desde, hasta } = mesRango(mes);

  const ops = await prisma.operacionBolsa.findMany({
    where: {
      fechaOperativa: { gte: desde, lt: hasta },
      anulada: false,
      comitenteId: { not: null },
    },
    select: {
      comisionFija: true,
      comisionUSD: true,
      esSenebi: true,
      senebiBruto: true,
      ComitenteInversion: { select: { id: true, productor: true } },
    },
  });

  type GrupoData = {
    productor: string;
    ops: number;
    comisionARS: number;
    comisionUSD: number;
    senebiBruto: number;
    comitentes: Set<string>;
  };

  const grupos = new Map<string, GrupoData>();

  for (const op of ops) {
    const productor = op.ComitenteInversion?.productor ?? "OTRO";
    if (!grupos.has(productor)) {
      grupos.set(productor, { productor, ops: 0, comisionARS: 0, comisionUSD: 0, senebiBruto: 0, comitentes: new Set() });
    }
    const g = grupos.get(productor)!;
    g.ops++;
    if (op.comisionFija  != null) g.comisionARS  += Number(op.comisionFija);
    if (op.comisionUSD   != null) g.comisionUSD  += Number(op.comisionUSD);
    if (op.esSenebi && op.senebiBruto != null) g.senebiBruto += Number(op.senebiBruto);
    if (op.ComitenteInversion) g.comitentes.add(op.ComitenteInversion.id);
  }

  const result: ProductorRow[] = [];
  grupos.forEach((g) => {
    result.push({
      productor:   g.productor,
      ops:         g.ops,
      clientes:    g.comitentes.size,
      comisionARS: g.comisionARS,
      comisionUSD: g.comisionUSD,
      senebiBruto: g.senebiBruto,
    });
  });

  return result.sort((a, b) => b.ops - a.ops);
}

// ── Bloque 6: PF / CC ────────────────────────────────────────────────────────

export async function getResumenPFCC() {
  const hoy   = new Date();
  const en30d = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [pfActivos, pfVencidosTotal, pfVencidosData, pfProximosData, pfStats, pfCapARS, pfCapUSD, ccStats, tcCfg] = await Promise.all([
    prisma.plazoFijo.count({ where: { estado: "ACTIVO" } }),
    prisma.plazoFijo.count({ where: { estado: "VENCIDO" } }),
    prisma.plazoFijo.findMany({
      where: { estado: "VENCIDO" },
      select: { capital: true, moneda: true, Cliente: { select: { nombre: true } } },
      orderBy: { fechaVencimiento: "desc" },
      take: 10,
    }),
    prisma.plazoFijo.findMany({
      where: { estado: "ACTIVO", fechaVencimiento: { gte: hoy, lte: en30d } },
      select: {
        capital: true, moneda: true, tasaAnual: true, fechaVencimiento: true,
        Cliente: { select: { nombre: true } },
      },
      orderBy: { fechaVencimiento: "asc" },
    }),
    prisma.plazoFijo.aggregate({
      where: { estado: "ACTIVO" },
      _sum: { capital: true },
      _avg: { tasaAnual: true },
      _count: { id: true },
    }),
    prisma.plazoFijo.aggregate({ where: { estado: "ACTIVO", moneda: "ARS" }, _sum: { capital: true } }),
    prisma.plazoFijo.aggregate({ where: { estado: "ACTIVO", moneda: "USD" }, _sum: { capital: true } }),
    prisma.cuentaCorriente.aggregate({
      _count: { id: true },
      _sum:   { saldo: true },
    }),
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);

  const tcPF        = new Decimal(tcCfg?.valor ?? "1000");
  const pfCapitalARS      = Number(pfCapARS._sum.capital ?? 0);
  const pfCapitalUSD      = Number(pfCapUSD._sum.capital ?? 0);
  const pfCapitalTotalARS = pfCapitalARS + pfCapitalUSD * Number(tcPF);

  return {
    pfActivos,
    pfVencidosCount: pfVencidosTotal,
    pfVencidosData: pfVencidosData.map((p) => ({
      cliente: p.Cliente?.nombre ?? "—",
      capital: Number(p.capital),
      moneda:  p.moneda,
    })),
    pfProximos: pfProximosData.map((p) => ({
      cliente:          p.Cliente?.nombre ?? "—",
      capital:          Number(p.capital),
      moneda:           p.moneda,
      tasaAnual:        p.tasaAnual != null ? Number(p.tasaAnual) : null,
      fechaVencimiento: p.fechaVencimiento,
    })),
    pfCapitalARS,
    pfCapitalUSD,
    pfCapitalTotalARS,
    pfTasaPromedio:  pfStats._avg.tasaAnual != null ? Number(pfStats._avg.tasaAnual) : null,
    ccCount:         ccStats._count.id,
    ccSaldoTotal:    Number(ccStats._sum.saldo ?? 0),
  };
}
