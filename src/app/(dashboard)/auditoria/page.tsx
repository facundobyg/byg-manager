import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

const ACCION_CLS: Record<string, string> = {
  CREAR:            "bg-emerald-100 text-emerald-700",
  EDITAR:           "bg-blue-100 text-blue-700",
  ELIMINAR:         "bg-red-100 text-red-600",
  REVERTIR:         "bg-amber-100 text-amber-700",
  LIQUIDAR:         "bg-violet-100 text-violet-700",
  ACCESO_DENEGADO:  "bg-rose-100 text-rose-700",
};

const ENTIDAD_CLS: Record<string, string> = {
  OperacionCambio:  "bg-slate-100 text-slate-600",
  MovimientoCC:     "bg-violet-50 text-violet-600",
  PlazoFijo:        "bg-amber-50 text-amber-600",
  Cliente:          "bg-blue-50 text-blue-600",
  Permission:       "bg-rose-50 text-rose-500",
};

export default async function AuditoriaPage() {
  await requirePermission("auditoria:leer");

  const [totalMovCC, totalMovCaja, totalPF, totalClientes, auditLogs] = await Promise.all([
    prisma.movimientoCC.count(),
    prisma.movimientoCaja.count(),
    prisma.plazoFijo.count(),
    prisma.cliente.count({ where: { activo: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        accion: true,
        entidad: true,
        entidadId: true,
        datosNuevos: true,
        createdAt: true,
        User: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Sistema</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Auditoría</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">Registro de acciones del sistema</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Movimientos CC",   value: totalMovCC.toLocaleString("es-AR"),    color: "border-t-violet-400" },
          { label: "Movimientos Caja", value: totalMovCaja.toLocaleString("es-AR"),  color: "border-t-slate-400"  },
          { label: "Plazos Fijos",     value: totalPF.toLocaleString("es-AR"),       color: "border-t-amber-400"  },
          { label: "Clientes activos", value: totalClientes.toLocaleString("es-AR"), color: "border-t-blue-400"   },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 border-t-[3px] ${color} shadow-sm p-5 flex flex-col gap-1`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-3xl font-black text-slate-900 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Log de acciones — últimas 50
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Fecha / Hora", "Acción", "Entidad", "Usuario", "Detalle"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Sin registros</td>
                </tr>
              ) : auditLogs.map((row) => {
                const desc = row.datosNuevos && typeof row.datosNuevos === "object" && "description" in row.datosNuevos
                  ? String((row.datosNuevos as { description?: string }).description ?? "")
                  : "";
                return (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
                      {fmtDate(row.createdAt)} {fmtTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ACCION_CLS[row.accion] ?? "bg-slate-100 text-slate-600"}`}>
                        {row.accion.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ENTIDAD_CLS[row.entidad] ?? "bg-slate-100 text-slate-500"}`}>
                        {row.entidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{row.User?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[300px] truncate">{desc || row.entidadId || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
