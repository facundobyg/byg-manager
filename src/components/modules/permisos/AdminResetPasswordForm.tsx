"use client";

import { useActionState } from "react";
import { adminResetPassword } from "@/app/(dashboard)/permisos/actions";

export function AdminResetPasswordForm({
  users,
}: {
  users: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(adminResetPassword, null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
        Reset contraseña de usuario
      </h3>

      {state?.ok ? (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          Contraseña reseteada. El usuario deberá cambiarla en su próximo ingreso.
        </div>
      ) : (
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

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Nueva contraseña temporal
            </label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Confirmar contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              placeholder="Repetir contraseña"
              autoComplete="new-password"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-lg bg-slate-900 px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {pending ? "Reseteando…" : "Resetear contraseña"}
          </button>
        </form>
      )}
    </div>
  );
}
