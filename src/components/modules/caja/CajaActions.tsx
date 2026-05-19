"use client";

import { useState } from "react";
import { ArrowLeftRight, RefreshCcw, Wallet, X } from "lucide-react";
import { TransferenciaForm } from "./TransferenciaForm";
import { OperacionCambioCajasForm } from "./OperacionCambioCajasForm";
import { TransferenciaCarteraForm } from "./TransferenciaCarteraForm";
import { TransferenciaCarteraACajaForm } from "./TransferenciaCarteraACajaForm";
import { NuevoMovimientoForm } from "./NuevoMovimientoForm";
import { PlusCircle } from "lucide-react";

interface CajaActionsProps {
  cajas: any[];
  carteras?: any[];
  defaultCajaId?: string;
  defaultSlug?: string;
}

export function CajaActions({ cajas, carteras = [], defaultCajaId, defaultSlug }: CajaActionsProps) {
  const [activeModal, setActiveModal] = useState<"transfer" | "cambio" | "cartera" | "nuevo" | null>(null);

  return (
    <div className="flex flex-wrap gap-3">
      {defaultCajaId && defaultSlug && (
        <button
          onClick={() => setActiveModal("nuevo")}
          className="flex items-center gap-2 bg-byg-accent hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm shadow-blue-600/20"
        >
          <PlusCircle size={16} />
          Nuevo Movimiento
        </button>
      )}
      <button
        onClick={() => setActiveModal("transfer")}
        className="flex items-center gap-2 bg-byg-surface-2 border border-byg-border hover:border-byg-accent text-byg-muted hover:text-byg-accent px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
      >
        <ArrowLeftRight size={16} />
        Transferencia entre Cajas
      </button>

      <button
        onClick={() => setActiveModal("cartera")}
        className="flex items-center gap-2 bg-byg-surface-2 border border-byg-border hover:border-emerald-500/40 text-byg-muted hover:text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
      >
        <Wallet size={16} />
        Caja ↔ Cartera
      </button>

      <button
        onClick={() => setActiveModal("cambio")}
        className="flex items-center gap-2 bg-byg-surface-2 border border-byg-border hover:border-amber-500/40 text-byg-muted hover:text-amber-400 px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
      >
        <RefreshCcw size={16} />
        Operación de Cambio
      </button>

      {activeModal && (
        <div className="fixed inset-0 bg-byg-bg/70 backdrop-blur-[12px] z-[100] flex items-center justify-center p-4">
          <div className="bg-byg-surface rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-byg-border animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-byg-border flex items-center justify-between bg-byg-bg/40 shrink-0">
              <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">
                {activeModal === "transfer" && "Transferencia entre Cajas"}
                {activeModal === "cartera" && "Transferencia Caja ↔ Cartera"}
                {activeModal === "cambio" && "Operación de Cambio"}
                {activeModal === "nuevo" && "Nuevo Movimiento"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-2 text-byg-muted hover:text-byg-text transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {activeModal === "nuevo" && defaultCajaId && defaultSlug && (
                <NuevoMovimientoForm cajaId={defaultCajaId} slug={defaultSlug} />
              )}
              {activeModal === "transfer" && <TransferenciaForm cajas={cajas} />}
              {activeModal === "cambio" && <OperacionCambioCajasForm cajas={cajas} />}
              {activeModal === "cartera" && (
                <div className="flex flex-col gap-8">
                  <section>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4 border-b border-emerald-500/20 pb-1">Opción A: Caja → Cartera</p>
                    <TransferenciaCarteraForm cajas={cajas} carteras={carteras} />
                  </section>
                  <section>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4 border-b border-emerald-500/20 pb-1">Opción B: Cartera → Caja</p>
                    <TransferenciaCarteraACajaForm cajas={cajas} carteras={carteras} />
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
