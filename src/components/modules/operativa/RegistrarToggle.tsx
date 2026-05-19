"use client";

import { useState, ReactNode } from "react";
import { Plus, X } from "lucide-react";

export function RegistrarToggle({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="border-t border-byg-border pt-6">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-byg-accent text-white hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus size={14} />
          {label}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-byg-bg/70 backdrop-blur-[12px]">
          <div className="bg-byg-surface rounded-2xl shadow-2xl w-full max-w-5xl border border-byg-border max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-byg-border shrink-0">
              <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">{label}</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-byg-surface-2 transition-colors"
              >
                <X size={16} className="text-byg-muted hover:text-byg-text" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
