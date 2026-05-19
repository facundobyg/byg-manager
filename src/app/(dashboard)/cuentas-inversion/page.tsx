import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CuentasInversionPage() {
  const cuentas = await prisma.cuentaInversion.findMany({
    where: { activa: true },
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { ComitenteInversion: { where: { activo: true } } } },
      ComitenteInversion: {
        where: { activo: true },
        include: { _count: { select: { HoldingComitenteInversion: true } } },
      },
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Inversiones</p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cuentas de Inversión</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Instituciones e intermediarios bursátiles</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/cuentas-inversion/importar"
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
          >
            Importar xlsx
          </Link>
          <Link
            href="/cuentas-inversion/comisiones"
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
          >
            Comisiones
          </Link>
        </div>
      </header>

      {cuentas.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Sin cuentas de inversión activas.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuentas.map((c) => {
            const totalHoldings = c.ComitenteInversion.reduce((s, com) => s + com._count.HoldingComitenteInversion, 0);
            return (
              <Link
                key={c.id}
                href={`/cuentas-inversion/${c.id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-3 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-black text-slate-900">{c.nombre}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    activa
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comitentes</p>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">{c._count.ComitenteInversion}</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Holdings</p>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">{totalHoldings}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Actualizado {c.updatedAt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
