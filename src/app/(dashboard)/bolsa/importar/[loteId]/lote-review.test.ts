import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  findUniqueFila: vi.fn(),
  updateFila: vi.fn(),
  updateManyFila: vi.fn(),
  findManyFila: vi.fn(),
  createFila: vi.fn(),
  aggregateFila: vi.fn(),
  findUniqueLote: vi.fn(),
  updateLote: vi.fn(),
  findUniqueArchivo: vi.fn(),
  createArchivo: vi.fn(),
  findUniqueComitente: vi.fn(),
  findManyComitente: vi.fn(),
  findUniqueCartera: vi.fn(),
  findManyCartera: vi.fn(),
  findUniqueUser: vi.fn(),
  createAuditLog: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bolsaImportFila: {
      findUnique: mocks.findUniqueFila,
      update: mocks.updateFila,
      updateMany: mocks.updateManyFila,
      findMany: mocks.findManyFila,
      create: mocks.createFila,
      aggregate: mocks.aggregateFila,
    },
    bolsaImportLote: {
      findUnique: mocks.findUniqueLote,
      update: mocks.updateLote,
    },
    bolsaImportArchivo: {
      findUnique: mocks.findUniqueArchivo,
      create: mocks.createArchivo,
    },
    comitenteInversion: {
      findUnique: mocks.findUniqueComitente,
      findMany: mocks.findManyComitente,
    },
    cartera: {
      findUnique: mocks.findUniqueCartera,
      findMany: mocks.findManyCartera,
    },
    user: {
      findUnique: mocks.findUniqueUser,
    },
    $transaction: mocks.transaction,
  },
}));

// Transitive dep: lote-review.ts → process-upload.ts → resolveComitente → parseBolsaExcel
vi.mock("@/lib/importers/bolsa-excel/parser", () => ({ parseBolsaExcel: vi.fn() }));

