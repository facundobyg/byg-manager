"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import type { AppNotification } from "@/lib/data/notifications";

const SEVERITY_DOT: Record<AppNotification["severity"], string> = {
  error:   "bg-red-500",
  warning: "bg-amber-500",
  info:    "bg-blue-500",
};

export function NotificationsDropdown({ notifications }: { notifications: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const total = notifications.length;
  const hasError = notifications.some((n) => n.severity === "error");
  const hasWarning = notifications.some((n) => n.severity === "warning");
  const badgeBg = hasError ? "bg-red-500" : hasWarning ? "bg-amber-500" : "bg-blue-500";

  const groups = Array.from(new Set(notifications.map((n) => n.group)));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notificaciones"
        className="relative rounded-lg p-2 text-byg-muted transition-colors hover:bg-[var(--byg-nav-hover)] hover:text-byg-text"
      >
        <Bell size={18} />
        {total > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${badgeBg}`}
          >
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-byg-border bg-byg-surface shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-byg-border">
            <div>
              <p className="text-sm font-semibold text-byg-text">Notificaciones</p>
              <p className="text-xs text-byg-muted">
                {total === 0 ? "Sin alertas" : `${total} alerta${total > 1 ? "s" : ""} activa${total > 1 ? "s" : ""}`}
              </p>
            </div>
            {total > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${badgeBg}`}>
                {total}
              </span>
            )}
          </div>

          {/* Body */}
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Bell size={24} className="text-byg-border mb-2" />
              <p className="text-sm font-medium text-byg-muted">Sin alertas operativas</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {groups.map((group) => (
                <div key={group}>
                  <div className="sticky top-0 bg-byg-surface-2 px-4 py-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-byg-muted">
                      {group}
                    </span>
                  </div>
                  {notifications
                    .filter((n) => n.group === group)
                    .map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 border-b border-byg-border/50 last:border-0 hover:bg-byg-surface-2 transition-colors"
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[n.severity]}`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-byg-text leading-snug">{n.title}</p>
                          <p className="text-xs text-byg-muted mt-0.5 leading-snug">{n.description}</p>
                        </div>
                      </Link>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
