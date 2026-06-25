"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { CategoriaHoldingInversion } from "@prisma/client";
import { writeAuditLog } from "@/lib/services/audit.service";
import { requireActionPermission } from "@/lib/auth/permissions";

type ActionResult = { error?: string; success?: boolean };

const CATEGORIAS: CategoriaHoldingInversion[] = ["BONO", "ON", "ACCION", "CEDEAR", "FCI", "CAUCION"];

function dec(raw: FormDataEntryValue | null, fallback = "0"): Decimal {
  try { return new Decimal(raw?.toString().trim() || fallback); } catch { return new Decimal(fallback); }
}

function revalidate(cuentaId: string, comitenteId: string) {
  revalidatePath("/cuentas-inversion");
  revalidatePath(`/cuentas-inversion/${cuentaId}`);
  revalidatePath(`/cuentas-inversion/${cuentaId}/comitentes/${comitenteId}`);
}

// ── Comprar ───────────────────────────────────────────────────────────────────

export async function comprarHolding(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireActionPermission("holdings:comprar");
  if (denied) return denied;

  const comitenteId  = formData.get("comitenteId")?.toString().trim();
  const cuentaId     = formData.get("cuentaInversionId")?.toString().trim();
  const ticker       = formData.get("ticker")?.toString().trim().toUpperCase();
  const descripcion  = formData.get("descripcion")?.toString().trim() || null;
  const categoriaRaw = formData.get("categoria")?.toString() as CategoriaHoldingInversion;
  const notas        = formData.get("notas")?.toString().trim() || null;

  if (!comitenteId || !cuentaId || !ticker) return { error: "Ticker requerido" };
  if (!CATEGORIAS.includes(categoriaRaw)) return { error: "Categoría inválida" };

  const cantidad    = dec(formData.get("cantidad"));
  const precio      = dec(formData.get("precio"));
  const fechaRaw    = formData.get("fechaCompra")?.toString().trim();
  const fechaCompra = fechaRaw ? new Date(fechaRaw) : null;

  if (cantidad.lte(0)) return { error: "La cantidad debe ser mayor a cero" };
  if (precio.lte(0))   return { error: "El precio debe ser mayor a cero" };

  await prisma.$transaction(async (tx) => {
    const existing = await tx.holdingComitenteInversion.findUnique({
      where: { comitenteId_ticker: { comitenteId, ticker } },
    });

    const efectiveCategoria = existing?.categoria ?? categoriaRaw;
    let holdingId: string;

    if (existing) {
      const totalQty = existing.cantidad.add(cantidad);
      const newPP    = existing.cantidad.mul(existing.precioPromedio).add(cantidad.mul(precio)).div(totalQty);
      const updated  = await tx.holdingComitenteInversion.update({
        where: { id: existing.id },
        data: {
          cantidad:       totalQty,
          precioPromedio: newPP,
          ...(descripcion ? { descripcion } : {}),
          ...(fechaCompra ? { fechaCompra } : {}),
        },
      });
      holdingId = updated.id;
    } else {
      const created = await tx.holdingComitenteInversion.create({
        data: { id: crypto.randomUUID(), comitenteId, ticker, descripcion, categoria: categoriaRaw, cantidad, precioPromedio: precio, fechaCompra, updatedAt: new Date() },
      });
      holdingId = created.id;
    }

    await tx.operacionHoldingInversion.create({
      data: {
        id: crypto.randomUUID(),
        comitenteId, holdingId, tipo: "COMPRA",
        ticker, categoria: efectiveCategoria,
        cantidad, precio, fecha: fechaCompra ?? new Date(), notas,
      },
    });
  });

  const session  = await auth();
  const userId   = session?.user?.id as string | undefined;
  const userName = (session?.user as { name?: string } | undefined)?.name ?? "Usuario";
  await writeAuditLog({
    userId,
    accion:     "ALTA_HOLDING",
    entidad:    "ComitenteInversion",
    entidadId:  comitenteId,
    description: `${userName} cargó holding ${ticker} ${cantidad.toFixed(4)} @ ${precio.toFixed(4)}`,
  });

  revalidate(cuentaId, comitenteId);
  return { success: true };
}

