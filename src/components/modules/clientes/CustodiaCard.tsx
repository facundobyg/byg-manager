import Decimal from "decimal.js";
import { Briefcase, Activity, SquareChartGantt } from "lucide-react";

interface Posicion {
  id: string;
  ticker: string;
  descripcion?: string | null;
  cantidad: Decimal | number;
  precioPromedio?: Decimal | number;
  valuación?: Decimal | number | null;
  moneda?: string;
}

export function CustodiaCard({ pos }: { pos: Posicion }) {
  const formatQuantity = (val: Decimal | number) => 
    Number(val).toLocaleString("es-AR", { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 6 
    });

  const formatCurrency = (val: Decimal | number) => 
    Number(val).toLocaleString("es-AR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 text-slate-50 group-hover:text-amber-50 transition-colors">
        <Briefcase size={48} strokeWidth={1} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
              Custodia de Títulos
            </p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{pos.ticker}</h3>
              {pos.descripcion && (
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                  • {pos.descripcion}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Activity size={12} className="text-amber-500" /> Cantidad
            </p>
            <p className="text-xl font-black text-slate-900 tracking-tighter">
              {formatQuantity(pos.cantidad)}
            </p>
          </div>

          {pos.valuación && (
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <SquareChartGantt size={12} className="text-blue-500" /> Valuación Est.
              </p>
              <p className="text-xl font-black text-blue-600 tracking-tighter">
                <span className="text-[10px] font-medium text-slate-400 mr-1">{pos.moneda}</span>
                {formatCurrency(pos.valuación)}
              </p>
            </div>
          )}
        </div>

        {pos.precioPromedio && (
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              Precio Promedio Compra: <span className="text-slate-600 ml-1">{formatCurrency(pos.precioPromedio)} {pos.moneda}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
