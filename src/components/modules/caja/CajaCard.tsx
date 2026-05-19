import { Wallet, Star } from "lucide-react";
import { CajaEnriquecida } from "@/lib/data/caja";
import Decimal from "decimal.js";
import Link from "next/link";

interface CajaCardProps {
  caja: CajaEnriquecida;
}

export function CajaCard({ caja }: CajaCardProps) {
  // Tipado explícito para precisión financiera
  const formatCurrency = (val: Decimal | number) => 
    Number(val).toLocaleString("es-AR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });

  return (
    <Link href={`/caja/${caja.slug}`} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group h-full">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 group-hover:bg-blue-50/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Wallet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800">
                  {caja.label}
                </h3>
                {caja.esPrincipal && (
                  <span className="bg-amber-100 text-amber-600 p-1 rounded-full text-[10px]" title="Caja Principal">
                    <Star size={10} fill="currentColor" />
                  </span>
                )}
                {caja.tipo && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-tighter">
                    {caja.tipo.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">{caja.slug}</p>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Saldo USD</p>
            <p className="text-xl font-black text-slate-900 leading-none">
              <span className="text-sm font-medium text-slate-400 mr-1">U$D</span>
              {formatCurrency(caja.saldoActualUSD)}
            </p>
            <p className="text-[9px] text-slate-400">Inic: {formatCurrency(caja.saldoInicialUSD)}</p>
          </div>

          <div className="space-y-1 border-l border-slate-100 pl-4">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Saldo ARS</p>
            <p className="text-xl font-black text-slate-900 leading-none">
              <span className="text-sm font-medium text-slate-400 mr-1">$</span>
              {formatCurrency(caja.saldoActualARS)}
            </p>
            <p className="text-[9px] text-slate-400">Inic: {formatCurrency(caja.saldoInicialARS)}</p>
          </div>
        </div>
        
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] group-hover:bg-slate-100 transition-colors">
          <span className="text-slate-500 font-medium">{caja.totalMovimientos} movimientos registrados</span>
          <span className="font-bold text-blue-600 uppercase tracking-tight">
            Ver Libro →
          </span>
        </div>
      </div>
    </Link>
  );
}
