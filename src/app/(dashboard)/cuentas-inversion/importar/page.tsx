import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImportarXlsx } from "@/components/modules/cuentas-inversion/ImportarXlsx";
import { requirePermission } from "@/lib/auth/permissions";

export default async function ImportarPage() {
  await requirePermission("holdings:editar");
  const [cuentas, historial] = await Promise.all([
    prisma.cuentaInversion.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.importacionHolding.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { CuentaInversion: { select: { nombre: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/cuentas-inversion"
          className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 hover:text-blue-700 transition-colors"
        >
          ← Cuentas de Inversión
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Importar Holdings</h1>
            <p className="text-slate-500 text-sm mt-1">Carga masiva desde archivo .xlsx</p>
          </div>
          <Link
            href="/cuentas-inversion/importaciones/bind"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors underline"
          >
            ¿Tenés PDFs de Bind (Saldos y Tenencias)? Importarlos acá →
          </Link>
        </div>
      </header>

      <ImportarXlsx cuentas={cuentas} />

      {historial.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Historial de importaciones</h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Fecha", "Cuenta", "Archivo", "Filas totales", "Importadas"].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i >= 3 ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 text-slate-500">
                      {h.createdAt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 font-medium">{h.CuentaInversion.nombre}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono">{h.nombreArchivo}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{h.filasTotal}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-emerald-700">{h.filasImportadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
