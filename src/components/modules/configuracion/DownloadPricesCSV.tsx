"use client";

import { Download } from "lucide-react";
import { formatearNumeroAR } from "@/lib/numero-ar";

type Props = {
  data: {
    ticker: string;
    descripcion: string | null;
    categoria: string;
    monedaPrecio: string;
    /** Precio canónico ("1.707824") o null. Se exporta en formato argentino. */
    precioActual: string | null;
  }[];
};

export function DownloadPricesCSV({ data }: Props) {
  const download = () => {
    const headers = ["ticker", "descripcion", "categoria", "monedaPrecio", "precioActual", "nuevoPrecio"];
    const rows = data.map((r) => [
      r.ticker,
      r.descripcion || "",
      r.categoria,
      r.monedaPrecio,
      r.precioActual ? formatearNumeroAR(r.precioActual) : "", // informativo: el import lo IGNORA
      "", // nuevoPrecio: única columna que el import aplica (formato argentino)
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => cell.toString().includes(";") ? `"${cell.toString().replace(/"/g, '""')}"` : cell.toString()).join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `precios-activos.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={download}
      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-sm"
    >
      <Download size={14} />
      Descargar Excel de precios
    </button>
  );
}
