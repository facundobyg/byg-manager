"use client";

import { useActionState, useState } from "react";
import { adminUpdateUserProfile } from "@/app/(dashboard)/permisos/actions";
import { AvatarUploadField } from "@/components/modules/cuenta/AvatarUploadField";

export function AdminEditUserForm({
  users,
}: {
  users: { id: string; name: string; email: string; activo: boolean; image: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(adminUpdateUserProfile, null);
  const [selected, setSelected] = useState<typeof users[number] | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function handleUserSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const u = users.find((u) => u.id === e.target.value) ?? null;
    setSelected(u);
    setImagePreview(u?.image ?? null);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
        Editar datos de usuario
      </h3>

      {state?.ok && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          Usuario actualizado correctamente.
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-3 max-w-sm">
        {state?.error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 font-medium">
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Usuario
          </label>
          <select
            name="userId"
            required
            onChange={handleUserSelect}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Seleccioná un usuario —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <>
            <AvatarUploadField
              name="image"
              value={imagePreview}
              onChange={setImagePreview}
              previewName={selected.name}
              size="sm"
            />

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                defaultValue={selected.name}
                required
                key={`name-${selected.id}`}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Email
              </label>
              <input
                type="email"
                name="email"
                defaultValue={selected.email}
                required
                key={`email-${selected.id}`}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Estado
              </label>
              <select
                name="activo"
                defaultValue={selected.activo ? "true" : "false"}
                key={`activo-${selected.id}`}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="self-start rounded-lg bg-slate-900 px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {pending ? "Guardando…" : "Guardar cambios"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
