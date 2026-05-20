"use client";

import { useActionState, useEffect, useRef } from "react";
import { registrarOperacionCambioEnCajas } from "@/app/(dashboard)/caja/actions";
import { ArrowLeftRight } from "lucide-react";

const SELECT_CLS =
  "w-full border border-byg-border p-3 rounded-xl text-sm bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 transition-all font-medium";
const INPUT_CLS =
  "w-full border border-byg-border p-3 rounded-xl text-sm bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 font-bold transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";
const LABEL_CLS = "text-[10px] font-bold text-byg-muted uppercase ml-1";

export function OperacionCambioCajasForm({ cajas }: { cajas: { id: string; label: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(registrarOperacionCambioEnCajas, null);

  useEffect(() => {
    if (state && 'success' in state && state.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="w-full max-w-4xl">
      <form
        ref={formRef}
        action={action}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-byg-border pb-4 mb-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">
              Operación de Cambio
            </h3>
            <p className="text-[10px] text-byg-muted font-bold uppercase mt-0.5">
              Compra / Venta entre cajas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className={LABEL_CLS}>Tipo de operación</label>
            <select name="tipoOperacion" required className={SELECT_CLS}>
              <option value="COMPRA">COMPRA (entra divisa)</option>
              <option value="VENTA">VENTA (sale divisa)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className={LABEL_CLS}>Moneda divisa</label>
            <select name="moneda" className={SELECT_CLS}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BRL">BRL</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className={LABEL_CLS}>Caja divisa</label>
            <select name="cajaDivisaId" required className={SELECT_CLS}>
              <option value="">Seleccionar</option>
              {cajas.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className={LABEL_CLS}>Caja ARS</label>
            <select name="cajaArsId" required className={SELECT_CLS}>
              <option value="">Seleccionar</option>
              {cajas.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className={LABEL_CLS}>Monto divisa</label>
            <input
              name="montoDivisa"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              className={INPUT_CLS}
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL_CLS}>Monto ARS</label>
            <input
              name="montoArs"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              className={INPUT_CLS}
            />
          </div>

          <div className="space-y-1 md:col-span-2 lg:col-span-3">
            <label className={LABEL_CLS}>Descripción</label>
            <input
              name="descripcion"
              placeholder="Ej: Compra USD cliente, venta MEP, etc."
              className="w-full border border-byg-border p-3 rounded-xl text-sm bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 transition-all placeholder:text-byg-muted/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full md:w-auto px-8 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {isPending ? "Procesando..." : (
            <>
              <ArrowLeftRight size={16} />
              Registrar cambio
            </>
          )}
        </button>

        {state && 'error' in state && state.error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            <p className="text-rose-400 text-xs font-bold">{state.error}</p>
          </div>
        )}
        {state && 'success' in state && state.success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-tight">Operación registrada con éxito</p>
          </div>
        )}
      </form>
    </div>
  );
}
