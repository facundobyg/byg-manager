import Link from "next/link";

export interface RankingRow {
  clienteId: string;
  clienteNombre: string;
  totalPatr: number;
  pfTotal: number;
  carteraUsd: number;
  ccUsd: number;
  ccArs: number;
}

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numColor(n: number) {
  if (n < 0) return "text-red-600";
  if (n > 0) return "text-slate-800";
  return "text-slate-400";
}

const HEADERS = ["Rank", "Cliente", "Total Patr.", "PF", "Cartera", "CC USD", "CC ARS", "Acción"];

const TOP3_ROW = ["", "bg-amber-50/60", "bg-slate-50/80"];

export function RankingClientesTable({ rows }: { rows: RankingRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-xs text-slate-400 text-center py-8 border border-slate-100 rounded-xl bg-slate-50">
        Sin clientes para rankear
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {HEADERS.map((h, i) => (
              <th
                key={h}
                className={`py-3 px-4 font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${
                  i === 0 || i === 1 ? "text-left" : i === 7 ? "text-center" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.clienteId}
              className={`border-b border-slate-50 last:border-0 transition-colors ${
                i < 3 ? TOP3_ROW[i] + " hover:brightness-95" : "hover:bg-slate-50"
              }`}
            >
              <td className="py-3 px-4 text-left tabular-nums">
                {i === 0 ? (
                  <span className="font-black text-amber-500 text-sm">①</span>
                ) : i === 1 ? (
                  <span className="font-black text-slate-500 text-sm">②</span>
                ) : i === 2 ? (
                  <span className="font-black text-amber-700/70 text-sm">③</span>
                ) : (
                  <span className="text-slate-400 font-semibold">{i + 1}</span>
                )}
              </td>
              <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                <Link href={`/clientes/${row.clienteId}`} className="hover:text-blue-600 transition-colors">
                  {row.clienteNombre}
                </Link>
              </td>
              <td className="py-3 px-4 text-right tabular-nums font-black text-slate-900">
                {fmtNum(row.totalPatr)}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                {row.pfTotal > 0 ? fmtNum(row.pfTotal) : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                {row.carteraUsd > 0 ? fmtNum(row.carteraUsd) : <span className="text-slate-300">—</span>}
              </td>
              <td className={`py-3 px-4 text-right tabular-nums font-semibold ${numColor(row.ccUsd)}`}>
                {fmtNum(row.ccUsd)}
              </td>
              <td className={`py-3 px-4 text-right tabular-nums font-semibold ${numColor(row.ccArs)}`}>
                {row.ccArs !== 0 ? fmtNum(row.ccArs) : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3 px-4 text-center">
                <Link
                  href={`/clientes/${row.clienteId}`}
                  className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Ver →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
