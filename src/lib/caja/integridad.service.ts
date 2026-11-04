// MACRO 3 — Operaciones TRANSACCIONALES de Caja + Cambio (sin auth: las Server
// Actions autorizan antes y llaman acá dentro de prisma.$transaction).
//
// Concurrencia por integridad de DB (no OperationalLock):
//   - SELECT … FOR UPDATE de las filas afectadas (orden estable por id) antes de
//     leer estado: dos requests sobre el mismo pendiente / operación / par se
//     serializan y la segunda ve el estado ya actualizado;
//   - todo el estado se re-verifica DENTRO de la transacción;
//   - saldos de CC con increment/decrement atómico.
// Vínculos por campos estructurados (pagoDeId, transferenciaRef, operacionCambioId)
// y, para datos legacy, por prefijos EXACTOS que escribe el sistema ("[Cambio <id>]",
// "REVERSO | ref:<id> |"), nunca por `contains` libre.

import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  conMarcaParcial, descripcionOpEditada, divisaLiquidada, esOpRevertida, esReversaValida, esReverso, netoPorCajaMoneda, netoPorCuentaCC, patasLiquidacion,
  planConfirmacion, prefijoReverso, TIPO_INVERSO, validarLiquidacion, validarPagoParcial, validarTextoEditado, vinculoFinanciero,
} from "./integridad";

type Tx = Prisma.TransactionClient;

export class IntegridadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegridadError";
  }
}

// ── Locks ────────────────────────────────────────────────────────────────────

export async function lockMovimientosCaja(tx: Tx, ids: readonly string[]): Promise<void> {
  const orden = Array.from(new Set(ids)).sort();
  if (orden.length === 0) return;
  await tx.$queryRaw`SELECT id FROM "MovimientoCaja" WHERE id IN (${Prisma.join(orden)}) ORDER BY id FOR UPDATE`;
}

export async function lockOperacionCambio(tx: Tx, id: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "OperacionCambio" WHERE id = ${id} FOR UPDATE`;
}

/** Serializa operaciones que validan saldo de una caja (transferencias / cambio entre cajas). */
export async function lockCaja(tx: Tx, cajaId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "Caja" WHERE id = ${cajaId} FOR UPDATE`;
}

// ── Consultas de vínculo ─────────────────────────────────────────────────────

/**
 * Ids (de `ids`) con una reversa ESTRUCTURALMENTE válida: "REVERSO | ref:<id> |"
 * confirmada, misma caja, moneda y monto, tipo inverso (esReversaValida). Una
 * descripción con la marca sin ese correlato no revierte nada (fail closed).
 */
export async function idsRevertidos(tx: Tx, ids: readonly string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rev = await tx.movimientoCaja.findMany({
    where: { OR: ids.map((id) => ({ descripcion: { startsWith: prefijoReverso(id) } })) },
    select: { id: true, cajaId: true, tipo: true, moneda: true, monto: true, confirmado: true, descripcion: true },
  });
  if (rev.length === 0) return new Set();
  const originales = await tx.movimientoCaja.findMany({
    where: { id: { in: Array.from(ids) } },
    select: { id: true, cajaId: true, tipo: true, moneda: true, monto: true, confirmado: true, descripcion: true },
  });
  const out = new Set<string>();
  for (const o of originales) {
    if (rev.some((r) => esReversaValida(o, r))) out.add(o.id);
  }
  return out;
}

/** Pagos parciales VÁLIDOS de un pendiente: confirmados, no anulados, no revertidos. */
export async function pagosValidos(tx: Tx, pendienteId: string): Promise<{ id: string; monto: Decimal }[]> {
  const pagos = await tx.movimientoCaja.findMany({
    where: { pagoDeId: pendienteId, confirmado: true, anulado: false },
    select: { id: true, monto: true },
  });
  const revertidos = await idsRevertidos(tx, pagos.map((p) => p.id));
  return pagos.filter((p) => !revertidos.has(p.id)).map((p) => ({ id: p.id, monto: new Decimal(p.monto.toString()) }));
}

