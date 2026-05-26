import "server-only";
import { prisma } from "@/lib/prisma";
import { EstadoComision, ProductorInversion, TipoOperacionCambio } from "@prisma/client";

export type LineaComision = {
  id: string;
  fecha: Date;
  clienteNombre: string;
  modulo: "bolsa" | "cambio";
  descripcion: string;
  comisionFijaARS: number;
  comisionUSD: number;
  baseTotalUSD: number;
  comisionProductorUSD: number;
  sinBase: boolean;
};

export type ProductorMesData = {
  productor: { id: string; nombre: string; porcentaje: number };
  comisionMesId: string | null;
  estado: EstadoComision;
  lineas: LineaComision[];
  totalBaseUSD: number;
  totalComisionUSD: number;
};

function mesRango(mes: string): [Date, Date] {
  const [y, m] = mes.split("-").map(Number);
  return [new Date(Date.UTC(y, m - 1, 1)), new Date(Date.UTC(y, m, 1))];
}

const TIPOS_COMISION: TipoOperacionCambio[] = [
  "HONORARIO_CLIENTE",
  "HONORARIO_EXTERNO",
  "COMISION",
];

const PRODUCTOR_ENUM_MAP: Record<string, ProductorInversion> = {
  IPS: ProductorInversion.IPS,
  BYG: ProductorInversion.BYG,
  OTRO: ProductorInversion.OTRO,
};

export async function getResumenComisiones(mes: string): Promise<ProductorMesData[]> {
  const [desde, hasta] = mesRango(mes);

  // comisionMes may not be available if Prisma Client was generated before the migration
  // (dev server hot-reload keeps old instance in globalThis). Restart dev server to fix permanently.
  let estadosMesRaw: Array<{ id: string; productorId: string; mes: string; estado: EstadoComision }> = [];
  try {
    estadosMesRaw = await prisma.comisionMes.findMany({ where: { mes } });
  } catch {
    // falls through with empty array — state tracking unavailable until server restart
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(prisma as any).productor) return [];

  const [productores, tcConfig] = await Promise.all([
    prisma.productor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);
  const estadosMes = estadosMesRaw;

  const tc = Number(tcConfig?.valor ?? "1000");
  const estadoMap = new Map(estadosMes.map((e) => [e.productorId, e]));
  const results: ProductorMesData[] = [];

  for (const prod of productores) {
    const pct = Number(prod.porcentaje);
    const lineas: LineaComision[] = [];

    // ── 1. Bolsa ops via comitente.productor (comitente attribution takes precedence) ──
    const enumVal = PRODUCTOR_ENUM_MAP[prod.nombre.toUpperCase()];
    if (enumVal && enumVal !== ProductorInversion.BYG) {
      const ops = await prisma.operacionBolsa.findMany({
        where: {
          fechaOperativa: { gte: desde, lt: hasta },
          anulada: false,
          ComitenteInversion: { productor: enumVal },
        },
        include: {
          Cliente: { select: { nombre: true } },
          ComitenteInversion: { select: { nombre: true } },
        },
        orderBy: { fechaOperativa: "asc" },
      });

      for (const op of ops) {
        const comFijaARS = Number(op.comisionFija ?? 0);
        const comUSD = Number(op.comisionUSD ?? 0);
        const senebi = op.esSenebi ? Number(op.senebiBruto ?? 0) : 0;
        const baseUSD = comFijaARS / tc + comUSD + senebi / tc;
        lineas.push({
          id: op.id,
          fecha: op.fechaOperativa ?? op.fechaCarga,
          clienteNombre: op.Cliente?.nombre ?? op.ComitenteInversion?.nombre ?? "—",
          modulo: "bolsa",
          descripcion: `${op.tipoOperacion} ${op.ticker}`,
          comisionFijaARS: comFijaARS,
          comisionUSD: comUSD + senebi / tc,
          baseTotalUSD: baseUSD,
          comisionProductorUSD: baseUSD * pct / 100,
          sinBase: comFijaARS === 0 && comUSD === 0 && senebi === 0,
        });
      }
    }

    // ── 2. Client-assigned ops (only direct ops without comitente) ──
    const clientRows = await prisma.cliente.findMany({
      where: { productorId: prod.id, activo: true },
      select: { id: true, nombre: true },
    });

    if (clientRows.length > 0) {
      const idSet = clientRows.map((c) => c.id);
      const nomMap = new Map(clientRows.map((c) => [c.id, c.nombre]));

      const opsBolsa = await prisma.operacionBolsa.findMany({
        where: {
          fechaOperativa: { gte: desde, lt: hasta },
          anulada: false,
          clienteId: { in: idSet },
          comitenteId: null, // comitente-based ops already handled above
        },
        orderBy: { fechaOperativa: "asc" },
      });

      for (const op of opsBolsa) {
        const comFijaARS = Number(op.comisionFija ?? 0);
        const comUSD = Number(op.comisionUSD ?? 0);
        const senebi = op.esSenebi ? Number(op.senebiBruto ?? 0) : 0;
        const baseUSD = comFijaARS / tc + comUSD + senebi / tc;
        lineas.push({
          id: op.id,
          fecha: op.fechaOperativa ?? op.fechaCarga,
          clienteNombre: nomMap.get(op.clienteId ?? "") ?? "—",
          modulo: "bolsa",
          descripcion: `${op.tipoOperacion} ${op.ticker}`,
          comisionFijaARS: comFijaARS,
          comisionUSD: comUSD,
          baseTotalUSD: baseUSD,
          comisionProductorUSD: baseUSD * pct / 100,
          sinBase: comFijaARS === 0 && comUSD === 0 && senebi === 0,
        });
      }

      const opsCambio = await prisma.operacionCambio.findMany({
        where: {
          fecha: { gte: desde, lt: hasta },
          clienteId: { in: idSet },
          tipo: { in: TIPOS_COMISION },
        },
        orderBy: { fecha: "asc" },
      });

      for (const op of opsCambio) {
        const cobroUSD = Number(op.cobroUSD ?? 0);
        const cobroARS = Number(op.cobroARS ?? 0);
        const baseUSD = cobroUSD + cobroARS / tc;
        lineas.push({
          id: op.id,
          fecha: op.fecha,
          clienteNombre: nomMap.get(op.clienteId ?? "") ?? op.clienteNombre ?? "—",
          modulo: "cambio",
          descripcion: op.tipo + (op.descripcion ? ` — ${op.descripcion}` : ""),
          comisionFijaARS: cobroARS,
          comisionUSD: cobroUSD,
          baseTotalUSD: baseUSD,
          comisionProductorUSD: baseUSD * pct / 100,
          sinBase: baseUSD === 0,
        });
      }
    }

    lineas.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    const totalBaseUSD = lineas.reduce((s, l) => s + l.baseTotalUSD, 0);
    const estadoRec = estadoMap.get(prod.id);

    results.push({
      productor: { id: prod.id, nombre: prod.nombre, porcentaje: pct },
      comisionMesId: estadoRec?.id ?? null,
      estado: estadoRec?.estado ?? EstadoComision.PENDIENTE,
      lineas,
      totalBaseUSD,
      totalComisionUSD: totalBaseUSD * pct / 100,
    });
  }

  return results;
}
