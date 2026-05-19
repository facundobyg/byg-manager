import { Prisma } from "@prisma/client";

type PFRow = Prisma.PlazoFijoGetPayload<{ include: { Cliente: true } }>;

function diasRestantes(fechaVencimiento: Date): number {
  const hoy = Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const venc = Date.UTC(
    fechaVencimiento.getFullYear(),
    fechaVencimiento.getMonth(),
    fechaVencimiento.getDate()
  );
  return Math.round((venc - hoy) / (1000 * 60 * 60 * 24));
}

function fmtFecha(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  });
}

function fmtNum(v: { toString(): string }) {
  return parseFloat(v.toString()).toLocaleString("es-AR", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

export function VencimientosTable({ rows }: { rows: PFRow[] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-slate-400 py-6 text-center">Sin plazos fijos activos o vencidos.</p>;
  }

  const vencidos  = rows.filter((pf) => pf.estado === "VENCIDO" || diasRestantes(pf.fechaVencimiento) < 0).length;
  const urgentes  = rows.filter((pf) => { const d = diasRestantes(pf.fechaVencimiento); return d >= 0 && d <= 3; }).length;
  const proximos  = rows.filter((pf) => { const d = diasRestantes(pf.fechaVencimiento); return d > 3 && d <= 7; }).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm flex flex-col gap-0.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total PF</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{rows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 px-4 py-3 shadow-sm flex flex-col gap-0.5">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">🔴 Vencidos</p>
          <p className={`text-2xl font-black tabular-nums ${vencidos > 0 ? "text-red-600" : "text-slate-400"}`}>{vencidos}</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 px-4 py-3 shadow-sm flex flex-col gap-0.5">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">🟠 Urgentes ≤3d</p>
          <p className={`text-2xl font-black tabular-nums ${urgentes > 0 ? "text-orange-600" : "text-slate-400"}`}>{urgentes}</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 px-4 py-3 shadow-sm flex flex-col gap-0.5">
          <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">🟡 Próximos ≤7d</p>
          <p className={`text-2xl font-black tabular-nums ${proximos > 0 ? "text-yellow-600" : "text-slate-400"}`}>{proximos}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              {["Cliente", "Moneda", "Capital", "Tasa %", "Inicio", "Vencimiento", "Estado", "Días", "Alerta"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((pf) => {
              const dias    = diasRestantes(pf.fechaVencimiento);
              const vencido = pf.estado === "VENCIDO" || dias < 0;
              const urgente = !vencido && dias <= 3;
              const proximo = !vencido && !urgente && dias <= 7;

              const rowBg = vencido
                ? "bg-red-50 hover:bg-red-100"
                : urgente
                ? "bg-orange-50 hover:bg-orange-100"
                : proximo
                ? "bg-yellow-50 hover:bg-yellow-100"
                : "hover:bg-slate-50";

              return (
                <tr
                  key={pf.id}
                  className={`border-b border-slate-50 last:border-0 transition-colors ${rowBg}`}
                >
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                    {pf.Cliente.nombre}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-500">{pf.moneda}</td>
                  <td className="px-4 py-3 text-xs font-black tabular-nums text-slate-900 whitespace-nowrap">
                    {fmtNum(pf.capital)}
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums text-slate-600">
                    {fmtNum(pf.tasaAnual)}%
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtFecha(pf.fechaInicio)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">{fmtFecha(pf.fechaVencimiento)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {vencido ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">
                        VENCIDO
                      </span>
                    ) : proximo || urgente ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
                        PRÓXIMO
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase">
                        ACTIVO
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-xs font-black tabular-nums ${vencido ? "text-red-600" : urgente ? "text-orange-600" : proximo ? "text-yellow-600" : "text-slate-700"}`}>
                    {dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {vencido ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        🔴 Vencido
                      </span>
                    ) : urgente ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        🟠 Urgente
                      </span>
                    ) : proximo ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        🟡 Próximo
                      </span>
                    ) : null}
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