// ── Vender ────────────────────────────────────────────────────────────────────

export async function venderHolding(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireActionPermission("holdings:vender");
  if (denied) return denied;

  const holdingId   = formData.get("holdingId")?.toString().trim();
  const comitenteId = formData.get("comitenteId")?.toString().trim();
  const cuentaId    = formData.get("cuentaInversionId")?.toString().trim();

  if (!holdingId || !comitenteId || !cuentaId) return { error: "Datos requeridos incompletos" };

  const cantidad = dec(formData.get("cantidad"));
  const precio   = dec(formData.get("precio"));
  const notas    = formData.get("notas")?.toString().trim() || null;
  const fechaRaw = formData.get("fecha")?.toString().trim();
  const fecha    = fechaRaw ? new Date(fechaRaw) : new Date();

  if (cantidad.lte(0)) return { error: "La cantidad debe ser mayor a cero" };
  if (precio.lte(0))   return { error: "El precio debe ser mayor a cero" };

  // Holding se lee DENTRO de la transacción para evitar TOCTOU (overselling bajo concurrencia).
  let tickerVenta = "";
  try {
    await prisma.$transaction(async (tx) => {
      const holding = await tx.holdingComitenteInversion.findUnique({ where: { id: holdingId } });
      if (!holding) throw new Error("Holding no encontrado");
      if (cantidad.gt(holding.cantidad))
        throw new Error(`Cantidad insuficiente. Disponible: ${holding.cantidad.toFixed(6)}`);

      tickerVenta = holding.ticker;

      await tx.operacionHoldingInversion.create({
        data: {
          id: crypto.randomUUID(),
          comitenteId, holdingId, tipo: "VENTA",
          ticker: holding.ticker, categoria: holding.categoria,
          cantidad, precio,
          precioPromedio: holding.precioPromedio,
          fecha, notas,
        },
      });

      const newQty = holding.cantidad.sub(cantidad);
      if (newQty.eq(0)) {
        await tx.holdingComitenteInversion.delete({ where: { id: holdingId } });
      } else {
        await tx.holdingComitenteInversion.update({ where: { id: holdingId }, data: { cantidad: newQty } });
      }
    });
  } catch (e: unknown) {
    return { error: (e instanceof Error ? e.message : null) || "Error al registrar venta" };
  }

  const session  = await auth();
  const userId   = session?.user?.id as string | undefined;
  const userName = (session?.user as { name?: string } | undefined)?.name ?? "Usuario";
  await writeAuditLog({
    userId,
    accion:     "VENTA_HOLDING",
    entidad:    "ComitenteInversion",
    entidadId:  comitenteId,
    description: `${userName} registró venta ${tickerVenta} ${cantidad.toFixed(4)} @ ${precio.toFixed(4)}`,
  });

  revalidate(cuentaId, comitenteId);
  return { success: true };
}

// ── Editar ────────────────────────────────────────────────────────────────────

