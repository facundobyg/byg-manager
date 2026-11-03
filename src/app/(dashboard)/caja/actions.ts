"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { calcularSaldoCaja, calcularSaldoCajaConCliente } from "@/lib/services/caja.service";
import { readOnlyPreview } from "@/lib/config";
import { requireActionPermission, requireCajaPermission } from "@/lib/auth/permissions";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/services/audit.service";
import type { TipoOperacionCambio } from "@prisma/client";
import { esMonedaValida, esTipoManual, parseMontoPositivo, validarTextoUsuario } from "@/lib/caja/integridad";
import {
  IntegridadError, anularPendienteTx, cajasDeReversion, confirmarPendienteTx, cubrirParcialTx, liquidarCambioTx, lockCaja,
  revertirMovimientoTx,
} from "@/lib/caja/integridad.service";

/** Mensaje seguro: los errores de integridad son para el usuario; el resto, genérico. */
function mensajeError(e: unknown, generico: string): string {
  return e instanceof IntegridadError ? e.message : generico;
}

export async function crearMovimientoCaja(prevState: any, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const operationRef = crypto.randomUUID();
  const cajaId = formData.get("cajaId") as string;
  const tipo = formData.get("tipo") as string;
  const montoRaw = formData.get("monto") as string;
  const moneda = formData.get("moneda") as string;
  const descripcion = formData.get("descripcion") as string;
  const slug = formData.get("slug") as string; // kept for revalidatePath only — not used for auth

  // Scope de la caja resuelto desde DB (Caja.tipo), nunca desde el cliente.
  const denied = await requireCajaPermission([cajaId]);
  if (denied) return denied;

  if (!cajaId || !tipo || !montoRaw || !moneda) {
    return { error: "Faltan datos obligatorios" };
  }
  // MACRO 3: solo ENTRADA/SALIDA (una TRANSFERENCIA_* suelta dejaría una sola pata),
  // moneda válida y monto decimal estricto > 0.
  if (!esTipoManual(tipo)) return { error: "Tipo inválido" };
  if (!esMonedaValida(moneda)) return { error: "Moneda inválida" };
  const monto = parseMontoPositivo(montoRaw);
  if (!monto) return { error: "Monto inválido: usá solo números mayores a 0 (ej. 1500 o 1500,50)" };
  // L1: la descripción queda al inicio → no puede fabricar "REVERSO | ref:…", "[Cambio …]", etc.
  const textoError = validarTextoUsuario(descripcion);
  if (textoError) return { error: textoError };

  try {
    const session = await auth();
    const userName = (session?.user as { name?: string })?.name ?? "Sistema";
    const descFinal = `${descripcion?.trim() || "MOV"} | op:${operationRef} | usr:${userName}`;

    await prisma.movimientoCaja.create({
      data: {
        id: crypto.randomUUID(),
        cajaId,
        tipo,
        monto,
        moneda,
        descripcion: descFinal,
        confirmado: true,
        fecha: new Date(),
      },
    });

    revalidatePath("/caja");
    if (slug) {
      revalidatePath(`/caja/${slug}`);
    }

    return { success: true, message: "Movimiento creado exitosamente" };
  } catch (error) {
    return { error: "Error al guardar el movimiento" };
  }
}

