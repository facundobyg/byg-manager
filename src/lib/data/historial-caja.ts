import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export interface HistorialMes {
  mes: string;
  saldoInicialUSD: number;
  ingresosUSD: number;
  egresosUSD: number;
  saldoFinalUSD: number;
  saldoInicialARS: number;
  ingresosARS: number;
  egresosARS: number;
  saldoFinalARS: number;
  tcBlue: number;
  totalEquivalenteUSD: number;
}

export async function getHistorialCajaMensual(): Promise<HistorialMes[]> {
  // 1. Buscar Caja Oficina / principal
  const caja = await prisma.caja.findFirst({
    where: {
      OR: [
        { esPrincipal: true },
        { slug: "oficina" },
        { label: { contains: "oficina", mode: "insensitive" } }
      ],
      activa: true
    }
  }) || await prisma.caja.findFirst({ where: { activa: true } });

  if (!caja) return [];

  // 2. Obtener movimientos confirmados
  const movs = await prisma.movimientoCaja.findMany({
    where: { cajaId: caja.id, confirmado: true },
    orderBy: { fecha: "asc" }
  });

  // 3. TC Blue
  const config = await prisma.config.findUnique({ where: { clave: "tc_blue" } });
  const tcBlue = new Decimal(config?.valor || "1000");

  // 4. Agrupar por mes
  const porMes: Record<string, { USD: { in: Decimal, out: Decimal }, ARS: { in: Decimal, out: Decimal } }> = {};

  for (const m of movs) {
    const mes = m.fecha.toISOString().slice(0, 7); // YYYY-MM
    if (!porMes[mes]) {
      porMes[mes] = {
        USD: { in: new Decimal(0), out: new Decimal(0) },
        ARS: { in: new Decimal(0), out: new Decimal(0) }
      };
    }
    const moneda = m.moneda as "USD" | "ARS" | "EUR" | "BRL";
    if (moneda !== "USD" && moneda !== "ARS") continue; // Por ahora solo trackeamos USD y ARS en el historial consolidado

    const monto = new Decimal(m.monto.toString());
    if (m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN") {
      porMes[mes][moneda].in = porMes[mes][moneda].in.plus(monto);
    } else {
      porMes[mes][moneda].out = porMes[mes][moneda].out.plus(monto);
    }
  }

  // 5. Procesar meses cronológicamente para arrastrar saldos
  const mesesSorted = Object.keys(porMes).sort();
  const historial: HistorialMes[] = [];

  let currentSaldoUSD = new Decimal(caja.saldoInicialUSD.toString());
  let currentSaldoARS = new Decimal(caja.saldoInicialARS.toString());

  for (const mes of mesesSorted) {
    const data = porMes[mes];
    const inicialUSD = currentSaldoUSD;
    const inicialARS = currentSaldoARS;

    const finalUSD = inicialUSD.plus(data.USD.in).minus(data.USD.out);
    const finalARS = inicialARS.plus(data.ARS.in).minus(data.ARS.out);

    const arsEnUSD = finalARS.div(tcBlue);
    const totalEqUSD = finalUSD.plus(arsEnUSD);

    historial.push({
      mes,
      saldoInicialUSD: inicialUSD.toNumber(),
      ingresosUSD: data.USD.in.toNumber(),
      egresosUSD: data.USD.out.toNumber(),
      saldoFinalUSD: finalUSD.toNumber(),
      saldoInicialARS: inicialARS.toNumber(),
      ingresosARS: data.ARS.in.toNumber(),
      egresosARS: data.ARS.out.toNumber(),
      saldoFinalARS: finalARS.toNumber(),
      tcBlue: tcBlue.toNumber(),
      totalEquivalenteUSD: totalEqUSD.toNumber(),
    });

    // Actualizar para el próximo mes
    currentSaldoUSD = finalUSD;
    currentSaldoARS = finalARS;
  }

  // Devolver en orden descendente (más reciente arriba)
  return historial.reverse();
}
