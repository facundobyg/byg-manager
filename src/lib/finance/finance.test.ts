import { describe, it, expect } from "vitest";
import { calcularFxCostBasis, type FxOperacion } from "./fx-cost-basis";
import { construirLedger } from "./ledger";
import { calcularResultadoRealizado } from "./resultado";
import { calcularPatrimonioNeto } from "./patrimonio";
import { calcularValuacion } from "./valuacion";
import { conciliarPeriodo } from "./reconciliacion";
import { construirResolver, TcResolver } from "./tc";
import { mapBalanceGeneral, mapResultadoCambio, mapUtilidadMes } from "./compat";
import { D } from "./types";
import { caja, dataset, mov, opBolsa, opCambio, ro, tcDiario, tcSerie } from "./test-fixtures";
import type { FinanceDataset } from "./dataset";

const resultado = (ds: FinanceDataset, mes = "2026-04") => calcularResultadoRealizado(ds, construirLedger(ds), mes);
const fx = (id: string, lado: "COMPRA" | "VENTA", cantidad: number, totalARS: number, fecha = "2026-04-10", createdAt = `${fecha}T10:00:00Z`): FxOperacion =>
  ({ id, lado, cantidad, totalARS, fecha, createdAt, moneda: "USD" });

// ─────────────────────────────────────────────────────────────────────────────
describe("FX — costo promedio ponderado móvil", () => {
  it("compra: actualiza posición y costo promedio", () => {
    const r = calcularFxCostBasis([fx("a", "COMPRA", 100, 100_000)]);
    expect(r.posiciones.USD.cantidad.toNumber()).toBe(100);
    expect(r.posiciones.USD.costoPromedioARS.toNumber()).toBe(1000);
    expect(r.ventas).toHaveLength(0);
  });

  it("compra adicional: promedio ponderado", () => {
    const r = calcularFxCostBasis([fx("a", "COMPRA", 100, 100_000), fx("b", "COMPRA", 100, 120_000, "2026-04-11")]);
    expect(r.posiciones.USD.cantidad.toNumber()).toBe(200);
    expect(r.posiciones.USD.costoPromedioARS.toNumber()).toBe(1100);
  });

  it("venta parcial con ganancia: producido − costo de lo vendido; el resto queda a costo promedio", () => {
    const r = calcularFxCostBasis([
      fx("a", "COMPRA", 100, 100_000), fx("b", "COMPRA", 100, 120_000, "2026-04-11"), fx("c", "VENTA", 50, 60_000, "2026-04-12"),
    ]);
    expect(r.ventas[0].costoVendidoARS.toNumber()).toBe(55_000);
    expect(r.ventas[0].resultadoARS.toNumber()).toBe(5_000);
    expect(r.posiciones.USD.cantidad.toNumber()).toBe(150);
    expect(r.posiciones.USD.costoARS.toNumber()).toBe(165_000);
  });

  it("venta total con pérdida: posición en cero", () => {
    const r = calcularFxCostBasis([fx("a", "COMPRA", 100, 110_000), fx("b", "VENTA", 100, 100_000, "2026-04-12")]);
    expect(r.ventas[0].resultadoARS.toNumber()).toBe(-10_000);
    expect(r.posiciones.USD.cantidad.isZero()).toBe(true);
    expect(r.posiciones.USD.costoARS.isZero()).toBe(true);
  });

  it("mismo día, múltiples operaciones: orden estable por createdAt (la compra posterior no altera la venta previa)", () => {
    const r = calcularFxCostBasis([
      fx("c", "COMPRA", 100, 120_000, "2026-04-10", "2026-04-10T12:00:00Z"),
      fx("a", "COMPRA", 100, 100_000, "2026-04-10", "2026-04-10T10:00:00Z"),
      fx("b", "VENTA", 100, 110_000, "2026-04-10", "2026-04-10T11:00:00Z"),
    ]);
    expect(r.ventas[0].opId).toBe("b");
    expect(r.ventas[0].resultadoARS.toNumber()).toBe(10_000);
  });

  it("venta sin base: no inventa costo, informa unidades sin base y no genera resultado por ellas", () => {
    const r = calcularFxCostBasis([fx("a", "COMPRA", 40, 40_000), fx("b", "VENTA", 100, 110_000, "2026-04-12")]);
    expect(r.ventas[0].ventaSinBase.toNumber()).toBe(60);
    expect(r.ventas[0].resultadoARS.toNumber()).toBe(4_000); // 40 × 1100 − 40 × 1000
  });

  it("base de apertura explícita: cubre la posición inicial; ops anteriores a su fecha no se recuentan", () => {
    const r = calcularFxCostBasis(
      [fx("viejo", "COMPRA", 999, 1, "2026-03-15"), fx("v", "VENTA", 50, 55_000, "2026-04-12")],
      { apertura: { USD: { cantidad: 100, costoARS: 100_000, fecha: "2026-03-31" } } },
    );
    expect(r.ventas[0].resultadoARS.toNumber()).toBe(5_000);
    expect(r.ventas[0].ventaSinBase.toNumber()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Resultado realizado — exclusiones y reglas", () => {
  const compraVenta = (extra: Partial<Parameters<typeof opCambio>[0]> = {}) => [
    opCambio({ tipo: "COMPRA_USD", fecha: "2026-04-02", cantidad: 100, totalARS: 100_000 }),
    opCambio({ tipo: "VENTA_USD", fecha: "2026-04-05", cantidad: 100, totalARS: 110_000, ...extra }),
  ];

  it("compra/venta FX liquidada → resultado ARS al TC de la fecha", () => {
    const r = resultado(dataset({ opsCambio: compraVenta() }));
    expect(r.porCategoria.FX_REALIZADO.nativo.ARS).toBe(10_000);
    expect(r.totalUSD).toBe(10); // TC 1000
  });

  it("pendiente / NO_LIQUIDADA no genera resultado (se informa)", () => {
    const r = resultado(dataset({ opsCambio: compraVenta({ pendiente: true }) }));
    expect(r.totalUSD).toBe(0);
    expect(r.excluidos.pendientes.cantidad).toBe(1);
  });

  it("operación revertida no genera resultado ni artificial por la reversa", () => {
    const r = resultado(dataset({ opsCambio: compraVenta({ pendiente: true, descripcion: "[REVERTIDA POR: X] venta" }) }));
    expect(r.totalUSD).toBe(0);
    expect(r.excluidos.revertidos.cantidad).toBe(1);
  });

  it("reversa de resultado operativo neutraliza el original", () => {
    const original = ro("HONORARIO_CLIENTE", { id: "h1", tipo: "ENTRADA", moneda: "ARS", monto: 50_000, fecha: "2026-04-03" });
    const reversa = mov({ tipo: "SALIDA", moneda: "ARS", monto: 50_000, fecha: "2026-04-20", descripcion: `REVERSO | ref:h1 | ${original.descripcion}` });
    const r = resultado(dataset({ movsCaja: [original, reversa] }));
    expect(r.totalUSD).toBe(0);
    expect(r.excluidos.revertidos.cantidad).toBe(1);
  });

  it("gasto en USD no se pierde (moneda nativa)", () => {
    const r = resultado(dataset({ movsCaja: [ro("SUELDO", { tipo: "SALIDA", moneda: "USD", monto: 300, fecha: "2026-04-15" })] }));
    expect(r.porMoneda.USD).toBe(-300);
    expect(r.totalUSD).toBe(-300);
    expect(r.egresosUSD).toBe(300);
  });

  it("resultado operativo fuera del mes no entra", () => {
    const r = resultado(dataset({ movsCaja: [
      ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 10_000, fecha: "2026-03-31" }),
      ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 20_000, fecha: "2026-04-30" }),
      ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 40_000, fecha: "2026-05-01" }),
    ] }));
    expect(r.porMoneda.ARS).toBe(20_000);
  });

  it("transferencia interna: utilidad 0", () => {
    const r = resultado(dataset({ movsCaja: [
      mov({ tipo: "SALIDA", moneda: "USD", monto: 100, fecha: "2026-04-10", descripcion: "[TRANSFERENCIA:OUT] a Trenque" }),
      mov({ cajaId: "trenque", tipo: "ENTRADA", moneda: "USD", monto: 100, fecha: "2026-04-10", descripcion: "[TRANSFERENCIA:IN] desde Oficina" }),
    ], cajas: [caja(), caja({ id: "trenque", label: "Trenque" })] }));
    expect(r.totalUSD).toBe(0);
  });

  it("distribución de utilidades: no es gasto (retiro informado)", () => {
    const r = resultado(dataset({ movsCaja: [
      ro("COMISION", { tipo: "ENTRADA", moneda: "USD", monto: 1000, fecha: "2026-04-10" }),
      ro("DISTRIBUCION_UTILIDADES", { tipo: "SALIDA", moneda: "USD", monto: 800, fecha: "2026-04-28" }),
    ] }));
    expect(r.totalUSD).toBe(1000);
    expect(r.excluidos.distribuciones.nativo.USD).toBe(-800);
  });

  it("honorario cargado como op de cambio Y como resultado operativo vinculado: se cuenta UNA vez", () => {
    const op = opCambio({ id: "hon1", tipo: "HONORARIO_CLIENTE", fecha: "2026-04-10", totalARS: 30_000 });
    const dup = ro("HONORARIO_CLIENTE", { tipo: "ENTRADA", moneda: "ARS", monto: 30_000, fecha: "2026-04-10", operacionCambioId: "hon1" });
    const r = resultado(dataset({ opsCambio: [op], movsCaja: [dup] }));
    expect(r.porMoneda.ARS).toBe(30_000);
    expect(r.excluidos.duplicados.cantidad).toBe(1);
  });

  it("GASTO_OPERATIVO legacy (ambiguo: gasto / pago de interés PF / distribución): no entra y el mes queda INCOMPLETE", () => {
    const r = resultado(dataset({ opsCambio: [opCambio({ tipo: "GASTO_OPERATIVO", fecha: "2026-04-30", cobroUSD: 700, cantidad: 700 })] }));
    expect(r.quality).toBe("INCOMPLETE");
    expect(r.totalUSD).toBeNull();
    expect(r.knownSubtotalUSD).toBe(0);
    expect(r.qualityReasons.map((x) => x.code)).toContain("LEGACY_UNCLASSIFIED");
    expect(r.excluidos.legacyNoClasificado.nativo.USD).toBe(-700);
  });

  it("Rulo/Div-Int/LP sin dueño estructural: no entra (no se infiere por nombre) y el mes queda INCOMPLETE", () => {
    const r = resultado(dataset({ registrosCuenta: [{ id: "r1", origen: "DIVINT", fecha: "2026-04-24", cuenta: "BYG", usd: 200, ars: 0 }] }));
    expect(r.quality).toBe("INCOMPLETE");
    expect(r.totalUSD).toBeNull();
    expect(r.qualityReasons.map((x) => x.code)).toContain("OWNER_UNRESOLVED");
    expect(r.excluidos.ownerNoResuelto.nativo.USD).toBe(200);
  });

  it("venta de cartera propia: contra costo promedio registrado; sin costo → informada, no inventada, mes INCOMPLETE", () => {
    const r = resultado(dataset({
      opsBolsa: [
        opBolsa({ id: "v1", carteraId: "c1", tipoOperacion: "VENTA_BONO", cantidad: 10, precio: 100, netoLiquidado: 990, moneda: "USD" }),
        opBolsa({ id: "v2", carteraId: "c1", tipoOperacion: "VENTA_BONO", cantidad: 5, precio: 100, moneda: "USD" }),
      ],
      costosCartera: [{ operacionId: "v1", costoUnitario: 90 }],
    }));
    expect(r.porCategoria.CARTERA_VENTA.nativo.USD).toBe(90);
    expect(r.excluidos.carteraSinCosto.cantidad).toBe(1);
    expect(r.quality).toBe("INCOMPLETE");
    expect(r.qualityReasons.map((x) => x.code)).toContain("CARTERA_MISSING_COST");
    expect(r.knownSubtotalUSD).toBe(90);
  });

  it("interés PF devengado y renta/impuesto de inmueble", () => {
    const r = resultado(dataset({
      pfMovs: [{ id: "i1", plazoFijoId: "pf1", fecha: "2026-04-30", tipo: "INTERES", monto: 50, moneda: "USD" }],
      inmuebles: [
        { id: "x1", propiedadId: "p", fecha: "2026-04-05", tipo: "RENTA", monto: 500, moneda: "USD" },
        { id: "x2", propiedadId: "p", fecha: "2026-04-06", tipo: "IMPUESTO", monto: 100, moneda: "USD" },
        { id: "x3", propiedadId: "p", fecha: "2026-04-07", tipo: "INGRESO", monto: 90_000, moneda: "USD" },
      ],
    }));
    expect(r.porCategoria.INTERES_PF.nativo.USD).toBe(-50);
    expect(r.porCategoria.INMUEBLE_RENTA.nativo.USD).toBe(500);
    expect(r.porCategoria.INMUEBLE_IMPUESTO.nativo.USD).toBe(-100);
    expect(r.totalUSD).toBe(350); // el aporte de capital al inmueble NO es resultado
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("TC histórico", () => {
  it("un mes histórico NO cambia cuando cambia el TC actual", () => {
    const movs = [ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 100_000, fecha: "2026-04-10" })];
    const antes = resultado(dataset({ movsCaja: movs, tc: tcSerie({ "2026-04-01": 1000 }) }));
    const despues = resultado(dataset({ movsCaja: movs, tc: tcSerie({ "2026-04-01": 1000, "2026-10-01": 2000 }) }));
    expect(antes.totalUSD).toBe(100);
    expect(despues.totalUSD).toBe(100);
  });

  it("TC faltante: consolidado null y faltante informado (no se inventa)", () => {
    const r = resultado(dataset({ movsCaja: [ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 1000, fecha: "2026-04-10" })], tc: new TcResolver([]) }));
    expect(r.quality).toBe("INCOMPLETE");
    expect(r.totalUSD).toBeNull();
    expect(r.tc.faltantes).toEqual(["ARS@2026-04-10"]);
    expect(r.porMoneda.ARS).toBe(1000);
  });

  it("sin TC anterior (antes del inicio del historial): bootstrap con el primer TC posterior, aproximado", () => {
    const r = resultado(dataset({ movsCaja: [ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 1000, fecha: "2026-04-10" })], tc: tcSerie({ "2026-04-20": 1000 }) }));
    expect(r.quality).toBe("APPROXIMATE");
    expect(r.totalUSD).toBe(1);
    expect(r.tc.aproximados[0]).toMatchObject({ modo: "POSTERIOR", fechaTc: "2026-04-20" });
  });

  it("P1-03A: la serie histórica sale SOLO de TipoCambio (Config.tc_blue no es fuente histórica)", () => {
    const res = construirResolver({ tipoCambio: [{ monedaOrigen: "ARS", monedaDestino: "USD", valor: 1250, fecha: "2026-05-06" }] });
    expect(res.resolver("ARS", "2026-06-01")?.fuente).toBe("TipoCambio ARS>USD");
    expect(res.resolver("ARS", "2026-06-01")?.modo).toBe("VIGENTE");
    expect(construirResolver({ tipoCambio: [] }).resolver("ARS", "2026-06-01")).toBeNull();
  });

  it("convención EUR/BRL (inferida, validada por rango): nunca 1:1", () => {
    const res = construirResolver({ tipoCambio: [
      { monedaOrigen: "EUR", monedaDestino: "USD", valor: 1.08, fecha: "2026-04-01" },
      { monedaOrigen: "BRL", monedaDestino: "USD", valor: 5.2, fecha: "2026-04-01" },
      { monedaOrigen: "EUR", monedaDestino: "USD", valor: 1250, fecha: "2026-04-02" },
    ] });
    expect(res.resolver("EUR", "2026-04-01")!.usdPorUnidad.toNumber()).toBe(1.08);
    expect(res.resolver("BRL", "2026-04-01")!.usdPorUnidad.toNumber()).toBeCloseTo(1 / 5.2, 10);
    expect(res.advertencias[0]).toMatch(/EUR 2026-04-02 = 1250 fuera de rango/);
  });

  it("EUR/BRL en resultado: convertidos con su propio TC", () => {
    const tc = tcSerie({ "2026-04-01": 1000 }, [
      { moneda: "EUR", fecha: "2026-04-01", usdPorUnidad: D(1.1), fuente: "t" },
      { moneda: "BRL", fecha: "2026-04-01", usdPorUnidad: D(0.2), fuente: "t" },
    ]);
    const r = resultado(dataset({ tc, movsCaja: [
      ro("COMISION", { tipo: "ENTRADA", moneda: "EUR", monto: 100, fecha: "2026-04-10" }),
      ro("COMISION", { tipo: "ENTRADA", moneda: "BRL", monto: 500, fecha: "2026-04-10" }),
    ] }));
    expect(r.totalUSD).toBeCloseTo(110 + 100, 8);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Patrimonio neto canónico", () => {
  const base = () => dataset({
    cajas: [caja({ saldoInicialUSD: 1000, saldoInicialARS: 500_000 }), caja({ id: "trenque", label: "Trenque" })],
    movsCaja: [
      mov({ tipo: "ENTRADA", moneda: "EUR", monto: 100, fecha: "2026-04-01" }),
      mov({ tipo: "SALIDA", moneda: "USD", monto: 200, fecha: "2026-04-02", descripcion: "[TRANSFERENCIA:OUT] a Trenque" }),
      mov({ cajaId: "trenque", tipo: "ENTRADA", moneda: "USD", monto: 200, fecha: "2026-04-02", descripcion: "[TRANSFERENCIA:IN]" }),
      mov({ id: "pend", tipo: "ENTRADA", moneda: "USD", monto: 1000, fecha: "2026-04-03", confirmado: false }),
      mov({ tipo: "ENTRADA", moneda: "USD", monto: 400, fecha: "2026-04-04", pagoDeId: "pend", descripcion: "Pago parcial de pendiente pend" }),
      mov({ tipo: "ENTRADA", moneda: "USD", monto: 999, fecha: "2026-12-01" }),
    ],
    carteras: [{ id: "c1", nombre: "BYG", activa: true, saldoPesos: 100_000, saldoUSDCable: 50, saldoUSDMep: 0, posiciones: [
      { ticker: "SPY", cantidad: 10, precioCompra: 4, precioActual: 5, monedaPrecio: "USD" },
    ] }],
    clientes: [
      { id: "cl1", nombre: "A", activo: true, cc: [{ id: "cc1", moneda: "USD", saldo: 300 }], pf: [{ id: "pf1", moneda: "USD", capital: 1000, saldoActual: 1050, estado: "ACTIVO" }] },
      { id: "cl2", nombre: "B", activo: true, cc: [{ id: "cc2", moneda: "ARS", saldo: -200_000 }], pf: [] },
    ],
    pfMovs: [{ id: "i", plazoFijoId: "pf1", fecha: "2026-04-30", tipo: "INTERES", monto: 50, moneda: "USD" }],
    custodia: [{ cantidadTotal: 1000, precioPromedio: 1, precioActual: 2, monedaPrecio: "USD" }],
    propiedades: [{ id: "p", nombre: "Depto", activa: true }],
    inmuebles: [{ id: "x", propiedadId: "p", fecha: "2026-04-07", tipo: "INGRESO", monto: 90_000, moneda: "USD" }],
    tc: tcDiario(1000, "2025-12-01", "2027-01-31", ["2026-04-03", "2026-10-30"].map((fecha) => ({ moneda: "EUR" as const, fecha, usdPorUnidad: D(1.1), fuente: "t" }))),
  });

  it("componentes exactos", () => {
    const pn = calcularPatrimonioNeto(base(), "2026-10-30");
    const c = pn.componentes;
    expect(c.cajas.nativo).toEqual({ ARS: 500_000, USD: 1000 + 400, EUR: 100, BRL: 0 }); // transferencia neutra; fuera de corte excluido
    expect(c.cajas.usd).toBeCloseTo(500 + 1400 + 110, 8);   // EUR al TC propio, no 1:1
    expect(c.pendientesCobrar.nativo.USD).toBe(600);          // residual (1000 − 400), sin doble conteo
    expect(c.carteras.usd).toBeCloseTo(50 + 100 + 50, 8);     // cash de cartera incluido
    expect(c.inmuebles.usd).toBe(90_000);
    expect(c.pf.usd).toBe(1050);                               // obligación con interés devengado
    expect(c.ccAcreedora.usd).toBe(300);
    expect(c.ccDeudora.usd).toBe(200);
    expect(pn.custodiaExcluidaUSD).toBe(2000);
    expect(pn.pnUSD).toBeCloseTo(2010 + 600 + 200 + 90_000 + 200 - 1050 - 300, 8); // custodia EXCLUIDA
    expect(pn.quality).toBe("EXACT");
  });

  it("pago parcial no se cuenta dos veces (caja + pendiente = monto original)", () => {
    const pn = calcularPatrimonioNeto(base(), "2026-10-30");
    const cajaPend = pn.detalle.cajas.reduce((s, k) => s + k.nativo.USD, 0) - 1000 + pn.componentes.pendientesCobrar.nativo.USD;
    expect(cajaPend).toBe(1000);
  });

  it("corte histórico: excluye hechos posteriores; Carteras/CC/PF sin historial → INCOMPLETE (no se presenta como exacto)", () => {
    const pn = calcularPatrimonioNeto(base(), "2026-04-03");
    expect(pn.componentes.cajas.nativo.USD).toBe(1000);
    expect(pn.componentes.pendientesCobrar.nativo.USD).toBe(1000);
    expect(pn.quality).toBe("INCOMPLETE");
    expect(pn.pnUSD).toBeNull();
    expect(pn.qualityReasons.map((x) => x.code)).toContain("HISTORICAL_STATE_UNAVAILABLE");
  });

  it("Posición, Home y Reportes reciben el MISMO PN (mismo objeto canónico)", () => {
    const pn = calcularPatrimonioNeto(base(), "2026-10-30");
    expect(mapBalanceGeneral(pn).patrimonioNeto).toBe(pn.pnUSD);
  });

  it("valuación separada: Δprecio es no realizado, no resultado", () => {
    const ds = base();
    const v = calcularValuacion(ds, construirLedger(ds), "2026-10-30");
    expect(v.cartera[0].noRealizadoUSD).toBe(10);
    expect(resultado(ds).porCategoria.CARTERA_VENTA.usd).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Invariante PN", () => {
  it("ΔPN = resultado + flujos clasificados (nativo, residual 0) y USD con diferencia de conversión explícita", () => {
    const ds = dataset({
      cajas: [caja({ saldoInicialARS: 1_000_000, saldoInicialUSD: 0 }), caja({ id: "t", label: "T" })],
      opsCambio: [
        opCambio({ id: "c1", tipo: "COMPRA_USD", fecha: "2026-04-02", cantidad: 100, totalARS: 100_000 }),
        opCambio({ id: "v1", tipo: "VENTA_USD", fecha: "2026-04-20", cantidad: 60, totalARS: 72_000 }),
      ],
      movsCaja: [
        mov({ tipo: "ENTRADA", moneda: "USD", monto: 100, fecha: "2026-04-02", descripcion: "[Cambio c1] Compra divisa" }),
        mov({ tipo: "SALIDA", moneda: "ARS", monto: 100_000, fecha: "2026-04-02", descripcion: "[Cambio c1] Pago ARS x Compra" }),
        mov({ tipo: "SALIDA", moneda: "USD", monto: 60, fecha: "2026-04-20", descripcion: "[Cambio v1] Venta divisa" }),
        mov({ tipo: "ENTRADA", moneda: "ARS", monto: 72_000, fecha: "2026-04-20", descripcion: "[Cambio v1] Cobro ARS x Venta" }),
        ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 50_000, fecha: "2026-04-10" }),
        ro("DISTRIBUCION_UTILIDADES", { tipo: "SALIDA", moneda: "ARS", monto: 20_000, fecha: "2026-04-25" }),
        mov({ tipo: "SALIDA", moneda: "USD", monto: 10, fecha: "2026-04-11", descripcion: "[TRANSFERENCIA:OUT]" }),
        mov({ cajaId: "t", tipo: "ENTRADA", moneda: "USD", monto: 10, fecha: "2026-04-11", descripcion: "[TRANSFERENCIA:IN]" }),
        mov({ tipo: "SALIDA", moneda: "ARS", monto: 5_000, fecha: "2026-04-12", descripcion: "[MOVIMIENTO_CAJA:EGRESO_CC_CLIENTE] x" }),
      ],
      tc: tcSerie({ "2026-03-01": 1000, "2026-04-15": 1100, "2026-04-30": 1250 }),
    });
    const ledger = construirLedger(ds);
    const c = conciliarPeriodo(ds, ledger, "2026-03-31", "2026-04-30");
    expect(c.residualNativo).toEqual({ ARS: 0, USD: 0, EUR: 0, BRL: 0 });
    expect(c.explicado.RESULTADO_REALIZADO.ARS).toBe(50_000);
    expect(c.explicado.DISTRIBUCION.ARS).toBe(-20_000);
    expect(c.explicado.TRANSFERENCIA_INTERNA.USD).toBe(0);
    expect(c.flujosPatrimonialesPorSubtipo.EGRESO_CC_CLIENTE.ARS).toBe(-5_000);
    // patas de cambio = conversión + resultado FX realizado (60 × 1200 − 60 × 1000 = 12.000 ARS)
    const r = calcularResultadoRealizado(ds, ledger, "2026-04");
    expect(r.porCategoria.FX_REALIZADO.nativo.ARS).toBe(12_000);
    expect(c.usd.residual).toBeCloseTo(0, 8);
    expect(c.usd.diferenciaConversion).not.toBe(0); // ΔTC sobre saldos ARS: valuación, explícita
  });

  it("un flujo sin clasificar en la caja aparece en el desglose (no se esconde)", () => {
    const ds = dataset({ movsCaja: [mov({ tipo: "ENTRADA", moneda: "USD", monto: 5, fecha: "2026-04-10", descripcion: "texto libre" })] });
    const c = conciliarPeriodo(ds, construirLedger(ds), "2026-03-31", "2026-04-30");
    expect(c.flujosPatrimonialesPorSubtipo.SIN_CLASIFICAR.USD).toBe(5);
    expect(c.residualNativo.USD).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Consumidores: mismo resultado canónico", () => {
  it("getUtilidadMes y getResultadoCambioMensual exponen el MISMO total", () => {
    const ds = dataset({
      opsCambio: [
        opCambio({ tipo: "COMPRA_USD", fecha: "2026-04-02", cantidad: 100, totalARS: 100_000 }),
        opCambio({ tipo: "VENTA_USD", fecha: "2026-04-05", cantidad: 100, totalARS: 110_000 }),
      ],
      movsCaja: [ro("SUELDO", { tipo: "SALIDA", moneda: "USD", monto: 3, fecha: "2026-04-15" })],
    });
    const ledger = construirLedger(ds);
    const r = calcularResultadoRealizado(ds, ledger, "2026-04");
    const u = mapUtilidadMes(r, ds);
    const c = mapResultadoCambio(r, ledger, ds);
    expect(u.utilidadTotalUSD).toBe(7);
    expect(c.totalUSD).toBe(7);
    expect(c.USD.resultado).toBe(10);
    expect(u.egresosUSD).toBe(3);
  });

  it("TC faltante en un consumidor: null + INCOMPLETE propagados (nunca 0)", () => {
    const ds = dataset({ movsCaja: [ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 1, fecha: "2026-04-10" })], tc: new TcResolver([]) });
    const ledger = construirLedger(ds);
    const r = calcularResultadoRealizado(ds, ledger, "2026-04");
    const u = mapUtilidadMes(r, ds);
    const c = mapResultadoCambio(r, ledger, ds);
    expect(u.utilidadTotalUSD).toBeNull();
    expect(u.quality).toBe("INCOMPLETE");
    expect(u.ingresosUSD).toBeNull();
    expect(u.tcBlue).toBeNull();
    expect(c.totalUSD).toBeNull();
    expect(c.quality).toBe("INCOMPLETE");
    expect(c.qualityReasons.map((x) => x.code)).toContain("TC_MISSING");
  });
});