export async function cubrirParcialMovimientoCaja(prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const movimientoId = (formData.get("movimientoId") as string)?.trim();
  const cajaId = (formData.get("cajaId") as string)?.trim();
  const montoCubiertoRaw = (formData.get("montoCubierto") as string)?.trim();

  if (!movimientoId || !cajaId || !montoCubiertoRaw) return { error: "Faltan datos obligatorios" };

  // Se exige scope sobre AMBAS cajas: la del pendiente original (desde DB) y la
  // del pago. Cubrir un pendiente de Oficina con efectivo de Trenque (o al
  // revés) requiere permiso sobre las dos; si no, transferencia interna explícita.
  const originalScope = await prisma.movimientoCaja.findUnique({ where: { id: movimientoId }, select: { cajaId: true } });
  if (!originalScope) return { error: "Movimiento no encontrado" };
  const cubrirDenied = await requireCajaPermission([originalScope.cajaId, cajaId]);
  if (cubrirDenied) return cubrirDenied;

  const montoCubierto = parseMontoPositivo(montoCubiertoRaw);
  if (!montoCubierto) return { error: "Monto inválido: usá solo números mayores a 0" };

  const session  = await auth();
  const userId   = session?.user?.id as string | undefined;
  const userName = (session?.user as { name?: string })?.name ?? "Sistema";

  const pagoId = crypto.randomUUID();
  let monedaPago = "";

  try {
    // MACRO 3: lock del pendiente + residual con pagos VÁLIDOS (no revertidos) dentro de la tx.
    const r = await prisma.$transaction((tx) => cubrirParcialTx(tx, {
      movimientoId, cajaOriginalEsperada: originalScope.cajaId, cajaPagoId: cajaId, monto: montoCubierto, userName, pagoId,
    }));
    monedaPago = r.moneda;
  } catch (error: unknown) {
    return { error: mensajeError(error, "Error al registrar cobertura") };
  }

  await writeAuditLog({
    userId,
    accion:      "CUBRIR_PARCIAL",
    entidad:     "MovimientoCaja",
    entidadId:   movimientoId,
    description: `${userName} registró pago parcial de ${montoCubierto.toFixed(2)} ${monedaPago} sobre pendiente ${movimientoId} (pago: ${pagoId})`,
  });

  revalidatePath("/pendientes");
  revalidatePath("/caja");
  const cajasTocadas = await prisma.caja.findMany({
    where: { id: { in: [cajaId, originalScope.cajaId] } },
    select: { slug: true },
  });
  for (const c of cajasTocadas) revalidatePath(`/operativa/${c.slug}`);

  return { success: true };
}

export async function anularMovimientoCajaPendiente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const anularDenied = await requireActionPermission("caja:eliminar_movimiento");
  if (anularDenied) return anularDenied;

  const movimientoId = formData.get("movimientoId")?.toString().trim();
  const motivo       = formData.get("motivo")?.toString().trim();
  if (!movimientoId) return { error: "ID requerido" };
  if (!motivo) return { error: "El motivo es obligatorio" };
  const motivoError = validarTextoUsuario(motivo, "El motivo");
  if (motivoError) return { error: motivoError };

  const movScope = await prisma.movimientoCaja.findUnique({ where: { id: movimientoId }, select: { cajaId: true } });
  if (!movScope) return { error: "Movimiento no encontrado" };
  const scopeDenied = await requireCajaPermission([movScope.cajaId]);
  if (scopeDenied) return scopeDenied;

  const session  = await auth();
  const userId   = session?.user?.id as string | undefined;
  const userName = (session?.user as { name?: string })?.name ?? "Sistema";

  try {
    // MACRO 3: lock del pendiente; pagos válidos (no revertidos) verificados dentro de la tx.
    await prisma.$transaction((tx) => anularPendienteTx(tx, { movimientoId, motivo, userName }));
  } catch (e: unknown) {
    return { error: mensajeError(e, "Error al anular el movimiento") };
  }

  await writeAuditLog({
    userId,
    accion:      "ANULAR_PENDIENTE",
    entidad:     "MovimientoCaja",
    entidadId:   movimientoId,
    description: `${userName} anuló pendiente ${movimientoId}: ${motivo}`,
  });

  revalidatePath("/pendientes");
  revalidatePath("/caja");
  return { ok: true };
}

