"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearPropiedad, desactivarPropiedad } from "@/app/(dashboard)/carteras/inmobiliarias/actions";
import { Home, Plus, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";

type Propiedad = { id: string; nombre: string };

type Props = {
  propiedades: Propiedad[];
};

const init: { error?: string; ok?: boolean } = {};

export function GestionPropiedades({ propiedades }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, pending] = useActionState(crearPropiedad, init);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  const handleDesactivar = async (id: string) => {
    if (!confirm("¿Seguro que desea desactivar esta propiedad? No aparecerá en los selectores de nuevos movimientos.")) return;
    setIsDeleting(id);
    await desactivarPropiedad(id);
    setIsDeleting(null);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Home size={14} className="text-slate-400" />
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">
            Gestión de propiedades
          </h2>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200 flex flex-col gap-6">
          {/* Listado */}
          <div className="flex flex-wrap gap-2">
            {propiedades.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay propiedades activas.</p>
            ) : (
              propiedades.map((p) => (
                <div 
                  key={p.id} 
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl group transition-all hover:border-red-200"
                >
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{p.nombre}</span>
                  <button
                    onClick={() => handleDesactivar(p.id)}
                    disabled={isDeleting === p.id}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                    title="Desactivar propiedad"
                  >
                    {isDeleting === p.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Formulario Nueva */}
          <form ref={formRef} action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre de la nueva propiedad</label>
              <div className="flex gap-2">
                <input
                  name="nombre"
                  type="text"
                  required
                  placeholder="Ej: Edificio Libertador, Quinta Olivos..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Crear
                </button>
              </div>
            </div>

            {state.error && (
              <p className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                ⚠️ {state.error}
              </p>
            )}
          </form>
        </div>
      )}
    </section>
  );
}
