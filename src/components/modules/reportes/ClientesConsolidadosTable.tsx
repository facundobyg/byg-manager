import Link from "next/link";

export interface ConsolidadoRow {
  clienteId: string;
  clienteNombre: string;
  ccUsd: number;
  ccArs: number;
  pfTotal: number;
  totalUsd: number;
  tasaPonderada: number | null;
  cantidadPF: number;
  carteraUsd: number;
  totalPatr: number;
}

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number) {
  return (n * 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

function fmtPctDirect(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
}

function numColor(n: number) {
  if (n < 0) return "text-red-600";
  if (n > 0) return "text-slate-800";
  return "text-slate-400";
}

const HEADERS = [
  "#", "Cliente",
  "CC USD", "CC ARS", "PF Total", "Total USD*", "Cartera USD", "Total Patr.",
  "Exp. USD", "Exp. ARS", "% USD",
  "T.Pond.", "PFs", "Acción",
];

export function ClientesConsolidadosTable({ rows }: { rows: ConsolidadoRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-xs text-slate-400 text-center py-8 border border-slate-100 rounded-xl bg-slate-50">
        Sin clientes para reportar
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
                  i === 0 || i === 1 ? "text-left" : i === 13 ? "text-center" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const expUsd = row.ccUsd + row.pfTotal + row.carteraUsd;
            const expArs = row.ccArs;
            const denom = expUsd + (expArs > 0 ? expArs : 0);
            const pctUsd = denom > 0 ? (expUsd / denom) * 100 : null;

            return (
              <tr
                key={row.clienteId}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 px-4 text-slate-400 tabular-nums">{i + 1}</td>
                <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                  <Link href={`/clientes/${row.clienteId}`} className="hover:text-blue-600 transition-colors">
                    {row.clienteNombre}
                  </Link>
                </td>
                <td className={`py-3 px-4 text-right tabular-nums font-semibold ${numColor(row.ccUsd)}`}>
                  {fmtNum(row.ccUsd)}
                </td>
                <td className={`py-3 px-4 text-right tabular-nums font-semibold ${numColor(row.ccArs)}`}>
                  {fmtNum(row.ccArs)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                  {row.pfTotal > 0 ? fmtNum(row.pfTotal) : <span className="text-slate-300">—</span>}
                </td>
                <td className="py-3 px-4 text-right tabular-nums font-black text-slate-900">
                  {fmtNum(row.totalUsd)}
                </td>
                <td className={`py-3 px-4 text-right tabular-nums font-semibold ${numColor(row.carteraUsd)}`}>
                  {row.carteraUsd > 0 ? fmtNum(row.carteraUsd) : <span className="text-slate-300">—</span>}
                </td>
                <td className="py-3 px-4 text-right tabular-nums font-black text-slate-900">
                  {fmtNum(row.totalPatr)}
                </td>
                <td className={`py-3 px-4 text-right tabular-nums font-semibold ${numColor(expUsd)}`}>
                  {fmtNum(expUsd)}
                </td>
                <td className={`py-3 px-4 text-right tabular-nums font-semibold ${numColor(expArs)}`}>
                  {expArs !== 0 ? fmtNum(expArs) : <span className="text-slate-300">—</span>}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                  {pctUsd !== null ? (
                    <span className={pctUsd >= 50 ? "text-blue-600 font-semibold" : "text-amber-600 font-semibold"}>
                      {fmtPctDirect(pctUsd)}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                  {row.tasaPonderada !== null ? (
                    fmtPct(row.tasaPonderada)
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {row.cantidadPF > 0 ? (
                    <span className="px-2 py-0.5 rounded-full font-black bg-purple-50 text-purple-600">
                      {row.cantidadPF}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
