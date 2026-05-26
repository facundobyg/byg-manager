import "server-only";
import { prisma } from "@/lib/prisma";
import { getUtilidadMes, getAperturaMoneda } from "./reportes-ejecutivo";
import { getResumenComisiones } from "./comisiones";

export type SnapshotData = {
  utilidad: {
    mes: string;
    cambioUSD: number;
    arbitrajesARS: number;
    arbitrajesUSD: number;
    ingresosARS: number;
    egresosARS: number;
    ingresosItems: { label: string; montoARS: number }[];
    egresosItems: { label: string; montoARS: number }[];
    utilidadTotalUSD: number;
    tcBlue: number;
  };
  comisiones: {
    productor: { id: string; nombre: string; porcentaje: number };
    comisionMesId: string | null;
    estado: string;
    lineasCount: number;
    totalBaseUSD: number;
    totalComisionUSD: number;
  }[];
  apertura: {
    usdDisponible: number;
    usdActivos: number;
    usdNeto: number;
    usdDeuda: number;
    arsNeto: number;
    pfClientesUSD: number;
    pfClientesARS: number;
    custodiaUSD: number;
    tcBlue: number;
  };
};

export async function buildSnapshotData(mes: string): Promise<SnapshotData> {
  const [utilidad, comisiones, apertura] = await Promise.all([
    getUtilidadMes(mes),
    getResumenComisiones(mes),
    getAperturaMoneda(),
  ]);
  return {
    utilidad,
    comisiones: comisiones.map((c) => ({
      productor: {
        id:         c.productor.id,
        nombre:     c.productor.nombre,
        porcentaje: c.productor.porcentaje,
      },
      comisionMesId:    c.comisionMesId,
      estado:           String(c.estado),
      lineasCount:      c.lineas.length,
      totalBaseUSD:     c.totalBaseUSD,
      totalComisionUSD: c.totalComisionUSD,
    })),
    apertura: {
      usdDisponible: apertura.usdDisponible,
      usdActivos:    apertura.usdActivos,
      usdNeto:       apertura.usdNeto,
      usdDeuda:      apertura.usdDeuda,
      arsNeto:       apertura.arsNeto,
      pfClientesUSD: apertura.pfClientesUSD,
      pfClientesARS: apertura.pfClientesARS,
      custodiaUSD:   apertura.custodiaUSD,
      tcBlue:        apertura.tcBlue,
    },
  };
}

export async function getCierres() {
  return prisma.cierreMensual.findMany({
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
    include: { User: { select: { name: true } } },
  });
}

export async function getCierre(mes: string) {
  return prisma.cierreMensual.findUnique({
    where: { mes },
    include: { Snapshots: { orderBy: { createdAt: "asc" } } },
  });
}
