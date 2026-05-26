"use client";

import { useActionState } from "react";
import { setTemporalPermission } from "@/app/(dashboard)/permisos/actions";
import { Clock } from "lucide-react";

type UserOption = { id: string; name: string; role: string };

export function TemporalPermisoForm({ users }: { users: UserOption[] }) {
  const [state, action, pending] = useActionState(setTemporalPermission, null);

  const nonAdminUsers = users.filter((u) => u.role !== "ADMIN");

  // Today's date as default fechaHasta (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/40">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-amber-600" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">Permiso temporal</h3>
        </div>
        <p className="text-[10px] text-slate-400 font-medium mt-1">
          Ej: Augusto puede operar Caja Oficina durante vacaciones. Se revoca automáticamente al vencer.
        </p>
      </div>
      <form action={action} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Usuario</label>
          <select
            name="userId"
            required
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none bg-white"
          >
            <option value="">Seleccionar usuario…</option>
            {nonAdminUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Permiso</label>
          <select
            name="modulo"
            required
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none bg-white"
            defaultValue="caja"
          >
            <option value="caja">Caja</option>
            <option value="operativa">Operativa</option>
            <option value="cc">Cuenta Corriente</option>
            <option value="clientes">Clientes</option>
            <option value="pf">Plazos Fijos</option>
            <option value="bolsa">Bolsa</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Acción</label>
          <select
            name="accion"
            required
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none bg-white"
            defaultValue="operar_oficina"
          >
            <option value="operar_oficina">Operar Oficina (Caja)</option>
            <option value="operar_trenque">Operar Trenque (Caja)</option>
            <option value="editar_movimiento">Editar movimiento (Caja)</option>
            <option value="transferir">Transferir (Caja)</option>
            <option value="crear">Crear</option>
            <option value="eliminar">Eliminar</option>
            <option value="crear_movimiento">Crear movimiento (CC)</option>
            <option value="intereses">Aplicar intereses (CC)</option>
            <option value="editar">Editar</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Válido hasta</label>
          <input
            name="fechaHasta"
            type="date"
            required
            defaultValue={defaultDate}
            min={new Date().toISOString().split("T")[0]}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-1 lg:col-span-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Notas (opcional)</label>
          <input
            name="notas"
            type="text"
            placeholder="Ej: Vacaciones Facu — semana del 02/06"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full px-4 py-2 bg-amber-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            {pending ? "Guardando..." : "Aplicar permiso temporal"}
          </button>
        </div>

        {state?.error && (
          <p className="col-span-full text-[11px] text-red-500 font-bold">{state.error}</p>
        )}
        {state?.ok && (
          <p className="col-span-full text-[11px] text-emerald-600 font-bold">Permiso temporal aplicado. Se revocará automáticamente al vencer la fecha.</p>
        )}
      </form>
    </div>
  );
}
