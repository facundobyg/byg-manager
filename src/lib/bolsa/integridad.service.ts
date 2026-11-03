// MACRO 5 — Operaciones TRANSACCIONALES de Bolsa / Carteras propias (sin auth: las
// Server Actions autorizan antes y llaman acá dentro de prisma.$transaction).
//
//   - Lock de la operación (FOR UPDATE) → relectura → transición de estado.
//   - Lock del SUJETO (Cartera / ComitenteInversion) antes de leer posición / holding:
//     dos operaciones sobre la misma cartera se serializan (no hay doble venta).
//   - Cash de cartera y saldo comitente por increment atómico.
//   - Los efectos aplicados al concertar se registran (OperacionBolsaLog
//     EFECTOS_CONCERTACION) y la anulación los neutraliza EXACTAMENTE, solo si la
//     tenencia sigue igual (si hubo operaciones posteriores: fail closed).

import { Prisma, type CategoriaActivo, type CategoriaHoldingInversion, type PlazoLiquidacion } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  calcularLiquidacion, campoSaldoCartera, campoSaldoComitente, costoPromedioTrasCompra, esCompraActivo, esVentaActivo,
  requiereSaldoUSD, tenenciaIgual, validarEdicionConcertada, type CostosOperacion, type EfectosConcertacion, type EstadoTenencia,
  type SaldoUSD,
} from "./integridad";

type Tx = Prisma.TransactionClient;

export class BolsaIntegridadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BolsaIntegridadError";
  }
}

const TIPO_TO_HOLDING: Record<string, CategoriaHoldingInversion> = {
  COMPRA_BONO: "BONO", VENTA_BONO: "BONO", COMPRA_ACCION: "ACCION", VENTA_ACCION: "ACCION", COMPRA_CEDEAR: "CEDEAR", VENTA_CEDEAR: "CEDEAR",
};

function inferCategoriaActivo(tipo: string, moneda: string): CategoriaActivo {
  if (tipo === "COMPRA_CEDEAR" || tipo === "VENTA_CEDEAR") return "CEDEAR";
  if (tipo === "COMPRA_ACCION" || tipo === "VENTA_ACCION") return "ACCION_USD";
  if (tipo === "COMPRA_BONO" || tipo === "VENTA_BONO") return moneda === "ARS" ? "BONO_ARS" : "BONO_USD";
  return "BONO_USD";
}

const D = (v: Decimal.Value | { toString(): string }) => new Decimal(v.toString());
const tenencia = (cantidad: Decimal.Value | { toString(): string }, costo: Decimal.Value | { toString(): string }): EstadoTenencia =>
  ({ cantidad: D(cantidad).toString(), costo: D(costo).toString() });

