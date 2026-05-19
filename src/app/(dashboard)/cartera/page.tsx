import { getCarteraPropia, getClientesActivos } from "@/lib/data/portfolio";
import { TransferirActivoForm } from "@/components/modules/cartera/TransferirActivoForm";
import { Decimal } from "@prisma/client/runtime/library";

function fmt(n: Decimal | number) {
  return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function CarteraPage() {
  const [posiciones, clientes] = await Promise.all([
    getCarteraPropia(),
    getClientesActivos(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Portafolio</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cartera propia</h1>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Cartera</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Activo</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Cantidad</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Precio Compra</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Total USD</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posiciones.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No hay posiciones registradas
                </td>
              </tr>
            ) : (
              posiciones.map((pos) => {
                const total = Number(pos.cantidad) * Number(pos.precioCompra);
                const tieneStock = new Decimal(pos.cantidad.toString()).gt(0);
                return (
                  <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{pos.Cartera.nombre}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-tight">
                        {pos.Activo.ticker}
                      </span>
                      {pos.Activo.descripcion && (
                        <span className="ml-2 text-xs text-slate-400">{pos.Activo.descripcion}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right tabular-nums text-slate-700">{fmt(pos.cantidad)}</td>
                    <td className="px-6 py-4 text-sm text-right tabular-nums text-slate-700">{fmt(pos.precioCompra)}</td>
                    <td className="px-6 py-4 text-sm text-right tabular-nums font-semibold text-slate-900">{fmt(total)}</td>
                    <td className="px-6 py-4 text-right">
                      {tieneStock && (
                        <TransferirActivoForm posicionId={pos.id} clientes={clientes} />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
