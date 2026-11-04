import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireActionPermission: vi.fn(),
  prisma: {
    auditLog: { findUnique: vi.fn() },
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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { revertirTransferencia } from "./actions";

function makeFormData(logId = "log-1"): FormData {
  const fd = new FormData();
  fd.set("logId", logId);
  return fd;
}


beforeEach(() => {
  vi.clearAllMocks();
});

// MACRO 6 — CUSTODIA FUERA DE LA BETA (decisión D): toda mutación se rechaza en el
// servidor, para cualquier usuario (incluso ADMIN / con permiso), sin tocar la base.
describe("revertirTransferencia — custodia bloqueada durante la Beta (MACRO 6)", () => {
  const BLOQUEADA = { error: "Las transferencias de activos a Custodia están temporalmente deshabilitadas durante la Beta." };

  it("usuario autorizado / ADMIN → DENY explícito, ninguna lectura ni escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    const result = await revertirTransferencia(null, makeFormData());
    expect(result).toEqual(BLOQUEADA);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.prisma.auditLog.findUnique).not.toHaveBeenCalled();
  });

  it("sin permiso → igual DENY por bloqueo (no depende del gate de permisos)", async () => {
    mocks.requireActionPermission.mockResolvedValue({ error: "No tenés permisos para realizar esta acción." });
    const result = await revertirTransferencia(null, makeFormData());
    expect(result).toEqual(BLOQUEADA);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });
});
