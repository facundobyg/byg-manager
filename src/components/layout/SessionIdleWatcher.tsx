"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { logIdleTimeout } from "@/app/actions/session";

const IDLE_LIMIT   = 2 * 60 * 60 * 1000; // 2 hours
const WARN_BEFORE  = 5 * 60 * 1000;       // 5 minutes before timeout
const CHECK_EVERY  = 30 * 1000;           // poll every 30 seconds
const STORAGE_KEY  = "byg_last_activity";

function now() { return Date.now(); }

async function doSignOut() {
  try { await logIdleTimeout(); } catch { /* fire-and-forget */ }
  await signOut({ callbackUrl: "/login?reason=idle" });
}

export function SessionIdleWatcher() {
  const [showWarning, setShowWarning] = useState(false);
  const warningShownRef = useRef(false);
  const signingOutRef   = useRef(false);

  const resetActivity = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, String(now()));
    if (warningShownRef.current) {
      warningShownRef.current = false;
      setShowWarning(false);
    }
  }, []);

  useEffect(() => {
    // On mount: check if already idle from a previous tab/session
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && now() - Number(stored) >= IDLE_LIMIT) {
      doSignOut();
      return;
    }
    // Initialise timestamp if missing
    if (!stored) sessionStorage.setItem(STORAGE_KEY, String(now()));

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }));

    const interval = setInterval(() => {
      if (signingOutRef.current) return;
      const last   = Number(sessionStorage.getItem(STORAGE_KEY) ?? now());
      const idle   = now() - last;

      if (idle >= IDLE_LIMIT) {
        signingOutRef.current = true;
        doSignOut();
        return;
      }
      if (idle >= IDLE_LIMIT - WARN_BEFORE && !warningShownRef.current) {
        warningShownRef.current = true;
        setShowWarning(true);
      }
    }, CHECK_EVERY);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetActivity));
      clearInterval(interval);
    };
  }, [resetActivity]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-4 text-center">
        <div className="text-4xl">⏱️</div>
        <h2 className="text-lg font-black text-slate-900">Sesión por cerrarse</h2>
        <p className="text-sm text-slate-500">
          La sesión se cerrará por inactividad en menos de 5 minutos.
        </p>
        <button
          onClick={resetActivity}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Seguir conectado
        </button>
      </div>
    </div>
  );
}
