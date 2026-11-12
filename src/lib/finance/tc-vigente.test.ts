import { describe, it, expect } from "vitest";
import { construirLedger } from "./ledger";
import { calcularResultadoRealizado } from "./resultado";
import { calcularPatrimonioNeto } from "./patrimonio";
import { cargarFinanceDataset } from "./load";
import { construirResolver, type TipoCambioRow } from "./tc";
import { D } from "./types";
import { caja, dataset, mov, ro } from "./test-fixtures";
import type { FinanceDataset } from "./dataset";

// P1-03A — TC VIGENTE: el último TC cargado rige hasta el próximo cambio (no vence).
// Serie = la REAL de PROD/TEST al 2026-11-11 (TipoCambio ARS→USD).

const SERIE_REAL: TipoCambioRow[] = [
  { monedaOrigen: "ARS", monedaDestino: "USD", valor: 1250, fecha: "2026-04-16" },
  { monedaOrigen: "ARS", monedaDestino: "USD", valor: 1250, fecha: "2026-04-27" },
  { monedaOrigen: "ARS", monedaDestino: "USD", valor: 1250, fecha: "2026-05-06" },
  { monedaOrigen: "ARS", monedaDestino: "USD", valor: 1550, fecha: "2026-09-18" },
];
const ars = (r: ReturnType<ReturnType<typeof construirResolver>["resolver"]>) => (r ? D(1).div(r.usdPorUnidad).toDecimalPlaces(4).toNumber() : null);
const resultado = (ds: FinanceDataset, mes: string) => calcularResultadoRealizado(ds, construirLedger(ds), mes);
const codigos = (r: { qualityReasons: { code: string }[] }) => r.qualityReasons.map((x) => x.code);

describe("P1-03A — resolver: vigencia hasta el próximo cambio", () => {
  const res = construirResolver({ tipoCambio: SERIE_REAL });
  const con1600 = construirResolver({ tipoCambio: [...SERIE_REAL, { monedaOrigen: "ARS", monedaDestino: "USD", valor: 1600, fecha: "2026-11-15" }] });

  it("A. 16/04 = 1250 (mismo día, EXACTO)", () => {
    expect(ars(res.resolver("ARS", "2026-04-16"))).toBe(1250);
    expect(res.resolver("ARS", "2026-04-16")!.modo).toBe("EXACTO");
  });
  it("B. 21/05 = 1250 (vigente desde 06/05)", () => {
    expect(ars(res.resolver("ARS", "2026-05-21"))).toBe(1250);
    expect(res.resolver("ARS", "2026-05-21")).toMatchObject({ modo: "VIGENTE", fechaTc: "2026-05-06" });
  });
  it("C. 12/08 = 1250", () => expect(ars(res.resolver("ARS", "2026-08-12"))).toBe(1250));
  it("D. 17/09 = 1250 (último día antes del cambio)", () => expect(ars(res.resolver("ARS", "2026-09-17"))).toBe(1250));
  it("E. 18/09 = 1550", () => expect(ars(res.resolver("ARS", "2026-09-18"))).toBe(1550));
  it("F. 11/11 = 1550 (54 días después: sigue vigente)", () => {
    expect(ars(res.resolver("ARS", "2026-11-11"))).toBe(1550);
    expect(res.resolver("ARS", "2026-11-11")).toMatchObject({ modo: "VIGENTE", fechaTc: "2026-09-18", desfaseDias: 54 });
  });
  it("G. un TC de 6 meses sigue vigente (no vence por antigüedad)", () => {
    const solo = construirResolver({ tipoCambio: [{ monedaOrigen: "ARS", monedaDestino: "USD", valor: 1000, fecha: "2026-01-10" }] });
    expect(solo.resolver("ARS", "2026-07-20")).toMatchObject({ modo: "VIGENTE", fechaTc: "2026-01-10" });
  });
  it("H. nuevo TC 1600 el 15/11: 14/11 = 1550 · 15/11 = 1600 · 30/11 = 1600 (la historia no cambia)", () => {
    expect(ars(con1600.resolver("ARS", "2026-11-14"))).toBe(1550);
    expect(ars(con1600.resolver("ARS", "2026-11-15"))).toBe(1600);
    expect(ars(con1600.resolver("ARS", "2026-11-30"))).toBe(1600);
    for (const f of ["2026-05-21", "2026-08-12", "2026-09-30"]) expect(ars(con1600.resolver("ARS", f))).toBe(ars(res.resolver("ARS", f)));
  });
  it("I. antes del primer registro → primer TC posterior, modo POSTERIOR (bootstrap aproximado)", () => {
    expect(res.resolver("ARS", "2026-04-07")).toMatchObject({ modo: "POSTERIOR", fechaTc: "2026-04-16" });
    expect(ars(res.resolver("ARS", "2026-04-01"))).toBe(1250);
  });
  it("I'. con al menos un TC ≤ D NUNCA mira hacia adelante (21/05 no usa el 1550 del 18/09)", () => {
    expect(res.resolver("ARS", "2026-05-21")!.fechaTc).toBe("2026-05-06");
  });
  it("J. sin ningún TC → null (TC_MISSING)", () => {
    expect(construirResolver({ tipoCambio: [] }).resolver("ARS", "2026-11-11")).toBeNull();
  });
});

