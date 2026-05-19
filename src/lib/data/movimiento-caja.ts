import { prisma } from "@/lib/prisma";
import { MovimientoCaja } from "@prisma/client";

export type EstadoVisual = "CONFIRMADO" | "PENDIENTE" | "PARCIAL";
export type CategoriaOperativa = "URGENCIA" | "ADELANTO" | "NORMAL";

export interface MovimientoCajaRow extends MovimientoCaja {
  estadoVisual: EstadoVisual;
  montoTotal: number;
  montoCubierto: number;
  montoPendiente: number;
  categoriaOperativa: CategoriaOperativa;
}

export function derivarCategoriaOperativa(desc: string | null): CategoriaOperativa {
  const d = (desc ?? "").toLowerCase();
  if (d.includes("urgencia") || d.includes("urgente")) return "URGENCIA";
  if (d.includes("adelanto")) return "ADELANTO";
  return "NORMAL";
}

export async function getMovimientosByCaja(slug: string) {
  const caja = await prisma.caja.findUnique({
    where: { slug },
    include: {
      MovimientoCaja: {
        orderBy: { fecha: "desc" },
        take: 100,
      },
    },
  });

  if (!caja) return null;

  // Build coverage map: originalId -> total covered amount
  const coverageMap = new Map<string, number>();
  for (const m of caja.MovimientoCaja) {
    if (!m.confirmado || !m.descripcion) continue;
    const match = m.descripcion.match(/^COBERTURA PARCIAL ([a-zA-Z0-9-]+)/);
    if (match?.[1]) {
      const prev = coverageMap.get(match[1]) ?? 0;
      coverageMap.set(match[1], prev + parseFloat(m.monto.toString()));
    }
  }

  // Coverage movements themselves should not appear as standalone pending rows
  const coverageIds = new Set<string>();
  for (const m of caja.MovimientoCaja) {
    if (m.descripcion?.match(/^COBERTURA PARCIAL /)) coverageIds.add(m.id);
  }

  const movimientos: MovimientoCajaRow[] = caja.MovimientoCaja
    .filter((m) => !coverageIds.has(m.id))
    .map((m) => {
      const montoTotal = parseFloat(m.monto.toString());
      const categoriaOperativa = derivarCategoriaOperativa(m.descripcion);

      if (m.confirmado) {
        return { ...m, estadoVisual: "CONFIRMADO" as EstadoVisual, montoTotal, montoCubierto: montoTotal, montoPendiente: 0, categoriaOperativa };
      }

      const montoCubierto = coverageMap.get(m.id) ?? 0;
      const montoPendiente = Math.max(0, montoTotal - montoCubierto);
      const estadoVisual: EstadoVisual =
        montoPendiente <= 0 ? "CONFIRMADO" : montoCubierto > 0 ? "PARCIAL" : "PENDIENTE";

      return { ...m, estadoVisual, montoTotal, montoCubierto, montoPendiente, categoriaOperativa };
    });

  return {
    ...caja,
    movimientos,
    confirmados: movimientos.filter((m) => m.estadoVisual === "CONFIRMADO"),
    pendientes: movimientos.filter((m) => m.estadoVisual !== "CONFIRMADO"),
  };
}
