// MACRO 4 — Operaciones TRANSACCIONALES de Cuentas Corrientes + Plazos Fijos (sin
// auth: las Server Actions autorizan antes y llaman acá dentro de prisma.$transaction).
//
//   - Todo cambio de saldo CC pasa por registrarMovimientoCC: crea el MovimientoCC y
//     aplica el delta con increment atómico (nunca "leer saldo → update saldo = X").
//   - Chequeos de idempotencia (interés ya aplicado, operación ya revertida) se hacen
//     DESPUÉS de tomar SELECT … FOR UPDATE de las filas involucradas.
//   - Vínculo PF ↔ CC: op:<ref> exacto en la descripción del movimiento y en las
//     notas del PF (comparado con ===, nunca substring).

import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { TIPO_INVERSO, prefijoReverso } from "../caja/integridad";
import { idsRevertidos, lockMovimientosCaja } from "../caja/integridad.service";
import type { PeriodoInteres } from "../services/intereses.service";
import {
  calcularInteresPeriodoCC, periodoPendienteInteresCC, tasaCCDecimal, validarSinSolapamientoInteres,
  TIPOS_OPERACION_CON_PF, deltaMovCC, motivoNoEliminable, refOperacion, refReversaGrupal, tipoInversoCC,
  tipoOperacionCC, type HistoriaCliente, type TipoMovCCStr,
} from "./integridad";

type Tx = Prisma.TransactionClient;

export class CCIntegridadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CCIntegridadError";
  }
}

// ── Locks ────────────────────────────────────────────────────────────────────

export async function lockCuentas(tx: Tx, ids: readonly string[]): Promise<void> {
  const orden = Array.from(new Set(ids)).sort();
  if (orden.length === 0) return;
  await tx.$queryRaw`SELECT id FROM "CuentaCorriente" WHERE id IN (${Prisma.join(orden)}) ORDER BY id FOR UPDATE`;
}

