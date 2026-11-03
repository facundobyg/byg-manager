"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { CategoriaActivo, Moneda } from "@prisma/client";
import { auth } from "@/auth";
import { requireActionPermission } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/services/audit.service";
import { parseMontoPositivo } from "@/lib/caja/integridad";
import { parseOpcionalConSigno, parseOpcionalNoNegativo } from "@/lib/bolsa/integridad";

import { AVISO_AJUSTE, AjusteCarteraError, ajusteAperturaPosicionTx, ajustePosicionTx } from "@/lib/bolsa/ajustes.service";

/**
 * Gate compartido por las Server Actions de este archivo: exige sesión válida
 * y el permiso indicado antes de tocar Prisma. Mismo patrón que
 * bolsa/importar/[loteId]/actions.ts.
 */
async function requireGate(permissionKey: string): Promise<{ userId: string } | { error: string }> {
  const denied = await requireActionPermission(permissionKey);
  if (denied) return { error: denied.error };
  const session = await auth();
  if (!session?.user?.id) return { error: "Sin sesión activa" };
  return { userId: session.user.id };
}

export async function updateSaldosCartera(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const gated = await requireGate("saldos:editar");
  if ("error" in gated) return { error: gated.error };

  const carteraId = formData.get("carteraId")?.toString().trim();
  const slug      = formData.get("slug")?.toString().trim();
  if (!carteraId || !slug) return { error: "Datos requeridos" };

  // MACRO 5: AJUSTE de cash (conciliación con el broker). Parser canónico estricto;
  // vacío = 0. Compare-and-set contra los valores que mostró el formulario: si una
  // operación concertada movió el saldo mientras tanto, el ajuste no la pisa.
  const leer = (k: string) => { const v = parseOpcionalNoNegativo(formData.get(k)); return v === "invalido" ? null : (v ?? new Decimal(0)); };
  const nuevos = { saldoPesos: leer("saldoPesos"), saldoUSDCable: leer("saldoUSDCable"), saldoUSDMep: leer("saldoUSDMep") };
  if (!nuevos.saldoPesos || !nuevos.saldoUSDCable || !nuevos.saldoUSDMep) return { error: "Valores inválidos: usá solo números (ej. 1500 o 1500,50)" };
  const anteriores = {
    saldoPesos: parseOpcionalConSigno(formData.get("saldoPesosAnterior")),
    saldoUSDCable: parseOpcionalConSigno(formData.get("saldoUSDCableAnterior")),
    saldoUSDMep: parseOpcionalConSigno(formData.get("saldoUSDMepAnterior")),
  };
  if (Object.values(anteriores).some((v) => v === null || v === "invalido")) return { error: "Recargá la página antes de ajustar los saldos" };

  try {
    const antes = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Cartera" WHERE id = ${carteraId} FOR UPDATE`;
      const c = await tx.cartera.findUnique({ where: { id: carteraId }, select: { saldoPesos: true, saldoUSDCable: true, saldoUSDMep: true } });
      if (!c) throw new AjusteCarteraError("Cartera no encontrada");
      for (const k of ["saldoPesos", "saldoUSDCable", "saldoUSDMep"] as const) {
        if (!new Decimal(c[k].toString()).eq(anteriores[k] as Decimal)) {
          throw new AjusteCarteraError("Los saldos cambiaron desde que abriste el formulario (p. ej. por una operación concertada). Recargá y volvé a ajustar.");
        }
      }
      await tx.cartera.update({
        where: { id: carteraId },
        data: { saldoPesos: nuevos.saldoPesos!, saldoUSDCable: nuevos.saldoUSDCable!, saldoUSDMep: nuevos.saldoUSDMep!, updatedAt: new Date() },
      });
      return c;
    });
    await writeAuditLog({
      userId: gated.userId, accion: "AJUSTE_SALDOS_CARTERA", entidad: "Cartera", entidadId: carteraId,
      description: `Ajuste manual de saldos: ARS ${antes.saldoPesos}→${nuevos.saldoPesos} | Cable ${antes.saldoUSDCable}→${nuevos.saldoUSDCable} | MEP ${antes.saldoUSDMep}→${nuevos.saldoUSDMep}`,
    });
    revalidatePath(`/carteras/${slug}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof AjusteCarteraError) return { error: e.message };
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
  const gated = await requireGate("bolsa:crear");
  if ("error" in gated) return { error: gated.error };

  const carteraId    = formData.get("carteraId")?.toString().trim();
  const ticker       = formData.get("ticker")?.toString().trim().toUpperCase();
  const descripcion  = formData.get("descripcion")?.toString().trim() || null;
  const categoriaRaw = formData.get("categoria")?.toString().trim();
  const fechaRaw     = formData.get("fecha")?.toString();
  const monedaRaw    = (formData.get("monedaPrecio")?.toString() || "USD") as Moneda;
  const carteraSlug  = formData.get("carteraSlug")?.toString();

  if (!carteraId || !ticker || !categoriaRaw) {
    return { error: "Faltan campos obligatorios" };
  }

  // M5-F02: es un AJUSTE / APERTURA (sin cash), no una compra: confirmación explícita
  // (validada también en el servicio, que escribe el AuditLog en la misma tx).
  const confirmarAjuste = formData.get("confirmarAjuste") === "on";
  if (!confirmarAjuste) return { error: AVISO_AJUSTE };

  const categoria = categoriaRaw as CategoriaActivo;
  // MACRO 5: AJUSTE / APERTURA de posición (sin cash: no es una compra). Parser canónico.
  const cantidad = parseMontoPositivo(formData.get("cantidad")?.toString());
  const precio   = parseMontoPositivo(formData.get("precioCompra")?.toString());
  if (!cantidad) return { error: "La cantidad debe ser un número mayor a cero" };
  if (!precio)   return { error: "El precio debe ser un número mayor a cero" };

  const fecha = fechaRaw
    ? new Date(fechaRaw + "T00:00:00Z")
    : new Date(new Date().toISOString().split("T")[0] + "T00:00:00Z");
  if (isNaN(fecha.getTime())) return { error: "Fecha inválida" };

  try {
    await prisma.$transaction((tx) => ajusteAperturaPosicionTx(tx, {
      userId: gated.userId, confirmarAjuste, carteraId, ticker, descripcion, categoria, monedaPrecio: monedaRaw, cantidad, precio, fecha,
    }));
    revalidateCartera(carteraSlug);
    return { success: true };
  } catch (e) {
    if (e instanceof AjusteCarteraError) return { error: e.message };
    console.error("agregarPosicion:", e);
    return { error: "Error al registrar la posición" };
  }
}

// ─── 2. Editar posición ───────────────────────────────────────────────────────

export async function editarPosicion(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const gated = await requireGate("bolsa:crear");
  if ("error" in gated) return { error: gated.error };
  const { userId } = gated;

  const posicionId  = formData.get("posicionId")?.toString().trim();
  const cantidadRaw = formData.get("cantidad")?.toString();
  const precioRaw   = formData.get("precioCompra")?.toString();
  const fechaRaw    = formData.get("fecha")?.toString();
  const carteraSlug = formData.get("carteraSlug")?.toString();

  if (!posicionId) return { error: "ID de posición requerido" };
  // M5-F02: es un AJUSTE (sin cash), no una compra / venta: confirmación explícita.
  const confirmarAjuste = formData.get("confirmarAjuste") === "on";
  if (!confirmarAjuste) return { error: AVISO_AJUSTE };

  // MACRO 5: AJUSTE de posición (sin cash). Parser canónico estricto.
  const data: Record<string, Decimal | Date> = {};
  if (cantidadRaw?.trim()) {
    const cantidad = parseMontoPositivo(cantidadRaw);
    if (!cantidad) return { error: "La cantidad debe ser un número mayor a cero" };
    data.cantidad = cantidad;
  }
  if (precioRaw?.trim()) {
    const precio = parseMontoPositivo(precioRaw);
    if (!precio) return { error: "El precio debe ser un número mayor a cero" };
    data.precioCompra = precio;
  }
  if (fechaRaw) {
    const fecha = new Date(fechaRaw + "T00:00:00Z");
    if (isNaN(fecha.getTime())) return { error: "Fecha inválida" };
    data.fecha = fecha;
  }
  if (Object.keys(data).length === 0) return { error: "Nada para actualizar" };

  try {
    await prisma.$transaction((tx) => ajustePosicionTx(tx, {
      userId, confirmarAjuste, posicionId,
      cantidad: data.cantidad as Decimal | undefined, precioCompra: data.precioCompra as Decimal | undefined, fecha: data.fecha as Date | undefined,
    }));
    revalidateCartera(carteraSlug);
    return { success: true };
  } catch (e) {
    if (e instanceof AjusteCarteraError) return { error: e.message };
    console.error("editarPosicion:", e);
    return { error: "Error al editar la posición" };
  }
}

// ─── 3. Cambiar categoría de activo ──────────────────────────────────────────

export async function cambiarCategoriaActivo(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const gated = await requireGate("bolsa:crear");
  if ("error" in gated) return { error: gated.error };

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
  const gated = await requireGate("bolsa:anular");
  if ("error" in gated) return { error: gated.error };

  const posicionId  = formData.get("posicionId")?.toString().trim();
  const carteraSlug = formData.get("carteraSlug")?.toString();

  if (!posicionId) return { error: "ID de posición requerido" };

  try {
    // MACRO 5: AJUSTE (baja de posición sin cash), con lock de la cartera y traza.
    const antes = await prisma.$transaction(async (tx) => {
      const pos0 = await tx.posicionCartera.findUnique({ where: { id: posicionId }, select: { carteraId: true } });
      if (!pos0) throw new AjusteCarteraError("Posición no encontrada");
      await tx.$queryRaw`SELECT id FROM "Cartera" WHERE id = ${pos0.carteraId} FOR UPDATE`;
      const p = await tx.posicionCartera.findUniqueOrThrow({ where: { id: posicionId }, include: { Activo: { select: { ticker: true } } } });
      await tx.posicionCartera.delete({ where: { id: posicionId } });
      return p;
    });
    await writeAuditLog({
      userId: gated.userId, accion: "AJUSTE_POSICION", entidad: "PosicionCartera", entidadId: posicionId,
      description: `Baja de posición ${antes.Activo.ticker} (sin cash): ${antes.cantidad} @ ${antes.precioCompra} → 0`,
    });
    revalidateCartera(carteraSlug);
    return { success: true };
  } catch (e) {
    if (e instanceof AjusteCarteraError) return { error: e.message };
    console.error("eliminarPosicion:", e);
    return { error: "Error al eliminar la posición" };
  }
}
