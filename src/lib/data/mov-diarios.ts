import "server-only";

import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import type { MovDiarioRow, TipoMovDiario, EstadoMovDiario, OrigenMovDiario } from "@/lib/data/mov-diarios-utils";

export type { MovDiarioRow, TipoMovDiario, EstadoMovDiario, OrigenMovDiario };
export { agruparPorCliente } from "@/lib/data/mov-diarios-utils";

const TIPO_CAJA: Record<string, TipoMovDiario> = {
  ENTRADA: "INGRESO",
  TRANSFERENCIA_IN: "INGRESO",
  SALIDA: "EGRESO",
  TRANSFERENCIA_OUT: "EGRESO",
};

const TIPO_CAMBIO_MAP: Record<string, TipoMovDiario> = {
  COMPRA_USD: "CAMBIO",
  VENTA_USD: "CAMBIO",
  COMPRA_EUR: "CAMBIO",
  VENTA_EUR: "CAMBIO",
  COMPRA_BRL: "CAMBIO",
  VENTA_BRL: "CAMBIO",
  HONORARIO_CLIENTE: "INGRESO",
  HONORARIO_EXTERNO: "INGRESO",
  COMISION: "INGRESO",
  AJUSTE: "INGRESO",
  GASTO_OPERATIVO: "EGRESO",
  DISTRIBUCION_UTILIDADES: "EGRESO",
  OTRO: "INGRESO",
};

function cleanDesc(d: string | null): string {
  if (!d) return "—";
  return d.replace(/\[CC\]\s*/, "").replace(/\s*\|\s*op:[a-zA-Z0-9-]+/, "").trim() || "—";
}

function inferOrigenCaja(tipo: string): OrigenMovDiario {
  if (tipo === "ENTRADA" || tipo === "TRANSFERENCIA_IN") return "INGRESO_EXTRA";
  return "EGRESO_EXTRA";
}

function inferOrigenCambio(tipo: string): OrigenMovDiario {
  if (
    tipo === "COMPRA_USD" ||
    tipo === "VENTA_USD" ||
    tipo === "COMPRA_EUR" ||
    tipo === "VENTA_EUR" ||
    tipo === "COMPRA_BRL" ||
    tipo === "VENTA_BRL"
  ) return "CAMBIO";
  return "MOV_MANUAL";
}

export async function getMovimientosDiarios(slug?: string): Promise<MovDiarioRow[]> {
  // Determine which caja to filter for
  let cajaId: string | undefined = undefined;
  if (slug) {
    const caja = await prisma.caja.findUnique({ where: { slug }, select: { id: true } });
    cajaId = caja?.id;
  } else {
    const principal = await prisma.caja.findFirst({ where: { esPrincipal: true }, select: { id: true } });
    cajaId = principal?.id;
  }

  const [movCaja, opsCambio] = await Promise.all([
    prisma.movimientoCaja.findMany({
      orderBy: { fecha: "desc" },
      take: 200,
      where: {
        cajaId: cajaId, // Filter by specific box
        descripcion: { not: { startsWith: "COBERTURA PARCIAL" } },
        tipo: { in: ["ENTRADA", "SALIDA"] },
      },
    }),
    // Operations only appear in the principal/central view (Oficina)
    // unless they were specifically recorded for another box (future feature)
    !slug || slug === 'oficina' 
      ? prisma.operacionCambio.findMany({
          orderBy: { fecha: "desc" },
          take: 200,
          include: { Cliente: { select: { nombre: true } } },
        })
      : Promise.resolve([]),
  ]);

  const allCoverage = await prisma.movimientoCaja.findMany({
    where: { descripcion: { startsWith: "COBERTURA PARCIAL" }, confirmado: true },
    select: { descripcion: true, monto: true },
  });

  const coverageMap = new Map<string, Decimal>();
  for (const c of allCoverage) {
    const match = c.descripcion?.match(/^COBERTURA PARCIAL ([a-zA-Z0-9-]+)/);
    if (match?.[1]) {
      const prev = coverageMap.get(match[1]) ?? new Decimal(0);
      coverageMap.set(match[1], prev.plus(new Decimal(c.monto.toString())));
    }
  }

  const fromCaja: MovDiarioRow[] = movCaja.map((m) => {
    const monto = new Decimal(m.monto.toString());
    let estado: EstadoMovDiario;

    if (m.confirmado) {
      estado = "COBRADO";
    } else {
      const cubierto = coverageMap.get(m.id) ?? new Decimal(0);
      if (cubierto.lte(0)) {
        estado = "PENDIENTE";
      } else if (cubierto.gte(monto)) {
        estado = "COBRADO";
      } else {
        estado = "PARCIAL";
      }
    }

    // Parse structured description [CLASSIFICATION:SUBTYPE]
    const match = m.descripcion?.match(/^\[(RESULTADO_OPERATIVO|MOVIMIENTO_CAJA|TRANSFERENCIA):([^\]]+)\]/);
    const clasificacionOperativa = (match?.[1] as any) || (m.descripcion?.includes("[TRANSFERENCIA:") ? "TRANSFERENCIA" : "MOVIMIENTO_CAJA");
    const subtipoOperativo = match?.[2] || (m.descripcion?.includes("[TRANSFERENCIA:IN]") ? "IN" : (m.descripcion?.includes("[TRANSFERENCIA:OUT]") ? "OUT" : "MANUAL"));
    const impactaResultado = clasificacionOperativa === "RESULTADO_OPERATIVO";

    const cleanDescText = m.descripcion?.replace(/^\[[^\]]+\]\s*/, "") || "—";

    return {
      id: m.id,
      fecha: m.fecha,
      cliente: "—",
      tipo: TIPO_CAJA[m.tipo] ?? "INGRESO",
      subTipo: m.tipo,
      origen: inferOrigenCaja(m.tipo),
      descripcion: cleanDesc(cleanDescText),
      monto: monto.toNumber(),
      moneda: m.moneda,
      estado,
      impactoCC: false,
      clasificacionOperativa,
      subtipoOperativo,
      impactaResultado,
    };
  });

  const fromCambio: MovDiarioRow[] = opsCambio.map((op) => ({
    id: op.id,
    fecha: op.fecha,
    cliente: op.clienteNombre ?? op.Cliente?.nombre ?? "—",
    tipo: TIPO_CAMBIO_MAP[op.tipo] ?? "CAMBIO",
    subTipo: op.tipo,
    origen: inferOrigenCambio(op.tipo),
    descripcion: cleanDesc(op.descripcion) || op.tipo.replace(/_/g, " "),
    monto: Number(op.cantidad.toString()),
    moneda: op.moneda,
    tc: Number(op.tipoCambio.toString()),
    totalARS: Number(op.totalARS.toString()),
    estado: op.pendiente ? "PENDIENTE" : "COBRADO",
    impactoCC: op.descripcion?.includes("[CC]") ?? false,
    clasificacionOperativa: "CAMBIO",
    subtipoOperativo: op.tipo,
    impactaResultado: true, // El cambio siempre impacta utilidad del mes
  }));

  const all = [...fromCaja, ...fromCambio];

  // Ordenamiento detallado por día y tipo
  const getOrderRank = (r: MovDiarioRow) => {
    const st = r.subTipo || "";
    if (st === "COMPRA_USD") return 1;
    if (st === "VENTA_USD") return 2;
    if (st === "COMPRA_EUR") return 3;
    if (st === "VENTA_EUR") return 4;
    if (st === "COMPRA_BRL") return 5;
    if (st === "VENTA_BRL") return 6;
    if (st === "COMISION" || st === "HONORARIO_CLIENTE" || st === "HONORARIO_EXTERNO") return 7;
    if (r.tipo === "INGRESO") return 8;
    if (r.tipo === "EGRESO") return 9;
    if (st === "AJUSTE") return 10;
    return 11;
  };

  return all.sort((a, b) => {
    const dateDiff = b.fecha.getTime() - a.fecha.getTime();
    if (dateDiff !== 0) return dateDiff;

    const rankA = getOrderRank(a);
    const rankB = getOrderRank(b);

    if (rankA !== rankB) return rankA - rankB;

    // A igual rango, ordenar por monto descendente
    return b.monto - a.monto;
  });
}

