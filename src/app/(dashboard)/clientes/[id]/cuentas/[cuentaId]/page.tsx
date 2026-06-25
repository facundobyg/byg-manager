import { getMovimientosCuentaCorriente } from "@/lib/data/movimiento-cc";
import { MovimientoCuentaCorrienteTable } from "@/components/modules/clientes/MovimientoCuentaCorrienteTable";
import { NuevoMovimientoCCForm } from "@/components/modules/clientes/NuevoMovimientoCCForm";
import { InteresCCForm } from "@/components/modules/clientes/InteresCCForm";
import { InteresesTable } from "@/components/modules/clientes/InteresesTable";
import { ReconcileSaldoCCButton } from "@/components/modules/clientes/ReconcileSaldoCCButton";
import { calcularInteresCCRealista } from "@/lib/services/intereses.service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Landmark, Lock } from "lucide-react";
import { canDoAction } from "@/lib/auth/permissions";
import { auth } from "@/auth";

type PageProps = {
  params: Promise<{ id: string; cuentaId: string }>;
};

function toNum(v: { toString(): string } | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v.toString());
  return isNaN(n) ? 0 : n;
}

function fmt(v: { toString(): string } | null | undefined) {
  return toNum(v).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function CuentaCorrienteDetailPage({ params }: PageProps) {
  const { id, cuentaId } = await params;

  const [cuenta, canWrite, canRevertir, session] = await Promise.all([
    getMovimientosCuentaCorriente(cuentaId),
    canDoAction("cc:crear_movimiento"),
    canDoAction("cc:eliminar_movimiento"),
    auth(),
  ]);
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  if (!cuenta || cuenta.clienteId !== id) notFound();

  const hoy = new Date();
  const inicioMes = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), 1));

  // tasaCC stored as decimal (0.045); legacy data may have percent (4.5)
  const tasaCCNum = toNum(cuenta.Cliente.tasaCC);
  const tasaCC = tasaCCNum > 1 ? cuenta.Cliente.tasaCC.div(100) : cuenta.Cliente.tasaCC;
  const tasaCCPct = Number(tasaCC.toString()) * 100;

  const interesesPreview = calcularInteresCCRealista({
    movimientos: cuenta.MovimientoCC.map((m) => ({
      fecha: m.fecha,
      tipo: m.tipo,
      monto: m.monto,
    })),
    tasa: tasaCC,
    fechaInicio: inicioMes,
    fechaFin: hoy,
    saldoInicial: cuenta.saldo,
  });

  const items = interesesPreview.periodos.map((p) => ({
    cliente: cuenta.Cliente.nombre,
    tipo: "CC" as const,
    base: p.saldo.toFixed(2),
    tasa: tasaCCPct.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%",
    dias: p.dias,
    calculado: p.interes.toFixed(2),
    aplicado: p.interes.toFixed(2),
    nuevoSaldo: p.saldo.add(p.interes).toFixed(2),
    cuentaId: cuenta.id,
    puedeAplicar: true,
  }));

  // Summary calculations (movimientos limited to 50 by query)
  const movimientos = cuenta.MovimientoCC;
  const totalIngresos = movimientos
    .filter((m) => m.tipo === "INGRESO" || m.tipo === "INTERES")
    .reduce((sum, m) => sum + toNum(m.monto), 0);
  const totalEgresos = movimientos
    .filter((m) => m.tipo === "EGRESO")
    .reduce((sum, m) => sum + toNum(m.monto), 0);

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <header className="flex flex-col gap-5">
        <Link
          href={`/clientes/${id}`}
          className="flex items-center gap-1 text-slate-400 hover:text-blue-600 text-[10px] font-bold uppercase tracking-widest transition-colors group w-fit"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver al cliente
        </Link>

        <div className="flex items-center gap-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner shrink-0">
            <Landmark size={32} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Cuenta Corriente</p>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                {cuenta.moneda}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight truncate pb-1">
              {cuenta.Cliente.nombre}
            </h1>
          </div>
          <div className="text-right pl-6 border-l border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Saldo actual</p>
            <p className={`text-3xl font-black tabular-nums tracking-tight ${Number(cuenta.saldo) < 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {fmt(cuenta.saldo)}
            </p>
          </div>
        </div>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-blue-400 shadow-sm p-5 flex flex-col justify-between min-h-[100px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Saldo actual</p>
          <div>
            <p className={`text-3xl font-black tabular-nums tracking-tight ${Number(cuenta.saldo) < 0 ? 'text-red-600' : 'text-slate-900'}`}>{fmt(cuenta.saldo)}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">{cuenta.moneda}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-slate-400 shadow-sm p-5 flex flex-col justify-between min-h-[100px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Movimientos</p>
          <div>
            <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">{movimientos.length}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">últimos 50</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-emerald-400 shadow-sm p-5 flex flex-col justify-between min-h-[100px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Total ingresos</p>
          <p className="text-3xl font-black text-emerald-600 tabular-nums tracking-tight">{fmt(totalIngresos)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-red-400 shadow-sm p-5 flex flex-col justify-between min-h-[100px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Total egresos</p>
          <p className="text-3xl font-black text-red-600 tabular-nums tracking-tight">{fmt(totalEgresos)}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-6">
          {!canWrite && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest">
              <Lock size={11} />
              Solo lectura
            </div>
          )}
          {canWrite && <NuevoMovimientoCCForm cuentaId={cuenta.id} clienteId={id} />}
          {canWrite && <InteresCCForm cuentaId={cuenta.id} clienteId={id} />}
          {isAdmin && <ReconcileSaldoCCButton cuentaId={cuenta.id} clienteId={id} />}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">
              Vista previa de intereses
            </p>
            <InteresesTable items={items} />
          </div>
        </div>

        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
              Movimientos recientes
            </h2>
          </div>
          <MovimientoCuentaCorrienteTable
            movimientos={cuenta.MovimientoCC}
            saldoActual={cuenta.saldo}
            canRevertir={canRevertir}
          />
        </section>
      </div>

    </div>
  );
}
