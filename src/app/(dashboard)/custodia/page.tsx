import { getCustodiaClientes } from "@/lib/data/portfolio";
import { Decimal } from "@prisma/client/runtime/library";

function fmt(n: Decimal | number) {
  return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function CustodiaPage() {
  const custodias = await getCustodiaClientes();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Clientes</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Custodia clientes</h1>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Activo</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Cantidad</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Precio Promedio</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Total USD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {custodias.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No hay custodias registradas
                </td>
              </tr>
            ) : (
              custodias.map((c) => {
                const total = Number(c.cantidadTotal) * Number(c.precioPromedio);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{c.Cliente.nombre}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-tight">
                        {c.Activo.ticker}
                      </span>
                      {c.Activo.descripcion && (
                        <span className="ml-2 text-xs text-slate-400">{c.Activo.descripcion}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right tabular-nums text-slate-700">{fmt(c.cantidadTotal)}</td>
                    <td className="px-6 py-4 text-sm text-right tabular-nums text-slate-700">{fmt(c.precioPromedio)}</td>
                    <td className="px-6 py-4 text-sm text-right tabular-nums font-semibold text-slate-900">{fmt(total)}</td>
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
