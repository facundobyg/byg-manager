import { MovimientoCaja } from "@prisma/client";
import Decimal from "decimal.js";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

interface MovimientosTableProps {
  movimientos: (MovimientoCaja & { estadoVisual?: string })[];
}

export function MovimientosTable({ movimientos }: MovimientosTableProps) {
  // Tipado explícito para precisión financiera
  const formatCurrency = (val: Decimal | number) => 
    Number(val).toLocaleString("es-AR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });

  if (movimientos.length === 0) {
    return (
      <div className="py-12 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
        <p className="text-slate-400 font-medium">No hay movimientos registrados en esta caja.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Fecha</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Tipo</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Descripción</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Monto</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {movimientos.map((mov) => {
            const isEntry = mov.tipo === 'ENTRADA' || mov.tipo === 'TRANSFERENCIA_IN';
            
            return (
              <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                  {new Date(mov.fecha).toLocaleDateString("es-AR")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {isEntry ? (
                      <ArrowDownLeft size={16} className="text-green-600" />
                    ) : (
                      <ArrowUpRight size={16} className="text-red-500" />
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                      isEntry ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {mov.tipo.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">
                  {mov.descripcion || "Sin descripción"}
                </td>
                <td className={`px-6 py-4 text-sm font-black text-right ${
                  isEntry ? 'text-green-700' : 'text-slate-900'
                }`}>
                  <span className="text-[10px] font-bold mr-1 text-slate-400">{mov.moneda}</span>
                  {isEntry ? '+' : '-'}{formatCurrency(mov.monto)}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    {mov.confirmado ? (
                      <CheckCircle2 size={18} className="text-blue-500" />
                    ) : (
                      <Clock size={18} className="text-amber-400" />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