describe("P1-03A — K. Config.tc_blue con updatedAt engañoso NO afecta la historia (carga real del dataset)", () => {
  /** DB falsa: todos los findMany devuelven [] salvo Config y TipoCambio. */
  function dbFalsa(config: unknown[], tipoCambio: unknown[]) {
    return new Proxy({}, {
      get: (_t, modelo: string) => ({
        findMany: async () => (modelo === "config" ? config : modelo === "tipoCambio" ? tipoCambio : []),
      }),
    });
  }
  it("Config 1550 @ 2026-05-08 (estado real de PROD) no se usa: 21/05 resuelve 1250 desde TipoCambio", async () => {
    const tipoCambio = SERIE_REAL.map((r) => ({ ...r, valor: D(r.valor as number), fecha: new Date(`${r.fecha}T00:00:00Z`) }));
    const config = [{ clave: "tc_blue", valor: "1550", updatedAt: new Date("2026-05-08T21:21:52.889Z") }];
    const ds = await cargarFinanceDataset(dbFalsa(config, tipoCambio) as never, new Date("2026-11-11T15:00:00Z"));
    expect(ars(ds.tc.resolver("ARS", "2026-05-21"))).toBe(1250);
    expect(ds.tc.resolver("ARS", "2026-05-21")!.fuente).toBe("TipoCambio ARS>USD");
    expect(ars(ds.tc.resolver("ARS", "2026-05-08"))).toBe(1250);
  });
  it("sin TipoCambio, Config.tc_blue solo NO crea historia (TC_MISSING)", async () => {
    const ds = await cargarFinanceDataset(dbFalsa([{ clave: "tc_blue", valor: "1550", updatedAt: new Date("2026-05-08T00:00:00Z") }], []) as never, new Date("2026-11-11T15:00:00Z"));
    expect(ds.tc.resolver("ARS", "2026-11-11")).toBeNull();
  });
});

