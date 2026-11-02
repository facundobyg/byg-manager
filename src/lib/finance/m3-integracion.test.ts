import { describe, it, expect } from "vitest";
import { construirLedger } from "./ledger";
import { calcularPatrimonioNeto } from "./patrimonio";
import { calcularResultadoRealizado } from "./resultado";
import { conciliarPeriodo } from "./reconciliacion";
import { caja, dataset, mov, opCambio } from "./test-fixtures";

// MACRO 3 → integración con el motor (Macro 2): pendientes residuales, reversas y
// liquidaciones parciales tal como ahora las escribe Caja/Cambio.

describe("Macro 3 × motor financiero", () => {
  const ds = () => dataset({
    movsCaja: [
      mov({ id: "pend", tipo: "ENTRADA", moneda: "USD", monto: 100, fecha: "2026-04-01", confirmado: false, descripcion: "DEBE" }),
      mov({ id: "p1", tipo: "ENTRADA", moneda: "USD", monto: 30, fecha: "2026-04-05", pagoDeId: "pend", descripcion: "Pago parcial de pendiente pend" }),
      mov({ id: "r1", tipo: "SALIDA", moneda: "USD", monto: 30, fecha: "2026-04-20", descripcion: "REVERSO | ref:p1 | Pago parcial de pendiente pend" }),
    ],
  });

  it("pago parcial revertido: el pendiente se reabre en el PN desde la fecha de la reversa", () => {
    const d = ds();
    expect(calcularPatrimonioNeto(d, "2026-04-10").componentes.pendientesCobrar.nativo.USD).toBe(70);
    const pn = calcularPatrimonioNeto(d, "2026-04-30");
    expect(pn.componentes.pendientesCobrar.nativo.USD).toBe(100);
    expect(pn.componentes.cajas.nativo.USD).toBe(0); // 30 − 30
  });

  it("invariante: residual 0 con alta, pago, reversa del pago (PENDIENTE_REABIERTO)", () => {
    const d = ds();
    const c = conciliarPeriodo(d, construirLedger(d), "2026-03-31", "2026-04-30");
    expect(c.residualNativo).toEqual({ ARS: 0, USD: 0, EUR: 0, BRL: 0 });
    expect(c.explicado.PENDIENTE_REABIERTO.USD).toBe(30);
  });

  it("liquidaciones parciales con operacionCambioId no duplican hechos: el resultado FX es por la operación", () => {
    const d = dataset({
      opsCambio: [
        opCambio({ id: "c", tipo: "COMPRA_USD", fecha: "2026-04-02", cantidad: 100, totalARS: 100_000 }),
        opCambio({ id: "v", tipo: "VENTA_USD", fecha: "2026-04-05", cantidad: 100, totalARS: 110_000 }),
      ],
      movsCaja: [
        mov({ tipo: "SALIDA", moneda: "USD", monto: 40, fecha: "2026-04-05", operacionCambioId: "v", descripcion: "[Cobro Cambio v] Venta divisa parcial" }),
        mov({ tipo: "ENTRADA", moneda: "ARS", monto: 44_000, fecha: "2026-04-05", operacionCambioId: "v", descripcion: "[Cobro Cambio v] Cobro ARS parcial" }),
        mov({ tipo: "SALIDA", moneda: "USD", monto: 60, fecha: "2026-04-06", operacionCambioId: "v", descripcion: "[Cobro Cambio v] Venta divisa" }),
        mov({ tipo: "ENTRADA", moneda: "ARS", monto: 66_000, fecha: "2026-04-06", operacionCambioId: "v", descripcion: "[Cobro Cambio v] Cobro ARS x Venta" }),
      ],
    });
    const r = calcularResultadoRealizado(d, construirLedger(d), "2026-04");
    expect(r.porCategoria.FX_REALIZADO.nativo.ARS).toBe(10_000); // una vez, no por cada pata
    expect(r.partidas.filter((p) => p.categoria === "FX_REALIZADO")).toHaveLength(1);
  });

  it("L2: cambio entre cajas (op + 2 patas vinculadas) → posición/costo FX, venta realizada contra el promedio, sin doble impacto", () => {
    // Tal como lo escribe ahora registrarOperacionCambioEnCajas: una OperacionCambio
    // liquidada + patas "[Cambio <id>]" con operacionCambioId (divisa en una caja, ARS en otra).
    const d = dataset({
      cajas: [caja({ id: "oficina" }), caja({ id: "trenque", label: "Trenque" })],
      opsCambio: [
        opCambio({ id: "c", tipo: "COMPRA_USD", fecha: "2026-04-02", cantidad: 100, totalARS: 100_000, cobroUSD: 100 }),
        opCambio({ id: "c2", tipo: "COMPRA_USD", fecha: "2026-04-03", cantidad: 100, totalARS: 120_000, cobroUSD: 100 }),
        opCambio({ id: "v", tipo: "VENTA_USD", fecha: "2026-04-10", cantidad: 50, totalARS: 65_000, cobroUSD: 50 }),
      ],
      movsCaja: [
        mov({ cajaId: "trenque", tipo: "ENTRADA", moneda: "USD", monto: 100, fecha: "2026-04-02", operacionCambioId: "c", descripcion: "[Cambio c] Compra divisa" }),
        mov({ cajaId: "oficina", tipo: "SALIDA", moneda: "ARS", monto: 100_000, fecha: "2026-04-02", operacionCambioId: "c", descripcion: "[Cambio c] Pago ARS x Compra" }),
        mov({ cajaId: "trenque", tipo: "ENTRADA", moneda: "USD", monto: 100, fecha: "2026-04-03", operacionCambioId: "c2", descripcion: "[Cambio c2] Compra divisa" }),
        mov({ cajaId: "oficina", tipo: "SALIDA", moneda: "ARS", monto: 120_000, fecha: "2026-04-03", operacionCambioId: "c2", descripcion: "[Cambio c2] Pago ARS x Compra" }),
        mov({ cajaId: "trenque", tipo: "SALIDA", moneda: "USD", monto: 50, fecha: "2026-04-10", operacionCambioId: "v", descripcion: "[Cambio v] Venta divisa" }),
        mov({ cajaId: "oficina", tipo: "ENTRADA", moneda: "ARS", monto: 65_000, fecha: "2026-04-10", operacionCambioId: "v", descripcion: "[Cambio v] Cobro ARS x Venta" }),
      ],
    });
    const ledger = construirLedger(d);
    // Las 3 operaciones entran al costo promedio (ninguna omitida).
    expect(ledger.fxOperaciones.map((o) => o.id).sort()).toEqual(["c", "c2", "v"]);
    // Las patas de caja son liquidación del cambio, no resultado (sin doble conteo).
    expect(ledger.hechos.filter((h) => h.origen === "CAJA").every((h) => h.categoria === "CAMBIO_LIQUIDACION" && !h.impactoRealizado)).toBe(true);

    const r = calcularResultadoRealizado(d, ledger, "2026-04");
    // Promedio 220.000 / 200 = 1.100 ARS/USD → venta 50 × 1.300 − 50 × 1.100 = 10.000.
    expect(r.porCategoria.FX_REALIZADO.nativo.ARS).toBe(10_000);
    expect(r.partidas.filter((p) => p.categoria === "FX_REALIZADO")).toHaveLength(1);
    expect(r.quality).toBe("EXACT");

    // Caja: un solo impacto por pata (USD 150 en Trenque, ARS −155.000 en Oficina).
    const pn = calcularPatrimonioNeto(d, "2026-04-30");
    expect(pn.componentes.cajas.nativo.USD).toBe(150);
    expect(pn.componentes.cajas.nativo.ARS).toBe(-155_000);
  });

  it("operación revertida (pendiente + [REVERTIDA POR:]) no vuelve a aparecer en el resultado", () => {
    const d = dataset({ opsCambio: [
      opCambio({ tipo: "COMPRA_USD", fecha: "2026-04-02", cantidad: 100, totalARS: 100_000 }),
      opCambio({ tipo: "VENTA_USD", fecha: "2026-04-05", cantidad: 100, totalARS: 110_000, pendiente: true, descripcion: "[REVERTIDA POR: t] [CC] v" }),
    ] });
    const r = calcularResultadoRealizado(d, construirLedger(d), "2026-04");
    expect(r.porCategoria.FX_REALIZADO.nativo.ARS).toBe(0);
    expect(r.excluidos.revertidos.cantidad).toBe(1);
  });
});
