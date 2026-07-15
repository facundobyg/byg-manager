import Link from "next/link";
import { requirePermission } from "@/lib/auth/permissions";
import { ImportarBolsaForm } from "./ImportarBolsaForm";

export default async function ImportarBolsaPage() {
  await requirePermission("bolsa:crear");

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header className="flex flex-col gap-3">
        <Link
          href="/bolsa"
          className="text-[10px] font-black uppercase tracking-[0.3em] text-byg-accent hover:opacity-80 transition-opacity"
        >
          ← Operaciones Bolsa
        </Link>
        <div>
          <h1 className="text-3xl font-black text-byg-text tracking-tight">
            Importar operaciones del día
          </h1>
          <p className="text-byg-muted text-sm mt-1">
            Subí el Excel diario de operaciones bolsa (.xlsx). Solo genera staging — no crea operaciones
            reales todavía.
          </p>
        </div>
      </header>

      <ImportarBolsaForm />
    </div>
  );
}
