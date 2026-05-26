import { prisma } from "@/lib/prisma";

const VENTA_TIPOS_ARB = new Set([
  "VENTA_BONO", "VENTA_ACCION", "VENTA_CEDEAR", "CAUCION_COLOCADORA",
]);

// ── Arbitraje types ───────────────────────────────────────────────────────────

export type ArbitrajeOpRow = {
  id: string;
  tipoOperacion: string;
  ticker: string;
  cantidad: number;
  precio: number;
  valorBruto: number;
  moneda: string;
  estado: string;
  cuentaNombre: string;
  operadorNombre: string;
};

export type ArbitrajeGroup = {
  grupoId: string;
  fecha: Date;
  ops: ArbitrajeOpRow[];
  isClosed: boolean;
  resultadoARS: number;
  resultadoUSD: number;
};

// ── Mesa Diaria types ─────────────────────────────────────────────────────────

export type OpDiaRow = {
  id: string;
  tipoOperacion: string;
  ticker: string;
  cantidad: number;
  precio: number;
  moneda: string;
  estado: string;
  anulada: boolean;
  resultadoBruto: number | null;
  resultadoNeto: number | null;
  tcMepDia: number | null;
  tasaCaucion: number | null;
  diasCaucion: number | null;
  observaciones: string | null;
  carteraId: string | null;
  carteraNombre: string | null;
  comitenteId: string | null;
  comitenteNombre: string | null;
  comitenteNro: string | null;
  operadorNombre: string;
  grupoArbitrajeId: string | null;
};

export type GrupoPropias = {
  carteraId: string;
  carteraNombre: string;
  ops: OpDiaRow[];
  totalResultadoARS: number;
  totalResultadoUSD: number;
};

export type GrupoClientes = {
  comitenteId: string;
  comitenteNombre: string;
  nroComitente: string;
  ops: OpDiaRow[];
  totalResultadoARS: number;
  totalResultadoUSD: number;
};

export type MesaDiariaResult = {
  propias: GrupoPropias[];
  clientes: GrupoClientes[];
  resumen: {
    resultadoMesaARS: number;
    resultadoMesaUSD: number;
    totalPropias: number;
    totalClientes: number;
    pendientesRevision: number;
    totalAnuladas: number;
  };
};

