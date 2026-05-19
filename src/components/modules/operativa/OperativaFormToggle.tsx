"use client";

import { useState } from "react";
import { Plus, X, ArrowRightLeft, ChevronLeft } from "lucide-react";
import { NuevoMovimientoDiarioForm } from "./NuevoMovimientoDiarioForm";
import { NuevoMovimientoCambioForm } from "./NuevoMovimientoCambioForm";

type Caja = {
  id: string;
  label: string;
  slug: string;
  esPrincipal: boolean;
  saldoUSD: number;
  saldoARS: number;
};

type Props = {
  cajas: Caja[];
  defaultCajaId?: string;
};

export function OperativaFormToggle({ cajas, defaultCajaId }: Props) {
  const [open, setOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<"movimiento" | "cambio" | null>(null);

  const handleClose = () => {
    setOpen(false);
    setActiveForm(null);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-byg-accent text-white hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/20"
      >
        <Plus size={14} />
        Nueva Operación
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-byg-bg/70 backdrop-blur-[12px]">
          <div className="bg-byg-surface rounded-2xl shadow-2xl w-full max-w-5xl border border-byg-border max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-byg-border shrink-0">
              <div className="flex items-center gap-2">
                {activeForm && (
                  <button
                    onClick={() => setActiveForm(null)}
                    className="p-1 rounded-lg hover:bg-byg-surface-2 transition-colors"
                  >
                    <ChevronLeft size={16} className="text-byg-muted" />
                  </button>
                )}
                <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">
                  {activeForm === "movimiento"
                    ? "Nuevo Movimiento Operativo"
                    : activeForm === "cambio"
                    ? "Nueva Operación de Cambio"
                    : "Nueva Operación"}
                </h3>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-byg-surface-2 transition-colors">
                <X size={16} className="text-byg-muted hover:text-byg-text" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {!activeForm ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setActiveForm("movimiento")}
                    className="flex-1 flex items-center justify-center gap-3 py-10 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-byg-border text-byg-muted hover:border-byg-border-2 hover:bg-byg-surface-2 transition-all"
                  >
                    <Plus size={20} />
                    Movimiento Operativo
                  </button>
                  <button
                    onClick={() => setActiveForm("cambio")}
                    className="flex-1 flex items-center justify-center gap-3 py-10 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all"
                  >
                    <ArrowRightLeft size={20} />
                    Operación de Cambio
                  </button>
                </div>
              ) : activeForm === "movimiento" ? (
                <NuevoMovimientoDiarioForm cajas={cajas} defaultCajaId={defaultCajaId} />
              ) : (
                <NuevoMovimientoCambioForm cajas={cajas} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
