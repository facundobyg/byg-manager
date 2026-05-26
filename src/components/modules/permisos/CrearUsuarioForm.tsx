"use client";

import { useActionState, useState } from "react";
import { createUser } from "@/app/(dashboard)/permisos/actions";
import { ChevronDown, UserPlus, X } from "lucide-react";

export function CrearUsuarioForm() {
  const [state, action, pending] = useActionState(createUser, null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
      >
        <UserPlus size={14} />
        Nuevo usuario
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/40 flex items-center justify-between">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">Crear usuario</h3>
        <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
          <X size={14} />
        </button>
      </div>
      <form action={action} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Nombre completo</label>
          <input
            name="nombre"
            required
            placeholder="Ej: Juan Pérez"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="usuario@ejemplo.com"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Contraseña temporal</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Mín. 8 caracteres"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Rol</label>
          <div className="relative">
            <select
              name="role"
              defaultValue="EMPLEADO"
              className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white pr-8"
            >
              <option value="ADMIN">Admin</option>
              <option value="SOCIO">Socio</option>
              <option value="EMPLEADO">Empleado</option>
              <option value="CLIENTE">Cliente</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Estado</label>
          <div className="relative">
            <select
              name="activo"
              defaultValue="true"
              className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white pr-8"
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full px-4 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {pending ? "Creando..." : "Crear usuario"}
          </button>
        </div>
        {state?.error && (
          <p className="col-span-full text-[11px] text-red-500 font-bold">{state.error}</p>
        )}
        {state?.ok && (
          <p className="col-span-full text-[11px] text-emerald-600 font-bold">Usuario creado correctamente.</p>
        )}
      </form>
    </div>
  );
}
