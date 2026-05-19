import Decimal from "decimal.js";
import { CreditCard } from "lucide-react";

import Link from "next/link";

interface CuentaCorriente {
  id: string;
  moneda: string;
  saldo: Decimal | number;
}

export function CuentaCorrienteCard({ cuenta, clienteId }: { cuenta: CuentaCorriente, clienteId: string }) {
  const formatCurrency = (val: Decimal | number) => 
    Number(val).toLocaleString("es-AR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });

  return (
    <Link href={`/clientes/${clienteId}/cuentas/${cuenta.id}`} className="block group">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-slate-50 group-hover:text-blue-50 transition-colors">
          <CreditCard size={48} strokeWidth={1} />
        </div>
        
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
            Cuenta Corriente
          </p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{cuenta.moneda}</h3>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              VER MOVIMIENTOS →
            </span>
          </div>
          
          <div className="mt-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Saldo Disponible</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">
              <span className="text-sm font-medium text-slate-400 mr-2">{cuenta.moneda}</span>
              {formatCurrency(cuenta.saldo)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
