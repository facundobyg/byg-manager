"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/services/audit.service";
import { buildSnapshotData } from "@/lib/data/cierres";
import { getLastTcMep } from "@/lib/services/config.service";

type ActionResult = { success: true } | { error: string };

async function getAdminUser() {
  const session = await auth() as { user?: { id?: string; role?: string } } | null;
  if (session?.user?.role !== "ADMIN") redirect("/");
  if (!session.user?.id) redirect("/login");
  return session.user as { id: string; role: string };
}

export async function cerrarMes(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user  = await getAdminUser();
  const mes   = ((formData.get("mes") as string) ?? "").trim();
  const notas = ((formData.get("notas") as string) ?? "").trim() || null;

  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return { error: "Mes inválido." };

  const existing = await prisma.cierreMensual.findUnique({ where: { mes } });
  if (existing?.estado === "CERRADO") return { error: "El mes ya está cerrado." };

  const [snapshotData, tcMepRecord] = await Promise.all([
    buildSnapshotData(mes),
    getLastTcMep(),
  ]);

  const [y, m] = mes.split("-").map(Number);
  const snapJson = JSON.parse(JSON.stringify(snapshotData));

  await prisma.$transaction(async (tx) => {
    let cierreId: string;

    if (existing) {
      cierreId = existing.id;
      await tx.cierreMensual.update({
        where: { mes },
        data: {
          estado:      "CERRADO",
          fechaCierre: new Date(),
          userId:      user.id,
          notas:       notas ?? existing.notas,
          tcBlue:      snapshotData.utilidad.tcBlue,
          tcMep:       tcMepRecord ? Number(tcMepRecord.valor) : null,
          snapshotData: snapJson,
        },
      });
    } else {
      cierreId = crypto.randomUUID();
      await tx.cierreMensual.create({
        data: {
          id:          cierreId,
          anio:        y,
          mes,
          estado:      "CERRADO",
          fechaCierre: new Date(),
          userId:      user.id,
          notas,
          tcBlue:      snapshotData.utilidad.tcBlue,
          tcMep:       tcMepRecord ? Number(tcMepRecord.valor) : null,
          snapshotData: snapJson,
        },
      });
    }

    // Rebuild snapshot rows
    await tx.snapshotMensual.deleteMany({ where: { cierreMensualId: cierreId } });

    const rows: {
      id: string;
      cierreMensualId: string;
      categoria: string;
      descripcion?: string;
      moneda: string;
      valorARS?: number | null;
      valorUSD?: number | null;
      metadata?: Prisma.InputJsonValue;
    }[] = [];

    // Utilidad
    rows.push({ id: crypto.randomUUID(), cierreMensualId: cierreId, categoria: "utilidad", descripcion: "Utilidad total", moneda: "USD", valorUSD: snapshotData.utilidad.utilidadTotalUSD, valorARS: null });
    rows.push({ id: crypto.randomUUID(), cierreMensualId: cierreId, categoria: "utilidad", descripcion: "Cambio FX", moneda: "USD", valorUSD: snapshotData.utilidad.cambioUSD, valorARS: null });
    rows.push({ id: crypto.randomUUID(), cierreMensualId: cierreId, categoria: "utilidad", descripcion: "Arbitrajes ARS", moneda: "ARS", valorUSD: null, valorARS: snapshotData.utilidad.arbitrajesARS });
    rows.push({ id: crypto.randomUUID(), cierreMensualId: cierreId, categoria: "utilidad", descripcion: "Ingresos ARS", moneda: "ARS", valorUSD: null, valorARS: snapshotData.utilidad.ingresosARS });
    rows.push({ id: crypto.randomUUID(), cierreMensualId: cierreId, categoria: "utilidad", descripcion: "Egresos ARS", moneda: "ARS", valorUSD: null, valorARS: snapshotData.utilidad.egresosARS });

    // Apertura
    for (const [desc, val, mon] of [
      ["Caja USD disponible",   snapshotData.apertura.usdDisponible,  "USD"],
      ["Cartera USD",           snapshotData.apertura.usdActivos,     "USD"],
      ["Apertura USD neto BYG", snapshotData.apertura.usdNeto,        "USD"],
      ["Deuda USD clientes",    snapshotData.apertura.usdDeuda,       "USD"],
      ["ARS neto BYG",          snapshotData.apertura.arsNeto,        "ARS"],
      ["PF clientes USD",       snapshotData.apertura.pfClientesUSD,  "USD"],
      ["PF clientes ARS",       snapshotData.apertura.pfClientesARS,  "ARS"],
      ["Custodia USD",          snapshotData.apertura.custodiaUSD,    "USD"],
    ] as [string, number, string][]) {
      rows.push({
        id: crypto.randomUUID(), cierreMensualId: cierreId,
        categoria: "apertura", descripcion: desc, moneda: mon,
        valorUSD: mon === "USD" ? val : null,
        valorARS: mon === "ARS" ? val : null,
      });
    }

    // Comisiones
    for (const c of snapshotData.comisiones) {
      rows.push({
        id: crypto.randomUUID(), cierreMensualId: cierreId,
        categoria: "comision", descripcion: c.productor.nombre,
        moneda: "USD", valorUSD: c.totalComisionUSD, valorARS: null,
        metadata: JSON.parse(JSON.stringify({ productorId: c.productor.id, estado: c.estado, lineasCount: c.lineasCount })) as Prisma.InputJsonValue,
      });
    }

    await tx.snapshotMensual.createMany({ data: rows });
  });

  await Promise.all([
    writeAuditLog({ userId: user.id, accion: "CLOSE_MONTH", entidad: "CierreMensual", entidadId: mes, description: `Mes cerrado: ${mes} · TC Blue: ${snapshotData.utilidad.tcBlue}` }),
    writeAuditLog({ userId: user.id, accion: "SNAPSHOT_CREATED", entidad: "SnapshotMensual", entidadId: mes, description: `Snapshot generado para mes: ${mes}` }),
  ]);

  revalidatePath("/cierres");
  revalidatePath("/reportes/mensual");
  return { success: true };
}

export async function reabrirMes(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getAdminUser();
  const mes  = ((formData.get("mes") as string) ?? "").trim();
  if (!mes) return { error: "Mes inválido." };

  const existing = await prisma.cierreMensual.findUnique({ where: { mes } });
  if (!existing || existing.estado !== "CERRADO") return { error: "El mes no está cerrado." };

  await prisma.cierreMensual.update({
    where: { mes },
    data: { estado: "REABIERTO" },
  });

  await writeAuditLog({ userId: user.id, accion: "REOPEN_MONTH", entidad: "CierreMensual", entidadId: mes, description: `Mes reabierto: ${mes}` });

  revalidatePath("/cierres");
  revalidatePath("/reportes/mensual");
  return { success: true };
}
