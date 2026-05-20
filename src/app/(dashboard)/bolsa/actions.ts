"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { readOnlyPreview } from "@/lib/config";
import { writeAuditLog } from "@/lib/services/audit.service";
import { requireActionPermission } from "@/lib/auth/permissions";
import type { TipoOpBolsa, MercadoBolsa, Moneda, CategoriaHoldingInversion } from "@prisma/client";

const VENTA_TIPOS = new Set<string>(["VENTA_BONO", "VENTA_ACCION", "VENTA_CEDEAR", "CAUCION_COLOCADORA"]);
const COMPRA_ACTIVO = new Set<string>(["COMPRA_BONO", "COMPRA_ACCION", "COMPRA_CEDEAR"]);
const VENTA_ACTIVO  = new Set<string>(["VENTA_BONO",  "VENTA_ACCION",  "VENTA_CEDEAR"]);

const TIPO_TO_HOLDING: Record<string, CategoriaHoldingInversion> = {
  COMPRA_BONO:        "BONO",
  VENTA_BONO:         "BONO",
  COMPRA_ACCION:      "ACCION",
  VENTA_ACCION:       "ACCION",
  COMPRA_CEDEAR:      "CEDEAR",
  VENTA_CEDEAR:       "CEDEAR",
  CAUCION_COLOCADORA: "CAUCION",
  CAUCION_TOMADORA:   "CAUCION",
};

function toN(v: FormDataEntryValue | null): number | null {
  if (!v) return null;
  const n = parseFloat(v as string);
  return isNaN(n) ? null : n;
}

// ── CREAR ──────────────────────────────────────────────────────────────────

export async function crearOperacionBolsa(prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const denied = await requireActionPermission("bolsa:crear");
  if (denied) return denied;

  const session = await auth();
  const userId = session?.user?.id as string | undefined;
  if (!userId) return { error: "Sin sesión activa" };

  const sujetoTipo    = formData.get("sujetoTipo") as string;
  const comitenteId   = (formData.get("comitenteId") as string) || null;
  const carteraId     = (formData.get("carteraId") as string) || null;
  const tipoRaw       = formData.get("tipoOperacion") as string;
  const ticker        = (formData.get("ticker") as string)?.trim().toUpperCase();
  const cantidadRaw   = formData.get("cantidad") as string;
  const precioRaw     = formData.get("precio") as string;
  const moneda        = formData.get("moneda") as string;
  const mercado       = formData.get("mercado") as string;
  const observaciones = (formData.get("observaciones") as string)?.trim() || null;

  if (!tipoRaw || !ticker || !cantidadRaw || !precioRaw || !moneda || !mercado)
    return { error: "Faltan campos obligatorios" };
  if (sujetoTipo === "comitente" && !comitenteId)
    return { error: "Seleccionar comitente" };
  if (sujetoTipo === "cartera" && !carteraId)
    return { error: "Seleccionar cartera" };

  const cantidad = parseFloat(cantidadRaw);
  const precio   = parseFloat(precioRaw);
  if (isNaN(cantidad) || cantidad <= 0) return { error: "Cantidad inválida" };
  if (isNaN(precio)   || precio   <= 0) return { error: "Precio inválido" };

  try {
    const now = new Date();
    const id  = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.operacionBolsa.create({
        data: {
          id,
          comitenteId:     sujetoTipo === "comitente" ? comitenteId : null,
          carteraId:       sujetoTipo === "cartera" ? carteraId : null,
          tipoOperacion:   tipoRaw as TipoOpBolsa,
          ticker,
          cantidad,
          precio,
          moneda:          moneda  as Moneda,
          mercado:         mercado as MercadoBolsa,
          observaciones,
          operadorCargaId: userId,
          estado:          "PENDIENTE_CONCERTACION",
          updatedAt:       now,
        },
      });
      await tx.operacionBolsaLog.create({
        data: {
          id:          crypto.randomUUID(),
          operacionId: id,
          userId,
          accion:      "CARGA",
          estadoNuevo: "PENDIENTE_CONCERTACION",
          snapshot:    { ticker, cantidad, precio, moneda, mercado, tipoOperacion: tipoRaw },
        },
      });
    });

    revalidatePath("/bolsa");
    return { ok: true as const, id };
  } catch (e: unknown) {
    console.error("[crearOperacionBolsa]", e);
    return { error: "Error al guardar la operación. Verificar datos ingresados." };
  }
}

