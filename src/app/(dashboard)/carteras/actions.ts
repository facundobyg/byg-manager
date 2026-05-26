"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { CategoriaActivo, Moneda } from "@prisma/client";
import { auth } from "@/auth";
import { requireActionPermission } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/services/audit.service";

export async function updateSaldosCartera(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const carteraId = formData.get("carteraId")?.toString().trim();
  const slug      = formData.get("slug")?.toString().trim();
  if (!carteraId || !slug) return { error: "Datos requeridos" };

  let saldoPesos: Decimal, saldoUSDCable: Decimal, saldoUSDMep: Decimal;
  try {
    saldoPesos    = new Decimal(formData.get("saldoPesos")?.toString().replace(",", ".") || "0");
    saldoUSDCable = new Decimal(formData.get("saldoUSDCable")?.toString().replace(",", ".") || "0");
    saldoUSDMep   = new Decimal(formData.get("saldoUSDMep")?.toString().replace(",", ".") || "0");
  } catch {
    return { error: "Valores inválidos" };
  }

  try {
    await prisma.cartera.update({
      where: { id: carteraId },
      data: { saldoPesos, saldoUSDCable, saldoUSDMep, updatedAt: new Date() },
    });
    revalidatePath(`/carteras/${slug}`);
    return { ok: true };
  } catch {
    return { error: "Error al actualizar saldos" };
  }
}

type ActionResult = { success: true } | { error: string };

function revalidateCartera(slug?: string) {
  revalidatePath("/carteras");
  if (slug) revalidatePath(`/carteras/${slug}`);
}

// ─── 1. Agregar / acumular posición ──────────────────────────────────────────
// Creates Activo if it doesn't exist. If same ticker already in cartera,
// recalculates weighted average purchase price.

export async function agregarPosicion(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const carteraId    = formData.get("carteraId")?.toString().trim();
  const ticker       = formData.get("ticker")?.toString().trim().toUpperCase();
  const descripcion  = formData.get("descripcion")?.toString().trim() || null;
  const categoriaRaw = formData.get("categoria")?.toString().trim();
  const cantidadRaw  = formData.get("cantidad")?.toString().replace(",", ".");
  const precioRaw    = formData.get("precioCompra")?.toString().replace(",", ".");
  const fechaRaw     = formData.get("fecha")?.toString();
  const monedaRaw    = (formData.get("monedaPrecio")?.toString() || "USD") as Moneda;
  const carteraSlug  = formData.get("carteraSlug")?.toString();

  if (!carteraId || !ticker || !categoriaRaw || !cantidadRaw || !precioRaw) {
    return { error: "Faltan campos obligatorios" };
  }

  const categoria = categoriaRaw as CategoriaActivo;
  let cantidad: Decimal;
  let precio: Decimal;

  try {
    cantidad = new Decimal(cantidadRaw);
    precio   = new Decimal(precioRaw);
  } catch {
    return { error: "Cantidad o precio inválidos" };
  }

  if (cantidad.lte(0)) return { error: "La cantidad debe ser mayor a cero" };
  if (precio.lte(0))   return { error: "El precio debe ser mayor a cero" };

  const fecha = fechaRaw
    ? new Date(fechaRaw + "T00:00:00Z")
    : new Date(new Date().toISOString().split("T")[0] + "T00:00:00Z");

  try {
    // Find or create Activo — ticker is the unique key
    let activo = await prisma.activo.findUnique({ where: { ticker } });
    if (!activo) {
      activo = await prisma.activo.create({
        data: { id: crypto.randomUUID(), ticker, descripcion, categoria, monedaPrecio: monedaRaw, updatedAt: new Date() },
      });
    }

    // Upsert position with weighted average price recalculation
    const existing = await prisma.posicionCartera.findUnique({
      where: { carteraId_activoId: { carteraId, activoId: activo.id } },
    });

    if (existing) {
      const qtyExist  = new Decimal(existing.cantidad.toString());
      const pcExist   = new Decimal(existing.precioCompra.toString());
      const totalQty  = qtyExist.plus(cantidad);
      const totalCost = qtyExist.mul(pcExist).plus(cantidad.mul(precio));
      const nuevoPrecio = totalCost.div(totalQty);

      await prisma.posicionCartera.update({
        where: { id: existing.id },
        data: { cantidad: totalQty, precioCompra: nuevoPrecio },
      });
    } else {
      await prisma.posicionCartera.create({
        data: { id: crypto.randomUUID(), carteraId, activoId: activo.id, cantidad, precioCompra: precio, fecha, updatedAt: new Date() },
      });
    }

    revalidateCartera(carteraSlug);
    return { success: true };
  } catch (e) {
    console.error("agregarPosicion:", e);
    return { error: "Error al registrar la posición" };
  }
}

