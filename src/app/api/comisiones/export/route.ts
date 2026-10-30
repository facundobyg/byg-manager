import { getResumenComisiones } from "@/lib/data/comisiones";
import { requireActionPermission } from "@/lib/auth/permissions";

export async function GET(request: Request) {
  // Misma política que las Server Actions: usuario en DB, activo, 2FA, permiso.
  // (El middleware excluye /api, así que este guard es la única barrera.)
  const denied = await requireActionPermission("comisiones:gestionar", { mode: "read" });
  if (denied) return new Response(denied.error, { status: 403 });

  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes") ?? new Date().toISOString().slice(0, 7);
  const productorId = searchParams.get("productorId") ?? null;

  const data = await getResumenComisiones(mes);
  const filtered = productorId ? data.filter((d) => d.productor.id === productorId) : data;

  const BOM = "﻿"; // UTF-8 BOM for Excel compatibility
  const headers = ["Fecha", "Cliente", "Operación", "Módulo", "Productor", "Base USD", "% Comisión", "Comisión Productor USD", "Estado"];

  const rows: string[] = [BOM + headers.join(";")];

  for (const d of filtered) {
    for (const l of d.lineas) {
      rows.push(
        [
          new Date(l.fecha).toISOString().slice(0, 10),
          `"${l.clienteNombre.replace(/"/g, '""')}"`,
          `"${l.descripcion.replace(/"/g, '""')}"`,
          l.modulo,
          d.productor.nombre,
          l.baseTotalUSD.toFixed(2).replace(".", ","),
          d.productor.porcentaje.toFixed(2).replace(".", ","),
          l.comisionProductorUSD.toFixed(2).replace(".", ","),
          d.estado,
        ].join(";"),
      );
    }
  }

  const filename = productorId
    ? `comisiones-${mes}-${filtered[0]?.productor.nombre ?? "productor"}.csv`
    : `comisiones-${mes}.csv`;

  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