// ── CONCERTAR ──────────────────────────────────────────────────────────────

export async function concertarOperacion(prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const denied = await requireActionPermission("bolsa:concertar");
  if (denied) return denied;

  const session = await auth();
  const userId  = session?.user?.id as string | undefined;
  if (!userId) return { error: "Sin sesión activa" };

  const operacionId = formData.get("operacionId") as string;
  if (!operacionId) return { error: "ID operación requerido" };

  const op = await prisma.operacionBolsa.findUnique({ where: { id: operacionId } });
  if (!op) return { error: "Operación no encontrada" };
  if (op.estado === "ANULADA")   return { error: "Operación anulada, no modificable" };
  if (op.estado === "LIQUIDADA") return { error: "Operación liquidada, no modificable" };

  const nroBoleto         = (formData.get("nroBoleto")   as string)?.trim() || null;
  const alyc              = (formData.get("alyc")         as string)?.trim() || null;
  const fechaConcertRaw   = formData.get("fechaConcertacion")  as string | null;
  const fechaLiquidRaw    = formData.get("fechaLiquidacion")   as string | null;
  const comisionPct          = toN(formData.get("comisionPct"));
  const comisionFija         = toN(formData.get("comisionFija"));
  const derechosMercado      = toN(formData.get("derechosMercado"));
  const gastos               = toN(formData.get("gastos"));
  const impuestos            = toN(formData.get("impuestos"));
  const tcMepDia             = toN(formData.get("tcMepDia"));
  const comisionUSD          = toN(formData.get("comisionUSD"));
  const netoLiquidadoManual  = toN(formData.get("netoLiquidadoManual"));
  const esSenebi          = formData.get("esSenebi") === "true";
  const senebiBruto       = esSenebi ? toN(formData.get("senebiBruto")) : null;
  const diasCaucionRaw    = formData.get("diasCaucion") as string | null;
  const diasCaucion       = diasCaucionRaw ? parseInt(diasCaucionRaw) : null;
  const tasaCaucion       = toN(formData.get("tasaCaucion"));

  // Calculations
  const cantidad    = Number(op.cantidad);
  const precio      = Number(op.precio);
  const valorBruto  = cantidad * precio;
  const costoReal   = (comisionFija ?? 0)
    + valorBruto * ((comisionPct ?? 0) / 100)
    + (derechosMercado ?? 0)
    + (gastos ?? 0)
    + (impuestos ?? 0);
  const esVenta         = VENTA_TIPOS.has(op.tipoOperacion as string);
  const netoCalculado   = esVenta ? valorBruto - costoReal : valorBruto + costoReal;
  const netoLiquidado   = netoLiquidadoManual ?? netoCalculado;
  const precioPromedioReal = !esVenta && cantidad > 0 ? netoLiquidado / cantidad : null;

  const isNewConcertation = op.estado === "PENDIENTE_CONCERTACION";

  try {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.operacionBolsa.update({
        where: { id: operacionId },
        data: {
          estado:           "CONCERTADA",
          operadorCierreId: userId,
          nroBoleto,
          alyc,
          fechaConcertacion:  fechaConcertRaw  ? new Date(fechaConcertRaw)  : null,
          fechaLiquidacion:   fechaLiquidRaw   ? new Date(fechaLiquidRaw)   : null,
          comisionPct,
          comisionFija,
          derechosMercado,
          gastos,
          impuestos,
          tcMepDia,
          comisionUSD,
          esSenebi,
          senebiBruto,
          diasCaucion:        isNaN(diasCaucion as number) ? null : diasCaucion,
          tasaCaucion,
          costoReal,
          netoLiquidado,
          precioPromedioReal,
          updatedAt:          now,
        },
      });
      await tx.operacionBolsaLog.create({
        data: {
          id:            crypto.randomUUID(),
          operacionId,
          userId,
          accion:        isNewConcertation ? "CONCERTACION" : "EDICION",
          estadoAnterior: op.estado,
          estadoNuevo:   "CONCERTADA",
          snapshot:      { nroBoleto, alyc, costoReal, netoLiquidado, precioPromedioReal },
        },
      });

      // ── Impacto en comitente (solo primera concertación, solo compra/venta activos) ──
      if (isNewConcertation && op.comitenteId) {
        const holdingCat = TIPO_TO_HOLDING[op.tipoOperacion as string];
        const isCompra   = COMPRA_ACTIVO.has(op.tipoOperacion as string);
        const isVenta    = VENTA_ACTIVO.has(op.tipoOperacion as string);

        if ((isCompra || isVenta) && holdingCat) {
          // 1. Actualizar saldo disponible
          const saldoActual = await tx.saldoComitenteInversion.findUnique({
            where: { comitenteId: op.comitenteId },
          });
          const delta = Math.abs(netoLiquidado);
          const saldoData = op.moneda === "ARS"
            ? { saldoARS: (Number(saldoActual?.saldoARS ?? 0) + (isVenta ? delta : -delta)) }
            : { saldoUSDCable: (Number(saldoActual?.saldoUSDCable ?? 0) + (isVenta ? delta : -delta)) };

          await tx.saldoComitenteInversion.upsert({
            where:  { comitenteId: op.comitenteId },
            update: { ...saldoData, updatedAt: new Date() },
            create: {
              id: crypto.randomUUID(),
              comitenteId: op.comitenteId,
              saldoARS: 0, saldoUSDCable: 0, saldoUSDMep: 0,
              ...saldoData,
              updatedAt: new Date(),
            },
          });

          // 2. Actualizar holding
          const existing = await tx.holdingComitenteInversion.findUnique({
            where: { comitenteId_ticker: { comitenteId: op.comitenteId, ticker: op.ticker } },
          });

          if (isCompra) {
            const precioReal = precioPromedioReal ?? precio;
            if (existing) {
              const existQty    = Number(existing.cantidad);
              const newQty      = existQty + cantidad;
              const newPrecioP  = (existQty * Number(existing.precioPromedio) + cantidad * precioReal) / newQty;
              await tx.holdingComitenteInversion.update({
                where: { id: existing.id },
                data:  { cantidad: newQty, precioPromedio: newPrecioP, updatedAt: new Date() },
              });
            } else {
              await tx.holdingComitenteInversion.create({
                data: {
                  id: crypto.randomUUID(),
                  comitenteId: op.comitenteId,
                  ticker:      op.ticker,
                  categoria:   holdingCat,
                  cantidad,
                  precioPromedio: precioReal,
                  updatedAt: new Date(),
                },
              });
            }
            await tx.operacionHoldingInversion.create({
              data: {
                id:          crypto.randomUUID(),
                comitenteId: op.comitenteId,
                holdingId:   existing?.id ?? null,
                tipo:        "COMPRA",
                ticker:      op.ticker,
                categoria:   holdingCat,
                cantidad,
                precio,
                precioPromedio: precioPromedioReal ?? precio,
                notas:       `Bolsa #${operacionId.slice(0, 8)}`,
              },
            });
          } else if (isVenta && existing) {
            const existQty = Number(existing.cantidad);
            const newQty   = Math.max(0, existQty - cantidad);
            if (newQty === 0) {
              await tx.holdingComitenteInversion.delete({ where: { id: existing.id } });
            } else {
              await tx.holdingComitenteInversion.update({
                where: { id: existing.id },
                data:  { cantidad: newQty, updatedAt: new Date() },
              });
            }
            await tx.operacionHoldingInversion.create({
              data: {
                id:          crypto.randomUUID(),
                comitenteId: op.comitenteId,
                holdingId:   existing.id,
                tipo:        "VENTA",
                ticker:      op.ticker,
                categoria:   holdingCat,
                cantidad,
                precio,
                precioPromedio: Number(existing.precioPromedio),
                notas:       `Bolsa #${operacionId.slice(0, 8)}`,
              },
            });
          }
        }
      }
    });

    const session = await auth();
    const userName = (session?.user as { name?: string } | undefined)?.name ?? "Usuario";
    const sujetoLabel = op.comitenteId ? `comitente ${op.comitenteId.slice(0, 8)}` : (op.carteraId ? "cartera propia" : "—");
    await writeAuditLog({
      userId,
      accion: isNewConcertation ? "CONCERTACION" : "EDICION_CONCERTACION",
      entidad: "OperacionBolsa",
      entidadId: operacionId,
      description: isNewConcertation
        ? `${userName} concertó ${op.tipoOperacion} ${op.ticker} (${sujetoLabel})`
        : `${userName} editó concertación ${op.tipoOperacion} ${op.ticker} (${sujetoLabel})`,
    });

    revalidatePath("/bolsa");
    revalidatePath(`/bolsa/${operacionId}`);
    revalidatePath("/cuentas-inversion", "layout");
    return { ok: true as const };
  } catch (e: unknown) {
    console.error("[concertarOperacion]", e);
    return { error: "Error al concertar la operación. Verificar datos y volver a intentar." };
  }
}

