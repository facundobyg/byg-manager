import { CajaEnriquecida } from "@/lib/data/caja";
import { CajaCard } from "./CajaCard";

interface CajaGridProps {
  cajas: CajaEnriquecida[];
}

export function CajaGrid({ cajas }: CajaGridProps) {
  if (cajas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
        <p className="text-slate-400 font-medium">No se encontraron cajas activas en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cajas.map((caja) => (
        <CajaCard key={caja.id} caja={caja} />
      ))}
    </div>
  );
}
