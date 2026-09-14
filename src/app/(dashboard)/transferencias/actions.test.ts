import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireActionPermission: vi.fn(),
  prisma: {
    auditLog: { findUnique: vi.fn() },
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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { revertirTransferencia } from "./actions";

function makeFormData(logId = "log-1"): FormData {
  const fd = new FormData();
  fd.set("logId", logId);
  return fd;
}

const logDeTransferencia = {
  id: "log-1",
  entidadId: "pos-1",
  datosNuevos: {
    clienteId: "cliente-1",
    activoId: "act-1",
    cantidad: "10",
    precioCompra: "100",
    descripcion: "Transferencia de cartera propia a custodia cliente",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("revertirTransferencia — gate de autorización (SEC-17/18/19)", () => {
  it("sin sesión → rechazo, ninguna escritura Prisma ocurre", async () => {
    mocks.requireActionPermission.mockResolvedValue({ error: "Sin sesión activa" });

    const result = await revertirTransferencia(null, makeFormData());

    expect(result).toEqual({ error: "Sin sesión activa" });
    expect(mocks.prisma.auditLog.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("usuario sin permiso 'bolsa:transferir_custodia' → rechazo, ninguna escritura Prisma ocurre", async () => {
    mocks.requireActionPermission.mockResolvedValue({ error: "No tenés permisos para realizar esta acción." });

    const result = await revertirTransferencia(null, makeFormData());

    expect(result).toEqual({ error: "No tenés permisos para realizar esta acción." });
    expect(mocks.requireActionPermission).toHaveBeenCalledWith("bolsa:transferir_custodia");
    expect(mocks.prisma.auditLog.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("usuario autorizado → ejecuta la reversión (acción de reversión protegida)", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.prisma.auditLog.findUnique.mockResolvedValue(logDeTransferencia);
    mocks.prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        posicionCartera: { update: vi.fn() },
        custodiaCliente: {
          findUnique: vi.fn().mockResolvedValue({ id: "cust-1", cantidadTotal: "10" }),
          delete: vi.fn(),
          update: vi.fn(),
        },
        auditLog: { create: vi.fn() },
      }),
    );

    const result = await revertirTransferencia(null, makeFormData());

    expect(result).toEqual({ success: true });
    expect(mocks.prisma.auditLog.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("ADMIN autorizado → ejecuta la reversión", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.prisma.auditLog.findUnique.mockResolvedValue(logDeTransferencia);
    mocks.prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        posicionCartera: { update: vi.fn() },
        custodiaCliente: {
          findUnique: vi.fn().mockResolvedValue(null),
          delete: vi.fn(),
          update: vi.fn(),
        },
        auditLog: { create: vi.fn() },
      }),
    );

    const result = await revertirTransferencia(null, makeFormData());

    expect(result).toEqual({ success: true });
  });
});