export async function transferirEntreCajas(prevState: any, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const transferirDenied = await requireActionPermission("caja:transferir");
  if (transferirDenied) return transferirDenied;
  const origenId = formData.get("origenId") as string;
  const destinoId = formData.get("destinoId") as string;
  const moneda = formData.get("moneda") as string;
  const descripcion = formData.get("descripcion") as string;

  // MACRO 3: monto estricto > 0 (antes `new Decimal(raw)` aceptaba hex/exponentes y lanzaba con basura).
  const monto = parseMontoPositivo(formData.get("monto") as string);
  if (!monto) return { error: "Monto inválido: usá solo números mayores a 0" };

  // VALIDACIONES BASE
  if (!origenId || !destinoId || origenId === destinoId) {
    return { error: "Datos inválidos" };
  }

  const scopeDenied = await requireCajaPermission([origenId, destinoId]);
  if (scopeDenied) return scopeDenied;

  if (!["USD", "ARS"].includes(moneda)) {
    return { error: "Moneda inválida" };
  }

  // GENERAR ID DE TRANSFERENCIA
  const transferenciaRef = crypto.randomUUID();

  // TRANSACCIÓN ATÓMICA
  try {
    await prisma.$transaction(async (tx) => {
      // Saldo calculado dentro de la transacción y con la caja origen bloqueada:
      // dos transferencias concurrentes no pueden dejarla en negativo.
      await lockCaja(tx, origenId);
      const saldo = await calcularSaldoCajaConCliente(tx, origenId, moneda as "USD" | "ARS");
      if (saldo.lessThan(monto)) throw new Error("Saldo insuficiente en la caja origen");

      await tx.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId: origenId,
          tipo: "TRANSFERENCIA_OUT" as never,
          monto,
          moneda: moneda as never,
          descripcion: `TRANSFERENCIA | op:${transferenciaRef}`,
          confirmado: true,
          fecha: new Date(),
          transferenciaRef,
        },
      });
      await tx.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId: destinoId,
          tipo: "TRANSFERENCIA_IN" as never,
          monto,
          moneda: moneda as never,
          descripcion: `TRANSFERENCIA | op:${transferenciaRef}`,
          confirmado: true,
          fecha: new Date(),
          transferenciaRef,
        },
      });
    });

    revalidatePath("/caja");

    return { success: true };
  } catch (error) {
    return { error: (error instanceof Error ? error.message : null) || "Error crítico al ejecutar la transferencia" };
  }
}

// L2 — Cambio entre cajas = una OperacionCambio REAL: el motor financiero la ve
// (posición FX, costo promedio, resultado realizado) y sus dos patas quedan
// vinculadas por operacionCambioId. Operación + patas en UNA transacción.
// COMPRA: ARS sale de cajaArs, divisa entra en cajaDivisa
// VENTA:  divisa sale de cajaDivisa, ARS entra en cajaArs
export async function registrarOperacionCambioEnCajas(prevState: any, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const regCambioDenied = await requireActionPermission("cambio:operar");
  if (regCambioDenied) return regCambioDenied;

  const cajaDivisaId = (formData.get("cajaDivisaId") as string)?.trim();
  const cajaArsId = (formData.get("cajaArsId") as string)?.trim();
  const montoDivisaRaw = (formData.get("montoDivisa") as string)?.trim();
  const montoArsRaw = (formData.get("montoArs") as string)?.trim();
  const tipoOperacion = (formData.get("tipoOperacion") as string)?.trim();
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const moneda = ((formData.get("moneda") as string)?.trim() || "USD") as "USD" | "ARS" | "EUR" | "BRL";

  if (!cajaDivisaId || !cajaArsId) return { error: "Cajas requeridas" };
  const scopeDenied = await requireCajaPermission([cajaDivisaId, cajaArsId]);
  if (scopeDenied) return scopeDenied;
  if (!tipoOperacion || !["COMPRA", "VENTA"].includes(tipoOperacion)) return { error: "tipoOperacion debe ser COMPRA o VENTA" };

  if (!esMonedaValida(moneda) || moneda === "ARS") return { error: "Moneda inválida" };
  const montoDivisa = parseMontoPositivo(montoDivisaRaw);
  const montoArs = parseMontoPositivo(montoArsRaw);
  if (!montoDivisa || !montoArs) return { error: "Montos inválidos: usá solo números mayores a 0" };
  const textoError = validarTextoUsuario(descripcion);
  if (textoError) return { error: textoError };

  // TC implícito = ARS / divisa (Decimal(12,4)); totalARS = monto ARS exacto de la pata.
  const tipoCambio = montoArs.div(montoDivisa).toDecimalPlaces(4);
  if (!tipoCambio.gt(0) || tipoCambio.gte(100_000_000)) return { error: "Tipo de cambio implícito fuera de rango" };

  try {
    const [cajaDivisa, cajaArs] = await Promise.all([
      prisma.caja.findUnique({ where: { id: cajaDivisaId } }),
      prisma.caja.findUnique({ where: { id: cajaArsId } }),
    ]);
    if (!cajaDivisa) return { error: "Caja divisa no encontrada" };
    if (!cajaArs) return { error: "Caja ARS no encontrada" };
  } catch {
    return { error: "Error validando cajas" };
  }

  const session = await auth();
  const userName = (session?.user as { name?: string })?.name ?? "Sistema";
  const ahora = new Date();
  const fecha = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  const mesContable = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
  const tipo = `${tipoOperacion}_${moneda}` as TipoOperacionCambio;

  try {
    await prisma.$transaction(async (tx) => {
      // Saldo calculado dentro de la transacción para evitar TOCTOU.
      if (tipoOperacion === "COMPRA") {
        await lockCaja(tx, cajaArsId);
        const saldoArs = await calcularSaldoCajaConCliente(tx, cajaArsId, "ARS");
        if (saldoArs.lessThan(montoArs)) throw new IntegridadError("Saldo ARS insuficiente en caja seleccionada");
      }

      const op = await tx.operacionCambio.create({
        data: {
          id: crypto.randomUUID(),
          fecha,
          tipo,
          clienteNombre: "Cambio entre cajas",
          moneda,
          cantidad: montoDivisa,
          tipoCambio,
          totalARS: montoArs,
          cobroUSD: moneda === "USD" ? montoDivisa : new Decimal(0),
          cobroARS: montoArs,
          descripcion: `${descripcion || "Operación de cambio entre cajas"} | usr:${userName}`,
          pendiente: true, // liquidarCambioTx la marca liquidada al crear las patas
          mesContable,
          updatedAt: new Date(),
        },
      });

      // Patas con operacionCambioId: divisa en cajaDivisa, ARS (monto exacto) en cajaArs.
      await liquidarCambioTx(tx, {
        opId: op.id,
        items: [{ cajaId: cajaDivisaId, cajaArsId, div: montoDivisa, ars: montoArs }],
        fecha, etiqueta: "Cambio", userName,
      });
    });

    revalidatePath("/caja");
    revalidatePath("/operativa/mov-diarios");
    return { success: true };
  } catch (e: unknown) {
    return { error: mensajeError(e, "Error al registrar operación de cambio") };
  }
}

