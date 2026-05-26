import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CategoriaActivo, CategoriaHoldingInversion, ProductorInversion, TipoOperacionHolding } from "@prisma/client";
import { ComprarHoldingForm } from "@/components/modules/cuentas-inversion/ComprarHoldingForm";
import { EditHoldingForm } from "@/components/modules/cuentas-inversion/EditHoldingForm";
import { VenderHoldingForm } from "@/components/modules/cuentas-inversion/VenderHoldingForm";
import { DeleteHoldingButton } from "@/components/modules/cuentas-inversion/DeleteHoldingButton";
import { OpsBolsaTable } from "@/components/modules/cuentas-inversion/OpsBolsaTable";
import type { OpsBolsaRow } from "@/components/modules/cuentas-inversion/OpsBolsaTable";
import { setCarteraAction } from "./actions";
import { canDoAction } from "@/lib/auth/permissions";
import { getTCMep } from "@/lib/services/config.service";

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

const CAT_LABEL: Record<CategoriaHoldingInversion, string> = {
  BONO: "Bono", ON: "ON", ACCION: "Acción", CEDEAR: "CEDEAR", FCI: "FCI", CAUCION: "Caución",
};
const CAT_CLS: Record<CategoriaHoldingInversion, string> = {
  BONO:    "bg-blue-50 text-blue-700",
  ON:      "bg-indigo-50 text-indigo-700",
  ACCION:  "bg-emerald-50 text-emerald-700",
  CEDEAR:  "bg-teal-50 text-teal-700",
  FCI:     "bg-amber-50 text-amber-700",
  CAUCION: "bg-slate-100 text-slate-600",
};
const CAT_BAR: Record<CategoriaHoldingInversion, string> = {
  BONO:    "bg-blue-400",
  ON:      "bg-indigo-400",
  ACCION:  "bg-emerald-400",
  CEDEAR:  "bg-teal-400",
  FCI:     "bg-amber-400",
  CAUCION: "bg-slate-400",
};
const PROD_LABEL: Record<ProductorInversion, string> = { IPS: "IPS", BYG: "BYG", OTRO: "Otro" };
const PROD_CLS: Record<ProductorInversion, string> = {
  IPS:  "bg-violet-50 text-violet-700",
  BYG:  "bg-blue-50 text-blue-700",
  OTRO: "bg-slate-100 text-slate-600",
};
const TIPO_LABEL: Record<TipoOperacionHolding, string> = { COMPRA: "Compra", VENTA: "Venta", AJUSTE: "Ajuste" };
const TIPO_CLS: Record<TipoOperacionHolding, string> = {
  COMPRA: "bg-emerald-50 text-emerald-700",
  VENTA:  "bg-red-50 text-red-700",
  AJUSTE: "bg-slate-100 text-slate-600",
};

const CAT_ORDER: CategoriaHoldingInversion[] = ["BONO", "ON", "ACCION", "CEDEAR", "FCI", "CAUCION"];

// Map CategoriaActivo → CategoriaHoldingInversion for display in mirror mode
const ACTIVO_TO_HOLDING: Record<CategoriaActivo, CategoriaHoldingInversion> = {
  BONO_ARS:      "BONO",
  BONO_USD:      "BONO",
  ON_USD:        "ON",
  ACCION_USD:    "ACCION",
  ACCION_USD_EXT:"ACCION",
  CEDEAR:        "CEDEAR",
  CRIPTO:        "ACCION",
  FCI:           "FCI",
};

