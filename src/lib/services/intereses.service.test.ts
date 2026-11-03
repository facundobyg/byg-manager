import { describe, it, expect } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { calcularInteresCCRealista } from "./intereses.service";

// MACRO 4 — calcularInteresCCRealista contra un ORÁCULO INDEPENDIENTE día por día
// (no reutiliza el algoritmo productivo): para cada día t de [inicio, fin), saldo
// vigente = saldoInicial + Σ movimientos con fecha en [inicio, t]; interés del día =
// saldo > 0 ? saldo × tasa / 365 : 0. Semántica: fechaInicio inclusiva, fechaFin
// exclusiva, un movimiento impacta DESDE su fecha, ACT/365, solo saldo positivo.

type Tipo = "INGRESO" | "EGRESO" | "AJUSTE" | "INTERES";
type Mov = { fecha: string; tipo: Tipo; monto: number };
const U = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const signo = (t: Tipo) => (t === "EGRESO" ? -1 : t === "INTERES" ? 0 : 1);

function oraculoDiario(saldoInicial: number, movs: Mov[], tasa: number, inicio: string, fin: string): number {
  let total = 0;
  for (let d = U(inicio); d < U(fin); d = new Date(d.getTime() + 86_400_000)) {
    const hoy = d.toISOString().slice(0, 10);
    const saldo = saldoInicial + movs
      .filter((m) => m.fecha >= inicio && m.fecha <= hoy)
      .reduce((s, m) => s + signo(m.tipo) * m.monto, 0);
    if (saldo > 0) total += (saldo * tasa) / 365;
  }
  return total;
}

function calcular(saldoInicial: number, movs: Mov[], tasa: number, inicio: string, fin: string) {
  return calcularInteresCCRealista({
    movimientos: movs.map((m) => ({ fecha: U(m.fecha), tipo: m.tipo as never, monto: new Decimal(m.monto) })),
    tasa: new Decimal(tasa), fechaInicio: U(inicio), fechaFin: U(fin), saldoInicial: new Decimal(saldoInicial),
  });
}

function comparar(saldoInicial: number, movs: Mov[], tasa: number, inicio: string, fin: string) {
  const r = calcular(saldoInicial, movs, tasa, inicio, fin);
  const esperado = oraculoDiario(saldoInicial, movs, tasa, inicio, fin);
  expect(r.interesTotal.toNumber()).toBeCloseTo(esperado, 6);
  return { r, esperado };
}

