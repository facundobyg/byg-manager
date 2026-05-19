"use client";

type Row = {
  clienteNombre: string;
  ccSaldo: number;
  plazosFijos: number;
  custodia: number;
  exposicionTotal: number;
  estado: string;
};

export function ExportCsvButton({ rows }: { rows: Row[] }) {
  function handleExport() {
    const header = "Cliente,CC,PF,Custodia,Exposicion,Estado";
    const lines = rows.map((r) =>
      [
        `"${r.clienteNombre.replace(/"/g, '""')}"`,
        r.ccSaldo.toFixed(2),
        r.plazosFijos.toFixed(2),
        r.custodia.toFixed(2),
        r.exposicionTotal.toFixed(2),
        r.estado,
      ].join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exposicion-clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
    >
      Exportar CSV
    </button>
  );
}
