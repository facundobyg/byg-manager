import { Decimal } from "@prisma/client/runtime/library";
import { Wallet, TrendingUp, DollarSign } from "lucide-react";

interface Props {
  data: {
    totalUSD: Decimal;
    totalARS: Decimal;
    totalARSenUSD: Decimal;
    balanceTotalUSD: Decimal;
    tcBlue: Decimal;
  };
}

export function BalanceCard({ data }: Props) {
  const fmt = (n: Decimal) => 
    Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Wallet size={120} />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <DollarSign size={14} className="text-emerald-400" />
          Balance General Consolidado
        </p>
        <h2 className="text-5xl font-black tabular-nums tracking-tighter">
          USD {fmt(data.balanceTotalUSD)}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">USD Físico</p>
          <p className="text-xl font-bold tabular-nums">USD {fmt(data.totalUSD)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            ARS en USD <TrendingUp size={10} className="text-emerald-400" />
          </p>
          <p className="text-xl font-bold tabular-nums">USD {fmt(data.totalARSenUSD)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2 border-t border-white/10">
        <span>Patrimonio Total en Cajas</span>
        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
          TC Blue usado: ${fmt(data.tcBlue)}
        </span>
      </div>
    </div>
  );
}
