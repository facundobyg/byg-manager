import { requirePermission } from "@/lib/auth/permissions";
import Link from "next/link";
import { getVencimientosPF } from "@/lib/data/plazo-fijo";

function diasEntre(desde: Date, hasta: Date): number {
  const a = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function fmtFecha(d: Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  });
}

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const estadoStyle: Record<string, string> = {
  VENCIDO: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
  PRÓXIMO: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  VIGENTE: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
};

export default async function VencimientosPFPage() {
  await requirePermission("plazos_fijos:leer");
  const plazosFijos = await getVencimientosPF();
  const hoy = new Date();

  const rows = plazosFijos.map((pf) => {
    const diasRestantes = diasEntre(hoy, pf.fechaVencimiento);
    const estadoVisual =
      diasRestantes < 0 ? "VENCIDO" : diasRestantes <= 7 ? "PRÓXIMO" : "VIGENTE";
    const capital = Number(pf.capital.toString());
    const tasaAnual = Number(pf.tasaAnual.toString());
    return {
      pfId: pf.id,
      clienteId: pf.Cliente.id,
      clienteNombre: pf.Cliente.nombre,
      capital,
      tasaAnual,
      fechaInicio: pf.fechaInicio,
      fechaVencimiento: pf.fechaVencimiento,
      diasRestantes,
      estadoVisual,
    };
  });

  const capitalTotal = rows.reduce((sum, r) => sum + r.capital, 0);
  const vencidos = rows.filter((r) => r.estadoVisual === "VENCIDO").length;
  const proximos = rows.filter((r) => r.estadoVisual === "PRÓXIMO").length;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="bg-byg-surface rounded-2xl border border-byg-border p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-byg-accent" />
        <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em] mb-1">Gestión Operativa</p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-byg-text tracking-tight">Vencimientos PF</h1>
            <p className="text-xs font-medium text-byg-muted mt-1">Ordenados por fecha de vencimiento · Solo activos</p>
          </div>
          <span className="text-[10px] font-black text-byg-muted bg-byg-surface-2 border border-byg-border px-2 py-0.5 rounded-md uppercase tracking-wider">
            Control de Riesgos
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-byg-surface rounded-xl border border-byg-border border-t-[3px] border-t-byg-border-2 p-5 flex flex-col justify-between min-h-[100px]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-byg-muted mb-2">Total PF</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-byg-text tabular-nums tracking-tight font-mono">{rows.length}</p>
            <span className="text-[10px] font-bold text-byg-muted bg-byg-surface-2 px-2 py-1 rounded-md mb-1">Activos</span>
          </div>
        </div>
        <div className="bg-byg-surface rounded-xl border border-byg-border border-t-[3px] border-t-rose-500 p-5 flex flex-col justify-between min-h-[100px]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-byg-muted mb-2">Vencidos</p>
          <div className="flex items-end justify-between">
            <p className={`text-3xl font-black tabular-nums tracking-tight font-mono ${vencidos > 0 ? "text-rose-400" : "text-byg-text"}`}>
              {vencidos}
            </p>
            {vencidos > 0 && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md mb-1">Atención</span>
            )}
          </div>
        </div>
        <div className="bg-byg-surface rounded-xl border border-byg-border border-t-[3px] border-t-amber-400 p-5 flex flex-col justify-between min-h-[100px]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-byg-muted mb-2">Próximos ≤ 7 días</p>
          <div className="flex items-end justify-between">
            <p className={`text-3xl font-black tabular-nums tracking-tight font-mono ${proximos > 0 ? "text-amber-400" : "text-byg-text"}`}>
              {proximos}
            </p>
          </div>
        </div>
        <div className="bg-byg-surface rounded-xl border border-byg-border border-t-[3px] border-t-blue-500 p-5 flex flex-col justify-between min-h-[100px]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-byg-muted mb-2">Capital total</p>
          <p className="text-3xl font-black text-byg-accent tabular-nums tracking-tight font-mono">{fmtNum(capitalTotal)}</p>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="bg-byg-surface border border-byg-border rounded-2xl py-16 px-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-byg-surface-2 border border-byg-border flex items-center justify-center">
              <span className="text-byg-muted text-lg leading-none">—</span>
            </div>
            <p className="text-[13px] font-medium text-byg-muted">Sin plazos fijos activos</p>
          </div>
        </div>
      ) : (
        <div className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-byg-bg border-b border-byg-border">
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest whitespace-nowrap">Cliente</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right whitespace-nowrap">Capital</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right whitespace-nowrap">Tasa</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right whitespace-nowrap">Inicio</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right whitespace-nowrap">Vencimiento</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right whitespace-nowrap">Días rest.</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right whitespace-nowrap">Estado</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-byg-muted tracking-widest text-right whitespace-nowrap">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-byg-border/40">
                {rows.map((row) => (
                  <tr
                    key={row.pfId}
                    className={`transition-colors ${
                      row.estadoVisual === "VENCIDO"
                        ? "bg-rose-500/5 hover:bg-rose-500/10"
                        : row.estadoVisual === "PRÓXIMO"
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : "hover:bg-byg-surface-2"
                    }`}
                  >
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <Link
                        href={`/clientes/${row.clienteId}`}
                        className="text-[13px] font-bold text-byg-text hover:text-byg-accent transition-colors"
                      >
                        {row.clienteNombre}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-[13px] text-byg-text font-semibold font-mono">
                      {fmtNum(row.capital)}
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-[13px] text-byg-accent font-semibold font-mono">
                      {fmtNum(row.tasaAnual)}%
                    </td>
                    <td className="px-6 py-3.5 text-right text-[13px] text-byg-muted font-mono">{fmtFecha(row.fechaInicio)}</td>
                    <td className="px-6 py-3.5 text-right text-[13px] text-byg-text font-semibold font-mono">{fmtFecha(row.fechaVencimiento)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-mono">
                      <span className={`text-[13px] font-black tracking-wide ${
                        row.diasRestantes < 0 ? "text-rose-400" :
                        row.diasRestantes <= 7 ? "text-amber-400" : "text-byg-muted"
                      }`}>
                        {row.diasRestantes < 0
                          ? `+${Math.abs(row.diasRestantes)}v`
                          : row.diasRestantes === 0
                          ? "hoy"
                          : `${row.diasRestantes}d`}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${estadoStyle[row.estadoVisual]}`}>
                        {row.estadoVisual}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/clientes/${row.clienteId}`}
                        className="bg-byg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-md px-3 py-1.5 hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/20 inline-block"
                      >
                        Ver cliente
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