export async function revertirMovimientoCaja(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const revertirCajaDenied = await requireActionPermission("caja:eliminar_movimiento");
  if (revertirCajaDenied) return revertirCajaDenied;

  const movimientoId = formData.get("movimientoId")?.toString().trim();
  if (!movimientoId) return { error: "ID requerido" };

  // MACRO 3: una transferencia se revierte COMPLETA → scope sobre todas sus cajas.
  const cajas = await cajasDeReversion(prisma, movimientoId);
  if (cajas.length === 0) return { error: "Movimiento no encontrado" };
  const scopeDenied = await requireCajaPermission(cajas);
  if (scopeDenied) return scopeDenied;

  try {
    // Lock del movimiento (y de su par), estado e idempotencia verificados dentro de la tx.
    await prisma.$transaction((tx) => revertirMovimientoTx(tx, { movimientoId, cajasAutorizadas: cajas }));
  } catch (e: unknown) {
    return { error: mensajeError(e, "Error al revertir movimiento") };
  }

  revalidatePath("/caja");
  const slugs = await prisma.caja.findMany({ where: { id: { in: cajas } }, select: { slug: true } });
  for (const c of slugs) {
    revalidatePath(`/caja/${c.slug}`);
    revalidatePath(`/operativa/${c.slug}`);
  }
  return { ok: true };
}

