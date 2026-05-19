"use client";

import { useEffect, useState } from "react";

export function PageLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let pct = 0;
    const tick = setInterval(() => {
      pct += Math.random() * 3 + 1;
      if (pct >= 95) {
        pct = 95;
        clearInterval(tick);
        setTimeout(() => setProgress(100), 600);
      }
      setProgress(Math.round(pct));
    }, 80);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-byg-bg">
      <div className="relative flex items-center justify-center">
        {/* Spinner ring */}
        <svg
          className="animate-spin text-blue-500"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            strokeOpacity="0.15"
          />
          <path
            d="M32 4a28 28 0 0 1 28 28"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>

        {/* Centered brand icon — adapts to theme */}
        <img
          src="/brand/bg-icon-light.png"
          alt="BYG"
          className="absolute h-7 w-7 object-contain dark:hidden"
        />
        <img
          src="/brand/bg-icon-dark.png"
          alt="BYG"
          className="absolute h-7 w-7 object-contain hidden dark:block"
        />
      </div>

      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-byg-muted">
        Cargando
      </p>

      {/* Progress bar */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <div className="w-36 h-0.5 rounded-full bg-blue-200 dark:bg-byg-surface-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[9px] font-mono tabular-nums text-byg-muted">
          {progress}%
        </span>
      </div>
    </div>
  );
}
