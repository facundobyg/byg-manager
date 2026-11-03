// MACRO 5 — Reglas PURAS de integridad de Carteras propias + Bolsa (sin DB).
//
// Una compra/venta concertada es UN hecho económico: posición + cash (cartera
// propia) o holding + saldo (comitente) + costo, aplicados juntos al CONCERTAR.
//   - COMPRA: posición ↑, cash ↓ por el neto (bruto + costos); costo = promedio
//     ponderado sobre el costo total (los costos de compra integran el costo).
//   - VENTA:  posición ↓, cash ↑ por el neto (bruto − costos); el costo promedio no
//     cambia; resultado = neto − cantidad × costo promedio anterior (motor, Macro 2).
//   - LIQUIDADA: settlement de una operación ya concertada; sin efecto económico nuevo.
//   - ANULADA: neutraliza exactamente los efectos registrados al concertar.

import { Decimal } from "@prisma/client/runtime/library";
import { parseMontoEstricto } from "../parse-monto";

export const COMPRA_ACTIVO = new Set(["COMPRA_BONO", "COMPRA_ACCION", "COMPRA_CEDEAR"]);
export const VENTA_ACTIVO = new Set(["VENTA_BONO", "VENTA_ACCION", "VENTA_CEDEAR"]);
/** Tipos cuyo neto es "producido" (bruto − costos); el resto, "costo" (bruto + costos). */
export const VENTA_TIPOS = new Set(["VENTA_BONO", "VENTA_ACCION", "VENTA_CEDEAR", "CAUCION_COLOCADORA"]);
export const esCompraActivo = (t: string) => COMPRA_ACTIVO.has(t);
export const esVentaActivo = (t: string) => VENTA_ACTIVO.has(t);

// ── Inputs (parser canónico) ──

/** Opcional ≥ 0: vacío → null; inválido (NaN, hex, "12abc", negativo…) → "invalido". */
export function parseOpcionalNoNegativo(raw: FormDataEntryValue | string | null | undefined): Decimal | null | "invalido" {
  const p = parseMontoEstricto(raw);
  return p.ok ? p.value : "invalido";
}

/** Opcional con signo (resultados informados): "-" + decimal estricto. */
export function parseOpcionalConSigno(raw: FormDataEntryValue | string | null | undefined): Decimal | null | "invalido" {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return "invalido";
  const s = raw.trim();
  if (s === "") return null;
  const neg = s.startsWith("-");
  const p = parseMontoEstricto(neg ? s.slice(1) : s);
  if (!p.ok || p.value === null) return "invalido";
  return neg ? p.value.neg() : p.value;
}

/** Entero ≥ 0 estricto (días): vacío → null. */
export function parseEnteroOpcional(raw: FormDataEntryValue | string | null | undefined): number | null | "invalido" {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return "invalido";
  const s = raw.trim();
  if (s === "") return null;
  return /^\d{1,6}$/.test(s) ? parseInt(s, 10) : "invalido";
}

// ── Liquidación de la operación ──

export interface CostosOperacion {
  comisionPct: Decimal | null; comisionFija: Decimal | null; derechosMercado: Decimal | null;
  gastos: Decimal | null; impuestos: Decimal | null; netoManual: Decimal | null;
}

/**
 * costoReal = comisión fija + bruto × comisión % / 100 + derechos + gastos + impuestos.
 * neto = venta ? bruto − costoReal : bruto + costoReal (o el neto manual del boleto).
 * precioPromedioReal (compras) = neto / cantidad → costo unitario con costos incluidos.
 */
export function calcularLiquidacion(tipo: string, cantidad: Decimal, precio: Decimal, c: CostosOperacion) {
  const bruto = cantidad.mul(precio);
  const costoReal = (c.comisionFija ?? new Decimal(0))
    .plus(bruto.mul(c.comisionPct ?? 0).div(100))
    .plus(c.derechosMercado ?? 0).plus(c.gastos ?? 0).plus(c.impuestos ?? 0)
    .toDecimalPlaces(2);
  const esVenta = VENTA_TIPOS.has(tipo);
  const neto = (c.netoManual ?? (esVenta ? bruto.minus(costoReal) : bruto.plus(costoReal))).toDecimalPlaces(2);
  const precioPromedioReal = !esVenta && cantidad.gt(0) ? neto.div(cantidad).toDecimalPlaces(6) : null;
  return { bruto, costoReal, neto, precioPromedioReal };
}