export default async function ComitenteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; comitenteId: string }>;
  searchParams: Promise<{ editId?: string; venderId?: string; comprar?: string }>;
}) {
  const { id, comitenteId }           = await params;
  const { editId, venderId, comprar } = await searchParams;

  const [comitente, auditLogs, canDeleteHolding, tcMepRow, opsBolsaRaw, canWriteBolsa] = await Promise.all([
  prisma.comitenteInversion.findUnique({
    where: { id: comitenteId },
    include: {
      CuentaInversion: { select: { id: true, nombre: true } },
      SaldoComitenteInversion: true,
      HoldingComitenteInversion: { orderBy: [{ categoria: "asc" }, { ticker: "asc" }] },
      OperacionHoldingInversion: { orderBy: { fecha: "desc" }, take: 50 },
      Cartera: {
        include: {
          PosicionCartera: {
            include: { Activo: true },
            orderBy: [{ Activo: { categoria: "asc" } }, { Activo: { ticker: "asc" } }],
          },
        },
      },
    },
  }),
  prisma.auditLog.findMany({
    where:   { entidad: "ComitenteInversion", entidadId: comitenteId },
    orderBy: { createdAt: "desc" },
    take:    10,
    include: { User: { select: { name: true } } },
  }),
  canDoAction("holdings:eliminar"),
  getTCMep(),
  prisma.operacionBolsa.findMany({
    where:   { comitenteId },
    orderBy: { fechaCarga: "desc" },
    take:    100,
    include: { OperadorCarga: { select: { name: true } } },
  }),
  canDoAction("bolsa:concertar"),
  ]);

  if (!comitente || comitente.cuentaInversionId !== id) notFound();

  // Serialize ops for client component (dates → strings)
  const opsBolsa: OpsBolsaRow[] = opsBolsaRaw.map((o) => ({
    id:             o.id,
    fechaOperativa: o.fechaOperativa ? o.fechaOperativa.toISOString() : null,
    fechaCarga:     o.fechaCarga.toISOString(),
    tipoOperacion:  o.tipoOperacion as string,
    ticker:         o.ticker,
    cantidad:       Number(o.cantidad),
    precio:         Number(o.precio),
    moneda:         o.moneda as string,
    estado:         o.estado as string,
    anulada:        o.anulada,
    resultadoNeto:  o.resultadoNeto !== null ? Number(o.resultadoNeto) : null,
    operadorNombre: o.OperadorCarga?.name ?? "—",
  }));

  const opsPendientes = opsBolsa.filter((o) => o.estado === "PENDIENTE_CONCERTACION").length;

  const isMirror = comitente.esPropioBYG && !!comitente.Cartera;
  // Ocultar "+ Comprar" en la cuenta Banco Industrial (operaciones propias de la firma)
  const hideComprar = comitente.CuentaInversion.nombre === "Banco Industrial" || comitente.esPropioBYG;

  // Load carteras for selector when esPropioBYG but not yet linked
  const carteras = comitente.esPropioBYG
    ? await prisma.cartera.findMany({
        where: { tipo: "COMPLETA", activa: true },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, slug: true },
      })
    : [];

  const baseUrl = `/cuentas-inversion/${id}/comitentes/${comitenteId}`;

  // ── Mirror calculations ───────────────────────────────────────────────────────
  let mirrorRows: { ticker: string; descripcion: string | null; catHolding: CategoriaHoldingInversion; cantidad: number; precioCompra: number; precioActual: number | null; valor: number }[] = [];
  let mirrorCatValor = new Map<CategoriaHoldingInversion, number>();
  let mirrorTotalUSD = 0;

  if (isMirror && comitente.Cartera) {
    mirrorRows = comitente.Cartera.PosicionCartera.map((p) => {
      const catHolding = ACTIVO_TO_HOLDING[p.Activo.categoria] ?? "ACCION";
      const pa = p.Activo.precioActual !== null ? Number(p.Activo.precioActual) : null;
      const pp = Number(p.precioCompra);
      const qty = Number(p.cantidad);
      const valor = qty * (pa ?? pp);
      return {
        ticker:       p.Activo.ticker,
        descripcion:  p.Activo.descripcion,
        catHolding,
        cantidad:     qty,
        precioCompra: pp,
        precioActual: pa,
        valor,
      };
    });
    for (const r of mirrorRows) {
      mirrorCatValor.set(r.catHolding, (mirrorCatValor.get(r.catHolding) ?? 0) + r.valor);
    }
    mirrorTotalUSD = mirrorRows.reduce((s, r) => s + r.valor, 0);
  }

  // ── Standard calculations ─────────────────────────────────────────────────────
  const saldoARS   = Number(comitente.SaldoComitenteInversion?.saldoARS      ?? 0);
  const saldoCable = Number(comitente.SaldoComitenteInversion?.saldoUSDCable  ?? 0);
  const saldoMep   = Number(comitente.SaldoComitenteInversion?.saldoUSDMep    ?? 0);
  const saldoUSD   = saldoCable + saldoMep;

  const catValor = isMirror ? mirrorCatValor : (() => {
    const m = new Map<CategoriaHoldingInversion, number>();
    for (const h of comitente.HoldingComitenteInversion) {
      const pa  = Number(h.precioActual ?? h.precioPromedio);
      const val = Number(h.cantidad) * pa;
      m.set(h.categoria, (m.get(h.categoria) ?? 0) + val);
    }
    return m;
  })();

  const totalHoldingsUSD = isMirror ? mirrorTotalUSD : Array.from(catValor.values()).reduce((s, v) => s + v, 0);
  const tcMep = tcMepRow ? Number(tcMepRow.valor) : null;
  const saldoARSenUSD = tcMep && tcMep > 0 ? saldoARS / tcMep : 0;
  const totalCarteraUSD  = totalHoldingsUSD + saldoUSD + saldoARSenUSD;

  type AllocRow = { label: string; badgeCls: string; barCls: string; valor: number; pct: number };
  const allocRows: AllocRow[] = [];
  for (const cat of CAT_ORDER) {
    const v = catValor.get(cat) ?? 0;
    if (v > 0) {
      allocRows.push({
        label:    CAT_LABEL[cat],
        badgeCls: CAT_CLS[cat],
        barCls:   CAT_BAR[cat],
        valor:    v,
        pct:      totalCarteraUSD > 0 ? (v / totalCarteraUSD) * 100 : 0,
      });
    }
  }
  if (saldoUSD > 0) {
    allocRows.push({
      label:    "Saldos USD",
      badgeCls: "bg-slate-100 text-slate-600",
      barCls:   "bg-slate-300",
      valor:    saldoUSD,
      pct:      totalCarteraUSD > 0 ? (saldoUSD / totalCarteraUSD) * 100 : 0,
    });
  }

  const grouped = new Map<CategoriaHoldingInversion, typeof comitente.HoldingComitenteInversion>();
  for (const h of comitente.HoldingComitenteInversion) {
    if (!grouped.has(h.categoria)) grouped.set(h.categoria, []);
    grouped.get(h.categoria)!.push(h);
  }

  const mirrorGrouped = new Map<CategoriaHoldingInversion, typeof mirrorRows>();
  for (const r of mirrorRows) {
    if (!mirrorGrouped.has(r.catHolding)) mirrorGrouped.set(r.catHolding, []);
    mirrorGrouped.get(r.catHolding)!.push(r);
  }

  const lastUpdated = comitente.HoldingComitenteInversion.reduce(
    (max, h) => (h.updatedAt > max ? h.updatedAt : max),
    comitente.updatedAt,
  );

  return (
    <div className="flex flex-col gap-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
          <Link href="/cuentas-inversion" className="hover:text-blue-700 transition-colors">
            Cuentas de Inversión
          </Link>
          <span className="text-slate-300">/</span>
          <Link href={`/cuentas-inversion/${id}`} className="hover:text-blue-700 transition-colors">
            {comitente.CuentaInversion.nombre}
          </Link>
        </div>

        <div className="flex flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
              {comitente.razonSocial ?? comitente.nombre}
            </h1>
            {comitente.razonSocial && (
              <p className="text-slate-500 text-sm">{comitente.nombre}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                N° {comitente.nroComitente}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${PROD_CLS[comitente.productor]}`}>
                {PROD_LABEL[comitente.productor]}
              </span>
              {comitente.esPropioBYG && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  Propio BYG
                </span>
              )}
              {isMirror && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                  Espejo Cartera
                </span>
              )}
              {!comitente.activo && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                  Inactivo
                </span>
              )}
            </div>
            {isMirror && comitente.Cartera && (
              <Link
                href={`/carteras/${comitente.Cartera.slug}`}
                className="mt-1 text-[10px] font-bold text-violet-600 hover:text-violet-800 transition-colors underline underline-offset-2"
              >
                → Ver cartera: {comitente.Cartera.nombre}
              </Link>
            )}
          </div>
          <Link
            href={`/print/cuentas-inversion/${id}/comitentes/${comitenteId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
          >
            PDF posición
          </Link>
        </div>
      </header>

      {/* ── esPropioBYG without cartera: selector ──────────────────────────── */}
      {comitente.esPropioBYG && !isMirror && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex flex-col gap-3">
          <p className="text-sm font-bold text-amber-800">
            Este comitente es propio BYG pero no está vinculado a ninguna cartera espejo.
          </p>
          <form
            action={async (fd: FormData) => {
              "use server";
              const selected = fd.get("carteraId")?.toString().trim() ?? "";
              await setCarteraAction(comitenteId, id, selected || null);
            }}
            className="flex items-center gap-3"
          >
            <select
              name="carteraId"
              defaultValue=""
              className="border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">— Sin vincular —</option>
              {carteras.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-widest transition-colors"
            >
              Vincular cartera
            </button>
          </form>
        </div>
      )}

      {/* ── Cartera re-link (when already mirrored) ────────────────────────── */}
      {isMirror && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 flex items-center gap-4">
          <p className="text-xs font-bold text-violet-700 flex-1">
            Posición espejo de <span className="font-black">{comitente.Cartera!.nombre}</span>. Lectura de <code className="font-mono bg-violet-100 px-1 rounded">PosicionCartera</code>.
          </p>
          <form
            action={async () => {
              "use server";
              await setCarteraAction(comitenteId, id, null);
            }}
          >
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-white border border-violet-300 text-violet-700 text-[10px] font-black uppercase tracking-widest hover:bg-violet-100 transition-colors"
            >
              Desvincular
            </button>
          </form>
        </div>
      )}

      {/* ── Top cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2 col-span-2 lg:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cartera total estimada</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">
            USD {fmt(totalCarteraUSD)}
          </p>
          {saldoARS > 0 && (
            <p className="text-xs font-bold text-slate-400 tabular-nums">
              {tcMep
                ? `$ ${fmt(saldoARS)} ARS (TC MEP ${fmt(tcMep, 0)})`
                : `+ $ ${fmt(saldoARS)} ARS`}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saldos disponibles</p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-slate-400 font-bold uppercase">ARS</span>
              <span className="text-sm font-black text-slate-700 tabular-nums">$ {fmt(saldoARS)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Cable</span>
              <span className="text-sm font-black text-slate-700 tabular-nums">USD {fmt(saldoCable)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-slate-400 font-bold uppercase">MEP</span>
              <span className="text-sm font-black text-slate-700 tabular-nums">USD {fmt(saldoMep)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isMirror ? "Posiciones" : "Holdings activos"}
          </p>
          <p className="text-3xl font-black text-slate-900 tabular-nums leading-none">
            {isMirror ? mirrorRows.length : comitente.HoldingComitenteInversion.length}
          </p>
          <p className="text-xs text-slate-400">
            {isMirror ? mirrorGrouped.size : grouped.size}{" "}
            {(isMirror ? mirrorGrouped.size : grouped.size) === 1 ? "categoría" : "categorías"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Última actualización</p>
          <p className="text-sm font-black text-slate-800">
            {lastUpdated.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
          <p className="text-xs text-slate-400">
            {lastUpdated.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* ── Allocation by category ─────────────────────────────────────────── */}
      {allocRows.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Asignación por categoría</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Valor USD</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 w-16">%</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-40">Participación</th>
                </tr>
              </thead>
              <tbody>
                {allocRows.map((row) => (
                  <tr key={row.label} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${row.badgeCls}`}>
                        {row.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">{fmt(row.valor)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-600">{fmt(row.pct, 1)}%</td>
                    <td className="px-4 py-3">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.barCls}`}
                          style={{ width: `${Math.min(row.pct, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900">{fmt(totalCarteraUSD)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900">100%</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Mirror holdings table ──────────────────────────────────────────── */}
      {isMirror && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Posiciones espejo
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              Solo lectura
            </span>
          </div>

          {mirrorRows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-400 italic">
                La cartera <span className="font-bold">{comitente.Cartera!.nombre}</span> no tiene posiciones cargadas.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {CAT_ORDER.filter((cat) => mirrorGrouped.has(cat)).map((cat) => {
                const rows = mirrorGrouped.get(cat)!;
                const catTotal = mirrorCatValor.get(cat) ?? 0;
                return (
                  <div key={cat} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${CAT_CLS[cat]}`}>
                          {CAT_LABEL[cat]}
                        </span>
                        <span className="text-xs text-slate-400">{rows.length} posiciones</span>
                      </div>
                      <span className="text-xs font-bold text-slate-600 tabular-nums">
                        USD {fmt(catTotal)}
                        {mirrorTotalUSD > 0 && (
                          <span className="text-slate-400 font-medium ml-1">
                            ({fmt((catTotal / mirrorTotalUSD) * 100, 1)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {["Ticker", "Descripción", "Cantidad", "P. Compra", "P. Actual", "Valor"].map((h, i) => (
                            <th
                              key={i}
                              className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i < 2 ? "text-left" : "text-right"}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.ticker} className="border-b border-slate-50 last:border-0 bg-white hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{r.ticker}</td>
                            <td className="px-4 py-3 text-slate-500 max-w-40 truncate">
                              {r.descripcion ?? <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-700 font-medium">{fmt(r.cantidad, 4)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmt(r.precioCompra, 4)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                              {r.precioActual !== null ? fmt(r.precioActual, 4) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">{fmt(r.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Standard holdings table (non-mirror) ──────────────────────────── */}
      {!isMirror && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Posiciones actuales</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Tenencia actual del comitente.</p>
            </div>
            {!hideComprar && (
              <Link
                href={comprar ? baseUrl : `${baseUrl}?comprar=1`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  comprar ? "bg-blue-100 text-blue-700" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {comprar ? "Cerrar" : "+ Comprar"}
              </Link>
            )}
          </div>

          {comprar && (
            <ComprarHoldingForm comitenteId={comitenteId} cuentaInversionId={id} cancelHref={baseUrl} />
          )}

          {comitente.HoldingComitenteInversion.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-400 italic">Sin activos.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {CAT_ORDER.filter((cat) => grouped.has(cat)).map((cat) => {
                const holdings = grouped.get(cat)!;
                const catTotal = catValor.get(cat) ?? 0;
                return (
                  <div key={cat} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${CAT_CLS[cat]}`}>
                          {CAT_LABEL[cat]}
                        </span>
                        <span className="text-xs text-slate-400">{holdings.length} activos</span>
                      </div>
                      <span className="text-xs font-bold text-slate-600 tabular-nums">
                        USD {fmt(catTotal)}
                        {totalCarteraUSD > 0 && (
                          <span className="text-slate-400 font-medium ml-1">
                            ({fmt((catTotal / totalCarteraUSD) * 100, 1)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {["Ticker", "Descripción", "Cantidad", "P. Prom.", "P. Actual", "Valor", "G/P", "Fecha", ""].map((h, i) => (
                            <th
                              key={i}
                              className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 ${
                                i === 0 || i === 1 || i === 8 ? "text-left" : "text-right"
                              }`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((h) => {
                          const pa     = Number(h.precioActual ?? h.precioPromedio);
                          const pp     = Number(h.precioPromedio);
                          const qty    = Number(h.cantidad);
                          const valor  = qty * pa;
                          const gp     = qty * (pa - pp);
                          const gpPct  = pp > 0 ? ((pa - pp) / pp) * 100 : 0;
                          const isEdit = editId === h.id;
                          const isVend = venderId === h.id;

                          return (
                            <Fragment key={h.id}>
                              <tr
                                className={`border-b border-slate-50 last:border-0 transition-colors ${
                                  isEdit || isVend ? "bg-slate-50" : "bg-white hover:bg-slate-50/60"
                                }`}
                              >
                                <td className="px-4 py-3 font-mono font-bold text-slate-800">{h.ticker}</td>
                                <td className="px-4 py-3 text-slate-500 max-w-32 truncate">
                                  {h.descripcion ?? <span className="text-slate-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-slate-700 font-medium">{fmt(qty, 4)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmt(pp, 4)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                                  {h.precioActual ? fmt(pa, 4) : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">{fmt(valor)}</td>
                                <td className={`px-4 py-3 text-right tabular-nums font-bold ${gp >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                  {h.precioActual
                                    ? `${gp >= 0 ? "+" : ""}${fmt(gp)} (${gpPct >= 0 ? "+" : ""}${fmt(gpPct, 1)}%)`
                                    : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-400">
                                  {h.fechaCompra
                                    ? h.fechaCompra.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
                                    : <span className="text-slate-200">—</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <Link
                                      href={isVend ? baseUrl : `${baseUrl}?venderId=${h.id}`}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                        isVend ? "bg-red-100 text-red-700" : "text-slate-500 hover:bg-red-50 hover:text-red-600"
                                      }`}
                                    >
                                      Vender
                                    </Link>
                                    <Link
                                      href={isEdit ? baseUrl : `${baseUrl}?editId=${h.id}`}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                        isEdit ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                                      }`}
                                    >
                                      Editar
                                    </Link>
                                    {canDeleteHolding && (
                                      <DeleteHoldingButton
                                        holdingId={h.id}
                                        comitenteId={comitenteId}
                                        cuentaInversionId={id}
                                      />
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {isVend && (
                                <tr key={`vend-${h.id}`} className="bg-red-50/30">
                                  <td colSpan={9} className="px-4 py-4">
                                    <VenderHoldingForm
                                      holdingId={h.id}
                                      comitenteId={comitenteId}
                                      cuentaInversionId={id}
                                      ticker={h.ticker}
                                      cantidadDisponible={Number(h.cantidad)}
                                      cancelHref={baseUrl}
                                    />
                                  </td>
                                </tr>
                              )}

                              {isEdit && (
                                <tr key={`edit-${h.id}`} className="bg-amber-50/30">
                                  <td colSpan={9} className="px-4 py-4">
                                    <EditHoldingForm
                                      holdingId={h.id}
                                      comitenteId={comitenteId}
                                      cuentaInversionId={id}
                                      ticker={h.ticker}
                                      descripcion={h.descripcion}
                                      categoria={h.categoria}
                                      cantidad={Number(h.cantidad)}
                                      precioPromedio={Number(h.precioPromedio)}
                                      precioActual={h.precioActual ? Number(h.precioActual) : null}
                                      fechaCompra={h.fechaCompra}
                                      cancelHref={baseUrl}
                                    />
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── History (non-mirror only) ───────────────────────────────────────── */}
      {!isMirror && comitente.OperacionHoldingInversion.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Historial de movimientos en cartera
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Compras y ventas que impactaron posiciones.</p>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Fecha", "Tipo", "Ticker", "Categoría", "Cantidad", "Precio", "Total", "Notas"].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${
                        i < 4 || i === 7 ? "text-left" : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comitente.OperacionHoldingInversion.map((op) => (
                  <tr key={op.id} className="border-b border-slate-50 last:border-0 bg-white hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-500">
                      {op.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${TIPO_CLS[op.tipo]}`}>
                        {TIPO_LABEL[op.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{op.ticker}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${CAT_CLS[op.categoria]}`}>
                        {CAT_LABEL[op.categoria]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmt(Number(op.cantidad), 4)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmt(Number(op.precio), 4)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-800">
                      {fmt(Number(op.cantidad) * Number(op.precio))}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{op.notas ?? <span className="text-slate-200">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Operaciones Bolsa ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Operaciones Bolsa
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Historial y pendientes de concertación. Las posiciones arriba reflejan tenencia actual.
            </p>
          </div>
          <Link
            href={`/bolsa`}
            className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors uppercase tracking-widest whitespace-nowrap shrink-0"
          >
            Mesa diaria →
          </Link>
        </div>

        {/* Pending warning */}
        {opsPendientes > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
            <span className="text-amber-500 text-base">⚠</span>
            <p className="text-[11px] font-bold text-amber-800">
              {opsPendientes} operación{opsPendientes !== 1 ? "es" : ""} pendiente{opsPendientes !== 1 ? "s" : ""} de concertación en este comitente.
            </p>
          </div>
        )}

        <OpsBolsaTable ops={opsBolsa} canWrite={canWriteBolsa ?? false} />
      </section>

      {/* ── Audit — últimos movimientos ───────────────────────────────────── */}
      {auditLogs.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Últimos movimientos</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
              {auditLogs.map((log) => {
                const desc = (log.datosNuevos as { description?: string } | null)?.description;
                return (
                  <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                    <span className="text-slate-400 tabular-nums whitespace-nowrap font-mono text-[10px]">
                      {new Date(log.createdAt).toLocaleString("es-AR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-widest shrink-0">
                      {log.accion.replace(/_/g, " ")}
                    </span>
                    <span className="text-slate-600 truncate">{desc ?? "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
