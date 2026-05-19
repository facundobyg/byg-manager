"use client";

import { Download } from "lucide-react";

export function CsvDownloadButton({ csv, filename }: { csv: string; filename: string }) {
  function download() {
    const bom  = "﻿"; // UTF-8 BOM — Excel lo reconoce correctamente
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-sm"
    >
      <Download size={12} />
      Exportar CSV
    </button>
  );
}
