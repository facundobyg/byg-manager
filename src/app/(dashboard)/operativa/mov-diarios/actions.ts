"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { Moneda, TipoMovCaja, TipoOperacionCambio } from "@prisma/client";
import { readOnlyPreview } from "@/lib/config";
import { requireActionPermission } from "@/lib/auth/permissions";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { writeAuditLog } from "@/lib/services/audit.service";

async function getCajaSlug(cajaId: string): Promise<string | null> {
  const c = await prisma.caja.findUnique({ where: { id: cajaId }, select: { slug: true } });
  return c?.slug ?? null;
}

function isTrenqueCaja(slug: string | null): boolean {
  return !!slug?.includes("trenque");
}

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

  const session = await auth();
  const userName = (session?.user as { name?: string })?.name ?? "Sistema";

  try {
    if (clasificacion === "TRANSFERENCIA") {
      const transferenciaPermDenied = await requireActionPermission("caja:transferir");
      if (transferenciaPermDenied) return transferenciaPermDenied;
      if (!cajaId || !cajaDestinoId) return { error: "Faltan cajas de origen o destino" };
      if (cajaId === cajaDestinoId) return { error: "La caja de origen y destino deben ser diferentes" };

      const [cajaOrigen, cajaDest] = await Promise.all([
        prisma.caja.findUnique({ where: { id: cajaId }, select: { label: true, slug: true } }),
        prisma.caja.findUnique({ where: { id: cajaDestinoId }, select: { label: true, slug: true } }),
      ]);

      // B3.3: if either caja is not Trenque, require oficina permission
      if (!isTrenqueCaja(cajaOrigen?.slug ?? null) || !isTrenqueCaja(cajaDest?.slug ?? null)) {
        const oficinaDenied = await requireActionPermission("caja:operar_oficina");
        if (oficinaDenied) return oficinaDenied;
      }

      await prisma.$transaction(async (tx) => {
        await tx.movimientoCaja.create({
          data: {
            id: crypto.randomUUID(),
            cajaId,
            fecha,
            tipo: "SALIDA",
            moneda,
            monto: new Decimal(monto),
            descripcion: `[TRANSFERENCIA:OUT] a ${cajaDest?.label} | ${descripcion || ""} | usr:${userName}`,
            confirmado: true,
          },
        });

        await tx.movimientoCaja.create({
          data: {
            id: crypto.randomUUID(),
            cajaId: cajaDestinoId,
            fecha,
            tipo: "ENTRADA",
            moneda,
            monto: new Decimal(monto),
            descripcion: `[TRANSFERENCIA:IN] desde ${cajaOrigen?.label} | ${descripcion || ""} | usr:${userName}`,
            confirmado: true,
          },
        });
      });

      // B3.4: revalidate slug pages
      if (cajaOrigen?.slug) revalidatePath(`/operativa/${cajaOrigen.slug}`);
      if (cajaDest?.slug) revalidatePath(`/operativa/${cajaDest.slug}`);
    } else {
      if (!cajaId || !tipo || !subtipoOperativo) return { error: "Faltan campos para registrar movimiento" };

      // B3.3: if caja is not Trenque, require oficina permission
      const cajaSlug = await getCajaSlug(cajaId);
      if (!isTrenqueCaja(cajaSlug)) {
        const oficinaDenied = await requireActionPermission("caja:operar_oficina");
        if (oficinaDenied) return oficinaDenied;
      }

      const prefix = `[${clasificacion}:${subtipoOperativo}]`;
      const finalDesc = `${prefix} ${descripcion?.trim() || "Movimiento operativo manual"} | usr:${userName}`;

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

      // B3.4: revalidate slug page
      if (cajaSlug) revalidatePath(`/operativa/${cajaSlug}`);
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
  const fechaStr        = formData.get("fecha")?.toString();
  const tipoOp          = formData.get("tipoOperacion")?.toString(); // COMPRA | VENTA
  const clienteNombre   = formData.get("clienteNombre")?.toString();
  const clienteId       = formData.get("clienteId")?.toString() || null;
  const moneda          = formData.get("moneda")?.toString() as Moneda;
  const rawCantidad     = formData.get("cantidad")?.toString().replace(",", ".");
  const rawTipoCambio   = formData.get("tipoCambio")?.toString().replace(",", ".");
  const descripcion     = formData.get("descripcion")?.toString();
  // Estado operativo: NO_LIQUIDADA | LIQUIDADA | PARCIAL
  const estadoOp        = formData.get("estadoOp")?.toString() ?? "NO_LIQUIDADA";
  const impactoCC       = formData.get("impactoCC") === "on";
  // Liquidación completa en una caja
  const cajaLiqId       = formData.get("cajaLiqId")?.toString() || null;

  const opCambioDenied = await requireActionPermission("caja:operar_oficina", { allowTemporary: true });
  if (opCambioDenied) return opCambioDenied;

  const session = await auth();
  const realUser = session?.user as { name?: string; role?: string };
  let userName = realUser?.name ?? "Sistema";
  // Use preview identity for operator recording (respects "Ver como" mode)
  if (realUser?.role === "ADMIN") {
    const cookieStore = await cookies();
    const previewId = cookieStore.get("byg_preview_user")?.value;
    if (previewId) {
      const prevUser = await prisma.user.findUnique({ where: { id: previewId }, select: { name: true } });
      if (prevUser?.name) userName = prevUser.name;
    }
  }

  if (!fechaStr || !tipoOp || !moneda || !rawCantidad || !rawTipoCambio) {
    return { error: "Todos los campos obligatorios deben completarse" };
  }

  const tipo = `${tipoOp}_${moneda}` as TipoOperacionCambio;
  const cantidad = parseFloat(rawCantidad);
  const tc = parseFloat(rawTipoCambio);
  if (isNaN(cantidad) || cantidad <= 0) return { error: "Cantidad inválida" };
  if (isNaN(tc) || tc <= 0) return { error: "Tipo de cambio debe ser mayor a 0" };
  if (tc > 10_000_000) return { error: "Tipo de cambio excede el máximo permitido" };

  const totalARS  = new Decimal(cantidad).mul(new Decimal(tc));
  // NO_LIQUIDADA → pendiente=true; LIQUIDADA|PARCIAL → pendiente=false
  const pendiente = estadoOp === "NO_LIQUIDADA";
  const esLiquidada = estadoOp === "LIQUIDADA";
  const esParcial   = estadoOp === "PARCIAL";

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const mesContable = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

  const esCompra = tipo.startsWith("COMPRA");
  const esVenta  = tipo.startsWith("VENTA");

  let finalDesc = descripcion?.trim() || `Operación de ${tipo.replace(/_/g, " ")}`;
  if (esParcial) finalDesc = `[PARCIAL] ${finalDesc}`;
  if (impactoCC) finalDesc = `[CC] ${finalDesc}`;
  finalDesc = `${finalDesc} | usr:${userName}`;

  // Pre-fetch cajas fuera de la transacción
  let cajaLiqData: { id: string } | null = null;
  let activeCajasForParcial: { id: string }[] = [];

  if (esLiquidada && cajaLiqId) {
    cajaLiqData = await prisma.caja.findUnique({ where: { id: cajaLiqId }, select: { id: true } });
    if (!cajaLiqData) return { error: "Caja de liquidación no encontrada" };
  } else if (esParcial) {
    activeCajasForParcial = await prisma.caja.findMany({
      where: { activa: true, tipo: { in: ["CENTRAL_CONTABLE", "SUCURSAL_OPERATIVA"] } },
      select: { id: true },
      orderBy: { orden: "asc" },
    });
  }

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

      // 2. CC: siempre si impactaCC, independiente de liquidación en caja
      if (clienteId && impactoCC) {
        const deltaMoneda = esCompra ? new Decimal(-cantidad) : new Decimal(cantidad);
        const deltaARS    = esCompra ? totalARS : totalARS.negated();
        const tcFmt = tc.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const cantFmt = cantidad.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const verbo = esCompra ? "Compra" : "Venta";

        const ccMoneda = await tx.cuentaCorriente.upsert({
          where: { clienteId_moneda: { clienteId, moneda } },
          create: { id: crypto.randomUUID(), clienteId, moneda, saldo: deltaMoneda, updatedAt: new Date() },
          update: { saldo: { increment: deltaMoneda }, updatedAt: new Date() },
        });
        await tx.movimientoCC.create({
          data: {
            id: crypto.randomUUID(),
            cuentaCorrienteId: ccMoneda.id,
            fecha,
            tipo: esCompra ? "EGRESO" : "INGRESO",
            monto: new Decimal(Math.abs(deltaMoneda.toNumber())),
            descripcion: `${verbo} ${moneda} ${cantFmt} a TC ${tcFmt} — Op Cambio | op:${op.id}`,
            operacionCambioId: op.id,
          },
        });

        const ccARS = await tx.cuentaCorriente.upsert({
          where: { clienteId_moneda: { clienteId, moneda: "ARS" as Moneda } },
          create: { id: crypto.randomUUID(), clienteId, moneda: "ARS" as Moneda, saldo: deltaARS, updatedAt: new Date() },
          update: { saldo: { increment: deltaARS }, updatedAt: new Date() },
        });
        await tx.movimientoCC.create({
          data: {
            id: crypto.randomUUID(),
            cuentaCorrienteId: ccARS.id,
            fecha,
            tipo: esCompra ? "INGRESO" : "EGRESO",
            monto: totalARS,
            descripcion: `Contrapartida ARS por ${verbo} ${moneda} ${cantFmt} a TC ${tcFmt} | op:${op.id}`,
            operacionCambioId: op.id,
          },
        });
      }

      // 3. Caja: SOLO si LIQUIDADA o PARCIAL
      if (esLiquidada && cajaLiqData) {
        const cid = cajaLiqData.id;
        if (esCompra) {
          await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: cid, fecha, tipo: "ENTRADA", moneda, monto: new Decimal(cantidad), descripcion: `[Cambio ${op.id}] Compra divisa`, confirmado: true } });
          await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: cid, fecha, tipo: "SALIDA",  moneda: "ARS", monto: totalARS, descripcion: `[Cambio ${op.id}] Pago ARS x Compra`, confirmado: true } });
        } else {
          await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: cid, fecha, tipo: "SALIDA",  moneda, monto: new Decimal(cantidad), descripcion: `[Cambio ${op.id}] Venta divisa`, confirmado: true } });
          await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: cid, fecha, tipo: "ENTRADA", moneda: "ARS", monto: totalARS, descripcion: `[Cambio ${op.id}] Cobro ARS x Venta`, confirmado: true } });
        }
      } else if (esParcial) {
        for (const caja of activeCajasForParcial) {
          const rawDiv = formData.get(`cajaLiq_${caja.id}_div`)?.toString()?.replace(",", ".");
          if (!rawDiv || isNaN(parseFloat(rawDiv))) continue;
          const cantDiv = new Decimal(rawDiv);
          if (cantDiv.lte(0)) continue;

          const rawArs = formData.get(`cajaLiq_${caja.id}_ars`)?.toString()?.replace(",", ".");
          const arsParc = rawArs && parseFloat(rawArs) > 0
            ? new Decimal(rawArs)
            : cantDiv.mul(new Decimal(tc));

          if (esCompra) {
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: caja.id, fecha, tipo: "ENTRADA", moneda, monto: cantDiv, descripcion: `[Cambio ${op.id}] Compra divisa parcial | usr:${userName}`, confirmado: true } });
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: caja.id, fecha, tipo: "SALIDA",  moneda: "ARS", monto: arsParc, descripcion: `[Cambio ${op.id}] Pago ARS parcial | usr:${userName}`, confirmado: true } });
          } else {
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: caja.id, fecha, tipo: "SALIDA",  moneda, monto: cantDiv, descripcion: `[Cambio ${op.id}] Venta divisa parcial | usr:${userName}`, confirmado: true } });
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: caja.id, fecha, tipo: "ENTRADA", moneda: "ARS", monto: arsParc, descripcion: `[Cambio ${op.id}] Cobro ARS parcial | usr:${userName}`, confirmado: true } });
          }
        }
      }
    }, { timeout: 15000 });

    const sessionAudit = await auth();
    await writeAuditLog({
      userId:      sessionAudit?.user?.id,
      accion:      "CREAR",
      entidad:     "OperacionCambio",
      description: `${userName} creó op cambio ${tipoOp} ${moneda} ${rawCantidad} TC:${rawTipoCambio} cliente:${clienteNombre || "—"}`,
    });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    revalidatePath("/clientes");
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

  const cajaSlug = await getCajaSlug(mov.cajaId);
  try {
    await prisma.movimientoCaja.delete({ where: { id } });
  } catch (error: any) {
    return { error: "Error al eliminar el movimiento" };
  }

  const sessionElim = await auth();
  await writeAuditLog({
    userId:      sessionElim?.user?.id,
    accion:      "ELIMINAR",
    entidad:     "MovimientoCaja",
    entidadId:   id,
    description: `${(sessionElim?.user as { name?: string })?.name ?? "Sistema"} eliminó mov caja ${id} (${mov.tipo} ${mov.monto} ${mov.moneda})`,
  });

  revalidatePath("/operativa/mov-diarios");
  revalidatePath("/caja");
  if (cajaSlug) revalidatePath(`/operativa/${cajaSlug}`);
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

  // B3.3: block EMPLEADO from editing non-Trenque caja movements
  const movForCheck = await prisma.movimientoCaja.findUnique({ where: { id }, select: { cajaId: true } });
  const cajaSlug = movForCheck ? await getCajaSlug(movForCheck.cajaId) : null;
  if (!isTrenqueCaja(cajaSlug)) {
    const oficinaDenied = await requireActionPermission("caja:operar_oficina");
    if (oficinaDenied) return oficinaDenied;
  }

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  try {
    await prisma.movimientoCaja.update({
      where: { id },
      data: { fecha },
    });

    const sessionFecha = await auth();
    await writeAuditLog({
      userId:      sessionFecha?.user?.id,
      accion:      "EDITAR",
      entidad:     "MovimientoCaja",
      entidadId:   id,
      description: `Fecha mov caja ${id} → ${fecha.toISOString().slice(0, 10)}`,
    });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    if (cajaSlug) revalidatePath(`/operativa/${cajaSlug}`);
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

  // B3.3: block EMPLEADO from editing non-Trenque caja movements
  const movToEdit = await prisma.movimientoCaja.findUnique({ where: { id }, select: { cajaId: true } });
  const editCajaSlug = movToEdit ? await getCajaSlug(movToEdit.cajaId) : null;
  if (!isTrenqueCaja(editCajaSlug)) {
    const oficinaDenied = await requireActionPermission("caja:operar_oficina");
    if (oficinaDenied) return oficinaDenied;
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

    const sessionEditMov = await auth();
    await writeAuditLog({
      userId:      sessionEditMov?.user?.id,
      accion:      "EDITAR",
      entidad:     "MovimientoCaja",
      entidadId:   id,
      description: `${(sessionEditMov?.user as { name?: string })?.name ?? "Sistema"} editó mov caja ${id}: ${tipo} ${monto} ${moneda}`,
    });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    if (editCajaSlug) revalidatePath(`/operativa/${editCajaSlug}`);
    return { ok: true };
  } catch (error: any) {
    console.error("Error updating movement:", error);
    return { error: "Error al actualizar el movimiento" };
  }
}