async function lockOperacion(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT id FROM "OperacionBolsa" WHERE id = ${id} FOR UPDATE`;
}
async function lockCartera(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT id FROM "Cartera" WHERE id = ${id} FOR UPDATE`;
}
async function lockComitente(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT id FROM "ComitenteInversion" WHERE id = ${id} FOR UPDATE`;
}

// ── Concertar ────────────────────────────────────────────────────────────────

export interface DatosConcertacion {
  nroBoleto: string | null; alyc: string | null; fechaConcertacion: Date | null; fechaLiquidacion: Date | null;
  plazoLiquidacion: PlazoLiquidacion; costos: CostosOperacion; comisionUSD: Decimal | null; tcMepDia: Decimal | null;
  esSenebi: boolean; senebiBruto: Decimal | null; diasCaucion: number | null; tasaCaucion: Decimal | null;
  /** Bolsa de USD de la cartera propia (solo operaciones USD de cartera). */
  saldoUSD: SaldoUSD | null;
}

/**
 * PENDIENTE → CONCERTADA con todos sus efectos en la MISMA tx. Sobre una operación
 * ya CONCERTADA solo se editan datos sin efecto económico (boleto, ALYC, fechas, plazo).
 */
export async function concertarOperacionTx(tx: Tx, p: { operacionId: string; userId: string; datos: DatosConcertacion }):
  Promise<{ nueva: boolean; efectos: EfectosConcertacion | null }> {
  await lockOperacion(tx, p.operacionId);
  const op = await tx.operacionBolsa.findUnique({ where: { id: p.operacionId } });
  if (!op) throw new BolsaIntegridadError("Operación no encontrada");
  if (op.anulada || op.estado === "ANULADA") throw new BolsaIntegridadError("Operación anulada, no modificable");
  if (op.estado === "LIQUIDADA") throw new BolsaIntegridadError("Operación liquidada, no modificable");

  const d = p.datos;
  const liq = calcularLiquidacion(op.tipoOperacion, D(op.cantidad), D(op.precio), d.costos);
  const inocuos = {
    nroBoleto: d.nroBoleto, alyc: d.alyc, fechaConcertacion: d.fechaConcertacion, fechaLiquidacion: d.fechaLiquidacion,
    plazoLiquidacion: d.plazoLiquidacion, updatedAt: new Date(),
  };

  // M5-F01: la bolsa de USD es un dato explícito de la operación (sin inferencias).
  const usaSaldoUSD = requiereSaldoUSD(op);
  if (!usaSaldoUSD && d.saldoUSD) throw new BolsaIntegridadError("La bolsa de USD (Cable / MEP) solo aplica a compras y ventas USD de cartera propia");

  if (op.estado === "CONCERTADA") {
    // Legacy concertada sin elección: su semántica histórica es Cable (así quedó en sus efectos).
    if (usaSaldoUSD && d.saldoUSD && d.saldoUSD !== (op.saldoUSD ?? "CABLE")) {
      throw new BolsaIntegridadError("Operación concertada: la bolsa de USD no se edita (ya impactó el saldo). Anulala y cargala de nuevo.");
    }
    const err = validarEdicionConcertada(
      { netoLiquidado: op.netoLiquidado, costoReal: op.costoReal, comisionUSD: op.comisionUSD, tcMepDia: op.tcMepDia, esSenebi: op.esSenebi },
      { neto: liq.neto, costoReal: liq.costoReal, comisionUSD: d.comisionUSD, tcMepDia: d.tcMepDia, esSenebi: d.esSenebi },
    );
    if (err) throw new BolsaIntegridadError(err);
    await tx.operacionBolsa.update({ where: { id: op.id }, data: inocuos });
    await tx.operacionBolsaLog.create({
      data: { id: crypto.randomUUID(), operacionId: op.id, userId: p.userId, accion: "EDICION", estadoAnterior: op.estado, estadoNuevo: "CONCERTADA", snapshot: { nroBoleto: d.nroBoleto, alyc: d.alyc } },
    });
    return { nueva: false, efectos: null };
  }

  if (usaSaldoUSD && !d.saldoUSD) throw new BolsaIntegridadError("Elegí la bolsa de USD de la cartera (Cable o MEP)");

  await tx.operacionBolsa.update({
    where: { id: op.id },
    data: {
      ...inocuos, estado: "CONCERTADA", operadorCierreId: p.userId, saldoUSD: usaSaldoUSD ? d.saldoUSD : null,
      comisionPct: d.costos.comisionPct, comisionFija: d.costos.comisionFija, derechosMercado: d.costos.derechosMercado,
      gastos: d.costos.gastos, impuestos: d.costos.impuestos, tcMepDia: d.tcMepDia, comisionUSD: d.comisionUSD,
      esSenebi: d.esSenebi, senebiBruto: d.esSenebi ? d.senebiBruto : null, diasCaucion: d.diasCaucion, tasaCaucion: d.tasaCaucion,
      costoReal: liq.costoReal, netoLiquidado: liq.neto, precioPromedioReal: liq.precioPromedioReal,
    },
  });
  await tx.operacionBolsaLog.create({
    data: {
      id: crypto.randomUUID(), operacionId: op.id, userId: p.userId, accion: "CONCERTACION", estadoAnterior: op.estado, estadoNuevo: "CONCERTADA",
      snapshot: { nroBoleto: d.nroBoleto, alyc: d.alyc, costoReal: liq.costoReal.toString(), netoLiquidado: liq.neto.toString(), precioPromedioReal: liq.precioPromedioReal?.toString() ?? null },
    },
  });

  const compra = esCompraActivo(op.tipoOperacion), venta = esVentaActivo(op.tipoOperacion);
  let efectos: EfectosConcertacion | null = null;
  if ((compra || venta) && op.carteraId) {
    efectos = await efectosCartera(tx, { op, compra, cantidad: D(op.cantidad), neto: liq.neto, userId: p.userId, saldoUSD: d.saldoUSD });
  } else if ((compra || venta) && op.comitenteId && TIPO_TO_HOLDING[op.tipoOperacion]) {
    efectos = await efectosComitente(tx, { op, compra, cantidad: D(op.cantidad), neto: liq.neto, precio: D(op.precio) });
  }
  if (efectos) {
    await tx.operacionBolsaLog.create({
      data: { id: crypto.randomUUID(), operacionId: op.id, userId: p.userId, accion: "EFECTOS_CONCERTACION", estadoAnterior: op.estado, estadoNuevo: "CONCERTADA", snapshot: efectos as unknown as Prisma.InputJsonValue },
    });
  }
  return { nueva: true, efectos };
}

type OpRow = NonNullable<Awaited<ReturnType<Tx["operacionBolsa"]["findUnique"]>>>;

async function efectosCartera(tx: Tx, p: { op: OpRow; compra: boolean; cantidad: Decimal; neto: Decimal; userId: string; saldoUSD: SaldoUSD | null }): Promise<EfectosConcertacion> {
  const { op } = p;
  const carteraId = op.carteraId!;
  // El campo elegido queda en EFECTOS_CONCERTACION: la anulación revierte sobre la MISMA bolsa.
  const campo = campoSaldoCartera(op.moneda, p.saldoUSD);
  if (!campo) throw new BolsaIntegridadError(`La cartera no tiene saldo en ${op.moneda}: la operación no se puede concertar`);
  await lockCartera(tx, carteraId);

  const activo = await tx.activo.upsert({
    where: { ticker: op.ticker }, update: {},
    create: { id: crypto.randomUUID(), ticker: op.ticker, categoria: inferCategoriaActivo(op.tipoOperacion, op.moneda), monedaPrecio: op.moneda, updatedAt: new Date() },
  });
  const pos = await tx.posicionCartera.findUnique({ where: { carteraId_activoId: { carteraId, activoId: activo.id } } });
  const antes = pos ? tenencia(pos.cantidad, pos.precioCompra) : null;
  let despues: EstadoTenencia | null;
  let delta: Decimal;

  if (p.compra) {
    const n = costoPromedioTrasCompra(pos ? D(pos.cantidad) : new Decimal(0), pos ? D(pos.precioCompra) : new Decimal(0), p.cantidad, p.neto);
    if (pos) {
      await tx.posicionCartera.update({ where: { id: pos.id }, data: { cantidad: n.cantidad, precioCompra: n.costo, updatedAt: new Date() } });
    } else {
      await tx.posicionCartera.create({
        data: { id: crypto.randomUUID(), carteraId, activoId: activo.id, cantidad: n.cantidad, precioCompra: n.costo, fecha: new Date(), updatedAt: new Date() },
      });
    }
    despues = tenencia(n.cantidad, n.costo);
    delta = p.neto.neg();
  } else {
    if (!pos || D(pos.cantidad).lt(p.cantidad)) {
      throw new BolsaIntegridadError(`Stock insuficiente para ${op.ticker}. Disponible: ${pos ? D(pos.cantidad).toString() : "0"}, solicitado: ${p.cantidad.toString()}.`);
    }
    // Costo promedio de lo vendido para el resultado realizado (motor, Macro 2).
    await tx.operacionBolsaLog.create({
      data: {
        id: crypto.randomUUID(), operacionId: op.id, userId: p.userId, accion: "COSTO_CARTERA", estadoAnterior: op.estado, estadoNuevo: "CONCERTADA",
        snapshot: { costoUnitario: D(pos.precioCompra).toString(), cantidad: p.cantidad.toString() },
      },
    });
    const resto = D(pos.cantidad).minus(p.cantidad);
    if (resto.isZero()) {
      await tx.posicionCartera.delete({ where: { id: pos.id } });
      despues = null;
    } else {
      await tx.posicionCartera.update({ where: { id: pos.id }, data: { cantidad: resto, updatedAt: new Date() } });
      despues = tenencia(resto, pos.precioCompra);
    }
    delta = p.neto;
  }
  await tx.cartera.update({ where: { id: carteraId }, data: { [campo]: { increment: delta }, updatedAt: new Date() } });
  return { version: 1, sujeto: "CARTERA", sujetoId: carteraId, saldo: { campo, delta: delta.toString() }, tenencia: { clave: activo.id, antes, despues }, operacionHoldingId: null };
}

async function efectosComitente(tx: Tx, p: { op: OpRow; compra: boolean; cantidad: Decimal; neto: Decimal; precio: Decimal }): Promise<EfectosConcertacion> {
  const { op } = p;
  const comitenteId = op.comitenteId!;
  const campo = campoSaldoComitente(op.moneda);
  if (!campo) throw new BolsaIntegridadError(`El comitente no tiene saldo en ${op.moneda}: la operación no se puede concertar`);
  await lockComitente(tx, comitenteId);
  const categoria = TIPO_TO_HOLDING[op.tipoOperacion];

  const holding = await tx.holdingComitenteInversion.findUnique({ where: { comitenteId_ticker: { comitenteId, ticker: op.ticker } } });
  const antes = holding ? tenencia(holding.cantidad, holding.precioPromedio) : null;
  let despues: EstadoTenencia | null;
  const operacionHoldingId = crypto.randomUUID();
  const neto = p.neto.abs();

  if (p.compra) {
    const n = costoPromedioTrasCompra(holding ? D(holding.cantidad) : new Decimal(0), holding ? D(holding.precioPromedio) : new Decimal(0), p.cantidad, neto);
    let holdingId = holding?.id ?? null;
    if (holding) {
      await tx.holdingComitenteInversion.update({ where: { id: holding.id }, data: { cantidad: n.cantidad, precioPromedio: n.costo, updatedAt: new Date() } });
    } else {
      holdingId = crypto.randomUUID();
      await tx.holdingComitenteInversion.create({
        data: { id: holdingId, comitenteId, ticker: op.ticker, categoria, cantidad: n.cantidad, precioPromedio: n.costo, updatedAt: new Date() },
      });
    }
    await tx.operacionHoldingInversion.create({
      data: {
        id: operacionHoldingId, comitenteId, holdingId, tipo: "COMPRA", ticker: op.ticker, categoria, cantidad: p.cantidad, precio: p.precio,
        precioPromedio: neto.div(p.cantidad).toDecimalPlaces(6), notas: `Bolsa #${op.id.slice(0, 8)}`,
      },
    });
    despues = tenencia(n.cantidad, n.costo);
  } else {
    if (!holding || D(holding.cantidad).lt(p.cantidad)) throw new BolsaIntegridadError("No se puede vender: el cliente no tiene posición suficiente");
    const resto = D(holding.cantidad).minus(p.cantidad);
    await tx.operacionHoldingInversion.create({
      data: {
        id: operacionHoldingId, comitenteId, holdingId: resto.isZero() ? null : holding.id, tipo: "VENTA", ticker: op.ticker, categoria,
        cantidad: p.cantidad, precio: p.precio, precioPromedio: holding.precioPromedio, notas: `Bolsa #${op.id.slice(0, 8)}`,
      },
    });
    if (resto.isZero()) {
      await tx.operacionHoldingInversion.updateMany({ where: { holdingId: holding.id }, data: { holdingId: null } });
      await tx.holdingComitenteInversion.delete({ where: { id: holding.id } });
      despues = null;
    } else {
      await tx.holdingComitenteInversion.update({ where: { id: holding.id }, data: { cantidad: resto, updatedAt: new Date() } });
      despues = tenencia(resto, holding.precioPromedio);
    }
  }
  const delta = p.compra ? neto.neg() : neto;
  await tx.saldoComitenteInversion.upsert({
    where: { comitenteId },
    create: { id: crypto.randomUUID(), comitenteId, saldoARS: 0, saldoUSDCable: 0, saldoUSDMep: 0, updatedAt: new Date() },
    update: {},
  });
  await tx.saldoComitenteInversion.update({ where: { comitenteId }, data: { [campo]: { increment: delta }, updatedAt: new Date() } });
  return { version: 1, sujeto: "COMITENTE", sujetoId: comitenteId, saldo: { campo, delta: delta.toString() }, tenencia: { clave: op.ticker, antes, despues }, operacionHoldingId };
}