// ── CREAR (Mesa Diaria) ────────────────────────────────────────────────────

const CAUCION_TIPOS = new Set<string>(["CAUCION_COLOCADORA", "CAUCION_TOMADORA"]);

export async function crearOpMesaDiaria(_prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const denied = await requireActionPermission("bolsa:crear");
  if (denied) return denied;

  const session = await auth();
  const userId  = session?.user?.id as string | undefined;
  if (!userId) return { error: "Sin sesión activa" };

  const sujetoTipo    = formData.get("sujetoTipo") as string;
  const comitenteId   = (formData.get("comitenteId") as string) || null;
  const carteraId     = (formData.get("carteraId")   as string) || null;
  const tipoRaw       = formData.get("tipoOperacion") as string;
  const tickerRaw     = ((formData.get("ticker") as string) || "").trim().toUpperCase();
  const cantidadRaw   = formData.get("cantidad")  as string;
  const precioRaw     = formData.get("precio")    as string;
  const moneda        = formData.get("moneda")    as string;
  const mercado       = formData.get("mercado")   as string;
  const fechaOpRaw    = formData.get("fechaOperativa") as string;
  const observaciones = ((formData.get("observaciones") as string) || "").trim() || null;

  const resultadoBruto = toN(formData.get("resultadoBruto"));
  const resultadoNeto  = toN(formData.get("resultadoNeto"));
  const tcMepDia       = toN(formData.get("tcMepDia"));
  const tasaCaucion    = toN(formData.get("tasaCaucion"));
  const diasRaw        = formData.get("diasCaucion") as string | null;
  const diasCaucion    = diasRaw ? parseInt(diasRaw) : null;

  if (!tipoRaw || !cantidadRaw || !precioRaw || !moneda || !mercado)
    return { error: "Faltan campos obligatorios" };
  if (sujetoTipo === "comitente" && !comitenteId)
    return { error: "Seleccionar comitente" };
  if (sujetoTipo === "cartera" && !carteraId)
    return { error: "Seleccionar cartera" };

  const ticker = tickerRaw || (CAUCION_TIPOS.has(tipoRaw) ? "CAUCION" : "");
  if (!ticker) return { error: "Ticker requerido para este tipo de operación" };

  const cantidad = parseFloat(cantidadRaw);
  const precio   = parseFloat(precioRaw);
  if (isNaN(cantidad) || cantidad <= 0) return { error: "Cantidad inválida" };
  if (isNaN(precio)   || precio   <= 0) return { error: "Precio inválido" };

  const fechaOperativa = fechaOpRaw ? new Date(fechaOpRaw + "T00:00:00.000Z") : null;

  try {
    const now = new Date();
    const id  = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.operacionBolsa.create({
        data: {
          id,
          comitenteId:     sujetoTipo === "comitente" ? comitenteId : null,
          carteraId:       sujetoTipo === "cartera"   ? carteraId   : null,
          tipoOperacion:   tipoRaw as TipoOpBolsa,
          ticker,
          cantidad,
          precio,
          moneda:          moneda  as Moneda,
          mercado:         mercado as MercadoBolsa,
          observaciones,
          operadorCargaId: userId,
          estado:          "PENDIENTE_CONCERTACION",
          fechaOperativa,
          resultadoBruto,
          resultadoNeto,
          tcMepDia,
          tasaCaucion,
          diasCaucion:     diasCaucion !== null && !isNaN(diasCaucion) ? diasCaucion : null,
          updatedAt:       now,
        },
      });
      await tx.operacionBolsaLog.create({
        data: {
          id:          crypto.randomUUID(),
          operacionId: id,
          userId,
          accion:      "CARGA",
          estadoNuevo: "PENDIENTE_CONCERTACION",
          snapshot:    { ticker, cantidad, precio, moneda, mercado, tipoOperacion: tipoRaw, resultadoBruto, resultadoNeto },
        },
      });
    });

    revalidatePath("/bolsa");
    return { ok: true as const, id };
  } catch (e: unknown) {
    console.error("[crearOpMesaDiaria]", e);
    return { error: "Error al guardar la operación. Verificar datos ingresados." };
  }
}

