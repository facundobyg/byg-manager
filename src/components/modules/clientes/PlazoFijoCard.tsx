import Decimal from "decimal.js";
import { TrendingUp, Calendar, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PlazoFijo {
  id: string;
  capital: Decimal | number;
  tasaAnual: Decimal | number;
  moneda: string;
  fechaInicio: Date;
  fechaVencimiento: Date;
  estado: string;
}

export function PlazoFijoCard({ pf, clienteId }: { pf: PlazoFijo, clienteId: string }) {
  const formatCurrency = (val: Decimal | number) => 
    Number(val).toLocaleString("es-AR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });

  const formatPercent = (val: Decimal | number) => 
    Number(val).toLocaleString("es-AR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + "%";

  const isVencido = pf.estado === "VENCIDO" || new Date(pf.fechaVencimiento) < new Date();

  return (
    <Link href={`/clientes/${clienteId}/pf/${pf.id}`} className="block group">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-slate-50 group-hover:text-emerald-50 transition-colors">
          <TrendingUp size={48} strokeWidth={1} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
                Plazo Fijo {pf.moneda}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                  isVencido ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                }`}>
                  {isVencido ? "Vencido" : pf.estado}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tasa Anual</p>
              <p className="text-sm font-black text-emerald-600">{formatPercent(pf.tasaAnual)}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Capital Colocado</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">
              <span className="text-sm font-medium text-slate-400 mr-1">{pf.moneda}</span>
              {formatCurrency(pf.capital)}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {new Date(pf.fechaInicio).toLocaleDateString("es-AR")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock size={12} />
              <span className="text-[10px] font-black uppercase tracking-tighter underline decoration-emerald-300 underline-offset-2">
                {new Date(pf.fechaVencimiento).toLocaleDateString("es-AR")}
              </span>
            </div>
            <ChevronRight size={16} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