describe("calcularInteresCCRealista — semántica temporal (oráculo diario independiente)", () => {
  it("1. sin movimientos: saldo constante todo el período", () => {
    const { r } = comparar(1000, [], 0.365, "2026-09-01", "2026-09-11");
    expect(r.interesTotal.toNumber()).toBeCloseTo(10, 10); // 1000 × 0,365 × 10 / 365
    expect(r.periodos).toHaveLength(1);
  });

  it("2. movimiento exactamente en fechaInicio: impacta desde el primer día", () => {
    const { r } = comparar(1000, [{ fecha: "2026-09-01", tipo: "EGRESO", monto: 400 }], 0.365, "2026-09-01", "2026-09-11");
    expect(r.interesTotal.toNumber()).toBeCloseTo(6, 10); // 600 × 10 días
    expect(r.periodos.map((p) => [p.dias, p.saldo.toNumber()])).toEqual([[10, 600]]);
  });

  it("3. EGRESO a mitad de período: el saldo menor rige desde su fecha", () => {
    const { r } = comparar(1000, [{ fecha: "2026-09-05", tipo: "EGRESO", monto: 400 }], 0.365, "2026-09-01", "2026-09-11");
    expect(r.interesTotal.toNumber()).toBeCloseTo(4 + 3.6, 10); // 1000 × 4 días + 600 × 6 días
    expect(r.periodos.map((p) => [p.dias, p.saldo.toNumber()])).toEqual([[4, 1000], [6, 600]]);
  });

  it("4. INGRESO a mitad de período: el saldo mayor rige desde su fecha", () => {
    const { r } = comparar(1000, [{ fecha: "2026-09-08", tipo: "INGRESO", monto: 500 }], 0.365, "2026-09-01", "2026-09-11");
    expect(r.interesTotal.toNumber()).toBeCloseTo(7 + 4.5, 10);
  });

  it("5. varios movimientos el mismo día: el saldo final del día se aplica una sola vez", () => {
    const { r } = comparar(1000, [
      { fecha: "2026-09-05", tipo: "INGRESO", monto: 300 },
      { fecha: "2026-09-05", tipo: "EGRESO", monto: 800 },
      { fecha: "2026-09-05", tipo: "AJUSTE", monto: 100 },
    ], 0.365, "2026-09-01", "2026-09-11");
    expect(r.periodos.map((p) => [p.dias, p.saldo.toNumber()])).toEqual([[4, 1000], [6, 600]]);
  });

  it("6. movimiento en el último corte antes de fechaFin: afecta el último tramo (no desaparece)", () => {
    const { r } = comparar(1000, [
      { fecha: "2026-09-04", tipo: "INGRESO", monto: 1 },
      { fecha: "2026-09-10", tipo: "EGRESO", monto: 1001 },
    ], 0.365, "2026-09-01", "2026-09-11");
    const ultimo = r.periodos[r.periodos.length - 1];
    expect([ultimo.dias, ultimo.saldo.toNumber(), ultimo.interes.toNumber()]).toEqual([1, 0, 0]);
  });

  it("7. movimiento en fechaFin: período [inicio, fin) → NO lo afecta", () => {
    const { r } = comparar(1000, [{ fecha: "2026-09-11", tipo: "EGRESO", monto: 1000 }], 0.365, "2026-09-01", "2026-09-11");
    expect(r.interesTotal.toNumber()).toBeCloseTo(10, 10);
  });

  it("8. varios movimientos en distintas fechas, saldo que cruza a negativo e INTERES ignorado", () => {
    comparar(250_000, [
      { fecha: "2026-09-03", tipo: "EGRESO", monto: 100_000 },
      { fecha: "2026-09-07", tipo: "INTERES", monto: 999 },
      { fecha: "2026-09-09", tipo: "EGRESO", monto: 200_000 },
      { fecha: "2026-09-15", tipo: "INGRESO", monto: 75_000 },
      { fecha: "2026-09-15", tipo: "AJUSTE", monto: 25_000 },
      { fecha: "2026-09-21", tipo: "INGRESO", monto: 10_000 },
      { fecha: "2026-09-29", tipo: "EGRESO", monto: 5_000 },
      { fecha: "2026-08-15", tipo: "INGRESO", monto: 1_000_000 }, // fuera del período: ignorado
    ], 0.42, "2026-09-01", "2026-09-30");
  });

  it("9. ejemplo detectado: 1.000.000 al 50%, EGRESO 500.000 el 10/09, corte 20/09 → ≈ 26.027,41", () => {
    const movs: Mov[] = [{ fecha: "2026-09-10", tipo: "EGRESO", monto: 500_000 }, { fecha: "2026-09-20", tipo: "INGRESO", monto: 1 }];
    const { r, esperado } = comparar(1_000_000, movs, 0.5, "2026-09-01", "2026-09-30");
    // 9 días × 1.000.000 + 10 días × 500.000 + 10 días × 500.001, × 0,5 / 365
    expect(esperado).toBeCloseTo((9 * 1_000_000 + 10 * 500_000 + 10 * 500_001) * 0.5 / 365, 6);
    expect(r.interesTotal.toDecimalPlaces(2).toNumber()).toBe(26027.41);
    // el resultado anterior (32.876,71) aplicaba el EGRESO recién desde el 20/09
    expect(r.interesTotal.toDecimalPlaces(2).toNumber()).not.toBe(32876.71);
  });

  it("período vacío (fin = inicio): un tramo de 0 días, interés 0 (contrato de la UI)", () => {
    const r = calcular(1000, [], 0.5, "2026-09-01", "2026-09-01");
    expect(r.periodos.map((p) => p.dias)).toEqual([0]);
    expect(r.interesTotal.toNumber()).toBe(0);
  });
});