export async function getOperacionesMesaDiaria(fecha: string): Promise<MesaDiariaResult> {
  const d = new Date(fecha + "T00:00:00.000Z");
  const dNext = new Date(d);
  dNext.setUTCDate(dNext.getUTCDate() + 1);

  const rows = await prisma.operacionBolsa.findMany({
    where: {
      fechaOperativa: { gte: d, lt: dNext },
    },
    orderBy: [{ grupoArbitrajeId: "asc" }, { fechaCarga: "asc" }],
    include: {
      Cartera:            { select: { id: true, nombre: true } },
      ComitenteInversion: { select: { id: true, nombre: true, nroComitente: true } },
      OperadorCarga:      { select: { id: true, name: true } },
    },
  });

  const propiaMap  = new Map<string, GrupoPropias>();
  const clienteMap = new Map<string, GrupoClientes>();

  for (const r of rows) {
    const row: OpDiaRow = {
      id:              r.id,
      tipoOperacion:   r.tipoOperacion,
      ticker:          r.ticker,
      cantidad:        Number(r.cantidad),
      precio:          Number(r.precio),
      moneda:          r.moneda,
      estado:          r.estado,
      anulada:         r.anulada,
      resultadoBruto:  r.resultadoBruto  !== null ? Number(r.resultadoBruto)  : null,
      resultadoNeto:   r.resultadoNeto   !== null ? Number(r.resultadoNeto)   : null,
      tcMepDia:        r.tcMepDia        !== null ? Number(r.tcMepDia)        : null,
      tasaCaucion:     r.tasaCaucion     !== null ? Number(r.tasaCaucion)     : null,
      diasCaucion:     r.diasCaucion,
      observaciones:   r.observaciones,
      carteraId:       r.carteraId,
      carteraNombre:   r.Cartera?.nombre ?? null,
      comitenteId:     r.comitenteId,
      comitenteNombre: r.ComitenteInversion?.nombre ?? null,
      comitenteNro:    r.ComitenteInversion?.nroComitente ?? null,
      operadorNombre:   r.OperadorCarga?.name ?? "—",
      grupoArbitrajeId: r.grupoArbitrajeId,
    };

    if (r.carteraId) {
      if (!propiaMap.has(r.carteraId)) {
        propiaMap.set(r.carteraId, {
          carteraId:         r.carteraId,
          carteraNombre:     r.Cartera?.nombre ?? r.carteraId,
          ops:               [],
          totalResultadoARS: 0,
          totalResultadoUSD: 0,
        });
      }
      const g = propiaMap.get(r.carteraId)!;
      g.ops.push(row);
      if (!r.anulada && r.estado === "CONCERTADA" && r.resultadoNeto !== null) {
        if (r.moneda === "ARS") g.totalResultadoARS += Number(r.resultadoNeto);
        else if (r.moneda === "USD") g.totalResultadoUSD += Number(r.resultadoNeto);
      }
    } else if (r.comitenteId) {
      if (!clienteMap.has(r.comitenteId)) {
        clienteMap.set(r.comitenteId, {
          comitenteId:       r.comitenteId,
          comitenteNombre:   r.ComitenteInversion?.nombre ?? r.comitenteId,
          nroComitente:      r.ComitenteInversion?.nroComitente ?? "—",
          ops:               [],
          totalResultadoARS: 0,
          totalResultadoUSD: 0,
        });
      }
      const g = clienteMap.get(r.comitenteId)!;
      g.ops.push(row);
      if (!r.anulada && r.estado === "CONCERTADA" && r.resultadoNeto !== null) {
        if (r.moneda === "ARS") g.totalResultadoARS += Number(r.resultadoNeto);
        else if (r.moneda === "USD") g.totalResultadoUSD += Number(r.resultadoNeto);
      }
    }
  }

  // Resultado mesa: suma de resultadoNeto de todas las ops CONCERTADAS
  // + arbitrajes cerrados sin resultadoNeto (fallback a valor calculado)
  let resultadoMesaARS = 0;
  let resultadoMesaUSD = 0;

  const arbGroupMap = new Map<string, typeof rows>();
  for (const r of rows) {
    if (r.anulada || r.estado === "ANULADA") continue;
    // Ops con resultadoNeto explícito (ingresado por operador)
    if (r.estado === "CONCERTADA" && r.resultadoNeto !== null && !r.grupoArbitrajeId) {
      if (r.moneda === "ARS") resultadoMesaARS += Number(r.resultadoNeto);
      else if (r.moneda === "USD") resultadoMesaUSD += Number(r.resultadoNeto);
      continue;
    }
    // Agrupar arbitrajes para calcular resultado por diferencial
    if (r.grupoArbitrajeId) {
      if (!arbGroupMap.has(r.grupoArbitrajeId)) arbGroupMap.set(r.grupoArbitrajeId, []);
      arbGroupMap.get(r.grupoArbitrajeId)!.push(r);
    }
  }
  Array.from(arbGroupMap.values()).forEach((groupRows) => {
    const allClosed = groupRows.every((r) => r.estado !== "PENDIENTE_CONCERTACION");
    if (!allClosed) return;
    for (const r of groupRows) {
      const valor = Number(r.cantidad) * Number(r.precio);
      const sign  = VENTA_TIPOS_ARB.has(r.tipoOperacion) ? 1 : -1;
      if (r.moneda === "ARS") resultadoMesaARS += sign * valor;
      else if (r.moneda === "USD") resultadoMesaUSD += sign * valor;
    }
  });

  const propias  = Array.from(propiaMap.values());
  const clientes = Array.from(clienteMap.values());
  const pendientesRevision = rows.filter((r) => r.estado === "PENDIENTE_CONCERTACION").length;
  const totalAnuladas      = rows.filter((r) => r.anulada).length;

  return {
    propias,
    clientes,
    resumen: {
      resultadoMesaARS,
      resultadoMesaUSD,
      totalPropias:      propias.reduce((s, g)  => s + g.ops.length, 0),
      totalClientes:     clientes.reduce((s, g) => s + g.ops.length, 0),
      pendientesRevision,
      totalAnuladas,
    },
  };
}

