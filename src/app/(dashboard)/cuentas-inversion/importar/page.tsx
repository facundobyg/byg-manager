import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { getBindImportBatch } from "../importaciones/bind/actions";
import { ImportarUnificado } from "@/components/modules/cuentas-inversion/ImportarUnificado";

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; batchId?: string }>;
}) {
  await requirePermission("holdings:editar");
  const params = await searchParams;

  const [cuentas, historialRaw, initialBatch] = await Promise.all([
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
    params.batchId ? getBindImportBatch(params.batchId) : Promise.resolve(null),
  ]);

  // Pre-format dates so no Date objects cross the server→client boundary
  const historial = historialRaw.map((h) => ({
    id: h.id,
    fecha: h.createdAt.toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    }),
    cuentaNombre: h.CuentaInversion.nombre,
    nombreArchivo: h.nombreArchivo,
    filasTotal: h.filasTotal,
    filasImportadas: h.filasImportadas,
  }));

  const defaultTab = params.tab === "bind" || !!params.batchId ? "bind" : "excel";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/cuentas-inversion"
          className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 hover:text-blue-700 transition-colors"
        >
          ← Cuentas de Inversión
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Importar Holdings</h1>
          <p className="text-slate-500 text-sm mt-1">Excel / XLSX o PDFs de Bind — todo desde acá.</p>
        </div>
      </header>

      <ImportarUnificado
        cuentas={cuentas}
        historial={historial}
        initialBatch={initialBatch}
        defaultTab={defaultTab as "excel" | "bind"}
      />
    </div>
  );
}
