"use client";

import { useActionState, useState } from "react";
import { updateCaja, deleteCaja } from "@/app/(dashboard)/configuracion/actions";
import { Check, Edit2, Trash2, X } from "lucide-react";

interface EditCajaFormProps {
  id: string;
  label: string;
  tipo: string;
  activa: boolean;
  esPrincipal: boolean;
}

function DeleteButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteCaja, null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        title="Eliminar caja"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      {state?.error && (
        <span className="text-[10px] text-red-500 font-bold max-w-[200px]">{state.error}</span>
      )}
      {!state?.error && (
        <>
          <span className="text-[10px] text-red-600 font-bold">¿Confirmar?</span>
          <button
            type="submit"
            disabled={pending}
            className="px-2 py-1 text-[10px] font-black bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "..." : "Sí, eliminar"}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
      >
        <X size={12} />
      </button>
    </form>
  );
}

export function EditCajaForm({ id, label, tipo, activa, esPrincipal }: EditCajaFormProps) {
  const [state, action, pending] = useActionState(updateCaja, null);
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <div className="flex gap-2 mt-0.5">
            <span className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
              {tipo?.replace(/_/g, " ") || "S/T"}
            </span>
            {!activa && (
              <span className="text-[9px] font-black uppercase tracking-tighter bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                Inactiva
              </span>
            )}
            {esPrincipal && (
              <span className="text-[9px] font-black uppercase tracking-tighter bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">
                Principal — no eliminable
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        >
          <Edit2 size={16} />
        </button>
        {!esPrincipal && <DeleteButton id={id} />}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-3 flex-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-in zoom-in-95 duration-200">
      <input type="hidden" name="id" value={id} />

      <div className="flex flex-col gap-0.5 min-w-[150px]">
        <label className="text-[8px] font-black text-blue-400 uppercase ml-1">Nombre</label>
        <input
          name="label"
          defaultValue={label}
          required
          className="border border-blue-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white"
        />
      </div>

      {!esPrincipal && (
        <div className="flex flex-col gap-0.5">
          <label className="text-[8px] font-black text-blue-400 uppercase ml-1">Tipo</label>
          <select
            name="tipo"
            defaultValue={tipo}
            required
            className="border border-blue-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white"
          >
            <option value="CENTRAL_CONTABLE">Central Contable</option>
            <option value="SUCURSAL_OPERATIVA">Sucursal Operativa</option>
            <option value="CAJA_SEGURIDAD">Caja de Seguridad</option>
            <option value="BANCO">Banco</option>
          </select>
        </div>
      )}
      {esPrincipal && <input type="hidden" name="tipo" value={tipo} />}

      {!esPrincipal && (
        <div className="flex flex-col gap-0.5">
          <label className="text-[8px] font-black text-blue-400 uppercase ml-1">Estado</label>
          <select
            name="activa"
            defaultValue={activa ? "true" : "false"}
            className="border border-blue-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white"
          >
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </select>
        </div>
      )}
      {esPrincipal && <input type="hidden" name="activa" value="true" />}

      <div className="flex items-center gap-1 ml-auto">
        <button
          type="submit"
          disabled={pending}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
          title="Guardar cambios"
        >
          {pending ? "..." : <Check size={16} />}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
          title="Cancelar"
        >
          <X size={16} />
        </button>
      </div>

      {state?.error && <p className="w-full text-[10px] text-red-500 font-bold mt-1 ml-1">{state.error}</p>}
    </form>
  );
}
