import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireActionPermission: vi.fn(),
  auth: vi.fn(),
  writeAuditLog: vi.fn(),
  prisma: {
    cartera: { update: vi.fn() },
    activo: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    posicionCartera: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth/permissions", () => ({
  requireActionPermission: mocks.requireActionPermission,
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/services/audit.service", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  updateSaldosCartera,
  agregarPosicion,
  editarPosicion,
  cambiarCategoriaActivo,
  asignarACustodia,
  eliminarPosicion,
} from "./actions";

const DENEGADO = { error: "No tenés permisos para realizar esta acción." };
const SIN_SESION = { error: "Sin sesión activa" };

beforeEach(() => {
  vi.clearAllMocks();
});

// ── updateSaldosCartera ──────────────────────────────────────────────────────

describe("updateSaldosCartera — gate de autorización (SEC-17/18/19)", () => {
  function fd() {
    const f = new FormData();
    f.set("carteraId", "cart-1");
    f.set("slug", "firma");
    f.set("saldoPesos", "100");
    f.set("saldoUSDCable", "0");
    f.set("saldoUSDMep", "0");
    return f;
  }

  it("sin sesión → rechazo, ninguna escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(SIN_SESION);
    const result = await updateSaldosCartera({}, fd());
    expect(result).toEqual({ error: "Sin sesión activa" });
    expect(mocks.prisma.cartera.update).not.toHaveBeenCalled();
  });

  it("usuario sin permiso 'saldos:editar' → rechazo, ninguna escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const result = await updateSaldosCartera({}, fd());
    expect(result).toEqual({ error: DENEGADO.error });
    expect(mocks.requireActionPermission).toHaveBeenCalledWith("saldos:editar");
    expect(mocks.prisma.cartera.update).not.toHaveBeenCalled();
  });

  it("usuario autorizado → actualiza los saldos", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.prisma.cartera.update.mockResolvedValue({});
    const result = await updateSaldosCartera({}, fd());
    expect(result).toEqual({ ok: true });
    expect(mocks.prisma.cartera.update).toHaveBeenCalledTimes(1);
  });
});

// ── agregarPosicion ───────────────────────────────────────────────────────────

describe("agregarPosicion — gate de autorización (SEC-17/18/19)", () => {
  function fd() {
    const f = new FormData();
    f.set("carteraId", "cart-1");
    f.set("ticker", "GGAL");
    f.set("categoria", "ACCION");
    f.set("cantidad", "10");
    f.set("precioCompra", "100");
    return f;
  }

  it("sin sesión → rechazo, ninguna escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(SIN_SESION);
    const result = await agregarPosicion(null, fd());
    expect(result).toEqual({ error: "Sin sesión activa" });
    expect(mocks.prisma.activo.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.posicionCartera.create).not.toHaveBeenCalled();
  });

  it("usuario sin permiso 'bolsa:crear' → rechazo, ninguna escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const result = await agregarPosicion(null, fd());
    expect(result).toEqual({ error: DENEGADO.error });
    expect(mocks.requireActionPermission).toHaveBeenCalledWith("bolsa:crear");
    expect(mocks.prisma.activo.findUnique).not.toHaveBeenCalled();
  });

  it("usuario autorizado → crea la posición", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.prisma.activo.findUnique.mockResolvedValue({ id: "act-1", ticker: "GGAL" });
    mocks.prisma.posicionCartera.findUnique.mockResolvedValue(null);
    mocks.prisma.posicionCartera.create.mockResolvedValue({});
    const result = await agregarPosicion(null, fd());
    expect(result).toEqual({ success: true });
    expect(mocks.prisma.posicionCartera.create).toHaveBeenCalledTimes(1);
  });
});

// ── editarPosicion ────────────────────────────────────────────────────────────

