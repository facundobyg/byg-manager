import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  prisma: {
    movimientoCC: { findMany: vi.fn(), findFirst: vi.fn() },
    plazoFijo: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

import {
  getRecentOperacionMovimientos,
  esMovimientoDeOperacionAgrupada,
  extraerMovRef,
} from "./movimiento-cc";

function mov(overrides: Partial<{
  id: string; fecha: Date; tipo: string; monto: string; descripcion: string | null;
  cuentaCorrienteId: string; CuentaCorriente: { moneda: string; Cliente: { id: string; nombre: string } };
}>) {
  return {
    id: overrides.id ?? "m1",
    fecha: overrides.fecha ?? new Date("2026-09-01"),
    tipo: overrides.tipo ?? "EGRESO",
    monto: { toString: () => overrides.monto ?? "100" } as unknown as { toString(): string },
    descripcion: overrides.descripcion ?? null,
    cuentaCorrienteId: overrides.cuentaCorrienteId ?? "cc1",
    CuentaCorriente: overrides.CuentaCorriente ?? {
      moneda: "USD",
      Cliente: { id: "cli1", nombre: "Cliente Test" },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.plazoFijo.findMany.mockResolvedValue([]);
});

// ── Test 19: una operación con ref:{operationRef} queda revertida ───────────

describe("getRecentOperacionMovimientos — revertida por ref: (OPS-01, test 19)", () => {
  it("marca revertida=true en el grupo original cuando existe un movimiento con ref:{operationRef}, aunque la reversión sea su propio grupo op: separado", async () => {
    mocks.prisma.movimientoCC.findMany.mockResolvedValue([
      mov({ id: "orig1", tipo: "EGRESO", descripcion: "RULO ARS->USD | op:REF1", monto: "100" }),
      mov({ id: "orig2", tipo: "INGRESO", descripcion: "RULO ARS->USD | op:REF1", monto: "105" }),
      mov({ id: "rev1", tipo: "INGRESO", descripcion: "REVERSO EGRESO | op:REF2 | ref:REF1", monto: "100" }),
      mov({ id: "rev2", tipo: "EGRESO", descripcion: "REVERSO INGRESO | op:REF2 | ref:REF1", monto: "105" }),
    ]);

    const ledger = await getRecentOperacionMovimientos();

    const original = ledger.find((r) => r.operationRef === "REF1");
    expect(original).toBeDefined();
    expect(original?.revertida).toBe(true);
  });

  it("una operación sin reversión asociada queda revertida=false", async () => {
    mocks.prisma.movimientoCC.findMany.mockResolvedValue([
      mov({ id: "orig1", tipo: "EGRESO", descripcion: "LP egreso | op:REF3", monto: "50" }),
    ]);

    const ledger = await getRecentOperacionMovimientos();

    const original = ledger.find((r) => r.operationRef === "REF3");
    expect(original?.revertida).toBe(false);
  });

  it("no confunde ref: de una operación distinta (REF-OTRA) con la que se está evaluando (REF1)", async () => {
    mocks.prisma.movimientoCC.findMany.mockResolvedValue([
      mov({ id: "orig1", tipo: "EGRESO", descripcion: "LP egreso | op:REF1", monto: "50" }),
      mov({ id: "rev1", tipo: "INGRESO", descripcion: "REVERSO EGRESO | op:REF2 | ref:REF-OTRA", monto: "999" }),
    ]);

    const ledger = await getRecentOperacionMovimientos();

    const original = ledger.find((r) => r.operationRef === "REF1");
    expect(original?.revertida).toBe(false);
  });

  it("8 (ajuste final A2.1): un INTERES (op: de una sola pata) queda revertida=true en cuanto existe ref:{operationRef}", async () => {
    mocks.prisma.movimientoCC.findMany.mockResolvedValue([
      mov({ id: "int-1", tipo: "INTERES", descripcion: "INTERES CC | op:REF-INT-1", monto: "25" }),
      mov({ id: "rev-int-1", tipo: "EGRESO", descripcion: "REVERSO INTERES | op:REF-INT-2 | ref:REF-INT-1", monto: "25" }),
    ]);

    const ledger = await getRecentOperacionMovimientos();

    const interes = ledger.find((r) => r.operationRef === "REF-INT-1");
    expect(interes?.tipoOperacion).toBe("INTERES");
    expect(interes?.revertida).toBe(true);
  });
});

describe("getRecentOperacionMovimientos — pfRevertido / pfInconsistente (OPS-02, tests 25-27)", () => {
  function lpMovs(operationRef: string, reversalRef: string) {
    return [
      mov({ id: "lp-1", tipo: "EGRESO", descripcion: `LP egreso | op:${operationRef}`, monto: "1000" }),
      mov({ id: "rev-lp-1", tipo: "INGRESO", descripcion: `REVERSO EGRESO | op:${reversalRef} | ref:${operationRef}`, monto: "1000" }),
    ];
  }

  it("25: LP revertida + PF persistido CANCELADO → pfRevertido=true, pfInconsistente=false", async () => {
    mocks.prisma.movimientoCC.findMany.mockResolvedValue(lpMovs("REF-LP-1", "REF-LP-1-R"));
    mocks.prisma.plazoFijo.findMany.mockResolvedValue([
      { id: "pf-1", notas: "LP automático | op:REF-LP-1", estado: "CANCELADO" },
    ]);

    const ledger = await getRecentOperacionMovimientos();

    const lp = ledger.find((r) => r.operationRef === "REF-LP-1");
    expect(lp?.revertida).toBe(true);
    expect(lp?.pfRevertido).toBe(true);
    expect(lp?.pfInconsistente).toBe(false);
  });

  it("26/27: LP revertida + PF persistido ACTIVO (legacy) → pfRevertido=false, pfInconsistente=true", async () => {
    mocks.prisma.movimientoCC.findMany.mockResolvedValue(lpMovs("REF-LP-2", "REF-LP-2-R"));
    mocks.prisma.plazoFijo.findMany.mockResolvedValue([
      { id: "pf-2", notas: "LP automático | op:REF-LP-2", estado: "ACTIVO" },
    ]);

    const ledger = await getRecentOperacionMovimientos();

    const lp = ledger.find((r) => r.operationRef === "REF-LP-2");
    expect(lp?.revertida).toBe(true);
    // No basta con que exista ref: en CC — el PF real sigue ACTIVO, no se
    // puede declarar "PF revertido" falsamente (test 26).
    expect(lp?.pfRevertido).toBe(false);
    // Debe señalarse como inconsistente para revisión manual (test 27).
    expect(lp?.pfInconsistente).toBe(true);
  });

  it("LP NO revertida + PF ACTIVO → ni pfRevertido ni pfInconsistente (caso normal)", async () => {
    mocks.prisma.movimientoCC.findMany.mockResolvedValue([
      mov({ id: "lp-3", tipo: "EGRESO", descripcion: "LP egreso | op:REF-LP-3", monto: "500" }),
    ]);
    mocks.prisma.plazoFijo.findMany.mockResolvedValue([
      { id: "pf-3", notas: "LP automático | op:REF-LP-3", estado: "ACTIVO" },
    ]);

    const ledger = await getRecentOperacionMovimientos();

    const lp = ledger.find((r) => r.operationRef === "REF-LP-3");
    expect(lp?.revertida).toBe(false);
    expect(lp?.pfRevertido).toBe(false);
    expect(lp?.pfInconsistente).toBe(false);
  });
});

// ── Helpers puros usados por backend (actions.ts) y UI (MovimientoCuentaCorrienteTable) ──

describe("esMovimientoDeOperacionAgrupada (OPS-01, test 11/12/21 — lógica compartida backend/UI)", () => {
  it("true para una pata RULO/DIVISA (op:{ref})", () => {
    expect(esMovimientoDeOperacionAgrupada("RULO ARS->USD | op:abc-123")).toBe(true);
  });
  it("true para egreso de LP (op:{ref})", () => {
    expect(esMovimientoDeOperacionAgrupada("LP egreso | op:abc-123")).toBe(true);
  });
  it("true para INTERES (op:{ref})", () => {
    expect(esMovimientoDeOperacionAgrupada("INTERES CC | op:abc-123")).toBe(true);
  });
  it("false para un movimiento manual sin op:", () => {
    expect(esMovimientoDeOperacionAgrupada("Ajuste manual de saldo")).toBe(false);
  });
  it("false / no revienta con descripcion null o undefined", () => {
    expect(esMovimientoDeOperacionAgrupada(null)).toBe(false);
    expect(esMovimientoDeOperacionAgrupada(undefined)).toBe(false);
  });
});

describe("extraerMovRef (OPS-01 — vínculo reversión individual → original)", () => {
  it("extrae el id referenciado por movref:", () => {
    expect(extraerMovRef("[REVERSO por Admin] Ajuste manual | movref:mov-abc-123")).toBe("mov-abc-123");
  });
  it("null si no hay movref:", () => {
    expect(extraerMovRef("Ajuste manual de saldo")).toBeNull();
    expect(extraerMovRef(null)).toBeNull();
  });
});