export async function editarOperacionCambio(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const denied = await requireActionPermission("caja:operar_oficina", { allowTemporary: true });
  if (denied) return denied;

  const id = formData.get("id")?.toString();
  const clienteNombre = formData.get("clienteNombre")?.toString()?.trim();
  const descripcion = formData.get("descripcion")?.toString()?.trim();
  const fechaStr = formData.get("fecha")?.toString();
  const rawCantidad = formData.get("cantidad")?.toString()?.replace(",", ".");
  const rawTC = formData.get("tipoCambio")?.toString()?.replace(",", ".");
  const tipoOpEdit = formData.get("tipoOp")?.toString();       // "COMPRA" | "VENTA"
  const monedaEdit = formData.get("moneda")?.toString() as Moneda | undefined;
  const estadoNuevo = formData.get("estadoNuevo")?.toString(); // "COBRADA" | "PENDIENTE"

  if (!id) return { error: "ID requerido" };

  const op = await prisma.operacionCambio.findUnique({ where: { id } });
  if (!op) return { error: "Operación no encontrada" };

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (clienteNombre) updateData.clienteNombre = clienteNombre;
  if (descripcion !== undefined) updateData.descripcion = descripcion || null;

  if (op.pendiente) {
    if (fechaStr) {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return { error: "Fecha inválida" };
      updateData.fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      updateData.mesContable = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    }

    // Reconstruir tipo si cambió tipoOp o moneda
    const baseMoneda = monedaEdit ?? op.moneda;
    const baseTipoOp = tipoOpEdit ?? (op.tipo.startsWith("COMPRA") ? "COMPRA" : "VENTA");
    if (tipoOpEdit || monedaEdit) {
      updateData.tipo = `${baseTipoOp}_${baseMoneda}` as TipoOperacionCambio;
      if (monedaEdit) updateData.moneda = monedaEdit;
    }

    const nuevaCantidad = rawCantidad ? parseFloat(rawCantidad) : null;
    const nuevoTC = rawTC ? parseFloat(rawTC) : null;
    if (nuevaCantidad !== null) {
      if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) return { error: "Cantidad inválida" };
      updateData.cantidad = new Decimal(nuevaCantidad);
      if ((baseMoneda as string) === "USD") updateData.cobroUSD = new Decimal(nuevaCantidad);
    }
    if (nuevoTC !== null) {
      if (isNaN(nuevoTC) || nuevoTC <= 0) return { error: "Tipo de cambio inválido" };
      updateData.tipoCambio = new Decimal(nuevoTC);
    }
    if (nuevaCantidad !== null || nuevoTC !== null) {
      const finalCantidad = nuevaCantidad ?? Number(op.cantidad);
      const finalTC = nuevoTC ?? Number(op.tipoCambio);
      const nuevoTotal = new Decimal(finalCantidad).mul(new Decimal(finalTC));
      updateData.totalARS = nuevoTotal;
      updateData.cobroARS = nuevoTotal;
    }

    // PENDIENTE → COBRADA: liquidar y crear movimientos de caja
    if (estadoNuevo === "COBRADA") {
      const cajaOficina = await prisma.caja.findFirst({
        where: { OR: [{ esPrincipal: true }, { slug: "oficina" }], activa: true },
      });
      if (!cajaOficina) return { error: "Caja Oficina no configurada" };

      const fechaFinal = (updateData.fecha as Date | undefined) ?? op.fecha;
      const finalTipoStr = (updateData.tipo as string | undefined) ?? op.tipo;
      const finalCantidadNum = updateData.cantidad
        ? Number(updateData.cantidad as Decimal)
        : Number(op.cantidad);
      const finalTotal = (updateData.totalARS as Decimal | undefined) ?? op.totalARS;
      const finalMonedaStr = (updateData.moneda as Moneda | undefined) ?? op.moneda;
      const esCompra = finalTipoStr.startsWith("COMPRA");

      try {
        await prisma.$transaction(async (tx) => {
          await tx.operacionCambio.update({ where: { id }, data: { ...updateData, pendiente: false } });
          if (esCompra) {
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: cajaOficina.id, fecha: fechaFinal, tipo: "ENTRADA", moneda: finalMonedaStr, monto: new Decimal(finalCantidadNum), descripcion: `[Cobro Cambio ${id}] Compra divisa`, confirmado: true } });
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: cajaOficina.id, fecha: fechaFinal, tipo: "SALIDA", moneda: "ARS", monto: finalTotal, descripcion: `[Cobro Cambio ${id}] Pago ARS x Compra`, confirmado: true } });
          } else {
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: cajaOficina.id, fecha: fechaFinal, tipo: "SALIDA", moneda: finalMonedaStr, monto: new Decimal(finalCantidadNum), descripcion: `[Cobro Cambio ${id}] Venta divisa`, confirmado: true } });
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: cajaOficina.id, fecha: fechaFinal, tipo: "ENTRADA", moneda: "ARS", monto: finalTotal, descripcion: `[Cobro Cambio ${id}] Cobro ARS x Venta`, confirmado: true } });
          }
        });
        revalidatePath("/operativa/mov-diarios");
        revalidatePath("/caja");
        return { ok: true };
      } catch (e: any) {
        return { error: e.message || "Error al liquidar la operación" };
      }
    }
  }

  try {
    await prisma.operacionCambio.update({ where: { id }, data: updateData });
    revalidatePath("/operativa/mov-diarios");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message || "Error al actualizar la operación" };
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

  try {
    // Checks de negocio + delete atómicos: evita doble cancelación bajo concurrencia.
    await prisma.$transaction(async (tx) => {
      const op = await tx.operacionCambio.findUnique({ where: { id } });
      if (!op) throw new Error("Operación no encontrada");
      if (!op.pendiente) throw new Error("Solo se pueden cancelar operaciones pendientes");

      const cajaMovs = await tx.movimientoCaja.findFirst({
        where: { descripcion: { contains: id } },
        select: { id: true },
      });
      if (cajaMovs)
        throw new Error("No se puede eliminar una operación con movimientos de caja. Revertir desde historial.");

      await tx.operacionCambio.delete({ where: { id } });
    });
  } catch (e: unknown) {
    return { error: (e instanceof Error ? e.message : null) || "Error al cancelar la operación" };
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

export async function liquidarPagoPendiente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const denied = await requireActionPermission("caja:operar_oficina", { allowTemporary: true });
  if (denied) return denied;

  const ids = formData.getAll("operacionId").map(v => v.toString().trim()).filter(Boolean);
  if (ids.length === 0) return { error: "Debe indicar al menos una operación" };

  const modo = formData.get("modo")?.toString() ?? "total";
  if (modo !== "total" && modo !== "parcial") return { error: "Modo inválido" };

  const ops = await prisma.operacionCambio.findMany({ where: { id: { in: ids } } });
  const eligibleOps = ops.filter(op => op.pendiente || (op.descripcion ?? "").includes("[PARCIAL]"));
  if (eligibleOps.length === 0) return { error: "No hay operaciones pendientes o parciales para liquidar" };

  const hoy = new Date();
  const fecha = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  const slugsToRevalidate = new Set<string>();

  try {
    if (modo === "total") {
      const cajaId = formData.get("cajaId")?.toString();
      if (!cajaId) return { error: "Seleccioná una caja de liquidación" };
      const caja = await prisma.caja.findUnique({ where: { id: cajaId }, select: { id: true, slug: true } });
      if (!caja) return { error: "Caja no encontrada" };
      if (caja.slug) slugsToRevalidate.add(caja.slug);

      await prisma.$transaction(async (tx) => {
        for (const op of eligibleOps) {
          const esCompra = op.tipo.startsWith("COMPRA");
          const existingMovs = await tx.movimientoCaja.findMany({
            where: { descripcion: { contains: op.id } },
            select: { tipo: true, moneda: true, monto: true },
          });
          let alreadyPaidDiv = new Decimal(0);
          for (const m of existingMovs) {
            const isPayment = esCompra ? m.tipo === "ENTRADA" && m.moneda === op.moneda
                                        : m.tipo === "SALIDA" && m.moneda === op.moneda;
            if (isPayment) alreadyPaidDiv = alreadyPaidDiv.plus(new Decimal(m.monto.toString()));
          }
          const remainingDiv = new Decimal(op.cantidad.toString()).minus(alreadyPaidDiv);
          if (remainingDiv.lte(0)) continue;

          const remainingARS = remainingDiv.mul(new Decimal(op.tipoCambio.toString()));

          if (esCompra) {
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId, fecha, tipo: "ENTRADA", moneda: op.moneda, monto: remainingDiv, descripcion: `[Cobro Cambio ${op.id}] Compra divisa`, confirmado: true } });
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId, fecha, tipo: "SALIDA",  moneda: "ARS",      monto: remainingARS, descripcion: `[Cobro Cambio ${op.id}] Pago ARS x Compra`, confirmado: true } });
          } else {
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId, fecha, tipo: "SALIDA",  moneda: op.moneda, monto: remainingDiv, descripcion: `[Cobro Cambio ${op.id}] Venta divisa`, confirmado: true } });
            await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId, fecha, tipo: "ENTRADA", moneda: "ARS",      monto: remainingARS, descripcion: `[Cobro Cambio ${op.id}] Cobro ARS x Venta`, confirmado: true } });
          }
          const cleanDesc = (op.descripcion ?? "").replace(/^\[PARCIAL\]\s*/, "").trim();
          await tx.operacionCambio.update({ where: { id: op.id }, data: { pendiente: false, descripcion: cleanDesc || op.descripcion, updatedAt: new Date() } });
        }
      }, { timeout: 15000 });

    } else {
      const cajasActivas = await prisma.caja.findMany({
        where: { activa: true, tipo: { in: ["CENTRAL_CONTABLE", "SUCURSAL_OPERATIVA"] } },
        select: { id: true, slug: true },
        orderBy: { orden: "asc" },
      });

      await prisma.$transaction(async (tx) => {
        for (const op of eligibleOps) {
          const esCompra = op.tipo.startsWith("COMPRA");
          let hasAnyInput = false;

          for (const caja of cajasActivas) {
            const rawDiv = formData.get(`caja_${caja.id}_div`)?.toString()?.replace(",", ".");
            if (!rawDiv || isNaN(parseFloat(rawDiv)) || parseFloat(rawDiv) <= 0) continue;
            const cantDiv = new Decimal(parseFloat(rawDiv).toString());
            if (cantDiv.lte(0)) continue;

            const rawArs = formData.get(`caja_${caja.id}_ars`)?.toString()?.replace(",", ".");
            const cantArs = rawArs && parseFloat(rawArs) > 0
              ? new Decimal(parseFloat(rawArs).toString())
              : cantDiv.mul(new Decimal(op.tipoCambio.toString()));

            hasAnyInput = true;
            if (caja.slug) slugsToRevalidate.add(caja.slug);

            if (esCompra) {
              await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: caja.id, fecha, tipo: "ENTRADA", moneda: op.moneda, monto: cantDiv, descripcion: `[Cobro Cambio ${op.id}] Compra divisa parcial`, confirmado: true } });
              await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: caja.id, fecha, tipo: "SALIDA",  moneda: "ARS",      monto: cantArs, descripcion: `[Cobro Cambio ${op.id}] Pago ARS parcial`, confirmado: true } });
            } else {
              await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: caja.id, fecha, tipo: "SALIDA",  moneda: op.moneda, monto: cantDiv, descripcion: `[Cobro Cambio ${op.id}] Venta divisa parcial`, confirmado: true } });
              await tx.movimientoCaja.create({ data: { id: crypto.randomUUID(), cajaId: caja.id, fecha, tipo: "ENTRADA", moneda: "ARS",      monto: cantArs, descripcion: `[Cobro Cambio ${op.id}] Cobro ARS parcial`, confirmado: true } });
            }
          }

          if (!hasAnyInput) continue;

          // Check total paid after new movements
          const allMovs = await tx.movimientoCaja.findMany({
            where: { descripcion: { contains: op.id } },
            select: { tipo: true, moneda: true, monto: true },
          });
          let totalPaidDiv = new Decimal(0);
          for (const m of allMovs) {
            const isPayment = esCompra ? m.tipo === "ENTRADA" && m.moneda === op.moneda
                                        : m.tipo === "SALIDA" && m.moneda === op.moneda;
            if (isPayment) totalPaidDiv = totalPaidDiv.plus(new Decimal(m.monto.toString()));
          }

          const esTotalCubierta = totalPaidDiv.gte(new Decimal(op.cantidad.toString()));
          const currentDesc = op.descripcion ?? "";
          if (esTotalCubierta) {
            const cleanDesc = currentDesc.replace(/^\[PARCIAL\]\s*/, "").trim();
            await tx.operacionCambio.update({ where: { id: op.id }, data: { pendiente: false, descripcion: cleanDesc || currentDesc, updatedAt: new Date() } });
          } else {
            const newDesc = currentDesc.includes("[PARCIAL]") ? currentDesc : `[PARCIAL] ${currentDesc}`;
            await tx.operacionCambio.update({ where: { id: op.id }, data: { pendiente: false, descripcion: newDesc, updatedAt: new Date() } });
          }
        }
      }, { timeout: 15000 });
    }

    const sessionLiq = await auth();
    const liqUser = (sessionLiq?.user as { name?: string })?.name ?? "Sistema";
    await writeAuditLog({
      userId:      sessionLiq?.user?.id,
      accion:      "LIQUIDAR",
      entidad:     "OperacionCambio",
      description: `${liqUser} liquidó ${eligibleOps.length} operación(es) [modo:${modo}]`,
    });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    Array.from(slugsToRevalidate).forEach(slug => revalidatePath(`/operativa/${slug}`));
    return { ok: true };

  } catch (error: any) {
    console.error("Error liquidating pending payment:", error);
    return { error: error.message || "Error al liquidar el pago" };
  }
}