// ── AGRUPAR ARBITRAJE ──────────────────────────────────────────────────────

export async function agruparOperacionesArbitraje(_prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const denied = await requireActionPermission("bolsa:crear");
  if (denied) return denied;

  const session = await auth();
  const userId  = session?.user?.id as string | undefined;
  if (!userId) return { error: "Sin sesión activa" };

  const idsRaw = (formData.get("operationIds") as string) || "";
  const ids    = idsRaw.split(",").map((s) => s.trim()).filter(Boolean);

  if (ids.length < 2) return { error: "Seleccionar al menos 2 operaciones" };

  const ops = await prisma.operacionBolsa.findMany({
    where:  { id: { in: ids } },
    select: { id: true, anulada: true, estado: true },
  });

  if (ops.length !== ids.length)                                   return { error: "Una o más operaciones no encontradas" };
  if (ops.some((o) => o.anulada))                                  return { error: "No se pueden agrupar operaciones anuladas" };
  if (ops.some((o) => o.estado !== "PENDIENTE_CONCERTACION"))      return { error: "Solo se pueden agrupar operaciones pendientes de revisión" };

  const grupoId = crypto.randomUUID().slice(0, 8).toUpperCase();

  await prisma.operacionBolsa.updateMany({
    where: { id: { in: ids } },
    data:  { grupoArbitrajeId: grupoId, updatedAt: new Date() },
  });

  revalidatePath("/bolsa");
  return { ok: true as const, grupoId };
}

