import { getPlazoFijoById } from "@/lib/data/plazo-fijo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, TrendingUp, Calendar, Target, Clock } from "lucide-react";
import { EditarPFForm } from "@/components/modules/clientes/EditarPFForm";
import { canDoAction } from "@/lib/auth/permissions";

type PageProps = { params: Promise<{ pfId: string }> };

function toNum(v: { toString(): string } | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v.toString());
  return isNaN(n) ? 0 : n;
}

function fmt(v: { toString(): string } | null | undefined) {
  return toNum(v).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFecha(d: Date | string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
    });
  } catch { return "—"; }
}

function diasEntre(a: Date | string, b: Date | string): number {
  try {
    const da = new Date(a);
    const db = new Date(b);
    const utcA = Date.UTC(da.getUTCFullYear(), da.getUTCMonth(), da.getUTCDate());
    const utcB = Date.UTC(db.getUTCFullYear(), db.getUTCMonth(), db.getUTCDate());
    return Math.round((utcB - utcA) / 86_400_000);
  } catch { return 0; }
}

const ESTADO_BADGE: Record<string, string> = {
  ACTIVO:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  VENCIDO:   "bg-red-50 text-red-600 ring-1 ring-red-200",
  CANCELADO: "bg-slate-100 text-slate-400",
  RENOVADO:  "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
};

const TIPO_BADGE: Record<string, string> = {
  INTERES: "text-blue-600",
  INGRESO: "text-emerald-600",
  EGRESO:  "text-red-500",
};