import {
  actualizarFila,
  excluirFila,
  restaurarFila,
  marcarDuplicadoLegitimo,
  agregarOperacionManual,
  enviarLoteAAugusto,
  computeBlockingErrors,
  esLoteEditable,
  getLoteReview,
} from "./lote-review";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeFila(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "fila-1",
    loteId: "lote-1",
    archivoId: "arch-1",
    estado: "ADVERTENCIA",
    numeroBloque: 1,
    numeroFila: 1,
    rawJson: {},
    nombreDetectado: "Juan Perez",
    nroComitenteDetectado: "12345",
    tipoOperacionDetectada: "COMPRA AL30",
    comitenteResueltoId: "com-1",
    carteraResueltaId: null,
    tipoSujeto: "COMITENTE",
    conflictoNombre: false,
    tipoOperacionResuelta: "COMPRA_BONO",
    ticker: "AL30",
    instrumento: null,
    moneda: "ARS",
    cantidad: { toString: () => "10000" },
    precio: { toString: () => "65.25" },
    montoNetoReferencia: null,
    fechaConcertacion: new Date("2026-07-14T00:00:00.000Z"),
    plazo: "48HS",
    fechaVencimiento: null,
    tasaCaucion: null,
    diasCaucion: null,
    montoCobrarReferencia: null,
    montoPagarReferencia: null,
    confianzaGeneral: null,
    confianzaPorCampoJson: null,
    erroresJson: null,
    warningsJson: null,
    camposCorregidosJson: null,
    corregidoPorId: null,
    confirmadoComoDuplicadoDistinto: false,
    grupoArbitrajeStaging: null,
    fingerprint: "fp-1",
    operacionBolsaId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeLote(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "lote-1",
    estado: "REVISION_PENDIENTE",
    origen: "EXCEL",
    fechaOperativa: new Date("2026-07-14T00:00:00.000Z"),
    creadoPorId: "user-1",
    validadoPorId: null,
    observacionValidacion: null,
    totalFilas: 1,
    filasListas: 0,
    filasConAdvertencia: 1,
    filasConError: 0,
    filasExcluidas: 0,
    filasConfirmadas: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function setupTx() {
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb({
      bolsaImportFila: {
        update: mocks.updateFila,
        updateMany: mocks.updateManyFila,
        create: mocks.createFila,
        findMany: mocks.findManyFila,
      },
      bolsaImportLote: { update: mocks.updateLote },
      auditLog: { create: mocks.createAuditLog },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setupTx();
  mocks.findManyFila.mockResolvedValue([{ estado: "LISTA" }]); // usado por recalcularContadoresLote
  mocks.updateFila.mockResolvedValue({});
  mocks.updateLote.mockResolvedValue({});
});

// ── computeBlockingErrors (pure) ───────────────────────────────────────────────

describe("computeBlockingErrors", () => {
  it("LR-1: sin comitente ni cartera es bloqueante", () => {
    const errors = computeBlockingErrors({
      comitenteResueltoId: null,
      carteraResueltaId: null,
      tipoOperacionResuelta: "COMPRA_BONO",
      ticker: "AL30",
      cantidad: "100",
      precio: "50",
      fechaConcertacion: "2026-07-14",
      tasaCaucion: null,
    });
    expect(errors).toContain("Sin comitente ni cartera asignado.");
  });

  it("LR-2: caución sin tasa es bloqueante, sin exigir ticker/precio", () => {
    const errors = computeBlockingErrors({
      comitenteResueltoId: "com-1",
      carteraResueltaId: null,
      tipoOperacionResuelta: "CAUCION_COLOCADORA",
      ticker: null,
      cantidad: "1000",
      precio: null,
      fechaConcertacion: "2026-07-14",
      tasaCaucion: null,
    });
    expect(errors).toContain("Tasa de caución faltante.");
    expect(errors).not.toContain("Ticker faltante.");
    expect(errors).not.toContain("Precio faltante.");
  });

  it("LR-3: fila completa y válida no tiene errores bloqueantes", () => {
    const errors = computeBlockingErrors({
      comitenteResueltoId: "com-1",
      carteraResueltaId: null,
      tipoOperacionResuelta: "COMPRA_BONO",
      ticker: "AL30",
      cantidad: "100",
      precio: "50",
      fechaConcertacion: "2026-07-14",
      tasaCaucion: null,
    });
    expect(errors).toHaveLength(0);
  });

  // ── E4.6C.3: recálculo de coherencia (nunca solo presencia de campos) ─────

  it("E4.6C.3-LR-1: cantidad×precio incoherente contra el monto neto de referencia es bloqueante aunque todos los campos estén presentes", () => {
    const errors = computeBlockingErrors({
      comitenteResueltoId: "com-1",
      carteraResueltaId: null,
      tipoOperacionResuelta: "COMPRA_BONO",
      ticker: "AL30",
      cantidad: "100",
      precio: "65.25",
      fechaConcertacion: "2026-07-14",
      tasaCaucion: null,
      montoNetoReferencia: "6525000", // 100x el monto real — magnitud incoherente
    });
    expect(errors).toContain("Cantidad no confiable.");
  });

  it("E4.6C.3-LR-2: principal de caución incoherente contra el monto a cobrar es bloqueante", () => {
    const errors = computeBlockingErrors({
      comitenteResueltoId: "com-1",
      carteraResueltaId: null,
      tipoOperacionResuelta: "CAUCION_COLOCADORA",
      ticker: null,
      cantidad: "402000",
      precio: null,
      fechaConcertacion: "2026-07-14",
      tasaCaucion: "50",
      montoCobrarReferencia: "87492602.86",
    });
    expect(errors.some((e) => /Principal no confiable/.test(e))).toBe(true);
  });

  it("E4.6C.3-LR-3: principal y monto a cobrar coherentes en caución no agregan error de coherencia", () => {
    const errors = computeBlockingErrors({
      comitenteResueltoId: "com-1",
      carteraResueltaId: null,
      tipoOperacionResuelta: "CAUCION_COLOCADORA",
      ticker: null,
      cantidad: "87440200",
      precio: null,
      fechaConcertacion: "2026-07-14",
      tasaCaucion: "50",
      montoCobrarReferencia: "87492602.86",
    });
    expect(errors.some((e) => /Principal no confiable/.test(e))).toBe(false);
  });
});

describe("esLoteEditable", () => {
  it("LR-4: REVISION_PENDIENTE y DEVUELTO son editables; EN_VALIDACION no", () => {
    expect(esLoteEditable("REVISION_PENDIENTE")).toBe(true);
    expect(esLoteEditable("DEVUELTO")).toBe(true);
    expect(esLoteEditable("EN_VALIDACION")).toBe(false);
    expect(esLoteEditable("CONFIRMADO")).toBe(false);
  });
});

// ── Propiedad del lote — solo el creador o ADMIN puede editar (E4.6 audit) ────

describe("propiedad del lote (creador o ADMIN)", () => {
  it("LR-34: un usuario que no creó el lote y no es ADMIN no puede editarlo", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote({ creadoPorId: "otro-user" }));
    mocks.findUniqueUser.mockResolvedValue({ role: "SOCIO" });

    const result = await actualizarFila("fila-1", "user-1", { ticker: "GD30" });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/permisos/i);
    expect(mocks.updateFila).not.toHaveBeenCalled();
  });

  it("LR-35: un ADMIN puede editar un lote que no creó", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote({ creadoPorId: "otro-user" }));
    mocks.findUniqueUser.mockResolvedValue({ role: "ADMIN" });

    const result = await actualizarFila("fila-1", "user-1", { ticker: "GD30" });

    expect(result.ok).toBe(true);
  });

  it("LR-36: el creador del lote no necesita consultar el rol para editar", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote({ creadoPorId: "user-1" }));

    const result = await actualizarFila("fila-1", "user-1", { ticker: "GD30" });

    expect(result.ok).toBe(true);
    expect(mocks.findUniqueUser).not.toHaveBeenCalled();
  });

  it("LR-37: la restricción de propiedad también aplica al envío a Augusto", async () => {
    mocks.findUniqueLote.mockResolvedValue(makeLote({ creadoPorId: "otro-user" }));
    mocks.findUniqueUser.mockResolvedValue({ role: "EMPLEADO" });

    const result = await enviarLoteAAugusto("lote-1", "user-1");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/permisos/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

// ── actualizarFila ──────────────────────────────────────────────────────────────

describe("actualizarFila", () => {
  it("LR-5: edición válida deja la fila en LISTA y limpia erroresJson", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila({ erroresJson: ["Fecha no detectada."] }));
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await actualizarFila("fila-1", "user-1", { ticker: "GD30" });

    expect(result.ok).toBe(true);
    const data = mocks.updateFila.mock.calls[0][0].data;
    expect(data.estado).toBe("LISTA");
    expect(data.erroresJson).toBe(Prisma.JsonNull);
    expect(data.ticker).toBe("GD30");
    expect(data.corregidoPorId).toBe("user-1");
  });

  it("LR-6: edición inválida (decimal fuera de rango) se rechaza sin tocar Prisma", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await actualizarFila("fila-1", "user-1", { tasaCaucion: "99999999" });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/tasa de caución/i);
    expect(mocks.updateFila).not.toHaveBeenCalled();
  });

  it("LR-7: valor numérico no parseable se rechaza", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await actualizarFila("fila-1", "user-1", { cantidad: "no-es-un-numero" });

    expect(result.ok).toBe(false);
    expect(mocks.updateFila).not.toHaveBeenCalled();
  });

  it("LR-8: cambio de comitente resuelve destino y actualiza nombreDetectado", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findUniqueComitente.mockResolvedValue({
      id: "com-2",
      nombre: "Maria Garcia",
      nroComitente: "67890",
      activo: true,
    });

    const result = await actualizarFila("fila-1", "user-1", {
      destinoTipo: "COMITENTE",
      destinoId: "com-2",
    });

    expect(result.ok).toBe(true);
    const data = mocks.updateFila.mock.calls[0][0].data;
    expect(data.comitenteResueltoId).toBe("com-2");
    expect(data.carteraResueltaId).toBeNull();
    expect(data.nombreDetectado).toBe("Maria Garcia");
    expect(data.nroComitenteDetectado).toBe("67890");
  });

  it("LR-9: comitente inactivo es rechazado", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findUniqueComitente.mockResolvedValue({ id: "com-2", nombre: "X", nroComitente: "1", activo: false });

    const result = await actualizarFila("fila-1", "user-1", { destinoTipo: "COMITENTE", destinoId: "com-2" });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/inactivo/i);
  });

  it("LR-9b: cartera inactiva es rechazada", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findUniqueCartera.mockResolvedValue({ id: "cart-2", nombre: "Cartera vieja", activa: false });

    const result = await actualizarFila("fila-1", "user-1", { destinoTipo: "CARTERA", destinoId: "cart-2" });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/inactiva/i);
    expect(mocks.updateFila).not.toHaveBeenCalled();
  });

  it("LR-9c: una fila con destino CARTERA nunca guarda comitenteResueltoId al mismo tiempo", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findUniqueCartera.mockResolvedValue({ id: "cart-1", nombre: "Cartera BYG", activa: true });

    await actualizarFila("fila-1", "user-1", { destinoTipo: "CARTERA", destinoId: "cart-1" });

    const data = mocks.updateFila.mock.calls[0][0].data;
    expect(data.carteraResueltaId).toBe("cart-1");
    expect(data.comitenteResueltoId).toBeNull();
    expect(data.tipoSujeto).toBe("CARTERA");
  });

  it("LR-10: lote no editable (EN_VALIDACION) rechaza la edición", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote({ estado: "EN_VALIDACION" }));

    const result = await actualizarFila("fila-1", "user-1", { ticker: "GD30" });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/estado editable/i);
    expect(mocks.updateFila).not.toHaveBeenCalled();
  });

  it("LR-11: fila excluida no se puede editar directamente", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila({ estado: "EXCLUIDA" }));
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await actualizarFila("fila-1", "user-1", { ticker: "GD30" });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/exclu/i);
  });

  it("LR-12: quitar el único dato requerido dispara error bloqueante y estado ERROR", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await actualizarFila("fila-1", "user-1", { destinoTipo: null, destinoId: null });

    expect(result.ok).toBe(true); // la mutación se guarda igual — el bloqueo es de estado, no de guardado
    const data = mocks.updateFila.mock.calls[0][0].data;
    expect(data.estado).toBe("ERROR");
    expect(data.erroresJson).toContain("Sin comitente ni cartera asignado.");
  });

  it("LR-13: campos no tocados por el patch conservan su valor existente", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    await actualizarFila("fila-1", "user-1", { ticker: "GD30" });

    const data = mocks.updateFila.mock.calls[0][0].data;
    expect(data.cantidad).toBeUndefined(); // no tocado → no se sobreescribe en Prisma
    expect(data.precio).toBeUndefined();
  });

  it("LR-14: recalcula contadores del lote tras la edición", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findManyFila.mockResolvedValue([{ estado: "LISTA" }, { estado: "ERROR" }, { estado: "EXCLUIDA" }]);

    await actualizarFila("fila-1", "user-1", { ticker: "GD30" });

    const loteData = mocks.updateLote.mock.calls[0][0].data;
    expect(loteData.totalFilas).toBe(3);
    expect(loteData.filasListas).toBe(1);
    expect(loteData.filasConError).toBe(1);
    expect(loteData.filasExcluidas).toBe(1);
  });
});