// ── Historial ─────────────────────────────────────────────────────────────────

export async function getOperacionesBolsa(mes?: string) {
  const fechaWhere = mes
    ? (() => {
        const [y, m] = mes.split("-").map(Number);
        return {
          fechaOperativa: {
            gte: new Date(Date.UTC(y, m - 1, 1)),
            lt:  new Date(Date.UTC(y, m, 1)),
          },
        };
      })()
    : {};

  return prisma.operacionBolsa.findMany({
    where: { ...fechaWhere },
    orderBy: mes
      ? [{ fechaOperativa: "asc" }, { fechaCarga: "asc" }]
      : { fechaCarga: "desc" },
    ...(mes ? {} : { take: 300 }),
    include: {
      Cliente:            { select: { id: true, nombre: true } },
      ComitenteInversion: { select: { id: true, nombre: true } },
      Cartera:            { select: { id: true, nombre: true } },
      OperadorCarga:      { select: { id: true, name: true } },
    },
  });
}

export async function getOperacionBolsaById(id: string) {
  return prisma.operacionBolsa.findUnique({
    where: { id },
    include: {
      Cliente:           { select: { id: true, nombre: true } },
      Cartera:           { select: { id: true, nombre: true } },
      ComitenteInversion:{ select: { id: true, nombre: true } },
      OperadorCarga:     { select: { id: true, name: true } },
      OperadorCierre:    { select: { id: true, name: true } },
      OperacionBolsaLog: {
        orderBy: { createdAt: "desc" },
        include: { User: { select: { name: true } } },
      },
    },
  });
}

// ── Arbitrajes ────────────────────────────────────────────────────────────────

export async function getArbitrajesData(): Promise<ArbitrajeGroup[]> {
  const ops = await prisma.operacionBolsa.findMany({
    where:   { grupoArbitrajeId: { not: null }, anulada: false },
    orderBy: [{ grupoArbitrajeId: "asc" }, { fechaCarga: "asc" }],
    include: {
      Cartera:            { select: { nombre: true } },
      ComitenteInversion: { select: { nombre: true, nroComitente: true } },
      OperadorCarga:      { select: { name: true } },
    },
  });

  const groupMap = new Map<string, typeof ops>();
  for (const op of ops) {
    const gid = op.grupoArbitrajeId!;
    if (!groupMap.has(gid)) groupMap.set(gid, []);
    groupMap.get(gid)!.push(op);
  }

  const result: ArbitrajeGroup[] = [];
  Array.from(groupMap.entries()).forEach(([grupoId, groupOps]) => {
    const isClosed = groupOps.every((op) => op.estado !== "PENDIENTE_CONCERTACION");
    let resultadoARS = 0;
    let resultadoUSD = 0;
    for (const op of groupOps) {
      const valor = Number(op.cantidad) * Number(op.precio);
      const sign  = VENTA_TIPOS_ARB.has(op.tipoOperacion) ? 1 : -1;
      if (op.moneda === "ARS") resultadoARS += sign * valor;
      else if (op.moneda === "USD") resultadoUSD += sign * valor;
    }
    const fecha = groupOps.reduce(
      (min: Date, op) => (op.fechaCarga < min ? op.fechaCarga : min),
      groupOps[0].fechaCarga,
    );
    result.push({
      grupoId,
      fecha,
      isClosed,
      resultadoARS,
      resultadoUSD,
      ops: groupOps.map((op) => ({
        id:            op.id,
        tipoOperacion: op.tipoOperacion,
        ticker:        op.ticker,
        cantidad:      Number(op.cantidad),
        precio:        Number(op.precio),
        valorBruto:    Number(op.cantidad) * Number(op.precio),
        moneda:        op.moneda,
        estado:        op.estado,
        cuentaNombre:  op.ComitenteInversion
          ? `${op.ComitenteInversion.nombre} (${op.ComitenteInversion.nroComitente})`
          : (op.Cartera?.nombre ?? "—"),
        operadorNombre: op.OperadorCarga?.name ?? "—",
      })),
    });
  });

  return result.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
}