describe("P1-03A — regresiones del motor con la serie real (montos ARS de PROD)", () => {
  const tc = construirResolver({ tipoCambio: SERIE_REAL });

  it("MAYO: 21/05 se convierte a 1250 → 4.590,49 USD EXACT (antes 3.634,27 APPROXIMATE con 1550)", () => {
    const r = resultado(dataset({ tc, movsCaja: [
      ro("HONORARIO_BANCO", { tipo: "ENTRADA", moneda: "ARS", monto: 6_000_000, fecha: "2026-05-21" }),
      ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 175_613.82153674465, fecha: "2026-05-21" }),
      ro("GASTO", { tipo: "SALIDA", moneda: "USD", monto: 350, fecha: "2026-05-21" }),
    ] }), "2026-05");
    expect(r.quality).toBe("EXACT");
    expect(r.totalUSD).toBeCloseTo(4590.49, 2);
    expect(r.partidas.find((p) => p.monto === 6_000_000)!.usd).toBe(4800);
  });

  it("AGOSTO: 12/08 deja de estar sin TC → 153.946,51 / 1250 = 123,16 USD EXACT", () => {
    const r = resultado(dataset({ tc, movsCaja: [ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 153_946.50541631857, fecha: "2026-08-12" })] }), "2026-08");
    expect(r.quality).toBe("EXACT");
    expect(r.totalUSD).toBeCloseTo(123.16, 2);
    expect(codigos(r)).not.toContain("TC_MISSING");
  });

  it("ABRIL: 01/04–15/04 conservan el bootstrap 1250 como APPROXIMATE (no pierden la conversión)", () => {
    const r = resultado(dataset({ tc, movsCaja: [ro("COMISION", { tipo: "ENTRADA", moneda: "ARS", monto: 125_000, fecha: "2026-04-07" })] }), "2026-04");
    expect(r.quality).toBe("APPROXIMATE");
    expect(r.totalUSD).toBe(100);
    expect(codigos(r)).toEqual(["TC_APPROXIMATE"]);
    expect(r.tc.aproximados[0]).toMatchObject({ modo: "POSTERIOR", fechaTc: "2026-04-16" });
  });

  it("NOVIEMBRE: sin partidas → 0 EXACT (sin cambio)", () => {
    const r = resultado(dataset({ tc, movsCaja: [] }), "2026-11");
    expect(r.quality).toBe("EXACT");
    expect(r.totalUSD).toBe(0);
  });

  it("PN al 11/11: sin TC_MISSING (usa 1550 vigente) y EXACTAMENTE 2 MISSING_MARKET_PRICE; Juan ccUSD = 0 fuera de CC deudora/acreedora", () => {
    const pn = calcularPatrimonioNeto(dataset({
      tc, hoy: "2026-11-11",
      cajas: [caja({ saldoInicialARS: 1_550_000, saldoInicialUSD: 100 })],
      movsCaja: [mov({ tipo: "ENTRADA", moneda: "ARS", monto: 0.01, fecha: "2026-11-01" })],
      carteras: [{
        id: "daniel", nombre: "Daniel", activa: true, saldoPesos: 0, saldoUSDCable: 0, saldoUSDMep: 0,
        posiciones: [
          { ticker: "IAM RENTA USD", cantidad: 30088, precioCompra: 0, precioActual: null, monedaPrecio: "USD" },
          { ticker: "IPA", cantidad: 11701, precioCompra: 0, precioActual: null, monedaPrecio: "USD" },
          { ticker: "AL30", cantidad: 10, precioCompra: 1, precioActual: 2, monedaPrecio: "USD" },
        ],
      }] as never,
      clientes: [
        { id: "juan", nombre: "Juan Pérez", activo: false, cc: [{ id: "u", moneda: "USD", saldo: 0 }, { id: "a", moneda: "ARS", saldo: 0 }], pf: [] },
        { id: "fran", nombre: "Fran", activo: true, cc: [{ id: "u2", moneda: "USD", saldo: 1000 }, { id: "a2", moneda: "ARS", saldo: 1550 }], pf: [] },
      ] as never,
    }));
    expect(codigos(pn).filter((c) => c === "TC_MISSING")).toHaveLength(0);
    expect(codigos(pn)).toEqual(["MISSING_MARKET_PRICE", "MISSING_MARKET_PRICE"]);
    expect(pn.quality).toBe("INCOMPLETE");
    expect(pn.tc.faltantes).toEqual([]);
    expect(pn.componentes.cajas.usd).toBeCloseTo(1100, 4); // 1.550.000 ARS / 1550 + 100 USD (+0,01 ARS)
    const juan = pn.detalle.clientes.find((c) => c.id === "juan")!;
    expect(juan.ccUSD).toBe(0);
    expect(juan.ccNativo).toEqual({ ARS: 0, USD: 0, EUR: 0, BRL: 0 });
    expect(pn.componentes.ccAcreedora.usdConocido).toBe(1001); // solo Fran: 1000 + 1550/1550
    expect(pn.componentes.ccDeudora.usdConocido).toBe(0);
  });
});
