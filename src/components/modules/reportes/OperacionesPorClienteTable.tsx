import Link from "next/link";
import { ResumenOperacionesCliente } from "@/lib/data/movimiento-cc";

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const HEADERS = ["Cliente", "Ops", "Activas", "Revert.", "Rulo", "Divisa", "LP", "Interés", "Transf.", "Monto", "Acción"];

export function OperacionesPorClienteTable({ rows }: { rows: ResumenOperacionesCliente[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-xs text-slate-400 text-center py-8 border border-slate-100 rounded-xl bg-slate-50">
        Sin operaciones para reportar
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
                  i === 0 ? "text-left" : i === 10 ? "text-center" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.clienteId}
              className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
            >
              <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                <Link href={`/clientes/${row.clienteId}`} className="hover:text-blue-600 transition-colors">
                  {row.clienteNombre}
                </Link>
              </td>
              <td className="py-3 px-4 text-right tabular-nums font-black text-slate-900">
                {row.totalOperaciones}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-blue-600 font-semibold">
                {row.activas > 0 ? row.activas : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-red-500 font-semibold">
                {row.revertidas > 0 ? row.revertidas : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                {row.totalRulo > 0 ? row.totalRulo : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                {row.totalDivisa > 0 ? row.totalDivisa : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                {row.totalLP > 0 ? row.totalLP : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                {row.totalInteres > 0 ? row.totalInteres : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                {row.totalTransferencia > 0 ? row.totalTransferencia : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-800">
                {fmtNum(row.montoTotalMovido)}
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