// ─── 2. Editar posición ───────────────────────────────────────────────────────

export async function editarPosicion(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const posicionId  = formData.get("posicionId")?.toString().trim();
  const cantidadRaw = formData.get("cantidad")?.toString().replace(",", ".");
  const precioRaw   = formData.get("precioCompra")?.toString().replace(",", ".");
  const fechaRaw    = formData.get("fecha")?.toString();
  const carteraSlug = formData.get("carteraSlug")?.toString();

  if (!posicionId) return { error: "ID de posición requerido" };

  const data: Record<string, Decimal | Date> = {};

  if (cantidadRaw) {
    const cantidad = new Decimal(cantidadRaw);
    if (cantidad.lte(0)) return { error: "La cantidad debe ser mayor a cero" };
    data.cantidad = cantidad;
  }

  if (precioRaw) {
    const precio = new Decimal(precioRaw);
    if (precio.lte(0)) return { error: "El precio debe ser mayor a cero" };
    data.precioCompra = precio;
  }

  if (fechaRaw) {
    data.fecha = new Date(fechaRaw + "T00:00:00Z");
  }

  if (Object.keys(data).length === 0) return { error: "Nada para actualizar" };

  try {
    const session = await auth();
    const userId  = session?.user?.id as string | undefined;
    const updated = await prisma.posicionCartera.update({ where: { id: posicionId }, data, include: { Activo: { select: { ticker: true } } } });
    if (userId) {
      await writeAuditLog({
        userId,
        accion:      "EDICION",
        entidad:     "PosicionCartera",
        entidadId:   posicionId,
        description: `Edición posición ${updated.Activo.ticker}: ${Object.keys(data).join(", ")}`,
      });
    }
    revalidateCartera(carteraSlug);
    return { success: true };
  } catch (e) {
    console.error("editarPosicion:", e);
    return { error: "Error al editar la posición" };
  }
}

// ─── 3. Cambiar categoría de activo ──────────────────────────────────────────

export async function cambiarCategoriaActivo(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const activoId     = formData.get("activoId")?.toString().trim();
  const categoriaRaw = formData.get("categoria")?.toString().trim();
  const carteraSlug  = formData.get("carteraSlug")?.toString();

  if (!activoId || !categoriaRaw) return { error: "Faltan campos" };

  try {
    await prisma.activo.update({
      where: { id: activoId },
      data:  { categoria: categoriaRaw as CategoriaActivo },
    });
    revalidateCartera(carteraSlug);
    return { success: true };
  } catch (e) {
    console.error("cambiarCategoriaActivo:", e);
    return { error: "Error al cambiar la categoría" };
  }
}

// ─── 4. Asignar a custodia de cliente ────────────────────────────────────────
// Decreases own position. If it reaches zero, deletes it.
// Creates or accumulates CustodiaCliente with weighted average price.
// Custody value is NEVER counted as own portfolio value.

