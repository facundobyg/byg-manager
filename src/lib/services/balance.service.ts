import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { getTCBlue } from "./config.service";

export async function getBalanceGeneral() {
  const [cajas, configTC] = await Promise.all([
    prisma.caja.findMany({ where: { activa: true } }),
    getTCBlue()
  ]);

  // Fallback seguro si no hay TC configurado
  const tcBlue = configTC?.valor ? new Decimal(configTC.valor) : new Decimal(1000); // TODO: Alertar si no hay TC

  const movimientos = await prisma.movimientoCaja.groupBy({
    by: ["cajaId", "moneda", "tipo"],
    where: {
      cajaId: { in: cajas.map((c) => c.id) },
      confirmado: true,
      moneda: { in: ["USD", "ARS"] }
    },
    _sum: {
      monto: true
    }
  });

  let totalUSD = new Decimal(0);
  let totalARS = new Decimal(0);

  // Saldo inicial
  cajas.forEach((c) => {
    totalUSD = totalUSD.plus(new Decimal(c.saldoInicialUSD));
    totalARS = totalARS.plus(new Decimal(c.saldoInicialARS));
  });

  // Movimientos
  movimientos.forEach((m) => {
    const monto = new Decimal(m._sum.monto || 0);
    const esSuma = m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN";
    
    if (m.moneda === "USD") {
      totalUSD = esSuma ? totalUSD.plus(monto) : totalUSD.minus(monto);
    } else if (m.moneda === "ARS") {
      totalARS = esSuma ? totalARS.plus(monto) : totalARS.minus(monto);
    }
  });

  const totalARSenUSD = totalARS.div(tcBlue);
  const balanceTotalUSD = totalUSD.plus(totalARSenUSD);

  return {
    totalUSD,
    totalARS,
    totalARSenUSD,
    balanceTotalUSD,
    tcBlue
  };
}
