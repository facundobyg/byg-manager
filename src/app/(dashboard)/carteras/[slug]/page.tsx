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
  searchParams: Promise<{
    editSaldos?: string;
    q?: string;
    filtro?: string;
    histTicker?: string;
  }>;
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
  _asignado: number;
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

type TransferenciaRow = {
  id: string;
  fecha: Date;
  cantidad: Decimal;
  precioEnTransferencia: Decimal;
  notas: string | null;
  Activo: { ticker: string; descripcion: string | null };
  CustodiaCliente: { Cliente: { nombre: string } } | null;
  User: { name: string };
};

// ─── Position section ─────────────────────────────────────────────────────────

type Cliente = { id: string; nombre: string };

function PositionSection({
  label,
  accent,
  rows,
  carteraSlug,
  clientes,
  histTicker,
  filtro,
  q,
}: {
  label: string;
  accent: string;
  rows: PosicionRow[];
  carteraSlug: string;
  clientes: Cliente[];
  histTicker?: string | null;
  filtro?: string | null;
  q?: string | null;
}) {
  const subtotal    = rows.reduce((acc, r) => acc.plus(r._valorActual), new Decimal(0));
  const subtotalInv = rows.reduce((acc, r) => acc.plus(r._inversion),   new Decimal(0));
  const ganancia    = subtotal.minus(subtotalInv);
  const defaultMoneda = rows[0]?.activo.monedaPrecio ?? "USD";
  const sinPrecio   = rows.filter((r) => !r._hasPrecio);
  const conCustodia = rows.filter((r) => r._asignado > 0);

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

      {sinPrecio.length > 0 && (
        <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">⚠ Sin precio</span>
          <span className="text-[10px] text-amber-500/80">
            {sinPrecio.map((r) => r.activo.ticker).join(", ")} — valorización usa precio de compra como fallback
          </span>
        </div>
      )}
      {conCustodia.length > 0 && rows.length > 0 && (
        <div className="px-5 py-2 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-2">
          <span className="text-[10px] font-bold text-amber-500/70">
            {conCustodia.length} activo{conCustodia.length !== 1 ? "s" : ""} con cantidad parcial en custodia de clientes
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="border-b border-byg-border bg-byg-bg">
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted w-[80px]">Ticker</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Descripción</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Disponible</th>
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
                      {row._asignado > 0 && (
                        <div className="text-[9px] font-bold text-amber-500 mt-0.5 whitespace-nowrap">
                          +{fmtNum(row._asignado)} custodia
                        </div>
                      )}
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
                        : <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">Sin precio ⚠</span>
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
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
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
                        <Link
                          href={
                            histTicker === row.activo.ticker
                              ? `/carteras/${carteraSlug}${filtro ? `?filtro=${filtro}` : ""}${q ? `${filtro ? "&" : "?"}q=${q}` : ""}`
                              : `/carteras/${carteraSlug}?histTicker=${row.activo.ticker}${filtro ? `&filtro=${filtro}` : ""}${q ? `&q=${q}` : ""}`
                          }
                          className={`text-[9px] font-black px-2 py-1 rounded border transition-colors uppercase tracking-widest whitespace-nowrap ${
                            histTicker === row.activo.ticker
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-byg-surface text-byg-muted border-byg-border hover:border-blue-400/40 hover:text-blue-400"
                          }`}
                        >
                          Hist.
                        </Link>
                      </div>
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

// ─── Historial activo section ─────────────────────────────────────────────────

const HIST_TIPO_LABEL: Record<string, string> = {
  COMPRA_BONO:        "Compra Bono",   VENTA_BONO:         "Venta Bono",
  COMPRA_ACCION:      "Compra Acc.",   VENTA_ACCION:       "Venta Acc.",
  COMPRA_CEDEAR:      "Compra CEDEAR", VENTA_CEDEAR:       "Venta CEDEAR",
  CAUCION_COLOCADORA: "Caución Col.",  CAUCION_TOMADORA:   "Caución Tom.",
  MEP:                "MEP",           SENEBI:             "SENEBI",
  FUTURO:             "Futuro",        OPCION_CALL:        "Call",
  OPCION_PUT:         "Put",
};

type HistOp = {
  id: string; tipoOperacion: string; cantidad: Decimal; precio: Decimal;
  moneda: string; estado: string; anulada: boolean;
  fechaOperativa: Date | null; fechaCarga: Date;
  OperadorCarga: { name: string };
};
type HistTransf = {
  id: string; fecha: Date; createdAt: Date;
  cantidad: Decimal; precioEnTransferencia: Decimal; notas: string | null;
  User: { name: string };
  CustodiaCliente: { Cliente: { nombre: string } } | null;
};

function HistorialActivoSection({
  ticker,
  ops,
  transferencias,
  slug,
}: {
  ticker: string;
  ops: HistOp[];
  transferencias: HistTransf[];
  slug: string;
}) {
  type Evt = {
    key: string; fecha: Date; badge: "compra" | "venta" | "custodia" | "anulada";
    accion: string; qty: number; moneda: string; operador: string; ref: string;
  };

  const VENTA_SET = new Set(["VENTA_BONO","VENTA_ACCION","VENTA_CEDEAR"]);
  const events: Evt[] = [
    ...ops.map((o): Evt => ({
      key:      o.id,
      fecha:    o.fechaOperativa ?? o.fechaCarga,
      badge:    o.anulada ? "anulada" : VENTA_SET.has(o.tipoOperacion) ? "venta" : "compra",
      accion:   `${HIST_TIPO_LABEL[o.tipoOperacion] ?? o.tipoOperacion}${o.anulada ? " (ANULADA)" : ""}`,
      qty:      Number(o.cantidad),
      moneda:   o.moneda,
      operador: o.OperadorCarga.name,
      ref:      `#${o.id.slice(0, 8)}`,
    })),
    ...transferencias.map((t): Evt => ({
      key:      t.id,
      fecha:    t.fecha,
      badge:    "custodia",
      accion:   "Custodia →",
      qty:      Number(t.cantidad),
      moneda:   "USD",
      operador: t.User.name,
      ref:      t.CustodiaCliente?.Cliente.nombre ?? (t.notas ?? "—"),
    })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const BADGE_CLS: Record<Evt["badge"], string> = {
    compra:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    venta:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
    custodia:"bg-amber-500/10 text-amber-500 border-amber-500/20",
    anulada: "bg-slate-100 text-slate-400 border-slate-200 line-through",
  };

  return (
    <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-blue-400 overflow-hidden">
      <div className="px-5 py-3 border-b border-byg-border bg-byg-bg flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-byg-text">
            Historial — <span className="font-mono text-blue-400">{ticker}</span>
          </h3>
          <p className="text-[9px] font-bold text-byg-muted mt-0.5">Compras, ventas y transferencias a custodia</p>
        </div>
        <Link
          href={`/carteras/${slug}`}
          className="text-[9px] font-black uppercase tracking-widest text-byg-muted hover:text-rose-400 transition-colors px-2 py-1 rounded border border-byg-border hover:border-rose-400/30"
        >
          Cerrar ×
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="px-5 py-6 text-center text-[12px] text-byg-muted italic">Sin eventos registrados para {ticker}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-byg-border">
                {["Fecha", "Acción", "Cantidad", "Moneda", "Operador", "Referencia"].map((h, i) => (
                  <th key={h} className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted ${i > 1 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-byg-border/30">
              {events.map((e) => (
                <tr key={e.key} className="hover:bg-byg-surface-2 transition-colors">
                  <td className="px-5 py-2.5 text-[12px] text-byg-muted tabular-nums whitespace-nowrap font-mono">
                    {fmtDate(e.fecha)}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${BADGE_CLS[e.badge]}`}>
                      {e.accion}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-[12px] font-bold text-byg-text font-mono">
                    {fmtNum(e.qty)}
                  </td>
                  <td className="px-5 py-2.5 text-right text-[11px] text-byg-muted">{e.moneda}</td>
                  <td className="px-5 py-2.5 text-right text-[12px] text-byg-muted whitespace-nowrap">{e.operador}</td>
                  <td className="px-5 py-2.5 text-right text-[11px] text-byg-muted font-mono">{e.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Transferencias section ───────────────────────────────────────────────────

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" });
}

function TransferenciasSection({ transferencias }: { transferencias: TransferenciaRow[] }) {
  return (
    <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-amber-300 overflow-hidden">
      <div className="px-5 py-3 border-b border-byg-border bg-byg-bg flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-400">Historial de Transferencias</h3>
          <p className="text-[9px] font-bold text-amber-400/70 mt-0.5">Activos transferidos a custodia de clientes desde esta cartera</p>
        </div>
        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full">
          {transferencias.length} {transferencias.length === 1 ? "registro" : "registros"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[860px]">
          <thead>
            <tr className="border-b border-byg-border">
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Fecha</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted w-[90px]">Ticker</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Descripción</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Cantidad</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">Precio</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Cliente destino</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Operador</th>
              <th className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-byg-border/30">
            {transferencias.map((t) => {
              const moneda = "USD";
              return (
                <tr key={t.id} className="hover:bg-byg-surface-2 transition-colors">
                  <td className="px-5 py-2.5 text-[12px] text-byg-muted tabular-nums whitespace-nowrap">
                    {fmtDate(t.fecha)}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="text-[11px] font-black font-mono text-byg-text bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      {t.Activo.ticker}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-[12px] text-byg-muted max-w-[160px] truncate">
                    {t.Activo.descripcion || "—"}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-[12px] font-bold text-byg-text font-mono">
                    {fmtNum(t.cantidad)}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-[12px] text-byg-muted font-mono">
                    {fmtMoney(t.precioEnTransferencia, moneda)}
                  </td>
                  <td className="px-5 py-2.5 text-[12px] font-bold text-byg-text">
                    {t.CustodiaCliente?.Cliente.nombre ?? "—"}
                  </td>
                  <td className="px-5 py-2.5 text-[12px] text-byg-muted whitespace-nowrap">
                    {t.User.name}
                  </td>
                  <td className="px-5 py-2.5 text-[12px] text-byg-muted max-w-[160px] truncate italic">
                    {t.notas || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CarteraSlugPage({ params, searchParams }: PageProps) {
  const { slug }                          = await params;
  const { editSaldos, q, filtro, histTicker } = await searchParams;
  const editingSaldos = editSaldos === "1";
  const qUpper        = q?.trim().toUpperCase() || null;
  const histTickerUpper = histTicker?.trim().toUpperCase() || null;

  const cartera = await prisma.cartera.findUnique({ where: { slug } });
  if (!cartera) notFound();

  const isCripto = cartera.tipo === "CRIPTO";

  const [posicionesRaw, custodiasRaw, clientes, tcConfig, transferenciasRaw, custodiaGroupBy] = await Promise.all([
    prisma.posicionCartera.findMany({
      where: { carteraId: cartera.id },
      include: { Activo: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.custodiaCliente.findMany({
      where: { TransferenciaActivo: { some: { carteraOrigenId: cartera.id } } },
      include: { Activo: true, Cliente: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cliente.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.config.findUnique({ where: { clave: "tc_blue" } }),
    prisma.transferenciaActivo.findMany({
      where: { carteraOrigenId: cartera.id },
      include: {
        Activo: { select: { ticker: true, descripcion: true } },
        CustodiaCliente: { include: { Cliente: { select: { nombre: true } } } },
        User: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.transferenciaActivo.groupBy({
      by: ["activoId"],
      where: { carteraOrigenId: cartera.id },
      _sum: { cantidad: true },
    }),
  ]);

  // Historial condicional — solo cuando histTickerUpper está presente
  const [histOps, histTransf] = histTickerUpper
    ? await Promise.all([
        prisma.operacionBolsa.findMany({
          where: { carteraId: cartera.id, ticker: histTickerUpper },
          include: { OperadorCarga: { select: { name: true } } },
          orderBy: [{ fechaOperativa: "desc" }, { fechaCarga: "desc" }],
          take: 50,
        }),
        prisma.transferenciaActivo.findMany({
          where: { carteraOrigenId: cartera.id, Activo: { ticker: histTickerUpper } },
          include: {
            User: { select: { name: true } },
            CustodiaCliente: { include: { Cliente: { select: { nombre: true } } } },
          },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [null, null];

  const tcBlue = Number(tcConfig?.valor ?? "1000");

  // Custody amounts per activo for this cartera (sum of all transfers out)
  const custodiaByActivo: Record<string, number> = {};
  for (const r of custodiaGroupBy) {
    custodiaByActivo[r.activoId] = Number(r._sum.cantidad ?? 0);
  }

  // Total estimated value of assets in client custody from this cartera
  const totalCustodiaUSD = custodiasRaw.reduce((acc, c) => {
    const pa = c.Activo.precioActual;
    const precio = pa
      ? (c.Activo.monedaPrecio === "ARS" ? Number(pa) / tcBlue : Number(pa))
      : Number(c.precioPromedio);
    return acc + Number(c.cantidadTotal) * precio;
  }, 0);

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
      _asignado:    custodiaByActivo[p.activoId] ?? 0,
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

  // Apply filters
  const hasFilter = !!(qUpper || filtro);
  const filteredByCategoria = new Map<CategoriaActivo, PosicionRow[]>();
  byCategoria.forEach((rows, cat) => {
    let filtered = rows;
    if (qUpper) filtered = filtered.filter((r) => r.activo.ticker.includes(qUpper));
    if (filtro === "sin_precio") filtered = filtered.filter((r) => !r._hasPrecio);
    if (filtro === "con_custodia") filtered = filtered.filter((r) => r._asignado > 0);
    if (filtered.length > 0) filteredByCategoria.set(cat, filtered);
  });
  let totalFiltradas = 0;
  filteredByCategoria.forEach((rows) => { totalFiltradas += rows.length; });

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

        {/* Custodia asignada */}
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-amber-400 p-5 flex flex-col gap-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Custodia Asignada</p>
          <p className="text-xl font-black text-amber-400 tabular-nums tracking-tighter truncate font-mono">
            {fmtMoney(totalCustodiaUSD)}
          </p>
          <p className="text-[10px] font-bold text-amber-500/70">
            {custodiasRaw.length} pos. · no suma a propio
          </p>
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

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <form action={`/carteras/${slug}`} method="get" className="flex gap-1.5 items-center">
          {filtro && <input type="hidden" name="filtro" value={filtro} />}
          {histTickerUpper && <input type="hidden" name="histTicker" value={histTickerUpper} />}
          <input
            name="q"
            type="text"
            defaultValue={qUpper ?? ""}
            placeholder="Ticker…"
            className="w-28 px-2.5 py-1.5 text-[11px] bg-byg-surface border border-byg-border rounded-lg text-byg-text placeholder:text-byg-muted focus:outline-none focus:ring-1 focus:ring-blue-400/40 uppercase font-mono"
          />
          <button type="submit" className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg bg-byg-surface border border-byg-border text-byg-muted hover:text-byg-text hover:border-byg-text/30 transition-colors">
            Buscar
          </button>
        </form>

        <div className="flex rounded-lg overflow-hidden border border-byg-border text-[9px] font-black uppercase tracking-widest shrink-0">
          <Link
            href={`/carteras/${slug}${qUpper ? `?q=${qUpper}` : ""}`}
            className={`px-2.5 py-1.5 transition-colors ${!filtro ? "bg-slate-800 text-white" : "bg-byg-surface text-byg-muted hover:bg-byg-surface-2"}`}
          >Todas</Link>
          <Link
            href={`/carteras/${slug}?filtro=sin_precio${qUpper ? `&q=${qUpper}` : ""}`}
            className={`px-2.5 py-1.5 transition-colors ${filtro === "sin_precio" ? "bg-amber-600 text-white" : "bg-byg-surface text-byg-muted hover:bg-byg-surface-2"}`}
          >Sin precio</Link>
          <Link
            href={`/carteras/${slug}?filtro=con_custodia${qUpper ? `&q=${qUpper}` : ""}`}
            className={`px-2.5 py-1.5 transition-colors ${filtro === "con_custodia" ? "bg-amber-600 text-white" : "bg-byg-surface text-byg-muted hover:bg-byg-surface-2"}`}
          >Con custodia</Link>
        </div>

        {hasFilter && (
          <span className="text-[10px] text-byg-muted font-mono">
            {totalFiltradas} resultado{totalFiltradas !== 1 ? "s" : ""}
          </span>
        )}
        {hasFilter && (
          <Link href={`/carteras/${slug}`} className="text-[9px] font-black uppercase tracking-widest text-byg-muted hover:text-rose-400 transition-colors">
            Limpiar ×
          </Link>
        )}
      </div>

      {/* Historial de activo (visible cuando histTicker está activo) */}
      {histTickerUpper && histOps !== null && histTransf !== null && (
        <HistorialActivoSection
          ticker={histTickerUpper}
          ops={histOps as HistOp[]}
          transferencias={histTransf as HistTransf[]}
          slug={slug}
        />
      )}

      {/* Category sections */}
      {sectionOrder.map((cat) => {
        const config = CATEGORY_CONFIG[cat];
        const rows   = (hasFilter ? filteredByCategoria : byCategoria).get(cat) ?? [];
        if (hasFilter && rows.length === 0) return null;
        return (
          <PositionSection
            key={cat}
            label={config.label}
            accent={config.accent}
            rows={rows}
            carteraSlug={slug}
            clientes={clientes}
            histTicker={histTickerUpper}
            filtro={filtro}
            q={qUpper}
          />
        );
      })}

      {/* Opciones y Futuros — placeholder */}
      {!isCripto && !hasFilter && (
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
      {!hasFilter && custodiasRaw.length > 0 && <CustodiaSection custodias={custodiasRaw} />}

      {/* Transferencias historial */}
      {!hasFilter && transferenciasRaw.length > 0 && (
        <TransferenciasSection transferencias={transferenciasRaw as TransferenciaRow[]} />
      )}
    </div>
  );
}
