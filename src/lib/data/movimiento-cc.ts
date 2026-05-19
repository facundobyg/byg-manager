import { prisma } from "@/lib/prisma";

export interface MovimientoOperacionRow {
  id: string;
  fecha: Date;
  clienteId: string;
  clienteNombre: string;
  moneda: string;
  monto: number;
  descripcion: string | null;
  tipo: string;
  tipoOperacion: string;
  operationRef: string | null;
  cuentaId: string;
}

export interface LedgerRow {
  operationRef: string | null;
  fecha: Date;
  clienteId: string;
  clienteNombre: string;
  tipoOperacion: string;
  descripcion: string;
  cantidadMovimientos: number;
  montoPrincipal: number;
  moneda: string;
  revertida: boolean;
  generoPlazoFijo: boolean;
  plazoFijoId: string | null;
  pfRevertido: boolean;
}

function cleanDesc(d: string | null): string {
  if (!d) return "—";
  return d.replace(/\s*\|\s*op:[a-zA-Z0-9-]+/, "").replace(/\s*\|\s*ref:[a-zA-Z0-9-]+/, "").trim();
}

export async function getRecentOperacionMovimientos(): Promise<LedgerRow[]> {
  const movs = await prisma.movimientoCC.findMany({
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      CuentaCorriente: { include: { Cliente: true } },
    },
  });

  const byRef = new Map<string, typeof movs>();
  const noRef: typeof movs = [];

  for (const m of movs) {
    const refMatch = m.descripcion?.match(/op:([a-zA-Z0-9-]+)/);
    const ref = refMatch?.[1] ?? null;
    if (ref) {
      const group = byRef.get(ref) ?? [];
      group.push(m);
      byRef.set(ref, group);
    } else {
      noRef.push(m);
    }
  }

  // Find all LP refs to resolve linked plazo fijo records
  const lpRefs: string[] = [];
  for (const [ref, group] of Array.from(byRef.entries())) {
    const primary = group.find((m) => m.tipo === "INGRESO") ?? group[0];
    const tipoOperacion = primary.descripcion?.split(" ")[0]?.toUpperCase() ?? "MOV";
    if (tipoOperacion === "LP") lpRefs.push(ref);
  }

  const pfByRef = new Map<string, string>();
  if (lpRefs.length > 0) {
    const pfs = await prisma.plazoFijo.findMany({
      where: { notas: { contains: "op:" } },
      select: { id: true, notas: true },
    });
    for (const pf of pfs) {
      const match = pf.notas?.match(/op:([a-zA-Z0-9-]+)/);
      if (match?.[1] && lpRefs.includes(match[1])) {
        pfByRef.set(match[1], pf.id);
      }
    }
  }

  const ledger: LedgerRow[] = [];

  for (const [ref, group] of Array.from(byRef.entries())) {
    const primary = group.find((m) => m.tipo === "INGRESO") ?? group[0];
    const revertida = group.some((m) => m.descripcion?.includes("REVERSO"));
    const latestFecha = group.reduce((l, m) => (m.fecha > l ? m.fecha : l), group[0].fecha);
    const tipoOperacion = primary.descripcion?.split(" ")[0]?.toUpperCase() ?? "MOV";
    const plazoFijoId = pfByRef.get(ref) ?? null;

    ledger.push({
      operationRef: ref,
      fecha: latestFecha,
      clienteId: primary.CuentaCorriente.Cliente.id,
      clienteNombre: primary.CuentaCorriente.Cliente.nombre,
      tipoOperacion,
      descripcion: cleanDesc(primary.descripcion),
      cantidadMovimientos: group.length,
      montoPrincipal: Number(primary.monto.toString()),
      moneda: primary.CuentaCorriente.moneda,
      revertida,
      generoPlazoFijo: plazoFijoId !== null,
      plazoFijoId,
      pfRevertido: tipoOperacion === "LP" && revertida && plazoFijoId !== null,
    });
  }

  for (const m of noRef) {
    const tipoOperacion = m.descripcion?.split(" ")[0]?.toUpperCase() ?? "MOV";
    ledger.push({
      operationRef: null,
      fecha: m.fecha,
      clienteId: m.CuentaCorriente.Cliente.id,
      clienteNombre: m.CuentaCorriente.Cliente.nombre,
      tipoOperacion,
      descripcion: cleanDesc(m.descripcion),
      cantidadMovimientos: 1,
      montoPrincipal: Number(m.monto.toString()),
      moneda: m.CuentaCorriente.moneda,
      revertida: false,
      generoPlazoFijo: false,
      plazoFijoId: null,
      pfRevertido: false,
    });
  }

  return ledger.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
}

export interface ResumenOperacionesCliente {
  clienteId: string;
  clienteNombre: string;
  totalOperaciones: number;
  activas: number;
  revertidas: number;
  totalRulo: number;
  totalDivisa: number;
  totalLP: number;
  totalInteres: number;
  totalTransferencia: number;
  montoTotalMovido: number;
}

export async function getResumenOperacionesPorCliente(): Promise<ResumenOperacionesCliente[]> {
  const ledger = await getRecentOperacionMovimientos();

  const map = new Map<string, ResumenOperacionesCliente>();

  for (const row of ledger) {
    const key = row.clienteId;
    if (!map.has(key)) {
      map.set(key, {
        clienteId: row.clienteId,
        clienteNombre: row.clienteNombre,
        totalOperaciones: 0,
        activas: 0,
        revertidas: 0,
        totalRulo: 0,
        totalDivisa: 0,
        totalLP: 0,
        totalInteres: 0,
        totalTransferencia: 0,
        montoTotalMovido: 0,
      });
    }
    const entry = map.get(key)!;
    entry.totalOperaciones++;
    if (row.revertida) entry.revertidas++;
    else entry.activas++;

    const monto = row.montoPrincipal;
    entry.montoTotalMovido += monto;

    switch (row.tipoOperacion) {
      case "RULO": entry.totalRulo++; break;
      case "DIVISA": entry.totalDivisa++; break;
      case "LP": entry.totalLP++; break;
      case "INTERES": entry.totalInteres++; break;
      case "TRANSFERENCIA": entry.totalTransferencia++; break;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalOperaciones - a.totalOperaciones);
}

export async function getMovimientosByOperationRef(operationRef: string) {
  return prisma.movimientoCC.findMany({
    where: {
      descripcion: { contains: `op:${operationRef}` },
    },
    include: {
      CuentaCorriente: true,
    },
  });
}

export async function getMovimientosCuentaCorriente(cuentaId: string) {
  return prisma.cuentaCorriente.findUnique({
    where: { id: cuentaId },
    include: {
      Cliente: true,
      MovimientoCC: {
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      },
    },
  });
}
