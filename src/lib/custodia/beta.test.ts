// MACRO 6 — Custodia en SOLO LECTURA durante la Beta.
// A/B/C (DENY de asignarACustodia / transferirActivo / revertirTransferencia) viven en
// los tests de cada acción. Acá: el guard, la lectura (D) y la exclusión del PN (E).
import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: { custodiaCliente: { findMany: vi.fn() } },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import { custodiaMutacionesBloqueadas, denegarMutacionCustodia, MENSAJE_CUSTODIA_BLOQUEADA } from "./beta";
import { getResumenCustodiaByClienteId } from "../data/custodia";
import { calcularPatrimonioNeto } from "../finance/patrimonio";
import { dataset, tcDiario } from "../finance/test-fixtures";

describe("Custodia — fuera de la Beta (MACRO 6)", () => {
  it("guard activo: toda mutación devuelve el mensaje explícito", () => {
    expect(custodiaMutacionesBloqueadas()).toBe(true);
    expect(denegarMutacionCustodia()).toEqual({ error: MENSAJE_CUSTODIA_BLOQUEADA });
    expect(MENSAJE_CUSTODIA_BLOQUEADA).toMatch(/temporalmente deshabilitadas durante la Beta/);
  });

  it("D. la lectura de la custodia existente sigue funcionando (no pasa por el guard)", async () => {
    const Decimal = (await import("@prisma/client/runtime/library")).Decimal;
    mocks.prisma.custodiaCliente.findMany.mockResolvedValue([{
      id: "cu1", cantidadTotal: new Decimal(19500), precioPromedio: new Decimal("1.01954"),
      Activo: { ticker: "CS44D", descripcion: "ON", precioActual: new Decimal("1.02"), monedaPrecio: "USD" },
    }]);
    const r = await getResumenCustodiaByClienteId("cl1");
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ ticker: "CS44D", moneda: "USD" });
    expect(Number(r[0].cantidad)).toBe(19500);
  });

  it("E. la custodia sigue EXCLUIDA del PN propio (se informa aparte)", () => {
    const tc = tcDiario(1000, "2026-01-01", "2026-12-31");
    const sin = calcularPatrimonioNeto(dataset({ tc }), "2026-10-30");
    const con = calcularPatrimonioNeto(dataset({ tc, custodia: [{ cantidadTotal: 19500, precioPromedio: 1, precioActual: 2, monedaPrecio: "USD" }] }), "2026-10-30");
    expect(con.custodiaExcluidaUSD).toBe(39_000);
    expect(con.pnUSD).toBe(sin.pnUSD);
    expect(con.quality).toBe(sin.quality);
  });
});
