// MACRO 2 — Costo promedio ponderado MÓVIL por moneda para la operatoria de cambio.
//
// Unidad de costo: ARS (las operaciones de cambio son divisa contra ARS).
//   Compra : cantidad += q ; costo += totalARS
//   Venta  : costoVendido = costoPromedio × q ; resultado = producidoARS − costoVendido
//            cantidad −= q ; costo −= costoVendido
// Solo entran operaciones LIQUIDADAS (pendiente=false). Una operación revertida
// queda pendiente=true (revertirOperacionCambio), así que no entra.
// Orden: fecha económica, luego createdAt, luego id (desempate estable).
//
// Posición inicial: si se vende más de lo que la serie compró, las unidades
// excedentes NO tienen costo conocido → se informan como `ventaSinBase` y su
// producido NO genera resultado (no se inventa costo). Para cubrirlo existe una
// base de apertura explícita (Config `fx_opening_basis`): {USD:{cantidad,costoARS,fecha}}.
// Las operaciones con fecha ≤ fecha de apertura se consideran ya incluidas en ella.

import { Decimal } from "@prisma/client/runtime/library";
import { D, type Moneda } from "./types";

export type MonedaFx = Exclude<Moneda, "ARS">;

export interface FxOperacion {
  id: string;
  fecha: string;
  createdAt: string;
  moneda: MonedaFx;
  lado: "COMPRA" | "VENTA";
  cantidad: Decimal.Value;
  totalARS: Decimal.Value;
}

export interface FxBaseApertura {
  cantidad: Decimal.Value;
  costoARS: Decimal.Value;
  fecha: string;
}

export interface FxVentaRealizada {
  opId: string;
  fecha: string;
  moneda: MonedaFx;
  cantidad: Decimal;
  cantidadConBase: Decimal;
  ventaSinBase: Decimal;
  producidoARS: Decimal;
  costoVendidoARS: Decimal;
  resultadoARS: Decimal;
  costoPromedioARS: Decimal;
}

export interface FxPosicion {
  moneda: MonedaFx;
  cantidad: Decimal;
  costoARS: Decimal;
  costoPromedioARS: Decimal;
}

export interface FxCostBasisResultado {
  ventas: FxVentaRealizada[];
  posiciones: Record<MonedaFx, FxPosicion>;
  advertencias: string[];
}