// ── E4.6C.3 punto 4: revisión — recálculo de coherencia al guardar ───────────

describe("actualizarFila — recálculo de coherencia (E4.6C.3)", () => {
  it("E4.6C.3-LR-4: corregir la cantidad a un valor coherente permite pasar a LISTA", async () => {
    mocks.findUniqueFila.mockResolvedValue(
      makeFila({
        ticker: "AL30",
        cantidad: null, // valor previamente descartado por incoherente
        precio: { toString: () => "65.25" },
        montoNetoReferencia: { toString: () => "6525" },
        erroresJson: ["Cantidad no confiable."],
        estado: "ERROR",
      }),
    );
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await actualizarFila("fila-1", "user-1", { cantidad: "100" });

    expect(result.ok).toBe(true);
    const data = mocks.updateFila.mock.calls[0][0].data;
    expect(data.estado).toBe("LISTA");
    expect(data.erroresJson).toBe(Prisma.JsonNull);
    expect(data.cantidad).toBe("100");
  });

  it("E4.6C.3-LR-5: guardar una fila elimina únicamente los errores realmente corregidos", async () => {
    mocks.findUniqueFila.mockResolvedValue(
      makeFila({
        ticker: null, // sin resolver — error independiente de la cantidad
        cantidad: null,
        precio: { toString: () => "65.25" },
        montoNetoReferencia: { toString: () => "6525" },
        erroresJson: ["Ticker faltante.", "Cantidad no confiable."],
        estado: "ERROR",
      }),
    );
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    // Solo se corrige la cantidad — el ticker sigue sin resolver.
    const result = await actualizarFila("fila-1", "user-1", { cantidad: "100" });

    expect(result.ok).toBe(true);
    const data = mocks.updateFila.mock.calls[0][0].data;
    expect(data.estado).toBe("ERROR");
    expect(data.erroresJson).toContain("Ticker faltante.");
    expect(data.erroresJson).not.toContain("Cantidad no confiable.");
  });

  it("E4.6C.3-LR-6: un valor descartado (null) nunca se restaura automáticamente al editar otro campo", async () => {
    mocks.findUniqueFila.mockResolvedValue(
      makeFila({
        ticker: null,
        cantidad: null, // descartado por OCR no confiable
        precio: { toString: () => "65.25" },
        erroresJson: ["Cantidad no confiable."],
        estado: "ERROR",
      }),
    );
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    // Se edita solo el ticker; la cantidad descartada no se toca en el patch.
    const result = await actualizarFila("fila-1", "user-1", { ticker: "GD30" });

    expect(result.ok).toBe(true);
    const data = mocks.updateFila.mock.calls[0][0].data;
    expect(data.cantidad).toBeUndefined(); // no tocado → Prisma no lo sobreescribe (sigue null en DB)
    expect(data.estado).toBe("ERROR");
    expect(data.erroresJson).toContain("Cantidad faltante.");
  });

  it("E4.6C.3-LR-7: caución — corregir el principal a un valor coherente con el monto a cobrar permite LISTA", async () => {
    mocks.findUniqueFila.mockResolvedValue(
      makeFila({
        tipoOperacionResuelta: "CAUCION_COLOCADORA",
        ticker: null,
        cantidad: null, // principal previamente descartado (402000 no confiable)
        precio: null,
        tasaCaucion: { toString: () => "50" },
        fechaVencimiento: new Date("2026-07-15T00:00:00.000Z"),
        montoCobrarReferencia: { toString: () => "87492602.86" },
        erroresJson: ["Principal no confiable: diferencia de magnitud frente al monto a cobrar/pagar."],
        estado: "ERROR",
      }),
    );
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await actualizarFila("fila-1", "user-1", { cantidad: "87440200" });

    expect(result.ok).toBe(true);
    const data = mocks.updateFila.mock.calls[0][0].data;
    expect(data.estado).toBe("LISTA");
    expect(data.erroresJson).toBe(Prisma.JsonNull);
  });
});

