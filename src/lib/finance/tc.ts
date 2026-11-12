// MACRO 2 / P1-03A — Resolución de tipo de cambio por FECHA (hecho) o CORTE (patrimonio).
//
// REGLA DE NEGOCIO (Facundo, 2026-11-11): el último TC cargado permanece VIGENTE
// hasta que un usuario autorizado lo cambie. NO vence por antigüedad. Cambiar el
// TC actual NUNCA reescribe períodos anteriores: solo agrega una vigencia desde hoy.
//
// Fuentes:
//   - TipoCambio(ARS→USD): SSOT HISTÓRICO. Cada fila = "desde esta fecha rige este
//     TC". `valor` = ARS por 1 USD. Lo escribe setTCBlue (fecha efectiva = hoy).
//   - Config.tc_blue: valor vigente para UI/configuración. NO es fuente histórica:
//     su `updatedAt` no prueba vigencia (legacy: el import de backup y setTCBlue
//     previo lo dejaban desalineado). El motor NO lo lee.
//   - TipoCambio(EUR→USD) / (BRL→USD): filas legacy (sin writer en el código
//     actual). Convención INFERIDA de los valores y validada por rango:
//     EUR: `valor` = USD por 1 EUR (≈1.08); BRL: `valor` = BRL por 1 USD (≈5.2).
//     Una fila fuera de rango se descarta con advertencia (nunca se usa invertida).
//   - TcMepHistorial: TC MEP diario. No se usa para consolidar (la consolidación
//     del sistema es al Blue); lo usan comisiones/honorarios.
//   - Config.tc_mep / tc_eur / tc_brl: legacy, NO se usan.
//
// Regla de resolución para una fecha D (sin ventana de días):
//   A. existe TC con fecha ≤ D → el más reciente: VIGENTE (EXACTO si es del mismo
//      día). Calidad EXACT sin importar su antigüedad.
//   B. no existe ninguno ≤ D pero sí posterior → BOOTSTRAP: el PRIMER TC posterior,
//      calidad APPROXIMATE. Solo cubre el tramo anterior al inicio del historial;
//      no significa que ese TC rigiera antes. Con al menos un TC ≤ D nunca se mira
//      hacia adelante.
//   C. no hay ninguno → SIN TC (INCOMPLETE): el consolidado USD queda null y se informa.

import { Decimal } from "@prisma/client/runtime/library";
import type { QualityReason } from "./quality";
import { D, type Moneda } from "./types";

export interface TcPunto {
  moneda: Exclude<Moneda, "USD">;
  fecha: string; // YYYY-MM-DD
  /** USD que vale 1 unidad de `moneda`. */
  usdPorUnidad: Decimal;
  fuente: string;
}

/**
 * EXACTO   = TC del mismo día.
 * VIGENTE  = último TC anterior, todavía vigente (no vence): calidad EXACT.
 * POSTERIOR = bootstrap previo al primer TC del historial: calidad APPROXIMATE.
 */
export type TcModo = "EXACTO" | "VIGENTE" | "POSTERIOR";

/** Modos que NO degradan la calidad. */
export const MODOS_TC_EXACTOS: readonly TcModo[] = ["EXACTO", "VIGENTE"];

export interface TcResuelto {
  moneda: Moneda;
  fecha: string;
  fechaTc: string;
  usdPorUnidad: Decimal;
  fuente: string;
  modo: TcModo;
  desfaseDias: number;
}

