import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { CategoriaActivo } from "@prisma/client";
import { UpdatePrecioActivoForm } from "@/components/modules/configuracion/UpdatePrecioActivoForm";
import { PreciosBatchTextareaForm } from "@/components/modules/configuracion/PreciosBatchTextareaForm";
import { DownloadPricesCSV } from "@/components/modules/configuracion/DownloadPricesCSV";
import { CreateActivoForm } from "@/components/modules/configuracion/CreateActivoForm";
import Link from "next/link";

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS: { cat: CategoriaActivo; label: string; accent: string }[] = [
  { cat: "BONO_USD",       label: "Bonos USD — Soberanos / Provinciales", accent: "border-l-blue-500"    },
  { cat: "ON_USD",         label: "ONs en USD",                           accent: "border-l-indigo-500"  },
  { cat: "ACCION_USD",     label: "Acciones USD — Cable",                 accent: "border-l-emerald-500" },
  { cat: "ACCION_USD_EXT", label: "Acciones USD — MEP",                   accent: "border-l-teal-500"    },
  { cat: "CEDEAR",         label: "CEDEARs",                              accent: "border-l-violet-500"  },
  { cat: "FCI",            label: "FCI / Fondos",                         accent: "border-l-sky-500"     },
  { cat: "CRIPTO",         label: "Cripto",                               accent: "border-l-orange-500"  },
  { cat: "BONO_ARS",       label: "Bonos ARS",                            accent: "border-l-amber-500"   },
];

// ─── Row type (all plain — no Decimal) ───────────────────────────────────────

type Row = {
  id:            string;
  ticker:        string;
  descripcion:   string | null;
  categoria:     CategoriaActivo;
  monedaPrecio:  string;
  precioActual:  number | null;
  cantidadTotal: number;
  origins:       string[];
};

// ─── Section component ────────────────────────────────────────────────────────