// ── Excluir / restaurar / duplicado legítimo ──────────────────────────────────

describe("excluirFila / restaurarFila", () => {
  it("LR-15: excluir marca EXCLUIDA y recalcula contadores", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await excluirFila("fila-1", "user-1");

    expect(result.ok).toBe(true);
    expect(mocks.updateFila.mock.calls[0][0].data.estado).toBe("EXCLUIDA");
    expect(mocks.updateLote).toHaveBeenCalledTimes(1);
  });

  it("LR-16: restaurar una fila no excluida falla", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila({ estado: "ADVERTENCIA" }));
    const result = await restaurarFila("fila-1", "user-1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no está exclu/i);
  });

  it("LR-17: restaurar una fila completa vuelve a ADVERTENCIA (requiere revisión de nuevo)", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila({ estado: "EXCLUIDA" }));
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await restaurarFila("fila-1", "user-1");

    expect(result.ok).toBe(true);
    expect(mocks.updateFila.mock.calls[0][0].data.estado).toBe("ADVERTENCIA");
  });

  it("LR-18: restaurar una fila incompleta vuelve a ERROR", async () => {
    mocks.findUniqueFila.mockResolvedValue(
      makeFila({ estado: "EXCLUIDA", comitenteResueltoId: null, carteraResueltaId: null }),
    );
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await restaurarFila("fila-1", "user-1");

    expect(result.ok).toBe(true);
    expect(mocks.updateFila.mock.calls[0][0].data.estado).toBe("ERROR");
  });
});