// ── ANULAR ─────────────────────────────────────────────────────────────────

export async function anularOperacion(prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const denied = await requireActionPermission("bolsa:anular");
  if (denied) return denied;

  const session = await auth();
  const userId  = session?.user?.id as string | undefined;
  if (!userId) return { error: "Sin sesión activa" };

  const operacionId      = formData.get("operacionId")      as string;
  const motivoAnulacion  = (formData.get("motivoAnulacion") as string)?.trim();

  if (!operacionId)     return { error: "ID operación requerido" };
  if (!motivoAnulacion) return { error: "El motivo de anulación es obligatorio" };

  const op = await prisma.operacionBolsa.findUnique({ where: { id: operacionId } });
  if (!op)        return { error: "Operación no encontrada" };
  if (op.anulada) return { error: "Operación ya anulada" };

  try {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.operacionBolsa.update({
        where: { id: operacionId },
        data: { estado: "ANULADA", anulada: true, motivoAnulacion, updatedAt: now },
      });
      await tx.operacionBolsaLog.create({
        data: {
          id:            crypto.randomUUID(),
          operacionId,
          userId,
          accion:        "ANULACION",
          estadoAnterior: op.estado,
          estadoNuevo:   "ANULADA",
          snapshot:      { motivoAnulacion },
        },
      });
    });

    revalidatePath("/bolsa");
    revalidatePath(`/bolsa/${operacionId}`);
    return { ok: true as const };
  } catch (e: unknown) {
    return { error: (e as Error).message || "Error al anular operación" };
  }
}
