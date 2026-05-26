import { requirePermission } from "@/lib/auth/permissions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, UserCircle, ArrowRight, Banknote, TrendingUp, BarChart2, Briefcase, FileText } from "lucide-react";
import { getClienteById } from "@/lib/data/cuenta-corriente";
import { ClienteFormsClientSlot } from "@/components/modules/clientes/ClienteFormsClientSlot";
import { ClienteAdminActions } from "@/components/modules/clientes/ClienteAdminActions";
import { VerPFButton } from "@/components/modules/clientes/VerPFButton";
import { getClienteDeMap } from "@/lib/services/config.service";
import { canDoAction } from "@/lib/auth/permissions";
import { AsignarProductorSelect } from "@/components/modules/comisiones/AsignarProductorSelect";
import { prisma } from "@/lib/prisma";

const SOCIOS = new Set(["Facu", "Fran", "Nanu"]);

const SOCIO_BADGE: Record<string, string> = {
  Facu: "bg-blue-600 text-white",
  Fran: "bg-emerald-600 text-white",
  Nanu: "bg-violet-600 text-white",
};

type PageProps = { params: Promise<{ id: string }> };

function toNum(v: { toString(): string } | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v.toString());
  return isNaN(n) ? 0 : n;
}

function fmt(n: { toString(): string } | null | undefined) {
  try {
    return toNum(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch {
    return "0,00";
  }
}

function fmtFecha(d: Date | string | null | undefined) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  } catch {
    return "-";
  }
}

function diasHasta(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  try {
    const hoy = new Date();
    const a = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const v = new Date(d);
    const b = Date.UTC(v.getFullYear(), v.getMonth(), v.getDate());
    return Math.round((b - a) / 86_400_000);
  } catch {
    return null;
  }
}

const ESTADO_BADGE: Record<string, string> = {
  ACTIVO:    "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  VENCIDO:   "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
  CANCELADO: "bg-byg-surface-2 text-byg-muted",
  RENOVADO:  "bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20",
};

function EmptyState({ message }: { message: string }) {
  return <p className="px-6 py-3 text-[12px] text-byg-muted italic">{message}</p>;
}

