"use client";

import { useActionState, useState } from "react";
import { updateOwnProfile } from "@/app/(dashboard)/configuracion/mi-cuenta/actions";
import { UserAvatar } from "./UserAvatar";

const ROLE_LABEL: Record<string, string> = {
  ADMIN:    "Administrador",
  SOCIO:    "Socio",
  EMPLEADO: "Empleado",
  CLIENTE:  "Cliente",
};

export function ProfileForm({
  user,
}: {
  user: {
    name: string;
    email: string;
    role: string;
    image: string | null;
    phone: string | null;
    cargo: string | null;
    ubicacion: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateOwnProfile, null);
  const [imagePreview, setImagePreview] = useState(user.image ?? "");
  const [namePreview, setNamePreview] = useState(user.name);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-lg">
      {state?.ok && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          Perfil actualizado correctamente.
        </div>
      )}
      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 font-medium">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        {/* Avatar preview + URL */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-byg-accent/10 flex items-center justify-center shrink-0 border border-slate-200">
            <UserAvatar image={imagePreview || null} name={namePreview} iconSize={24} />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              URL foto de perfil <span className="text-slate-300 normal-case font-medium">(opcional)</span>
            </label>
            <input
              type="url"
              name="image"
              defaultValue={user.image ?? ""}
              onChange={(e) => setImagePreview(e.target.value)}
              placeholder="https://..."
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Nombre visible
          </label>
          <input
            type="text"
            name="name"
            defaultValue={user.name}
            required
            onChange={(e) => setNamePreview(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email — solo lectura */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Email <span className="text-slate-300 normal-case font-medium">(solo lectura)</span>
          </label>
          <input
            type="email"
            value={user.email}
            readOnly
            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>

        {/* Rol — solo lectura */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Rol <span className="text-slate-300 normal-case font-medium">(solo lectura)</span>
          </label>
          <input
            type="text"
            value={ROLE_LABEL[user.role] ?? user.role}
            readOnly
            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>

        {/* Teléfono */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Teléfono <span className="text-slate-300 normal-case font-medium">(opcional)</span>
          </label>
          <input
            type="tel"
            name="phone"
            defaultValue={user.phone ?? ""}
            placeholder="+54 9 11 ..."
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Cargo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Cargo / Posición <span className="text-slate-300 normal-case font-medium">(opcional)</span>
          </label>
          <input
            type="text"
            name="cargo"
            defaultValue={user.cargo ?? ""}
            placeholder="Ej: Asesor financiero"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sede */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Sede / Ubicación <span className="text-slate-300 normal-case font-medium">(opcional)</span>
          </label>
          <input
            type="text"
            name="ubicacion"
            defaultValue={user.ubicacion ?? ""}
            placeholder="Ej: Trenque Lauquen"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg bg-slate-900 px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar perfil"}
        </button>
      </form>
    </div>
  );
}
