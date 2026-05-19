import Decimal from "decimal.js";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";

interface Movimiento {
  id: string;
  fecha: Date;
  tipo: string;
  monto: Decimal | number;
  descripcion?: string | null;
}

export function MovimientoCuentaCorrienteTable({ 
  movimientos, 
  saldoActual 
}: { 
  movimientos: Movimiento[], 
  saldoActual: Decimal | number 
}) {
  const formatCurrency = (val: Decimal | number) =>
    Number(val).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Cálculo de saldos progresivos (hacia atrás desde el actual)
  let balanceTracker = new Decimal(saldoActual);
  const movimientosConSaldo = movimientos.map((mov, index) => {
    const currentBalance = balanceTracker;
    // Para el siguiente (que es anterior en el tiempo), revertimos este movimiento
    const montoDecimal = new Decimal(mov.monto);
    const esEntrada = mov.tipo === "INGRESO" || mov.tipo === "INTERES";
    
    balanceTracker = esEntrada 
      ? balanceTracker.sub(montoDecimal) 
      : balanceTracker.add(montoDecimal);
      
    return { ...mov, saldoProgresivo: currentBalance };
  });

  if (!movimientos.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
            <span className="text-slate-300 text-lg leading-none">-</span>
          </div>
          <p className="text-[13px] font-medium text-slate-500">No hay movimientos registrados en esta cuenta</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-slate-500 tracking-widest">Fecha</th>
              <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-slate-500 tracking-widest">Tipo</th>
              <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-slate-500 tracking-widest">Descripción</th>
              <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-slate-500 tracking-widest text-right">Monto</th>
              <th className="px-6 py-3.5 text-[10px] font-bold uppercase text-slate-500 tracking-widest text-right">Saldo Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movimientosConSaldo.map((mov) => {
              const esEntrada = mov.tipo === "INGRESO" || mov.tipo === "INTERES";

              return (
                <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-3.5 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                    {new Date(mov.fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${esEntrada ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                        {esEntrada ? <ArrowDownLeft size={14} strokeWidth={2.5} /> : <ArrowUpRight size={14} strokeWidth={2.5} />}
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        esEntrada ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}>
                        {mov.tipo}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-500 font-medium max-w-[200px] truncate">
                    {mov.descripcion || "—"}
                  </td>
                  <td className={`px-6 py-3.5 text-[15px] font-black text-right tracking-tight tabular-nums ${
                    esEntrada ? "text-emerald-600" : "text-slate-900"
                  }`}>
                    {esEntrada ? "+" : "-"}{formatCurrency(mov.monto)}
                  </td>
                  <td className="px-6 py-3.5 text-[15px] font-bold text-right text-slate-800 tracking-tight tabular-nums bg-slate-50/30 group-hover:bg-slate-100/50 transition-colors">
                    {formatCurrency(mov.saldoProgresivo)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