/** Movimientos de caja de una operación de cambio (estructurado + prefijo exacto legacy). */
export async function movimientosDeCambio(tx: Tx, opId: string) {
  return tx.movimientoCaja.findMany({
    where: {
      OR: [
        { operacionCambioId: opId },
        { descripcion: { startsWith: `[Cambio ${opId}]` } },
        { descripcion: { startsWith: `[Cobro Cambio ${opId}]` } },
        { descripcion: { startsWith: `[REVERSO Cambio ${opId}]` } },
      ],
    },
    select: { id: true, cajaId: true, tipo: true, moneda: true, monto: true },
  });
}

/**
 * Movimientos CC de una operación de cambio: SOLO por operacionCambioId (L1: el
 * sufijo "op:<id>" de la descripción era falsificable desde un movimiento CC manual;
 * TEST V5: 0 movimientos CC de cambio sin operacionCambioId).
 */
export async function movimientosCCDeCambio(tx: Tx, opId: string) {
  return tx.movimientoCC.findMany({
    where: { operacionCambioId: opId },
    select: { id: true, cuentaCorrienteId: true, tipo: true, monto: true },
  });
}

/**
 * MACRO 6 — Cambio con impacto en CC y cambio liquidado en Caja son caminos
 * MUTUAMENTE EXCLUYENTES: la CC ya registra el canje con el cliente; liquidarlo
 * además en caja registraría el mismo canje dos veces. Fail-closed.
 */
export const MENSAJE_CAMBIO_CON_CC = "Esta operación impacta Cuenta Corriente y no puede liquidarse también en Caja (liquidación por Cuenta Corriente).";

/** ¿La operación tiene patas CC vigentes (neto por cuenta ≠ 0, es decir, no neutralizadas)? */
export async function tieneCCVigente(tx: Tx, opId: string): Promise<boolean> {
  const netos = netoPorCuentaCC((await movimientosCCDeCambio(tx, opId)).map((m) => ({ ...m, tipo: m.tipo as string, monto: m.monto.toString() })));
  return netos.some((n) => !n.neto.isZero());
}

/** Cajas que tocaría revertir un movimiento (para exigir scope antes de la transacción). */
export async function cajasDeReversion(db: Tx, movimientoId: string): Promise<string[]> {
  const mov = await db.movimientoCaja.findUnique({ where: { id: movimientoId }, select: { cajaId: true, transferenciaRef: true } });
  if (!mov) return [];
  if (!mov.transferenciaRef) return [mov.cajaId];
  const par = await db.movimientoCaja.findMany({ where: { transferenciaRef: mov.transferenciaRef }, select: { cajaId: true } });
  return Array.from(new Set(par.map((p) => p.cajaId)));
}

// ── Pendientes ───────────────────────────────────────────────────────────────

export async function cubrirParcialTx(tx: Tx, p: {
  movimientoId: string; cajaOriginalEsperada: string; cajaPagoId: string; monto: Decimal; userName: string; pagoId: string;
}): Promise<{ moneda: string }> {
  await lockMovimientosCaja(tx, [p.movimientoId]);
  const original = await tx.movimientoCaja.findUnique({ where: { id: p.movimientoId } });
  if (!original) throw new IntegridadError("Movimiento no encontrado");
  if (original.cajaId !== p.cajaOriginalEsperada) throw new IntegridadError("El movimiento cambió durante la operación");
  if (original.confirmado) throw new IntegridadError("El movimiento ya está confirmado");
  if (original.anulado) throw new IntegridadError("El movimiento está anulado, no se puede cubrir");
  if (original.pagoDeId) throw new IntegridadError("Un pago parcial no se puede cubrir");

  const pagos = await pagosValidos(tx, original.id);
  const err = validarPagoParcial(original.monto.toString(), pagos.map((x) => x.monto), p.monto);
  if (err) throw new IntegridadError(err);

  await tx.movimientoCaja.create({
    data: {
      id: p.pagoId, cajaId: p.cajaPagoId, tipo: original.tipo, monto: p.monto, moneda: original.moneda,
      descripcion: `Pago parcial de pendiente ${original.id} | usr:${p.userName}`,
      confirmado: true, pagoDeId: original.id, fecha: new Date(),
    },
  });
  return { moneda: original.moneda };
}

