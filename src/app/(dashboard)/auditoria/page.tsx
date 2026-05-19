import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

function fmt(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default async function AuditoriaPage() {
  await requirePermission("auditoria:leer");
  const [
    totalMovCC,
    totalMovCaja,
    totalPF,
    totalClientes,
    recentMovCC,
    recentMovCaja,
    recentPF,
  ] = await Promise.all([
    prisma.movimientoCC.count(),
    prisma.movimientoCaja.count(),
    prisma.plazoFijo.count(),
    prisma.cliente.count({ where: { activo: true } }),
    prisma.movimientoCC.findMany({
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      take: 10,
      select: { id: true, fecha: true, tipo: true, monto: true, descripcion: true, createdAt: true },
    }),
    prisma.movimientoCaja.findMany({
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      take: 10,
      select: { id: true, fecha: true, tipo: true, monto: true, moneda: true, descripcion: true, createdAt: true },
    }),
    prisma.plazoFijo.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, createdAt: true, capital: true, moneda: true, estado: true, Cliente: { select: { nombre: true } } },
    }),
  ]);

  type ActivityRow = {
    id: string;
    fecha: Date;
    tipo: string;
    modulo: string;
    descripcion: string;
    monto: number | null;
    moneda: string;
  };

  const activity: ActivityRow[] = [
    ...recentMovCC.map((m) => ({
      id:          `cc-${m.id}`,
      fecha:       m.fecha,
      tipo:        m.tipo,
      modulo:      "CC",
      descripcion: m.descripcion ?? "—",
      monto:       Number(m.monto),
      moneda:      "",
    })),
    ...recentMovCaja.map((m) => ({
      id:          `caja-${m.id}`,
      fecha:       m.fecha,
      tipo:        m.tipo,
      modulo:      "Caja",
      descripcion: m.descripcion ?? "—",
      monto:       Number(m.monto),
      moneda:      m.moneda,
    })),
    ...recentPF.map((p) => ({
      id:          `pf-${p.id}`,
      fecha:       p.createdAt,
      tipo:        "NUEVO PF",
      modulo:      "Plazos Fijos",
      descripcion: p.Cliente.nombre,
      monto:       Number(p.capital),
      moneda:      p.moneda,
    })),
  ];

  activity.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  const recent = activity.slice(0, 20);

  const TIPO_CLS: Record<string, string> = {
    INGRESO:          "bg-emerald-100 text-emerald-700",
    ENTRADA:          "bg-emerald-100 text-emerald-700",
    TRANSFERENCIA_IN: "bg-emerald-100 text-emerald-700",
    EGRESO:           "bg-red-100 text-red-600",
    SALIDA:           "bg-red-100 text-red-600",
    TRANSFERENCIA_OUT:"bg-red-100 text-red-600",
    INTERES:          "bg-blue-100 text-blue-700",
    AJUSTE:           "bg-slate-100 text-slate-600",
    "NUEVO PF":       "bg-amber-100 text-amber-700",
  };

  const MOD_CLS: Record<string, string> = {
    CC:           "bg-violet-100 text-violet-700",
    Caja:         "bg-slate-100 text-slate-600",
    "Plazos Fijos": "bg-amber-100 text-amber-700",
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Sistema</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Auditoría</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">Registro operativo del sistema</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Movimientos CC",    value: totalMovCC.toLocaleString("es-AR"),    color: "border-t-violet-400" },
          { label: "Movimientos Caja",  value: totalMovCaja.toLocaleString("es-AR"),  color: "border-t-slate-400"  },
          { label: "Plazos Fijos",      value: totalPF.toLocaleString("es-AR"),        color: "border-t-amber-400"  },
          { label: "Clientes activos",  value: totalClientes.toLocaleString("es-AR"), color: "border-t-blue-400"   },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 border-t-[3px] ${color} shadow-sm p-5 flex flex-col gap-1`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-3xl font-black text-slate-900 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Actividad reciente
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Fecha", "Tipo", "Módulo", "Descripción", "Monto / Ref."].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i >= 4 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Sin actividad registrada</td>
                </tr>
              ) : recent.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-500 font-mono">{fmtDate(row.fecha)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${TIPO_CLS[row.tipo] ?? "bg-slate-100 text-slate-600"}`}>
                      {row.tipo.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${MOD_CLS[row.modulo] ?? "bg-slate-100 text-slate-600"}`}>
                      {row.modulo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate">{row.descripcion}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">
                    {row.monto !== null
                      ? `${row.moneda ? row.moneda + " " : ""}${fmt(row.monto)}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
