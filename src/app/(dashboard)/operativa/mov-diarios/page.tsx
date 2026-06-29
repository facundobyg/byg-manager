import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { getMovimientosDiarios, getResultadoCambioMensual } from "@/lib/data/mov-diarios";
import { MovDiariosTable } from "@/components/modules/operativa/MovDiariosTable";
import { OperativaFormToggle } from "@/components/modules/operativa/OperativaFormToggle";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";

export default async function MovDiariosPage() {
  await requirePermission("mov_diarios:leer");
  const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [rows, cajasBase, resultadoCambio, clientesBase] = await Promise.all([
    getMovimientosDiarios(),
    prisma.caja.findMany({
      where: { activa: true, tipo: { in: ["CENTRAL_CONTABLE", "SUCURSAL_OPERATIVA"] } },
      orderBy: { orden: "asc" }
    }),
    getResultadoCambioMensual(mesActual),
    prisma.cliente.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        CuentaCorriente: { select: { moneda: true, saldo: true } }
      }
    }),
  ]);

  // Enriquecer cajas con saldos actuales — una sola query agregada en vez de
  // una por caja (antes: calcularSaldoCaja(id, "USD"|"ARS") por cada caja).
  const cajaIds = cajasBase.map((c) => c.id);
  const movsAgrupados = cajaIds.length > 0
    ? await prisma.movimientoCaja.groupBy({
        by: ["cajaId", "moneda", "tipo"],
        where: { cajaId: { in: cajaIds }, confirmado: true },
        _sum: { monto: true },
      })
    : [];

  const deltasPorCaja = new Map<string, { USD: Decimal; ARS: Decimal }>();
  for (const g of movsAgrupados) {
    const monto = g._sum.monto ? new Decimal(g._sum.monto.toString()) : new Decimal(0);
    const esEntrada = g.tipo === "ENTRADA" || g.tipo === "TRANSFERENCIA_IN";
    const bucket = deltasPorCaja.get(g.cajaId) ?? { USD: new Decimal(0), ARS: new Decimal(0) };
    if (g.moneda === "USD") bucket.USD = esEntrada ? bucket.USD.add(monto) : bucket.USD.sub(monto);
    else if (g.moneda === "ARS") bucket.ARS = esEntrada ? bucket.ARS.add(monto) : bucket.ARS.sub(monto);
    deltasPorCaja.set(g.cajaId, bucket);
  }

  const cajas = cajasBase.map((c) => {
    const delta = deltasPorCaja.get(c.id) ?? { USD: new Decimal(0), ARS: new Decimal(0) };
    return {
      id: c.id,
      label: c.label,
      slug: c.slug,
      tipo: c.tipo,
      esPrincipal: c.esPrincipal,
      saldoUSD: Number(new Decimal(c.saldoInicialUSD).add(delta.USD)),
      saldoARS: Number(new Decimal(c.saldoInicialARS).add(delta.ARS)),
    };
  });

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

  const clientes = clientesBase.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    ccUSD: Number(c.CuentaCorriente.find((cc) => cc.moneda === "USD")?.saldo ?? 0),
    ccARS: Number(c.CuentaCorriente.find((cc) => cc.moneda === "ARS")?.saldo ?? 0),
  }));

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
        {canWrite && <OperativaFormToggle cajas={cajas} clientes={clientes} defaultCajaId={principal?.id} />}
      </MovDiariosTable>
    </div>
  );
}
