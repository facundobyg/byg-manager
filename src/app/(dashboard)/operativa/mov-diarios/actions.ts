"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { Moneda, TipoMovCaja, TipoOperacionCambio } from "@prisma/client";
import { readOnlyPreview } from "@/lib/config";
import { requireActionPermission, requireCajaPermission } from "@/lib/auth/permissions";
import { leerLiquidacionesPorCaja, type LiquidacionPorCaja } from "@/lib/parse-monto";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/services/audit.service";
import {
  descripcionEditada, esMonedaValida, esOpRevertida, esTipoManual, parseMontoPositivo, validarClasificacion,
  validarTextoEditado, validarTextoUsuario, vinculoFinanciero,
} from "@/lib/caja/integridad";
import {
  IntegridadError, cancelarCambioTx, editarCambioTx, liquidarCambioTx, lockMovimientosCaja, movimientosCCDeCambio, movimientosDeCambio,
  pagosValidos, revertirCambioTx, MENSAJE_CAMBIO_CON_CC,
} from "@/lib/caja/integridad.service";

/** Mensaje seguro: los errores de integridad son para el usuario; el resto, genérico. */
function mensajeError(e: unknown, generico: string): string {
  return e instanceof IntegridadError ? e.message : generico;
}

async function getCajaSlug(cajaId: string): Promise<string | null> {
  const c = await prisma.caja.findUnique({ where: { id: cajaId }, select: { slug: true } });
  return c?.slug ?? null;
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

  // MACRO 3: decimal estricto > 0 (parseFloat aceptaba "12abc", "1e3"…).
  const montoDec = parseMontoPositivo(rawMonto);
  if (!montoDec) return { error: "Monto inválido: usá solo números mayores a 0" };
  if (!esMonedaValida(moneda)) return { error: "Moneda inválida" };
  // MACRO 3 (L1): clasificación de lista cerrada y texto libre sin marcas internas,
  // validado ANTES de escribir (si no, el usuario fabrica "[Cambio …]", "REVERSO | ref:…").
  const clasifError = validarClasificacion(clasificacion, clasificacion === "TRANSFERENCIA" ? null : subtipoOperativo);
  if (clasifError) return { error: clasifError };
  const textoError = validarTextoUsuario(descripcion);
  if (textoError) return { error: textoError };

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

      // Scope de caja: Trenque exige caja:operar_trenque; cualquier otra, caja:operar_oficina.
      const scopeDenied = await requireCajaPermission([cajaId, cajaDestinoId]);
      if (scopeDenied) return scopeDenied;

      // MACRO 3: las dos patas comparten transferenciaRef (vínculo estructurado):
      // no se pueden editar, borrar ni revertir por separado.
      const transferenciaRef = crypto.randomUUID();
      await prisma.$transaction(async (tx) => {
        await tx.movimientoCaja.create({
          data: {
            id: crypto.randomUUID(),
            cajaId,
            fecha,
            tipo: "SALIDA",
            moneda,
            monto: montoDec,
            descripcion: `[TRANSFERENCIA:OUT] a ${cajaDest?.label} | ${descripcion || ""} | usr:${userName}`,
            confirmado: true,
            transferenciaRef,
          },
        });

        await tx.movimientoCaja.create({
          data: {
            id: crypto.randomUUID(),
            cajaId: cajaDestinoId,
            fecha,
            tipo: "ENTRADA",
            moneda,
            monto: montoDec,
            descripcion: `[TRANSFERENCIA:IN] desde ${cajaOrigen?.label} | ${descripcion || ""} | usr:${userName}`,
            confirmado: true,
            transferenciaRef,
          },
        });
      });

      // B3.4: revalidate slug pages
      if (cajaOrigen?.slug) revalidatePath(`/operativa/${cajaOrigen.slug}`);
      if (cajaDest?.slug) revalidatePath(`/operativa/${cajaDest.slug}`);
    } else {
      if (!cajaId || !tipo || !subtipoOperativo) return { error: "Faltan campos para registrar movimiento" };
      if (!esTipoManual(tipo)) return { error: "Tipo inválido" };

      // Scope de caja: Trenque exige caja:operar_trenque; cualquier otra, caja:operar_oficina.
      const cajaSlug = await getCajaSlug(cajaId);
      const scopeDenied = await requireCajaPermission([cajaId]);
      if (scopeDenied) return scopeDenied;

      const prefix = `[${clasificacion}:${subtipoOperativo}]`;
      const finalDesc = `${prefix} ${descripcion?.trim() || "Movimiento operativo manual"} | usr:${userName}`;

      await prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId,
          fecha,
          tipo,
          moneda,
          monto: montoDec,
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

  const opCambioDenied = await requireActionPermission("cambio:operar");
  if (opCambioDenied) return opCambioDenied;

  // Montos parciales por caja: parser estricto UNA vez; el scope y la escritura
  // usan exactamente estos valores (H1: nada de parseFloat vs Decimal).
  let parciales: LiquidacionPorCaja[] = [];
  if (estadoOp === "PARCIAL") {
    const leidos = leerLiquidacionesPorCaja(formData, "cajaLiq_");
    if (!leidos.ok) return { error: leidos.error };
    parciales = leidos.items;
  }

  // Cajas donde se liquida: scope por tipo de caja (Oficina / Trenque).
  const cajasLiquidacion: string[] = parciales.map((p) => p.cajaId);
  if (estadoOp === "LIQUIDADA" && cajaLiqId) cajasLiquidacion.push(cajaLiqId);
  const scopeDenied = await requireCajaPermission(cajasLiquidacion);
  if (scopeDenied) return scopeDenied;

  // El operador registrado es siempre el usuario autenticado real.
  const session = await auth();
  const userName = (session?.user as { name?: string })?.name ?? "Sistema";

  if (!fechaStr || !tipoOp || !moneda || !rawCantidad || !rawTipoCambio) {
    return { error: "Todos los campos obligatorios deben completarse" };
  }

  if (tipoOp !== "COMPRA" && tipoOp !== "VENTA") return { error: "Tipo de operación inválido" };
  if (!esMonedaValida(moneda) || moneda === "ARS") return { error: "Moneda inválida" };
  const tipo = `${tipoOp}_${moneda}` as TipoOperacionCambio;
  // MACRO 3: decimales estrictos > 0 (parseFloat aceptaba "12abc", "1e3"…).
  const cantidadDec = parseMontoPositivo(rawCantidad);
  const tcDec = parseMontoPositivo(rawTipoCambio);
  if (!cantidadDec) return { error: "Cantidad inválida" };
  if (!tcDec) return { error: "Tipo de cambio debe ser mayor a 0" };
  if (tcDec.gt(10_000_000)) return { error: "Tipo de cambio excede el máximo permitido" };
  const cantidad = cantidadDec.toNumber();
  const tc = tcDec.toNumber();
  if (estadoOp !== "NO_LIQUIDADA" && estadoOp !== "LIQUIDADA" && estadoOp !== "PARCIAL") return { error: "Estado inválido" };
  // LIQUIDADA sin caja no puede marcarse liquidada sin efectivo; PARCIAL sin montos tampoco.
  if (estadoOp === "LIQUIDADA" && !cajaLiqId) return { error: "Seleccioná la caja de liquidación" };
  if (estadoOp === "PARCIAL" && parciales.length === 0) return { error: "Ingresá al menos un monto parcial" };
  // MACRO 6: impacto en CC y liquidación en Caja son mutuamente excluyentes (el canje no se registra dos veces).
  if (impactoCC && estadoOp !== "NO_LIQUIDADA") return { error: MENSAJE_CAMBIO_CON_CC };
  // L1: [REVERTIDA POR:]/[PARCIAL]/[CC] y demás marcas solo las pone el sistema.
  const textoError = validarTextoUsuario(descripcion);
  if (textoError) return { error: textoError };

  const totalARS  = cantidadDec.mul(tcDec);
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
  // [PARCIAL] lo administra la liquidación (liquidarCambioTx) según lo efectivamente liquidado.
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
    // MACRO 3: un monto en una caja no operativa se rechaza (antes se descartaba en silencio).
    const activas = new Set(activeCajasForParcial.map((c) => c.id));
    if (parciales.some((x) => !activas.has(x.cajaId))) return { error: "Caja de liquidación no operativa" };
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

      // 3. Caja: SOLO si LIQUIDADA o PARCIAL. MACRO 3: patas con operacionCambioId y
      //    validación de no-sobreliquidación dentro de la misma transacción.
      if (esLiquidada && cajaLiqData) {
        await liquidarCambioTx(tx, { opId: op.id, items: "TOTAL", cajaTotalId: cajaLiqData.id, fecha, etiqueta: "Cambio", userName });
      } else if (esParcial) {
        await liquidarCambioTx(tx, {
          opId: op.id, items: parciales.map((x) => ({ cajaId: x.cajaId, div: x.div, ars: x.ars })), fecha, etiqueta: "Cambio", userName,
        });
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
  } catch (error: unknown) {
    console.error("Error creating exchange operation:", error);
    return { error: mensajeError(error, "Error al registrar la operación") };
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

  const scopeDenied = await requireCajaPermission([mov.cajaId]);
  if (scopeDenied) return scopeDenied;

  const cajaSlug = await getCajaSlug(mov.cajaId);
  try {
    // MACRO 3: un movimiento CONFIRMADO es historia financiera → se revierte, no se borra.
    // Solo un pendiente sin impacto (sin pagos ni vínculos) puede eliminarse.
    await prisma.$transaction(async (tx) => {
      await lockMovimientosCaja(tx, [id]);
      const actual = await tx.movimientoCaja.findUnique({ where: { id } });
      if (!actual) throw new IntegridadError("Movimiento no encontrado");
      if (actual.confirmado) throw new IntegridadError("Movimiento confirmado: no se elimina, se revierte (Revertir)");
      if (vinculoFinanciero(actual)) throw new IntegridadError("Movimiento vinculado a cambio/transferencia/pago: no se puede eliminar");
      const hijos = await tx.movimientoCaja.count({ where: { pagoDeId: id } });
      if (hijos > 0) throw new IntegridadError("El pendiente tiene pagos parciales: no se puede eliminar");
      await tx.movimientoCaja.delete({ where: { id } });
    });
  } catch (error: unknown) {
    return { error: mensajeError(error, "Error al eliminar el movimiento") };
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

  // Scope de caja del movimiento editado (Trenque vs Oficina).
  const movForCheck = await prisma.movimientoCaja.findUnique({ where: { id }, select: { cajaId: true } });
  if (!movForCheck) return { error: "Movimiento no encontrado" };
  const scopeDenied = await requireCajaPermission([movForCheck.cajaId]);
  if (scopeDenied) return scopeDenied;
  const cajaSlug = await getCajaSlug(movForCheck.cajaId);

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  try {
    // MACRO 3: una pata de transferencia/cambio/reversa/pago no se edita por separado.
    await prisma.$transaction(async (tx) => {
      await lockMovimientosCaja(tx, [id]);
      const actual = await tx.movimientoCaja.findUnique({ where: { id } });
      if (!actual) throw new IntegridadError("Movimiento no encontrado");
      if (vinculoFinanciero(actual)) throw new IntegridadError("Movimiento vinculado: no se puede editar una sola pata. Revertí y volvé a crear.");
      await tx.movimientoCaja.update({ where: { id }, data: { fecha } });
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
  } catch (error: unknown) {
    console.error("Error updating movement date:", error);
    return { error: mensajeError(error, "Error al actualizar la fecha") };
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

  // Scope de caja del movimiento editado (Trenque vs Oficina).
  const movToEdit = await prisma.movimientoCaja.findUnique({ where: { id }, select: { cajaId: true } });
  if (!movToEdit) return { error: "Movimiento no encontrado" };
  const scopeDenied = await requireCajaPermission([movToEdit.cajaId]);
  if (scopeDenied) return scopeDenied;
  const editCajaSlug = await getCajaSlug(movToEdit.cajaId);

  const montoDec = parseMontoPositivo(rawMonto);
  if (!montoDec) return { error: "Monto inválido: usá solo números mayores a 0" };
  if (!esTipoManual(tipo)) return { error: "Tipo inválido" };
  if (!esMonedaValida(moneda)) return { error: "Moneda inválida" };
  const monto = montoDec.toNumber();

  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return { error: "Fecha inválida" };
  const fecha = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  try {
    // MACRO 3: en un CONFIRMADO no cambian monto/moneda/tipo (se revierte y se recrea);
    // un movimiento vinculado no se edita; la marca de clasificación se preserva.
    await prisma.$transaction(async (tx) => {
      await lockMovimientosCaja(tx, [id]);
      const actual = await tx.movimientoCaja.findUnique({ where: { id } });
      if (!actual) throw new IntegridadError("Movimiento no encontrado");
      if (vinculoFinanciero(actual)) throw new IntegridadError("Movimiento vinculado: no se puede editar una sola pata. Revertí y volvé a crear.");
      // L1: el texto editado no puede agregar marcas internas que no estaban.
      const textoError = validarTextoEditado(actual.descripcion, descripcion);
      if (textoError) throw new IntegridadError(textoError);
      const cambiaEconomia = actual.tipo !== tipo || actual.moneda !== moneda || !new Decimal(actual.monto.toString()).eq(montoDec);
      if (actual.confirmado && cambiaEconomia) {
        throw new IntegridadError("Movimiento confirmado: monto, moneda y tipo no se editan. Revertí y volvé a crear.");
      }
      if (!actual.confirmado && cambiaEconomia && (await pagosValidos(tx, id)).length > 0) {
        throw new IntegridadError("El pendiente tiene pagos parciales: monto, moneda y tipo no se editan");
      }
      await tx.movimientoCaja.update({
        where: { id },
        data: { fecha, tipo, moneda, monto: montoDec, descripcion: descripcionEditada(actual.descripcion, descripcion) },
      });
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
  } catch (error: unknown) {
    console.error("Error updating movement:", error);
    return { error: mensajeError(error, "Error al actualizar el movimiento") };
  }
}

export async function editarOperacionCambio(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const denied = await requireActionPermission("cambio:operar");
  if (denied) return denied;

  const id = formData.get("id")?.toString();
  const clienteNombre = formData.get("clienteNombre")?.toString()?.trim();
  const descripcion = formData.get("descripcion")?.toString()?.trim();
  const fechaStr = formData.get("fecha")?.toString();
  const rawCantidad = formData.get("cantidad")?.toString()?.trim();
  const rawTC = formData.get("tipoCambio")?.toString()?.trim();
  const tipoOpEdit = formData.get("tipoOp")?.toString();       // "COMPRA" | "VENTA"
  const monedaEdit = formData.get("moneda")?.toString() as Moneda | undefined;
  const estadoNuevo = formData.get("estadoNuevo")?.toString(); // "COBRADA" | "PENDIENTE"

  if (!id) return { error: "ID requerido" };

  // Validación de formato (sin estado): antes de abrir la transacción.
  if (monedaEdit && (!esMonedaValida(monedaEdit) || monedaEdit === "ARS")) return { error: "Moneda inválida" };
  if (tipoOpEdit && tipoOpEdit !== "COMPRA" && tipoOpEdit !== "VENTA") return { error: "Tipo de operación inválido" };
  const cantidadDec = rawCantidad ? parseMontoPositivo(rawCantidad) : null;
  const tcDecEdit = rawTC ? parseMontoPositivo(rawTC) : null;
  if (rawCantidad && !cantidadDec) return { error: "Cantidad inválida" };
  if (rawTC && !tcDecEdit) return { error: "Tipo de cambio inválido" };
  if (tcDecEdit && tcDecEdit.gt(10_000_000)) return { error: "Tipo de cambio excede el máximo permitido" };
  let fechaNueva: Date | null = null;
  if (fechaStr) {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return { error: "Fecha inválida" };
    fechaNueva = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  // PENDIENTE → COBRADA liquida en Oficina: scope resuelto antes de la transacción.
  let cajaCobroId: string | null = null;
  if (estadoNuevo === "COBRADA") {
    const cajaOficina = await prisma.caja.findFirst({
      where: { OR: [{ esPrincipal: true }, { slug: "oficina" }], activa: true },
    });
    if (!cajaOficina) return { error: "Caja Oficina no configurada" };
    const cobroScopeDenied = await requireCajaPermission([cajaOficina.id]);
    if (cobroScopeDenied) return cobroScopeDenied;
    cajaCobroId = cajaOficina.id;
  }
  const session = await auth();
  const userName = (session?.user as { name?: string })?.name ?? "Sistema";

  try {
    // L3: lock + relectura + recálculo de lo liquidado + validación + update en UNA tx.
    await prisma.$transaction((tx) => editarCambioTx(tx, {
      opId: id, clienteNombre, descripcion, fecha: fechaNueva,
      tipoOp: tipoOpEdit as "COMPRA" | "VENTA" | undefined, moneda: monedaEdit, cantidad: cantidadDec, tipoCambio: tcDecEdit,
      cobro: estadoNuevo === "COBRADA" && cajaCobroId ? { cajaId: cajaCobroId, userName } : null,
    }));
    revalidatePath("/operativa/mov-diarios");
    if (estadoNuevo === "COBRADA") revalidatePath("/caja");
    return { ok: true };
  } catch (e: unknown) {
    return { error: mensajeError(e, "Error al actualizar la operación") };
  }
}

export async function relocalizarMovimientosIniciales(): Promise<{ error?: string; ok?: boolean; count?: number }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const relocDenied = await requireActionPermission("sistema:admin");
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

  const cancelOpDenied = await requireActionPermission("cambio:operar");
  if (cancelOpDenied) return cancelOpDenied;
  // El código anterior exigía caja:eliminar_movimiento: se conserva (B ⊆ A).
  const cancelElimDenied = await requireActionPermission("caja:eliminar_movimiento");
  if (cancelElimDenied) return cancelElimDenied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  const hoy = new Date();
  const fecha = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  try {
    // MACRO 3: lock de la operación; si impactó CC, se neutraliza en la MISMA tx
    // (antes quedaba saldo CC huérfano). Segunda cancelación: "no encontrada".
    await prisma.$transaction((tx) => cancelarCambioTx(tx, { opId: id, fecha }), { timeout: 15000 });
  } catch (e: unknown) {
    return { error: mensajeError(e, "Error al cancelar la operación") };
  }
  revalidatePath("/operativa/mov-diarios");
  revalidatePath("/clientes");
  return { ok: true };
}

export async function cobrarOperacionCambio(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const cobrarDenied = await requireActionPermission("cambio:operar");
  if (cobrarDenied) return cobrarDenied;

  const ids = formData.getAll("operacionId").map((v) => v.toString().trim()).filter(Boolean);
  if (ids.length === 0) return { error: "Debe indicar al menos una operación" };

  const ops = (await prisma.operacionCambio.findMany({
    where: { id: { in: ids }, pendiente: true },
  })).filter((op) => !esOpRevertida(op.descripcion));
  if (ops.length === 0) return { error: "No se encontraron operaciones pendientes" };

  const cajaOficina = await prisma.caja.findFirst({
    where: { OR: [{ esPrincipal: true }, { slug: "oficina" }], activa: true },
  });
  if (!cajaOficina) return { error: "Caja Oficina no configurada" };
  const scopeDenied = await requireCajaPermission([cajaOficina.id]);
  if (scopeDenied) return scopeDenied;

  const fecha = new Date();
  const sessionCobrar = await auth();
  const userCobrar = (sessionCobrar?.user as { name?: string })?.name ?? "Sistema";

  try {
    // MACRO 3: por operación, lock + residual (neto de reversas) dentro de la tx.
    await prisma.$transaction(async (tx) => {
      for (const op of ops) {
        await liquidarCambioTx(tx, { opId: op.id, items: "TOTAL", cajaTotalId: cajaOficina.id, fecha, etiqueta: "Cobro Cambio", userName: userCobrar });
      }
    }, { timeout: 15000 });

    revalidatePath("/operativa/mov-diarios");
    revalidatePath("/caja");
    return { ok: true };
  } catch (error: unknown) {
    return { error: mensajeError(error, "Error al cobrar las operaciones") };
  }
}

export async function liquidarPagoPendiente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const denied = await requireActionPermission("cambio:operar");
  if (denied) return denied;

  const ids = formData.getAll("operacionId").map(v => v.toString().trim()).filter(Boolean);
  if (ids.length === 0) return { error: "Debe indicar al menos una operación" };

  const modo = formData.get("modo")?.toString() ?? "total";
  if (modo !== "total" && modo !== "parcial") return { error: "Modo inválido" };

  // Parser estricto UNA vez: scope y escritura usan los mismos valores (H1).
  let parciales: LiquidacionPorCaja[] = [];
  if (modo === "parcial") {
    const leidos = leerLiquidacionesPorCaja(formData, "caja_");
    if (!leidos.ok) return { error: leidos.error };
    parciales = leidos.items;
  }

  const cajasLiquidacion: string[] = parciales.map((p) => p.cajaId);
  if (modo === "total") {
    const cajaTotal = formData.get("cajaId")?.toString();
    if (cajaTotal) cajasLiquidacion.push(cajaTotal);
  }
  const scopeDenied = await requireCajaPermission(cajasLiquidacion);
  if (scopeDenied) return scopeDenied;

  const ops = await prisma.operacionCambio.findMany({ where: { id: { in: ids } } });
  const eligibleOps = ops.filter(op => (op.pendiente || (op.descripcion ?? "").includes("[PARCIAL]")) && !esOpRevertida(op.descripcion));
  if (eligibleOps.length === 0) return { error: "No hay operaciones pendientes o parciales para liquidar" };
  // Montos parciales por caja aplican a UNA operación (no se replican sobre varias).
  if (modo === "parcial" && eligibleOps.length !== 1) return { error: "La liquidación parcial se hace de a una operación" };
  const userLiq = ((await auth())?.user as { name?: string })?.name ?? "Sistema";

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

      // MACRO 3: por operación, lock + liquidado neto (sin `contains`) + residual dentro de la tx.
      await prisma.$transaction(async (tx) => {
        for (const op of eligibleOps) {
          await liquidarCambioTx(tx, { opId: op.id, items: "TOTAL", cajaTotalId: cajaId, fecha, etiqueta: "Cobro Cambio", userName: userLiq });
        }
      }, { timeout: 15000 });

    } else {
      const cajasActivas = await prisma.caja.findMany({
        where: { activa: true, tipo: { in: ["CENTRAL_CONTABLE", "SUCURSAL_OPERATIVA"] } },
        select: { id: true, slug: true },
        orderBy: { orden: "asc" },
      });
      const activas = new Map(cajasActivas.map((c) => [c.id, c.slug]));
      // Un monto en una caja no operativa se rechaza (antes se descartaba en silencio).
      if (parciales.length === 0 || parciales.some((x) => !activas.has(x.cajaId))) {
        return { error: "Ingresá montos solo en cajas operativas" };
      }
      for (const x of parciales) { const slug = activas.get(x.cajaId); if (slug) slugsToRevalidate.add(slug); }

      // Sobreliquidación: liquidarCambioTx la rechaza bajo lock (Σ parciales ≤ pendiente).
      await prisma.$transaction(async (tx) => {
        await liquidarCambioTx(tx, {
          opId: eligibleOps[0].id, items: parciales.map((x) => ({ cajaId: x.cajaId, div: x.div, ars: x.ars })),
          fecha, etiqueta: "Cobro Cambio", userName: userLiq,
        });
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

  } catch (error: unknown) {
    console.error("Error liquidating pending payment:", error);
    return { error: mensajeError(error, "Error al liquidar el pago") };
  }
}

export async function revertirOperacionCambio(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const denied = await requireActionPermission("cambio:operar");
  if (denied) return denied;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "ID requerido" };

  const op = await prisma.operacionCambio.findUnique({ where: { id } });
  if (!op) return { error: "Operación no encontrada" };

  // El operador registrado es siempre el usuario autenticado real.
  const sessionRev = await auth();
  const revertidoPor = (sessionRev?.user as { name?: string })?.name ?? "Sistema";

  // Revertir toca las cajas donde se liquidó: mismo scope Trenque/Oficina.
  // MACRO 3: patas por vínculo estructurado / prefijo exacto (no `contains`).
  const cajas = Array.from(new Set((await movimientosDeCambio(prisma, id)).map((m) => m.cajaId)));
  const scopeDenied = await requireCajaPermission(cajas);
  if (scopeDenied) return scopeDenied;

  const hoy = new Date();
  const fechaRev = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));

  try {
    // Lock de la operación; inverso del NETO de caja y de CC; idempotente.
    await prisma.$transaction((tx) => revertirCambioTx(tx, { opId: id, revertidoPor, fecha: fechaRev, cajasAutorizadas: cajas }), { timeout: 15000 });

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
  } catch (e: unknown) {
    return { error: mensajeError(e, "Error al revertir la operación") };
  }
}
