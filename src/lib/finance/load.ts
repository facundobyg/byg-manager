// MACRO 2 — Carga de datos (solo lectura) desde las tablas existentes hacia el
// FinanceDataset que consume el motor. No escribe nada.

import type { Prisma, PrismaClient } from "@prisma/client";
import type { DsRegistroCuenta, FinanceDataset } from "./dataset";
import type { FxBaseApertura, MonedaFx } from "./fx-cost-basis";
import { construirResolver } from "./tc";
import { esMoneda, fechaISO, type Moneda } from "./types";
import { fechaNegocio } from "../fecha-negocio";

type Db = Pick<PrismaClient,
  | "caja" | "movimientoCaja" | "operacionCambio" | "operacionBolsa" | "operacionBolsaLog" | "movimientoCC"
  | "plazoFijoMovimiento" | "inversionInmobiliaria" | "propiedad" | "cartera" | "cliente" | "custodiaCliente"
  | "operacionRulo" | "operacionDivInt" | "operacionLargoPlazo" | "config" | "tipoCambio">;

/**
 * "Hoy" del motor = FECHA DE NEGOCIO (día calendario en America/Argentina/Buenos_Aires),
 * no el día del servidor (Vercel = UTC: después de las 21:00 ART ya sería mañana). P1-03A.2.
 */
export function hoyLocal(now = new Date()): string {
  return fechaNegocio(now);
}

function moneda(v: string): Moneda {
  if (!esMoneda(v)) throw new Error(`Moneda desconocida: ${v}`);
  return v;
}

