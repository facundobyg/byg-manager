import { describe, it, expect, vi } from "vitest";

// soloPFActivos es una función pura (sin prisma) — no hace falta mockear
// @/lib/prisma para importarla, pero el módulo la comparte con funciones que
// sí usan prisma, así que igual lo mockeamos para evitar el problema de
// resolución de Vite visto en otros módulos de datos de este repo.
vi.mock("@/lib/prisma", () => ({
  prisma: { plazoFijo: { findUnique: vi.fn(), findMany: vi.fn() } },
}));

import { soloPFActivos } from "./plazo-fijo";

function pf(estado: string, id = estado.toLowerCase()) {
  return { id, estado };
}

describe("soloPFActivos (OPS-02, tests 28-30 — universo operativo de /plazos-fijos e /intereses)", () => {
  it("28: un PF CANCELADO no entra en el universo operativo", () => {
    const result = soloPFActivos([pf("CANCELADO")]);
    expect(result).toEqual([]);
  });

  it("PF VENCIDO y RENOVADO tampoco entran (mismo criterio, no solo CANCELADO)", () => {
    const result = soloPFActivos([pf("VENCIDO"), pf("RENOVADO")]);
    expect(result).toEqual([]);
  });

  it("30: un PF ACTIVO sigue entrando normalmente", () => {
    const activo = pf("ACTIVO");
    const result = soloPFActivos([activo]);
    expect(result).toEqual([activo]);
  });

  it("29: filtra un universo mixto dejando solo los ACTIVO (caso realista /intereses y /plazos-fijos)", () => {
    const activo1 = pf("ACTIVO", "a1");
    const cancelado = pf("CANCELADO", "c1");
    const activo2 = pf("ACTIVO", "a2");
    const vencido = pf("VENCIDO", "v1");

    const result = soloPFActivos([activo1, cancelado, activo2, vencido]);

    expect(result).toEqual([activo1, activo2]);
  });

  it("lista vacía → lista vacía", () => {
    expect(soloPFActivos([])).toEqual([]);
  });
});
