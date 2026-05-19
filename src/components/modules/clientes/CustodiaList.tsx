import Decimal from "decimal.js";
import { CustodiaCard } from "./CustodiaCard";

interface Posicion {
  id: string;
  ticker: string;
  descripcion?: string | null;
  cantidad: Decimal | number;
  precioPromedio?: Decimal | number;
  valuación?: Decimal | number | null;
  moneda?: string;
}

export function CustodiaList({ posiciones }: { posiciones: Posicion[] }) {
  if (!posiciones || !posiciones.length) {
    return (
      <div className="bg-white border border-slate-100 border-dashed rounded-2xl p-16 text-center flex flex-col items-center gap-3">
        <p className="text-slate-400 font-medium text-sm">Este cliente no posee activos en custodia.</p>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Cartera sin Títulos</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posiciones.map((pos) => (
        <CustodiaCard key={pos.id} pos={pos} />
      ))}
    </div>
  );
}
