// Client-safe: types and pure utilities only — no server-only, no Prisma

export function normalizarNombreCliente(nombre: string): string {
  return nombre.trim().toLowerCase().replace(/\s+/g, " ");
}

export type TipoMovDiario = "INGRESO" | "EGRESO" | "CAMBIO";
export type EstadoMovDiario = "COBRADO" | "PENDIENTE" | "PARCIAL";
export type OrigenMovDiario = "CAMBIO" | "MOV_MANUAL" | "INGRESO_EXTRA" | "EGRESO_EXTRA";

export interface MovDiarioRow {
  id: string;
  fecha: Date;
  cliente: string;
  tipo: TipoMovDiario;
  subTipo?: string;
  origen: OrigenMovDiario;
  descripcion: string;
  monto: number;
  moneda: string;
  tc?: number;
  totalARS?: number;
  estado: EstadoMovDiario;
  impactoCC: boolean;
  clasificacionOperativa: "RESULTADO_OPERATIVO" | "MOVIMIENTO_CAJA" | "CAMBIO";
  subtipoOperativo?: string;
  impactaResultado: boolean;
}

export function agruparPorCliente(rows: MovDiarioRow[]) {
  return rows.reduce((acc, row) => {
    const key = normalizarNombreCliente(row.cliente) || "SIN_CLIENTE";

    if (!acc[key]) {
      acc[key] = {
        cliente: row.cliente || "SIN_CLIENTE",
        totalUSD: 0,
        totalARS: 0,
        operaciones: [],
      };
    }

    acc[key].operaciones.push(row);

    if (row.moneda === "USD") {
      acc[key].totalUSD += Number(row.monto || 0);
    } else if (row.moneda === "ARS") {
      acc[key].totalARS += Number(row.monto || 0);
    }

    if (row.tipo === "CAMBIO") {
      const isCompra = row.subTipo?.startsWith("COMPRA");
      const montoUSD = row.moneda === "USD" ? Number(row.monto || 0) : 0;
      const montoARS = Number(row.totalARS || 0);

      if (isCompra) {
        acc[key].totalARS -= montoARS;
      } else {
        if (row.moneda === "USD") acc[key].totalUSD -= montoUSD * 2;
        acc[key].totalARS += montoARS;
      }
    }

    return acc;
  }, {} as Record<string, { cliente: string; totalUSD: number; totalARS: number; operaciones: MovDiarioRow[] }>);
}