// ── Liquidar ─────────────────────────────────────────────────────────────────

/** CONCERTADA → LIQUIDADA: settlement de efectos ya aplicados al concertar; una sola vez. */
export async function liquidarOperacionTx(tx: Tx, p: { operacionId: string; userId: string; fechaLiquidacion: Date | null }): Promise<void> {
  await lockOperacion(tx, p.operacionId);
  const op = await tx.operacionBolsa.findUnique({ where: { id: p.operacionId } });
  if (!op) throw new BolsaIntegridadError("Operación no encontrada");
  if (op.anulada || op.estado === "ANULADA") throw new BolsaIntegridadError("Operación anulada: no se puede liquidar");
  if (op.estado === "LIQUIDADA") throw new BolsaIntegridadError("La operación ya está liquidada");
  if (op.estado !== "CONCERTADA") throw new BolsaIntegridadError("Solo se liquida una operación concertada");
  await tx.operacionBolsa.update({
    where: { id: op.id },
    data: { estado: "LIQUIDADA", fechaLiquidacion: p.fechaLiquidacion ?? op.fechaLiquidacion ?? new Date(), updatedAt: new Date() },
  });
  await tx.operacionBolsaLog.create({
    data: { id: crypto.randomUUID(), operacionId: op.id, userId: p.userId, accion: "LIQUIDACION", estadoAnterior: "CONCERTADA", estadoNuevo: "LIQUIDADA", snapshot: {} },
  });
}

