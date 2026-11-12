import { describe, it, expect } from "vitest";
import { cargarFinanceDataset, hoyLocal } from "./load";
import { calcularPatrimonioNeto } from "./patrimonio";
import { calcularValuacion } from "./valuacion";
import { construirLedger } from "./ledger";

// P1-03A.2 — el "hoy" del motor es la FECHA DE NEGOCIO argentina (America/Argentina/Buenos_Aires),
// no el día UTC del servidor. Instantes UTC explícitos: independientes del TZ del proceso.

/** DB falsa: findMany devuelve las filas dadas por modelo (o []). */
function dbFalsa(filas: Record<string, unknown[]> = {}) {
  return new Proxy({}, { get: (_t, modelo: string) => ({ findMany: async () => filas[modelo] ?? [] }) });
}
const cargar = (instante: string, filas?: Record<string, unknown[]>) => cargarFinanceDataset(dbFalsa(filas) as never, new Date(instante));

describe("P1-03A.2 — hoy del motor = fecha de negocio argentina", () => {
  it("00:30 UTC del 12/11 (= 21:30 ART del 11/11) → hoy 2026-11-11, NO 2026-11-12", async () => {
    expect(hoyLocal(new Date("2026-11-12T00:30:00Z"))).toBe("2026-11-11");
    const ds = await cargar("2026-11-12T00:30:00Z");
    expect(ds.hoy).toBe("2026-11-11");
    const pn = calcularPatrimonioNeto(ds);
    expect(pn.corte).toBe("2026-11-11"); // corte por defecto del PN
    expect(pn.esCorteActual).toBe(true);
    expect(calcularValuacion(ds, construirLedger(ds)).corte).toBe("2026-11-11");
  });

  it("23:59:59 ART → mismo día argentino", async () => {
    expect((await cargar("2026-11-12T02:59:59Z")).hoy).toBe("2026-11-11");
  });

  it("00:00:00 ART → día argentino siguiente", async () => {
    expect((await cargar("2026-11-12T03:00:00Z")).hoy).toBe("2026-11-12");
  });

  it("fin de mes: 30/11 21:30 ART (UTC ya es 01/12) → hoy 2026-11-30, mes 2026-11", async () => {
    const ds = await cargar("2026-12-01T00:30:00Z");
    expect(ds.hoy).toBe("2026-11-30");
    expect(ds.hoy.slice(0, 7)).toBe("2026-11");
    expect((await cargar("2026-12-01T03:00:00Z")).hoy).toBe("2026-12-01"); // recién a las 00:00 ART cambia de mes
  });

  it("fin de año: 31/12 22:00 ART (UTC 01/01) → sigue en 2026-12-31", async () => {
    expect((await cargar("2027-01-01T01:00:00Z")).hoy).toBe("2026-12-31");
  });

  it("efecto en el corte: a las 21:30 ART un movimiento fechado el día siguiente NO entra en el PN de hoy", async () => {
    const caja = [{ id: "oficina", label: "Oficina", activa: true, saldoInicialUSD: 0, saldoInicialARS: 0 }];
    const mov = (id: string, fecha: string) => ({
      id, cajaId: "oficina", fecha: new Date(`${fecha}T00:00:00Z`), createdAt: new Date(`${fecha}T12:00:00Z`), tipo: "ENTRADA", moneda: "USD",
      monto: 100, descripcion: null, confirmado: true, anulado: false, pagoDeId: null, operacionCambioId: null,
    });
    const ds = await cargar("2026-11-12T00:30:00Z", { caja, movimientoCaja: [mov("hoy", "2026-11-11"), mov("manana", "2026-11-12")] });
    const pn = calcularPatrimonioNeto(ds);
    expect(pn.componentes.cajas.nativo.USD).toBe(100); // solo el del 11/11
  });
});
