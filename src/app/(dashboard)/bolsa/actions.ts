"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { readOnlyPreview } from "@/lib/config";
import { writeAuditLog } from "@/lib/services/audit.service";
import { requireActionPermission } from "@/lib/auth/permissions";
import { setTcMepDia } from "@/lib/services/config.service";
import type { TipoOpBolsa, MercadoBolsa, Moneda, PlazoLiquidacion } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { parseMontoPositivo } from "@/lib/caja/integridad";
import { parseEnteroOpcional, parseOpcionalConSigno, parseOpcionalNoNegativo, parseSaldoUSD } from "@/lib/bolsa/integridad";
import { BolsaIntegridadError, anularOperacionTx, concertarOperacionTx, liquidarOperacionTx } from "@/lib/bolsa/integridad.service";

export async function actualizarTcMepDia(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const denied = await requireActionPermission("bolsa:crear");
  if (denied) return denied;
  const raw = formData.get("valor")?.toString().trim();
  if (!raw) return { error: "Valor requerido" };
  const valorDec = parseMontoPositivo(raw);
  if (!valorDec) return { error: "Valor inválido" };
  const valor = valorDec.toNumber();
  const session = await auth();
  await setTcMepDia(valor, session?.user?.id);
  await writeAuditLog({
    userId:      session?.user?.id,
    accion:      "SET_TC_MEP",
    entidad:     "TcMepHistorial",
    description: `TC MEP del día cargado: ${valor}`,
  });
  revalidatePath("/bolsa");
  return { ok: true };
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

  // MACRO 5: decimal estricto > 0 (parseFloat aceptaba "12abc", "1e3"…).
  const cantidad = parseMontoPositivo(cantidadRaw);
  const precio   = parseMontoPositivo(precioRaw);
  if (!cantidad) return { error: "Cantidad inválida" };
  if (!precio)   return { error: "Precio inválido" };

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
          snapshot:    { ticker, cantidad: cantidad.toString(), precio: precio.toString(), moneda, mercado, tipoOperacion: tipoRaw },
        },
      });
    });

    await writeAuditLog({
      userId,
      accion:      "CREAR",
      entidad:     "OperacionBolsa",
      entidadId:   id,
      description: `${(session?.user as { name?: string })?.name ?? "Sistema"} creó op bolsa ${tipoRaw} ${ticker} x${cantidad.toString()}`,
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

  const fechaConcertRaw   = formData.get("fechaConcertacion")  as string | null;
  const fechaLiquidRaw    = formData.get("fechaLiquidacion")   as string | null;
  const plazoLiquidRaw    = (formData.get("plazoLiquidacion") as string) || "T1";
  const plazoLiquidacion  = (["CI", "T1", "T2"].includes(plazoLiquidRaw) ? plazoLiquidRaw : "T1") as PlazoLiquidacion;
  const esSenebi          = formData.get("esSenebi") === "true";

  // MACRO 5: parser canónico estricto (parseFloat aceptaba "12abc", "1e3"…; un valor
  // inválido ya no se descarta en silencio: rechaza la concertación).
  const campos = {
    comisionPct: parseOpcionalNoNegativo(formData.get("comisionPct")),
    comisionFija: parseOpcionalNoNegativo(formData.get("comisionFija")),
    derechosMercado: parseOpcionalNoNegativo(formData.get("derechosMercado")),
    gastos: parseOpcionalNoNegativo(formData.get("gastos")),
    impuestos: parseOpcionalNoNegativo(formData.get("impuestos")),
    tcMepDia: parseOpcionalNoNegativo(formData.get("tcMepDia")),
    comisionUSD: parseOpcionalNoNegativo(formData.get("comisionUSD")),
    netoManual: parseOpcionalNoNegativo(formData.get("netoLiquidadoManual")),
    senebiBruto: esSenebi ? parseOpcionalNoNegativo(formData.get("senebiBruto")) : null,
    tasaCaucion: parseOpcionalNoNegativo(formData.get("tasaCaucion")),
  };
  const diasCaucion = parseEnteroOpcional(formData.get("diasCaucion"));
  // M5-F01: bolsa de USD de la cartera (CABLE | MEP), validada en el servidor.
  const saldoUSD = parseSaldoUSD(formData.get("saldoUSD"));
  if (saldoUSD === "invalido") return { error: "Bolsa de USD inválida: debe ser Cable o MEP" };
  const invalido = Object.entries(campos).find(([, v]) => v === "invalido");
  if (invalido || diasCaucion === "invalido") return { error: `Valor inválido en ${invalido?.[0] ?? "diasCaucion"}: usá solo números (ej. 1500 o 1500,50)` };
  const v = campos as { [K in keyof typeof campos]: Decimal | null };
  if (v.netoManual && v.netoManual.isZero()) return { error: "El neto liquidado manual debe ser mayor a 0" };
  const fechaConcertacion = fechaConcertRaw ? new Date(fechaConcertRaw) : null;
  const fechaLiquidacion  = fechaLiquidRaw ? new Date(fechaLiquidRaw) : null;
  if ((fechaConcertacion && isNaN(fechaConcertacion.getTime())) || (fechaLiquidacion && isNaN(fechaLiquidacion.getTime()))) return { error: "Fecha inválida" };

  try {
    // Lock de la operación + efectos (posición + cash / holding + saldo) en UNA tx.
    const r = await prisma.$transaction((tx) => concertarOperacionTx(tx, {
      operacionId, userId,
      datos: {
        nroBoleto: (formData.get("nroBoleto") as string)?.trim() || null,
        alyc: (formData.get("alyc") as string)?.trim() || null,
        fechaConcertacion, fechaLiquidacion, plazoLiquidacion,
        costos: { comisionPct: v.comisionPct, comisionFija: v.comisionFija, derechosMercado: v.derechosMercado, gastos: v.gastos, impuestos: v.impuestos, netoManual: v.netoManual },
        comisionUSD: v.comisionUSD, tcMepDia: v.tcMepDia, esSenebi, senebiBruto: v.senebiBruto, diasCaucion, tasaCaucion: v.tasaCaucion,
        saldoUSD,
      },
    }), { timeout: 15000 });

    const op = await prisma.operacionBolsa.findUnique({ where: { id: operacionId }, select: { tipoOperacion: true, ticker: true, comitenteId: true, carteraId: true } });
    const userName = (session?.user as { name?: string } | undefined)?.name ?? "Usuario";
    const sujetoLabel = op?.comitenteId ? `comitente ${op.comitenteId.slice(0, 8)}` : (op?.carteraId ? "cartera propia" : "—");
    await writeAuditLog({
      userId,
      accion: r.nueva ? "CONCERTACION" : "EDICION_CONCERTACION",
      entidad: "OperacionBolsa",
      entidadId: operacionId,
      description: r.nueva
        ? `${userName} concertó ${op?.tipoOperacion} ${op?.ticker} (${sujetoLabel})${r.efectos?.saldo ? ` | ${r.efectos.saldo.campo} ${r.efectos.saldo.delta}` : ""}`
        : `${userName} editó concertación ${op?.tipoOperacion} ${op?.ticker} (${sujetoLabel})`,
    });

    revalidatePath("/bolsa");
    revalidatePath(`/bolsa/${operacionId}`);
    revalidatePath("/carteras", "layout");
    revalidatePath("/cuentas-inversion", "layout");
    return { ok: true as const };
  } catch (e: unknown) {
    if (e instanceof BolsaIntegridadError) return { error: e.message };
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

  // MACRO 5: parser canónico estricto (resultados informados admiten signo).
  const resultadoBruto = parseOpcionalConSigno(formData.get("resultadoBruto"));
  const resultadoNeto  = parseOpcionalConSigno(formData.get("resultadoNeto"));
  const tcMepDia       = parseOpcionalNoNegativo(formData.get("tcMepDia"));
  const tasaCaucion    = parseOpcionalNoNegativo(formData.get("tasaCaucion"));
  const diasCaucion    = parseEnteroOpcional(formData.get("diasCaucion"));
  if ([resultadoBruto, resultadoNeto, tcMepDia, tasaCaucion, diasCaucion].includes("invalido")) {
    return { error: "Valor numérico inválido: usá solo números (ej. 1500 o 1500,50)" };
  }

  if (!tipoRaw || !cantidadRaw || !precioRaw || !moneda || !mercado)
    return { error: "Faltan campos obligatorios" };
  if (sujetoTipo === "comitente" && !comitenteId)
    return { error: "Seleccionar comitente" };
  if (sujetoTipo === "cartera" && !carteraId)
    return { error: "Seleccionar cartera" };

  const ticker = tickerRaw || (CAUCION_TIPOS.has(tipoRaw) ? "CAUCION" : "");
  if (!ticker) return { error: "Ticker requerido para este tipo de operación" };

  const cantidad = parseMontoPositivo(cantidadRaw);
  const precio   = parseMontoPositivo(precioRaw);
  if (!cantidad) return { error: "Cantidad inválida" };
  if (!precio)   return { error: "Precio inválido" };

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
          resultadoBruto:  resultadoBruto as Decimal | null,
          resultadoNeto:   resultadoNeto as Decimal | null,
          tcMepDia:        tcMepDia as Decimal | null,
          tasaCaucion:     tasaCaucion as Decimal | null,
          diasCaucion:     diasCaucion as number | null,
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
          snapshot:    { ticker, cantidad: cantidad.toString(), precio: precio.toString(), moneda, mercado, tipoOperacion: tipoRaw, resultadoBruto: resultadoBruto?.toString() ?? null, resultadoNeto: resultadoNeto?.toString() ?? null },
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

  try {
    // MACRO 5: lock + relectura; neutraliza TODO el hecho concertado (tenencia + costo +
    // cash / saldo comitente + movimiento de holding). Doble anulación → DENY.
    const r = await prisma.$transaction((tx) => anularOperacionTx(tx, { operacionId, userId, motivo: motivoAnulacion }), { timeout: 15000 });

    const op = await prisma.operacionBolsa.findUnique({ where: { id: operacionId }, select: { tipoOperacion: true, ticker: true } });
    const userName = (session?.user as { name?: string })?.name ?? "Sistema";
    const reversalSuffix = r.revertido
      ? ` | revirtió ${r.revertido.sujeto === "CARTERA" ? "cartera" : "comitente"}: tenencia y ${r.revertido.saldo?.campo ?? "saldo"} ${r.revertido.saldo ? `${r.revertido.saldo.delta} → 0` : ""}`
      : "";
    await writeAuditLog({
      userId,
      accion:      "ANULAR",
      entidad:     "OperacionBolsa",
      entidadId:   operacionId,
      description: `${userName} anuló ${op?.tipoOperacion} ${op?.ticker}: ${motivoAnulacion}${reversalSuffix}`,
    });

    revalidatePath("/bolsa");
    revalidatePath(`/bolsa/${operacionId}`);
    if (r.revertido) {
      revalidatePath("/carteras", "layout");
      revalidatePath("/cuentas-inversion", "layout");
    }
    return { ok: true as const };
  } catch (e: unknown) {
    if (e instanceof BolsaIntegridadError) return { error: e.message };
    console.error("[anularOperacion]", e);
    return { error: "Error al anular operación" };
  }
}

// ── LIQUIDAR ───────────────────────────────────────────────────────────────

/** CONCERTADA → LIQUIDADA (settlement). Los efectos económicos ya se aplicaron al concertar. */
export async function liquidarOperacion(prevState: unknown, formData: FormData) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };
  const denied = await requireActionPermission("bolsa:concertar");
  if (denied) return denied;

  const session = await auth();
  const userId  = session?.user?.id as string | undefined;
  if (!userId) return { error: "Sin sesión activa" };

  const operacionId = formData.get("operacionId") as string;
  if (!operacionId) return { error: "ID operación requerido" };
  const fechaRaw = (formData.get("fechaLiquidacion") as string | null)?.trim();
  const fechaLiquidacion = fechaRaw ? new Date(`${fechaRaw}T00:00:00.000Z`) : null;
  if (fechaLiquidacion && isNaN(fechaLiquidacion.getTime())) return { error: "Fecha inválida" };

  try {
    await prisma.$transaction((tx) => liquidarOperacionTx(tx, { operacionId, userId, fechaLiquidacion }));
    await writeAuditLog({
      userId, accion: "LIQUIDACION", entidad: "OperacionBolsa", entidadId: operacionId,
      description: `${(session?.user as { name?: string })?.name ?? "Sistema"} marcó liquidada la operación ${operacionId}`,
    });
    revalidatePath("/bolsa");
    revalidatePath(`/bolsa/${operacionId}`);
    return { ok: true as const };
  } catch (e: unknown) {
    if (e instanceof BolsaIntegridadError) return { error: e.message };
    console.error("[liquidarOperacion]", e);
    return { error: "Error al liquidar la operación" };
  }
}
