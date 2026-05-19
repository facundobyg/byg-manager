import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductorInversion } from "@prisma/client";
import { MonthPicker } from "@/components/modules/cuentas-inversion/MonthPicker";
import { ConfigComisionesForm } from "@/components/modules/cuentas-inversion/ConfigComisionesForm";

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

const PROD_LABEL: Record<ProductorInversion, string> = { IPS: "IPS", BYG: "BYG", OTRO: "Otro" };
const PROD_CLS: Record<ProductorInversion, string> = {
  IPS:  "bg-violet-50 text-violet-700",
  BYG:  "bg-blue-50 text-blue-700",
  OTRO: "bg-slate-100 text-slate-600",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type OpRow = {
  id: string;
  fecha: Date;
  cuenta: string;
  comitente: string;
  ticker: string;
  cantidad: number;
  precioPromedio: number | null;
  precioVenta: number;
  ganancia: number | null;
  comision: number;
};

type ProducerGroup = {
  productor: ProductorInversion;
  ops: OpRow[];
  comitentes: Set<string>;
  totalGenerado: number;
  iibb: number;
  neto: number;
  aCobraProductor: number;
  aCobraBYG: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mesLabel(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function calcAmounts(neto: number, productor: ProductorInversion, ipsPct: number, otroPct: number) {
  if (productor === "IPS")  return { aCobraProductor: neto * ipsPct,  aCobraBYG: neto * (1 - ipsPct) };
  if (productor === "BYG")  return { aCobraProductor: neto,           aCobraBYG: neto };
  return                           { aCobraProductor: neto * otroPct, aCobraBYG: neto * (1 - otroPct) };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ComisionesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; expand?: string }>;
}) {
  const { mes: mesSP, expand } = await searchParams;
  const mes = mesSP ?? new Date().toISOString().slice(0, 7);

  const [y, m] = mes.split("-").map(Number);
  const startDate = new Date(y, m - 1, 1);
  const endDate   = new Date(y, m, 1);

  // ── Config ─────────────────────────────────────────────────────────────────
  const cfgRows = await prisma.config.findMany({
    where: { clave: { in: ["comisiones_iibb_pct", "comisiones_ips_pct", "comisiones_otro_pct"] } },
  });
  const cfgMap = new Map(cfgRows.map((r) => [r.clave, r.valor]));
  const iibbPct = parseFloat(cfgMap.get("comisiones_iibb_pct") ?? "0")   / 100;
  const ipsPct  = parseFloat(cfgMap.get("comisiones_ips_pct")  ?? "50")  / 100;
  const otroPct = parseFloat(cfgMap.get("comisiones_otro_pct") ?? "100") / 100;

  // ── Data ───────────────────────────────────────────────────────────────────
  const operaciones = await prisma.operacionHoldingInversion.findMany({
    where: { tipo: "VENTA", fecha: { gte: startDate, lt: endDate } },
    include: {
      ComitenteInversion: {
        select: {
          nombre: true,
          razonSocial: true,
          productor: true,
          CuentaInversion: { select: { nombre: true } },
        },
      },
    },
    orderBy: { fecha: "asc" },
  });

  // ── Calculation ────────────────────────────────────────────────────────────
  const groups = new Map<ProductorInversion, ProducerGroup>();

  for (const op of operaciones) {
    const productor = op.ComitenteInversion.productor;
    if (!groups.has(productor)) {
      groups.set(productor, {
        productor,
        ops: [],
        comitentes: new Set(),
        totalGenerado: 0,
        iibb: 0,
        neto: 0,
        aCobraProductor: 0,
        aCobraBYG: 0,
      });
    }
    const g = groups.get(productor)!;

    const pp    = op.precioPromedio ? Number(op.precioPromedio) : null;
    const pv    = Number(op.precio);
    const qty   = Number(op.cantidad);
    const gan   = pp !== null ? (pv - pp) * qty : null;
    const com   = gan !== null ? Math.max(0, gan) : 0;

    const comitenteName = op.ComitenteInversion.razonSocial ?? op.ComitenteInversion.nombre;
    g.ops.push({
      id:             op.id,
      fecha:          op.fecha,
      cuenta:         op.ComitenteInversion.CuentaInversion.nombre,
      comitente:      comitenteName,
      ticker:         op.ticker,
      cantidad:       qty,
      precioPromedio: pp,
      precioVenta:    pv,
      ganancia:       gan,
      comision:       com,
    });
    g.comitentes.add(comitenteName);
    g.totalGenerado += com;
  }

  // Finalize group totals
  for (const g of Array.from(groups.values())) {
    g.iibb = g.totalGenerado * iibbPct;
    g.neto = g.totalGenerado - g.iibb;
    const { aCobraProductor, aCobraBYG } = calcAmounts(g.neto, g.productor, ipsPct, otroPct);
    g.aCobraProductor = aCobraProductor;
    g.aCobraBYG       = aCobraBYG;
  }

  const allGroups   = Array.from(groups.values()).sort((a, b) => a.productor.localeCompare(b.productor));
  const grandTotal  = allGroups.reduce((s, g) => s + g.totalGenerado, 0);
  const grandIIBB   = allGroups.reduce((s, g) => s + g.iibb, 0);
  const grandNeto   = allGroups.reduce((s, g) => s + g.neto, 0);
  const grandBYG    = allGroups.reduce((s, g) => s + g.aCobraBYG, 0);

  const cfgIibb = parseFloat(cfgMap.get("comisiones_iibb_pct") ?? "0");
  const cfgIps  = parseFloat(cfgMap.get("comisiones_ips_pct")  ?? "50");
  const cfgOtro = parseFloat(cfgMap.get("comisiones_otro_pct") ?? "100");

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <header className="flex flex-col gap-3">
        <Link
          href="/cuentas-inversion"
          className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 hover:text-blue-700 transition-colors"
        >
          ← Cuentas de Inversión
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Comisiones</h1>
            <p className="text-slate-500 text-sm mt-1 capitalize">{mesLabel(mes)}</p>
          </div>
          <MonthPicker mes={mes} />
        </div>
      </header>

      {/* Grand summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total generado", value: `USD ${fmt(grandTotal)}` },
          { label: "IIBB",           value: `USD ${fmt(grandIIBB)}` },
          { label: "Neto",           value: `USD ${fmt(grandNeto)}` },
          { label: "A cobrar BYG",   value: `USD ${fmt(grandBYG)}` },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
            <p className="text-xl font-black text-slate-900 tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Per-producer groups */}
      {allGroups.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-400 italic">Sin operaciones de venta en {mesLabel(mes)}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {allGroups.map((g) => {
            const isExpanded = expand === g.productor;
            const toggleHref = isExpanded
              ? `?mes=${mes}`
              : `?mes=${mes}&expand=${g.productor}`;

            return (
              <section key={g.productor} className="flex flex-col gap-2">
                {/* Producer summary row */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${PROD_CLS[g.productor]}`}>
                        {PROD_LABEL[g.productor]}
                      </span>
                      <span className="text-xs text-slate-400">{g.ops.length} ops · {g.comitentes.size} comitentes</span>
                    </div>
                    <Link
                      href={toggleHref}
                      className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {isExpanded ? "▲ Ocultar" : "▼ Ver detalle"}
                    </Link>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Total generado", "SENEBI", "IIBB", "Neto", "A cobrar productor", "A cobrar BYG"].map((h, i) => (
                          <th key={i} className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">USD {fmt(g.totalGenerado)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-400">USD 0,00</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">USD {fmt(g.iibb)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">USD {fmt(g.neto)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">USD {fmt(g.aCobraProductor)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-blue-700">USD {fmt(g.aCobraBYG)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Expandable detail */}
                {isExpanded && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {["Fecha", "Cuenta", "Comitente", "Ticker", "Cantidad", "Compra prom.", "Venta", "Ganancia", "Comisión"].map((h, i) => (
                            <th
                              key={i}
                              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i < 4 ? "text-left" : "text-right"}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {g.ops.map((op) => (
                          <tr key={op.id} className="border-b border-slate-50 last:border-0 bg-white hover:bg-slate-50/60">
                            <td className="px-4 py-2.5 text-slate-500">
                              {op.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 max-w-24 truncate">{op.cuenta}</td>
                            <td className="px-4 py-2.5 text-slate-700 font-medium max-w-32 truncate">{op.comitente}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{op.ticker}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(op.cantidad, 4)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                              {op.precioPromedio !== null ? fmt(op.precioPromedio, 4) : <span className="text-slate-300">S/D</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(op.precioVenta, 4)}</td>
                            <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${
                              op.ganancia === null ? "text-slate-300" : op.ganancia >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}>
                              {op.ganancia === null
                                ? "S/D"
                                : `${op.ganancia >= 0 ? "+" : ""}${fmt(op.ganancia)}`}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-800">
                              {fmt(op.comision)}
                            </td>
                          </tr>
                        ))}

                        {/* Subtotal row */}
                        <tr className="border-t border-slate-200 bg-slate-50">
                          <td colSpan={4} className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Subtotal
                          </td>
                          <td colSpan={3} />
                          <td className="px-4 py-2.5 text-right tabular-nums font-black text-slate-900">
                            USD {fmt(g.ops.reduce((s, o) => s + (o.ganancia ?? 0), 0))}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-black text-slate-900">
                            USD {fmt(g.totalGenerado)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Config section */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Configuración</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <ConfigComisionesForm iibbPct={cfgIibb} ipsPct={cfgIps} otroPct={cfgOtro} />
          <p className="text-[10px] text-slate-400 mt-4">
            IIBB se aplica como deducción sobre el total generado antes de calcular la participación.
            BYG = 100% significa que BYG retiene el neto íntegro como productor propio.
          </p>
        </div>
      </section>
    </div>
  );
}
