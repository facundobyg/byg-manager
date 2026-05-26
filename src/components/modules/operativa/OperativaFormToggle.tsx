"use client";

import { useState } from "react";
import { Plus, X, ChevronLeft } from "lucide-react";
import { NuevoMovimientoDiarioForm } from "./NuevoMovimientoDiarioForm";
import { NuevoMovimientoCambioForm } from "./NuevoMovimientoCambioForm";

type Caja = { id: string; label: string; slug: string; esPrincipal: boolean; saldoUSD: number; saldoARS: number };
type ClienteCC = { id: string; nombre: string; ccUSD: number; ccARS: number };
type Props = { cajas: Caja[]; clientes?: ClienteCC[]; defaultCajaId?: string };
type FormKey = "cambio" | "resultado" | "solo_caja" | "transferencia";

const OPTIONS: { key: FormKey; label: string; desc: string; cls: string }[] = [
  { key: "cambio",        label: "Op. de Cambio",       desc: "Compra / Venta divisas",    cls: "border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5" },
  { key: "resultado",     label: "Con Resultado",        desc: "Honorarios, gastos",         cls: "border-blue-500/20 text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/5" },
  { key: "solo_caja",     label: "Solo Caja",            desc: "Sin impacto resultado",      cls: "border-byg-border text-byg-muted hover:border-byg-border-2 hover:bg-byg-surface-2" },
  { key: "transferencia", label: "Transferencia",        desc: "Entre cajas",                cls: "border-amber-500/20 text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/5" },
];

const TITLES: Record<FormKey, string> = {
  cambio:        "Nueva Operación de Cambio",
  resultado:     "Nuevo Resultado Operativo",
  solo_caja:     "Nuevo Movimiento de Caja",
  transferencia: "Nueva Transferencia entre Cajas",
};

const CLASIFICACION: Record<FormKey, "RESULTADO_OPERATIVO" | "MOVIMIENTO_CAJA" | "TRANSFERENCIA" | undefined> = {
  cambio:        undefined,
  resultado:     "RESULTADO_OPERATIVO",
  solo_caja:     "MOVIMIENTO_CAJA",
  transferencia: "TRANSFERENCIA",
};

export function OperativaFormToggle({ cajas, clientes = [], defaultCajaId }: Props) {
  const [open, setOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<FormKey | null>(null);

  const handleClose = () => { setOpen(false); setActiveForm(null); };

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
                  <button onClick={() => setActiveForm(null)} className="p-1 rounded-lg hover:bg-byg-surface-2 transition-colors">
                    <ChevronLeft size={16} className="text-byg-muted" />
                  </button>
                )}
                <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">
                  {activeForm ? TITLES[activeForm] : "Nueva Operación"}
                </h3>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-byg-surface-2 transition-colors">
                <X size={16} className="text-byg-muted hover:text-byg-text" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {!activeForm ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setActiveForm(opt.key)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-5 px-3 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${opt.cls}`}
                    >
                      <span className="text-[11px] text-center leading-tight">{opt.label}</span>
                      <span className="text-[9px] font-semibold opacity-60 text-center normal-case tracking-normal">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              ) : activeForm === "cambio" ? (
                <NuevoMovimientoCambioForm cajas={cajas} clientes={clientes} onSuccess={handleClose} />
              ) : (
                <NuevoMovimientoDiarioForm
                  cajas={cajas}
                  defaultCajaId={defaultCajaId}
                  defaultClasificacion={CLASIFICACION[activeForm]}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
