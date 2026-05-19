"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  title:       string;
  accentColor?: string;
  maxWidth?:   string;
  onClose:     () => void;
  children:    React.ReactNode;
};

export function Modal({
  title,
  accentColor = "text-byg-text",
  maxWidth    = "max-w-md",
  onClose,
  children,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-byg-bg/70 backdrop-blur-[12px]" onClick={onClose} />
      <div className={`relative z-10 w-full ${maxWidth} bg-byg-surface rounded-2xl shadow-2xl overflow-hidden border border-byg-border`}>
        <div className="px-5 py-3.5 border-b border-byg-border bg-byg-bg/40 flex items-center justify-between">
          <p className={`text-[11px] font-black uppercase tracking-widest ${accentColor}`}>{title}</p>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-byg-muted hover:text-byg-text hover:bg-byg-surface-2 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
