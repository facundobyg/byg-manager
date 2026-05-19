"use client";

import { useActionState, useRef, useEffect } from "react";
import { addProductor, toggleProductorActivo, eliminarProductor } from "@/app/(dashboard)/configuracion/actions";
import type { ProductorOption } from "@/lib/services/config.service";
import { PlusCircle, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

const iCls =
  "border border-slate-200 p-2 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium";

const VALUE_LABELS: Record<ProductorOption["value"], string> = {
  BYG:  "BYG",
  OTRO: "OTRO",
};

const OTRO_COLORS = [
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-cyan-50 text-cyan-700",
  "bg-orange-50 text-orange-700",
  "bg-teal-50 text-teal-700",
];

function otroColor(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) & 0xffff;
  return OTRO_COLORS[h % OTRO_COLORS.length];
}

function badgeClass(p: ProductorOption): string {
  if (p.value === "BYG") return "bg-blue-50 text-blue-700";
  return otroColor(p.label);
}

export function ProductoresForm({ productores }: { productores: ProductorOption[] }) {
  const formRef                     = useRef<HTMLFormElement>(null);
  const [addState, addAction]       = useActionState(addProductor, null);
  const [, toggleAction]            = useActionState(toggleProductorActivo, null);
  const [deleteState, deleteAction] = useActionState(eliminarProductor, null);

  useEffect(() => {
    if (addState?.ok) formRef.current?.reset();
  }, [addState]);

  return (
    <div className="flex flex-col gap-5">
      {/* Current list */}
      <div className="divide-y divide-slate-100">
        {productores.map((p) => (
          <div key={p.label} className="flex items-center justify-between py-3 px-1 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${badgeClass(p)}`}>
                {VALUE_LABELS[p.value]}
              </span>
              <span className={`text-sm font-semibold ${p.activo ? "text-slate-800" : "text-slate-400 line-through"}`}>
                {p.label}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <form action={toggleAction}>
                <input type="hidden" name="label" value={p.label} />
                <button
                  type="submit"
                  title={p.activo ? "Desactivar" : "Activar"}
                  className={`p-1 rounded transition-colors ${
                    p.activo
                      ? "text-emerald-600 hover:text-emerald-700"
                      : "text-slate-300 hover:text-slate-500"
                  }`}
                >
                  {p.activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </form>

              {p.value !== "BYG" && (
                <form action={deleteAction}>
                  <input type="hidden" name="label" value={p.label} />
                  <button
                    type="submit"
                    title="Eliminar"
                    className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      {deleteState?.error && <p className="text-xs text-red-500">{deleteState.error}</p>}

      {/* Add new */}
      <form ref={formRef} action={addAction} className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5">Nombre</label>
          <input
            name="label"
            required
            placeholder="ej: Banco Macro"
            className={`${iCls} w-44`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5">Tipo</label>
          <select name="value" className={`${iCls} w-28`}>
            <option value="BYG">BYG</option>
            <option value="OTRO">OTRO</option>
          </select>
        </div>

        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
        >
          <PlusCircle size={14} />
          Agregar
        </button>

        {addState?.error && <p className="text-xs text-red-500 w-full">{addState.error}</p>}
      </form>
    </div>
  );
}
