import Link from "next/link";

export interface RiesgoRow {
  clienteId: string;
  clienteNombre: string;
  ccNegativas: number;
  pfVencidos: number;
  pfProximos: number;
  expTotal: number;
}

type Prioridad = "ALTA" | "MEDIA" | "BAJA";

function getPrioridad(row: RiesgoRow): Prioridad {
  if (row.ccNegativas > 0 || row.pfVencidos > 0) return "ALTA";
  if (row.pfProximos > 0) return "MEDIA";
  return "BAJA";
}

const PRIORITY_BADGE: Record<Prioridad, string> = {
  ALTA: "bg-red-50 text-red-600",
  MEDIA: "bg-amber-50 text-amber-600",
  BAJA: "bg-green-50 text-green-700",
};

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const HEADERS = ["Cliente", "CC Neg.", "PF Venc.", "PF Próx.", "Exp. Total", "Prioridad", "Acción"];

export function RiesgoClientesTable({ rows }: { rows: RiesgoRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-xs text-slate-400 text-center py-8 border border-slate-100 rounded-xl bg-slate-50">
        Sin clientes para reportar
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => {
    const order: Record<Prioridad, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };
    return order[getPrioridad(a)] - order[getPrioridad(b)];
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {HEADERS.map((h, i) => (
              <th
                key={h}
                className={`py-3 px-4 font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${
                  i === 0 ? "text-left" : i === 6 ? "text-center" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const prioridad = getPrioridad(row);
            return (
              <tr
                key={row.clienteId}
                className={`border-b border-slate-50 last:border-0 transition-colors ${
                  prioridad === "ALTA" ? "bg-red-50/20 hover:bg-red-50/40" : "hover:bg-slate-50"
                }`}
              >
                <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                  <Link href={`/clientes/${row.clienteId}`} className="hover:text-blue-600 transition-colors">
                    {row.clienteNombre}
                  </Link>
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {row.ccNegativas > 0 ? (
                    <span className="font-black text-red-600">{row.ccNegativas}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {row.pfVencidos > 0 ? (
                    <span className="font-black text-red-600">{row.pfVencidos}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {row.pfProximos > 0 ? (
                    <span className="font-black text-amber-600">{row.pfProximos}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-800">
                  {fmtNum(row.expTotal)}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-[10px] ${PRIORITY_BADGE[prioridad]}`}>
                    {prioridad}
                  </span>
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
