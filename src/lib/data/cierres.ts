import "server-only";
import { prisma } from "@/lib/prisma";
import { getUtilidadMes, getAperturaMoneda } from "./reportes-ejecutivo";
import { getResumenComisiones } from "./comisiones";
import { getPatrimonioNeto } from "@/lib/finance";
import type { Quality, QualityReason } from "@/lib/finance/quality";

export type SnapshotData = {
  // Snapshots previos a MACRO 2 traen números; los nuevos pueden traer null
  // (cifra INCOMPLETA) y siempre traen calidad + motivos.
  utilidad: {
    mes: string;
    cambioUSD: number | null;
    arbitrajesARS: number;
    arbitrajesUSD: number;
    ingresosARS: number | null;
    egresosARS: number | null;
    ingresosItems: { label: string; montoARS: number | null }[];
    egresosItems: { label: string; montoARS: number | null }[];
    utilidadTotalUSD: number | null;
    tcBlue: number | null;
    ingresosUSD?: number | null;
    egresosUSD?: number | null;
    arbitrajesUSDEquiv?: number | null;
    quality?: Quality;
    qualityReasons?: QualityReason[];
    knownSubtotalUSD?: number;
  };
  /**
   * MACRO 2 — Cortes temporales explícitos. El resultado es el del motor canónico
   * para [desde, hasta) con TC de la fecha de cada hecho. El PN es el del motor
   * al momento de cerrar (Carteras/CC/PF no tienen historial: no es el PN al fin
   * de mes). Congelar el PN a fin de mes y bloquear el período → Macro 10.
   */
  corte?: { resultadoDesde: string; resultadoHasta: string; tcFecha: string; calculadoEn: string };
  patrimonio?: {
    corte: string; esCorteActual: boolean; pnUSD: number | null; activoUSD: number | null; pasivoUSD: number | null;
    quality: Quality; qualityReasons: QualityReason[]; knownSubtotalUSD: number;
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
  const [utilidad, comisiones, apertura, pn] = await Promise.all([
    getUtilidadMes(mes),
    getResumenComisiones(mes),
    getAperturaMoneda(),
    getPatrimonioNeto(),
  ]);
  return {
    utilidad: {
      mes: utilidad.mes, cambioUSD: utilidad.cambioUSD, arbitrajesARS: utilidad.arbitrajesARS, arbitrajesUSD: utilidad.arbitrajesUSD,
      ingresosARS: utilidad.ingresosARS, egresosARS: utilidad.egresosARS,
      ingresosItems: utilidad.ingresosItems, egresosItems: utilidad.egresosItems,
      utilidadTotalUSD: utilidad.utilidadTotalUSD, tcBlue: utilidad.tcBlue,
      ingresosUSD: utilidad.ingresosUSD, egresosUSD: utilidad.egresosUSD, arbitrajesUSDEquiv: utilidad.arbitrajesUSDEquiv,
      quality: utilidad.quality, qualityReasons: utilidad.qualityReasons, knownSubtotalUSD: utilidad.knownSubtotalUSD,
    },
    corte: { resultadoDesde: utilidad.corte.desde, resultadoHasta: utilidad.corte.hasta, tcFecha: utilidad.corte.tcFecha, calculadoEn: new Date().toISOString() },
    patrimonio: {
      corte: pn.corte, esCorteActual: pn.esCorteActual, pnUSD: pn.pnUSD, activoUSD: pn.activoUSD, pasivoUSD: pn.pasivoUSD,
      quality: pn.quality, qualityReasons: pn.qualityReasons, knownSubtotalUSD: pn.knownSubtotalUSD,
    },
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
