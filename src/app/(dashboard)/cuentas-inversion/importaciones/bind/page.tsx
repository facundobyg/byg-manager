import Link from "next/link";
import { requirePermission } from "@/lib/auth/permissions";
import { getBindImportBatch } from "./actions";
import { BindImportUpload } from "@/components/modules/cuentas-inversion/BindImportUpload";

export default async function BindImportPage({
  searchParams,
}: {
  searchParams: Promise<{ batchId?: string }>;
}) {
  await requirePermission("holdings:editar");
  const params = await searchParams;
  const initialBatch = params.batchId ? await getBindImportBatch(params.batchId) : null;

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header className="flex flex-col gap-3">
        <Link
          href="/cuentas-inversion/importar"
          className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 hover:text-blue-700 transition-colors"
        >
          ← Importar Holdings
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Importar Saldos y Tenencias — Bind</h1>
          <p className="text-slate-500 text-sm mt-1">
            Subí PDFs de &quot;Reporte de Tenencia Valorizada&quot; de Bind Inversiones. Esto solo previsualiza y guarda
            auditoría — no modifica holdings, precios ni carteras reales todavía.
          </p>
        </div>
      </header>

      <BindImportUpload initialBatch={initialBatch} />
    </div>
  );
}
