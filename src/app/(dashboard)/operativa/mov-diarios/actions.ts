"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { Moneda, TipoMovCaja, TipoOperacionCambio } from "@prisma/client";
import { readOnlyPreview } from "@/lib/config";
import { requireActionPermission } from "@/lib/auth/permissions";

export async function crearMovimientoDiario(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const cajaId = formData.get("cajaId")?.toString();
  const fechaStr = formData.get("fecha")?.toString();
  const tipo = formData.get("tipo")?.toString() as TipoMovCaja;
  const descripcion = formData.get("descripcion")?.toString();
  const rawMonto = formData.get("monto")?.toString().replace(",", ".");
  const moneda = formData.get("moneda")?.toString() as Moneda;
  
  const clasificacion = formData.get("clasificacion")?.toString(); // RESULTADO_OPERATIVO | MOVIMIENTO_CAJA | TRANSFERENCIA
  const subtipoOperativo = formData.get("subtipoOperativo")?.toString();

  // Campos para transferencia
  const cajaDestinoId = formData.get("cajaDestinoId")?.toString();

  const movDiarioDenied = await requireActionPermission("operativa:crear");
  if (movDiarioDenied) return movDiarioDenied;

  if (!fechaStr || !rawMonto || !moneda || !clasificacion) {
    return { error: "Faltan campos obligatorios" };
  }

  const monto = parseFloat(rawMonto);
  if (isNaN(monto) || monto <= 0) {
    return { error: "Monto inválido" };
  }

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  try {
    if (clasificacion === "TRANSFERENCIA") {
      const transferenciaPermDenied = await requireActionPermission("caja:transferir");
      if (transferenciaPermDenied) return transferenciaPermDenied;
      if (!cajaId || !cajaDestinoId) return { error: "Faltan cajas de origen o destino" };
      if (cajaId === cajaDestinoId) return { error: "La caja de origen y destino deben ser diferentes" };

      const labelOrigen = (await prisma.caja.findUnique({ where: { id: cajaId }, select: { label: true } }))?.label;
      const labelDestino = (await prisma.caja.findUnique({ where: { id: cajaDestinoId }, select: { label: true } }))?.label;

      await prisma.$transaction(async (tx) => {
        // SALIDA de origen
        await tx.movimientoCaja.create({
          data: {
            id: crypto.randomUUID(),
            cajaId,
            fecha,
            tipo: "SALIDA",
            moneda,
            monto: new Decimal(monto),
            descripcion: `[TRANSFERENCIA:OUT] a ${labelDestino} | ${descripcion || ""}`,
            confirmado: true,
          },
        });

        // ENTRADA a destino
        await tx.movimientoCaja.create({
          data: {
            id: crypto.randomUUID(),
            cajaId: cajaDestinoId,
            fecha,
            tipo: "ENTRADA",
            moneda,
            monto: new Decimal(monto),
            descripcion: `[TRANSFERENCIA:IN] desde ${labelOrigen} | ${descripcion || ""}`,
            confirmado: true,
          },
        });
      });
    } else {
      if (!cajaId || !tipo || !subtipoOperativo) return { error: "Faltan campos para registrar movimiento" };

      const prefix = `[${clasificacion}:${subtipoOperativo}]`;
      const finalDesc = `${prefix} ${descripcion?.trim() || "Movimiento operativo manual"}`;

      await prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId,
          fecha,
          tipo,
          moneda,
          monto: new Decimal(monto),
          descripcion: finalDesc,
          confirmado: true,
        },
      });
    }

    revalidatePath("/operativa/mov-diarios");
    return { ok: true };
  } catch (error: any) {
    console.error("Error creating manual movement:", error);
    return { error: "Error al registrar el movimiento" };
  }
}

