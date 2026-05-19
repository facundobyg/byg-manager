"use client";

import { useActionState, useState } from "react";
import { agregarPosicion } from "@/app/(dashboard)/carteras/actions";
import { Modal } from "@/components/ui/Modal";
import { Plus } from "lucide-react";

const CATEGORIAS_COMPLETA = [
  { value: "BONO_USD",       label: "Bonos USD — Soberanos / Provinciales" },
  { value: "ON_USD",         label: "ONs en USD" },
  { value: "ACCION_USD",     label: "Acciones USD — Cable" },
  { value: "ACCION_USD_EXT", label: "Acciones USD — MEP" },
  { value: "CEDEAR",         label: "CEDEARs" },
  { value: "FCI",            label: "FCI / Fondos" },
  { value: "BONO_ARS",       label: "Bonos ARS" },
] as const;

const CATEGORIAS_CRIPTO = [
  { value: "CRIPTO", label: "Criptomoneda" },
] as const;

const MONEDAS = [
  { value: "USD", label: "USD" },
  { value: "ARS", label: "ARS" },
  { value: "EUR", label: "EUR" },
  { value: "BRL", label: "BRL" },
] as const;

type Props = {
  carteraId:   string;
  carteraSlug: string;
  isCripto:    boolean;
};

const inputCls =
  "text-[13px] font-bold text-byg-text border border-byg-border rounded-xl px-3 py-2 bg-byg-bg focus:ring-1 focus:ring-byg-accent/40 focus:border-byg-accent outline-none w-full transition-colors";

const labelCls = "text-[10px] font-black uppercase tracking-widest text-byg-muted";

export function AgregarActivoForm({ carteraId, carteraSlug, isCripto }: Props) {
  const [open, setOpen]           = useState(false);
  const [state, action, pending]  = useActionState(agregarPosicion, null);

  const categorias       = isCripto ? CATEGORIAS_CRIPTO : CATEGORIAS_COMPLETA;
  const defaultCategoria = isCripto ? "CRIPTO" : "BONO_USD";

  if (state && "success" in state && state.success && open) {
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm shadow-blue-600/20 bg-byg-accent text-white hover:bg-blue-500"
      >
        <Plus size={13} />
        Agregar activo
      </button>

      {open && (
        <Modal title="Nueva posición" accentColor="text-byg-accent" maxWidth="max-w-lg" onClose={() => setOpen(false)}>
          <div className="px-1 pt-1 pb-1">
            <p className="px-5 py-2 text-[10px] text-byg-muted font-medium border-b border-byg-border">
              Si el ticker ya existe en esta cartera se acumula con precio promedio ponderado.
            </p>
          </div>
          <form action={action} className="px-5 py-4 flex flex-col gap-3">
            <input type="hidden" name="carteraId"   value={carteraId} />
            <input type="hidden" name="carteraSlug" value={carteraSlug} />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Ticker *</label>
                <input name="ticker" type="text" required placeholder="Ej: AL30, BTC" className={inputCls + " uppercase"} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Descripción</label>
                <input name="descripcion" type="text" placeholder="Opcional" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Categoría *</label>
                <select name="categoria" defaultValue={defaultCategoria} className={inputCls}>
                  {categorias.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Moneda precio</label>
                <select name="monedaPrecio" defaultValue="USD" className={inputCls}>
                  {MONEDAS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Cantidad *</label>
                <input name="cantidad" type="number" step="any" min="0.000001" required placeholder="0.00" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Precio compra *</label>
                <input name="precioCompra" type="number" step="any" min="0.000001" required placeholder="0.00" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Fecha compra</label>
                <input name="fecha" type="date" className={inputCls} />
              </div>
            </div>

            {state && "error" in state && (
              <p className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
                {state.error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-byg-muted bg-byg-surface-2 border border-byg-border hover:bg-byg-border transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={pending} className="px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-byg-accent text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20">
                {pending ? "Guardando…" : "Guardar posición"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
