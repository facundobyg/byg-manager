import { getPlazosFijosVencimientos } from "@/lib/data/plazos-fijos";
import { VencimientosTable } from "@/components/modules/plazos-fijos/VencimientosTable";
import { requirePermission } from "@/lib/auth/permissions";

export default async function VencimientosPFPage() {
  await requirePermission("plazos_fijos:leer");
  const rows = await getPlazosFijosVencimientos();

  const vencidos = rows.filter((r) => r.estado === "VENCIDO" || new Date(r.fechaVencimiento) < new Date()).length;
  const proximos = rows.filter((r) => {
    const dias = Math.round((new Date(r.fechaVencimiento).getTime() - Date.now()) / 86400000);
    return dias >= 0 && dias <= 7;
  }).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Módulo</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vencimientos de Plazos Fijos</h1>
        <p className="text-sm text-slate-400 font-medium">Activos y vencidos ordenados por fecha de vencimiento.</p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-1 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
          <p className="text-3xl font-black text-slate-900 tabular-nums">{rows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-1 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencidos</p>
          <p className={`text-3xl font-black tabular-nums ${vencidos > 0 ? "text-red-600" : "text-slate-900"}`}>{vencidos}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-1 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximos ≤7d</p>
          <p className={`text-3xl font-black tabular-nums ${proximos > 0 ? "text-amber-600" : "text-slate-900"}`}>{proximos}</p>
        </div>
      </div>

      <VencimientosTable rows={rows} />
    </div>
  );
}
