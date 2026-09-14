import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireActionPermission: vi.fn(),
  prisma: {
    posicionCartera: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

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

describe("transferirActivo — gate de autorización (SEC-17/18/19)", () => {
  it("sin sesión → rechazo, ninguna escritura Prisma ocurre", async () => {
    mocks.requireActionPermission.mockResolvedValue({ error: "Sin sesión activa" });

    const result = await transferirActivo(null, makeFormData());

    expect(result).toEqual({ error: "Sin sesión activa" });
    expect(mocks.prisma.posicionCartera.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("usuario sin permiso 'bolsa:transferir_custodia' → rechazo, ninguna escritura Prisma ocurre", async () => {
    mocks.requireActionPermission.mockResolvedValue({ error: "No tenés permisos para realizar esta acción." });

    const result = await transferirActivo(null, makeFormData());

    expect(result).toEqual({ error: "No tenés permisos para realizar esta acción." });
    expect(mocks.requireActionPermission).toHaveBeenCalledWith("bolsa:transferir_custodia");
    expect(mocks.prisma.posicionCartera.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("usuario autorizado → ejecuta la transferencia", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.prisma.posicionCartera.findUnique.mockResolvedValue({
      id: "pos-1",
      cantidad: "10",
      activoId: "act-1",
      precioCompra: "100",
    });
    mocks.prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        posicionCartera: { delete: vi.fn(), update: vi.fn() },
        custodiaCliente: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn(), update: vi.fn() },
        auditLog: { create: vi.fn() },
      }),
    );

    const result = await transferirActivo(null, makeFormData());

    expect(result).toEqual({ success: true });
    expect(mocks.prisma.posicionCartera.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("ADMIN autorizado (permiso siempre concedido) → ejecuta la transferencia", async () => {
    // requireActionPermission ya resuelve null para ADMIN (bypass interno de la matriz)
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.prisma.posicionCartera.findUnique.mockResolvedValue({
      id: "pos-1",
      cantidad: "10",
      activoId: "act-1",
      precioCompra: "100",
    });
    mocks.prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        posicionCartera: { delete: vi.fn(), update: vi.fn() },
        custodiaCliente: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn(), update: vi.fn() },
        auditLog: { create: vi.fn() },
      }),
    );

    const result = await transferirActivo(null, makeFormData());

    expect(result).toEqual({ success: true });
  });
});