function ordenar(a: FxOperacion, b: FxOperacion): number {
  if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Corre el costo promedio móvil sobre `ops` hasta `hastaExcl` (fecha exclusiva;
 * undefined = todas). Devuelve cada venta con su resultado y la posición remanente.
 */
export function calcularFxCostBasis(
  ops: readonly FxOperacion[],
  opts: { hastaExcl?: string; apertura?: Partial<Record<MonedaFx, FxBaseApertura>> } = {},
): FxCostBasisResultado {
  const advertencias: string[] = [];
  const pos: Record<MonedaFx, { cantidad: Decimal; costo: Decimal }> = {
    USD: { cantidad: new Decimal(0), costo: new Decimal(0) },
    EUR: { cantidad: new Decimal(0), costo: new Decimal(0) },
    BRL: { cantidad: new Decimal(0), costo: new Decimal(0) },
  };
  const aperturaFecha: Partial<Record<MonedaFx, string>> = {};
  for (const m of ["USD", "EUR", "BRL"] as const) {
    const a = opts.apertura?.[m];
    if (!a) continue;
    if (D(a.cantidad).lt(0) || D(a.costoARS).lt(0)) {
      advertencias.push(`Base de apertura FX ${m} inválida (negativa); ignorada`);
      continue;
    }
    pos[m] = { cantidad: D(a.cantidad), costo: D(a.costoARS) };
    aperturaFecha[m] = a.fecha;
  }

  const ventas: FxVentaRealizada[] = [];
  const ordenadas = [...ops].sort(ordenar);
  for (const op of ordenadas) {
    if (opts.hastaExcl && op.fecha >= opts.hastaExcl) break;
    const af = aperturaFecha[op.moneda];
    if (af && op.fecha <= af) continue;

    const q = D(op.cantidad);
    const ars = D(op.totalARS);
    if (q.lte(0)) {
      advertencias.push(`Operación FX ${op.id} con cantidad ≤ 0; ignorada`);
      continue;
    }
    const p = pos[op.moneda];
    if (op.lado === "COMPRA") {
      p.cantidad = p.cantidad.plus(q);
      p.costo = p.costo.plus(ars);
      continue;
    }

    const promedio = p.cantidad.gt(0) ? p.costo.div(p.cantidad) : new Decimal(0);
    const conBase = Decimal.min(q, Decimal.max(p.cantidad, 0));
    const sinBase = q.minus(conBase);
    const costoVendido = promedio.mul(conBase);
    // El producido de las unidades sin base no genera resultado (no se inventa costo).
    const producidoConBase = q.gt(0) ? ars.mul(conBase).div(q) : new Decimal(0);
    ventas.push({
      opId: op.id,
      fecha: op.fecha,
      moneda: op.moneda,
      cantidad: q,
      cantidadConBase: conBase,
      ventaSinBase: sinBase,
      producidoARS: ars,
      costoVendidoARS: costoVendido,
      resultadoARS: producidoConBase.minus(costoVendido),
      costoPromedioARS: promedio,
    });
    p.cantidad = p.cantidad.minus(conBase);
    p.costo = p.costo.minus(costoVendido);
    if (p.cantidad.isZero()) p.costo = new Decimal(0);
  }

  const posiciones = {} as Record<MonedaFx, FxPosicion>;
  for (const m of ["USD", "EUR", "BRL"] as const) {
    const p = pos[m];
    posiciones[m] = {
      moneda: m,
      cantidad: p.cantidad,
      costoARS: p.costo,
      costoPromedioARS: p.cantidad.gt(0) ? p.costo.div(p.cantidad) : new Decimal(0),
    };
  }
  return { ventas, posiciones, advertencias };
}

// ── Base de apertura con FECHA EFECTIVA (M2-F03) ─────────────────────────────
//
// `fx_opening_basis` describe la posición y el costo AL CIERRE de su fecha D.
//   - Una venta con fecha ≤ D se mide SOLO con la historia disponible (sin la
//     apertura): si esa historia no alcanza, la venta queda sin base → INCOMPLETE.
//   - Una venta con fecha > D se mide desde la apertura + operaciones posteriores.
//   - La posición a un corte C usa la apertura solo si C ≥ D.
// Así una apertura futura nunca aparece en un período anterior, y un período que
// cruza D no mezcla épocas: cada venta usa la base de su propia época.

export interface FxVentaConEpoca extends FxVentaRealizada {
  epoca: "HISTORIA" | "APERTURA";
}

export interface FxPorEpocas {
  ventas: FxVentaConEpoca[];
  posiciones: Record<MonedaFx, FxPosicion & { epoca: "HISTORIA" | "APERTURA" }>;
  advertencias: string[];
}

function diaAnterior(f: string): string {
  const d = new Date(`${f}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function calcularFxPorEpocas(
  ops: readonly FxOperacion[],
  opts: { hastaExcl: string; apertura?: Partial<Record<MonedaFx, FxBaseApertura>> },
): FxPorEpocas {
  const historia = calcularFxCostBasis(ops, { hastaExcl: opts.hastaExcl });
  const conApertura = opts.apertura && Object.keys(opts.apertura).length > 0
    ? calcularFxCostBasis(ops, { hastaExcl: opts.hastaExcl, apertura: opts.apertura })
    : null;
  const corte = diaAnterior(opts.hastaExcl);

  const ventas: FxVentaConEpoca[] = [];
  for (const v of historia.ventas) {
    const d = opts.apertura?.[v.moneda]?.fecha;
    if (!d || v.fecha <= d) ventas.push({ ...v, epoca: "HISTORIA" });
  }
  if (conApertura) {
    for (const v of conApertura.ventas) {
      const d = opts.apertura?.[v.moneda]?.fecha;
      if (d && v.fecha > d) ventas.push({ ...v, epoca: "APERTURA" });
    }
  }

  const posiciones = {} as FxPorEpocas["posiciones"];
  for (const m of ["USD", "EUR", "BRL"] as const) {
    const d = opts.apertura?.[m]?.fecha;
    posiciones[m] = conApertura && d && corte >= d
      ? { ...conApertura.posiciones[m], epoca: "APERTURA" }
      : { ...historia.posiciones[m], epoca: "HISTORIA" };
  }
  return { ventas, posiciones, advertencias: [...historia.advertencias, ...(conApertura?.advertencias ?? [])] };
}
