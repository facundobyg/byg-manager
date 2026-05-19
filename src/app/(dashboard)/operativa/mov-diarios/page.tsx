import { prisma } from "@/lib/prisma";
import { getMovimientosDiarios, getResultadoCambioMensual } from "@/lib/data/mov-diarios";
import { MovDiariosTable } from "@/components/modules/operativa/MovDiariosTable";
import { OperativaFormToggle } from "@/components/modules/operativa/OperativaFormToggle";
import { calcularSaldoCaja } from "@/lib/services/caja.service";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";

export default async function MovDiariosPage() {
  await requirePermission("mov_diarios:leer");
  const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [rows, cajasBase, resultadoCambio] = await Promise.all([
    getMovimientosDiarios(),
    prisma.caja.findMany({ 
      where: { activa: true },
      orderBy: { orden: "asc" }
    }),
    getResultadoCambioMensual(mesActual)
  ]);

  // Enriquecer cajas con saldos actuales
  const cajas = await Promise.all(cajasBase.map(async (c) => ({
    id: c.id,
    label: c.label,
    slug: c.slug,
    esPrincipal: c.esPrincipal,
    saldoUSD: Number(await calcularSaldoCaja(c.id, "USD")),
    saldoARS: Number(await calcularSaldoCaja(c.id, "ARS"))
  })));

  // Serializar datos para el cliente (Decimal -> number, Date -> string)
  const rowsPlain = rows.map(r => ({
    ...r,
    fecha: r.fecha.toISOString(),
    monto: Number(r.monto),
    tc: r.tc ? Number(r.tc) : undefined,
    totalARS: r.totalARS ? Number(r.totalARS) : undefined,
  }));

  const resultadoCambioPlain = {
    USD: {
      netoDivisa: Number(resultadoCambio.USD.netoDivisa),
      netoARS: Number(resultadoCambio.USD.netoARS),
      resultado: Number(resultadoCambio.USD.resultado),
    },
    EUR: {
      netoDivisa: Number(resultadoCambio.EUR.netoDivisa),
      netoARS: Number(resultadoCambio.EUR.netoARS),
      resultado: Number(resultadoCambio.EUR.resultado),
    },
    BRL: {
      netoDivisa: Number(resultadoCambio.BRL.netoDivisa),
      netoARS: Number(resultadoCambio.BRL.netoARS),
      resultado: Number(resultadoCambio.BRL.resultado),
    },
    totalUSD: Number(resultadoCambio.totalUSD),
    tcBlue: Number(resultadoCambio.tcBlue),
  };

  const principal = cajas.find(c => c.esPrincipal);
  const canWrite  = await hasPermission("mov_diarios:escribir");

  return (
    <div className="flex flex-col gap-6">
      <MovDiariosTable
        rows={rowsPlain as any}
        resultadoCambio={resultadoCambioPlain}
        cajas={cajas}
        title="Caja Oficina"
        activeCajaId={principal?.id}
        canWrite={canWrite}
      >
        {canWrite && <OperativaFormToggle cajas={cajas} defaultCajaId={principal?.id} />}
      </MovDiariosTable>
    </div>
  );
}