describe("marcarDuplicadoLegitimo", () => {
  it("LR-19: marca confirmadoComoDuplicadoDistinto=true", async () => {
    mocks.findUniqueFila.mockResolvedValue(makeFila());
    mocks.findUniqueLote.mockResolvedValue(makeLote());

    const result = await marcarDuplicadoLegitimo("fila-1", "user-1");

    expect(result.ok).toBe(true);
    expect(mocks.updateFila.mock.calls[0][0].data.confirmadoComoDuplicadoDistinto).toBe(true);
  });
});

// ── agregarOperacionManual ────────────────────────────────────────────────────

describe("agregarOperacionManual", () => {
  const baseInput = {
    destinoTipo: "COMITENTE" as const,
    destinoId: "com-1",
    tipoOperacionResuelta: "VENTA_ACCION" as const,
    ticker: "YPFD",
    cantidad: "100",
    precio: "12000",
    fechaConcertacion: "2026-07-14",
  };

  beforeEach(() => {
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findUniqueComitente.mockResolvedValue({
      id: "com-1",
      nombre: "Juan Perez",
      nroComitente: "12345",
      activo: true,
    });
    mocks.findUniqueArchivo.mockResolvedValue(null);
    mocks.createArchivo.mockResolvedValue({ id: "arch-manual-1" });
    mocks.aggregateFila.mockResolvedValue({ _max: { numeroFila: 5 } });
    mocks.createFila.mockResolvedValue({ id: "fila-manual-1" });
  });

  it("LR-20: agrega una operación faltante como fila LISTA, numerada después de la última", async () => {
    const result = await agregarOperacionManual("lote-1", "user-1", baseInput);

    expect(result.ok).toBe(true);
    const data = mocks.createFila.mock.calls[0][0].data;
    expect(data.estado).toBe("LISTA");
    expect(data.numeroFila).toBe(6);
    expect(data.comitenteResueltoId).toBe("com-1");
    expect(data.tipoOperacionDetectada).toBe("MANUAL");
    expect(data.corregidoPorId).toBe("user-1");
  });

  it("LR-21: reutiliza el archivo 'manual' si ya existe para el lote", async () => {
    mocks.findUniqueArchivo.mockResolvedValue({ id: "arch-manual-existente" });

    await agregarOperacionManual("lote-1", "user-1", baseInput);

    expect(mocks.createArchivo).not.toHaveBeenCalled();
    expect(mocks.createFila.mock.calls[0][0].data.archivoId).toBe("arch-manual-existente");
  });

  it("LR-21b: el hash del archivo manual es único por lote — no colisiona entre lotes distintos", async () => {
    mocks.findUniqueArchivo.mockResolvedValue(null); // ninguno de los dos lotes tiene archivo manual todavía
    mocks.createArchivo.mockResolvedValueOnce({ id: "arch-manual-lote-1" });
    mocks.createArchivo.mockResolvedValueOnce({ id: "arch-manual-lote-2" });

    await agregarOperacionManual("lote-1", "user-1", baseInput);
    mocks.findUniqueLote.mockResolvedValue(makeLote({ id: "lote-2" }));
    await agregarOperacionManual("lote-2", "user-1", baseInput);

    expect(mocks.createArchivo).toHaveBeenCalledTimes(2);
    const hash1 = mocks.createArchivo.mock.calls[0][0].data.fileHashSha256;
    const hash2 = mocks.createArchivo.mock.calls[1][0].data.fileHashSha256;
    expect(hash1).not.toBe(hash2);
  });

  it("LR-22: sin destino seleccionado devuelve error, sin crear la fila", async () => {
    const result = await agregarOperacionManual("lote-1", "user-1", {
      ...baseInput,
      destinoTipo: "" as never,
      destinoId: "",
    });
    expect(result.ok).toBe(false);
    expect(mocks.createFila).not.toHaveBeenCalled();
  });

  it("LR-23: fecha de concertación faltante/ inválida es rechazada", async () => {
    const result = await agregarOperacionManual("lote-1", "user-1", { ...baseInput, fechaConcertacion: "" });
    expect(result.ok).toBe(false);
    expect(mocks.createFila).not.toHaveBeenCalled();
  });

  it("LR-24: lote no editable rechaza el agregado manual", async () => {
    mocks.findUniqueLote.mockResolvedValue(makeLote({ estado: "EN_VALIDACION" }));
    const result = await agregarOperacionManual("lote-1", "user-1", baseInput);
    expect(result.ok).toBe(false);
    expect(mocks.createFila).not.toHaveBeenCalled();
  });
});

