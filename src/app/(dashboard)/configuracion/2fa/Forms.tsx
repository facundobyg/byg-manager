"use client";

import { useActionState } from "react";
import { confirmEnable2FA, disable2FA } from "./actions";

const INPUT_CLS =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 text-center tracking-[0.4em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors";

export function SetupConfirmForm({ qrDataUrl }: { qrDataUrl: string }) {
  const [state, formAction, isPending] = useActionState(confirmEnable2FA, null);
  const done = state && "success" in state;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR Code 2FA" className="w-48 h-48 rounded-xl border border-slate-200 p-1" />
        <p className="text-xs text-slate-500 text-center max-w-[240px]">
          Escaneá con <strong>Google Authenticator</strong> o <strong>Authy</strong>
        </p>
      </div>

      {!done ? (
        <form action={formAction} className="flex flex-col gap-3">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Ingresá el código para confirmar
          </label>
          <input
            name="code"
            type="text"
            placeholder="000000"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoFocus
            className={INPUT_CLS}
          />
          {state && "error" in state && (
            <p className="text-rose-500 text-sm text-center">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-blue-600 py-2.5 text-sm text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? "Verificando..." : "Activar 2FA"}
          </button>
        </form>
      ) : (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium text-center">
          2FA activado correctamente. Recargá la página para ver el estado actualizado.
        </div>
      )}
    </div>
  );
}

export function DisableForm() {
  const [state, formAction, isPending] = useActionState(disable2FA, null);
  const done = state && "success" in state;

  if (done) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 font-medium text-center">
        2FA desactivado. Recargá la página para ver el estado actualizado.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        Verificá identidad con código actual
      </label>
      <input
        name="code"
        type="text"
        placeholder="000000"
        required
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        className={INPUT_CLS}
      />
      {state && "error" in state && (
        <p className="text-rose-500 text-sm text-center">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-red-600 py-2.5 text-sm text-white font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
      >
        {isPending ? "Verificando..." : "Desactivar 2FA"}
      </button>
    </form>
  );
}