describe("editarPosicion — gate de autorización antes de escribir (SEC-17/18/19)", () => {
  function fd() {
    const f = new FormData();
    f.set("posicionId", "pos-1");
    f.set("cantidad", "20");
    return f;
  }

  it("sin sesión → rechazo, ninguna escritura Prisma ni auditoría", async () => {
    mocks.requireActionPermission.mockResolvedValue(SIN_SESION);
    const result = await editarPosicion(null, fd());
    expect(result).toEqual({ error: "Sin sesión activa" });
    expect(mocks.prisma.posicionCartera.update).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("usuario sin permiso 'bolsa:crear' → rechazo, ninguna escritura Prisma ni auditoría", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const result = await editarPosicion(null, fd());
    expect(result).toEqual({ error: DENEGADO.error });
    expect(mocks.prisma.posicionCartera.update).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("usuario autorizado → edita la posición y audita con el userId de la sesión gateada", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.prisma.posicionCartera.update.mockResolvedValue({ Activo: { ticker: "GGAL" } });
    const result = await editarPosicion(null, fd());
    expect(result).toEqual({ success: true });
    expect(mocks.prisma.posicionCartera.update).toHaveBeenCalledTimes(1);
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
  });
});

// ── cambiarCategoriaActivo ────────────────────────────────────────────────────

describe("cambiarCategoriaActivo — gate de autorización (SEC-17/18/19)", () => {
  function fd() {
    const f = new FormData();
    f.set("activoId", "act-1");
    f.set("categoria", "BONO");
    return f;
  }

  it("sin sesión → rechazo, ninguna escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(SIN_SESION);
    const result = await cambiarCategoriaActivo(null, fd());
    expect(result).toEqual({ error: "Sin sesión activa" });
    expect(mocks.prisma.activo.update).not.toHaveBeenCalled();
  });

  it("usuario sin permiso 'bolsa:crear' → rechazo, ninguna escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const result = await cambiarCategoriaActivo(null, fd());
    expect(result).toEqual({ error: DENEGADO.error });
    expect(mocks.prisma.activo.update).not.toHaveBeenCalled();
  });

  it("usuario autorizado → cambia la categoría", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.prisma.activo.update.mockResolvedValue({});
    const result = await cambiarCategoriaActivo(null, fd());
    expect(result).toEqual({ success: true });
    expect(mocks.prisma.activo.update).toHaveBeenCalledTimes(1);
  });
});

// ── eliminarPosicion ──────────────────────────────────────────────────────────

describe("eliminarPosicion — gate de autorización (SEC-17/18/19)", () => {
  function fd() {
    const f = new FormData();
    f.set("posicionId", "pos-1");
    return f;
  }

  it("sin sesión → rechazo, ninguna escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(SIN_SESION);
    const result = await eliminarPosicion(null, fd());
    expect(result).toEqual({ error: "Sin sesión activa" });
    expect(mocks.prisma.posicionCartera.delete).not.toHaveBeenCalled();
  });

  it("usuario sin permiso 'bolsa:anular' → rechazo, ninguna escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const result = await eliminarPosicion(null, fd());
    expect(result).toEqual({ error: DENEGADO.error });
    expect(mocks.requireActionPermission).toHaveBeenCalledWith("bolsa:anular");
    expect(mocks.prisma.posicionCartera.delete).not.toHaveBeenCalled();
  });

  it("usuario autorizado → elimina la posición", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.prisma.posicionCartera.delete.mockResolvedValue({});
    const result = await eliminarPosicion(null, fd());
    expect(result).toEqual({ success: true });
    expect(mocks.prisma.posicionCartera.delete).toHaveBeenCalledTimes(1);
  });
});

// ── asignarACustodia (ya protegida — regresión) ──────────────────────────────

describe("asignarACustodia — regresión del gate ya existente", () => {
  function fd() {
    const f = new FormData();
    f.set("posicionId", "pos-1");
    f.set("clienteId", "cliente-1");
    f.set("cantidad", "5");
    return f;
  }

  it("sin sesión → rechazo, ninguna escritura Prisma", async () => {
    mocks.requireActionPermission.mockResolvedValue(SIN_SESION);
    const result = await asignarACustodia(null, fd());
    expect(result).toEqual({ error: "Sin sesión activa" });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("usuario sin permiso 'bolsa:transferir_custodia' → rechazo", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const result = await asignarACustodia(null, fd());
    expect(result).toEqual({ error: DENEGADO.error });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("ADMIN/usuario autorizado → ejecuta la asignación a custodia", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1", name: "Admin" } });
    mocks.prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        posicionCartera: {
          findUnique: vi.fn().mockResolvedValue({
            id: "pos-1",
            cantidad: "10",
            activoId: "act-1",
            carteraId: "cart-1",
            precioCompra: "100",
            Activo: { ticker: "GGAL" },
          }),
          update: vi.fn(),
          delete: vi.fn(),
        },
        custodiaCliente: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn(), update: vi.fn() },
        transferenciaActivo: { create: vi.fn() },
      }),
    );

    const result = await asignarACustodia(null, fd());
    expect(result).toEqual({ success: true });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
  });
});