// ── Anular ───────────────────────────────────────────────────────────────────

/**
 * Anula una operación una sola vez. Si había concertado (CONCERTADA o LIQUIDADA),
 * neutraliza exactamente los efectos registrados: tenencia (cantidad + costo),
 * cash / saldo comitente y el movimiento de holding. Si la tenencia cambió desde
 * entonces, o la operación es legacy sin efectos registrados: DENY (fail closed).
 */
export async function anularOperacionTx(tx: Tx, p: { operacionId: string; userId: string; motivo: string }): Promise<{ revertido: EfectosConcertacion | null }> {
  await lockOperacion(tx, p.operacionId);
  const op = await tx.operacionBolsa.findUnique({ where: { id: p.operacionId } });
  if (!op) throw new BolsaIntegridadError("Operación no encontrada");
  if (op.anulada || op.estado === "ANULADA") throw new BolsaIntegridadError("Operación ya anulada");

  const concertada = op.estado === "CONCERTADA" || op.estado === "LIQUIDADA";
  const conTenencia = esCompraActivo(op.tipoOperacion) || esVentaActivo(op.tipoOperacion);
  let efectos: EfectosConcertacion | null = null;
  if (concertada && conTenencia && (op.carteraId || op.comitenteId)) {
    const log = await tx.operacionBolsaLog.findFirst({ where: { operacionId: op.id, accion: "EFECTOS_CONCERTACION" }, orderBy: { createdAt: "desc" } });
    if (!log) {
      throw new BolsaIntegridadError("Operación concertada sin registro de efectos (legacy): no se anula automáticamente; requiere un ajuste explícito");
    }
    efectos = log.snapshot as unknown as EfectosConcertacion;
    await revertirEfectos(tx, efectos);
  }

  await tx.operacionBolsa.update({ where: { id: op.id }, data: { estado: "ANULADA", anulada: true, motivoAnulacion: p.motivo, updatedAt: new Date() } });
  await tx.operacionBolsaLog.create({
    data: {
      id: crypto.randomUUID(), operacionId: op.id, userId: p.userId, accion: "ANULACION", estadoAnterior: op.estado, estadoNuevo: "ANULADA",
      snapshot: { motivoAnulacion: p.motivo, efectosRevertidos: efectos as unknown as Prisma.InputJsonValue ?? null },
    },
  });
  return { revertido: efectos };
}

