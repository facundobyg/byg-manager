"use client";

import { useActionState, useEffect } from "react";
import { cambiarCategoriaActivo } from "@/app/(dashboard)/carteras/actions";
import { CategoriaActivo } from "@prisma/client";
import { Modal } from "@/components/ui/Modal";

const CATEGORIAS: { value: CategoriaActivo; label: string }[] = [
  { value: "BONO_USD",       label: "Bonos USD — Soberanos / Provinciales" },
  { value: "ON_USD",         label: "ONs en USD" },
  { value: "ACCION_ARS",     label: "Acciones Argentinas" },
  { value: "ACCION_USD",     label: "Acciones USD — Cable" },
  { value: "ACCION_USD_EXT", label: "Acciones USD — MEP" },
  { value: "CEDEAR",         label: "CEDEARs" },
  { value: "FCI",            label: "FCI / Fondos" },
  { value: "BONO_ARS",       label: "Bonos ARS" },
  { value: "CRIPTO",         label: "Criptomoneda" },
];

type Props = {
  activoId:        string;
  carteraSlug:     string;
  categoriaActual: CategoriaActivo;
  onClose:         () => void;
};

const sCls =
  "text-[12px] font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none w-full";

export function CambiarCategoriaForm({ activoId, carteraSlug, categoriaActual, onClose }: Props) {
  const [state, action, pending] = useActionState(cambiarCategoriaActivo, null);

  useEffect(() => {
    if (state && "success" in state) onClose();
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal title="Cambiar categoría" accentColor="text-violet-700" onClose={onClose}>
      <form action={action} className="px-5 py-4 flex flex-col gap-3">
        <input type="hidden" name="activoId"    value={activoId} />
        <input type="hidden" name="carteraSlug" value={carteraSlug} />

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Categoría</label>
          <select name="categoria" defaultValue={categoriaActual} className={sCls}>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <p className="text-[9px] text-slate-400 leading-snug">
          Cambia la categoría del activo en todas las carteras donde aparezca.
        </p>

        {state && "error" in state && (
          <p className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">{state.error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors">
            {pending ? "…" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
