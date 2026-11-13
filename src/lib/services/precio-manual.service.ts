// P1-03B — ÚNICO write path canónico de la actualización MANUAL de precio de un Activo.
//
// Todo flujo que cambie Activo.precioActual a mano DEBE pasar por actualizarPrecioManualTx
// (formulario individual, valuación de instrumento manual, batch, batch por ticker, import
// Excel, alta de activo con precio). Data912 tiene su propio writer (fuente DATA912) y nunca
// consulta categorías MANUAL_ONLY (FCI/CRIPTO).
//
// Dentro de UNA transacción (cualquier fallo ⇒ rollback total, 0 writes):
//   0. usuario obligatorio; fecha valor válida, ≤ hoy ARGENTINO y ≥ último precio histórico;
//   1. lock de la fila Activo (FOR UPDATE) y captura del estado previo como VALORES;
//   2. precio: UNITARIO (informado) o VALUACION (valuación total ÷ VN, Decimal, half-up a 6
//      decimales; el VN debe coincidir con la tenencia registrada y NO se modifica; el error
//      de redondeo VN × precio − valuación debe ser ≤ USD/ARS 0,01);
//   3. Activo: precioActual, precioAnterior (= precio previo inmediato, solo si cambia),
//      priceSource MANUAL, priceStatus OK, priceSyncedAt/updatedAt = timestamp real;
//   4. PrecioHistorico(activoId, fecha VALOR) upsert con userId;
//   5. AuditLog ACTUALIZAR_PRECIO_MANUAL con anterior, nuevo, VN, valuación, fecha valor, usuario.

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { fechaNegocio, ZONA_NEGOCIO } from "@/lib/fecha-negocio";
import { esFechaISOValida, normalizarNumeroAR } from "@/lib/numero-ar";
import { getManualOnlyReason } from "@/lib/services/price-ticker-resolver.service";

export class PrecioManualError extends Error {}

export type OrigenPrecioManual =
  | "FORM_UNITARIO" | "FORM_VALUACION" | "BATCH" | "TICKER_BATCH" | "IMPORT_EXCEL" | "ALTA_ACTIVO";

export type EntradaPrecioManual =
  | { modo: "UNITARIO"; precio: Decimal }
  | { modo: "VALUACION"; vn: Decimal; valuacionTotal: Decimal };

/** Escala de Activo.precioActual / PrecioHistorico.precio: Decimal(18,6). */
export const ESCALA_PRECIO = 6;
/** Error máximo admitido entre VN × precio guardado y la valuación informada. */
export const TOLERANCIA_VALUACION = new Decimal("0.01");

// ── Parsing de entradas (es-AR estricto → Decimal, nunca Number) ───────────────

function dec(raw: string | null | undefined, campo: string, maxDecimales: number): Decimal {
  try {
    return new Decimal(normalizarNumeroAR(raw, { campo, maxDecimales }));
  } catch (e) {
    throw new PrecioManualError(e instanceof Error ? e.message : `${campo}: inválido`);
  }
}
export const parsePrecioUnitarioAR = (raw: string | null | undefined) => dec(raw, "Precio", ESCALA_PRECIO);
export const parseVnAR = (raw: string | null | undefined) => dec(raw, "VN", 6);
export const parseValuacionAR = (raw: string | null | undefined) => dec(raw, "Valuación", 2);

/** precio unitario = valuación ÷ VN, half-up a la escala de la columna. */
export function calcularPrecioDesdeValuacion(vn: Decimal, valuacionTotal: Decimal) {
  if (!vn.gt(0)) throw new PrecioManualError("VN debe ser mayor a 0");
  if (!valuacionTotal.gt(0)) throw new PrecioManualError("La valuación debe ser mayor a 0");
  const exacto = valuacionTotal.div(vn);
  const precio = exacto.toDecimalPlaces(ESCALA_PRECIO, Decimal.ROUND_HALF_UP);
  if (!precio.gt(0)) throw new PrecioManualError("El precio resultante redondea a 0: revisá VN y valuación");
  const valuacionResultante = vn.mul(precio);
  const diferencia = valuacionResultante.minus(valuacionTotal);
  return { exacto, precio, valuacionResultante, diferencia };
}

// ── Helper transaccional ─────────────────────────────────────────────────────

export interface ParamsPrecioManual {
  activoId: string;
  entrada: EntradaPrecioManual;
  /** "YYYY-MM-DD", día calendario argentino. Default: hoy argentino. */
  fechaValor?: string;
  userId: string;
  origen: OrigenPrecioManual;
  ahora?: Date;
}

