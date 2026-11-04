import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireActionPermission: vi.fn(),
  auth: vi.fn(),
  writeAuditLog: vi.fn(),
  prisma: {
    cartera: { update: vi.fn(), findUnique: vi.fn() },
    activo: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    posicionCartera: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/custodia/beta", async () => await import("../../../lib/custodia/beta"));
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
// MACRO 5: ajustes manuales con parser canónico (alias → módulos reales).
vi.mock("@/lib/caja/integridad", async () => await import("../../../lib/caja/integridad"));
vi.mock("@/lib/bolsa/integridad", async () => await import("../../../lib/bolsa/integridad"));
vi.mock("@/lib/bolsa/ajustes.service", async () => await import("../../../lib/bolsa/ajustes.service"));

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
  // MACRO 5: los ajustes corren en una tx con lock de la cartera (la tx delega en el mismo mock).
  mocks.prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(mocks.prisma));
  mocks.prisma.$queryRaw.mockResolvedValue([]);
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
    // valores que mostró el formulario (compare-and-set)
    f.set("saldoPesosAnterior", "50");
    f.set("saldoUSDCableAnterior", "0");
    f.set("saldoUSDMepAnterior", "0");
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
    mocks.prisma.cartera.findUnique.mockResolvedValue({ saldoPesos: "50", saldoUSDCable: "0", saldoUSDMep: "0" });
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
    f.set("confirmarAjuste", "on"); // M5-F02: ajuste explícito
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
    f.set("confirmarAjuste", "on"); // M5-F02: ajuste explícito
    return f;
  }

  it("sin sesión → rechazo, ninguna escritura Prisma ni auditoría", async () => {
    mocks.requireActionPermission.mockResolvedValue(SIN_SESION);
    const result = await editarPosicion(null, fd());
    expect(result).toEqual({ error: "Sin sesión activa" });
    expect(mocks.prisma.posicionCartera.update).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("usuario sin permiso 'bolsa:crear' → rechazo, ninguna escritura Prisma ni auditoría", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const result = await editarPosicion(null, fd());
    expect(result).toEqual({ error: DENEGADO.error });
    expect(mocks.prisma.posicionCartera.update).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("usuario autorizado → edita la posición y audita con el userId de la sesión gateada", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.prisma.posicionCartera.findUnique.mockResolvedValue({ carteraId: "cart-1" });
    mocks.prisma.posicionCartera.findUniqueOrThrow.mockResolvedValue({ cantidad: "10", precioCompra: "100", Activo: { ticker: "GGAL" } });
    mocks.prisma.posicionCartera.update.mockResolvedValue({ Activo: { ticker: "GGAL" } });
    const result = await editarPosicion(null, fd());
    expect(result).toEqual({ success: true });
    expect(mocks.prisma.posicionCartera.update).toHaveBeenCalledTimes(1);
    // M5-F02: el AuditLog AJUSTE_POSICION se escribe en la tx del ajuste, con el userId de la sesión gateada.
    expect(mocks.prisma.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: "user-1", accion: "AJUSTE_POSICION" }) });
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

// ── eliminarPosicion (MACRO 6: AJUSTE confirmado, audit en la misma tx) ─────

describe("eliminarPosicion — gate + ajuste confirmado (MACRO 6)", () => {
  function fd(confirmar = true) {
    const f = new FormData();
    f.set("posicionId", "pos-1");
    if (confirmar) f.set("confirmarAjuste", "on");
    return f;
  }
  function posicionExistente() {
    mocks.prisma.posicionCartera.findUnique
      .mockResolvedValueOnce({ carteraId: "cart-1" })
      .mockResolvedValueOnce({ cantidad: "10", precioCompra: "100", Activo: { ticker: "GGAL" } });
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

  it("autorizado SIN confirmarAjuste → DENY, nada escrito ni auditado", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await eliminarPosicion(null, fd(false));
    expect(result).toEqual({ error: expect.stringMatching(/ajuste \/ apertura sin movimiento de cash/) });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.prisma.posicionCartera.delete).not.toHaveBeenCalled();
    expect(mocks.prisma.auditLog.create).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("autorizado + confirmado → baja con lock, AuditLog AJUSTE_POSICION en la tx (antes → 0), cash intacto", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    posicionExistente();
    mocks.prisma.posicionCartera.delete.mockResolvedValue({});
    const result = await eliminarPosicion(null, fd());
    expect(result).toEqual({ success: true });
    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.posicionCartera.delete).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      userId: "user-1", accion: "AJUSTE_POSICION",
      datosPrevios: expect.objectContaining({ ticker: "GGAL", cantidad: "10", costo: "100" }),
      datosNuevos: expect.objectContaining({ cantidad: "0", description: expect.stringMatching(/sin cash/) }),
    }) });
    expect(mocks.prisma.cartera.update).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("si el AuditLog falla → error y la tx no se confirma (rollback)", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    posicionExistente();
    mocks.prisma.posicionCartera.delete.mockResolvedValue({});
    mocks.prisma.auditLog.create.mockRejectedValueOnce(new Error("audit down"));
    const result = await eliminarPosicion(null, fd());
    expect(result).toEqual({ error: "Error al eliminar la posición" });
  });
});

// ── asignarACustodia (MACRO 6: custodia fuera de la Beta) ────────────────────

describe("asignarACustodia — custodia bloqueada durante la Beta (MACRO 6)", () => {
  const BLOQUEADA = { error: "Las transferencias de activos a Custodia están temporalmente deshabilitadas durante la Beta." };
  function fd() {
    const f = new FormData();
    f.set("posicionId", "pos-1");
    f.set("clienteId", "cliente-1");
    f.set("cantidad", "5");
    return f;
  }

  it("ADMIN / usuario autorizado → DENY explícito, ninguna lectura ni escritura", async () => {
    mocks.requireActionPermission.mockResolvedValue(null);
    mocks.auth.mockResolvedValue({ user: { id: "user-1", name: "Admin" } });
    const result = await asignarACustodia(null, fd());
    expect(result).toEqual(BLOQUEADA);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("sin permiso → igual DENY por bloqueo", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const result = await asignarACustodia(null, fd());
    expect(result).toEqual(BLOQUEADA);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });
});