function dias(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export class TcResolver {
  private readonly serie: Map<string, TcPunto[]>;

  constructor(puntos: readonly TcPunto[], readonly advertencias: readonly string[] = []) {
    this.serie = new Map();
    for (const p of puntos) {
      const arr = this.serie.get(p.moneda) ?? [];
      arr.push(p);
      this.serie.set(p.moneda, arr);
    }
    for (const arr of Array.from(this.serie.values())) arr.sort((x, y) => (x.fecha < y.fecha ? -1 : x.fecha > y.fecha ? 1 : 0));
  }

  resolver(moneda: Moneda, fecha: string): TcResuelto | null {
    if (moneda === "USD") {
      return { moneda, fecha, fechaTc: fecha, usdPorUnidad: new Decimal(1), fuente: "USD", modo: "EXACTO", desfaseDias: 0 };
    }
    const arr = this.serie.get(moneda) ?? [];
    let anterior: TcPunto | null = null;
    for (const p of arr) {
      if (p.fecha <= fecha) anterior = p;
      else break;
    }
    // A. Vigencia: el último TC ≤ D rige hasta el próximo cambio (sin vencimiento).
    if (anterior) {
      const desfase = dias(anterior.fecha, fecha);
      return {
        moneda, fecha, fechaTc: anterior.fecha, usdPorUnidad: anterior.usdPorUnidad, fuente: anterior.fuente,
        modo: desfase === 0 ? "EXACTO" : "VIGENTE", desfaseDias: desfase,
      };
    }
    // B. Bootstrap: D es anterior al primer TC del historial → primer posterior, aproximado.
    const posterior = arr[0];
    if (posterior) {
      return {
        moneda, fecha, fechaTc: posterior.fecha, usdPorUnidad: posterior.usdPorUnidad, fuente: posterior.fuente,
        modo: "POSTERIOR", desfaseDias: -dias(fecha, posterior.fecha),
      };
    }
    return null;
  }
}

/** Fila cruda de TipoCambio. */
export interface TipoCambioRow {
  monedaOrigen: string;
  monedaDestino: string;
  valor: Decimal.Value;
  fecha: Date | string;
}

interface Convencion {
  moneda: Exclude<Moneda, "USD">;
  origen: string;
  destino: string;
  usdPorUnidad: (valor: Decimal) => Decimal;
  rango: [number, number];
  descripcion: string;
}

export const CONVENCIONES_TC: readonly Convencion[] = [
  { moneda: "ARS", origen: "ARS", destino: "USD", usdPorUnidad: (v) => new Decimal(1).div(v), rango: [50, 10_000_000], descripcion: "valor = ARS por 1 USD (setTCBlue)" },
  { moneda: "EUR", origen: "EUR", destino: "USD", usdPorUnidad: (v) => v, rango: [0.5, 2.5], descripcion: "valor = USD por 1 EUR (inferido, legacy)" },
  { moneda: "BRL", origen: "BRL", destino: "USD", usdPorUnidad: (v) => new Decimal(1).div(v), rango: [1.5, 20], descripcion: "valor = BRL por 1 USD (inferido, legacy)" },
];

/**
 * Serie histórica SOLO desde TipoCambio (SSOT). Config.tc_blue NO participa:
 * su updatedAt no es una fecha de vigencia confiable (P1-03A).
 */
export function construirResolver(input: { tipoCambio: readonly TipoCambioRow[] }): TcResolver {
  const puntos: TcPunto[] = [];
  const advertencias: string[] = [];

  for (const r of input.tipoCambio) {
    const conv = CONVENCIONES_TC.find((c) => c.origen === r.monedaOrigen && c.destino === r.monedaDestino);
    if (!conv) continue;
    const valor = D(r.valor);
    const fecha = typeof r.fecha === "string" ? r.fecha.slice(0, 10) : r.fecha.toISOString().slice(0, 10);
    if (valor.lte(0) || valor.lt(conv.rango[0]) || valor.gt(conv.rango[1])) {
      advertencias.push(`TC ${conv.moneda} ${fecha} = ${valor} fuera de rango (${conv.descripcion}); descartado`);
      continue;
    }
    puntos.push({ moneda: conv.moneda, fecha, usdPorUnidad: conv.usdPorUnidad(valor), fuente: `TipoCambio ${conv.origen}>${conv.destino}` });
  }

  return new TcResolver(puntos, advertencias);
}

/** Registro de TC usados/faltantes durante un cálculo (para informar y calificar). */
export class TcBitacora {
  private usados = new Map<string, TcResuelto>();
  private faltantes = new Set<string>();

  constructor(private readonly resolver: TcResolver) {}

  /** Convierte `monto` en `moneda` a USD con el TC de `fecha`. null si no hay TC. */
  aUSD(monto: Decimal.Value, moneda: Moneda, fecha: string): Decimal | null {
    const tc = this.resolver.resolver(moneda, fecha);
    if (!tc) {
      this.faltantes.add(`${moneda}@${fecha}`);
      return null;
    }
    if (moneda !== "USD") this.usados.set(`${moneda}@${fecha}`, tc);
    return D(monto).mul(tc.usdPorUnidad);
  }

  resumen() {
    const usados = Array.from(this.usados.values());
    return {
      faltantes: Array.from(this.faltantes).sort(),
      aproximados: usados.filter((t) => !MODOS_TC_EXACTOS.includes(t.modo)).map((t) => ({
        moneda: t.moneda, fecha: t.fecha, fechaTc: t.fechaTc, modo: t.modo, desfaseDias: t.desfaseDias, fuente: t.fuente,
        usdPorUnidad: t.usdPorUnidad.toNumber(),
      })),
      fuentes: Array.from(new Set(usados.map((t) => t.fuente))),
      desfaseMaxDias: usados.reduce((m, t) => Math.max(m, Math.abs(t.desfaseDias)), 0),
    };
  }

  /**
   * Motivos de calidad: TC faltante (INCOMPLETE) o bootstrap previo al primer TC
   * del historial (APPROXIMATE). Un TC VIGENTE (anterior, sin importar su
   * antigüedad) NO degrada la calidad.
   */
  motivos(): QualityReason[] {
    const out: QualityReason[] = [];
    for (const f of Array.from(this.faltantes).sort()) {
      out.push({ code: "TC_MISSING", severity: "INCOMPLETE", detail: `sin TC registrado (ni vigente ni posterior) para ${f}` });
    }
    for (const t of Array.from(this.usados.values())) {
      if (MODOS_TC_EXACTOS.includes(t.modo)) continue;
      out.push({
        code: "TC_APPROXIMATE", severity: "APPROXIMATE",
        detail: `${t.moneda} pedido ${t.fecha}, anterior al primer TC del historial: usado ${t.fechaTc} (${t.desfaseDias} días, bootstrap, ${t.fuente})`,
      });
    }
    return out;
  }
}
