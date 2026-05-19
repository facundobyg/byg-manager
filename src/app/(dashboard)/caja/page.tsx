import Link from "next/link";
import { getCajasWithBalances, getPendingPrincipalSummary } from "@/lib/data/caja";
import { getMovimientosCaja } from "@/lib/data/movimientos-caja";
import { CajaGrid } from "@/components/modules/caja/CajaGrid";
import { CajaActions } from "@/components/modules/caja/CajaActions";
import { MovimientosCajaTable } from "@/components/modules/caja/MovimientosCajaTable";
import { PlusCircle } from "lucide-react";
import { readOnlyPreview } from "@/lib/config";
import { TipoMovCaja } from "@prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { getMesOperativo } from "@/lib/services/config.service";

const TIPOS: TipoMovCaja[] = ["ENTRADA", "SALIDA", "TRANSFERENCIA_IN", "TRANSFERENCIA_OUT"];

const INPUT_CLS = "border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700";

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ cajaId?: string; tipo?: string; desde?: string; hasta?: string; all?: string }>;
}) {
  await requirePermission("caja:leer");
  const params = await searchParams;
  const { cajaId, tipo, desde, hasta, all } = params;

  const tipoFiltro = TIPOS.includes(tipo as TipoMovCaja) ? (tipo as TipoMovCaja) : undefined;

  // Default to active month when no date params and not requesting full history
  const sinFechas = !desde && !hasta && all !== "1";
  const mesOperativo = sinFechas ? await getMesOperativo() : null;

  let desdeDate: Date | undefined;
  let hastaDate: Date | undefined;

  if (desde) {
    desdeDate = new Date(desde);
  } else if (mesOperativo) {
    const [y, m] = mesOperativo.split("-").map(Number);
    desdeDate = new Date(Date.UTC(y, m - 1, 1));
  }

  if (hasta) {
    hastaDate = new Date(hasta);
  } else if (mesOperativo) {
    const [y, m] = mesOperativo.split("-").map(Number);
    hastaDate = new Date(Date.UTC(y, m, 0)); // last day of month (lte)
  }

  const mesLabel = mesOperativo
    ? (() => {
        const [y, m] = mesOperativo.split("-").map(Number);
        return new Date(Date.UTC(y, m - 1, 1))
          .toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
      })()
    : null;

  const [cajasRaw, movimientos, pendingSummary, carteras] = await Promise.all([
    getCajasWithBalances(),
    getMovimientosCaja({
      cajaId: cajaId || undefined,
      tipo: tipoFiltro,
      desde: desdeDate,
      hasta: hastaDate,
    }),
    getPendingPrincipalSummary(),
    prisma.cartera.findMany({
      select: { id: true, nombre: true, slug: true },
      orderBy: { orden: "asc" },
    }),
  ]);

  const cajas = cajasRaw.map(c => ({
    ...c,
    saldoInicialUSD: Number(c.saldoInicialUSD),
    saldoInicialARS: Number(c.saldoInicialARS),
    saldoActualUSD: Number(c.saldoActualUSD),
    saldoActualARS: Number(c.saldoActualARS),
  }));

  const totalUSD = cajas.reduce((s, c) => s + c.saldoActualUSD, 0);
  const totalARS = cajas.reduce((s, c) => s + c.saldoActualARS, 0);

  function fmt(n: number, decimals = 2) {
    return n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  const hayFiltros = !!(cajaId || tipo || desde || hasta || all === "1");

  const principal = cajas.find(c => c.esPrincipal);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-row items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Cajas</h1>
          <p className="text-slate-500 mt-1">Control de disponibilidades y arqueos de caja oficina y externas.</p>
        </div>

        {readOnlyPreview && (
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-100 text-amber-700">
            Modo lectura
          </span>
        )}
      </header>

      {/* Operational summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cajas activas</p>
          <p className="text-3xl font-black text-slate-900 tabular-nums">{cajas.length}</p>
        </div>

        <div className={`rounded-xl border shadow-sm p-5 flex flex-col gap-1 ${pendingSummary.count > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendiente principal</p>
          <p className={`text-3xl font-black tabular-nums ${pendingSummary.count > 0 ? "text-amber-700" : "text-slate-900"}`}>
            {pendingSummary.count}
          </p>
          {pendingSummary.count > 0 && (
            <div className="flex flex-col gap-0.5 mt-1">
              {pendingSummary.totalUSD !== 0 && (
                <p className="text-[11px] font-bold text-amber-600 tabular-nums">USD {fmt(pendingSummary.totalUSD)}</p>
              )}
              {pendingSummary.totalARS !== 0 && (
                <p className="text-[11px] font-bold text-amber-600 tabular-nums">$ {fmt(pendingSummary.totalARS)}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total USD</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">USD {fmt(totalUSD)}</p>
          <p className="text-[10px] text-slate-400 font-medium">confirmados</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total ARS</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">$ {fmt(totalARS)}</p>
          <p className="text-[10px] text-slate-400 font-medium">confirmados</p>
        </div>
      </div>

      {!readOnlyPreview && (
        <CajaActions 
          cajas={cajas as any} 
          carteras={carteras} 
          defaultCajaId={principal?.id} 
          defaultSlug={principal?.slug} 
        />
      )}

      <CajaGrid cajas={cajas as any} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
              Movimientos — todas las cajas
            </h2>
            {mesOperativo && mesLabel && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 capitalize">
                {mesLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {mesOperativo && (
              <Link href="/caja?all=1" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                Ver todo el historial →
              </Link>
            )}
            {hayFiltros && (
              <Link href="/caja" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                Limpiar filtros ×
              </Link>
            )}
          </div>
        </div>

        <form method="GET" action="/caja" className="flex flex-wrap gap-3 items-end bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Caja</label>
            <select name="cajaId" defaultValue={cajaId ?? ""} className={INPUT_CLS}>
              <option value="">Todas</option>
              {cajas.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
            <select name="tipo" defaultValue={tipo ?? ""} className={INPUT_CLS}>
              <option value="">Todos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Desde</label>
            <input type="date" name="desde" defaultValue={desde ?? ""} className={INPUT_CLS} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Hasta</label>
            <input type="date" name="hasta" defaultValue={hasta ?? ""} className={INPUT_CLS} />
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Filtrar
          </button>
        </form>

        <MovimientosCajaTable rows={movimientos} />
      </section>
    </div>
  );
}
