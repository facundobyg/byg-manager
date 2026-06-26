import { NextResponse } from "next/server";
import { getData912AutoSyncEnabled } from "@/lib/services/config.service";
import { applyData912PriceSync } from "@/lib/services/data912-price-sync.service";
import { writeAuditLog } from "@/lib/services/audit.service";

// Disparado por Vercel Cron (ver vercel.json). Vercel agrega automáticamente
// el header Authorization: Bearer $CRON_SECRET en sus requests de cron — acá
// solo lo validamos. Nunca loguear el secret ni el header recibido.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = await getData912AutoSyncEnabled();
  if (!enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "disabled" });
  }

  try {
    const result = await applyData912PriceSync({ dryRun: false });

    await writeAuditLog({
      accion: "DATA912_CRON_SYNC",
      entidad: "Activo",
      description: `Cron Data912: ${result.summary.updatedActivos} activos, ${result.summary.updatedHoldings} holdings, ${result.summary.markedNotFound} no encontrados, ${result.summary.markedProviderError} errores de proveedor, ${result.summary.failedWrites} fallidos`,
    });

    return NextResponse.json({ ok: true, skipped: false, summary: result.summary });
  } catch (e) {
    await writeAuditLog({
      accion: "DATA912_CRON_ERROR",
      entidad: "Activo",
      description: e instanceof Error ? e.message : "Error desconocido en cron Data912",
    });
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500 });
  }
}