async function revertirEfectos(tx: Tx, e: EfectosConcertacion): Promise<void> {
  if (e.sujeto === "CARTERA") {
    await lockCartera(tx, e.sujetoId);
    if (e.tenencia) {
      const pos = await tx.posicionCartera.findUnique({ where: { carteraId_activoId: { carteraId: e.sujetoId, activoId: e.tenencia.clave } } });
      if (!tenenciaIgual(e.tenencia.despues, pos ? { cantidad: pos.cantidad, costo: pos.precioCompra } : null)) {
        throw new BolsaIntegridadError("La posición cambió después de esta operación: anulá primero las operaciones/ajustes posteriores");
      }
      const antes = e.tenencia.antes;
      if (!antes) {
        await tx.posicionCartera.delete({ where: { id: pos!.id } });
      } else if (pos) {
        await tx.posicionCartera.update({ where: { id: pos.id }, data: { cantidad: D(antes.cantidad), precioCompra: D(antes.costo), updatedAt: new Date() } });
      } else {
        await tx.posicionCartera.create({
          data: { id: crypto.randomUUID(), carteraId: e.sujetoId, activoId: e.tenencia.clave, cantidad: D(antes.cantidad), precioCompra: D(antes.costo), fecha: new Date(), updatedAt: new Date() },
        });
      }
    }
    if (e.saldo) await tx.cartera.update({ where: { id: e.sujetoId }, data: { [e.saldo.campo]: { increment: D(e.saldo.delta).neg() }, updatedAt: new Date() } });
    return;
  }

  await lockComitente(tx, e.sujetoId);
  if (e.tenencia) {
    const h = await tx.holdingComitenteInversion.findUnique({ where: { comitenteId_ticker: { comitenteId: e.sujetoId, ticker: e.tenencia.clave } } });
    if (!tenenciaIgual(e.tenencia.despues, h ? { cantidad: h.cantidad, costo: h.precioPromedio } : null)) {
      throw new BolsaIntegridadError("La tenencia del comitente cambió después de esta operación: anulá primero las operaciones posteriores");
    }
    const movHolding = e.operacionHoldingId
      ? await tx.operacionHoldingInversion.findUnique({ where: { id: e.operacionHoldingId }, select: { categoria: true } })
      : null;
    if (e.operacionHoldingId) await tx.operacionHoldingInversion.deleteMany({ where: { id: e.operacionHoldingId } });
    const antes = e.tenencia.antes;
    if (!antes) {
      await tx.operacionHoldingInversion.updateMany({ where: { holdingId: h!.id }, data: { holdingId: null } });
      await tx.holdingComitenteInversion.delete({ where: { id: h!.id } });
    } else if (h) {
      await tx.holdingComitenteInversion.update({ where: { id: h.id }, data: { cantidad: D(antes.cantidad), precioPromedio: D(antes.costo), updatedAt: new Date() } });
    } else {
      if (!movHolding) throw new BolsaIntegridadError("Falta el movimiento de holding de la operación: no se puede reponer la tenencia");
      await tx.holdingComitenteInversion.create({
        data: {
          id: crypto.randomUUID(), comitenteId: e.sujetoId, ticker: e.tenencia.clave, categoria: movHolding.categoria,
          cantidad: D(antes.cantidad), precioPromedio: D(antes.costo), updatedAt: new Date(),
        },
      });
    }
  }
  if (e.saldo) await tx.saldoComitenteInversion.update({ where: { comitenteId: e.sujetoId }, data: { [e.saldo.campo]: { increment: D(e.saldo.delta).neg() }, updatedAt: new Date() } });
}
