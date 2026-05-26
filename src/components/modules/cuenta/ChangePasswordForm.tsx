"use client";

import { useActionState } from "react";
import { changeOwnPassword } from "@/app/(dashboard)/configuracion/mi-cuenta/actions";

export function ChangePasswordForm({ mustChangePassword }: { mustChangePassword: boolean }) {
  const [state, formAction, pending] = useActionState(changeOwnPassword, null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-sm">
      {mustChangePassword && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700">
          Tu contraseña fue reseteada por un administrador. Elegí una nueva contraseña para continuar.
        </div>
      )}

      {state?.ok ? (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          Contraseña cambiada correctamente. Cerrá sesión y volvé a ingresar para actualizar tu acceso.
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 font-medium">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Contraseña actual
            </label>
            <input
              type="password"
              name="currentPassword"
              required
              autoComplete="current-password"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Nueva contraseña
            </label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Repetir nueva contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>
      )}
    </div>
  );
}
