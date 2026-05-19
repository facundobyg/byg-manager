import { prisma } from "@/lib/prisma";

// ── Mesa Diaria types ─────────────────────────────────────────────────────────

export type OpDiaRow = {
  id: string;
  tipoOperacion: string;
  ticker: string;
  cantidad: number;
  precio: number;
  moneda: string;
  estado: string;
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
  };
};

export async function getOperacionesMesaDiaria(fecha: string): Promise<MesaDiariaResult> {
  const d = new Date(fecha + "T00:00:00.000Z");
  const dNext = new Date(d);
  dNext.setUTCDate(dNext.getUTCDate() + 1);

  const rows = await prisma.operacionBolsa.findMany({
    where: {
      fechaOperativa: { gte: d, lt: dNext },
      anulada: false,
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
          carteraId:       r.carteraId,
          carteraNombre:   r.Cartera?.nombre ?? r.carteraId,
          ops:             [],
          totalResultadoARS: 0,
          totalResultadoUSD: 0,
        });
      }
      const g = propiaMap.get(r.carteraId)!;
      g.ops.push(row);
      const resultado = row.resultadoNeto ?? row.resultadoBruto ?? 0;
      if (r.moneda === "ARS") g.totalResultadoARS += resultado;
      else if (r.moneda === "USD") g.totalResultadoUSD += resultado;
    } else if (r.comitenteId) {
      if (!clienteMap.has(r.comitenteId)) {
        clienteMap.set(r.comitenteId, {
          comitenteId:     r.comitenteId,
          comitenteNombre: r.ComitenteInversion?.nombre ?? r.comitenteId,
          nroComitente:    r.ComitenteInversion?.nroComitente ?? "—",
          ops:             [],
          totalResultadoARS: 0,
          totalResultadoUSD: 0,
        });
      }
      const g = clienteMap.get(r.comitenteId)!;
      g.ops.push(row);
      const resultado = row.resultadoNeto ?? row.resultadoBruto ?? 0;
      if (r.moneda === "ARS") g.totalResultadoARS += resultado;
      else if (r.moneda === "USD") g.totalResultadoUSD += resultado;
    }
  }

  const propias  = Array.from(propiaMap.values());
  const clientes = Array.from(clienteMap.values());

  const resultadoMesaARS = [...propias, ...clientes].reduce((s, g) => s + g.totalResultadoARS, 0);
  const resultadoMesaUSD = [...propias, ...clientes].reduce((s, g) => s + g.totalResultadoUSD, 0);
  const pendientesRevision = rows.filter((r) => r.estado === "PENDIENTE_CONCERTACION").length;

  return {
    propias,
    clientes,
    resumen: {
      resultadoMesaARS,
      resultadoMesaUSD,
      totalPropias:      propias.reduce((s, g)  => s + g.ops.length, 0),
      totalClientes:     clientes.reduce((s, g) => s + g.ops.length, 0),
      pendientesRevision,
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
