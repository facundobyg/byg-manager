import { getClientes } from "@/lib/data/cliente";
import { getRecentOperacionMovimientos } from "@/lib/data/movimiento-cc";
import { OperacionForm } from "@/components/modules/operaciones/OperacionForm";
import { OperacionHistoryTable } from "@/components/modules/operaciones/OperacionHistoryTable";

export default async function OperacionesPage() {
  const [clientes, ledger] = await Promise.all([
    getClientes(),
    getRecentOperacionMovimientos(),
  ]);

  const clientesData = clientes.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    cuentasCorrientes: (c.CuentaCorriente ?? []).map((cc) => ({ moneda: cc.moneda })),
  }));

  const revertidas = ledger.filter((r) => r.revertida).length;
  const activas = ledger.filter((r) => !r.revertida).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Mesa</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Operaciones</h1>
        <p className="text-sm text-slate-400 font-medium">Registro y simulación operativa</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <OperacionForm clientes={clientesData} />
        </div>

        <section className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Libro de operaciones</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-500">Total: <strong className="text-slate-800">{ledger.length}</strong></span>
              <span className="text-blue-600">Activas: <strong>{activas}</strong></span>
              <span className="text-red-500">Revertidas: <strong>{revertidas}</strong></span>
            </div>
          </div>
          <OperacionHistoryTable rows={ledger} />
        </section>
      </div>
    </div>
  );
}
