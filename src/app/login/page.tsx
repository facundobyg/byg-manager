"use client";
import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { authenticate } from "./actions";

const INPUT_CLS =
  "w-full rounded-xl border border-byg-border bg-byg-bg px-4 py-3 text-sm text-byg-text placeholder:text-byg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(authenticate, undefined);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const totpRef = useRef<HTMLInputElement>(null);

  const needsTwoFactor = state?.needsTwoFactor === true;
  const errorMsg       = state?.error;

  useEffect(() => {
    if (needsTwoFactor) totpRef.current?.focus();
  }, [needsTwoFactor]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-byg-bg">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex justify-center mb-5">
          <img src="/brand/bg-logo-light.png" alt="BG Advisors" className="w-[280px] h-[72px] object-cover object-center dark:hidden" />
          <img src="/brand/bg-logo-dark.png"  alt="BG Advisors" className="w-[280px] h-[72px] object-cover object-center hidden dark:block" />
        </div>

        <form action={formAction} className="rounded-2xl bg-byg-surface border border-byg-border p-6 shadow-lg">
          {needsTwoFactor ? (
            /* ── Paso 2: código TOTP ── */
            <>
              <input type="hidden" name="email"    value={email} />
              <input type="hidden" name="password" value={password} />
              <div className="flex flex-col gap-3">
                <p className="text-xs text-byg-muted text-center">
                  Ingresá el código de tu autenticador
                </p>
                <input
                  ref={totpRef}
                  name="totpCode"
                  type="text"
                  placeholder="000000"
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className={`${INPUT_CLS} text-center tracking-[0.4em] text-lg font-mono`}
                />
              </div>
            </>
          ) : (
            /* ── Paso 1: email + password ── */
            <div className="flex flex-col gap-3">
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLS}
              />
              <input
                name="password"
                type="password"
                placeholder="Contraseña"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          )}

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
            {isPending
              ? "Validando..."
              : needsTwoFactor
              ? "Verificar código"
              : "Ingresar"}
          </button>
        </form>

      </div>
    </div>
  );
}
