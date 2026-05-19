import Decimal from "decimal.js";
import { PlazoFijoCard } from "./PlazoFijoCard";

interface PlazoFijo {
  id: string;
  capital: Decimal | number;
  tasaAnual: Decimal | number;
  moneda: string;
  fechaInicio: Date;
  fechaVencimiento: Date;
  estado: string;
}

export function PlazoFijoList({ plazosFijos, clienteId }: { plazosFijos: PlazoFijo[], clienteId: string }) {
  if (!plazosFijos || !plazosFijos.length) {
    return (
      <div className="bg-white border border-slate-100 border-dashed rounded-2xl p-16 text-center flex flex-col items-center gap-3">
        <p className="text-slate-400 font-medium text-sm">Este cliente no tiene inversiones a plazo fijo activas.</p>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Sin Cartera de Inversión</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {plazosFijos.map((pf) => (
        <PlazoFijoCard key={pf.id} pf={pf} clienteId={clienteId} />
      ))}
    </div>
  );
}
