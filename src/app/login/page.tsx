"use client"
import { useActionState } from "react";
import { authenticate } from "./actions";

export default function LoginPage() {
  const [errorMsg, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-byg-bg">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex justify-center mb-5">
          <img src="/brand/bg-logo-light.png" alt="BG Advisors" className="w-[280px] h-[72px] object-cover object-center dark:hidden" />
          <img src="/brand/bg-logo-dark.png"  alt="BG Advisors" className="w-[280px] h-[72px] object-cover object-center hidden dark:block" />
        </div>

        {/* Form card */}
        <form
          action={formAction}
          className="rounded-2xl bg-byg-surface border border-byg-border p-6 shadow-lg"
        >
          <div className="flex flex-col gap-3">
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-byg-border bg-byg-bg px-4 py-3 text-sm text-byg-text placeholder:text-byg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-byg-border bg-byg-bg px-4 py-3 text-sm text-byg-text placeholder:text-byg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
          </div>

          {errorMsg && (
            <p className="mt-3 text-center text-rose-500 dark:text-rose-400 text-sm font-medium">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Validando..." : "Ingresar"}
          </button>
        </form>

      </div>
    </div>
  );
}