export async function crearOperacionCambio(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const fechaStr = formData.get("fecha")?.toString();
  const tipoOp = formData.get("tipoOperacion")?.toString(); // COMPRA | VENTA
  const clienteNombre = formData.get("clienteNombre")?.toString();
  const clienteId = formData.get("clienteId")?.toString() || null;
  const moneda = formData.get("moneda")?.toString() as Moneda;
  const rawCantidad = formData.get("cantidad")?.toString().replace(",", ".");
  const rawTipoCambio = formData.get("tipoCambio")?.toString().replace(",", ".");
  const descripcion = formData.get("descripcion")?.toString();
  const estado = formData.get("estado")?.toString(); // PENDIENTE | COBRADA
  const impactoCC = formData.get("impactoCC") === "on";

  const opCambioDenied = await requireActionPermission("caja:operar_oficina", { allowTemporary: true });
  if (opCambioDenied) return opCambioDenied;

  if (!fechaStr || !tipoOp || !moneda || !rawCantidad || !rawTipoCambio || !estado) {
    return { error: "Todos los campos obligatorios deben completarse" };
  }

  // Reconstruir tipo para Prisma: COMPRA_USD, VENTA_EUR, etc.
  const tipo = `${tipoOp}_${moneda}` as TipoOperacionCambio;

  const cantidad = parseFloat(rawCantidad);
  const tc = parseFloat(rawTipoCambio);
  if (isNaN(cantidad) || cantidad <= 0 || isNaN(tc) || tc <= 0) {
    return { error: "Monto o tipo de cambio inválido" };
  }

  const totalARS = new Decimal(cantidad).mul(new Decimal(tc));
  const pendiente = estado === "PENDIENTE";

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const mesContable = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

  let finalDesc = descripcion?.trim() || `Operación de ${tipo.replace(/_/g, " ")}`;
  if (impactoCC) finalDesc = `[CC] ${finalDesc}`;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Crear OperacionCambio
      const op = await tx.operacionCambio.create({
        data: {
          id: crypto.randomUUID(),
          fecha,
          tipo,
          clienteNombre: clienteNombre || "Cliente General",
          clienteId,
          moneda,
          cantidad: new Decimal(cantidad),
          tipoCambio: new Decimal(tc),
          totalARS,
          cobroUSD: moneda === "USD" ? new Decimal(cantidad) : new Decimal(0),
          cobroARS: totalARS,
          descripcion: finalDesc,
          pendiente,
          mesContable,
          updatedAt: new Date(),
        },
      });

      // 2. Si no es pendiente, impactar Cajas automáticas
      if (!pendiente) {
        // TODO: En una versión futura permitir elegir caja origen/destino por moneda 
        // y repartir una operación entre varias cajas.
        
        // Buscamos la Caja Oficina (principal)
        const cajaOficina = await tx.caja.findFirst({ 
          where: { 
            OR: [
              { esPrincipal: true },
              { slug: "oficina" }
            ],
            activa: true 
          } 
        });

        if (!cajaOficina) {
          throw new Error("Falta configurar Caja Oficina para USD o ARS");
        }

        const esCompra = tipo.startsWith("COMPRA");
        const esVenta = tipo.startsWith("VENTA");

        if (esCompra) {
          // COMPRA: Entra Divisa, Sale ARS
          await tx.movimientoCaja.create({
            data: {
              id: crypto.randomUUID(),
              cajaId: cajaOficina.id,
              fecha,
              tipo: "ENTRADA",
              moneda,
              monto: new Decimal(cantidad),
              descripcion: `[Cambio ${op.id}] Compra divisa`,
              confirmado: true,
            },
          });
          await tx.movimientoCaja.create({
            data: {
              id: crypto.randomUUID(),
              cajaId: cajaOficina.id,
              fecha,
              tipo: "SALIDA",
              moneda: "ARS",
              monto: totalARS,
              descripcion: `[Cambio ${op.id}] Pago ARS x Compra`,
              confirmado: true,
            },
          });
        } else if (esVenta) {
          // VENTA: Sale Divisa, Entra ARS
          await tx.movimientoCaja.create({
            data: {
              id: crypto.randomUUID(),
              cajaId: cajaOficina.id,
              fecha,
              tipo: "SALIDA",
              moneda,
              monto: new Decimal(cantidad),
              descripcion: `[Cambio ${op.id}] Venta divisa`,
              confirmado: true,
            },
          });
          await tx.movimientoCaja.create({
            data: {
              id: crypto.randomUUID(),
              cajaId: cajaOficina.id,
              fecha,
              tipo: "ENTRADA",
              moneda: "ARS",
              monto: totalARS,
              descripcion: `[Cambio ${op.id}] Cobro ARS x Venta`,
              confirmado: true,
            },
          });
        }
      }
    });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    return { ok: true };
  } catch (error: any) {
    console.error("Error creating exchange operation:", error);
    return { error: error.message || "Error al registrar la operación" };
  }
}

