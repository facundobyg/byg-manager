import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { Building2, TrendingUp, Wallet, Briefcase, Filter, X, Zap } from "lucide-react";
import { NuevoMovimientoInmobiliarioForm } from "@/components/modules/carteras/NuevoMovimientoInmobiliarioForm";
import { GestionPropiedades } from "@/components/modules/carteras/GestionPropiedades";
import { getTCBlue } from "@/lib/services/config.service";
import Link from "next/link";

function fmt(n: Decimal | number) {
  return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function InmobiliariasPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ propiedadId?: string; tipo?: string; moneda?: string }> 
}) {
  const filters = await searchParams;

  const [propiedades, movimientos, tcBlueConfig] = await Promise.all([
    prisma.propiedad.findMany({ where: { activa: true } }),
    prisma.inversionInmobiliaria.findMany({
      where: {
        propiedadId: filters.propiedadId || undefined,
        tipo: (filters.tipo as any) || undefined,
        moneda: (filters.moneda as any) || undefined,
      },
      include: { Propiedad: true },
      orderBy: { fecha: "desc" },
    }),
    getTCBlue(),
  ]);

  const tcBlue = new Decimal(tcBlueConfig?.valor || "1");

  const totalPropiedades = propiedades.length;
  
  // Agrupar Totales por Moneda
  const statsByMoneda: Record<string, { ingresos: Decimal; egresos: Decimal }> = {};

  movimientos.forEach((m) => {
    if (!statsByMoneda[m.moneda]) {
      statsByMoneda[m.moneda] = { ingresos: new Decimal(0), egresos: new Decimal(0) };
    }
    
    const monto = new Decimal(m.monto.toString());
    if (m.tipo === "INGRESO" || m.tipo === "RENTA") {
      statsByMoneda[m.moneda].ingresos = statsByMoneda[m.moneda].ingresos.plus(monto);
    } else {
      statsByMoneda[m.moneda].egresos = statsByMoneda[m.moneda].egresos.plus(monto);
    }
  });

  const monedasExistentes = Object.keys(statsByMoneda).sort((a, b) => (a === "USD" ? -1 : 1));

  // Consolidado USD
  let netoConsolidadoUSD = new Decimal(0);
  monedasExistentes.forEach(m => {
    const netoM = statsByMoneda[m].ingresos.minus(statsByMoneda[m].egresos);
    if (m === "USD") {
      netoConsolidadoUSD = netoConsolidadoUSD.plus(netoM);
    } else if (m === "ARS") {
      netoConsolidadoUSD = netoConsolidadoUSD.plus(netoM.div(tcBlue));
    }
  });

  const TIPO_ESTILO: Record<string, string> = {
    INGRESO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    RENTA: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    EGRESO: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    IMPUESTO: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    MEJORA: "bg-byg-accent/10 text-byg-accent border-byg-accent/20",
  };

  const hasFilters = !!(filters.propiedadId || filters.tipo || filters.moneda);

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-5 bg-byg-surface p-6 rounded-2xl border border-byg-border">
          <div className="p-4 bg-byg-bg text-byg-accent rounded-2xl border border-byg-border">
            <Building2 size={28} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Activos Reales</p>
            <h1 className="text-4xl font-black text-byg-text tracking-tight pb-1">Inversiones Inmobiliarias</h1>
            <p className="text-sm text-byg-muted font-medium">Seguimiento operativo de propiedades, rentas, mejoras e impuestos</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-byg-surface p-5 rounded-2xl border border-byg-border flex flex-col justify-between min-h-[110px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Propiedades Activas</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-byg-text tabular-nums font-mono">{totalPropiedades}</p>
              <div className="p-2 bg-byg-surface-2 text-byg-muted rounded-lg"><Building2 size={18} /></div>
            </div>
          </div>

          <div className="bg-byg-surface p-5 rounded-2xl border border-byg-accent/30 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-byg-accent"><Zap size={40} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-accent">Neto consolidado USD</p>
            <div className="flex flex-col">
              <p className={`text-3xl font-black tabular-nums font-mono ${netoConsolidadoUSD.gte(0) ? "text-emerald-400" : "text-rose-400"}`}>
                {fmt(netoConsolidadoUSD)}
              </p>
              <p className="text-[9px] font-bold text-byg-muted mt-1 uppercase">ARS convertido por TC Blue ({fmt(tcBlue)})</p>
            </div>
          </div>

          <div className="bg-byg-surface p-5 rounded-2xl border border-byg-border flex flex-col justify-between min-h-[110px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Rentas / Ingresos</p>
            <div className="flex flex-col gap-1">
              {monedasExistentes.length === 0 ? (
                <p className="text-3xl font-black text-byg-muted">---</p>
              ) : (
                monedasExistentes.map(m => (
                  <div key={m} className="flex items-baseline justify-between gap-4">
                    <span className="text-[10px] font-bold text-byg-muted">{m}</span>
                    <p className="text-xl font-black text-emerald-400 tabular-nums font-mono">{fmt(statsByMoneda[m].ingresos)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-byg-surface p-5 rounded-2xl border border-byg-border flex flex-col justify-between min-h-[110px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Gastos / Mejoras</p>
            <div className="flex flex-col gap-1">
              {monedasExistentes.length === 0 ? (
                <p className="text-3xl font-black text-byg-muted">---</p>
              ) : (
                monedasExistentes.map(m => (
                  <div key={m} className="flex items-baseline justify-between gap-4">
                    <span className="text-[10px] font-bold text-byg-muted">{m}</span>
                    <p className="text-xl font-black text-byg-text tabular-nums font-mono">{fmt(statsByMoneda[m].egresos)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-byg-surface p-5 rounded-2xl border border-byg-border flex flex-col justify-between min-h-[110px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-byg-accent"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Neto Operativo</p>
            <div className="flex flex-col gap-1">
              {monedasExistentes.length === 0 ? (
                <p className="text-3xl font-black text-byg-muted">---</p>
              ) : (
                monedasExistentes.map(m => {
                  const netoM = statsByMoneda[m].ingresos.minus(statsByMoneda[m].egresos);
                  return (
                    <div key={m} className="flex items-baseline justify-between gap-4">
                      <span className="text-[10px] font-bold text-byg-muted">{m}</span>
                      <p className={`text-xl font-black tabular-nums font-mono ${netoM.gte(0) ? "text-emerald-400" : "text-rose-400"}`}>
                        {fmt(netoM)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </header>

      <NuevoMovimientoInmobiliarioForm propiedades={propiedades} />

      <GestionPropiedades propiedades={propiedades} />

      {/* Filtros */}
      <section className="bg-byg-surface rounded-2xl border border-byg-border p-5 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-byg-border-2"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-byg-muted" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-byg-muted">Filtrar Movimientos</h3>
          </div>
          {hasFilters && (
            <Link 
              href="/carteras/inmobiliarias"
              className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors uppercase tracking-widest"
            >
              <X size={12} />
              Limpiar filtros
            </Link>
          )}
        </div>

        <form method="GET" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          {/* Por Propiedad */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Propiedad</label>
            <select
              name="propiedadId"
              defaultValue={filters.propiedadId || ""}
              className="bg-byg-bg border border-byg-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-byg-accent/20 text-byg-text"
            >
              <option value="">Todas las propiedades</option>
              {propiedades.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Por Tipo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Tipo de operación</label>
            <select
              name="tipo"
              defaultValue={filters.tipo || ""}
              className="bg-byg-bg border border-byg-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-byg-accent/20 text-byg-text"
            >
              <option value="">Todos los tipos</option>
              <option value="INGRESO">INGRESO</option>
              <option value="RENTA">RENTA</option>
              <option value="EGRESO">EGRESO</option>
              <option value="MEJORA">MEJORA</option>
              <option value="IMPUESTO">IMPUESTO</option>
            </select>
          </div>

          {/* Por Moneda */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Moneda</label>
            <select
              name="moneda"
              defaultValue={filters.moneda || ""}
              className="bg-byg-bg border border-byg-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-byg-accent/20 text-byg-text"
            >
              <option value="">Todas las monedas</option>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            Aplicar Filtros
          </button>
        </form>
      </section>

      {/* Main Table */}
      <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-byg-accent"></div>
        <div className="px-6 py-5 border-b border-byg-border flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-byg-text">Libro de Movimientos Inmobiliarios</h2>
          <span className="text-[11px] font-bold bg-byg-surface-2 text-byg-muted px-3 py-1 rounded-full uppercase tracking-tight">
            {movimientos.length} registros
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-byg-bg border-b border-byg-border">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest">Propiedad</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest text-right">Monto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest">Quién</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-byg-border/40">
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-byg-muted italic text-sm">
                      <Building2 size={40} className="mb-2 opacity-20" />
                      No hay movimientos inmobiliarios registrados.
                    </div>
                  </td>
                </tr>
              ) : (
                movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-byg-surface-2 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-black text-byg-text tracking-tight">{m.Propiedad.nombre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-medium text-byg-muted tabular-nums font-mono">
                        {new Date(m.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${TIPO_ESTILO[m.tipo] || "bg-byg-surface-2"}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium text-byg-muted truncate max-w-[250px] inline-block" title={m.descripcion}>
                        {m.descripcion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-[15px] font-black tabular-nums tracking-tight font-mono ${
                          m.tipo === "INGRESO" || m.tipo === "RENTA" ? "text-emerald-400" : "text-byg-text"
                        }`}>
                          {m.moneda} {fmt(m.monto)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold text-byg-muted uppercase tracking-tight bg-byg-surface-2 px-2 py-0.5 rounded border border-byg-border">
                        {m.quien}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