export async function confirmarMovimientoCajaPendiente(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const movimientoId = formData.get("movimientoId")?.toString().trim();
  if (!movimientoId) return { error: "ID requerido" };

  // Confirmar un pendiente es operar la caja donde vive: Trenque u Oficina.
  const movScope = await prisma.movimientoCaja.findUnique({ where: { id: movimientoId }, select: { cajaId: true } });
  if (!movScope) return { error: "Movimiento no encontrado" };
  const confirmarDenied = await requireCajaPermission([movScope.cajaId]);
  if (confirmarDenied) return confirmarDenied;
  // El código anterior exigía caja:operar_oficina para confirmar en CUALQUIER caja
  // (B ⊆ A). Solo un override explícito de Trenque lo reemplaza (política materializada).
  const confirmarOficinaDenied = await requireActionPermission("caja:operar_oficina", { orExplicitGrant: "caja:operar_trenque" });
  if (confirmarOficinaDenied) return confirmarOficinaDenied;

  const session = await auth();
  const userName = (session?.user as { name?: string })?.name ?? "Sistema";
  try {
    // MACRO 3: con pagos parciales solo se impacta el RESIDUAL (nunca monto + parciales);
    // lock del pendiente → dos confirmaciones concurrentes: una sola aplica.
    await prisma.$transaction((tx) => confirmarPendienteTx(tx, { movimientoId, cajaEsperada: movScope.cajaId, userName }));
  } catch (e: unknown) {
    return { error: mensajeError(e, "Error al confirmar movimiento") };
  }

  revalidatePath("/caja");
  return { ok: true };
}

export async function transferirCajaACartera(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const cajACarteraDenied = await requireActionPermission("caja:transferir");
  if (cajACarteraDenied) return cajACarteraDenied;

  const cajaId       = formData.get("cajaId")?.toString().trim();
  const carteraId    = formData.get("carteraId")?.toString().trim();
  const moneda       = formData.get("moneda")?.toString().trim() as "USD" | "ARS" | undefined;
  const destinoSaldo = formData.get("destinoSaldo")?.toString().trim() as "CABLE" | "MEP" | "PESOS" | undefined;
  const montoRaw     = formData.get("monto")?.toString().trim();
  const descripcion  = formData.get("descripcion")?.toString().trim() || null;

  if (!cajaId || !carteraId || !moneda || !destinoSaldo || !montoRaw) {
    return { error: "Faltan datos obligatorios" };
  }
  const scopeDenied = await requireCajaPermission([cajaId]);
  if (scopeDenied) return scopeDenied;

  // L4: decimal estricto > 0 (new Decimal("NaN") pasaba lte(0) y llegaba a la DB).
  const monto = parseMontoPositivo(montoRaw);
  if (!monto) return { error: "Monto inválido: usá solo números mayores a 0" };
  const textoError = validarTextoUsuario(descripcion);
  if (textoError) return { error: textoError };

  // Validate moneda ↔ destinoSaldo compatibility
  if (moneda === "USD" && destinoSaldo === "PESOS") {
    return { error: "USD no puede ir a saldo Pesos" };
  }
  if (moneda === "ARS" && (destinoSaldo === "CABLE" || destinoSaldo === "MEP")) {
    return { error: "ARS solo puede ir a saldo Pesos" };
  }

  // Verify caja and cartera exist
  const [caja, cartera] = await Promise.all([
    prisma.caja.findUnique({ where: { id: cajaId }, select: { id: true, label: true } }),
    prisma.cartera.findUnique({ where: { id: carteraId }, select: { id: true, nombre: true, slug: true } }),
  ]);
  if (!caja)    return { error: "Caja no encontrada" };
  if (!cartera) return { error: "Cartera no encontrada" };

  // Validate caja has sufficient balance
  try {
    const saldo = await calcularSaldoCaja(cajaId, moneda);
    if (saldo.lessThan(monto)) {
      return { error: `Saldo insuficiente en caja. Disponible: ${moneda} ${saldo.toFixed(2)}` };
    }
  } catch {
    return { error: "Error al calcular saldo de caja" };
  }

  const desc = [
    `Transferencia interna a cartera ${cartera.nombre}`,
    descripcion,
  ].filter(Boolean).join(" | ");

  // Build cartera increment field
  const carteraData =
    destinoSaldo === "CABLE" ? { saldoUSDCable: { increment: monto } } :
    destinoSaldo === "MEP"   ? { saldoUSDMep:   { increment: monto } } :
                               { saldoPesos:     { increment: monto } };

  try {
    await prisma.$transaction([
      prisma.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId,
          tipo: "TRANSFERENCIA_OUT",
          monto,
          moneda,
          descripcion: desc,
          confirmado: true,
          fecha: new Date(),
        },
      }),
      prisma.cartera.update({
        where: { id: carteraId },
        data: carteraData,
      }),
    ]);

    revalidatePath("/caja");
    revalidatePath("/carteras", "layout");
    if (cartera.slug) revalidatePath(`/carteras/${cartera.slug}`);

    return { success: true };
  } catch (e) {
    return { error: mensajeError(e, "Error al ejecutar la transferencia") };
  }
}

