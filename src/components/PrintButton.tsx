"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors"
    >
      <Printer size={14} />
      Imprimir / Guardar PDF
    </button>
  );
}
