import Decimal from "decimal.js";
import { CuentaCorrienteCard } from "./CuentaCorrienteCard";

interface CuentaCorriente {
  id: string;
  moneda: string;
  saldo: Decimal | number;
}

export function CuentaCorrienteList({ cuentas, clienteId }: { cuentas: CuentaCorriente[], clienteId: string }) {
  if (!cuentas.length) {
    return (
      <div className="bg-white border border-slate-100 border-dashed rounded-2xl p-16 text-center flex flex-col items-center gap-3">
        <p className="text-slate-400 font-medium text-sm">Este cliente no tiene cuentas corrientes activas.</p>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Cuentas en 0.00</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {cuentas.map((cuenta) => (
        <CuentaCorrienteCard key={cuenta.id} cuenta={cuenta} clienteId={clienteId} />
      ))}
    </div>
  );
}