// ── enviarLoteAAugusto ─────────────────────────────────────────────────────────

describe("enviarLoteAAugusto", () => {
  it("LR-25: bloquea el envío si hay filas sin revisar", async () => {
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findManyFila.mockResolvedValue([makeFila({ estado: "ADVERTENCIA" })]);

    const result = await enviarLoteAAugusto("lote-1", "user-1");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/sin revisar/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("LR-26: bloquea el envío si hay duplicados sin resolver", async () => {
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findManyFila.mockResolvedValue([
      makeFila({ id: "f1", estado: "LISTA", fingerprint: "dup", confirmadoComoDuplicadoDistinto: false }),
      makeFila({ id: "f2", estado: "LISTA", fingerprint: "dup", confirmadoComoDuplicadoDistinto: false }),
    ]);

    const result = await enviarLoteAAugusto("lote-1", "user-1");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/duplicad/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("LR-27: permite el envío si AMBOS duplicados fueron confirmados como legítimos", async () => {
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findManyFila.mockResolvedValue([
      makeFila({ id: "f1", estado: "LISTA", fingerprint: "dup", confirmadoComoDuplicadoDistinto: true }),
      makeFila({ id: "f2", estado: "LISTA", fingerprint: "dup", confirmadoComoDuplicadoDistinto: true }),
    ]);

    const result = await enviarLoteAAugusto("lote-1", "user-1");

    expect(result.ok).toBe(true);
  });

  it("LR-28: envío correcto marca filas ENVIADA, lote EN_VALIDACION y registra auditoría", async () => {
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findManyFila.mockResolvedValue([
      makeFila({ id: "f1", estado: "LISTA", fingerprint: "fp-a" }),
      makeFila({ id: "f2", estado: "LISTA", fingerprint: "fp-b" }),
    ]);

    const result = await enviarLoteAAugusto("lote-1", "user-1");

    expect(result.ok).toBe(true);
    expect(result.totalEnviadas).toBe(2);
    expect(mocks.updateManyFila).toHaveBeenCalledWith(
      expect.objectContaining({ where: { loteId: "lote-1", estado: "LISTA" }, data: expect.objectContaining({ estado: "ENVIADA" }) }),
    );
    expect(mocks.updateLote).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: "EN_VALIDACION" }) }),
    );
    // El auditLog se crea DENTRO de la misma $transaction que las filas y el lote.
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accion: "LOTE_ENVIADO_VALIDACION", entidadId: "lote-1" }),
      }),
    );
  });

  it("LR-29: lote ya en EN_VALIDACION no admite un segundo envío", async () => {
    mocks.findUniqueLote.mockResolvedValue(makeLote({ estado: "EN_VALIDACION" }));

    const result = await enviarLoteAAugusto("lote-1", "user-1");

    expect(result.ok).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("LR-30: no hay operaciones activas (todas excluidas) → error", async () => {
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findManyFila.mockResolvedValue([makeFila({ estado: "EXCLUIDA" })]);

    const result = await enviarLoteAAugusto("lote-1", "user-1");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no hay operaciones/i);
  });

  it("LR-31: nunca se crea ninguna OperacionBolsa durante el envío", async () => {
    mocks.findUniqueLote.mockResolvedValue(makeLote());
    mocks.findManyFila.mockResolvedValue([makeFila({ estado: "LISTA" })]);

    await enviarLoteAAugusto("lote-1", "user-1");

    // El mock de prisma nunca expuso operacionBolsa — si el código lo tocara, tiraría.
    expect(mocks.updateManyFila).toHaveBeenCalled();
  });
});

// ── getLoteReview ──────────────────────────────────────────────────────────────

describe("getLoteReview", () => {
  it("LR-32: devuelve null si el lote no existe", async () => {
    mocks.findUniqueLote.mockResolvedValue(null);
    const result = await getLoteReview("lote-x");
    expect(result).toBeNull();
  });

  it("LR-33: devuelve lote, filas y listas de comitentes/carteras activos", async () => {
    mocks.findUniqueLote.mockResolvedValue({ ...makeLote(), Filas: [makeFila()] });
    mocks.findManyComitente.mockResolvedValue([{ id: "com-1", nombre: "Juan Perez", nroComitente: "12345" }]);
    mocks.findManyCartera.mockResolvedValue([{ id: "cart-1", nombre: "Cartera BYG" }]);

    const result = await getLoteReview("lote-1");

    expect(result).not.toBeNull();
    expect(result?.lote.Filas).toHaveLength(1);
    expect(result?.comitentes).toHaveLength(1);
    expect(result?.carteras).toHaveLength(1);
    expect(mocks.findManyComitente).toHaveBeenCalledWith(expect.objectContaining({ where: { activo: true } }));
  });
});