/** Costo promedio ponderado tras una compra: (cantidad × costo + neto de la compra) / cantidad nueva. */
export function costoPromedioTrasCompra(cantAntes: Decimal, costoAntes: Decimal, cantCompra: Decimal, netoCompra: Decimal): { cantidad: Decimal; costo: Decimal } {
  const cantidad = cantAntes.plus(cantCompra);
  const costo = cantAntes.mul(costoAntes).plus(netoCompra).div(cantidad).toDecimalPlaces(6);
  return { cantidad, costo };
}

// ── Bolsa de USD de la cartera propia (M5-F01) ──

export type SaldoUSD = "CABLE" | "MEP";

/** Selector Cable / MEP: vacío → null; solo "CABLE" | "MEP"; cualquier otro valor → "invalido". */
export function parseSaldoUSD(raw: FormDataEntryValue | string | null | undefined): SaldoUSD | null | "invalido" {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return "invalido";
  const s = raw.trim();
  if (s === "") return null;
  return s === "CABLE" || s === "MEP" ? s : "invalido";
}

/**
 * Campo de cash de la cartera propia. ARS → saldoPesos. USD → la bolsa elegida
 * EXPLÍCITAMENTE en la operación (CABLE → saldoUSDCable, MEP → saldoUSDMep); sin
 * elección no hay campo (no se infiere por especie, sufijo, ALYC ni mercado).
 */
export function campoSaldoCartera(moneda: string, saldoUSD: SaldoUSD | null): "saldoPesos" | "saldoUSDCable" | "saldoUSDMep" | null {
  if (moneda === "ARS") return "saldoPesos";
  if (moneda === "USD") return saldoUSD === "CABLE" ? "saldoUSDCable" : saldoUSD === "MEP" ? "saldoUSDMep" : null;
  return null;
}
export function campoSaldoComitente(moneda: string): "saldoARS" | "saldoUSDCable" | null {
  return moneda === "ARS" ? "saldoARS" : moneda === "USD" ? "saldoUSDCable" : null;
}

// ── Efectos registrados al concertar (para una anulación exacta) ──

export interface EstadoTenencia { cantidad: string; costo: string }
export interface EfectosConcertacion {
  version: 1;
  sujeto: "CARTERA" | "COMITENTE";
  sujetoId: string;
  saldo: { campo: string; delta: string } | null;
  tenencia: { clave: string; antes: EstadoTenencia | null; despues: EstadoTenencia | null } | null;
  operacionHoldingId: string | null;
}

export const tenenciaIgual = (a: EstadoTenencia | null, b: { cantidad: Decimal.Value; costo: Decimal.Value } | null): boolean =>
  a === null || b === null
    ? a === null && b === null
    : new Decimal(a.cantidad).eq(new Decimal(b.cantidad.toString())) && new Decimal(a.costo).eq(new Decimal(b.costo.toString()));

// ── Edición de una operación concertada ──

/** ¿La operación usa una bolsa de USD de la cartera propia (y debe elegirla)? */
export const requiereSaldoUSD = (op: { carteraId: string | null; moneda: string; tipoOperacion: string }) =>
  !!op.carteraId && op.moneda === "USD" && (esCompraActivo(op.tipoOperacion) || esVentaActivo(op.tipoOperacion));

/** Re-edición de una operación ya concertada: solo datos sin efecto económico. */
export function validarEdicionConcertada(
  actual: { netoLiquidado: Decimal.Value | null; costoReal: Decimal.Value | null; comisionUSD: Decimal.Value | null; tcMepDia: Decimal.Value | null; esSenebi: boolean },
  nuevo: { neto: Decimal; costoReal: Decimal; comisionUSD: Decimal | null; tcMepDia: Decimal | null; esSenebi: boolean },
): string | null {
  const eq = (a: Decimal.Value | null, b: Decimal | null) => (a === null || a === undefined ? b === null : b !== null && new Decimal(a.toString()).eq(b));
  if (!eq(actual.netoLiquidado, nuevo.neto) || !eq(actual.costoReal, nuevo.costoReal) || !eq(actual.comisionUSD, nuevo.comisionUSD)
      || !eq(actual.tcMepDia, nuevo.tcMepDia) || actual.esSenebi !== nuevo.esSenebi) {
    return "Operación concertada: costos, neto y comisiones no se editan (ya impactaron posición y saldo). Anulala y cargala de nuevo.";
  }
  return null;
}