export async function confirmarPendienteTx(tx: Tx, p: { movimientoId: string; cajaEsperada: string; userName: string }):
  Promise<{ accion: "CONFIRMAR_ORIGINAL" | "PAGO_RESIDUAL"; monto: Decimal }> {
  await lockMovimientosCaja(tx, [p.movimientoId]);
  const mov = await tx.movimientoCaja.findUnique({ where: { id: p.movimientoId } });
  if (!mov) throw new IntegridadError("Movimiento no encontrado");
  if (mov.cajaId !== p.cajaEsperada) throw new IntegridadError("El movimiento cambió durante la operación");
  if (mov.confirmado) throw new IntegridadError("El movimiento ya está confirmado");
  if (mov.anulado) throw new IntegridadError("El movimiento está anulado");
  if (mov.pagoDeId) throw new IntegridadError("Un pago parcial no se confirma por separado");

  const pagos = await pagosValidos(tx, mov.id);
  const plan = planConfirmacion(mov.monto.toString(), pagos.map((x) => x.monto));
  if (plan.accion === "RECHAZAR") throw new IntegridadError(plan.motivo);
  if (plan.accion === "CONFIRMAR_ORIGINAL") {
    await tx.movimientoCaja.update({ where: { id: mov.id }, data: { confirmado: true } });
    return { accion: plan.accion, monto: new Decimal(mov.monto.toString()) };
  }
  // Con pagos parciales: solo se impacta el residual (el original queda cubierto, nunca 100 + parciales).
  await tx.movimientoCaja.create({
    data: {
      id: crypto.randomUUID(), cajaId: mov.cajaId, tipo: mov.tipo, monto: plan.monto, moneda: mov.moneda,
      descripcion: `Pago final de pendiente ${mov.id} | usr:${p.userName}`,
      confirmado: true, pagoDeId: mov.id, fecha: new Date(),
    },
  });
  return { accion: plan.accion, monto: plan.monto };
}

export async function anularPendienteTx(tx: Tx, p: { movimientoId: string; motivo: string; userName: string }): Promise<void> {
  await lockMovimientosCaja(tx, [p.movimientoId]);
  const mov = await tx.movimientoCaja.findUnique({ where: { id: p.movimientoId } });
  if (!mov) throw new IntegridadError("Movimiento no encontrado");
  if (mov.confirmado) throw new IntegridadError("Solo se pueden anular movimientos pendientes (no confirmados)");
  if (mov.anulado) throw new IntegridadError("El movimiento ya está anulado");
  if (mov.pagoDeId) throw new IntegridadError("No se puede anular un pago parcial, solo el pendiente original");
  if ((await pagosValidos(tx, mov.id)).length > 0) {
    throw new IntegridadError("No se puede anular un pendiente con pagos parciales registrados");
  }
  await tx.movimientoCaja.update({
    where: { id: mov.id },
    data: { anulado: true, descripcion: `${mov.descripcion ?? ""} | ANULADO: ${p.motivo} | usr:${p.userName}`.trim() },
  });
}

// ── Reversión de movimientos (simples, pagos parciales, transferencias completas) ──

/**
 * Revierte un movimiento CONFIRMADO. Una transferencia (o cambio entre cajas) se
 * revierte COMPLETA: todas las patas de su transferenciaRef, en la misma tx.
 * Patas de una operación de cambio → solo desde la operación. Idempotente: una
 * segunda reversa (concurrente o no) se rechaza bajo lock.
 */