export async function transferirCarteraACaja(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const carteraACajaDenied = await requireActionPermission("caja:transferir");
  if (carteraACajaDenied) return carteraACajaDenied;

  const carteraId   = formData.get("carteraId")?.toString().trim();
  const cajaId      = formData.get("cajaId")?.toString().trim();
  const origenSaldo = formData.get("origenSaldo")?.toString().trim() as "CABLE" | "MEP" | "PESOS" | undefined;
  const montoRaw    = formData.get("monto")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim() || null;

  if (!carteraId || !cajaId || !origenSaldo || !montoRaw) {
    return { error: "Faltan datos obligatorios" };
  }
  const scopeDenied = await requireCajaPermission([cajaId]);
  if (scopeDenied) return scopeDenied;

  // L4: decimal estricto > 0 (new Decimal("NaN") pasaba lte(0) y llegaba a la DB).
  const monto = parseMontoPositivo(montoRaw);
  if (!monto) return { error: "Monto inválido: usá solo números mayores a 0" };
  const textoError = validarTextoUsuario(descripcion);
  if (textoError) return { error: textoError };

  const moneda: "USD" | "ARS" = origenSaldo === "PESOS" ? "ARS" : "USD";

  const [cartera, caja] = await Promise.all([
    prisma.cartera.findUnique({
      where: { id: carteraId },
      select: { id: true, nombre: true, slug: true, saldoUSDCable: true, saldoUSDMep: true, saldoPesos: true },
    }),
    prisma.caja.findUnique({ where: { id: cajaId }, select: { id: true, label: true } }),
  ]);
  if (!cartera) return { error: "Cartera no encontrada" };
  if (!caja)    return { error: "Caja no encontrada" };

  // Validate sufficient cartera saldo
  const saldoDisponible = new Decimal(
    origenSaldo === "CABLE" ? cartera.saldoUSDCable.toString() :
    origenSaldo === "MEP"   ? cartera.saldoUSDMep.toString() :
                              cartera.saldoPesos.toString()
  );
  if (monto.gt(saldoDisponible)) {
    return { error: `Saldo insuficiente en cartera. Disponible: ${moneda} ${saldoDisponible.toFixed(2)}` };
  }

  const desc = [
    `Transferencia interna desde cartera ${cartera.nombre}`,
    descripcion,
  ].filter(Boolean).join(" | ");

  const carteraData =
    origenSaldo === "CABLE" ? { saldoUSDCable: { decrement: monto } } :
    origenSaldo === "MEP"   ? { saldoUSDMep:   { decrement: monto } } :
                              { saldoPesos:     { decrement: monto } };

  try {
    // MACRO 5: saldo de cartera revalidado bajo lock de la cartera (dos retiros
    // concurrentes no pueden dejarla en negativo; serializa con concertaciones).
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Cartera" WHERE id = ${carteraId} FOR UPDATE`;
      const c = await tx.cartera.findUniqueOrThrow({ where: { id: carteraId }, select: { saldoUSDCable: true, saldoUSDMep: true, saldoPesos: true } });
      const disponible = new Decimal((origenSaldo === "CABLE" ? c.saldoUSDCable : origenSaldo === "MEP" ? c.saldoUSDMep : c.saldoPesos).toString());
      if (monto.gt(disponible)) throw new IntegridadError(`Saldo insuficiente en cartera. Disponible: ${moneda} ${disponible.toFixed(2)}`);
      await tx.cartera.update({ where: { id: carteraId }, data: carteraData });
      await tx.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(),
          cajaId,
          tipo: "TRANSFERENCIA_IN",
          monto,
          moneda,
          descripcion: desc,
          confirmado: true,
          fecha: new Date(),
        },
      });
    });

    revalidatePath("/caja");
    revalidatePath("/carteras", "layout");
    if (cartera.slug) revalidatePath(`/carteras/${cartera.slug}`);

    return { success: true };
  } catch (e) {
    return { error: mensajeError(e, "Error al ejecutar la transferencia") };
  }
}
