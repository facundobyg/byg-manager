// MACRO 5 (M5-F02) — AJUSTE / APERTURA manual de posición de cartera propia.
//
// NO es una compra ni una venta: modifica la posición (cantidad / costo) y NO mueve
// el cash de la cartera. Para que no se confunda con una operación bursátil:
//   - exige una confirmación explícita del formulario (confirmarAjuste = "on");
//   - corre bajo el lock de la cartera (serializa con concertaciones / anulaciones);
//   - el AuditLog AJUSTE_POSICION (antes / después) se escribe en la MISMA tx:
//     no puede existir un ajuste sin su traza.

import type { Prisma, CategoriaActivo, Moneda } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

type Tx = Prisma.TransactionClient;

export class AjusteCarteraError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AjusteCarteraError";
  }
}

export const AVISO_AJUSTE = "Confirmá que es un ajuste / apertura sin movimiento de cash (para compras y ventas usá Bolsa)";

interface Tenencia { cantidad: string; costo: string }

async function auditar(tx: Tx, p: { userId: string; entidadId: string; ticker: string; antes: Tenencia | null; despues: Tenencia | null }) {
  const fmt = (t: Tenencia | null) => (t ? `${t.cantidad} @ ${t.costo}` : "—");
  await tx.auditLog.create({
    data: {
      id: crypto.randomUUID(), userId: p.userId, accion: "AJUSTE_POSICION", entidad: "PosicionCartera", entidadId: p.entidadId,
      datosPrevios: p.antes ? { ticker: p.ticker, ...p.antes } : { ticker: p.ticker },
      datosNuevos: { ticker: p.ticker, ...(p.despues ?? {}), description: `Ajuste de posición ${p.ticker} (sin cash): ${fmt(p.antes)} → ${fmt(p.despues)}` },
    },
  });
}

/** Alta / acumulación de posición por ajuste o apertura (costo promedio ponderado, sin cash). */
export async function ajusteAperturaPosicionTx(tx: Tx, p: {
  userId: string; confirmarAjuste: boolean; carteraId: string; ticker: string; descripcion: string | null;
  categoria: CategoriaActivo; monedaPrecio: Moneda; cantidad: Decimal; precio: Decimal; fecha: Date;
}): Promise<{ antes: Tenencia | null; despues: Tenencia }> {
  if (!p.confirmarAjuste) throw new AjusteCarteraError(AVISO_AJUSTE);
  await tx.$queryRaw`SELECT id FROM "Cartera" WHERE id = ${p.carteraId} FOR UPDATE`;
  const activo = await tx.activo.findUnique({ where: { ticker: p.ticker } })
    ?? await tx.activo.create({ data: { id: crypto.randomUUID(), ticker: p.ticker, descripcion: p.descripcion, categoria: p.categoria, monedaPrecio: p.monedaPrecio, updatedAt: new Date() } });
  const existing = await tx.posicionCartera.findUnique({ where: { carteraId_activoId: { carteraId: p.carteraId, activoId: activo.id } } });
  let antes: Tenencia | null = null;
  let despues: Tenencia;
  if (existing) {
    const qtyExist = new Decimal(existing.cantidad.toString());
    const pcExist = new Decimal(existing.precioCompra.toString());
    const totalQty = qtyExist.plus(p.cantidad);
    const nuevoPrecio = qtyExist.mul(pcExist).plus(p.cantidad.mul(p.precio)).div(totalQty).toDecimalPlaces(6);
    antes = { cantidad: qtyExist.toString(), costo: pcExist.toString() };
    await tx.posicionCartera.update({ where: { id: existing.id }, data: { cantidad: totalQty, precioCompra: nuevoPrecio, updatedAt: new Date() } });
    despues = { cantidad: totalQty.toString(), costo: nuevoPrecio.toString() };
  } else {
    await tx.posicionCartera.create({
      data: { id: crypto.randomUUID(), carteraId: p.carteraId, activoId: activo.id, cantidad: p.cantidad, precioCompra: p.precio, fecha: p.fecha, updatedAt: new Date() },
    });
    despues = { cantidad: p.cantidad.toString(), costo: p.precio.toString() };
  }
  await auditar(tx, { userId: p.userId, entidadId: p.carteraId, ticker: p.ticker, antes, despues });
  return { antes, despues };
}

/** Ajuste de una posición existente (cantidad / costo / fecha), sin cash. */
export async function ajustePosicionTx(tx: Tx, p: {
  userId: string; confirmarAjuste: boolean; posicionId: string; cantidad?: Decimal; precioCompra?: Decimal; fecha?: Date;
}): Promise<{ antes: Tenencia; despues: Tenencia }> {
  if (!p.confirmarAjuste) throw new AjusteCarteraError(AVISO_AJUSTE);
  const pos0 = await tx.posicionCartera.findUnique({ where: { id: p.posicionId }, select: { carteraId: true } });
  if (!pos0) throw new AjusteCarteraError("Posición no encontrada");
  await tx.$queryRaw`SELECT id FROM "Cartera" WHERE id = ${pos0.carteraId} FOR UPDATE`;
  const pos = await tx.posicionCartera.findUniqueOrThrow({ where: { id: p.posicionId }, include: { Activo: { select: { ticker: true } } } });
  // Valores previos copiados ANTES del update.
  const antes = { cantidad: pos.cantidad.toString(), costo: pos.precioCompra.toString() };
  const despues = { cantidad: (p.cantidad ?? new Decimal(antes.cantidad)).toString(), costo: (p.precioCompra ?? new Decimal(antes.costo)).toString() };
  await tx.posicionCartera.update({
    where: { id: p.posicionId },
    data: { ...(p.cantidad ? { cantidad: p.cantidad } : {}), ...(p.precioCompra ? { precioCompra: p.precioCompra } : {}), ...(p.fecha ? { fecha: p.fecha } : {}), updatedAt: new Date() },
  });
  await auditar(tx, { userId: p.userId, entidadId: p.posicionId, ticker: pos.Activo.ticker, antes, despues });
  return { antes, despues };
}
