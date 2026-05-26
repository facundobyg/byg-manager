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
  return d
    .replace(/\[CC\]\s*/, "")
    .replace(/\s*\|\s*op:[a-zA-Z0-9-]+/, "")
    .replace(/\s*\|\s*usr:[^|]+/, "")
    .trim() || "—";
}

function extractOperador(d: string | null | undefined): string | undefined {
  if (!d) return undefined;
  const m = d.match(/\|\s*usr:([^|]+)/);
  return m?.[1]?.trim() || undefined;
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
  let targetCajaLabel: string | undefined = undefined;
  if (slug) {
    const caja = await prisma.caja.findUnique({ where: { slug }, select: { id: true, label: true } });
    cajaId = caja?.id;
    targetCajaLabel = caja?.label;
  } else {
    const principal = await prisma.caja.findFirst({ where: { esPrincipal: true }, select: { id: true, label: true } });
    cajaId = principal?.id;
    targetCajaLabel = principal?.label;
  }

  const isPrincipalView = !slug || slug === 'oficina';

  const [movCaja, opsInitial] = await Promise.all([
    prisma.movimientoCaja.findMany({
      orderBy: { fecha: "desc" },
      take: 200,
      where: {
        cajaId: cajaId,
        descripcion: { not: { startsWith: "COBERTURA PARCIAL" } },
        tipo: { in: ["ENTRADA", "SALIDA"] },
      },
    }),
    isPrincipalView
      ? prisma.operacionCambio.findMany({
          orderBy: { fecha: "desc" },
          take: 200,
          where: { descripcion: { not: { startsWith: "[REVERTIDA" } } },
          include: { Cliente: { select: { nombre: true } } },
        })
      : Promise.resolve([] as any[]),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let opsCambio: any[] = opsInitial;

  // For non-principal cajas: show ops linked to this caja + pending Augusto/Nanu ops
  if (!isPrincipalView && cajaId) {
    const linkedMovDesc = await prisma.movimientoCaja.findMany({
      where: { cajaId, descripcion: { contains: "Cambio " } },
      select: { descripcion: true },
    });

    const linkedOpIds = Array.from(new Set(
      linkedMovDesc
        .map(m => m.descripcion?.match(/\[(?:(?:Cobro|REVERSO) )?Cambio ([a-zA-Z0-9-]+)\]/)?.[1])
        .filter((id): id is string => !!id)
    ));

    // REGLA: Trenque muestra ops de Augusto/Nanu (cualquier estado) + ops liquidadas en Trenque
    const orConditions: any[] = [
      { descripcion: { contains: "| usr:Augusto", mode: "insensitive" } },
      { descripcion: { contains: "| usr:Nanu", mode: "insensitive" } },
    ];
    if (linkedOpIds.length > 0) {
      orConditions.unshift({ id: { in: linkedOpIds } });
    }

    const allOps = await prisma.operacionCambio.findMany({
      where: {
        OR: orConditions,
        descripcion: { not: { startsWith: "[REVERTIDA" } },
      },
      orderBy: { fecha: "desc" },
      take: 200,
      include: { Cliente: { select: { nombre: true } } },
    });

    opsCambio = allOps.filter((op: any) => {
      const desc = op.descripcion ?? "";
      if (linkedOpIds.includes(op.id)) return true;
      return /\| usr:(Augusto|Nanu)/i.test(desc);
    });
  }

  const [allCoverage, linkedMovsForLabel] = await Promise.all([
    prisma.movimientoCaja.findMany({
      where: { descripcion: { startsWith: "COBERTURA PARCIAL" }, confirmado: true },
      select: { descripcion: true, monto: true },
    }),
    isPrincipalView && opsCambio.length > 0
      ? prisma.movimientoCaja.findMany({
          where: { descripcion: { contains: "Cambio " } },
          select: { descripcion: true, cajaId: true },
        })
      : Promise.resolve([] as { descripcion: string | null; cajaId: string }[]),
  ]);

  const coverageMap = new Map<string, Decimal>();
  for (const c of allCoverage) {
    const match = c.descripcion?.match(/^COBERTURA PARCIAL ([a-zA-Z0-9-]+)/);
    if (match?.[1]) {
      const prev = coverageMap.get(match[1]) ?? new Decimal(0);
      coverageMap.set(match[1], prev.plus(new Decimal(c.monto.toString())));
    }
  }

  const cambioLiqCajaMap = new Map<string, string>();
  if (linkedMovsForLabel.length > 0) {
    const cajaIdSet = Array.from(new Set(linkedMovsForLabel.map(m => m.cajaId)));
    const cajasInfo = await prisma.caja.findMany({
      where: { id: { in: cajaIdSet } },
      select: { id: true, label: true },
    });
    const cajaLblById = new Map(cajasInfo.map(c => [c.id, c.label]));
    for (const m of linkedMovsForLabel) {
      const match = m.descripcion?.match(/\[(?:(?:Cobro|REVERSO) )?Cambio ([a-zA-Z0-9-]+)\]/);
      if (match?.[1] && !cambioLiqCajaMap.has(match[1])) {
        cambioLiqCajaMap.set(match[1], cajaLblById.get(m.cajaId) ?? "—");
      }
    }
  }

  const fromCaja: MovDiarioRow[] = movCaja.map((m) => {
    const monto = new Decimal(m.monto.toString());
    let estado: EstadoMovDiario;

    if (m.confirmado) {
      estado = "LIQUIDADA";
    } else {
      const cubierto = coverageMap.get(m.id) ?? new Decimal(0);
      if (cubierto.lte(0)) {
        estado = "PENDIENTE";
      } else if (cubierto.gte(monto)) {
        estado = "LIQUIDADA";
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
      operador: extractOperador(m.descripcion),
      monto: monto.toNumber(),
      moneda: m.moneda,
      estado,
      impactoCC: false,
      clasificacionOperativa,
      subtipoOperativo,
      impactaResultado,
      cajaLabel: targetCajaLabel,
    };
  });

  const fromCambio: MovDiarioRow[] = opsCambio.map((op) => {
    const desc = op.descripcion ?? "";
    const esRevertida = desc.startsWith("[REVERTIDA");
    const esParcialTag = !esRevertida && !op.pendiente && desc.includes("[PARCIAL]");
    let estado: EstadoMovDiario;
    if (esRevertida) estado = "REVERTIDA";
    else if (op.pendiente) estado = "PENDIENTE";
    else if (esParcialTag) estado = "PARCIAL";
    else estado = "LIQUIDADA";

    return {
      id: op.id,
      fecha: op.fecha,
      cliente: op.clienteNombre ?? op.Cliente?.nombre ?? "—",
      tipo: TIPO_CAMBIO_MAP[op.tipo] ?? "CAMBIO",
      subTipo: op.tipo,
      origen: inferOrigenCambio(op.tipo),
      descripcion: cleanDesc(op.descripcion) || op.tipo.replace(/_/g, " "),
      operador: extractOperador(op.descripcion),
      monto: Number(op.cantidad.toString()),
      moneda: op.moneda,
      tc: Number(op.tipoCambio.toString()),
      totalARS: Number(op.totalARS.toString()),
      estado,
      impactoCC: desc.includes("[CC]"),
      clasificacionOperativa: "CAMBIO",
      subtipoOperativo: op.tipo,
      impactaResultado: true,
      cajaLabel: isPrincipalView ? cambioLiqCajaMap.get(op.id) : targetCajaLabel,
    };
  });

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

