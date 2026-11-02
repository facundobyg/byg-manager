import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { construirLedger } from "./ledger";
import { calcularResultadoRealizado } from "./resultado";
import { calcularPatrimonioNeto } from "./patrimonio";
import { calcularValuacion } from "./valuacion";
import { TcResolver } from "./tc";
import { mapBalanceGeneral, mapResultadoCambio, mapUtilidadMes } from "./compat";
import { peorCalidad } from "./quality";
import { D } from "./types";
import { dataset, opBolsa, opCambio, tcDiario } from "./test-fixtures";
import type { FinanceDataset } from "./dataset";

// MACRO 2 · FIX PASS — regresiones exactas de M2-F01..F06 + contrato de calidad.

const resultado = (ds: FinanceDataset, mes: string) => calcularResultadoRealizado(ds, construirLedger(ds), mes);
const codigos = (r: { qualityReasons: { code: string }[] }) => r.qualityReasons.map((x) => x.code);

// ─────────────────────────────────────────────────────────────────────────────
describe("Contrato de calidad", () => {
  it("la calidad agregada es la peor de sus dependencias", () => {
    expect(peorCalidad("EXACT", "APPROXIMATE")).toBe("APPROXIMATE");
    expect(peorCalidad("APPROXIMATE", "INCOMPLETE", "EXACT")).toBe("INCOMPLETE");
    expect(peorCalidad()).toBe("EXACT");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("M2-F01 — reversa REAL de interés CC neutraliza el interés en su período original", () => {
  const interes = (id: string, descripcion: string, fecha = "2026-04-10") =>
    ({ id, fecha, tipo: "INTERES", monto: 50, moneda: "USD" as const, clienteId: "c1", descripcion });

  it("reversa grupal (revertirOperacion: REVERSO INTERES | op:<nuevo> | ref:<op>) al día siguiente → resultado 0, sin duplicar, EXACT", () => {
    const r = resultado(dataset({
      movsCCInteres: [interes("i1", "INTERES CC | op:op-1")],
      movsCCReversas: [{ id: "rv1", fecha: "2026-04-11", descripcion: "REVERSO INTERES | op:op-nuevo | ref:op-1" }],
    }), "2026-04");
    expect(r.totalUSD).toBe(0);
    expect(r.partidas).toHaveLength(0);
    expect(r.excluidos.revertidos.cantidad).toBe(1);
    expect(r.quality).toBe("EXACT");
  });

  it("reversa individual (revertirMovimientoCC: … | movref:<id>) en el mes SIGUIENTE → el mes original igual queda en 0", () => {
    const ds = dataset({
      movsCCInteres: [interes("i2", "Interés CC período 01/04/2026 - 10/04/2026")],
      movsCCReversas: [{ id: "rv2", fecha: "2026-05-02", descripcion: "[REVERSO por Facu] Interés CC período 01/04/2026 - 10/04/2026 | movref:i2" }],
    });
    expect(resultado(ds, "2026-04").totalUSD).toBe(0);
    expect(resultado(ds, "2026-05").totalUSD).toBe(0); // la reversa no crea resultado propio
  });

  it("sin reversa (o reversa de OTRA operación) el interés sí entra como costo", () => {
    const r = resultado(dataset({
      movsCCInteres: [interes("i3", "INTERES CC | op:op-3")],
      movsCCReversas: [
        { id: "rvx", fecha: "2026-04-11", descripcion: "REVERSO INTERES | op:z | ref:op-otra" },
        // "movref:op-3" referencia un MOVIMIENTO con ese id, no la operación op-3
        { id: "rvy", fecha: "2026-04-11", descripcion: "[REVERSO por X] algo | movref:op-3" },
      ],
    }), "2026-04");
    expect(r.porCategoria.INTERES_CC.nativo.USD).toBe(-50);
    expect(r.totalUSD).toBe(-50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("M2-F02 — arbitraje: se evalúa el grupo COMPLETO antes de calcular", () => {
  const compra = (p: Partial<Parameters<typeof opBolsa>[0]> = {}) =>
    opBolsa({ grupoArbitrajeId: "g", tipoOperacion: "COMPRA_BONO", cantidad: 100, precio: 100, netoLiquidado: 10_100, ...p });
  const venta = (p: Partial<Parameters<typeof opBolsa>[0]> = {}) =>
    opBolsa({ grupoArbitrajeId: "g", tipoOperacion: "VENTA_BONO", cantidad: 100, precio: 110, netoLiquidado: 10_890, ...p });

  it("A. compra + venta válidas cerradas → resultado neto", () => {
    const r = resultado(dataset({ opsBolsa: [compra(), venta()] }), "2026-04");
    expect(r.porCategoria.ARBITRAJE.nativo.ARS).toBe(790);
    expect(r.quality).toBe("EXACT");
  });

  it("B. compra ANULADA + venta válida → sin resultado (no +11.000) e INCOMPLETE", () => {
    const r = resultado(dataset({ opsBolsa: [compra({ anulada: true, estado: "ANULADA" }), venta()] }), "2026-04");
    expect(r.porCategoria.ARBITRAJE.nativo.ARS).toBe(0);
    expect(r.quality).toBe("INCOMPLETE");
    expect(r.totalUSD).toBeNull();
    expect(codigos(r)).toContain("ARBITRAGE_INCOMPLETE");
  });

  it("C. compra válida + venta ANULADA → sin resultado e INCOMPLETE", () => {
    const r = resultado(dataset({ opsBolsa: [compra(), venta({ anulada: true, estado: "ANULADA" })] }), "2026-04");
    expect(r.porCategoria.ARBITRAJE.nativo.ARS).toBe(0);
    expect(r.quality).toBe("INCOMPLETE");
  });

  it("D. grupo incompleto (solo venta cerrada) → sin resultado e INCOMPLETE; grupo en curso → sin resultado, EXACT", () => {
    const incompleto = resultado(dataset({ opsBolsa: [venta()] }), "2026-04");
    expect(incompleto.porCategoria.ARBITRAJE.nativo.ARS).toBe(0);
    expect(incompleto.quality).toBe("INCOMPLETE");
    const enCurso = resultado(dataset({ opsBolsa: [compra(), venta({ estado: "PENDIENTE_CONCERTACION" })] }), "2026-04");
    expect(enCurso.porCategoria.ARBITRAJE.nativo.ARS).toBe(0);
    expect(enCurso.quality).toBe("EXACT");
    const cancelado = resultado(dataset({ opsBolsa: [compra({ anulada: true }), venta({ anulada: true })] }), "2026-04");
    expect(cancelado.quality).toBe("EXACT");
  });

  it("E. comisión: neto (costoReal) y no bruto; sin neto ni costo → INCOMPLETE", () => {
    const r = resultado(dataset({ opsBolsa: [compra(), venta({ netoLiquidado: null, costoReal: 105 })] }), "2026-04");
    expect(r.porCategoria.ARBITRAJE.nativo.ARS).toBe(11_000 - 105 - 10_100);
    const sinCostos = resultado(dataset({ opsBolsa: [compra(), venta({ netoLiquidado: null, costoReal: null })] }), "2026-04");
    expect(sinCostos.quality).toBe("INCOMPLETE");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("M2-F03 — opening basis FX con FECHA EFECTIVA", () => {
  const apertura = { USD: { cantidad: 100, costoARS: 100_000, fecha: "2026-10-01" } };

  it("venta ANTERIOR a la apertura: la apertura futura no aparece; sin historia → INCOMPLETE (la venta no desaparece)", () => {
    const r = resultado(dataset({
      fxApertura: apertura,
      opsCambio: [opCambio({ tipo: "VENTA_USD", fecha: "2026-04-10", cantidad: 10, totalARS: 12_000 })],
    }), "2026-04");
    expect(r.quality).toBe("INCOMPLETE");
    expect(r.totalUSD).toBeNull();
    expect(r.fx.USD.ventaSinBase).toBe(10);
    expect(codigos(r)).toContain("FX_MISSING_COST_BASIS");
  });

  it("valuación: corte anterior ignora la apertura; corte igual y posterior la usan", () => {
    const ds = dataset({
      fxApertura: apertura,
      opsCambio: [opCambio({ tipo: "COMPRA_USD", fecha: "2026-10-05", cantidad: 50, totalARS: 60_000 })],
    });
    const ledger = construirLedger(ds);
    expect(calcularValuacion(ds, ledger, "2026-05-01").fx).toHaveLength(0);
    expect(calcularValuacion(ds, ledger, "2026-10-01").fx[0].cantidad).toBe(100);
    expect(calcularValuacion(ds, ledger, "2026-10-15").fx[0].cantidad).toBe(150);
  });

  it("venta POSTERIOR: costo desde la apertura + compras posteriores", () => {
    const r = resultado(dataset({
      fxApertura: apertura,
      opsCambio: [
        opCambio({ tipo: "COMPRA_USD", fecha: "2026-10-05", cantidad: 100, totalARS: 120_000 }),
        opCambio({ tipo: "VENTA_USD", fecha: "2026-10-20", cantidad: 50, totalARS: 60_000 }),
      ],
    }), "2026-10");
    expect(r.porCategoria.FX_REALIZADO.nativo.ARS).toBe(60_000 - 50 * 1100);
    expect(r.quality).toBe("EXACT");
  });

  it("período que CRUZA la apertura: cada venta con la base de su época; con historia suficiente EXACT, sin ella INCOMPLETE", () => {
    const ap = { USD: { cantidad: 100, costoARS: 100_000, fecha: "2026-10-15" } };
    const conHistoria = resultado(dataset({
      fxApertura: ap,
      opsCambio: [
        opCambio({ tipo: "COMPRA_USD", fecha: "2026-10-02", cantidad: 10, totalARS: 9_000 }),
        opCambio({ tipo: "VENTA_USD", fecha: "2026-10-05", cantidad: 10, totalARS: 10_000 }),  // historia: +1.000
        opCambio({ tipo: "VENTA_USD", fecha: "2026-10-20", cantidad: 10, totalARS: 12_000 }),  // apertura: +2.000
      ],
    }), "2026-10");
    expect(conHistoria.porCategoria.FX_REALIZADO.nativo.ARS).toBe(3_000);
    expect(conHistoria.quality).toBe("EXACT");

    const sinHistoria = resultado(dataset({
      fxApertura: ap,
      opsCambio: [
        opCambio({ tipo: "VENTA_USD", fecha: "2026-10-05", cantidad: 10, totalARS: 10_000 }),
        opCambio({ tipo: "VENTA_USD", fecha: "2026-10-20", cantidad: 10, totalARS: 12_000 }),
      ],
    }), "2026-10");
    expect(sinHistoria.quality).toBe("INCOMPLETE");
    expect(sinHistoria.totalUSD).toBeNull();
    expect(sinHistoria.knownSubtotalUSD).toBe(2); // solo la parte calculable, como diagnóstico
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("M2-F04 — venta sin base: INCOMPLETE, nunca total parcial como completo", () => {
  const ds = () => dataset({ opsCambio: [
    opCambio({ tipo: "COMPRA_USD", fecha: "2026-04-02", cantidad: 40, totalARS: 40_000 }),
    opCambio({ tipo: "VENTA_USD", fecha: "2026-04-05", cantidad: 100, totalARS: 110_000 }),
  ] });

  it("motor: totalUSD null, knownSubtotal con lo calculable, reason FX_MISSING_COST_BASIS", () => {
    const r = resultado(ds(), "2026-04");
    expect(r.quality).toBe("INCOMPLETE");
    expect(r.totalUSD).toBeNull();
    expect(r.ingresosUSD).toBeNull();
    expect(r.knownSubtotalUSD).toBe(4); // 40 × (1100 − 1000) / 1000
    expect(codigos(r)).toContain("FX_MISSING_COST_BASIS");
  });

  it("compat (U1/U2) no convierte null en 0", () => {
    const d = ds();
    const ledger = construirLedger(d);
    const r = calcularResultadoRealizado(d, ledger, "2026-04");
    const u = mapUtilidadMes(r, d);
    const c = mapResultadoCambio(r, ledger, d);
    expect(u.utilidadTotalUSD).toBeNull();
    expect(u.cambioUSD).toBeNull();
    expect(u.knownSubtotalUSD).toBe(4);
    expect(c.totalUSD).toBeNull();
    expect(c.USD.resultado).toBeNull();
    expect(c.quality).toBe("INCOMPLETE");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("M2-F05 — calidad del TC (ventana simétrica ±31 días)", () => {
  const res = new TcResolver([{ moneda: "ARS", fecha: "2026-04-10", usdPorUnidad: D(1).div(1000), fuente: "t" }]);
  const modo = (f: string) => res.resolver("ARS", f)?.modo ?? null;

  it("mismo día EXACT; ±1 APPROXIMATE; ±31 APPROXIMATE; 32 / 96 / 175 días o ausente → sin TC", () => {
    expect(modo("2026-04-10")).toBe("EXACTO");
    expect(modo("2026-04-11")).toBe("ANTERIOR");
    expect(modo("2026-04-09")).toBe("POSTERIOR");
    expect(modo("2026-05-11")).toBe("ANTERIOR");   // +31
    expect(modo("2026-03-10")).toBe("POSTERIOR");  // −31
    expect(modo("2026-05-12")).toBeNull();         // +32
    expect(modo("2026-03-09")).toBeNull();         // −32
    expect(modo("2026-07-15")).toBeNull();         // 96
    expect(modo("2026-10-02")).toBeNull();         // 175
    expect(new TcResolver([]).resolver("ARS", "2026-04-10")).toBeNull();
  });

  const conIngreso = (tc: TcResolver, fecha: string) => resultado(dataset({ tc, movsCaja: [{
    id: "m", cajaId: "oficina", fecha, createdAt: fecha, tipo: "ENTRADA", moneda: "ARS", monto: 100_000,
    descripcion: "[RESULTADO_OPERATIVO:COMISION] x", confirmado: true, anulado: false, pagoDeId: null, operacionCambioId: null,
  }] }), fecha.slice(0, 7));

  it("resultado: TC aproximado → APPROXIMATE con fecha pedida/usada/desfase; 96 días → INCOMPLETE", () => {
    const aprox = conIngreso(res, "2026-04-12");
    expect(aprox.quality).toBe("APPROXIMATE");
    expect(aprox.totalUSD).toBe(100);
    expect(aprox.qualityReasons[0].detail).toMatch(/pedido 2026-04-12, usado 2026-04-10 \(\+2 días/);
    const viejo = conIngreso(res, "2026-07-15");
    expect(viejo.quality).toBe("INCOMPLETE");
    expect(viejo.totalUSD).toBeNull();
    expect(codigos(viejo)).toContain("TC_MISSING");
  });

  it("PN con TC de 175 días → INCOMPLETE; conserva subtotal nativo y USD conocido", () => {
    const pn = calcularPatrimonioNeto(dataset({
      tc: res, hoy: "2026-10-02",
      cajas: [{ id: "oficina", label: "O", activa: true, saldoInicialUSD: 100, saldoInicialARS: 1_000_000 }],
    }), "2026-10-02");
    expect(pn.quality).toBe("INCOMPLETE");
    expect(pn.pnUSD).toBeNull();
    expect(pn.componentes.cajas.usd).toBeNull();
    expect(pn.componentes.cajas.nativo.ARS).toBe(1_000_000);
    expect(pn.knownSubtotalUSD).toBe(100); // solo lo que está en USD
    const bal = mapBalanceGeneral(pn);
    expect(bal.patrimonioNeto).toBeNull();
    expect(bal.quality).toBe("INCOMPLETE");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("M2-F06 — valuación / PN sin precio de mercado", () => {
  const cartera = (posiciones: { ticker: string; precioActual: number | null }[]) => ({
    id: "c", nombre: "BYG", activa: true, saldoPesos: 0, saldoUSDCable: 0, saldoUSDMep: 0,
    posiciones: posiciones.map((p) => ({ ticker: p.ticker, cantidad: 10, precioCompra: 100, precioActual: p.precioActual, monedaPrecio: "USD" as const })),
  });
  const val = (posiciones: { ticker: string; precioActual: number | null }[]) => {
    const ds = dataset({ carteras: [cartera(posiciones)] });
    return { v: calcularValuacion(ds, construirLedger(ds), ds.hoy), pn: calcularPatrimonioNeto(ds) };
  };

  it("una posición sin precio: total null (no 0), INCOMPLETE, MISSING_MARKET_PRICE; PN sin usar costo como precio", () => {
    const { v, pn } = val([{ ticker: "X", precioActual: null }]);
    expect(v.totalNoRealizadoUSD).toBeNull();
    expect(v.totalUSD).toBeNull();
    expect(v.quality).toBe("INCOMPLETE");
    expect(codigos(v)).toContain("MISSING_MARKET_PRICE");
    expect(pn.pnUSD).toBeNull();
    expect(pn.componentes.carteras.usd).toBeNull();
    expect(pn.knownSubtotalUSD).toBe(0); // costo 1.000 NO usado como precio
  });

  it("mezcla con/sin precio: subtotal conocido solo de las valuables", () => {
    const { v, pn } = val([{ ticker: "X", precioActual: null }, { ticker: "Y", precioActual: 120 }]);
    expect(v.quality).toBe("INCOMPLETE");
    expect(v.knownSubtotalUSD).toBe(200);
    expect(pn.knownSubtotalUSD).toBe(1200);
  });

  it("todas con precio: EXACT", () => {
    const { v, pn } = val([{ ticker: "Y", precioActual: 120 }]);
    expect(v.quality).toBe("EXACT");
    expect(v.totalNoRealizadoUSD).toBe(200);
    expect(pn.quality).toBe("EXACT");
    expect(pn.pnUSD).toBe(1200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Propagación a consumidores y cierre", () => {
  it("snapshot de cierre persiste calidad, motivos y subtotal conocido (utilidad y PN)", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../data/cierres.ts"), "utf8");
    expect(src).toMatch(/quality: utilidad\.quality, qualityReasons: utilidad\.qualityReasons, knownSubtotalUSD: utilidad\.knownSubtotalUSD/);
    expect(src).toMatch(/quality: pn\.quality, qualityReasons: pn\.qualityReasons, knownSubtotalUSD: pn\.knownSubtotalUSD/);
  });

  it("ningún consumidor convierte el total canónico con Number(...) ni ?? 0", () => {
    const root = path.resolve(__dirname, "../../..");
    for (const f of ["src/app/(dashboard)/operativa/mov-diarios/page.tsx", "src/app/(dashboard)/operativa/[slug]/page.tsx"]) {
      expect(fs.readFileSync(path.join(root, f), "utf8")).not.toMatch(/Number\(resultadoCambio\.totalUSD\)/);
    }
    const posicion = fs.readFileSync(path.join(root, "src/app/(dashboard)/posicion/page.tsx"), "utf8");
    expect(posicion).not.toMatch(/pn\.(pnUSD|activoUSD|pasivoUSD) \?\? 0|\.usd \?\? 0/);
    expect(posicion).not.toMatch(/throw new Error\(`Posición/);
  });

  it("TEST: el fixture por defecto es diario (no un TC viejo que vuelva todo INCOMPLETE por accidente)", () => {
    expect(tcDiario(1000).resolver("ARS", "2026-06-15")?.modo).toBe("EXACTO");
  });
});
