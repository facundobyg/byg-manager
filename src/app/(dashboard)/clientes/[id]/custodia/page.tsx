import { notFound } from "next/navigation";
import { getClienteById } from "@/lib/data/cuenta-corriente";
import { getResumenCustodiaByClienteId } from "@/lib/data/custodia";
import { CustodiaList } from "@/components/modules/clientes/CustodiaList";
import Link from "next/link";
import { ChevronLeft, Briefcase, FileText } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustodiaClientPage({ params }: PageProps) {
  const { id } = await params;
  const cliente = await getClienteById(id);

  if (!cliente) notFound();

  const posiciones = await getResumenCustodiaByClienteId(id);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-6">
        <Link
          href={`/clientes/${id}`}
          className="flex items-center gap-1 text-slate-400 hover:text-blue-600 text-xs font-black uppercase tracking-widest transition-colors group w-fit"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          VOLVER AL CLIENTE
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-500 text-white rounded-3xl shadow-xl shadow-amber-50">
              <Briefcase size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mb-1">Reporte de Cartera</p>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Custodia de Activos
              </h1>
              <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-wider">{cliente.nombre}</p>
            </div>
          </div>

          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-95">
            <FileText size={18} />
            Exportar Reporte
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-6 mt-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
            Posiciones Consolidadas
          </h2>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase">
            {posiciones.length} ACTIVOS
          </span>
        </div>
        
        <CustodiaList posiciones={posiciones} />
      </section>
    </div>
  );
}
