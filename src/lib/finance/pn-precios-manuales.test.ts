import { describe, it, expect } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { cargarFinanceDataset } from "./load";
import { calcularPatrimonioNeto } from "./patrimonio";

// P1-03B — PN con IAM RENTA USD / IPA (FCI, USD) según cuántos precios faltan.
// Valuación = cantidad × precioActual en la moneda del precio (USD: sin TC).

function dbFalsa(filas: Record<string, unknown[]> = {}) {
  return new Proxy({}, { get: (_t, modelo: string) => ({ findMany: async () => filas[modelo] ?? [] }) });
}

const IAM = "1.707824", IPA = "1.291257";
function cartera(precioIam: string | null, precioIpa: string | null) {
  const pos = (ticker: string, cantidad: string, precio: string | null) => ({
    cantidad: new Decimal(cantidad), precioCompra: new Decimal(0),
    Activo: { ticker, precioActual: precio === null ? null : new Decimal(precio), monedaPrecio: "USD" },
  });
  return [{
    id: "daniel", nombre: "Daniel", activa: true, saldoPesos: new Decimal(0), saldoUSDCable: new Decimal(0), saldoUSDMep: new Decimal(0),
    PosicionCartera: [pos("IAM RENTA USD", "30088", precioIam), pos("IPA", "11701", precioIpa)],
  }];
}
const pn = async (a: string | null, b: string | null) =>
  calcularPatrimonioNeto(await cargarFinanceDataset(dbFalsa({ cartera: cartera(a, b) }) as never, new Date("2026-11-12T18:00:00Z")));
const codigos = (r: Awaited<ReturnType<typeof pn>>) => r.qualityReasons.map((x) => `${x.code}: ${x.detail}`);

describe("P1-03B — PN con 2, 1 y 0 precios faltantes", () => {
  it("2 faltantes (estado PROD previo): INCOMPLETE, pnUSD null, 2 × MISSING_MARKET_PRICE", async () => {
    const r = await pn(null, null);
    expect(r.quality).toBe("INCOMPLETE");
    expect(r.pnUSD).toBeNull();
    expect(codigos(r)).toEqual([
      "MISSING_MARKET_PRICE: Daniel/IAM RENTA USD: sin precio de mercado",
      "MISSING_MARKET_PRICE: Daniel/IPA: sin precio de mercado",
    ]);
    expect(r.knownSubtotalUSD).toBe(0);
  });

  it("1 faltante (solo IAM cargado): sigue INCOMPLETE con 1 motivo; el conocido suma IAM", async () => {
    const r = await pn(IAM, null);
    expect(r.quality).toBe("INCOMPLETE");
    expect(r.pnUSD).toBeNull();
    expect(codigos(r)).toEqual(["MISSING_MARKET_PRICE: Daniel/IPA: sin precio de mercado"]);
    expect(r.knownSubtotalUSD).toBeCloseTo(51385.008512, 6);
  });

  it("0 faltantes: EXACT, qualityReasons [], PN = 51.385,008512 + 15.108,998157 = 66.494,006669", async () => {
    const r = await pn(IAM, IPA);
    expect(r.quality).toBe("EXACT");
    expect(r.qualityReasons).toEqual([]);
    expect(r.pnUSD).toBeCloseTo(66494.006669, 6);
    expect(Math.abs((r.pnUSD as number) - (51385 + 15109))).toBeLessThan(0.02); // error total de redondeo < USD 0,02
    expect(r.tc.faltantes).toEqual([]);
  });
});