export async function getResultadoCambioMensual(mes: string) {
  const [ops, movs] = await Promise.all([
    prisma.operacionCambio.findMany({ where: { mesContable: mes } }),
    prisma.movimientoCaja.findMany({ 
      where: { 
        confirmado: true,
        descripcion: { startsWith: "[RESULTADO_OPERATIVO:" },
        Caja: { esPrincipal: true } // Enforce central accounting logic
      } 
    })
  ]);

  const config = await prisma.config.findUnique({ where: { clave: "tc_blue" } });
  const tcBlue = new Decimal(config?.valor || "1000");

  const results = {
    USD: { netoDivisa: new Decimal(0), netoARS: new Decimal(0) },
    EUR: { netoDivisa: new Decimal(0), netoARS: new Decimal(0) },
    BRL: { netoDivisa: new Decimal(0), netoARS: new Decimal(0) },
  };

  // 1. Impacto de Operaciones de Cambio
  for (const op of ops) {
    const m = op.moneda as keyof typeof results;
    if (!results[m]) continue;

    const cant = op.cantidad;
    const totARS = op.totalARS;
    const esCompra = op.tipo.startsWith("COMPRA");

    if (esCompra) {
      results[m].netoDivisa = results[m].netoDivisa.plus(cant);
      results[m].netoARS = results[m].netoARS.minus(totARS);
    } else if (op.tipo.startsWith("VENTA")) {
      results[m].netoDivisa = results[m].netoDivisa.minus(cant);
      results[m].netoARS = results[m].netoARS.plus(totARS);
    }
  }

  // 2. Impacto de Resultados Operativos (Alquileres, Honorarios, etc.)
  let extraUSD = new Decimal(0);
  for (const m of movs) {
    const monto = new Decimal(m.monto.toString());
    const isIngreso = m.tipo === "ENTRADA";
    
    // Convertir a USD para consolidar
    let montoUSD = monto;
    if (m.moneda === "ARS") montoUSD = monto.div(tcBlue);
    else if (m.moneda === "EUR" || m.moneda === "BRL") montoUSD = monto; // Simplificación

    if (isIngreso) extraUSD = extraUSD.plus(montoUSD);
    else extraUSD = extraUSD.minus(montoUSD);
  }

  const resUSD = results.USD.netoDivisa.plus(results.USD.netoARS.div(tcBlue));
  const resEUR = results.EUR.netoDivisa.plus(results.EUR.netoARS.div(tcBlue));
  const resBRL = results.BRL.netoDivisa.plus(results.BRL.netoARS.div(tcBlue));


  return {
    USD: { ...results.USD, resultado: resUSD.toNumber() },
    EUR: { ...results.EUR, resultado: resEUR.toNumber() },
    BRL: { ...results.BRL, resultado: resBRL.toNumber() },
    totalUSD: resUSD.plus(resEUR).plus(resBRL).plus(extraUSD).toNumber(),
    tcBlue: tcBlue.toNumber(),
  };
}

