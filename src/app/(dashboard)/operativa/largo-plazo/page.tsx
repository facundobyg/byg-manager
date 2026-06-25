import { getLargoPlazo } from "@/lib/data/largo-plazo";
import { LargoPlazoTable } from "@/components/modules/operativa/LargoPlazoTable";
import { NuevoLargoPlazoForm } from "@/components/modules/operativa/NuevoLargoPlazoForm";
import { RegistrarToggle } from "@/components/modules/operativa/RegistrarToggle";
import { Timer, Info } from "lucide-react";

export default async function LargoPlazoPage() {
  const mesActual = new Date().toISOString().slice(0, 7);
  const rows = await getLargoPlazo({ mes: mesActual });

  // Serializar para el cliente
  const rowsPlain = rows.map(r => ({ ...r, fecha: r.fecha.toISOString() }));

  return (
    <div className="flex flex-col gap-10">
      <header className="bg-byg-surface p-8 rounded-3xl border border-byg-border shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Módulo Operativa</p>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-byg-text tracking-tight">Largo Plazo</h1>
            <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-200">
              Informativo
            </span>
          </div>
          <p className="text-[13px] font-medium text-byg-muted mt-1 max-w-2xl">
            Compras/ventas de bonos, acciones, ONs. NO suma a la utilidad del mes.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-byg-muted bg-byg-bg px-6 py-4 rounded-2xl border border-byg-border">
          <Info size={20} className="text-indigo-500" />
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest">Aviso Importante</p>
            <p className="text-xs font-medium italic">Registro documental sin impacto contable en caja o utilidad.</p>
          </div>
        </div>
      </header>

      {/* Tabla de Registros */}
      <LargoPlazoTable rows={rowsPlain as any} />

      <RegistrarToggle label="Registrar operación">
        <NuevoLargoPlazoForm />
      </RegistrarToggle>
    </div>
  );
}