export default async function PFDetailPage({ params }: PageProps) {
  const { pfId } = await params;
  const [pf, canEditarPF] = await Promise.all([
    getPlazoFijoById(pfId),
    canDoAction("pf:editar"),
  ]);
  if (!pf) notFound();

  const clienteId    = pf.clienteId;
  const capitalMovs  = pf.PlazoFijoMovimiento.filter(
    (m) => m.tipo === "APERTURA" || m.tipo === "CIERRE_RENOV",
  );
  const capital      = capitalMovs.length > 0
    ? toNum(capitalMovs[capitalMovs.length - 1].monto)
    : toNum(pf.capital);
  const saldoActual  = toNum(pf.saldoActual);
  const tasa         = toNum(pf.tasaAnual);
  const plazo        = diasEntre(pf.fechaInicio, pf.fechaVencimiento);
  const interesEst   = capital * (tasa / 100) * (plazo / 365);
  const hoy          = new Date();
  const diasHastaVenc = diasEntre(hoy, pf.fechaVencimiento);

  const movimientos = pf.PlazoFijoMovimiento;

  const fechaInicioISO      = new Date(pf.fechaInicio).toISOString().slice(0, 10);
  const fechaVencimientoISO = new Date(pf.fechaVencimiento).toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-8">

      {/* Breadcrumb */}
      <Link
        href={`/clientes/${clienteId}`}
        className="flex items-center gap-1 text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-widest transition-colors group w-fit"
      >
        <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        {pf.Cliente.nombre}
      </Link>

      {/* Header */}
      <header className="flex items-center gap-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-inner shrink-0">
          <TrendingUp size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Plazo Fijo</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight truncate">
            {pf.Cliente.nombre}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {pf.moneda}
            </span>
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm ${ESTADO_BADGE[pf.estado] ?? "bg-slate-100 text-slate-400"}`}>
              {pf.estado}
            </span>
          </div>
        </div>
        <div className="text-right pl-6 border-l border-slate-100 shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Saldo actual</p>
          <p className="text-3xl font-black text-emerald-700 tabular-nums tracking-tight">{fmt(saldoActual)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Capital inicial: {fmt(capital)}</p>
        </div>
      </header>

      {/* Detail cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-emerald-400 shadow-sm p-5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Target size={13} className="text-emerald-500" />
            <p className="text-[11px] font-bold uppercase tracking-widest">Saldo actual</p>
          </div>
          <p className="text-2xl font-black text-emerald-700 tabular-nums">{fmt(saldoActual)}</p>
          <p className="text-[11px] text-slate-400">Capital inicial: {fmt(capital)} {pf.moneda}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-blue-400 shadow-sm p-5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <TrendingUp size={13} className="text-blue-500" />
            <p className="text-[11px] font-bold uppercase tracking-widest">Tasa anual</p>
          </div>
          <p className="text-2xl font-black text-blue-600 tabular-nums">{fmt(tasa)}%</p>
          <p className="text-[11px] text-slate-400">TNA</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-slate-300 shadow-sm p-5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar size={13} />
            <p className="text-[11px] font-bold uppercase tracking-widest">Inicio</p>
          </div>
          <p className="text-xl font-black text-slate-900">{fmtFecha(pf.fechaInicio)}</p>
          <p className="text-[11px] text-slate-400">{plazo} días de plazo</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-amber-400 shadow-sm p-5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock size={13} className="text-amber-500" />
            <p className="text-[11px] font-bold uppercase tracking-widest">Vencimiento</p>
          </div>
          <p className="text-xl font-black text-slate-900">{fmtFecha(pf.fechaVencimiento)}</p>
          <p className={`text-[11px] font-bold ${diasHastaVenc < 0 ? "text-red-500" : diasHastaVenc <= 7 ? "text-amber-600" : "text-slate-400"}`}>
            {diasHastaVenc < 0
              ? `Vencido hace ${Math.abs(diasHastaVenc)}d`
              : diasHastaVenc === 0
              ? "Vence hoy"
              : `Faltan ${diasHastaVenc}d`}
          </p>
        </div>
      </div>

      {/* Resumen de saldo */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Resumen de rendimiento</h2>
        </div>
        <div className="px-6 py-5 flex flex-wrap gap-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Capital inicial</p>
            <p className="text-xl font-black text-slate-900 tabular-nums">{pf.moneda} {fmt(capital)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Tasa × Plazo</p>
            <p className="text-xl font-black text-slate-700 tabular-nums">{fmt(tasa)}% × {plazo}d / 365</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Interés estimado</p>
            <p className="text-2xl font-black text-emerald-600 tabular-nums">{pf.moneda} {fmt(interesEst)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Saldo actual registrado</p>
            <p className="text-2xl font-black text-blue-700 tabular-nums">{pf.moneda} {fmt(saldoActual)}</p>
          </div>
        </div>
        <p className="px-6 pb-4 text-[10px] text-slate-400 italic">
          Interés estimado: capital × tasa/100 × días/365. Saldo actual: valor real registrado (puede diferir por capitalización o ajustes).
        </p>
      </section>

      {/* Monthly movements ledger */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">Detalle mensual de intereses</h2>
          {movimientos.length > 0 && (
            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md tabular-nums">
              {movimientos.length} movimientos
            </span>
          )}
        </div>
        {movimientos.length === 0 ? (
          <div className="px-6 py-5">
            <p className="text-xs text-slate-400 italic">No hay detalle mensual importado para este PF.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Fecha</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Descripción</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Ingreso</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Egreso</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Saldo acum.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {movimientos.map((m) => {
                  const monto = toNum(m.monto);
                  const saldo = toNum(m.saldoAcumulado);
                  const isIngreso = m.tipo !== "EGRESO";
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3 text-[12px] font-medium text-slate-400 whitespace-nowrap">
                        {fmtFecha(m.fecha)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-bold text-slate-700">{m.descripcion ?? "—"}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${TIPO_BADGE[m.tipo] ?? "text-slate-400"}`}>
                            {m.tipo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[13px] font-black text-right tabular-nums text-emerald-600">
                        {isIngreso ? fmt(monto) : ""}
                      </td>
                      <td className="px-6 py-3 text-[13px] font-black text-right tabular-nums text-red-500">
                        {!isIngreso ? fmt(monto) : ""}
                      </td>
                      <td className={`px-6 py-3 text-[13px] font-black text-right tabular-nums tracking-tight ${saldo < 0 ? "text-red-600" : "text-slate-900"}`}>
                        {fmt(saldo)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit PF */}
      {canEditarPF && (
        <EditarPFForm
          pfId={pfId}
          clienteId={clienteId}
          capital={capital}
          tasaAnual={tasa}
          fechaInicio={fechaInicioISO}
          fechaVencimiento={fechaVencimientoISO}
          saldoActual={saldoActual}
          estado={pf.estado}
        />
      )}

    </div>
  );
}
