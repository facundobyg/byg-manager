"use client";

import { useActionState, useRef, useEffect } from "react";
import { addAlyc, toggleAlycActiva, eliminarAlyc } from "@/app/(dashboard)/configuracion/actions";
import type { AlycOption } from "@/lib/services/config.service";
import { PlusCircle, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

const iCls =
  "border border-slate-200 p-2 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium";

export function AlycForm({ alycs }: { alycs: AlycOption[] }) {
  const formRef                     = useRef<HTMLFormElement>(null);
  const [addState, addAction]       = useActionState(addAlyc, null);
  const [, toggleAction]            = useActionState(toggleAlycActiva, null);
  const [deleteState, deleteAction] = useActionState(eliminarAlyc, null);

  useEffect(() => {
    if (addState?.ok) formRef.current?.reset();
  }, [addState]);

  return (
    <div className="flex flex-col gap-5">
      <div className="divide-y divide-slate-100">
        {alycs.map((a) => (
          <div key={a.nombre} className="flex items-center justify-between py-3 px-1 gap-3">
            <span className={`text-sm font-semibold ${a.activa ? "text-slate-800" : "text-slate-400 line-through"}`}>
              {a.nombre}
            </span>

            <div className="flex items-center gap-1">
              <form action={toggleAction}>
                <input type="hidden" name="nombre" value={a.nombre} />
                <button
                  type="submit"
                  title={a.activa ? "Desactivar" : "Activar"}
                  className={`p-1 rounded transition-colors ${
                    a.activa
                      ? "text-emerald-600 hover:text-emerald-700"
                      : "text-slate-300 hover:text-slate-500"
                  }`}
                >
                  {a.activa ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </form>

              {a.nombre !== "Banco Industrial" && (
                <form action={deleteAction}>
                  <input type="hidden" name="nombre" value={a.nombre} />
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

      <form ref={formRef} action={addAction} className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5">Nombre ALYC</label>
          <input
            name="nombre"
            required
            placeholder="ej: IOL Invertironline"
            className={`${iCls} w-52`}
          />
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
