import { notFound } from "next/navigation";
import { getPlazoFijoById } from "@/lib/data/plazo-fijo";
import Link from "next/link";
import { ChevronLeft, TrendingUp, Calendar, Target, Info } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string; pfId: string }>;
};

export default async function PlazoFijoDetailPage({ params }: PageProps) {
  const { id, pfId } = await params;
  const pf = await getPlazoFijoById(pfId);

  if (!pf || pf.clienteId !== id) notFound();

  const formatCurrency = (val: any) => 
    Number(val).toLocaleString("es-AR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });

  const formatPercent = (val: any) => 
    Number(val).toLocaleString("es-AR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + "%";

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

        <div className="flex items-center gap-5">
          <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-100">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Inversión a Plazo Fijo</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              PF {pf.moneda} #{pf.id.slice(0, 8)}
            </h1>
            <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-wider">{pf.Cliente.nombre}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Target size={12} className="text-blue-600" /> Capital
          </p>
          <p className="text-2xl font-black text-slate-900">{pf.moneda} {formatCurrency(pf.capital)}</p>
        </div>
        
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <TrendingUp size={12} className="text-emerald-600" /> Tasa (TNA)
          </p>
          <p className="text-2xl font-black text-emerald-600">{formatPercent(pf.tasaAnual)}</p>
        </div>

        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-500" /> Vencimiento
          </p>
          <p className="text-2xl font-black text-slate-900">{new Date(pf.fechaVencimiento).toLocaleDateString("es-AR")}</p>
        </div>

        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Info size={12} className="text-blue-600" /> Estado
          </p>
          <p className="text-2xl font-black text-blue-600 uppercase tracking-tighter">{pf.estado}</p>
        </div>
      </div>

      <section className="flex flex-col gap-6 mt-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
            Movimientos y Auditoría del PF
          </h2>
        </div>
        
        <div className="bg-white border border-slate-100 border-dashed rounded-2xl p-16 text-center">
          <p className="text-slate-400 font-medium text-sm">No hay movimientos internos registrados para este plazo fijo.</p>
        </div>
      </section>
    </div>
  );
}
