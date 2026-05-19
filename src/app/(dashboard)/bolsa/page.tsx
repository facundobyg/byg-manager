import { CandlestickChart } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMesOperativo } from "@/lib/services/config.service";
import { getOperacionesMesaDiaria } from "@/lib/data/operacion-bolsa";
import { getOperacionesBolsa } from "@/lib/data/operacion-bolsa";
import { MesaDiariaForm } from "@/components/modules/bolsa/MesaDiariaForm";
import { MesaDiariaTable } from "@/components/modules/bolsa/MesaDiariaTable";
import { BolsaTabla } from "@/components/modules/bolsa/BolsaTabla";
import type { BolsaRow } from "@/components/modules/bolsa/BolsaTabla";
import { TabsNav } from "@/components/modules/bolsa/TabsNav";

type SearchParams = Promise<{ fecha?: string; tab?: string; mes?: string }>;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default async function BolsaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const fecha  = params.fecha || todayStr();
  const tab    = params.tab   || "mesa";

  // Resolve active month for historial default
  const mesOperativo = tab === "historial" ? await getMesOperativo() : null;
  const now          = new Date();
  const mesCalendario = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const historialMes = tab === "historial" ? (params.mes ?? mesOperativo ?? mesCalendario) : undefined;

  // Month navigation helpers for historial
  const histNavMes = historialMes ?? mesCalendario;
  const [hYear, hMonth] = histNavMes.split("-").map(Number);
  const histPrevMes = (() => {
    const d = new Date(Date.UTC(hYear, hMonth - 2, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();
  const histNextMes = (() => {
    const d = new Date(Date.UTC(hYear, hMonth, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();
  const histIsCurrentMes = histNavMes === mesCalendario;
  const histMesLabel = new Date(Date.UTC(hYear, hMonth - 1, 1))
    .toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });

  // Mesa Diaria data
  const [mesaData, carteras, comitentes] = tab !== "historial"
    ? await Promise.all([
        getOperacionesMesaDiaria(fecha),
        prisma.cartera.findMany({
          where: { activa: true, tipo: { not: "CRIPTO" }, slug: { not: "binance" } },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        }),
        prisma.comitenteInversion.findMany({
          where: { activo: true },
          select: { id: true, nombre: true, nroComitente: true },
          orderBy: { nombre: "asc" },
        }),
      ])
    : [null, [], []];

  // Historial data (filtered by active month)
  const historialOps = tab === "historial" ? await getOperacionesBolsa(historialMes) : null;

  const historialRows: BolsaRow[] = historialOps
    ? historialOps.map((op) => ({
        id:            op.id,
        fechaCarga:    op.fechaCarga.toISOString(),
        sujeto:        op.ComitenteInversion?.nombre ?? op.Cliente?.nombre ?? op.Cartera?.nombre ?? "Cartera Propia",
        tipoOperacion: op.tipoOperacion as string,
        ticker:        op.ticker,
        cantidad:      Number(op.cantidad),
        precio:        Number(op.precio),
        moneda:        op.moneda as string,
        estado:        op.estado as string,
        operador:      op.OperadorCarga.name,
        anulada:       op.anulada,
      }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="bg-byg-surface rounded-2xl border border-byg-border p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-byg-accent" />
        <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em] mb-1">Operativa</p>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-byg-text tracking-tight flex items-center gap-3">
              <CandlestickChart size={28} className="text-byg-accent" />
              Operaciones Bolsa
            </h1>
            <p className="text-xs font-medium text-byg-muted mt-1">
              {tab !== "historial" ? `Mesa diaria — ${fecha}` : "Historial de operaciones"}
            </p>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <TabsNav fecha={fecha} tab={tab} />

      {/* Mesa Diaria */}
      {tab !== "historial" && mesaData && (
        <>
          <MesaDiariaForm
            comitentes={comitentes}
            carteras={carteras}
            defaultFecha={fecha}
          />
          <MesaDiariaTable data={mesaData} />
        </>
      )}

      {/* Historial */}
      {tab === "historial" && (
        <>
          {/* Month navigation */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/bolsa?tab=historial&mes=${histPrevMes}`}
              className="px-3 py-1.5 rounded-lg border border-byg-border bg-byg-surface text-byg-muted hover:text-byg-accent hover:border-byg-accent/40 text-[11px] font-black transition-colors"
            >
              ←
            </Link>
            <span className="text-[12px] font-bold text-byg-text tabular-nums capitalize min-w-[140px] text-center">
              {histMesLabel}
            </span>
            <Link
              href={`/bolsa?tab=historial&mes=${histNextMes}`}
              className={`px-3 py-1.5 rounded-lg border border-byg-border bg-byg-surface text-[11px] font-black transition-colors ${
                histIsCurrentMes ? "opacity-30 pointer-events-none text-byg-muted" : "text-byg-muted hover:text-byg-accent hover:border-byg-accent/40"
              }`}
            >
              →
            </Link>
            <span className="text-[10px] text-byg-muted font-mono">{historialRows.length} ops</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total",       value: historialRows.length,                                              color: "text-byg-text",    top: "border-t-byg-border-2" },
              { label: "Pendientes",  value: historialRows.filter((r) => r.estado === "PENDIENTE_CONCERTACION").length, color: "text-amber-400",   top: "border-t-amber-400" },
              { label: "Concertadas", value: historialRows.filter((r) => r.estado === "CONCERTADA").length,     color: "text-byg-accent",  top: "border-t-blue-500" },
              { label: "Liquidadas",  value: historialRows.filter((r) => r.estado === "LIQUIDADA").length,      color: "text-emerald-400", top: "border-t-emerald-500" },
            ].map(({ label, value, color, top }) => (
              <div key={label} className={`bg-byg-surface rounded-xl border border-byg-border border-t-[3px] ${top} p-5`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-1">{label}</p>
                <p className={`text-3xl font-black tabular-nums font-mono tracking-tight ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <BolsaTabla rows={historialRows} />
        </>
      )}
    </div>
  );
}
