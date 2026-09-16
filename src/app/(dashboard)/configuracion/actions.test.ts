import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
// SEC-CONFIG: estas pruebas verifican exclusivamente el gate de autorización
// agregado a las 10 funciones antes vulnerables. No reimplementan la lógica
// funcional completa de cada una — solo lo mínimo para probar que, autorizado,
// el comportamiento previo sigue intacto.

const mocks = vi.hoisted(() => ({
  requireActionPermission: vi.fn(),
  auth: vi.fn(),
  writeAuditLog: vi.fn(),
  prisma: {
    cartera: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    activo: { findUnique: vi.fn(), create: vi.fn() },
    socioPorcentaje: { update: vi.fn() },
  },
  config: {
    setTCBlue: vi.fn(),
    setTCMep: vi.fn(),
    updatePrecioActivo: vi.fn(),
    updatePreciosActivosBatch: vi.fn(),
    getProductoresConfig: vi.fn(),
    getAlycConfig: vi.fn(),
    updateAlycConfig: vi.fn(),
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

vi.mock("@/lib/services/config.service", () => ({
  setTCBlue: mocks.config.setTCBlue,
  setTCMep: mocks.config.setTCMep,
  updatePrecioActivo: mocks.config.updatePrecioActivo,
  updatePreciosActivosBatch: mocks.config.updatePreciosActivosBatch,
  getProductoresConfig: mocks.config.getProductoresConfig,
  getAlycConfig: mocks.config.getAlycConfig,
  updateAlycConfig: mocks.config.updateAlycConfig,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  updateTCBlue,
  updateTCMep,
  updatePrecioActivo,
  updatePreciosActivosBatch,
  updateSociosPorcentaje,
  createCartera,
  updatePreciosTickerBatch,
  updateCartera,
  createActivo,
  importPreciosExcel,
} from "./actions";

const DENEGADO = { error: "No tenés permisos para realizar esta acción." };
const SIN_SESION = { error: "Sin sesión activa" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireActionPermission.mockResolvedValue(null); // autorizado por defecto
  mocks.auth.mockResolvedValue({ user: { id: "user-1", name: "Tester" } });
});

// ════════════════════════════════════════════════════════════════════════════
// A. GATE — las 10 funciones antes vulnerables
// ════════════════════════════════════════════════════════════════════════════

describe("SEC-CONFIG — gate agregado, denegado → 0 escrituras (las 10 funciones)", () => {
  it("updateTCBlue: denegado → error, setTCBlue no se llama", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.set("valor", "1200");

    const result = await updateTCBlue({}, fd);

    expect(result).toEqual(DENEGADO);
    expect(mocks.requireActionPermission).toHaveBeenCalledWith("configuracion:editar");
    expect(mocks.config.setTCBlue).not.toHaveBeenCalled();
  });

  it("updateTCMep: denegado → error, setTCMep no se llama", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.set("valor", "1150");

    const result = await updateTCMep({}, fd);

    expect(result).toEqual(DENEGADO);
    expect(mocks.config.setTCMep).not.toHaveBeenCalled();
  });

  it("updatePrecioActivo: denegado → error, ni auth() ni el servicio se llaman", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.set("activoId", "act-1");
    fd.set("precioActual", "100");

    const result = await updatePrecioActivo({}, fd);

    expect(result).toEqual(DENEGADO);
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.config.updatePrecioActivo).not.toHaveBeenCalled();
  });

  it("updatePreciosActivosBatch: denegado → error, ni auth() ni el servicio se llaman", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.append("activoId", "act-1");
    fd.append("precioActual", "100");

    const result = await updatePreciosActivosBatch({}, fd);

    expect(result).toEqual(DENEGADO);
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.config.updatePreciosActivosBatch).not.toHaveBeenCalled();
  });

  it("updateSociosPorcentaje: denegado → error, prisma.socioPorcentaje.update no se llama", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.append("socioId", "s1");
    fd.append("porcentaje", "100");

    const result = await updateSociosPorcentaje(null, fd);

    expect(result).toEqual(DENEGADO);
    expect(mocks.prisma.socioPorcentaje.update).not.toHaveBeenCalled();
  });

  it("createCartera: denegado → error, prisma.cartera.create no se llama", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.set("nombre", "Cartera X");
    fd.set("slug", "cartera-x");

    const result = await createCartera({}, fd);

    expect(result).toEqual(DENEGADO);
    expect(mocks.prisma.cartera.create).not.toHaveBeenCalled();
    expect(mocks.prisma.cartera.findFirst).not.toHaveBeenCalled();
    expect(mocks.prisma.cartera.findUnique).not.toHaveBeenCalled();
  });

  it("updatePreciosTickerBatch: denegado → error, ni prisma.activo ni el servicio se llaman", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.set("batch", "GGAL=1000");

    const result = await updatePreciosTickerBatch({}, fd);

    expect(result).toEqual(DENEGADO);
    expect(mocks.prisma.activo.findUnique).not.toHaveBeenCalled();
    expect(mocks.config.updatePrecioActivo).not.toHaveBeenCalled();
  });

  it("updateCartera: denegado → error, prisma.cartera.update no se llama", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.set("id", "cart-1");
    fd.set("nombre", "Cartera Y");
    fd.set("slug", "cartera-y");

    const result = await updateCartera({}, fd);

    expect(result).toEqual(DENEGADO);
    expect(mocks.prisma.cartera.update).not.toHaveBeenCalled();
    expect(mocks.prisma.cartera.findFirst).not.toHaveBeenCalled();
  });

  it("createActivo: denegado → error, prisma.activo.create no se llama", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.set("ticker", "GGAL");
    fd.set("categoria", "ACCION_ARS");

    const result = await createActivo({}, fd);

    expect(result).toEqual(DENEGADO);
    expect(mocks.prisma.activo.create).not.toHaveBeenCalled();
    expect(mocks.prisma.activo.findUnique).not.toHaveBeenCalled();
  });

  it("importPreciosExcel: denegado → error, ninguna escritura Prisma/servicio", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.set("csv", "ticker;precioActual\nGGAL;1000");

    const result = await importPreciosExcel({}, fd);

    expect(result).toEqual(DENEGADO);
    expect(mocks.prisma.activo.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.activo.create).not.toHaveBeenCalled();
    expect(mocks.config.updatePrecioActivo).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// B. Familias de mutación — el gate no rompe el comportamiento autorizado
// ════════════════════════════════════════════════════════════════════════════

describe("SEC-CONFIG — autorizado, comportamiento existente intacto", () => {
  it("TIPO DE CAMBIO — updateTCBlue autorizado ejecuta setTCBlue con el valor parseado", async () => {
    const fd = new FormData();
    fd.set("valor", "1234,56");

    const result = await updateTCBlue({}, fd);

    expect(result).toEqual({ ok: true });
    expect(mocks.config.setTCBlue).toHaveBeenCalledWith(1234.56);
  });

  it("PRECIOS (individual) — updatePrecioActivo autorizado llama al servicio con activoId/precio/userId", async () => {
    mocks.config.updatePrecioActivo.mockResolvedValue(undefined);
    const fd = new FormData();
    fd.set("activoId", "act-1");
    fd.set("precioActual", "1500.5");

    const result = await updatePrecioActivo({}, fd);

    expect(result).toEqual({ ok: true });
    expect(mocks.config.updatePrecioActivo).toHaveBeenCalledWith("act-1", 1500.5, "user-1");
  });

  it("PRECIOS (batch) — updatePreciosActivosBatch autorizado llama al servicio con la lista completa", async () => {
    mocks.config.updatePreciosActivosBatch.mockResolvedValue(undefined);
    const fd = new FormData();
    fd.append("activoId", "act-1");
    fd.append("precioActual", "100");
    fd.append("activoId", "act-2");
    fd.append("precioActual", "200");

    const result = await updatePreciosActivosBatch({}, fd);

    expect(result).toEqual({ ok: true, count: 2 });
    expect(mocks.config.updatePreciosActivosBatch).toHaveBeenCalledWith(
      [{ id: "act-1", precio: 100 }, { id: "act-2", precio: 200 }],
      "user-1",
    );
  });

  it("SOCIOS — updateSociosPorcentaje autorizado actualiza cuando la suma da 100%", async () => {
    mocks.prisma.socioPorcentaje.update.mockResolvedValue({});
    const fd = new FormData();
    fd.append("socioId", "s1");
    fd.append("porcentaje", "60");
    fd.append("socioId", "s2");
    fd.append("porcentaje", "40");

    const result = await updateSociosPorcentaje(null, fd);

    expect(result).toEqual({ ok: true });
    expect(mocks.prisma.socioPorcentaje.update).toHaveBeenCalledTimes(2);
  });

  it("CARTERA — createCartera autorizado crea cuando el slug no existe", async () => {
    mocks.prisma.cartera.findUnique.mockResolvedValue(null);
    mocks.prisma.cartera.create.mockResolvedValue({});
    const fd = new FormData();
    fd.set("nombre", "Cartera Nueva");
    fd.set("slug", "cartera-nueva");

    const result = await createCartera({}, fd);

    expect(result).toEqual({ ok: true });
    expect(mocks.prisma.cartera.create).toHaveBeenCalledTimes(1);
  });

  it("ACTIVOS — createActivo autorizado crea cuando el ticker no existe", async () => {
    mocks.prisma.activo.findUnique.mockResolvedValue(null);
    mocks.prisma.activo.create.mockResolvedValue({});
    const fd = new FormData();
    fd.set("ticker", "GGAL");
    fd.set("categoria", "ACCION_ARS");

    const result = await createActivo({}, fd);

    expect(result).toEqual({ ok: true });
    expect(mocks.prisma.activo.create).toHaveBeenCalledTimes(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// C. No autenticado
// ════════════════════════════════════════════════════════════════════════════

describe("SEC-CONFIG — sin sesión activa", () => {
  it("updateTCBlue: sin sesión → error 'Sin sesión activa', 0 escrituras", async () => {
    mocks.requireActionPermission.mockResolvedValue(SIN_SESION);
    const fd = new FormData();
    fd.set("valor", "1200");

    const result = await updateTCBlue({}, fd);

    expect(result).toEqual(SIN_SESION);
    expect(mocks.config.setTCBlue).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// D. Orden del gate — auth() de atribución no debe ejecutarse si el gate corta
// ════════════════════════════════════════════════════════════════════════════

describe("SEC-CONFIG — el gate corta antes que auth() de atribución", () => {
  it("updatePrecioActivo: requireActionPermission se resuelve antes que auth()", async () => {
    const order: string[] = [];
    mocks.requireActionPermission.mockImplementation(async () => {
      order.push("gate");
      return null;
    });
    mocks.auth.mockImplementation(async () => {
      order.push("auth");
      return { user: { id: "user-1" } };
    });
    mocks.config.updatePrecioActivo.mockResolvedValue(undefined);

    const fd = new FormData();
    fd.set("activoId", "act-1");
    fd.set("precioActual", "100");

    await updatePrecioActivo({}, fd);

    expect(order).toEqual(["gate", "auth"]);
  });

  it("updatePreciosActivosBatch: si el gate deniega, auth() de atribución nunca se ejecuta", async () => {
    mocks.requireActionPermission.mockResolvedValue(DENEGADO);
    const fd = new FormData();
    fd.append("activoId", "act-1");
    fd.append("precioActual", "100");

    await updatePreciosActivosBatch({}, fd);

    expect(mocks.auth).not.toHaveBeenCalled();
  });
});