export async function revertirMovimientoTx(tx: Tx, p: { movimientoId: string; cajasAutorizadas: readonly string[] }):
  Promise<{ reversos: { id: string; cajaId: string }[] }> {
  const mov0 = await tx.movimientoCaja.findUnique({ where: { id: p.movimientoId } });
  if (!mov0) throw new IntegridadError("Movimiento no encontrado");
  const grupoIds = mov0.transferenciaRef
    ? (await tx.movimientoCaja.findMany({ where: { transferenciaRef: mov0.transferenciaRef }, select: { id: true } })).map((x) => x.id)
    : [mov0.id];
  await lockMovimientosCaja(tx, grupoIds);

  const grupo = await tx.movimientoCaja.findMany({ where: { id: { in: grupoIds } } });
  const mov = grupo.find((g) => g.id === p.movimientoId)!;
  if (!mov.confirmado) throw new IntegridadError("No se puede revertir un movimiento no confirmado");
  if (esReverso(mov.descripcion)) throw new IntegridadError("Este movimiento ya es un reverso");

  const vinculo = vinculoFinanciero(mov);
  if (vinculo === "CAMBIO") throw new IntegridadError("Movimiento de una operación de cambio: revertir desde la operación");
  if (vinculo === "CC") throw new IntegridadError("Movimiento de cuenta corriente: revertir desde Operaciones (Cuenta Corriente)");
  if (vinculo === "TRANSFERENCIA" && !mov.transferenciaRef) {
    throw new IntegridadError("Transferencia sin referencia estructurada: no se puede revertir una sola pata");
  }
  for (const g of grupo) {
    if (!p.cajasAutorizadas.includes(g.cajaId)) throw new IntegridadError("La operación cambió durante la reversión");
    if (!g.confirmado || esReverso(g.descripcion)) throw new IntegridadError("Par de transferencia inconsistente");
  }
  if ((await idsRevertidos(tx, grupo.map((g) => g.id))).size > 0) throw new IntegridadError("Este movimiento ya fue revertido");

  const refReverso = grupo.length > 1 ? crypto.randomUUID() : null;
  const reversos: { id: string; cajaId: string }[] = [];
  for (const g of grupo) {
    const tipo = TIPO_INVERSO[g.tipo];
    if (!tipo) throw new IntegridadError("Tipo de movimiento no reversible");
    const id = crypto.randomUUID();
    await tx.movimientoCaja.create({
      data: {
        id, cajaId: g.cajaId, tipo, monto: g.monto, moneda: g.moneda,
        descripcion: `${prefijoReverso(g.id)} ${g.descripcion ?? ""}`.slice(0, 500),
        confirmado: true, fecha: new Date(), transferenciaRef: refReverso,
      },
    });
    reversos.push({ id, cajaId: g.cajaId });
  }
  return { reversos };
}

// ── Operación de cambio ──────────────────────────────────────────────────────

/** cajaId: caja de la divisa (y del ARS salvo cajaArsId: cambio entre dos cajas). */
export interface ItemLiquidacion { cajaId: string; div: Decimal; ars: Decimal | null; cajaArsId?: string }

/**
 * Liquida (total o parcialmente) una operación de cambio. Bajo lock de la
 * operación: recalcula lo ya liquidado (neto de reversas), rechaza
 * sobreliquidación y operaciones revertidas, crea las patas con operacionCambioId
 * y actualiza el estado ([PARCIAL] mientras quede pendiente).
 */
