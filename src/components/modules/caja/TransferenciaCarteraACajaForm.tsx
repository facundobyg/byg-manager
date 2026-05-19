"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { transferirCarteraACaja } from "@/app/(dashboard)/caja/actions";
import { ArrowLeftRight } from "lucide-react";

type Caja    = { id: string; label: string };
type Cartera = { id: string; nombre: string; slug: string };

type Props = {
  cajas:    Caja[];
  carteras: Cartera[];
};

const sCls =
  "w-full border border-byg-border p-3 rounded-xl text-sm bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 transition-all font-medium";

export function TransferenciaCarteraACajaForm({ cajas, carteras }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(transferirCarteraACaja, null);
  const [origenSaldo, setOrigenSaldo] = useState<"CABLE" | "MEP" | "PESOS">("CABLE");

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="mb-8 w-full max-w-4xl">
      <form
        ref={formRef}
        action={action}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-byg-border pb-4 mb-2">
          <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg">
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">
              Transferencia Cartera → Caja
            </h3>
            <p className="text-[10px] text-byg-muted font-bold uppercase mt-0.5">
              Devuelve saldo disponible de cartera a caja sin generar movimiento diario
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Cartera Origen</label>
            <select name="carteraId" required className={sCls}>
              <option value="">Seleccionar cartera</option>
              {carteras.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Caja Destino</label>
            <select name="cajaId" required className={sCls}>
              <option value="">Seleccionar caja</option>
              {cajas.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Saldo origen</label>
            <select
              name="origenSaldo"
              value={origenSaldo}
              onChange={(e) => setOrigenSaldo(e.target.value as "CABLE" | "MEP" | "PESOS")}
              className={sCls}
            >
              <option value="CABLE">USD Cable</option>
              <option value="MEP">USD MEP</option>
              <option value="PESOS">Pesos (ARS)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">
              Moneda — {origenSaldo === "PESOS" ? "ARS" : "USD"}
            </label>
            <input
              name="monto"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              className="w-full border border-byg-border p-3 rounded-xl text-sm bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 font-bold transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold text-byg-muted uppercase ml-1">Descripción (opcional)</label>
            <input
              name="descripcion"
              placeholder="Ej: Retiro de fondos, corrección, etc."
              className="w-full border border-byg-border p-3 rounded-xl text-sm bg-byg-bg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 transition-all placeholder:text-byg-muted/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full md:w-auto px-8 bg-violet-600 hover:bg-violet-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-violet-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {pending ? "Procesando…" : (
            <>
              <ArrowLeftRight size={16} />
              Devolver a Caja
            </>
          )}
        </button>

        {state?.error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            <p className="text-rose-400 text-xs font-bold">{state.error}</p>
          </div>
        )}
        {state?.success && (
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-violet-400" />
            <p className="text-violet-400 text-xs font-bold uppercase tracking-tight">
              Transferencia realizada con éxito
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
