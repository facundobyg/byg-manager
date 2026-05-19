import { getTransferenciasActivos } from "@/lib/data/operaciones";
import { RevertirTransferenciaForm } from "@/components/modules/transferencias/RevertirTransferenciaForm";

function fmtFecha(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function TransferenciasPage() {
  const transferencias = await getTransferenciasActivos();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Auditoría</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Transferencias de activos</h1>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Fecha</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Activo</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Cantidad</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Descripción</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Estado</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transferencias.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No hay transferencias registradas
                </td>
              </tr>
            ) : (
              transferencias.map((t) => (
                <tr key={t.id} className={`transition-colors ${t.revertida ? "bg-slate-50/60" : "hover:bg-slate-50/50"}`}>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{fmtFecha(t.fecha)}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">{t.clienteNombre ?? "—"}</td>
                  <td className="px-6 py-4">
                    {t.activoTicker ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-tight">
                        {t.activoTicker}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-right tabular-nums text-slate-700">{t.cantidad ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-400 italic">{t.descripcion ?? "—"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      t.revertida
                        ? "bg-slate-100 text-slate-400"
                        : "bg-green-50 text-green-700"
                    }`}>
                      {t.revertida ? "REVERTIDA" : "ACTIVA"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.revertida ? (
                      <span className="text-[10px] text-slate-400 font-semibold">Revertida</span>
                    ) : (
                      <RevertirTransferenciaForm logId={t.id} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