export async function liquidarCambioTx(tx: Tx, p: {
  opId: string; items: ItemLiquidacion[] | "TOTAL"; cajaTotalId?: string; fecha: Date; etiqueta: "Cambio" | "Cobro Cambio"; userName: string;
}): Promise<{ liquidado: Decimal; completa: boolean; cajas: string[] }> {
  await lockOperacionCambio(tx, p.opId);
  const op = await tx.operacionCambio.findUnique({ where: { id: p.opId } });
  if (!op) throw new IntegridadError("Operación no encontrada");
  if (esOpRevertida(op.descripcion)) throw new IntegridadError("Operación revertida: no se puede volver a liquidar");
  if (!op.tipo.startsWith("COMPRA") && !op.tipo.startsWith("VENTA")) throw new IntegridadError("La operación no es de compra/venta de divisa");
  // MACRO 6: con patas CC vigentes, la operación se liquida por Cuenta Corriente, nunca también en Caja.
  if (await tieneCCVigente(tx, op.id)) throw new IntegridadError(MENSAJE_CAMBIO_CON_CC);

  const opMin = { tipo: op.tipo, moneda: op.moneda, cantidad: op.cantidad.toString(), tipoCambio: op.tipoCambio.toString() };
  const yaLiquidado = divisaLiquidada(opMin, (await movimientosDeCambio(tx, op.id)).map((m) => ({ ...m, monto: m.monto.toString() })));
  const tc = new Decimal(op.tipoCambio.toString());

  let items: ItemLiquidacion[];
  if (p.items === "TOTAL") {
    if (!p.cajaTotalId) throw new IntegridadError("Seleccioná una caja de liquidación");
    const pendiente = new Decimal(op.cantidad.toString()).minus(yaLiquidado);
    items = [{ cajaId: p.cajaTotalId, div: pendiente, ars: null }];
  } else {
    items = p.items;
  }
  const solicitado = items.reduce((s, i) => s.plus(i.div), new Decimal(0));
  const v = validarLiquidacion(opMin, yaLiquidado, solicitado);
  if (!v.ok) throw new IntegridadError(v.error);

  const parcial = solicitado.lt(v.pendiente);
  for (const it of items) {
    const ars = it.ars ?? it.div.mul(tc);
    for (const pata of patasLiquidacion(opMin, it.div, ars)) {
      await tx.movimientoCaja.create({
        data: {
          id: crypto.randomUUID(), cajaId: pata.moneda === "ARS" ? (it.cajaArsId ?? it.cajaId) : it.cajaId,
          fecha: p.fecha, tipo: pata.tipo, moneda: pata.moneda as never,
          monto: pata.monto, descripcion: `[${p.etiqueta} ${op.id}] ${pata.etiqueta}${parcial || items.length > 1 ? " parcial" : ""} | usr:${p.userName}`,
          confirmado: true, operacionCambioId: op.id,
        },
      });
    }
  }
  await tx.operacionCambio.update({
    where: { id: op.id },
    data: { pendiente: false, descripcion: conMarcaParcial(op.descripcion, parcial), updatedAt: new Date() },
  });
  const cajas = Array.from(new Set(items.flatMap((i) => [i.cajaId, i.cajaArsId ?? i.cajaId])));
  return { liquidado: yaLiquidado.plus(solicitado), completa: !parcial, cajas };
}

export interface EdicionCambio {
  opId: string;
  clienteNombre?: string; descripcion?: string; fecha: Date | null;
  tipoOp?: "COMPRA" | "VENTA"; moneda?: string; cantidad: Decimal | null; tipoCambio: Decimal | null;
  /** PENDIENTE → COBRADA: liquidar el pendiente real en esta caja. */
  cobro: { cajaId: string; userName: string } | null;
}

/**
 * L3 — Edita una operación de cambio bajo lock: relee, recalcula lo liquidado
 * (neto de reversas) y valida (no revertida, cambio económico solo si NO_LIQUIDADA,
 * sin CC, nuevo total ≥ liquidado) antes de actualizar. Una liquidación concurrente
 * toma el mismo lock: nunca queda liquidado > total.
 */