export async function lockPlazoFijo(tx: Tx, id: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "PlazoFijo" WHERE id = ${id} FOR UPDATE`;
}

// ── Movimiento + saldo (única puerta) ────────────────────────────────────────

export async function registrarMovimientoCC(tx: Tx, p: {
  cuentaId: string; tipo: TipoMovCCStr; monto: Decimal; fecha: Date; descripcion: string; operacionCambioId?: string | null;
}): Promise<string> {
  if (!p.monto.isFinite() || !p.monto.gt(0)) throw new CCIntegridadError("Monto inválido");
  const id = crypto.randomUUID();
  await tx.movimientoCC.create({
    data: {
      id, cuentaCorrienteId: p.cuentaId, fecha: p.fecha, tipo: p.tipo, monto: p.monto, descripcion: p.descripcion,
      operacionCambioId: p.operacionCambioId ?? null,
    },
  });
  await tx.cuentaCorriente.update({
    where: { id: p.cuentaId },
    data: { saldo: { increment: deltaMovCC(p.tipo, p.monto) }, updatedAt: new Date() },
  });
  return id;
}

/**
 * Movimiento CC manual. Con impacto en caja, CC y caja son UN hecho económico:
 * ambas patas comparten op:<ref> (y la marca "[MOV_CC]"), se crean en la misma tx
 * y solo se revierten juntas (revertirOperacionCCTx).
 *   INGRESO CC (el cliente acredita) → caja ENTRADA; EGRESO CC → caja SALIDA.
 */
export async function crearMovimientoCCTx(tx: Tx, p: {
  cuentaId: string; tipo: "INGRESO" | "EGRESO"; monto: Decimal; fecha: Date; descripcion: string | null; cajaImpactoId: string | null;
}): Promise<{ operationRef: string | null }> {
  const cuenta = await tx.cuentaCorriente.findUnique({ where: { id: p.cuentaId }, select: { moneda: true } });
  if (!cuenta) throw new CCIntegridadError("Cuenta no encontrada");
  const ref = p.cajaImpactoId ? crypto.randomUUID() : null;
  await registrarMovimientoCC(tx, {
    cuentaId: p.cuentaId, tipo: p.tipo, monto: p.monto, fecha: p.fecha,
    descripcion: ref ? `[MOV_CC] ${p.descripcion || "Movimiento CC"} | op:${ref}` : p.descripcion || "MOV",
  });
  if (ref && p.cajaImpactoId) {
    await tx.movimientoCaja.create({
      data: {
        id: crypto.randomUUID(), cajaId: p.cajaImpactoId, fecha: p.fecha, tipo: p.tipo === "INGRESO" ? "ENTRADA" : "SALIDA",
        moneda: cuenta.moneda, monto: p.monto, confirmado: true,
        descripcion: `[MOV_CC] ${p.descripcion || "Movimiento CC"} | cc:${p.cuentaId} | op:${ref}`,
      },
    });
  }
  return { operationRef: ref };
}

/** ¿El movimiento CC ya fue revertido? (individual "movref:<id>" o grupal "ref:<op>"). */
export async function estaRevertidoCC(tx: Tx, mov: { id: string; descripcion: string | null }): Promise<boolean> {
  const op = refOperacion(mov.descripcion);
  const candidatos = await tx.movimientoCC.findMany({
    where: { OR: [{ descripcion: { contains: `movref:${mov.id}` } }, ...(op ? [{ descripcion: { contains: `ref:${op}` } }] : [])] },
    select: { descripcion: true },
  });
  return candidatos.some((c) => c.descripcion?.match(/movref:([a-zA-Z0-9-]+)/)?.[1] === mov.id || (!!op && refReversaGrupal(c.descripcion) === op));
}

// ── Intereses CC ─────────────────────────────────────────────────────────────

/**
 * Aplica un interés CC una sola vez, bajo lock de la cuenta. `dedupe` define qué
 * interés vigente (no revertido) ya existente lo vuelve duplicado.
 */
export async function aplicarInteresCCTx(tx: Tx, p: {
  cuentaId: string; monto: Decimal; fecha: Date; descripcion: string;
  dedupe: { desde: Date; hasta: Date; mismoMonto: boolean } | { mismaDescripcion: true };
}): Promise<{ aplicado: boolean; movimientoId?: string }> {
  await lockCuentas(tx, [p.cuentaId]);
  const cuenta = await tx.cuentaCorriente.findUnique({ where: { id: p.cuentaId }, select: { id: true } });
  if (!cuenta) throw new CCIntegridadError("Cuenta no encontrada");

  const where = "mismaDescripcion" in p.dedupe
    ? { cuentaCorrienteId: p.cuentaId, tipo: "INTERES" as const, descripcion: p.descripcion, fecha: p.fecha }
    : { cuentaCorrienteId: p.cuentaId, tipo: "INTERES" as const, fecha: { gte: p.dedupe.desde, lt: p.dedupe.hasta } };
  const previos = await tx.movimientoCC.findMany({ where, select: { id: true, monto: true, descripcion: true } });
  for (const prev of previos) {
    if ("mismoMonto" in p.dedupe && p.dedupe.mismoMonto && !new Decimal(prev.monto.toString()).eq(p.monto)) continue;
    if (!(await estaRevertidoCC(tx, prev))) return { aplicado: false };
  }
  const movimientoId = await registrarMovimientoCC(tx, { cuentaId: p.cuentaId, tipo: "INTERES", monto: p.monto, fecha: p.fecha, descripcion: p.descripcion });
  return { aplicado: true, movimientoId };
}

// ── Liquidación de interés CC por período ────────────────────────────────────

export interface LiquidacionCCInput { cuentaId: string; fechaInicio: Date; fechaFin: Date; tasa: Decimal; interesAplicado: Decimal }
export interface LiquidacionCCResult {
  interesCalculado: Decimal; interesAplicado: Decimal; diferencia: Decimal; movimientoId: string; periodos: PeriodoInteres[];
}

const fmtFecha = (f: Date) =>
  `${f.getUTCDate().toString().padStart(2, "0")}/${(f.getUTCMonth() + 1).toString().padStart(2, "0")}/${f.getUTCFullYear()}`;

/**
 * F — Liquida el interés CC de un período con el cálculo COMPLETO bajo lock:
 * lock de la cuenta → lectura (tx) de movimientos del período y anteriores →
 * cálculo → validación del monto contra ESE cálculo → dedupe → movimiento.
 * Un movimiento concurrente queda serializado: o entra antes (y se calcula con
 * él) o espera al commit (y no forma parte de esta liquidación).
 */
export async function liquidarInteresCCTx(tx: Tx, p: LiquidacionCCInput): Promise<LiquidacionCCResult> {
  if (p.interesAplicado.lt(0)) throw new CCIntegridadError("El interés aplicado no puede ser negativo.");
  if (p.fechaFin <= p.fechaInicio) throw new CCIntegridadError("fechaFin debe ser posterior a fechaInicio.");

  await lockCuentas(tx, [p.cuentaId]);
  const cuenta = await tx.cuentaCorriente.findUnique({ where: { id: p.cuentaId }, select: { id: true } });
  if (!cuenta) throw new CCIntegridadError(`CuentaCorriente no encontrada: ${p.cuentaId}`);

  // Todos los movimientos de la cuenta, leídos bajo lock: saldo inicial canónico,
  // movimientos del período y "liquidado hasta" salen de la MISMA vista.
  const movs = await movimientosParaInteres(tx, p.cuentaId);
  const solapa = validarSinSolapamientoInteres(movs, p.fechaInicio);
  if (solapa) throw new CCIntegridadError(solapa);

  const { interesTotal, periodos } = calcularInteresPeriodoCC(movs, p.fechaInicio, p.fechaFin, p.tasa);
  const interesCalculado = interesTotal;

  // Aplicación parcial permitida, exceso no: contra el cálculo recién hecho bajo lock.
  const aAplicar = p.interesAplicado.gt(0) ? p.interesAplicado : interesCalculado;
  if (aAplicar.greaterThan(interesCalculado)) {
    throw new CCIntegridadError(`El interés aplicado (${aAplicar.toFixed(2)}) no puede superar el interés calculado (${interesCalculado.toFixed(2)}).`);
  }
  if (aAplicar.lte(0)) throw new CCIntegridadError("No hay interés a aplicar en el período seleccionado (saldo insuficiente o período vacío).");

  const r = await aplicarInteresCCTx(tx, {
    cuentaId: p.cuentaId, monto: aAplicar.toDecimalPlaces(2), fecha: p.fechaFin,
    descripcion: `Interés CC período ${fmtFecha(p.fechaInicio)} - ${fmtFecha(p.fechaFin)}`, dedupe: { mismaDescripcion: true },
  });
  if (!r.aplicado || !r.movimientoId) throw new CCIntegridadError("El interés de ese período ya fue liquidado");
  return { interesCalculado, interesAplicado: aAplicar, diferencia: interesCalculado.sub(aAplicar), movimientoId: r.movimientoId, periodos };
}

async function movimientosParaInteres(tx: Tx, cuentaId: string) {
  return tx.movimientoCC.findMany({
    where: { cuentaCorrienteId: cuentaId },
    orderBy: [{ fecha: "asc" }, { createdAt: "asc" }],
    select: { id: true, fecha: true, tipo: true, monto: true, descripcion: true },
  });
}

/**
 * Aplica el interés PENDIENTE de una cuenta (botones de /intereses y del detalle
 * de CC). El cliente no aporta monto: período [liquidado hasta | inicio de mes,
 * hoy) y tasa del cliente se resuelven en el servidor, bajo lock, y el monto lo
 * calcula liquidarInteresCCTx (único camino económico).
 */
export async function aplicarInteresPendienteCCTx(tx: Tx, p: { cuentaId: string; ahora: Date }): Promise<LiquidacionCCResult> {
  await lockCuentas(tx, [p.cuentaId]);
  const cuenta = await tx.cuentaCorriente.findUnique({ where: { id: p.cuentaId }, select: { clienteId: true } });
  if (!cuenta) throw new CCIntegridadError("Cuenta no encontrada");
  const cliente = await tx.cliente.findUnique({ where: { id: cuenta.clienteId }, select: { tasaCC: true } });
  if (!cliente) throw new CCIntegridadError("Cliente no encontrado");
  const { inicio, fin } = periodoPendienteInteresCC(await movimientosParaInteres(tx, p.cuentaId), p.ahora);
  if (fin.getTime() <= inicio.getTime()) throw new CCIntegridadError("No hay días pendientes de liquidar");
  return liquidarInteresCCTx(tx, { cuentaId: p.cuentaId, fechaInicio: inicio, fechaFin: fin, tasa: tasaCCDecimal(cliente.tasaCC), interesAplicado: new Decimal(0) });
}

// ── Plazo fijo desde CC ──────────────────────────────────────────────────────

/**
 * Crea un PF descontando el capital de la CC del cliente en la MISMA transacción:
 * EGRESO "PF egreso | op:<ref>" + PF con notas "PF desde CC | op:<ref>". Sin
 * MovimientoCC, una reconciliación volvía a sumar el capital (doble pasivo).
 */
export async function crearPfDesdeCCTx(tx: Tx, p: {
  clienteId: string; moneda: "USD" | "ARS" | "EUR" | "BRL"; capital: Decimal; tasaAnual: Decimal;
  fechaInicio: Date; fechaVencimiento: Date;
}): Promise<{ plazoFijoId: string; movimientoId: string; operationRef: string }> {
  const cuenta = await tx.cuentaCorriente.upsert({
    where: { clienteId_moneda: { clienteId: p.clienteId, moneda: p.moneda } },
    create: { id: crypto.randomUUID(), clienteId: p.clienteId, moneda: p.moneda, saldo: new Decimal(0), updatedAt: new Date() },
    update: {},
    select: { id: true },
  });
  await lockCuentas(tx, [cuenta.id]);
  const operationRef = crypto.randomUUID();
  const movimientoId = await registrarMovimientoCC(tx, {
    cuentaId: cuenta.id, tipo: "EGRESO", monto: p.capital, fecha: p.fechaInicio, descripcion: `PF egreso | op:${operationRef}`,
  });
  const plazoFijoId = crypto.randomUUID();
  await tx.plazoFijo.create({
    data: {
      id: plazoFijoId, clienteId: p.clienteId, moneda: p.moneda, capital: p.capital, saldoActual: p.capital, tasaAnual: p.tasaAnual,
      fechaInicio: p.fechaInicio, fechaVencimiento: p.fechaVencimiento, estado: "ACTIVO",
      notas: `PF desde CC | op:${operationRef}`, updatedAt: new Date(),
    },
  });
  return { plazoFijoId, movimientoId, operationRef };
}

// ── Reversas ─────────────────────────────────────────────────────────────────

/**
 * Revierte una operación agrupada (op:<ref>) completa y una sola vez. Si la
 * operación creó un PF (LP / PF desde CC), el PF se cancela en la MISMA tx:
 * nunca CC restituida + PF activo. Un PF con movimientos propios (intereses,
 * rescates) no se revierte por acá: eso es lifecycle (Macro 7).
 */
/** Pata de caja "[MOV_CC] … | op:<ref>" de un movimiento CC con impacto en caja (match exacto del ref). */
export async function patasCajaDeOperacionCC(db: Tx, operationRef: string) {
  const cand = await db.movimientoCaja.findMany({ where: { descripcion: { contains: `op:${operationRef}` } } });
  return cand.filter((m) => (m.descripcion ?? "").startsWith("[MOV_CC]") && refOperacion(m.descripcion) === operationRef);
}

/**
 * Revierte una operación agrupada (op:<ref>) completa y una sola vez, en UNA tx:
 *   - CC de una operación de cambio → DENY (autoridad única: revertirCambioTx);
 *   - PF (LP / PF desde CC) → se cancela junto con la CC (nunca CC restituida + PF activo);
 *   - movimiento CC con impacto en caja → también se revierte su pata "[MOV_CC]"
 *     con la reversa estructural de Macro 3 (nunca CC neutralizada + caja impactada).
 * Un PF con movimientos propios (intereses, rescates) no se revierte por acá (Macro 7).
 */
export async function revertirOperacionCCTx(tx: Tx, p: { operationRef: string; fecha: Date; cajasAutorizadas?: readonly string[] }): Promise<{ plazoFijoId: string | null; reversos: number; reversosCaja: number }> {
  if (!/^[a-zA-Z0-9-]+$/.test(p.operationRef)) throw new CCIntegridadError("operationRef inválido");
  const candidatos = await tx.movimientoCC.findMany({ where: { descripcion: { contains: `op:${p.operationRef}` } } });
  const originales = candidatos.filter((m) => refOperacion(m.descripcion) === p.operationRef);
  if (originales.length === 0) throw new CCIntegridadError("No se encontraron movimientos para esta operación");
  if (originales.some((m) => (m.descripcion ?? "").startsWith("REVERSO") || (m.descripcion ?? "").startsWith("[REVERSO"))) {
    throw new CCIntegridadError("No se puede revertir una reversión");
  }

  const ids = originales.map((m) => m.id).sort();
  await tx.$queryRaw`SELECT id FROM "MovimientoCC" WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`;

  // G: la CC de una operación de cambio solo se neutraliza desde la operación.
  if (originales.some((m) => m.operacionCambioId)) {
    throw new CCIntegridadError("Esta cuenta corriente pertenece a una operación de cambio. Revertir desde la operación de cambio.");
  }

  const yaRev = await tx.movimientoCC.findMany({ where: { descripcion: { contains: `ref:${p.operationRef}` } }, select: { descripcion: true } });
  if (yaRev.some((r) => refReversaGrupal(r.descripcion) === p.operationRef)) throw new CCIntegridadError("Esta operación ya fue revertida");
  for (const m of originales) {
    if (await estaRevertidoCC(tx, { id: m.id, descripcion: null })) throw new CCIntegridadError("Un movimiento de la operación ya fue revertido individualmente");
  }

  let plazoFijoId: string | null = null;
  if ((TIPOS_OPERACION_CON_PF as readonly string[]).includes(tipoOperacionCC(originales[0].descripcion))) {
    const pfCand = await tx.plazoFijo.findMany({ where: { notas: { contains: `op:${p.operationRef}` } }, select: { id: true, notas: true } });
    const exactos = pfCand.filter((pf) => refOperacion(pf.notas) === p.operationRef);
    if (exactos.length !== 1) throw new CCIntegridadError(exactos.length === 0 ? "No se encontró el Plazo Fijo asociado a esta operación" : "Múltiples Plazos Fijos asociados a la misma operación");
    await lockPlazoFijo(tx, exactos[0].id);
    const pf = await tx.plazoFijo.findUniqueOrThrow({ where: { id: exactos[0].id } });
    if (refOperacion(pf.notas) !== p.operationRef) throw new CCIntegridadError("El Plazo Fijo asociado ya no corresponde a esta operación");
    if (pf.estado !== "ACTIVO") throw new CCIntegridadError(`El Plazo Fijo asociado está ${pf.estado}, no se puede revertir la operación`);
    const movsPf = await tx.plazoFijoMovimiento.count({ where: { plazoFijoId: pf.id } });
    if (movsPf > 0 || !new Decimal(pf.saldoActual.toString()).eq(pf.capital.toString())) {
      throw new CCIntegridadError("El Plazo Fijo ya tiene intereses o movimientos propios: no se revierte como operación (flujo de PF)");
    }
    plazoFijoId = pf.id;
  }

  // H: pata de caja del mismo hecho (lock en orden estable, relectura, validación estructural).
  const patas = await patasCajaDeOperacionCC(tx, p.operationRef);
  let pataCaja: Awaited<ReturnType<typeof patasCajaDeOperacionCC>>[number] | null = null;
  if (patas.length > 0) {
    await lockMovimientosCaja(tx, patas.map((x) => x.id));
    const releidas = await tx.movimientoCaja.findMany({ where: { id: { in: patas.map((x) => x.id) } } });
    if (releidas.length !== 1 || originales.length !== 1) throw new CCIntegridadError("Movimiento CC + caja inconsistente: no se revierte");
    const [cc] = originales;
    const leg = releidas[0];
    const cuenta = await tx.cuentaCorriente.findUniqueOrThrow({ where: { id: cc.cuentaCorrienteId }, select: { moneda: true } });
    const tipoEsperado = cc.tipo === "INGRESO" ? "ENTRADA" : cc.tipo === "EGRESO" ? "SALIDA" : null;
    if (!leg.confirmado || leg.anulado) throw new CCIntegridadError("La pata de caja no está confirmada: no se revierte");
    if (leg.tipo !== tipoEsperado || leg.moneda !== cuenta.moneda || !new Decimal(leg.monto.toString()).eq(cc.monto.toString())) {
      throw new CCIntegridadError("Movimiento CC + caja inconsistente: no se revierte");
    }
    if (p.cajasAutorizadas && !p.cajasAutorizadas.includes(leg.cajaId)) throw new CCIntegridadError("La operación cambió durante la reversión");
    if ((await idsRevertidos(tx, [leg.id])).size > 0) throw new CCIntegridadError("La pata de caja ya fue revertida");
    pataCaja = leg;
  }

  const reversalRef = crypto.randomUUID();
  for (const mov of originales) {
    await registrarMovimientoCC(tx, {
      cuentaId: mov.cuentaCorrienteId, tipo: tipoInversoCC(mov.tipo), monto: new Decimal(mov.monto.toString()), fecha: p.fecha,
      descripcion: `REVERSO ${mov.tipo} | op:${reversalRef} | ref:${p.operationRef}`,
    });
  }
  if (pataCaja) {
    // Misma estructura que Macro 3 (revertirMovimientoTx): la reconocen idsRevertidos / reversasValidasCaja.
    await tx.movimientoCaja.create({
      data: {
        id: crypto.randomUUID(), cajaId: pataCaja.cajaId, tipo: TIPO_INVERSO[pataCaja.tipo], monto: pataCaja.monto, moneda: pataCaja.moneda,
        descripcion: `${prefijoReverso(pataCaja.id)} ${pataCaja.descripcion ?? ""}`.slice(0, 500), confirmado: true, fecha: p.fecha,
      },
    });
  }
  if (plazoFijoId) {
    await tx.plazoFijo.update({ where: { id: plazoFijoId }, data: { estado: "CANCELADO", saldoActual: new Decimal(0), updatedAt: new Date() } });
  }
  return { plazoFijoId, reversos: originales.length, reversosCaja: pataCaja ? 1 : 0 };
}

/** Revierte UN movimiento CC suelto (no agrupado), una sola vez, bajo lock. */
export async function revertirMovimientoCCTx(tx: Tx, p: { id: string; userName: string; fecha: Date }) {
  await tx.$queryRaw`SELECT id FROM "MovimientoCC" WHERE id = ${p.id} FOR UPDATE`;
  const mov = await tx.movimientoCC.findUnique({ where: { id: p.id } });
  if (!mov) throw new CCIntegridadError("Movimiento no encontrado");
  const cuenta = await tx.cuentaCorriente.findUniqueOrThrow({ where: { id: mov.cuentaCorrienteId }, select: { id: true, clienteId: true, moneda: true } });
  const desc = mov.descripcion ?? "";
  if (mov.operacionCambioId) throw new CCIntegridadError("Esta cuenta corriente pertenece a una operación de cambio. Revertir desde la operación de cambio.");
  if (refOperacion(desc)) throw new CCIntegridadError("Este movimiento pertenece a una operación agrupada. Revertila desde Operaciones.");
  if (desc.startsWith("REVERSO") || desc.startsWith("[REVERSO")) throw new CCIntegridadError("Este movimiento ya es una reversión");
  if (await estaRevertidoCC(tx, { id: mov.id, descripcion: null })) throw new CCIntegridadError("Este movimiento ya fue revertido");

  const prefix = `[REVERSO por ${p.userName}] `;
  const suffix = ` | movref:${mov.id}`;
  const maxDescLen = Math.max(0, 500 - prefix.length - suffix.length);
  await registrarMovimientoCC(tx, {
    cuentaId: mov.cuentaCorrienteId, tipo: tipoInversoCC(mov.tipo), monto: new Decimal(mov.monto.toString()), fecha: p.fecha,
    descripcion: `${prefix}${desc.slice(0, maxDescLen)}${suffix}`, operacionCambioId: mov.operacionCambioId,
  });
  return { clienteId: cuenta.clienteId, cuentaId: cuenta.id, moneda: cuenta.moneda, tipo: mov.tipo, monto: mov.monto };
}

// ── Cliente: eliminación segura ──────────────────────────────────────────────

/** Historia financiera del cliente, leída con sus CC bloqueadas (un movimiento concurrente espera). */
export async function historiaCliente(tx: Tx, clienteId: string, nombre: string): Promise<HistoriaCliente> {
  await tx.$queryRaw`SELECT id FROM "Cliente" WHERE id = ${clienteId} FOR UPDATE`;
  const cuentas = await tx.cuentaCorriente.findMany({ where: { clienteId }, select: { id: true, saldo: true } });
  await lockCuentas(tx, cuentas.map((c) => c.id));
  const normalizado = nombre.trim().toLowerCase().replace(/\s+/g, " ");
  const legacy = (await tx.operacionCambio.findMany({ where: { clienteId: null, clienteNombre: { not: null } }, select: { clienteNombre: true } }))
    .filter((o) => (o.clienteNombre ?? "").trim().toLowerCase().replace(/\s+/g, " ") === normalizado).length;
  return {
    movimientosCC: cuentas.length ? await tx.movimientoCC.count({ where: { cuentaCorrienteId: { in: cuentas.map((c) => c.id) } } }) : 0,
    saldosCCNoCero: cuentas.filter((c) => !new Decimal(c.saldo.toString()).isZero()).length,
    plazosFijos: await tx.plazoFijo.count({ where: { clienteId } }),
    operacionesCambio: await tx.operacionCambio.count({ where: { clienteId } }),
    custodia: await tx.custodiaCliente.count({ where: { clienteId } }),
    transferenciasActivo: await tx.transferenciaActivo.count({ where: { clienteDestinoId: clienteId } }),
    operacionesBolsa: await tx.operacionBolsa.count({ where: { clienteId } }),
    legacyPorNombre: legacy,
  };
}

/** Elimina un cliente SOLO si no tiene historia financiera (safe-deny). */
export async function eliminarClienteSeguroTx(tx: Tx, clienteId: string): Promise<void> {
  const cliente = await tx.cliente.findUnique({ where: { id: clienteId }, select: { nombre: true } });
  if (!cliente) throw new CCIntegridadError("Cliente no encontrado");
  const motivo = motivoNoEliminable(await historiaCliente(tx, clienteId, cliente.nombre));
  if (motivo) throw new CCIntegridadError(motivo);
  await tx.cliente.delete({ where: { id: clienteId } });
}