export async function eliminarMovimientoCaja(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const elimMovDiarioDenied = await requireActionPermission("caja:eliminar_movimiento");
  if (elimMovDiarioDenied) return elimMovDiarioDenied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  const mov = await prisma.movimientoCaja.findUnique({ where: { id } });
  if (!mov) return { error: "Movimiento no encontrado" };

  const desc = mov.descripcion || "";
  if (
    desc.startsWith("[Cambio ") ||
    desc.startsWith("[Cobro Cambio ") ||
    desc.startsWith("[TRANSFERENCIA:")
  ) {
    return { error: "Movimiento vinculado a cambio/transferencia: no se puede eliminar directamente" };
  }

  try {
    await prisma.movimientoCaja.delete({ where: { id } });
  } catch (error: any) {
    return { error: "Error al eliminar el movimiento" };
  }
  revalidatePath("/operativa/mov-diarios");
  revalidatePath("/caja");
  return { ok: true };
}

export async function editarFechaMovimientoCaja(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const editFechaDenied = await requireActionPermission("caja:editar_movimiento", { allowTemporary: true });
  if (editFechaDenied) return editFechaDenied;

  const id = formData.get("id")?.toString();
  const fechaStr = formData.get("fecha")?.toString();

  if (!id || !fechaStr) return { error: "ID y fecha requeridos" };

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  try {
    await prisma.movimientoCaja.update({
      where: { id },
      data: { fecha },
    });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    return { ok: true };
  } catch (error: any) {
    console.error("Error updating movement date:", error);
    return { error: "Error al actualizar la fecha" };
  }
}

export async function editarMovimientoCajaCompleto(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const editMovDenied = await requireActionPermission("caja:editar_movimiento", { allowTemporary: true });
  if (editMovDenied) return editMovDenied;

  const id = formData.get("id")?.toString();
  const fechaStr = formData.get("fecha")?.toString();
  const tipo = formData.get("tipo")?.toString() as TipoMovCaja;
  const moneda = formData.get("moneda")?.toString() as Moneda;
  const rawMonto = formData.get("monto")?.toString().replace(",", ".");
  const descripcion = formData.get("descripcion")?.toString();

  if (!id || !fechaStr || !tipo || !moneda || !rawMonto) {
    return { error: "Faltan campos obligatorios" };
  }

  const monto = parseFloat(rawMonto);
  if (isNaN(monto) || monto < 0) return { error: "Monto inválido" };

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  try {
    await prisma.movimientoCaja.update({
      where: { id },
      data: {
        fecha,
        tipo,
        moneda,
        monto: new Decimal(monto),
        descripcion: descripcion || null,
      },
    });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    return { ok: true };
  } catch (error: any) {
    console.error("Error updating movement:", error);
    return { error: "Error al actualizar el movimiento" };
  }
}

