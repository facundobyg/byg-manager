import { getRulosBolsa, getTotalesRulos } from "@/lib/data/rulos-bolsa";
import { RulosBolsaTable } from "@/components/modules/operativa/RulosBolsaTable";
import { NuevoRuloBolsaForm } from "@/components/modules/operativa/NuevoRuloBolsaForm";
import { RegistrarToggle } from "@/components/modules/operativa/RegistrarToggle";
import { TrendingUp, DollarSign, Wallet } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function RulosBolsaPage() {
  const mesActual = new Date().toISOString().slice(0, 7);
  const [rows, totales] = await Promise.all([
    getRulosBolsa({ mes: mesActual }),
    getTotalesRulos(mesActual)
  ]);

  // Serializar para el cliente
  const rowsPlain = rows.map(r => ({ ...r, fecha: r.fecha.toISOString() }));
  const totalesPlain = {
    usd: Number(totales.usd),
    ars: Number(totales.ars),
  };

  return (
    <div className="flex flex-col gap-10">
      <header className="bg-byg-surface p-8 rounded-3xl border border-byg-border shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Módulo Operativa</p>
          <h1 className="text-4xl font-black text-byg-text tracking-tight">Rulos Bolsa</h1>
          <p className="text-[13px] font-medium text-byg-muted mt-1 max-w-2xl">
            Operaciones de arbitraje/bolsa diarias. Suma a la utilidad del mes.
          </p>
        </div>

        {/* Totales Resumen */}
        <div className="flex gap-8">
          <div className="flex flex-col items-end">
            <p className="text-[9px] font-black text-byg-muted uppercase tracking-widest flex items-center gap-1">
              <DollarSign size={10} /> Utilidad USD Mes
            </p>
            <p className={`text-2xl font-black tabular-nums ${totalesPlain.usd >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {totalesPlain.usd >= 0 ? "+" : ""}{fmt(totalesPlain.usd)}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[9px] font-black text-byg-muted uppercase tracking-widest flex items-center gap-1">
              <Wallet size={10} /> Utilidad ARS Mes
            </p>
            <p className={`text-2xl font-black tabular-nums ${totalesPlain.ars >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {totalesPlain.ars >= 0 ? "+" : ""}{fmt(totalesPlain.ars)}
            </p>
          </div>
        </div>
      </header>

      {/* Tabla de Registros */}
      <RulosBolsaTable rows={rowsPlain as any} />

      <RegistrarToggle label="Registrar operación">
        <NuevoRuloBolsaForm />
      </RegistrarToggle>
    </div>
  );
}