export async function editarCambioTx(tx: Tx, p: EdicionCambio): Promise<void> {
  await lockOperacionCambio(tx, p.opId);
  const op = await tx.operacionCambio.findUnique({ where: { id: p.opId } });
  if (!op) throw new IntegridadError("Operación no encontrada");

  const tipoOpActual = op.tipo.startsWith("COMPRA") ? "COMPRA" : "VENTA";
  const baseTipoOp = p.tipoOp ?? tipoOpActual;
  const baseMoneda = p.moneda ?? op.moneda;
  const cantidadFinal = p.cantidad ?? new Decimal(op.cantidad.toString());
  const tcFinal = p.tipoCambio ?? new Decimal(op.tipoCambio.toString());
  // Cambio económico = algún valor DISTINTO del actual (el formulario reenvía todos).
  const cambioEconomico =
    baseTipoOp !== tipoOpActual || baseMoneda !== op.moneda ||
    !cantidadFinal.eq(op.cantidad.toString()) || !tcFinal.eq(op.tipoCambio.toString());

  if ((cambioEconomico || p.cobro) && esOpRevertida(op.descripcion)) {
    throw new IntegridadError("Operación revertida: no se puede modificar ni liquidar");
  }
  const textoError = validarTextoEditado(op.descripcion, p.descripcion);
  if (textoError) throw new IntegridadError(textoError);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (p.clienteNombre) updateData.clienteNombre = p.clienteNombre;
  // MACRO 3: el texto libre se edita, las marcas de estado ([REVERTIDA POR:], [PARCIAL], [CC]) no.
  if (p.descripcion !== undefined) updateData.descripcion = descripcionOpEditada(op.descripcion, p.descripcion);

  if (cambioEconomico) {
    if (!op.pendiente) {
      throw new IntegridadError("Operación liquidada: tipo, moneda, cantidad y TC no se editan. Revertila y volvé a crearla.");
    }
    // La CC quedaría con los montos viejos: cancelar y volver a crear.
    if ((await movimientosCCDeCambio(tx, op.id)).length > 0) {
      throw new IntegridadError("La operación impactó cuenta corriente: para cambiar montos, cancelala y volvé a crearla");
    }
    // Lo ya liquidado (neto de reversas), recalculado bajo lock, debe seguir cabiendo.
    const opMin = { tipo: op.tipo, moneda: op.moneda, cantidad: op.cantidad.toString(), tipoCambio: op.tipoCambio.toString() };
    const liquidado = divisaLiquidada(opMin, (await movimientosDeCambio(tx, op.id)).map((m) => ({ ...m, monto: m.monto.toString() })));
    if (!liquidado.isZero() && (baseMoneda !== op.moneda || baseTipoOp !== tipoOpActual || cantidadFinal.lt(liquidado))) {
      throw new IntegridadError("La operación tiene liquidaciones: el nuevo total no puede quedar por debajo de lo liquidado");
    }
    updateData.tipo = `${baseTipoOp}_${baseMoneda}`;
    updateData.moneda = baseMoneda;
    updateData.cantidad = cantidadFinal;
    updateData.cobroUSD = (baseMoneda as string) === "USD" ? cantidadFinal : new Decimal(0);
    updateData.tipoCambio = tcFinal;
    updateData.totalARS = cantidadFinal.mul(tcFinal);
    updateData.cobroARS = cantidadFinal.mul(tcFinal);
  }
  if (op.pendiente && p.fecha) {
    updateData.fecha = p.fecha;
    updateData.mesContable = `${p.fecha.getUTCFullYear()}-${String(p.fecha.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  await tx.operacionCambio.update({ where: { id: op.id }, data: updateData });

  // PENDIENTE → COBRADA: liquidar el pendiente real (recalculado bajo el mismo lock).
  if (p.cobro && op.pendiente) {
    await liquidarCambioTx(tx, {
      opId: op.id, items: "TOTAL", cajaTotalId: p.cobro.cajaId, fecha: (updateData.fecha as Date | undefined) ?? op.fecha,
      etiqueta: "Cobro Cambio", userName: p.cobro.userName,
    });
  }
}

async function neutralizarCC(tx: Tx, opId: string, fecha: Date, motivo: string): Promise<void> {
  const netos = netoPorCuentaCC((await movimientosCCDeCambio(tx, opId)).map((m) => ({ ...m, tipo: m.tipo as string, monto: m.monto.toString() })));
  for (const n of netos) {
    await tx.movimientoCC.create({
      data: {
        id: crypto.randomUUID(), cuentaCorrienteId: n.cuentaCorrienteId, fecha,
        tipo: n.neto.gt(0) ? "EGRESO" : "INGRESO", monto: n.neto.abs(),
        descripcion: `[REVERSO] ${motivo} | op:${opId}`, operacionCambioId: opId,
      },
    });
    await tx.cuentaCorriente.update({ where: { id: n.cuentaCorrienteId }, data: { saldo: { increment: n.neto.neg() }, updatedAt: new Date() } });
  }
}

/** Cancela una operación NO_LIQUIDADA: neutraliza su CC (si la hubo) y la elimina, atómico. */
export async function cancelarCambioTx(tx: Tx, p: { opId: string; fecha: Date }): Promise<void> {
  await lockOperacionCambio(tx, p.opId);
  const op = await tx.operacionCambio.findUnique({ where: { id: p.opId } });
  if (!op) throw new IntegridadError("Operación no encontrada");
  if (!op.pendiente) throw new IntegridadError("Solo se pueden cancelar operaciones pendientes");
  // Una operación revertida (moderna o legacy) es historia terminal: no se elimina.
  if (esOpRevertida(op.descripcion)) throw new IntegridadError("Esta operación ya fue revertida: no se puede cancelar");
  if ((await movimientosDeCambio(tx, op.id)).length > 0) {
    throw new IntegridadError("No se puede eliminar una operación con movimientos de caja. Revertir desde historial.");
  }
  await neutralizarCC(tx, op.id, p.fecha, "Cancelación op cambio");
  await tx.operacionCambio.delete({ where: { id: op.id } });
}

/**
 * Revierte una operación liquidada: inverso del NETO de caja por (caja, moneda) y
 * del neto de CC por cuenta; la operación queda REVERTIDA (terminal).
 */
export async function revertirCambioTx(tx: Tx, p: { opId: string; revertidoPor: string; fecha: Date; cajasAutorizadas: readonly string[] }): Promise<void> {
  await lockOperacionCambio(tx, p.opId);
  const op = await tx.operacionCambio.findUnique({ where: { id: p.opId } });
  if (!op) throw new IntegridadError("Operación no encontrada");
  if (esOpRevertida(op.descripcion)) throw new IntegridadError("Esta operación ya fue revertida");
  const movs = await movimientosDeCambio(tx, op.id);
  // MACRO 6: una operación con CC queda "pendiente" en caja (se liquida por CC): su reversa
  // neutraliza las patas CC (una vez) y la deja REVERTIDA. Sin CC vigente ni caja, nada que revertir.
  if (op.pendiente && (movs.length > 0 || !(await tieneCCVigente(tx, op.id)))) {
    throw new IntegridadError("La operación ya es NO_LIQUIDADA, no necesita reversión");
  }
  const netos = netoPorCajaMoneda(movs.map((m) => ({ ...m, tipo: m.tipo as string, moneda: m.moneda as string, monto: m.monto.toString() })));
  for (const n of netos) {
    if (!p.cajasAutorizadas.includes(n.cajaId)) throw new IntegridadError("La operación cambió durante la reversión");
    await tx.movimientoCaja.create({
      data: {
        id: crypto.randomUUID(), cajaId: n.cajaId, fecha: p.fecha, tipo: n.neto.gt(0) ? "SALIDA" : "ENTRADA",
        moneda: n.moneda as never, monto: n.neto.abs(),
        descripcion: `[REVERSO Cambio ${op.id}] Reverso de liquidación`, confirmado: true, operacionCambioId: op.id,
      },
    });
  }
  await neutralizarCC(tx, op.id, p.fecha, "Reverso op cambio");
  await tx.operacionCambio.update({
    where: { id: op.id },
    data: { pendiente: true, descripcion: `[REVERTIDA POR: ${p.revertidoPor}] ${op.descripcion ?? ""}`.slice(0, 500), updatedAt: new Date() },
  });
}
