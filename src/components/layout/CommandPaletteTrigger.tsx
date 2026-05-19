"use client";

import { Search } from "lucide-react";

export function CommandPaletteTrigger() {
  function open() {
    window.dispatchEvent(new CustomEvent("byg:cmdpalette:open"));
  }

  return (
    <button
      onClick={open}
      className="flex items-center gap-3 w-72 h-9 px-3 rounded-xl bg-byg-bg border border-byg-border text-byg-muted text-sm hover:border-byg-border-2 hover:text-byg-text transition-colors"
    >
      <Search size={14} className="shrink-0" />
      <span className="flex-1 text-left text-[13px]">Buscar o ejecutar...</span>
      <kbd className="flex items-center gap-0.5 text-[10px] font-mono bg-byg-surface rounded px-1.5 py-0.5 border border-byg-border shrink-0">
        Ctrl K
      </kbd>
    </button>
  );
}
