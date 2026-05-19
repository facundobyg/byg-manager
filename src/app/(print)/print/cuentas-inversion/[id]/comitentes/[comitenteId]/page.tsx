import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CategoriaHoldingInversion, ProductorInversion } from "@prisma/client";
import { PrintButton } from "@/components/PrintButton";

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

const CAT_LABEL: Record<CategoriaHoldingInversion, string> = {
  BONO: "Bono", ON: "ON", ACCION: "Acción", CEDEAR: "CEDEAR", FCI: "FCI", CAUCION: "Caución",
};
const CAT_ORDER: CategoriaHoldingInversion[] = ["BONO", "ON", "ACCION", "CEDEAR", "FCI", "CAUCION"];
const PROD_LABEL: Record<ProductorInversion, string> = { IPS: "IPS", BYG: "BYG", OTRO: "Otro" };

export default async function PrintComitentePositionPage({
  params,
}: {
  params: Promise<{ id: string; comitenteId: string }>;
}) {
  const { id, comitenteId } = await params;

  const comitente = await prisma.comitenteInversion.findUnique({
    where: { id: comitenteId },
    include: {
      CuentaInversion: { select: { id: true, nombre: true } },
      SaldoComitenteInversion: true,
      HoldingComitenteInversion: { orderBy: [{ categoria: "asc" }, { ticker: "asc" }] },
    },
  });

  if (!comitente || comitente.cuentaInversionId !== id) notFound();

  const saldoARS   = Number(comitente.SaldoComitenteInversion?.saldoARS      ?? 0);
  const saldoCable = Number(comitente.SaldoComitenteInversion?.saldoUSDCable  ?? 0);
  const saldoMep   = Number(comitente.SaldoComitenteInversion?.saldoUSDMep    ?? 0);
  const saldoUSD   = saldoCable + saldoMep;

  const catValor = new Map<CategoriaHoldingInversion, number>();
  for (const h of comitente.HoldingComitenteInversion) {
    const pa  = Number(h.precioActual ?? h.precioPromedio);
    const val = Number(h.cantidad) * pa;
    catValor.set(h.categoria, (catValor.get(h.categoria) ?? 0) + val);
  }
  const totalHoldingsUSD = Array.from(catValor.values()).reduce((s, v) => s + v, 0);
  const totalCarteraUSD  = totalHoldingsUSD + saldoUSD;

  type AllocRow = { label: string; valor: number; pct: number };
  const allocRows: AllocRow[] = [];
  for (const cat of CAT_ORDER) {
    const v = catValor.get(cat) ?? 0;
    if (v > 0) allocRows.push({ label: CAT_LABEL[cat], valor: v, pct: totalCarteraUSD > 0 ? (v / totalCarteraUSD) * 100 : 0 });
  }
  if (saldoUSD > 0) allocRows.push({ label: "Saldos USD", valor: saldoUSD, pct: totalCarteraUSD > 0 ? (saldoUSD / totalCarteraUSD) * 100 : 0 });

  const grouped = new Map<CategoriaHoldingInversion, typeof comitente.HoldingComitenteInversion>();
  for (const h of comitente.HoldingComitenteInversion) {
    if (!grouped.has(h.categoria)) grouped.set(h.categoria, []);
    grouped.get(h.categoria)!.push(h);
  }

  const now = new Date();
  const fechaStr = now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr  = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const backUrl  = `/cuentas-inversion/${id}/comitentes/${comitenteId}`;

  return (
    <div className="bg-white min-h-screen">
      {/* ── Toolbar (hidden when printing) ────────────────────────────────── */}
      <div className="print:hidden flex items-center justify-between gap-3 px-8 py-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        <p className="text-sm text-slate-500 font-medium">
          Vista previa · Use <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">Ctrl+P</kbd> o el botón para guardar como PDF
        </p>
        <div className="flex items-center gap-2">
          <Link href={backUrl} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            ← Volver
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* ── Document ──────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-8 py-10 print:p-0 print:max-w-none">

        {/* Letterhead */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-slate-900">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">BYG Manager</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Posición de Cartera</h1>
            <p className="text-sm text-slate-500 mt-1">{comitente.CuentaInversion.nombre}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</p>
            <p className="text-base font-black text-slate-900">{fechaStr}</p>
            <p className="text-xs text-slate-400">{horaStr}</p>
          </div>
        </div>

        {/* Comitente info */}
        <div className="grid grid-cols-3 gap-6 mb-8 p-5 bg-slate-50 rounded-xl border border-slate-200 print:border print:bg-white print:p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Comitente</p>
            <p className="text-lg font-black text-slate-900 leading-tight">{comitente.razonSocial ?? comitente.nombre}</p>
            {comitente.razonSocial && <p className="text-xs text-slate-500 mt-0.5">{comitente.nombre}</p>}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">N° Comitente</p>
            <p className="text-lg font-black font-mono text-slate-900">{comitente.nroComitente}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Productor</p>
            <p className="text-lg font-black text-slate-900">{PROD_LABEL[comitente.productor]}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">Resumen</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border-l-4 border-slate-900 bg-slate-50 print:bg-white print:border print:border-l-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cartera total estimada</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums mt-1">USD {fmt(totalCarteraUSD)}</p>
              {saldoARS > 0 && <p className="text-xs text-slate-500 tabular-nums mt-0.5">+ $ {fmt(saldoARS)} ARS</p>}
            </div>
            <div className="p-4 border border-slate-200 rounded-lg print:border">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Saldos disponibles</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase">ARS</span>
                  <span className="tabular-nums font-bold text-slate-800">$ {fmt(saldoARS)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase">USD Cable</span>
                  <span className="tabular-nums font-bold text-slate-800">USD {fmt(saldoCable)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase">USD MEP</span>
                  <span className="tabular-nums font-bold text-slate-800">USD {fmt(saldoMep)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Allocation */}
        {allocRows.length > 0 && (
          <div className="mb-8 break-inside-avoid">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">Asignación por categoría</p>
            <table className="w-full text-xs border border-slate-200">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-100">
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Categoría</th>
                  <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Valor USD</th>
                  <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 w-20">%</th>
                </tr>
              </thead>
              <tbody>
                {allocRows.map((row) => (
                  <tr key={row.label} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-bold text-slate-700">{row.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-800">{fmt(row.valor)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">{fmt(row.pct, 1)}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 print:bg-slate-100">
                  <td className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Total</td>
                  <td className="px-3 py-2 text-right tabular-nums font-black text-slate-900">{fmt(totalCarteraUSD)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-black text-slate-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Holdings by category */}
        {CAT_ORDER.filter((cat) => grouped.has(cat)).map((cat) => {
          const holdings  = grouped.get(cat)!;
          const catTotal  = catValor.get(cat) ?? 0;
          return (
            <div key={cat} className="mb-6 break-inside-avoid">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{CAT_LABEL[cat]}</p>
                <p className="text-xs font-bold text-slate-600 tabular-nums">
                  USD {fmt(catTotal)}
                  {totalCarteraUSD > 0 && (
                    <span className="text-slate-400 font-medium ml-1">({fmt((catTotal / totalCarteraUSD) * 100, 1)}%)</span>
                  )}
                </p>
              </div>
              <table className="w-full text-xs border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-100">
                    {["Ticker", "Descripción", "Cantidad", "P. Prom.", "P. Actual", "Valor", "G/P"].map((h, i) => (
                      <th
                        key={i}
                        className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 ${i < 2 ? "text-left" : "text-right"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const pa    = Number(h.precioActual ?? h.precioPromedio);
                    const pp    = Number(h.precioPromedio);
                    const qty   = Number(h.cantidad);
                    const valor = qty * pa;
                    const gp    = qty * (pa - pp);
                    const gpPct = pp > 0 ? ((pa - pp) / pp) * 100 : 0;
                    return (
                      <tr key={h.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 font-mono font-bold text-slate-800">{h.ticker}</td>
                        <td className="px-3 py-2 text-slate-500 max-w-40 truncate">{h.descripcion ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">{fmt(qty, 4)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">{fmt(pp, 4)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {h.precioActual ? fmt(pa, 4) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-800">{fmt(valor)}</td>
                        <td className={`px-3 py-2 text-right tabular-nums font-bold ${gp >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {h.precioActual
                            ? `${gp >= 0 ? "+" : ""}${fmt(gp)} (${gpPct >= 0 ? "+" : ""}${fmt(gpPct, 1)}%)`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span>Generado el {fechaStr} a las {horaStr}</span>
          <span>BYG Manager — Documento informativo, no vinculante</span>
        </div>
      </div>
    </div>
  );
}