function SectionHeader({ label, count, right }: { label: string; count?: number; right?: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-byg-border flex items-center justify-between bg-byg-bg">
      <div className="flex items-center gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text">{label}</h2>
        {count !== undefined && (
          <span className="text-[11px] font-bold bg-byg-surface-2 text-byg-muted px-2 py-0.5 rounded-md tabular-nums">
            {count}
          </span>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

export default async function ClienteDetailPage({ params }: PageProps) {
  await requirePermission("clientes:leer");
  const { id } = await params;
  const [cliente, deMap, canWriteCC, canWritePF, productores] = await Promise.all([
    getClienteById(id),
    getClienteDeMap(),
    canDoAction("cc:crear_movimiento"),
    canDoAction("pf:crear"),
    prisma.productor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);
  if (!cliente) notFound();

  const socio    = deMap[cliente.nombre] ?? null;
  const isSocio  = SOCIOS.has(cliente.nombre);
  const { pfCapitalMap } = cliente;

  const cuentasCorrientes = cliente.CuentaCorriente || [];
  const plazosFijos = cliente.PlazoFijo || [];
  const custodias = cliente.CustodiaCliente || [];
  const operaciones = cliente.operaciones;
  const transferencias = cliente.transferencias ?? [];
  const transfByActivo = new Map<string, { carteraNombre: string; fecha: Date }>();
  for (const t of transferencias) {
    if (!transfByActivo.has(t.activoId)) {
      transfByActivo.set(t.activoId, { carteraNombre: t.Cartera.nombre, fecha: t.fecha });
    }
  }

  const saldoCC = cuentasCorrientes.reduce((acc, cc) => acc + toNum(cc.saldo), 0);
  const pfActivos = plazosFijos.filter((pf) => pf.estado === "ACTIVO");
  const capitalPF = pfActivos.reduce((acc, pf) => acc + toNum(pf.saldoActual), 0);
  const totalCustodia = custodias.reduce((acc, cu) => {
    const precio = cu.Activo?.precioActual != null
      ? toNum(cu.Activo.precioActual)
      : toNum(cu.precioPromedio);
    return acc + toNum(cu.cantidadTotal) * precio;
  }, 0);
  const custodiaUSD = custodias
    .filter((cu) => cu.Activo?.monedaPrecio !== "ARS")
    .reduce((acc, cu) => {
      const precio = cu.Activo?.precioActual != null ? toNum(cu.Activo.precioActual) : toNum(cu.precioPromedio);
      return acc + toNum(cu.cantidadTotal) * precio;
    }, 0);
  const custodiaARS = custodias
    .filter((cu) => cu.Activo?.monedaPrecio === "ARS")
    .reduce((acc, cu) => {
      const precio = cu.Activo?.precioActual != null ? toNum(cu.Activo.precioActual) : toNum(cu.precioPromedio);
      return acc + toNum(cu.cantidadTotal) * precio;
    }, 0);

  return (
    <div className="flex flex-col gap-7">

      {/* Breadcrumb */}
      <Link
        href="/clientes"
        className="flex items-center gap-1 text-byg-muted hover:text-byg-accent text-[10px] font-black uppercase tracking-widest transition-colors group w-fit"
      >
        <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        Clientes
      </Link>

      {/* Header */}
      <header className="flex items-center gap-5 bg-byg-surface p-6 rounded-2xl border border-byg-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-byg-accent" />
        <div className="p-4 bg-byg-bg text-byg-accent rounded-2xl border border-byg-border shrink-0">
          <UserCircle size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <p className="text-[10px] font-bold text-byg-accent uppercase tracking-widest">Cliente 360</p>
            <span className="bg-byg-surface-2 text-byg-muted text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-byg-border">
              {cliente.rol || "CLIENTE"}
            </span>
            {isSocio && (
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${SOCIO_BADGE[cliente.nombre] ?? "bg-byg-surface-2 text-byg-muted"}`}>
                SOCIO
              </span>
            )}
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${socio ? (SOCIO_BADGE[socio] ?? "bg-byg-surface-2 text-byg-muted") : "bg-byg-surface-2 text-byg-muted"}`}>
              Responsable: {socio ?? "—"}
            </span>
          </div>
          <h1 className="text-4xl font-black text-byg-text tracking-tight truncate pb-1">
            {cliente.nombre || "Sin nombre"}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
            {[cliente.email, cliente.telefono, cliente.banco]
              .filter(Boolean)
              .map((val, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-byg-border-2"></span>
                  <span className="text-[13px] font-medium text-byg-muted">{val}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Link
            href={`/print/clientes/${id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg bg-byg-surface-2 text-byg-muted hover:bg-byg-border hover:text-byg-text transition-colors uppercase tracking-wider border border-byg-border"
          >
            <FileText size={11} />
            PDF
          </Link>
          <ClienteAdminActions clienteId={cliente.id} />
          {productores.length > 0 && (
            <div className="flex flex-col items-end gap-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-byg-muted">Productor</p>
              <AsignarProductorSelect
                clienteId={cliente.id}
                productorIdActual={(cliente as { productorId?: string | null }).productorId ?? null}
                productores={productores.map((p) => ({ id: p.id, nombre: p.nombre, porcentaje: Number(p.porcentaje) }))}
              />
            </div>
          )}
        </div>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          icon={<Banknote size={15} className="text-blue-400" />}
          label="Saldo CC"
          value={fmt(saldoCC)}
          sub={`${cuentasCorrientes.length} cuenta${cuentasCorrientes.length !== 1 ? "s" : ""}`}
          valueClass={saldoCC < 0 ? "text-rose-400" : "text-byg-text"}
          accent="blue"
        />
        <Card
          icon={<TrendingUp size={15} className="text-green-400" />}
          label="PF activos"
          value={String(pfActivos.length)}
          sub={`de ${plazosFijos.length} total`}
          accent="green"
        />
        <Card
          icon={<BarChart2 size={15} className="text-emerald-400" />}
          label="Saldo PF"
          value={fmt(capitalPF)}
          sub="saldo actual · solo activos"
          accent="emerald"
        />
        <Card
          icon={<Briefcase size={15} className="text-purple-400" />}
          label="Custodia"
          value={fmt(totalCustodia)}
          sub={`${custodias.length} posición${custodias.length !== 1 ? "es" : ""}`}
          accent="purple"
        />
      </div>

      {/* Cuentas corrientes */}
      <section className="bg-byg-surface rounded-xl border border-byg-border overflow-hidden">
        <SectionHeader label="Cuentas corrientes" count={cuentasCorrientes.length} right={<ClienteFormsClientSlot clienteId={cliente.id} canWriteCC={canWriteCC} canWritePF={canWritePF} />} />
        {cuentasCorrientes.length === 0 ? (
          <EmptyState message="Sin cuentas corrientes registradas" />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-byg-border bg-byg-bg">
                <th className="px-6 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Moneda</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">Saldo</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-byg-border/40">
              {cuentasCorrientes.map((cc) => {
                const saldo = toNum(cc.saldo);
                return (
                  <tr key={cc.id} className="hover:bg-byg-surface-2 transition-colors group">
                    <td className="px-6 py-3.5">
                      <span className="text-[11px] font-bold text-byg-text bg-byg-surface-2 px-2.5 py-1 rounded-md tracking-wider border border-byg-border">
                        {cc.moneda || "-"}
                      </span>
                    </td>
                    <td className={`px-6 py-3.5 text-[15px] text-right tabular-nums font-black font-mono tracking-tight ${saldo < 0 ? "text-rose-400" : "text-byg-text"}`}>
                      {fmt(saldo)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/clientes/cc/${cc.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-wider shadow-sm shadow-blue-600/20"
                      >
                        Ver <ArrowRight size={10} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Plazos fijos — oculto si no tiene ninguno */}
      {plazosFijos.length > 0 && <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        <SectionHeader
          label="Plazos fijos"
          count={plazosFijos.length}
          right={
            pfActivos.length > 0 ? (
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider border border-emerald-500/20">
                {pfActivos.length} Activo{pfActivos.length !== 1 ? "s" : ""}
              </span>
            ) : undefined
          }
        />
        {plazosFijos.length === 0 ? (
          <EmptyState message="No hay plazos fijos registrados para este cliente" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-byg-border bg-byg-bg">
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">Capital inicial</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">Saldo actual</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">Tasa</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Inicio</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Vencimiento</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">Días</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-center">Estado</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-byg-border/40">
                {plazosFijos.map((pf) => {
                  const dias = diasHasta(pf.fechaVencimiento);
                  const isVencido = pf.estado === "ACTIVO" && dias !== null && dias < 0;
                  const isUrgent = pf.estado === "ACTIVO" && dias !== null && dias >= 0 && dias <= 7;

                  return (
                    <tr
                      key={pf.id}
                      className={`transition-colors group hover:bg-slate-50/80 ${
                        isVencido ? "bg-rose-500/5" :
                        isUrgent  ? "bg-amber-500/5" : ""
                      }`}
                    >
                      <td className="px-6 py-3.5 text-right tabular-nums whitespace-nowrap">
                        {pf.moneda && (
                          <span className="text-[11px] font-bold text-byg-muted mr-1">{pf.moneda}</span>
                        )}
                        <span className="text-[13px] font-semibold text-byg-muted font-mono">{fmt(pfCapitalMap[pf.id] ?? pf.capital)}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right tabular-nums whitespace-nowrap">
                        {pf.moneda && (
                          <span className="text-[11px] font-bold text-byg-muted mr-1">{pf.moneda}</span>
                        )}
                        <span className="text-[15px] font-black text-emerald-400 tracking-tight font-mono">{fmt(pf.saldoActual)}</span>
                      </td>
                      <td className="px-6 py-3.5 text-[13px] text-right tabular-nums text-byg-accent font-semibold font-mono">
                        {fmt(pf.tasaAnual)}%
                      </td>
                      <td className="px-6 py-3.5 text-[13px] text-byg-muted font-medium whitespace-nowrap font-mono">{fmtFecha(pf.fechaInicio)}</td>
                      <td className="px-6 py-3.5 text-[13px] font-bold text-byg-text whitespace-nowrap font-mono">{fmtFecha(pf.fechaVencimiento)}</td>
                      <td className="px-6 py-3.5 text-right tabular-nums">
                        {dias !== null ? (
                          <span className={`text-[12px] font-black tracking-wide font-mono ${dias < 0 ? "text-rose-400" : dias <= 7 ? "text-amber-400" : "text-byg-muted"}`}>
                            {dias < 0 ? `+${Math.abs(dias)}v` : dias === 0 ? "hoy" : `${dias}d`}
                          </span>
                        ) : (
                          <span className="text-byg-border-2 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm ${
                          isVencido ? "bg-red-600 text-white" :
                          isUrgent ? "bg-amber-500 text-white" :
                          ESTADO_BADGE[pf.estado] ?? "bg-slate-100 text-slate-400"
                        }`}>
                          {isVencido ? "VENCIDO" : isUrgent ? "PRÓXIMO" : pf.estado}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <VerPFButton pfId={pf.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>}

      {/* Cartera — oculta si no tiene posiciones */}
      {custodias.length > 0 && <section className="bg-white rounded-2xl border border-slate-200 border-l-[5px] border-l-amber-400 shadow-sm overflow-hidden flex flex-col relative">
        <SectionHeader
          label="Custodia BYG"
          count={custodias.length}
          right={
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                No integra patrimonio propio
              </span>
              <span className="text-xs font-black tabular-nums text-byg-text font-mono">{fmt(totalCustodia)}</span>
            </div>
          }
        />
        <div className="px-6 py-2 border-b border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[10px] font-bold text-amber-400">
            Posiciones asignadas desde carteras — no computan como CC ni PF
          </p>
          <div className="flex items-center gap-4 shrink-0">
            {custodiaUSD > 0 && (
              <span className="text-[11px] font-black text-amber-400 tabular-nums font-mono">
                USD {fmt(custodiaUSD)}
              </span>
            )}
            {custodiaARS > 0 && (
              <span className="text-[11px] font-black text-amber-400/80 tabular-nums font-mono">
                $ {fmt(custodiaARS)}
              </span>
            )}
          </div>
        </div>
        {custodias.length === 0 ? (
          <EmptyState message="Sin posiciones en cartera asignada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="border-b border-byg-border bg-byg-bg">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest w-[90px]">Ticker</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Descripción</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">Cantidad</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">P. Promedio</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">P. Actual</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">Valor est.</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Origen</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Últ. transf.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-byg-border/40">
                {custodias.map((cu) => {
                  const cantidad     = toNum(cu.cantidadTotal);
                  const promedio     = toNum(cu.precioPromedio);
                  const hasPrecio    = cu.Activo?.precioActual != null;
                  const precioActual = hasPrecio ? toNum(cu.Activo!.precioActual) : null;
                  const valorEst     = cantidad * (precioActual ?? promedio);
                  const transf       = transfByActivo.get(cu.activoId);

                  return (
                    <tr key={cu.id} className="hover:bg-byg-surface-2 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-black font-mono text-byg-text bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          {cu.Activo?.ticker || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-byg-muted max-w-[200px] truncate">
                        {cu.Activo?.descripcion || "—"}
                      </td>
                      <td className="px-5 py-3 text-[12px] font-bold text-right tabular-nums text-byg-text font-mono">
                        {fmt(cantidad)}
                      </td>
                      <td className="px-5 py-3 text-[12px] text-right tabular-nums text-byg-muted font-mono">
                        {fmt(promedio)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {hasPrecio
                          ? <span className="text-[12px] text-byg-text font-mono">{fmt(precioActual!)}</span>
                          : <span className="text-[10px] italic text-byg-border-2">Sin dato</span>
                        }
                      </td>
                      <td className="px-5 py-3 text-[13px] font-black text-right tabular-nums text-byg-text font-mono">
                        {fmt(valorEst)}
                      </td>
                      <td className="px-5 py-3 text-[12px] text-byg-muted truncate max-w-[120px]">
                        {transf?.carteraNombre ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-[12px] text-byg-muted tabular-nums whitespace-nowrap font-mono">
                        {transf ? fmtFecha(transf.fecha) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>}

      {/* Historial de transferencias de custodia */}
      {transferencias.length > 0 && (
        <section className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-amber-300 overflow-hidden flex flex-col">
          <SectionHeader label="Historial de transferencias" count={transferencias.length} />
          <p className="px-6 py-2 text-[10px] font-bold text-amber-400 bg-amber-500/5 border-b border-amber-500/20">
            Activos recibidos en custodia desde carteras propias de la firma
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-byg-border bg-byg-bg">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Fecha</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest w-[90px]">Ticker</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Descripción</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">Cantidad</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right">Precio</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Cartera origen</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Operador</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-byg-muted tracking-widest">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-byg-border/40">
                {transferencias.map((t) => (
                  <tr key={t.id} className="hover:bg-byg-surface-2 transition-colors">
                    <td className="px-5 py-3 text-[12px] text-byg-muted tabular-nums whitespace-nowrap font-mono">
                      {fmtFecha(t.fecha)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-black font-mono text-byg-text bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {t.Activo.ticker}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-byg-muted max-w-[160px] truncate">
                      {t.Activo.descripcion || "—"}
                    </td>
                    <td className="px-5 py-3 text-[12px] font-bold text-right tabular-nums text-byg-text font-mono">
                      {fmt(t.cantidad)}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-right tabular-nums text-byg-muted font-mono">
                      {fmt(t.precioEnTransferencia)}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-byg-muted truncate max-w-[120px]">
                      {t.Cartera.nombre}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-byg-muted whitespace-nowrap">
                      {t.User.name}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-byg-muted italic max-w-[160px] truncate">
                      {t.notas || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Operaciones relacionadas */}
      <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden flex flex-col">
        <SectionHeader label="Operaciones relacionadas" count={operaciones.length} />
        {operaciones.length === 0 ? (
          <EmptyState message="No hay operaciones relacionadas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-byg-border bg-byg-bg">
                  {["Fecha", "Tipo", "Moneda", "Cantidad", "Total ARS", "Estado", "Origen"].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-byg-border/40">
                {operaciones.map((op) => {
                  const esImport = op.descripcion?.includes("[IMPORT LEGACY CAMBIO]") ?? false;
                  const origen = esImport
                    ? "Import legacy"
                    : op.clienteId === cliente.id
                    ? "Vinculada"
                    : "Legacy / nombre";
                  return (
                    <tr key={op.id} className="hover:bg-byg-surface-2 transition-colors">
                      <td className="px-6 py-3 text-[12px] text-byg-muted whitespace-nowrap font-mono">
                        {fmtFecha(op.fecha)}
                      </td>
                      <td className="px-6 py-3 text-[11px] font-bold text-byg-text uppercase tracking-tight whitespace-nowrap">
                        {op.tipo.replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[11px] font-bold bg-byg-surface-2 text-byg-muted px-2 py-0.5 rounded-md border border-byg-border">
                          {op.moneda}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[13px] font-black text-right tabular-nums text-byg-text font-mono">
                        {fmt(op.cantidad)}
                      </td>
                      <td className="px-6 py-3 text-[13px] font-black text-right tabular-nums text-byg-text font-mono">
                        {fmt(op.totalARS)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          op.pendiente
                            ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        }`}>
                          {op.pendiente ? "Pendiente" : "Confirmada"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          origen === "Vinculada"
                            ? "bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20"
                            : origen === "Import legacy"
                            ? "bg-byg-surface-2 text-byg-muted"
                            : "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20"
                        }`}>
                          {origen}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

// ── Card component ────────────────────────────────────────────────────────────

type AccentColor = "blue" | "green" | "emerald" | "purple";

const ACCENT_BORDER: Record<AccentColor, string> = {
  blue:    "border-t-blue-400",
  green:   "border-t-green-400",
  emerald: "border-t-emerald-400",
  purple:  "border-t-purple-400",
};

function Card({
  icon, label, value, sub, valueClass = "text-byg-text", accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  accent: AccentColor;
}) {
  return (
    <div className={`bg-byg-surface rounded-xl border border-byg-border border-t-[3px] p-5 flex flex-col justify-between min-h-[110px] ${ACCENT_BORDER[accent]} transition-colors hover:bg-byg-surface-2`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-byg-bg border border-byg-border">{icon}</div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-byg-muted">{label}</p>
      </div>
      <div>
        <p className={`text-3xl font-black tabular-nums tracking-tight leading-none mb-1.5 font-mono ${valueClass}`}>{value}</p>
        {sub && <p className="text-xs font-medium text-byg-muted">{sub}</p>}
      </div>
    </div>
  );
}