function PreciosSection({
  label,
  accent,
  rows,
  selectedHistorialId,
}: {
  label: string;
  accent: string;
  rows: Row[];
  selectedHistorialId: string | null;
}) {
  const sinPrecio = rows.filter((r) => r.precioActual === null).length;

  return (
    <div className={`bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] ${accent} overflow-hidden`}>
      <div className="px-5 py-3 border-b border-byg-border bg-byg-bg flex items-center justify-between">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-byg-text">{label}</h3>
        <div className="flex items-center gap-3">
          {sinPrecio > 0 && (
            <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
              {sinPrecio} sin precio
            </span>
          )}
          <span className="text-[11px] text-byg-muted font-bold">{rows.length} activos</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[860px]">
          <thead>
            <tr className="border-b border-byg-border bg-byg-bg">
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted w-[90px]">Ticker</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Descripción</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted w-[60px]">Moneda</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Precio</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted w-[70px]">Estado</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Origen</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Actualizar</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Hist.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-byg-border/40">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-byg-surface-2 transition-colors">
                <td className="px-4 py-2.5">
                  <span className="text-[11px] font-black font-mono text-byg-text bg-byg-surface-2 px-2 py-0.5 rounded">
                    {row.ticker}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[12px] text-byg-muted max-w-[180px] truncate">
                  {row.descripcion || "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    row.monedaPrecio === "ARS"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-byg-accent/15 text-byg-accent"
                  }`}>
                    {row.monedaPrecio}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-mono text-[12px] font-bold text-byg-text">
                  {row.precioActual !== null
                    ? row.precioActual.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                    : <span className="text-byg-border-2 text-[10px] italic">—</span>
                  }
                </td>
                <td className="px-4 py-2.5">
                  {row.precioActual === null
                    ? <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">SIN PRECIO</span>
                    : <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">OK</span>
                  }
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {row.origins.map((origin) => (
                      <span key={origin} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        origin === "Cartera Propia"
                          ? "bg-indigo-500/15 text-indigo-400"
                          : "bg-teal-500/15 text-teal-400"
                      }`}>
                        {origin}
                      </span>
                    ))}
                    {row.origins.length === 0 && (
                      <span className="text-[10px] text-byg-border-2 italic">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <UpdatePrecioActivoForm
                    activoId={row.id}
                    precioActual={row.precioActual !== null ? String(row.precioActual) : ""}
                    moneda={row.monedaPrecio}
                  />
                </td>
                <td className="px-4 py-2.5 text-right">
                  {selectedHistorialId === row.id ? (
                    <Link
                      href="/precios"
                      className="text-[10px] font-bold text-byg-accent underline"
                    >
                      ✕
                    </Link>
                  ) : (
                    <Link
                      href={`/precios?historialId=${row.id}`}
                      className="text-[10px] font-bold text-byg-muted hover:text-byg-accent transition-colors"
                    >
                      Ver
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Historial panel ─────────────────────────────────────────────────────────

type HistorialRow = {
  mes:       string;
  fechaUTC:  string;
  precio:    number;
  variacion: number | null;
  userId:    string | null;
};

async function buildHistorial(activoId: string): Promise<{ ticker: string; rows: HistorialRow[] } | null> {
  const activo = await prisma.activo.findUnique({ where: { id: activoId }, select: { ticker: true } });
  if (!activo) return null;

  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 12);
  since.setUTCDate(1);

  const rows = await prisma.precioHistorico.findMany({
    where: { activoId, fecha: { gte: since } },
    orderBy: { fecha: "asc" },
  });

  const histRows: HistorialRow[] = rows.map((r, i) => {
    const prev = i > 0 ? Number(rows[i - 1].precio) : null;
    const cur  = Number(r.precio);
    return {
      mes:       r.fecha.toISOString().slice(0, 7),
      fechaUTC:  r.fecha.toISOString().slice(0, 10),
      precio:    cur,
      variacion: prev !== null ? ((cur - prev) / prev) * 100 : null,
      userId:    r.userId,
    };
  });

  return { ticker: activo.ticker, rows: histRows.reverse() };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PreciosPage({ searchParams }: { searchParams: Promise<{ historialId?: string }> }) {
  await requirePermission("activos:leer");
  const params = await searchParams;
  const historialActivoId = params.historialId ?? null;

  const [activosRaw, historialData] = await Promise.all([
    prisma.activo.findMany({
      include: {
        PosicionCartera: { select: { id: true } },
        CustodiaCliente: { select: { id: true } },
      },
      orderBy: [{ categoria: "asc" }, { ticker: "asc" }],
    }),
    historialActivoId ? buildHistorial(historialActivoId) : Promise.resolve(null),
  ]);

  // Build plain rows — no Decimal
  const rows: Row[] = activosRaw.map((a) => {
    const origins: string[] = [];
    if (a.PosicionCartera.length > 0) origins.push("Cartera Propia");
    if (a.CustodiaCliente.length > 0) origins.push("Cartera Clientes");

    return {
      id:            a.id,
      ticker:        a.ticker,
      descripcion:   a.descripcion,
      categoria:     a.categoria,
      monedaPrecio:  a.monedaPrecio,
      precioActual:  a.precioActual !== null ? Number(a.precioActual) : null,
      cantidadTotal: 0,
      origins,
    };
  });

  const total    = rows.length;
  const sinPrecio = rows.filter((r) => r.precioActual === null).length;
  const conARS    = rows.filter((r) => r.precioActual !== null && r.monedaPrecio === "ARS").length;
  const conUSD    = rows.filter((r) => r.precioActual !== null && r.monedaPrecio === "USD").length;

  // Group by category
  const bycat = new Map<CategoriaActivo, Row[]>();
  rows.forEach((r) => {
    if (!bycat.has(r.categoria)) bycat.set(r.categoria, []);
    bycat.get(r.categoria)!.push(r);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-byg-surface rounded-2xl border border-byg-border p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-violet-500" />
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em] mb-1">Administración</p>
            <h1 className="text-3xl font-black text-byg-text tracking-tight">Precios de Activos</h1>
            <div className="flex gap-2 mt-4">
              <DownloadPricesCSV data={rows.map(r => ({
                ticker: r.ticker,
                descripcion: r.descripcion,
                categoria: r.categoria,
                monedaPrecio: r.monedaPrecio,
                precioActual: r.precioActual
              }))} />
              <CreateActivoForm />
            </div>
          </div>
          {/* Stats */}
          <div className="flex gap-4 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-black text-byg-text tabular-nums font-mono">{total}</p>
              <p className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-rose-400 tabular-nums font-mono">{sinPrecio}</p>
              <p className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">Sin precio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-amber-400 tabular-nums font-mono">{conARS}</p>
              <p className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">ARS</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-byg-accent tabular-nums font-mono">{conUSD}</p>
              <p className="text-[10px] font-bold text-byg-muted uppercase tracking-wider">USD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial panel */}
      {historialData && (
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-violet-500 overflow-hidden">
          <div className="px-5 py-3 border-b border-byg-border bg-byg-bg flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Historial de precios</p>
              <p className="text-sm font-black text-byg-text font-mono">{historialData.ticker}</p>
            </div>
            <Link href="/precios" className="text-xs font-bold text-byg-muted hover:text-byg-accent transition-colors">
              ✕ Cerrar
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="bg-byg-bg border-b border-byg-border">
                  {["Fecha", "Precio", "Var. %"].map((h, i) => (
                    <th key={i} className={`px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-byg-muted ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historialData.rows.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-4 text-center text-byg-muted italic text-xs">Sin datos en los últimos 12 meses</td></tr>
                ) : historialData.rows.map((r) => (
                  <tr key={r.fechaUTC} className="border-b border-byg-border/40 last:border-0 hover:bg-byg-surface-2 transition-colors">
                    <td className="px-4 py-2 text-byg-muted font-mono">{r.fechaUTC}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-mono font-bold text-byg-text">
                      {r.precio.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td className={`px-4 py-2 text-right tabular-nums font-mono font-bold ${
                      r.variacion === null ? "text-byg-muted"
                      : r.variacion > 0 ? "text-emerald-400"
                      : r.variacion < 0 ? "text-red-400"
                      : "text-byg-muted"
                    }`}>
                      {r.variacion === null ? "—"
                        : `${r.variacion > 0 ? "+" : ""}${r.variacion.toFixed(2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch */}
      <details className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-violet-500">
        <summary className="px-6 py-4 cursor-pointer select-none flex items-center justify-between hover:bg-byg-surface-2 transition-colors rounded-2xl">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-byg-text">Carga Batch</span>
            <span className="ml-3 text-[10px] text-byg-muted font-medium font-mono">Pega tu Excel (TICKER PRECIO) o usa comas/puntos y coma</span>
          </div>
          <span className="text-[10px] text-byg-muted font-bold">▾</span>
        </summary>
        <div className="px-6 pb-6 pt-2">
          <PreciosBatchTextareaForm />
        </div>
      </details>

      {/* Sections by category */}
      {SECTIONS.map(({ cat, label, accent }) => {
        const sectionRows = bycat.get(cat);
        if (!sectionRows || sectionRows.length === 0) return null;
        return (
          <PreciosSection key={cat} label={label} accent={accent} rows={sectionRows} selectedHistorialId={historialActivoId} />
        );
      })}
    </div>
  );
}