function registroDesdeDetalles(origen: DsRegistroCuenta["origen"], r: { id: string; fecha: Date; detalles: Prisma.JsonValue }): DsRegistroCuenta {
  const d = (r.detalles && typeof r.detalles === "object" && !Array.isArray(r.detalles) ? r.detalles : {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : 0) || 0;
  return {
    id: r.id, origen, fecha: fechaISO(r.fecha),
    cuenta: typeof d.cuenta === "string" ? d.cuenta : null,
    usd: num(d.usd ?? d.totalUSD), ars: num(d.ars),
  };
}

function parseApertura(valor: string | undefined): Partial<Record<MonedaFx, FxBaseApertura>> {
  if (!valor) return {};
  try {
    const raw = JSON.parse(valor) as Record<string, { cantidad?: unknown; costoARS?: unknown; fecha?: unknown }>;
    const out: Partial<Record<MonedaFx, FxBaseApertura>> = {};
    for (const m of ["USD", "EUR", "BRL"] as const) {
      const a = raw[m];
      if (!a || typeof a.fecha !== "string") continue;
      out[m] = { cantidad: String(a.cantidad ?? 0), costoARS: String(a.costoARS ?? 0), fecha: a.fecha.slice(0, 10) };
    }
    return out;
  } catch {
    return {};
  }
}

export async function cargarFinanceDataset(db: Db, now = new Date()): Promise<FinanceDataset> {
  const [
    cajas, movsCaja, opsCambio, opsBolsa, logsCosto, movsCC, movsCCRev, pfMovs, inmuebles, propiedades,
    carteras, clientes, custodia, rulos, divInt, lp, configs, tipoCambio,
  ] = await Promise.all([
    db.caja.findMany({ select: { id: true, label: true, activa: true, saldoInicialUSD: true, saldoInicialARS: true } }),
    db.movimientoCaja.findMany({
      select: {
        id: true, cajaId: true, fecha: true, createdAt: true, tipo: true, moneda: true, monto: true, descripcion: true,
        confirmado: true, anulado: true, pagoDeId: true, operacionCambioId: true,
      },
    }),
    db.operacionCambio.findMany({
      select: { id: true, fecha: true, createdAt: true, tipo: true, moneda: true, cantidad: true, totalARS: true, cobroUSD: true, descripcion: true, pendiente: true },
    }),
    db.operacionBolsa.findMany({
      select: {
        id: true, tipoOperacion: true, ticker: true, cantidad: true, precio: true, moneda: true, estado: true, anulada: true,
        grupoArbitrajeId: true, carteraId: true, comitenteId: true, fechaOperativa: true, createdAt: true,
        netoLiquidado: true, costoReal: true,
      },
    }),
    db.operacionBolsaLog.findMany({ where: { accion: "COSTO_CARTERA" }, select: { operacionId: true, snapshot: true } }),
    db.movimientoCC.findMany({
      where: { tipo: "INTERES" },
      select: { id: true, fecha: true, tipo: true, monto: true, descripcion: true, CuentaCorriente: { select: { moneda: true, clienteId: true } } },
    }),
    db.movimientoCC.findMany({
      where: { OR: [{ descripcion: { startsWith: "REVERSO INTERES" } }, { descripcion: { contains: "movref:" } }] },
      select: { id: true, fecha: true, descripcion: true },
    }),
    db.plazoFijoMovimiento.findMany({
      select: { id: true, plazoFijoId: true, fecha: true, tipo: true, monto: true, PlazoFijo: { select: { moneda: true } } },
    }),
    db.inversionInmobiliaria.findMany({ select: { id: true, propiedadId: true, fecha: true, tipo: true, monto: true, moneda: true } }),
    db.propiedad.findMany({ select: { id: true, nombre: true, activa: true } }),
    db.cartera.findMany({
      orderBy: { orden: "asc" },
      select: {
        id: true, nombre: true, activa: true, saldoPesos: true, saldoUSDCable: true, saldoUSDMep: true,
        PosicionCartera: { select: { cantidad: true, precioCompra: true, Activo: { select: { ticker: true, precioActual: true, monedaPrecio: true } } } },
      },
    }),
    db.cliente.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true, nombre: true, activo: true,
        CuentaCorriente: { select: { id: true, moneda: true, saldo: true } },
        PlazoFijo: { select: { id: true, moneda: true, capital: true, saldoActual: true, estado: true } },
      },
    }),
    db.custodiaCliente.findMany({ select: { cantidadTotal: true, precioPromedio: true, Activo: { select: { precioActual: true, monedaPrecio: true } } } }),
    db.operacionRulo.findMany({ select: { id: true, fecha: true, detalles: true } }),
    db.operacionDivInt.findMany({ select: { id: true, fecha: true, detalles: true } }),
    db.operacionLargoPlazo.findMany({ select: { id: true, fecha: true, detalles: true } }),
    // P1-03A: Config.tc_blue ya NO entra al motor (SSOT histórico = TipoCambio).
    db.config.findMany({ where: { clave: { in: ["fx_opening_basis"] } }, select: { clave: true, valor: true, updatedAt: true } }),
    db.tipoCambio.findMany({ select: { monedaOrigen: true, monedaDestino: true, valor: true, fecha: true } }),
  ]);

  const cfg = new Map(configs.map((c) => [c.clave, c]));

  return {
    hoy: hoyLocal(now),
    cajas: cajas.map((c) => ({ ...c })),
    movsCaja: movsCaja.map((m) => ({
      ...m, fecha: fechaISO(m.fecha), createdAt: m.createdAt.toISOString(), moneda: moneda(m.moneda),
      tipo: m.tipo as FinanceDataset["movsCaja"][number]["tipo"],
    })),
    opsCambio: opsCambio.map((o) => ({ ...o, fecha: fechaISO(o.fecha), createdAt: o.createdAt.toISOString(), tipo: o.tipo as string, moneda: moneda(o.moneda) })),
    opsBolsa: opsBolsa.map((o) => ({
      ...o, tipoOperacion: o.tipoOperacion as string, estado: o.estado as string, moneda: moneda(o.moneda),
      fechaOperativa: o.fechaOperativa ? fechaISO(o.fechaOperativa) : null, createdAt: fechaISO(o.createdAt),
    })),
    costosCartera: logsCosto.flatMap((l) => {
      const s = l.snapshot as { costoUnitario?: unknown } | null;
      return s && (typeof s.costoUnitario === "number" || typeof s.costoUnitario === "string")
        ? [{ operacionId: l.operacionId, costoUnitario: String(s.costoUnitario) }] : [];
    }),
    movsCCInteres: movsCC.map((m) => ({
      id: m.id, fecha: fechaISO(m.fecha), tipo: m.tipo as string, monto: m.monto,
      moneda: moneda(m.CuentaCorriente.moneda), clienteId: m.CuentaCorriente.clienteId, descripcion: m.descripcion,
    })),
    movsCCReversas: movsCCRev.map((m) => ({ id: m.id, fecha: fechaISO(m.fecha), descripcion: m.descripcion ?? "" })),
    pfMovs: pfMovs.map((m) => ({ id: m.id, plazoFijoId: m.plazoFijoId, fecha: fechaISO(m.fecha), tipo: m.tipo, monto: m.monto, moneda: moneda(m.PlazoFijo.moneda) })),
    inmuebles: inmuebles.map((m) => ({ ...m, fecha: fechaISO(m.fecha), tipo: m.tipo as string, moneda: moneda(m.moneda) })),
    propiedades,
    carteras: carteras.map((c) => ({
      id: c.id, nombre: c.nombre, activa: c.activa, saldoPesos: c.saldoPesos, saldoUSDCable: c.saldoUSDCable, saldoUSDMep: c.saldoUSDMep,
      posiciones: c.PosicionCartera.map((p) => ({
        ticker: p.Activo.ticker, cantidad: p.cantidad, precioCompra: p.precioCompra,
        precioActual: p.Activo.precioActual, monedaPrecio: moneda(p.Activo.monedaPrecio),
      })),
    })),
    clientes: clientes.map((c) => ({
      id: c.id, nombre: c.nombre, activo: c.activo,
      cc: c.CuentaCorriente.map((x) => ({ id: x.id, moneda: moneda(x.moneda), saldo: x.saldo })),
      pf: c.PlazoFijo.map((x) => ({ id: x.id, moneda: moneda(x.moneda), capital: x.capital, saldoActual: x.saldoActual, estado: x.estado as string })),
    })),
    custodia: custodia.map((c) => ({ cantidadTotal: c.cantidadTotal, precioPromedio: c.precioPromedio, precioActual: c.Activo.precioActual, monedaPrecio: moneda(c.Activo.monedaPrecio) })),
    registrosCuenta: [
      ...rulos.map((r) => registroDesdeDetalles("RULO", r)),
      ...divInt.map((r) => registroDesdeDetalles("DIVINT", r)),
      ...lp.map((r) => registroDesdeDetalles("LP", r)),
    ],
    fxApertura: parseApertura(cfg.get("fx_opening_basis")?.valor),
    tc: construirResolver({ tipoCambio }),
  };
}
