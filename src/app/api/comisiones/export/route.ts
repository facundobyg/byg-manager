import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { getResumenComisiones } from "@/lib/data/comisiones";

export async function GET(request: Request) {
  const session = await auth();
  const role = (session?.user as { role?: UserRole })?.role;
  if (!session?.user || !["ADMIN", "SOCIO"].includes(role ?? "")) {
    return new Response("Unauthorized", { status: 401 });
  }

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