export async function actualizarPrecioManualTx(tx: Prisma.TransactionClient, p: ParamsPrecioManual) {
  if (!p.userId) throw new PrecioManualError("Actualización de precio sin usuario: rechazada");
  const ahora = p.ahora ?? new Date();
  const hoy = fechaNegocio(ahora);
  const fechaValor = p.fechaValor ?? hoy;
  if (!esFechaISOValida(fechaValor)) throw new PrecioManualError(`Fecha valor inválida: "${fechaValor}"`);
  if (fechaValor > hoy) throw new PrecioManualError(`Fecha valor ${fechaValor} posterior a hoy (${hoy}, Argentina): rechazada`);
  const fecha = new Date(`${fechaValor}T00:00:00.000Z`);

  // 1. Lock + estado previo capturado como valores.
  await tx.$queryRaw`SELECT id FROM "Activo" WHERE id = ${p.activoId} FOR UPDATE`;
  const activo = await tx.activo.findUnique({
    where: { id: p.activoId },
    select: {
      id: true, ticker: true, categoria: true, monedaPrecio: true, precioActual: true, precioAnterior: true,
      priceSource: true, priceStatus: true, priceSyncedAt: true,
    },
  });
  if (!activo) throw new PrecioManualError("Activo inexistente");
  const previo = {
    precioActual: activo.precioActual?.toString() ?? null,
    precioAnterior: activo.precioAnterior?.toString() ?? null,
    priceSource: activo.priceSource,
    priceStatus: activo.priceStatus,
    priceSyncedAt: activo.priceSyncedAt?.toISOString() ?? null,
  };

  const ultimo = await tx.precioHistorico.findFirst({ where: { activoId: p.activoId }, orderBy: { fecha: "desc" } });
  const ultimaFecha = ultimo ? ultimo.fecha.toISOString().slice(0, 10) : null;
  if (ultimaFecha && fechaValor < ultimaFecha) {
    throw new PrecioManualError(
      `${activo.ticker}: ya hay un precio registrado al ${ultimaFecha}; la fecha valor ${fechaValor} no puede ser anterior`,
    );
  }
  const histMismoDia = ultimo && ultimaFecha === fechaValor
    ? { id: ultimo.id, precio: ultimo.precio.toString(), userId: ultimo.userId }
    : null;

  // 2. Precio.
  let precio: Decimal;
  let valuacion: null | {
    vn: string; valuacionInformada: string; precioExacto: string; valuacionResultante: string; diferencia: string; tenenciaRegistrada: string;
  } = null;
  if (p.entrada.modo === "UNITARIO") {
    precio = p.entrada.precio;
    if (!precio.isFinite() || !precio.gt(0)) throw new PrecioManualError("El precio debe ser mayor a 0");
    if (precio.decimalPlaces() > ESCALA_PRECIO) throw new PrecioManualError(`El precio admite hasta ${ESCALA_PRECIO} decimales`);
  } else {
    if (!getManualOnlyReason(activo.categoria)) {
      throw new PrecioManualError(`${activo.ticker}: la carga por VN + valuación es solo para instrumentos manuales (FCI/CRIPTO)`);
    }
    const pos = await tx.posicionCartera.findMany({ where: { activoId: p.activoId }, select: { cantidad: true } });
    const tenencia = pos.reduce((acc, x) => acc.plus(new Decimal(x.cantidad.toString())), new Decimal(0));
    if (pos.length === 0 || tenencia.isZero()) {
      throw new PrecioManualError(`${activo.ticker}: no hay tenencia registrada en carteras para validar el VN`);
    }
    if (!p.entrada.vn.eq(tenencia)) {
      throw new PrecioManualError(
        `${activo.ticker}: el VN informado (${p.entrada.vn.toString()}) no coincide con la tenencia registrada (${tenencia.toString()}). ` +
        `El VN no se modifica desde acá: corregí primero la posición.`,
      );
    }
    const c = calcularPrecioDesdeValuacion(p.entrada.vn, p.entrada.valuacionTotal);
    if (c.diferencia.abs().gt(TOLERANCIA_VALUACION)) {
      throw new PrecioManualError(
        `${activo.ticker}: con ${ESCALA_PRECIO} decimales el precio no representa la valuación (diferencia ${c.diferencia.toString()} > ${TOLERANCIA_VALUACION.toString()})`,
      );
    }
    precio = c.precio;
    valuacion = {
      vn: p.entrada.vn.toString(), valuacionInformada: p.entrada.valuacionTotal.toString(), precioExacto: c.exacto.toString(),
      valuacionResultante: c.valuacionResultante.toString(), diferencia: c.diferencia.toString(), tenenciaRegistrada: tenencia.toString(),
    };
  }

  // 3. Activo. precioAnterior = precio previo inmediato (misma semántica que Data912), solo si cambia.
  const cambia = previo.precioActual === null || !new Decimal(previo.precioActual).eq(precio);
  await tx.activo.update({
    where: { id: p.activoId },
    data: {
      precioActual: precio,
      ...(cambia && previo.precioActual !== null ? { precioAnterior: new Decimal(previo.precioActual) } : {}),
      priceSource: "MANUAL",
      priceStatus: "OK",
      priceSyncedAt: ahora,
      providerUpdatedAt: null,
      priceErrorMessage: null,
      updatedAt: ahora,
    },
  });

  // 4. Historial a la FECHA VALOR (día argentino), no al día UTC del servidor.
  const hist = await tx.precioHistorico.upsert({
    where: { activoId_fecha: { activoId: p.activoId, fecha } },
    update: { precio, userId: p.userId },
    create: { id: crypto.randomUUID(), activoId: p.activoId, fecha, precio, userId: p.userId },
  });

  // 5. Auditoría en la MISMA transacción.
  const precioAnteriorNuevo = cambia && previo.precioActual !== null ? previo.precioActual : previo.precioAnterior;
  await tx.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: p.userId,
      accion: "ACTUALIZAR_PRECIO_MANUAL",
      entidad: "Activo",
      entidadId: p.activoId,
      datosPrevios: { ...previo, historicoFechaValor: histMismoDia },
      datosNuevos: {
        description: `${activo.ticker}: precio ${previo.precioActual ?? "—"} → ${precio.toString()} ${activo.monedaPrecio} al ${fechaValor}` +
          (valuacion ? ` (VN ${valuacion.vn}, valuación ${valuacion.valuacionInformada})` : ""),
        ticker: activo.ticker,
        categoria: activo.categoria,
        moneda: activo.monedaPrecio,
        modo: p.entrada.modo,
        vn: valuacion?.vn ?? null,
        valuacionInformada: valuacion?.valuacionInformada ?? null,
        precioExacto: valuacion?.precioExacto ?? null,
        valuacionResultante: valuacion?.valuacionResultante ?? null,
        diferenciaRedondeo: valuacion?.diferencia ?? null,
        tenenciaRegistrada: valuacion?.tenenciaRegistrada ?? null,
        precioAnterior: previo.precioActual,
        precioNuevo: precio.toString(),
        precioAnteriorGuardado: precioAnteriorNuevo,
        fechaValor,
        zonaFechaValor: ZONA_NEGOCIO,
        timestamp: ahora.toISOString(),
        source: "MANUAL",
        origen: p.origen,
        precioHistoricoId: hist.id,
        mismoDia: histMismoDia !== null,
      },
    },
  });

  return {
    activoId: p.activoId, ticker: activo.ticker, moneda: activo.monedaPrecio, fechaValor,
    precioAnterior: previo.precioActual, precioNuevo: precio.toString(),
    valuacionResultante: valuacion?.valuacionResultante ?? null, diferencia: valuacion?.diferencia ?? null,
  };
}

export type ResultadoPrecioManual = Awaited<ReturnType<typeof actualizarPrecioManualTx>>;

/** Aplica N actualizaciones en UNA transacción (todo o nada). */
export async function registrarPreciosManuales(
  items: Omit<ParamsPrecioManual, "userId" | "origen" | "ahora">[],
  ctx: { userId: string; origen: OrigenPrecioManual; ahora?: Date },
): Promise<ResultadoPrecioManual[]> {
  if (!ctx.userId) throw new PrecioManualError("Actualización de precio sin usuario: rechazada");
  if (items.length === 0) return [];
  const ahora = ctx.ahora ?? new Date();
  return prisma.$transaction(async (tx) => {
    const out: ResultadoPrecioManual[] = [];
    for (const it of items) out.push(await actualizarPrecioManualTx(tx, { ...it, userId: ctx.userId, origen: ctx.origen, ahora }));
    return out;
  }, { timeout: 60_000 });
}
