import { prisma } from "@/lib/prisma";
import { calcularSaldoCaja } from "@/lib/services/caja.service";

export interface TopbarSummary {
  allCajas: { id: string; label: string; usd: number; ars: number }[];
  cajaOficina: { label: string; usd: number; ars: number } | null;
  cajaTrenque: { label: string; usd: number; ars: number } | null;
  totalUSD: number;
  totalARS: number;
  pendientesCount: number;
  opsDiaCount: number;
}

export async function getTopbarOperationalSummary(): Promise<TopbarSummary> {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const end = new Date(start.getTime() + 86_400_000);

  const [cajas, pendientesCount, opsDiaCount] = await Promise.all([
    prisma.caja.findMany({ where: { activa: true }, orderBy: { orden: "asc" } }),
    prisma.operacionCambio.count({ where: { pendiente: true } }),
    prisma.operacionCambio.count({ where: { fecha: { gte: start, lt: end } } }),
  ]);

  const cajasConSaldos = await Promise.all(
    cajas.map(async (c) => {
      const [usd, ars] = await Promise.all([
        calcularSaldoCaja(c.id, "USD"),
        calcularSaldoCaja(c.id, "ARS"),
      ]);
      return {
        id: c.id,
        label: c.label,
        slug: c.slug ?? "",
        esPrincipal: c.esPrincipal,
        usd: Number(usd),
        ars: Number(ars),
      };
    })
  );

  const oficina = cajasConSaldos.find(c => c.esPrincipal || c.slug === "oficina") ?? null;
  const trenque = cajasConSaldos.find(c => c.slug.includes("trenque")) ?? null;
  const totalUSD = cajasConSaldos.reduce((s, c) => s + c.usd, 0);
  const totalARS = cajasConSaldos.reduce((s, c) => s + c.ars, 0);

  return {
    allCajas: cajasConSaldos.map(c => ({ id: c.id, label: c.label, usd: c.usd, ars: c.ars })),
    cajaOficina: oficina ? { label: oficina.label, usd: oficina.usd, ars: oficina.ars } : null,
    cajaTrenque: trenque ? { label: trenque.label, usd: trenque.usd, ars: trenque.ars } : null,
    totalUSD,
    totalARS,
    pendientesCount,
    opsDiaCount,
  };
}
