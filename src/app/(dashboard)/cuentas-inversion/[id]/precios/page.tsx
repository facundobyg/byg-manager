import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CategoriaHoldingInversion } from "@prisma/client";
import { UpdatePrecioForm } from "@/components/modules/cuentas-inversion/UpdatePrecioForm";

function fmt(n: number, dec = 4) {
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

const CAT_ORDER: CategoriaHoldingInversion[] = ["BONO", "ON", "ACCION", "CEDEAR", "FCI", "CAUCION"];

type TickerRow = {
  ticker: string;
  descripcion: string | null;
  categoria: CategoriaHoldingInversion;
  precioActual: number | null;
  comitentesCount: number;
};

export default async function PreciosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cuenta = await prisma.cuentaInversion.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      ComitenteInversion: {
        select: {
          id: true,
          HoldingComitenteInversion: {
            select: {
              ticker: true,
              descripcion: true,
              categoria: true,
              precioActual: true,
            },
          },
        },
      },
    },
  });

  if (!cuenta) notFound();

  // Group by ticker across all comitentes
  const tickerMap = new Map<string, TickerRow>();
  for (const comitente of cuenta.ComitenteInversion) {
    for (const h of comitente.HoldingComitenteInversion) {
      if (!tickerMap.has(h.ticker)) {
        tickerMap.set(h.ticker, {
          ticker:          h.ticker,
          descripcion:     h.descripcion,
          categoria:       h.categoria,
          precioActual:    h.precioActual ? Number(h.precioActual) : null,
          comitentesCount: 0,
        });
      }
      const row = tickerMap.get(h.ticker)!;
      row.comitentesCount++;
      // prefer a non-null price if the current stored one is null
      if (row.precioActual === null && h.precioActual !== null) {
        row.precioActual = Number(h.precioActual);
      }
    }
  }

  // Sort by category order then ticker
  const rows: TickerRow[] = Array.from(tickerMap.values()).sort((a, b) => {
    const ci = CAT_ORDER.indexOf(a.categoria) - CAT_ORDER.indexOf(b.categoria);
    return ci !== 0 ? ci : a.ticker.localeCompare(b.ticker);
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
          <Link href="/cuentas-inversion" className="hover:text-blue-700 transition-colors">
            Cuentas de Inversión
          </Link>
          <span className="text-slate-300">/</span>
          <Link href={`/cuentas-inversion/${id}`} className="hover:text-blue-700 transition-colors">
            {cuenta.nombre}
          </Link>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Actualizar precios</h1>
            <p className="text-slate-500 text-sm mt-1">
              Actualiza el precio actual de un ticker en todos los comitentes de esta cuenta simultáneamente.
            </p>
          </div>
          <Link
            href={`/cuentas-inversion/${id}`}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </header>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-400 italic">Sin holdings registrados en esta cuenta.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Ticker", "Descripción", "Categoría", "Precio actual", "Comitentes", "Nuevo precio"].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${
                      i < 3 || i === 5 ? "text-left" : "text-right"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.ticker} className="border-b border-slate-50 last:border-0 bg-white hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{row.ticker}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-48 truncate">
                    {row.descripcion ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${CAT_CLS[row.categoria]}`}>
                      {CAT_LABEL[row.categoria]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-700">
                    {row.precioActual !== null
                      ? fmt(row.precioActual)
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                    {row.comitentesCount}
                  </td>
                  <td className="px-4 py-3">
                    <UpdatePrecioForm
                      cuentaId={id}
                      ticker={row.ticker}
                      precioActual={row.precioActual}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
