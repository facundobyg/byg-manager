import Link from "next/link";
import { getClientes } from "@/lib/data/cliente";

function diasEntre(desde: Date, hasta: Date): number {
  const a = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function fmtFecha(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const estadoStyle: Record<string, string> = {
  VENCIDO: "bg-red-50 text-red-600",
  PRÓXIMO: "bg-amber-50 text-amber-600",
  VIGENTE: "bg-green-50 text-green-600",
};

export default async function PlazosFijosPage() {
  const clientes = await getClientes();
  const hoy = new Date();

  const rows = clientes
    .flatMap((cliente) =>
      (cliente.PlazoFijo ?? []).map((pf) => {
        const diasRestantes = diasEntre(hoy, pf.fechaVencimiento);
        const estado =
          diasRestantes < 0 ? "VENCIDO" : diasRestantes <= 7 ? "PRÓXIMO" : "VIGENTE";
        const capital = parseFloat(pf.capital.toString());
        const tasa = parseFloat(pf.tasaAnual.toString());
        const interesMes = capital * tasa * (30 / 365);
        return {
          pfId: pf.id,
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          capital,
          tasa,
          interesMes,
          fechaInicio: pf.fechaInicio,
          fechaVencimiento: pf.fechaVencimiento,
          diasRestantes,
          estado,
        };
      })
    )
    .sort((a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime());

  const capitalTotal = rows.reduce((sum, r) => sum + r.capital, 0);
  const interesMesTotal = rows.reduce((sum, r) => sum + r.interesMes, 0);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Inversiones</p>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Resumen Global
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight truncate pb-1">
              Plazos Fijos Globales
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Ordenados por fecha de vencimiento
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-slate-400 shadow-sm p-5 flex flex-col justify-between min-h-[100px] hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Cantidad de PF</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">{rows.length}</p>
              <p className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md mb-1">Activos</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-blue-500 shadow-sm p-5 flex flex-col justify-between min-h-[100px] hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Capital total</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-blue-600 tabular-nums tracking-tight">{fmtNum(capitalTotal)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-emerald-400 shadow-sm p-5 flex flex-col justify-between min-h-[100px] hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Int. est. / mes</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-emerald-600 tabular-nums tracking-tight">{fmtNum(interesMesTotal)}</p>
            </div>
          </div>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
              <span className="text-slate-300 text-lg leading-none">-</span>
            </div>
            <p className="text-[13px] font-medium text-slate-500">Sin plazos fijos registrados</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {["Cliente", "Capital", "Tasa", "Inicio", "Vencimiento", "Días", "Estado", "Acción"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3.5 text-[10px] font-bold uppercase text-slate-500 tracking-widest whitespace-nowrap ${
                        i === 0 ? "text-left" : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-slate-50/80 transition-colors group ${
                      row.estado === "VENCIDO"
                        ? "bg-red-50/30"
                        : row.estado === "PRÓXIMO"
                        ? "bg-amber-50/30"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <Link
                        href={`/clientes/${row.clienteId}`}
                        className="text-[13px] font-bold text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        {row.clienteNombre}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-[13px] font-semibold text-slate-700">{fmtNum(row.capital)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-[13px] text-slate-500">
                      {fmtNum(row.tasa)}%
                    </td>
                    <td className="px-6 py-3.5 text-right text-[13px] text-slate-500">{fmtFecha(row.fechaInicio)}</td>
                    <td className="px-6 py-3.5 text-right text-[13px] text-slate-800 font-semibold">{fmtFecha(row.fechaVencimiento)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-[13px] font-semibold text-slate-600">{row.diasRestantes}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${estadoStyle[row.estado]}`}>
                        {row.estado}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/clientes/${row.clienteId}`}
                        className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-md px-3 py-1.5 hover:bg-slate-800 transition-colors shadow-sm inline-block"
                      >
                        Ver PF
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