export async function editHolding(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireActionPermission("holdings:editar");
  if (denied) return denied;

  const holdingId   = formData.get("holdingId")?.toString().trim();
  const comitenteId = formData.get("comitenteId")?.toString().trim();
  const cuentaId    = formData.get("cuentaInversionId")?.toString().trim();

  if (!holdingId || !comitenteId || !cuentaId) return { error: "Datos requeridos incompletos" };

  const ticker       = formData.get("ticker")?.toString().trim().toUpperCase();
  const descripcion  = formData.get("descripcion")?.toString().trim() || null;
  const categoriaRaw = formData.get("categoria")?.toString() as CategoriaHoldingInversion;

  if (!ticker) return { error: "Ticker requerido" };
  if (!CATEGORIAS.includes(categoriaRaw)) return { error: "Categoría inválida" };

  const cantidad       = dec(formData.get("cantidad"));
  const precioPromedio = dec(formData.get("precioPromedio"));
  const paRaw          = formData.get("precioActual")?.toString().trim();
  const precioActual   = paRaw ? new Decimal(paRaw) : null;
  const fechaRaw       = formData.get("fechaCompra")?.toString().trim();
  const fechaCompra    = fechaRaw ? new Date(fechaRaw) : null;

  if (cantidad.lte(0)) return { error: "La cantidad debe ser mayor a cero" };

  const dup = await prisma.holdingComitenteInversion.findFirst({
    where: { comitenteId, ticker, id: { not: holdingId } },
  });
  if (dup) return { error: `Ya existe un holding con ticker ${ticker} para este comitente` };

  await prisma.holdingComitenteInversion.update({
    where: { id: holdingId },
    data: {
      ticker, descripcion, categoria: categoriaRaw, cantidad, precioPromedio, precioActual, fechaCompra,
      ...(precioActual != null
        ? { priceSource: "MANUAL" as const, priceStatus: "OK" as const, priceSyncedAt: new Date(), providerUpdatedAt: null, priceErrorMessage: null }
        : {}),
    },
  });

  revalidate(cuentaId, comitenteId);
  return { success: true };
}

// ── Actualizar precio por ticker (toda la cuenta) ────────────────────────────

export async function updatePreciosByTicker(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const cuentaId = formData.get("cuentaId")?.toString().trim();
  const ticker   = formData.get("ticker")?.toString().trim().toUpperCase();
  const paRaw    = formData.get("precioActual")?.toString().trim();

  if (!cuentaId || !ticker) return { error: "Datos requeridos" };
  if (!paRaw) return { error: "Precio requerido" };

  let precioActual: Decimal;
  try {
    precioActual = new Decimal(paRaw);
    if (precioActual.lt(0)) return { error: "El precio no puede ser negativo" };
  } catch {
    return { error: "Precio inválido" };
  }

  const comitentes = await prisma.comitenteInversion.findMany({
    where: { cuentaInversionId: cuentaId },
    select: { id: true },
  });
  const ids = comitentes.map((c) => c.id);

  await prisma.holdingComitenteInversion.updateMany({
    where: { comitenteId: { in: ids }, ticker },
    data: {
      precioActual,
      priceSource: "MANUAL",
      priceStatus: "OK",
      priceSyncedAt: new Date(),
      providerUpdatedAt: null,
      priceErrorMessage: null,
    },
  });

  revalidatePath("/cuentas-inversion", "layout");
  return { success: true };
}

// ── Eliminar ──────────────────────────────────────────────────────────────────

export async function deleteHolding(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireActionPermission("holdings:eliminar");
  if (denied) return denied;

  const holdingId   = formData.get("holdingId")?.toString().trim();
  const comitenteId = formData.get("comitenteId")?.toString().trim();
  const cuentaId    = formData.get("cuentaInversionId")?.toString().trim();

  if (!holdingId || !comitenteId || !cuentaId) return { error: "ID requerido" };

  const holding = await prisma.holdingComitenteInversion.findUnique({ where: { id: holdingId }, select: { ticker: true, cantidad: true } });
  if (!holding) return { error: "Holding no encontrado" };
  await prisma.holdingComitenteInversion.delete({ where: { id: holdingId } });

  const session  = await auth();
  const userId   = session?.user?.id as string | undefined;
  const userName = (session?.user as { name?: string } | undefined)?.name ?? "Usuario";
  await writeAuditLog({
    userId,
    accion:     "BAJA_HOLDING",
    entidad:    "ComitenteInversion",
    entidadId:  comitenteId,
    description: `${userName} eliminó holding ${holding?.ticker ?? holdingId.slice(0, 8)} (${holding ? Number(holding.cantidad).toFixed(4) : "—"} u.)`,
  });

  revalidate(cuentaId, comitenteId);
  return { success: true };
}
