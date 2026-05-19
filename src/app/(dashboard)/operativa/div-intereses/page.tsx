import { getDivIntereses, getTotalesDivIntereses } from "@/lib/data/div-intereses";
import { DivInteresesTable } from "@/components/modules/operativa/DivInteresesTable";
import { NuevoDivInteresForm } from "@/components/modules/operativa/NuevoDivInteresForm";
import { RegistrarToggle } from "@/components/modules/operativa/RegistrarToggle";
import { Coins, DollarSign, Wallet, TrendingUp } from "lucide-react";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default async function DivInteresesPage() {
  const mesActual = new Date().toISOString().slice(0, 7);
  const [rows, totales] = await Promise.all([
    getDivIntereses({ mes: mesActual }),
    getTotalesDivIntereses(mesActual)
  ]);

  // Serializar para el cliente
  const rowsPlain = rows.map(r => ({ ...r, fecha: r.fecha.toISOString() }));
  const totalesPlain = {
    usd: Number(totales.usd),
    ars: Number(totales.ars),
    totalEquivalenteUSD: Number(totales.totalEquivalenteUSD),
    tcBlue: Number(totales.tcBlue),
  };

  return (
    <div className="flex flex-col gap-10">
      <header className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em]">Módulo Operativa</p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dividendos e Intereses</h1>
          <p className="text-[13px] font-medium text-slate-500 mt-1 max-w-2xl">
            Dividendos, intereses cobrados, amortizaciones. Suma a la utilidad del mes.
          </p>
        </div>

        {/* Totales Resumen */}
        <div className="flex gap-8">
          <div className="flex flex-col items-end">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <TrendingUp size={10} className="text-emerald-500" /> Total USD Eq.
            </p>
            <p className="text-2xl font-black tabular-nums text-slate-900">
              {fmt(totalesPlain.totalEquivalenteUSD)}
            </p>
          </div>
          <div className="flex flex-col items-end border-l border-slate-100 pl-8">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Desglose</p>
            <div className="flex flex-col items-end gap-0.5">
              <p className="text-sm font-bold text-slate-600 tabular-nums">{fmt(totalesPlain.usd)} <span className="text-[10px] text-slate-400">USD</span></p>
              <p className="text-sm font-bold text-slate-600 tabular-nums">{fmt(totalesPlain.ars, 0)} <span className="text-[10px] text-slate-400">ARS</span></p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabla de Registros */}
      <DivInteresesTable rows={rowsPlain as any} />

      <RegistrarToggle label="Registrar cobro">
        <NuevoDivInteresForm />
      </RegistrarToggle>
    </div>
  );
}