export async function relocalizarMovimientosIniciales(): Promise<{ error?: string; ok?: boolean; count?: number }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const relocDenied = await requireActionPermission("configuracion:editar");
  if (relocDenied) return relocDenied;

  try {
    const targetDate = new Date(Date.UTC(2026, 4, 1)); // 01/05/2026

    const result = await prisma.movimientoCaja.updateMany({
      where: {
        OR: [
          { descripcion: { contains: "AJUSTE INICIAL", mode: "insensitive" } },
          { descripcion: { startsWith: "[IMPORT LEGACY" } },
        ],
      },
      data: { fecha: targetDate },
    });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    return { ok: true, count: result.count };
  } catch (error: any) {
    console.error("Error relocating movements:", error);
    return { error: "Error al relocalizar movimientos" };
  }
}

export async function cancelarOperacionCambioPendiente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const cancelOpDenied = await requireActionPermission("caja:eliminar_movimiento");
  if (cancelOpDenied) return cancelOpDenied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  const op = await prisma.operacionCambio.findUnique({ where: { id } });
  if (!op) return { error: "Operación no encontrada" };
  if (!op.pendiente) return { error: "Solo se pueden cancelar operaciones pendientes" };

  const cajaMovs = await prisma.movimientoCaja.findFirst({
    where: { descripcion: { contains: id } },
    select: { id: true },
  });
  if (cajaMovs) {
    return { error: "No se puede eliminar una operación con movimientos de caja. Revertir desde historial." };
  }

  try {
    await prisma.operacionCambio.delete({ where: { id } });
  } catch {
    return { error: "Error al cancelar la operación" };
  }
  revalidatePath("/operativa/mov-diarios");
  return { ok: true };
}

export async function cobrarOperacionCambio(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const cobrarDenied = await requireActionPermission("caja:operar_oficina", { allowTemporary: true });
  if (cobrarDenied) return cobrarDenied;

  const ids = formData.getAll("operacionId").map((v) => v.toString().trim()).filter(Boolean);
  if (ids.length === 0) return { error: "Debe indicar al menos una operación" };

  const ops = await prisma.operacionCambio.findMany({
    where: { id: { in: ids }, pendiente: true },
  });
  if (ops.length === 0) return { error: "No se encontraron operaciones pendientes" };

  const cajaOficina = await prisma.caja.findFirst({
    where: { OR: [{ esPrincipal: true }, { slug: "oficina" }], activa: true },
  });
  if (!cajaOficina) return { error: "Caja Oficina no configurada" };

  const fecha = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      for (const op of ops) {
        await tx.operacionCambio.update({ where: { id: op.id }, data: { pendiente: false } });

        const esCompra = op.tipo.startsWith("COMPRA");

        if (esCompra) {
          await tx.movimientoCaja.create({
            data: {
              id: crypto.randomUUID(),
              cajaId: cajaOficina.id, fecha, tipo: "ENTRADA",
              moneda: op.moneda, monto: op.cantidad,
              descripcion: `[Cobro Cambio ${op.id}] Compra divisa`, confirmado: true,
            },
          });
          await tx.movimientoCaja.create({
            data: {
              id: crypto.randomUUID(),
              cajaId: cajaOficina.id, fecha, tipo: "SALIDA",
              moneda: "ARS", monto: op.totalARS,
              descripcion: `[Cobro Cambio ${op.id}] Pago ARS x Compra`, confirmado: true,
            },
          });
        } else {
          await tx.movimientoCaja.create({
            data: {
              id: crypto.randomUUID(),
              cajaId: cajaOficina.id, fecha, tipo: "SALIDA",
              moneda: op.moneda, monto: op.cantidad,
              descripcion: `[Cobro Cambio ${op.id}] Venta divisa`, confirmado: true,
            },
          });
          await tx.movimientoCaja.create({
            data: {
              id: crypto.randomUUID(),
              cajaId: cajaOficina.id, fecha, tipo: "ENTRADA",
              moneda: "ARS", monto: op.totalARS,
              descripcion: `[Cobro Cambio ${op.id}] Cobro ARS x Venta`, confirmado: true,
            },
          });
        }
      }
    });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    return { ok: true };
  } catch (error: any) {
    return { error: error.message || "Error al cobrar las operaciones" };
  }
}