export async function revertirOperacionCambio(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const denied = await requireActionPermission("caja:operar_oficina", { allowTemporary: true });
  if (denied) return denied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  const op = await prisma.operacionCambio.findUnique({ where: { id } });
  if (!op) return { error: "Operación no encontrada" };
  if (op.pendiente) return { error: "La operación ya es NO_LIQUIDADA, no necesita reversión" };
  if ((op.descripcion ?? "").includes("[REVERTIDA POR:")) return { error: "Esta operación ya fue revertida" };

  const sessionRev = await auth();
  const realUserRev = sessionRev?.user as { name?: string; role?: string };
  let revertidoPor = realUserRev?.name ?? "Sistema";
  if (realUserRev?.role === "ADMIN") {
    const cookieStoreRev = await cookies();
    const previewIdRev = cookieStoreRev.get("byg_preview_user")?.value;
    if (previewIdRev) {
      const prevUserRev = await prisma.user.findUnique({ where: { id: previewIdRev }, select: { name: true } });
      if (prevUserRev?.name) revertidoPor = prevUserRev.name;
    }
  }

  const [cajaMov, ccMov] = await Promise.all([
    prisma.movimientoCaja.findMany({ where: { descripcion: { contains: id } } }),
    prisma.movimientoCC.findMany({
      where: { descripcion: { contains: `op:${id}` } },
      include: { CuentaCorriente: { select: { id: true, saldo: true } } },
    }),
  ]);

  const hoy = new Date();
  const fechaRev = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));

  try {
    await prisma.$transaction(async (tx) => {
      // Revertir movimientos de caja
      for (const m of cajaMov) {
        const tipoInv: "ENTRADA" | "SALIDA" = m.tipo === "ENTRADA" ? "SALIDA" : "ENTRADA";
        await tx.movimientoCaja.create({
          data: {
            id: crypto.randomUUID(),
            cajaId: m.cajaId,
            fecha: fechaRev,
            tipo: tipoInv,
            moneda: m.moneda,
            monto: m.monto,
            descripcion: `[REVERSO Cambio ${id}] ${m.descripcion ?? ""}`.slice(0, 500),
            confirmado: true,
          },
        });
      }

      // Revertir movimientos de CC
      for (const m of ccMov) {
        const tipoInv = m.tipo === "INGRESO" ? "EGRESO" : "INGRESO";
        const delta = m.tipo === "INGRESO" ? m.monto.negated() : m.monto;
        await tx.movimientoCC.create({
          data: {
            id: crypto.randomUUID(),
            cuentaCorrienteId: m.cuentaCorrienteId,
            fecha: fechaRev,
            tipo: tipoInv as "INGRESO" | "EGRESO",
            monto: m.monto,
            descripcion: `[REVERSO] ${m.descripcion ?? "Reverso Op Cambio"}`.slice(0, 500),
            operacionCambioId: id,
          },
        });
        await tx.cuentaCorriente.update({
          where: { id: m.cuentaCorrienteId },
          data: { saldo: { increment: delta } },
        });
      }

      // Marcar operación como revertida (pendiente=true para que sea editable)
      await tx.operacionCambio.update({
        where: { id },
        data: {
          pendiente: true,
          descripcion: `[REVERTIDA POR: ${revertidoPor}] ${op.descripcion ?? ""}`.slice(0, 500),
          updatedAt: new Date(),
        },
      });
    }, { timeout: 15000 });

    await writeAuditLog({
      userId:      sessionRev?.user?.id,
      accion:      "REVERTIR",
      entidad:     "OperacionCambio",
      entidadId:   id,
      description: `${revertidoPor} revirtió op cambio ${id} (${op.tipo} ${op.moneda} ${op.cantidad})`,
    });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    revalidatePath("/clientes");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message || "Error al revertir la operación" };
  }
}
