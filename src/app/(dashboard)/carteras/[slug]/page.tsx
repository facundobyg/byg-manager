import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Decimal } from "@prisma/client/runtime/library";
import { CategoriaActivo } from "@prisma/client";
import { FileText } from "lucide-react";
import { AgregarActivoForm }       from "@/components/modules/carteras/AgregarActivoForm";
import { RowActions }              from "@/components/modules/carteras/RowActions";
import { EditSaldosCarteraForm }   from "@/components/modules/carteras/EditSaldosCarteraForm";
import Link                        from "next/link";

type PageProps = {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ editSaldos?: string }>;
};

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtNum(n: Decimal | number, d = 2) {
  return Number(n).toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtMoney(n: Decimal | number, moneda = "USD") {
  const num = Number(n);
  const abs = Math.abs(num);
  const prefix = moneda === "ARS" ? "$" : moneda === "USD" ? "USD" : String(moneda);
  const sign = num < 0 ? "−" : "";
  return `${sign}${prefix} ${abs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n: Decimal | number) {
  const num = Number(n);
  return `${num >= 0 ? "+" : ""}${num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<CategoriaActivo, { label: string; accent: string }> = {
  BONO_ARS:       { label: "Bonos ARS",                             accent: "border-l-amber-500"   },
  BONO_USD:       { label: "Bonos USD — Soberanos / Provinciales",  accent: "border-l-blue-500"    },
  ON_USD:         { label: "ONs en USD",                            accent: "border-l-indigo-500"  },
  ACCION_USD:     { label: "Acciones USD — Cable",                  accent: "border-l-emerald-500" },
  ACCION_USD_EXT: { label: "Acciones USD — MEP",                    accent: "border-l-teal-500"    },
  CEDEAR:         { label: "CEDEARs",                               accent: "border-l-violet-500"  },
  FCI:            { label: "FCI / Fondos",                          accent: "border-l-sky-500"     },
  CRIPTO:         { label: "Cripto — Posición Propia",              accent: "border-l-orange-500"  },
};

const COMPLETA_ORDER: CategoriaActivo[] = [
  "BONO_USD", "ON_USD", "ACCION_USD", "ACCION_USD_EXT", "CEDEAR", "FCI", "BONO_ARS",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type PosicionRow = {
  id: string;
  activoId: string;
  activo: {
    ticker: string;
    descripcion: string | null;
    precioActual: Decimal | null;
    monedaPrecio: string;
    categoria: CategoriaActivo;
  };
  cantidad: Decimal;
  precioCompra: Decimal;
  fecha: Date | null;
  _valorActual: Decimal;
  _inversion: Decimal;
  _ganancia: Decimal;
  _pct: Decimal;
  _hasPrecio: boolean;
};

type CustodiaDbRow = {
  id: string;
  Cliente: { nombre: string };
  Activo: {
    ticker: string;
    descripcion: string | null;
    precioActual: Decimal | null;
    monedaPrecio: string;
  };
  cantidadTotal: Decimal;
  precioPromedio: Decimal;
};

// ─── Position section ─────────────────────────────────────────────────────────

type Cliente = { id: string; nombre: string };

function PositionSection({
  label,
  accent,
  rows,
  carteraSlug,
  clientes,
}: {
  label: string;
  accent: string;
  rows: PosicionRow[];
  carteraSlug: string;
  clientes: Cliente[];
}) {
  const subtotal    = rows.reduce((acc, r) => acc.plus(r._valorActual), new Decimal(0));
  const subtotalInv = rows.reduce((acc, r) => acc.plus(r._inversion),   new Decimal(0));
  const ganancia    = subtotal.minus(subtotalInv);
  const defaultMoneda = rows[0]?.activo.monedaPrecio ?? "USD";

  return (
    <div className={`bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] ${accent} overflow-hidden`}>
      {/* Section header */}
      <div className="px-5 py-3 border-b border-byg-border bg-byg-bg flex items-center justify-between">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-byg-text">{label}</h3>
        <div className="flex items-center gap-3">
          {rows.length > 0 ? (
            <>
              <span className={`text-[11px] font-bold tabular-nums font-mono ${Number(ganancia) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {Number(ganancia) >= 0 ? "+" : ""}{fmtMoney(ganancia, defaultMoneda)}
              </span>
              <span className="text-[12px] font-black tabular-nums font-mono text-byg-text">{fmtMoney(subtotal, defaultMoneda)}</span>
            </>
          ) : (
            <span className="text-[11px] text-byg-muted font-bold">Sin posiciones</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="border-b border-byg-border bg-byg-bg">
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted w-[80px]">Ticker</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Descripción</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Cantidad</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">P. Compra</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Inversión</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">P. Actual</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">
                Valor {defaultMoneda !== "USD" ? `(${defaultMoneda})` : "(USD)"}
              </th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">G/P</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right w-[60px]">%</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-center w-[110px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-byg-border/30">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-6 text-center text-[12px] text-byg-muted italic">
                  Sin posiciones en esta categoría
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const moneda = row.activo.monedaPrecio;
                const g      = Number(row._ganancia);
                const pct    = Number(row._pct);
                return (
                  <tr key={row.id} className="group hover:bg-byg-surface-2 transition-colors">
                    <td className="px-5 py-2.5">
                      <span className="text-[11px] font-black font-mono text-byg-text bg-byg-surface-2 px-2 py-0.5 rounded">
                        {row.activo.ticker}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-[12px] text-byg-muted max-w-[160px] truncate">
                      {row.activo.descripcion || "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[12px] font-bold text-byg-text font-mono">
                      {fmtNum(row.cantidad)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[12px] text-byg-muted font-mono">
                      {fmtMoney(row.precioCompra, moneda)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[12px] font-bold text-byg-text font-mono">
                      {fmtMoney(row._inversion, moneda)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[12px] text-byg-muted font-mono">
                      {row._hasPrecio
                        ? fmtMoney(row.activo.precioActual!, moneda)
                        : <span className="text-byg-border-2 text-[10px] italic">Sin dato</span>
                      }
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[13px] font-black text-byg-text font-mono">
                      {fmtMoney(row._valorActual, moneda)}
                    </td>
                    <td className={`px-5 py-2.5 text-right tabular-nums text-[12px] font-black font-mono ${!row._hasPrecio ? "text-byg-border" : g >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {!row._hasPrecio ? "—" : (g >= 0 ? "+" : "") + fmtMoney(row._ganancia, moneda)}
                    </td>
                    <td className={`px-5 py-2.5 text-right tabular-nums text-[12px] font-black font-mono ${!row._hasPrecio ? "text-byg-border" : pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {!row._hasPrecio ? "—" : fmtPct(row._pct)}
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      <RowActions
                        posicionId={row.id}
                        activoId={row.activoId}
                        carteraSlug={carteraSlug}
                        ticker={row.activo.ticker}
                        categoriaActual={row.activo.categoria}
                        cantidadActual={Number(row.cantidad)}
                        precioCompraActual={Number(row.precioCompra)}
                        clientes={clientes}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Custodia section ─────────────────────────────────────────────────────────

function CustodiaSection({ custodias }: { custodias: CustodiaDbRow[] }) {
  return (
    <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-amber-400 overflow-hidden">
      <div className="px-5 py-3 border-b border-byg-border bg-byg-bg flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-400">Custodia de Clientes</h3>
          <p className="text-[9px] font-bold text-amber-400/70 mt-0.5">No suma a la posición propia de la firma</p>
        </div>
        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full">
          {custodias.length} posiciones
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[820px]">
          <thead>
            <tr className="border-b border-byg-border">
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Cliente</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted w-[90px]">Ticker</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Descripción</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Cantidad</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">P. Promedio</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">P. Actual</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Valor Custodiado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-byg-border/30">
            {custodias.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-[12px] text-byg-muted italic">
                  Sin activos en custodia de clientes
                </td>
              </tr>
            ) : (
              custodias.map((c) => {
                const moneda     = c.Activo.monedaPrecio;
                const precioAct  = c.Activo.precioActual;
                const valorTotal = precioAct
                  ? new Decimal(c.cantidadTotal.toString()).mul(precioAct.toString())
                  : new Decimal(c.cantidadTotal.toString()).mul(c.precioPromedio.toString());
                return (
                  <tr key={c.id} className="hover:bg-byg-surface-2 transition-colors">
                    <td className="px-5 py-2.5 text-[12px] font-bold text-byg-text">{c.Cliente.nombre}</td>
                    <td className="px-5 py-2.5">
                      <span className="text-[11px] font-black font-mono text-byg-text bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {c.Activo.ticker}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-[12px] text-byg-muted max-w-[160px] truncate">
                      {c.Activo.descripcion || "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[12px] font-bold text-byg-text font-mono">
                      {fmtNum(c.cantidadTotal)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[12px] text-byg-muted font-mono">
                      {fmtMoney(c.precioPromedio, moneda)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[12px] text-byg-muted font-mono">
                      {precioAct
                        ? fmtMoney(precioAct, moneda)
                        : <span className="text-byg-border-2 text-[10px] italic">Sin dato</span>
                      }
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[13px] font-black text-amber-400 font-mono">
                      {fmtMoney(valorTotal, moneda)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CarteraSlugPage({ params, searchParams }: PageProps) {
  const { slug }        = await params;
  const { editSaldos }  = await searchParams;
  const editingSaldos   = editSaldos === "1";

  const cartera = await prisma.cartera.findUnique({ where: { slug } });
  if (!cartera) notFound();

  const isCripto = cartera.tipo === "CRIPTO";

  const [posicionesRaw, custodiasRaw, clientes, tcConfig] = await Promise.all([
    prisma.posicionCartera.findMany({
      where: { carteraId: cartera.id },
      include: { Activo: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.custodiaCliente.findMany({
      include: { Activo: true, Cliente: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cliente.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);

  const tcBlue = Number(tcConfig?.valor ?? "1000");

  // Enrich positions with calculations
  const posiciones: PosicionRow[] = posicionesRaw.map((p) => {
    const qty = new Decimal(p.cantidad.toString());
    const pc  = new Decimal(p.precioCompra.toString());
    const pa  = p.Activo.precioActual ? new Decimal(p.Activo.precioActual.toString()) : null;
    const valorActual = pa ? qty.mul(pa) : qty.mul(pc);
    const inversion   = qty.mul(pc);
    const ganancia    = pa ? valorActual.minus(inversion) : new Decimal(0);
    const pct         = inversion.gt(0) && pa ? ganancia.div(inversion).mul(100) : new Decimal(0);

    return {
      id: p.id,
      activoId: p.activoId,
      activo: {
        ticker:       p.Activo.ticker,
        descripcion:  p.Activo.descripcion,
        precioActual: p.Activo.precioActual,
        monedaPrecio: p.Activo.monedaPrecio,
        categoria:    p.Activo.categoria,
      },
      cantidad:     qty,
      precioCompra: pc,
      fecha:        p.fecha,
      _valorActual: valorActual,
      _inversion:   inversion,
      _ganancia:    ganancia,
      _pct:         pct,
      _hasPrecio:   !!pa,
    };
  });

  // Portfolio totals in USD (own positions only — custody excluded).
  // ARS-priced positions (CEDEARs, BONO_ARS) are divided by tc_blue before summing.
  const totalValorActual = posiciones.reduce((acc, p) => {
    const val = p.activo.monedaPrecio === "ARS" ? p._valorActual.div(tcBlue) : p._valorActual;
    return acc.plus(val);
  }, new Decimal(0));
  const totalInversion = posiciones.reduce((acc, p) => {
    const inv = p.activo.monedaPrecio === "ARS" ? p._inversion.div(tcBlue) : p._inversion;
    return acc.plus(inv);
  }, new Decimal(0));
  const totalGanancia    = totalValorActual.minus(totalInversion);
  const totalPct         = totalInversion.gt(0) ? totalGanancia.div(totalInversion).mul(100) : new Decimal(0);

  // Saldos disponibles from cartera model
  const saldoUSDCable = new Decimal(cartera.saldoUSDCable.toString());
  const saldoUSDMep   = new Decimal(cartera.saldoUSDMep.toString());
  const saldoPesos    = new Decimal(cartera.saldoPesos.toString());

  // Group positions by category, sorted alphabetically within each group
  const byCategoria = new Map<CategoriaActivo, PosicionRow[]>();
  posiciones.forEach((p) => {
    const cat = p.activo.categoria;
    if (!byCategoria.has(cat)) byCategoria.set(cat, []);
    byCategoria.get(cat)!.push(p);
  });
  byCategoria.forEach((rows) =>
    rows.sort((a, b) => a.activo.ticker.localeCompare(b.activo.ticker, "es", { sensitivity: "base" }))
  );

  const sectionOrder: CategoriaActivo[] = isCripto ? ["CRIPTO"] : COMPLETA_ORDER;

  const gNum = Number(totalGanancia);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="bg-byg-surface rounded-2xl border border-byg-border p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-600" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">
              Gestión de Cartera
            </p>
            <h1 className="text-3xl font-black text-byg-text tracking-tight">{cartera.nombre}</h1>
            <p className="text-xs text-byg-muted mt-1 font-medium">
              {isCripto ? "Portafolio de criptomonedas" : "Portafolio de inversiones"} —
              Custodia de clientes <span className="font-black text-amber-500">no suma</span> a la posición propia.
            </p>
          </div>
          <div className="flex gap-2 shrink-0 mt-1 relative">
            <button
              disabled
              title="Exportar PDF — próximamente"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-byg-border text-[11px] font-black uppercase tracking-widest text-byg-muted bg-byg-surface-2 cursor-not-allowed"
            >
              <FileText size={13} /> PDF
            </button>
            <AgregarActivoForm
              carteraId={cartera.id}
              carteraSlug={slug}
              isCripto={isCripto}
            />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Valor actual */}
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-blue-600 p-5 flex flex-col gap-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Valor Actual</p>
          <p className="text-xl font-black text-byg-text tabular-nums tracking-tighter truncate font-mono">
            {fmtMoney(totalValorActual)}
          </p>
          <p className="text-xs font-bold text-byg-muted">{posiciones.length} activos en cartera</p>
        </div>

        {/* Inversión */}
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-byg-border-2 p-5 flex flex-col gap-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Inversión Total</p>
          <p className="text-xl font-black text-byg-text tabular-nums tracking-tighter truncate font-mono">
            {fmtMoney(totalInversion)}
          </p>
          <p className="text-xs font-bold text-byg-muted">Capital invertido</p>
        </div>

        {/* Ganancia/Pérdida */}
        <div className={`bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] p-5 flex flex-col gap-1 min-w-0 ${gNum >= 0 ? "border-l-emerald-500" : "border-l-rose-500"}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Ganancia / Pérdida</p>
          <p className={`text-xl font-black tabular-nums tracking-tighter truncate font-mono ${gNum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {fmtMoney(totalGanancia)}
          </p>
          <p className={`text-xs font-black tabular-nums font-mono ${gNum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {fmtPct(totalPct)}
          </p>
        </div>

        {/* Vs mes anterior */}
        <div className="bg-byg-surface rounded-2xl border border-byg-border p-5 flex flex-col gap-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Vs Mes Anterior</p>
          <p className="text-xl font-black text-byg-muted tabular-nums">—</p>
          <p className="text-[10px] font-bold text-byg-muted">Sin snapshot disponible</p>
        </div>
      </div>

      {/* Saldos disponibles */}
      <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-byg-border-2 overflow-hidden">
        <div className="px-5 py-3 border-b border-byg-border bg-byg-bg flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-byg-text">
              {isCripto ? "Saldo Exchange / Billetera" : "Saldos Disponibles"}
            </h3>
            <p className="text-[9px] text-byg-muted font-medium mt-0.5">
              Estos saldos provienen de transferencias internas Caja↔Cartera.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-byg-muted">Total USD</p>
              <p className="text-[14px] font-black tabular-nums text-byg-text font-mono">
                {fmtMoney(saldoUSDCable.plus(saldoUSDMep))}
              </p>
            </div>
            <Link
              href={editingSaldos ? `/carteras/${slug}` : `/carteras/${slug}?editSaldos=1`}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                editingSaldos
                  ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                  : "bg-byg-surface-2 text-byg-muted hover:bg-byg-border"
              }`}
            >
              {editingSaldos ? "Cancelar" : "Editar"}
            </Link>
          </div>
        </div>

        {editingSaldos ? (
          <EditSaldosCarteraForm
            carteraId={cartera.id}
            slug={slug}
            saldoPesos={Number(saldoPesos)}
            saldoUSDCable={Number(saldoUSDCable)}
            saldoUSDMep={Number(saldoUSDMep)}
            isCripto={isCripto}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead>
                <tr className="border-b border-byg-border">
                  <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Concepto</th>
                  <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-byg-border/30">
                <tr className="hover:bg-byg-surface-2 transition-colors">
                  <td className="px-5 py-2.5 text-[12px] font-bold text-byg-text">
                    {isCripto ? "USD (Exchange)" : "USD Cable"}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-[13px] font-black text-byg-text font-mono">
                    {fmtMoney(saldoUSDCable)}
                  </td>
                </tr>
                <tr className="hover:bg-byg-surface-2 transition-colors">
                  <td className="px-5 py-2.5 text-[12px] font-bold text-byg-text">
                    {isCripto ? "USD (Billetera)" : "USD MEP"}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-[13px] font-black text-byg-text font-mono">
                    {fmtMoney(saldoUSDMep)}
                  </td>
                </tr>
                <tr className="hover:bg-byg-surface-2 transition-colors">
                  <td className="px-5 py-2.5 text-[12px] font-bold text-byg-text">
                    {isCripto ? "ARS" : "Pesos (ARS)"}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-[13px] font-black text-byg-text font-mono">
                    {fmtMoney(saldoPesos, "ARS")}
                  </td>
                </tr>
                <tr className="bg-byg-bg border-t border-byg-border">
                  <td className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-byg-muted">
                    Total USD disponible
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-[13px] font-black text-byg-text font-mono">
                    {fmtMoney(saldoUSDCable.plus(saldoUSDMep))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category sections */}
      {sectionOrder.map((cat) => {
        const config = CATEGORY_CONFIG[cat];
        const rows   = byCategoria.get(cat) ?? [];
        return (
          <PositionSection
            key={cat}
            label={config.label}
            accent={config.accent}
            rows={rows}
            carteraSlug={slug}
            clientes={clientes}
          />
        );
      })}

      {/* Opciones y Futuros — placeholder (no category in schema yet) */}
      {!isCripto && (
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-rose-300 overflow-hidden">
          <div className="px-5 py-3 border-b border-byg-border bg-byg-bg flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-byg-text">Opciones y Futuros</h3>
            <span className="text-[11px] text-byg-muted font-bold">Sin posiciones</span>
          </div>
          <div className="px-5 py-5 text-center text-[12px] text-byg-muted italic bg-byg-surface">
            Sin posiciones en esta categoría
          </div>
        </div>
      )}

      {/* Custodia — informational only, never summed to own total */}
      {custodiasRaw.length > 0 && <CustodiaSection custodias={custodiasRaw} />}
    </div>
  );
}