export async function asignarACustodia(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireActionPermission("bolsa:transferir_custodia");
  if (denied) return { error: denied.error };

  const session = await auth();
  const userId  = session?.user?.id as string | undefined;
  if (!userId) return { error: "Sin sesión activa" };

  const posicionId      = formData.get("posicionId")?.toString().trim();
  const clienteId       = formData.get("clienteId")?.toString().trim();
  const cantidadRaw     = formData.get("cantidad")?.toString().replace(",", ".");
  const carteraSlug     = formData.get("carteraSlug")?.toString();
  const notas           = formData.get("notas")?.toString().trim() || null;

  if (!posicionId || !clienteId || !cantidadRaw) {
    return { error: "Faltan campos obligatorios" };
  }

  let cantidadAAsignar: Decimal;
  try {
    cantidadAAsignar = new Decimal(cantidadRaw);
  } catch {
    return { error: "Cantidad inválida" };
  }

  if (cantidadAAsignar.lte(0)) return { error: "La cantidad debe ser mayor a cero" };

  try {
    let tickerTransf = "";
    await prisma.$transaction(async (tx) => {
      const posicion = await tx.posicionCartera.findUnique({
        where: { id: posicionId },
        include: { Activo: { select: { ticker: true } } },
      });
      if (!posicion) throw new Error("Posición no encontrada");

      tickerTransf = posicion.Activo.ticker;
      const disponible = new Decimal(posicion.cantidad.toString());
      if (cantidadAAsignar.gt(disponible)) {
        throw new Error(`Cantidad insuficiente. Disponible: ${disponible.toFixed(6)}`);
      }

      // Decrease or delete own position
      const restante = disponible.minus(cantidadAAsignar);
      if (restante.eq(0)) {
        await tx.posicionCartera.delete({ where: { id: posicionId } });
      } else {
        await tx.posicionCartera.update({
          where: { id: posicionId },
          data:  { cantidad: restante },
        });
      }

      // Create or accumulate CustodiaCliente with weighted average price
      const precioCompra = new Decimal(posicion.precioCompra.toString());
      const custodia = await tx.custodiaCliente.findUnique({
        where: { clienteId_activoId: { clienteId, activoId: posicion.activoId } },
      });

      let custodiaId: string;
      if (custodia) {
        custodiaId = custodia.id;
        const cantExist = new Decimal(custodia.cantidadTotal.toString());
        const precExist = new Decimal(custodia.precioPromedio.toString());
        const totalQty  = cantExist.plus(cantidadAAsignar);
        const totalCost = cantExist.mul(precExist).plus(cantidadAAsignar.mul(precioCompra));
        await tx.custodiaCliente.update({
          where: { id: custodia.id },
          data:  { cantidadTotal: totalQty, precioPromedio: totalCost.div(totalQty) },
        });
      } else {
        custodiaId = crypto.randomUUID();
        await tx.custodiaCliente.create({
          data: {
            id: custodiaId,
            clienteId,
            activoId:       posicion.activoId,
            cantidadTotal:  cantidadAAsignar,
            precioPromedio: precioCompra,
            updatedAt:      new Date(),
          },
        });
      }

      // Record TransferenciaActivo
      await tx.transferenciaActivo.create({
        data: {
          id:                    crypto.randomUUID(),
          fecha:                 new Date(),
          carteraOrigenId:       posicion.carteraId,
          custodiaDestinoId:     custodiaId,
          clienteDestinoId:      clienteId,
          activoId:              posicion.activoId,
          cantidad:              cantidadAAsignar,
          precioEnTransferencia: precioCompra,
          tipo:                  "FIRMA_A_CLIENTE",
          userId,
          notas,
        },
      });
    });

    await writeAuditLog({
      userId,
      accion:      "TRANSFERIR",
      entidad:     "PosicionCartera",
      entidadId:   posicionId,
      description: `${(session?.user as { name?: string })?.name ?? "Sistema"} transfirió ${cantidadAAsignar} ${tickerTransf} a custodia cliente ${clienteId.slice(0, 8)}`,
    });

    revalidatePath("/clientes");
    revalidateCartera(carteraSlug);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al asignar a custodia";
    console.error("asignarACustodia:", e);
    return { error: msg };
  }
}

// ─── 5. Eliminar posición ─────────────────────────────────────────────────────
// Deletes own position only. Does not delete the Activo master record.

export async function eliminarPosicion(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const posicionId  = formData.get("posicionId")?.toString().trim();
  const carteraSlug = formData.get("carteraSlug")?.toString();

  if (!posicionId) return { error: "ID de posición requerido" };

  try {
    await prisma.posicionCartera.delete({ where: { id: posicionId } });
    revalidateCartera(carteraSlug);
    return { success: true };
  } catch (e) {
    console.error("eliminarPosicion:", e);
    return { error: "Error al eliminar la posición" };
  }
}
