import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireActionPermission: vi.fn(),
  prisma: {
    posicionCartera: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/custodia/beta", async () => await import("../../../lib/custodia/beta"));
vi.mock("@/lib/auth/permissions", () => ({
  requireActionPermission: mocks.requireActionPermission,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/config", () => ({
  readOnlyPreview: false,
}));

vi.mock("@/lib/services/precioPromedio.service", () => ({
  calcularPrecioPromedio: vi.fn(() => "100"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { transferirActivo } from "./actions";

function makeFormData(overrides?: Partial<{ posicionId: string; clienteId: string; cantidad: string }>): FormData {
  const fd = new FormData();
  fd.set("posicionId", overrides?.posicionId ?? "pos-1");
  fd.set("clienteId", overrides?.clienteId ?? "cliente-1");
  fd.set("cantidad", overrides?.cantidad ?? "10");
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// MACRO 6 — CUSTODIA FUERA DE LA BETA (decisión D): toda mutación se rechaza en el
// servidor, para cualquier usuario (incluso ADMIN / con permiso), sin tocar la base.
describe("transferirActivo — custodia bloqueada durante la Beta (MACRO 6)", () => {
  const BLOQUEADA = { error: "Las transferencias de activos a Custodia están temporalmente deshabilitadas durante la Beta." };

  it("usuario autorizado / ADMIN → DENY explícito, ninguna lectura ni escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    const result = await transferirActivo(null, makeFormData());
    expect(result).toEqual(BLOQUEADA);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.prisma.posicionCartera.findUnique).not.toHaveBeenCalled();
  });

  it("sin permiso → igual DENY por bloqueo (no depende del gate de permisos)", async () => {
    mocks.requireActionPermission.mockResolvedValue({ error: "No tenés permisos para realizar esta acción." });
    const result = await transferirActivo(null, makeFormData());
    expect(result).toEqual(BLOQUEADA);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });
});
