import { describe, it, expect, beforeEach, vi } from "vitest";
import type { BolsaExcelBloque, BolsaExcelParseResult, BolsaExcelRawOp } from "@/lib/importers/bolsa-excel/types";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
// vi.hoisted permite referenciar los mocks desde los factories de vi.mock

const mocks = vi.hoisted(() => ({
  parseBolsaExcel: vi.fn(),
  findUniqueArchivo: vi.fn(),
  findUniqueLote: vi.fn(),
  findUniqueUser: vi.fn(),
  findManyComitente: vi.fn(),
  findManyCartera: vi.fn(),
  transaction: vi.fn(),
  createLote: vi.fn(),
  updateLote: vi.fn(),
  createArchivo: vi.fn(),
  updateArchivo: vi.fn(),
  createFila: vi.fn(),
  deleteManyFila: vi.fn(),
  findManyFila: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock("@/lib/importers/bolsa-excel/parser", () => ({
  parseBolsaExcel: mocks.parseBolsaExcel,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bolsaImportArchivo: { findUnique: mocks.findUniqueArchivo, update: mocks.updateArchivo },
    bolsaImportLote: { findUnique: mocks.findUniqueLote },
    bolsaImportFila: { deleteMany: mocks.deleteManyFila, findMany: mocks.findManyFila },
    user: { findUnique: mocks.findUniqueUser },
    comitenteInversion: { findMany: mocks.findManyComitente },
    cartera: { findMany: mocks.findManyCartera },
    $transaction: mocks.transaction,
  },
}));

import {
  processBolsaExcelUpload,
  resolveTickerAgainstCatalog,
  checkCantidadCoherence,
  checkCaucionPrincipalCoherence,
} from "./process-upload";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeXlsxFile(name = "ops.xlsx", size = 1024): File {
  const buf = Buffer.alloc(size, 0x50);
  return new File([buf], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function makeFormData(
  file: File,
  fechaOperativa: string | null = "2026-07-14",
  extra?: Record<string, string>,
): FormData {
  const fd = new FormData();
  fd.set("file", file);
  if (fechaOperativa !== null) fd.set("fechaOperativa", fechaOperativa);
  for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v);
  return fd;
}

function emptyParseResult(overrides: Partial<BolsaExcelParseResult> = {}): BolsaExcelParseResult {
  return {
    hojaProceada: "Hoja1",
    hojasNoVacias: 1,
    bloques: [],
    operaciones: [],
    warningsGlobales: [],
    erroresGlobales: [],
    estadisticas: {
      totalBloques: 0,
      totalOperaciones: 0,
      totalCompras: 0,
      totalVentas: 0,
      totalCauciones: 0,
      totalDesconocidas: 0,
      totalWarnings: 0,
      totalErrors: 0,
      bloquesSinComitente: 0,
      operacionesSinComitente: 0,
    },
    ...overrides,
  };
}

function makeRawOp(overrides: Partial<BolsaExcelRawOp> = {}): BolsaExcelRawOp {
  return {
    numeroFila: 1,
    rawCells: {},
    rawOperacion: "COMPRA",
    operacionBase: "COMPRA",
    fechaConcertacion: "2026-07-14",
    ticker: "GD30",
    cantidad: "100",
    precio: "45.00",
    monedaDetectada: "USD",
    monedaEsInferencia: false,
    montoNetoReferencia: "4500.00",
    plazo: "CI",
    plazoNormalizado: "CI",
    fechaVencimiento: null,
    tasaCaucion: null,
    montoCobrarReferencia: null,
    montoPagarReferencia: null,
    instrumentoHint: null,
    warnings: [],
    errors: [],
    ...overrides,
  };
}

function makeBloque(overrides: Partial<BolsaExcelBloque> = {}): BolsaExcelBloque {
  return {
    numeroBloque: 1,
    filaInicio: 1,
    filaFin: 5,
    nombreDetectado: "GARCIA JUAN",
    nroComitenteDetectado: "12345",
    encabezadosDetectados: ["operacion", "ticker", "cantidad", "precio"],
    columnMapping: {},
    operaciones: [],
    warnings: [],
    errors: [],
    ...overrides,
  };
}

const COMITENTE_UNO = {
  id: "com-1",
  nombre: "GARCIA JUAN",
  esPropioBYG: false,
  carteraId: null,
};

// ── Default setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Sin duplicado por defecto
  mocks.findUniqueArchivo.mockResolvedValue(null);
  mocks.findUniqueLote.mockResolvedValue(null);
  // Sin comitentes por defecto
  mocks.findManyComitente.mockResolvedValue([]);
  // Sin carteras propias por defecto
  mocks.findManyCartera.mockResolvedValue([]);
  // Parser vacío por defecto
  mocks.parseBolsaExcel.mockReturnValue(emptyParseResult());

  // Retornos de los creates dentro de la transacción
  mocks.createLote.mockResolvedValue({ id: "lote-1", createdAt: new Date() });
  mocks.createArchivo.mockResolvedValue({ id: "arch-1", loteId: "lote-1", createdAt: new Date() });
  mocks.updateArchivo.mockResolvedValue({ id: "arch-1", loteId: "lote-1" });
  mocks.createFila.mockResolvedValue({});
  mocks.deleteManyFila.mockResolvedValue({ count: 0 });
  mocks.findManyFila.mockResolvedValue([]);

  // La transacción llama al callback con un tx mock
  mocks.transaction.mockImplementation(
    async (callback: (tx: {
      bolsaImportLote: { create: typeof mocks.createLote; update: typeof mocks.updateLote };
      bolsaImportArchivo: { create: typeof mocks.createArchivo; update: typeof mocks.updateArchivo };
      bolsaImportFila: {
        create: typeof mocks.createFila;
        deleteMany: typeof mocks.deleteManyFila;
        findMany: typeof mocks.findManyFila;
      };
      auditLog: { create: typeof mocks.createAuditLog };
    }) => Promise<unknown>) => {
      return callback({
        bolsaImportLote: { create: mocks.createLote, update: mocks.updateLote },
        bolsaImportArchivo: { create: mocks.createArchivo, update: mocks.updateArchivo },
        bolsaImportFila: { create: mocks.createFila, deleteMany: mocks.deleteManyFila, findMany: mocks.findManyFila },
        auditLog: { create: mocks.createAuditLog },
      });
    },
  );
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("processBolsaExcelUpload — validación de archivo", () => {
  it("T-U1 — extensión .pdf rechazada sin tocar la DB", async () => {
    const file = makeXlsxFile("reporte.pdf");
    const result = await processBolsaExcelUpload(makeFormData(file), "user-1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/\.xlsx/i);
    expect(mocks.findUniqueArchivo).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("T-U2 — archivo vacío (size=0) rechazado", async () => {
    const file = makeXlsxFile("ops.xlsx", 0);
    const result = await processBolsaExcelUpload(makeFormData(file), "user-1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/archivo/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("T-U3 — archivo > 5 MB rechazado", async () => {
    const file = makeXlsxFile("ops.xlsx", 5 * 1024 * 1024 + 1);
    const result = await processBolsaExcelUpload(makeFormData(file), "user-1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/5 MB/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("processBolsaExcelUpload — deduplicación SHA-256", () => {
  it("T-U4a — hash duplicado LISTO devuelve DUPLICADO con estadoArchivo=LISTO, sin crear lote", async () => {
    const existingDate = new Date("2026-07-10T10:00:00Z");
    mocks.findUniqueArchivo.mockResolvedValue({
      id: "arch-viejo",
      loteId: "lote-viejo",
      estado: "LISTO",
      createdAt: existingDate,
    });

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.ok).toBe(true);
    expect(result.estado).toBe("DUPLICADO");
    expect(result.loteId).toBe("lote-viejo");
    expect(result.archivoExistente?.loteId).toBe("lote-viejo");
    expect(result.archivoExistente?.estadoArchivo).toBe("LISTO");
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.parseBolsaExcel).not.toHaveBeenCalled();
  });

  it("T-U4b — hash duplicado ERROR devuelve DUPLICADO con estadoArchivo=ERROR, sin crear segundo lote", async () => {
    const existingDate = new Date("2026-07-10T08:00:00Z");
    mocks.findUniqueArchivo.mockResolvedValue({
      id: "arch-fallido",
      loteId: "lote-fallido",
      estado: "ERROR",
      createdAt: existingDate,
    });

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.ok).toBe(true);
    expect(result.estado).toBe("DUPLICADO");
    expect(result.loteId).toBe("lote-fallido");
    expect(result.archivoExistente?.estadoArchivo).toBe("ERROR");
    // No se crea ningún lote nuevo
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.parseBolsaExcel).not.toHaveBeenCalled();
  });

  it("T-U5 — race condition P2002 en transacción → DUPLICADO", async () => {
    const existingDate = new Date("2026-07-10T10:00:00Z");
    // Primera llamada: sin duplicado (pasa el check inicial)
    // Segunda llamada: devuelve el registro ya creado por la race
    mocks.findUniqueArchivo
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "arch-race", loteId: "lote-race", createdAt: existingDate });

    const p2002 = Object.assign(new Error("Unique constraint failed on `fileHashSha256`"), {
      code: "P2002",
    });
    mocks.transaction.mockRejectedValueOnce(p2002);

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.ok).toBe(true);
    expect(result.estado).toBe("DUPLICADO");
    expect(result.loteId).toBe("lote-race");
    // La segunda findUnique fue llamada para recuperar el registro existente
    expect(mocks.findUniqueArchivo).toHaveBeenCalledTimes(2);
  });
});

// ── Reanálisis de un archivo duplicado (E4.6A) ────────────────────────────────

describe("processBolsaExcelUpload — reanálisis de duplicados", () => {
  const ARCHIVO_EXISTENTE = {
    id: "arch-viejo",
    loteId: "lote-viejo",
    createdAt: new Date("2026-07-10T10:00:00Z"),
    estado: "LISTO",
  };

  it("T-U16 — duplicado sin reanalizar=true nunca toca el parser ni la transacción", async () => {
    mocks.findUniqueArchivo.mockResolvedValue(ARCHIVO_EXISTENTE);
    mocks.findUniqueLote.mockResolvedValue({ id: "lote-viejo", estado: "REVISION_PENDIENTE", creadoPorId: "user-1" });

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.estado).toBe("DUPLICADO");
    expect(result.archivoExistente?.reanalizable).toBe(true);
    expect(mocks.parseBolsaExcel).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("T-U17 — reanalizar=true en un lote REVISION_PENDIENTE reemplaza filas en una sola transacción", async () => {
    mocks.findUniqueArchivo.mockResolvedValue(ARCHIVO_EXISTENTE);
    mocks.findUniqueLote.mockResolvedValue({ id: "lote-viejo", estado: "REVISION_PENDIENTE", creadoPorId: "user-1" });
    mocks.findManyComitente.mockResolvedValue([COMITENTE_UNO]);
    const bloque = makeBloque({ operaciones: [makeRawOp()] });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(
      makeFormData(makeXlsxFile(), "2026-07-14", { reanalizar: "true" }),
      "user-1",
    );

    expect(result.ok).toBe(true);
    expect(result.estado).toBe("REVISION_PENDIENTE");
    expect(result.loteId).toBe("lote-viejo");
    expect(result.archivoId).toBe("arch-viejo");
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.deleteManyFila).toHaveBeenCalledWith({ where: { archivoId: "arch-viejo" } });
    expect(mocks.updateArchivo).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "arch-viejo" } }),
    );
    expect(mocks.createFila).toHaveBeenCalledTimes(1);
    expect(mocks.updateLote).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "REVISION_PENDIENTE", fechaOperativa: new Date("2026-07-14T00:00:00.000Z") }),
      }),
    );
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accion: "LOTE_REANALIZADO" }) }),
    );
  });

  it("T-U18 — reanalizar=true en un lote EN_VALIDACION es rechazado, nunca reemplaza filas", async () => {
    mocks.findUniqueArchivo.mockResolvedValue(ARCHIVO_EXISTENTE);
    mocks.findUniqueLote.mockResolvedValue({ id: "lote-viejo", estado: "EN_VALIDACION", creadoPorId: "user-1" });

    const result = await processBolsaExcelUpload(
      makeFormData(makeXlsxFile(), "2026-07-14", { reanalizar: "true" }),
      "user-1",
    );

    expect(result.estado).toBe("DUPLICADO");
    expect(result.archivoExistente?.reanalizable).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.deleteManyFila).not.toHaveBeenCalled();
  });

  it("T-U19 — reanalizar=true por un usuario que no creó el lote y no es ADMIN es rechazado", async () => {
    mocks.findUniqueArchivo.mockResolvedValue(ARCHIVO_EXISTENTE);
    mocks.findUniqueLote.mockResolvedValue({ id: "lote-viejo", estado: "REVISION_PENDIENTE", creadoPorId: "otro-user" });
    mocks.findUniqueUser.mockResolvedValue({ role: "SOCIO" });

    const result = await processBolsaExcelUpload(
      makeFormData(makeXlsxFile(), "2026-07-14", { reanalizar: "true" }),
      "user-1",
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/permisos/i);
    expect(mocks.deleteManyFila).not.toHaveBeenCalled();
  });
});

describe("processBolsaExcelUpload — parser fatal", () => {
  it("T-U6 — parser lanza excepción → FALLIDO lote + ERROR archivo, sin filas", async () => {
    mocks.parseBolsaExcel.mockImplementation(() => {
      throw new Error("Hoja vacía o formato no reconocido");
    });

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.ok).toBe(false);
    expect(result.estado).toBe("FALLIDO");
    expect(result.error).toMatch(/hoja vacía/i);

    // Se creó el lote FALLIDO
    expect(mocks.createLote).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "FALLIDO", origen: "EXCEL" }),
      }),
    );
    // Se creó el archivo ERROR
    expect(mocks.createArchivo).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "ERROR" }),
      }),
    );
    // No se crearon filas
    expect(mocks.createFila).not.toHaveBeenCalled();
  });
});

describe("processBolsaExcelUpload — resolución de comitentes", () => {
  it("T-U7 — comitente inexistente → fila ERROR", async () => {
    mocks.findManyComitente.mockResolvedValue([]); // 0 matches
    const bloque = makeBloque({ operaciones: [makeRawOp()] });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.ok).toBe(true);
    expect(result.estado).toBe("REVISION_PENDIENTE");
    expect(result.filasConError).toBe(1);
    expect(result.filasResuelta).toBe(0);

    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "ERROR",
          comitenteResueltoId: undefined,
        }),
      }),
    );
  });

  // ── Resolución de cartera propia (E4.6A — DANIEL/11538 en Banco Industrial) ─

  it("T-U7b — sin comitente pero con cartera propia por comitenteNumber → CARTERA resuelta, nunca COMITENTE", async () => {
    mocks.findManyComitente.mockResolvedValue([]); // no es cliente/comitente normal
    mocks.findManyCartera.mockResolvedValue([{ id: "cart-daniel", nombre: "Daniel" }]);
    const bloque = makeBloque({
      nombreDetectado: "DANIEL",
      nroComitenteDetectado: "11538",
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasResuelta).toBe(1);
    expect(result.filasConError).toBe(0);
    expect(mocks.findManyCartera).toHaveBeenCalledWith(
      expect.objectContaining({ where: { comitenteNumber: "11538", activa: true } }),
    );
    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "RESUELTA",
          tipoSujeto: "CARTERA",
          carteraResueltaId: "cart-daniel",
          comitenteResueltoId: undefined,
        }),
      }),
    );
  });

  it("T-U7c — un comitente normal con ese número tiene prioridad sobre una cartera propia homónima", async () => {
    mocks.findManyComitente.mockResolvedValue([COMITENTE_UNO]);
    mocks.findManyCartera.mockResolvedValue([{ id: "cart-x", nombre: "GARCIA JUAN" }]);
    const bloque = makeBloque({ operaciones: [makeRawOp()] });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasResuelta).toBe(1);
    expect(mocks.findManyCartera).not.toHaveBeenCalled();
    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipoSujeto: "COMITENTE", comitenteResueltoId: "com-1" }),
      }),
    );
  });

  it("T-U7d — cartera propia inactiva no se resuelve (fila ERROR)", async () => {
    mocks.findManyComitente.mockResolvedValue([]);
    mocks.findManyCartera.mockResolvedValue([]); // activa:true en el where → una inactiva no aparece
    const bloque = makeBloque({ operaciones: [makeRawOp()] });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasConError).toBe(1);
  });

  it("T-U7e — número de comitente ambiguo entre varias carteras propias → fila ERROR", async () => {
    mocks.findManyComitente.mockResolvedValue([]);
    mocks.findManyCartera.mockResolvedValue([
      { id: "cart-1", nombre: "A" },
      { id: "cart-2", nombre: "B" },
    ]);
    const bloque = makeBloque({ operaciones: [makeRawOp()] });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasConError).toBe(1);
    const callData = mocks.createFila.mock.calls[0][0].data;
    expect(callData.carteraResueltaId).toBeUndefined();
  });

  it("T-U8 — comitente único → fila RESUELTA con comitenteResueltoId", async () => {
    mocks.findManyComitente.mockResolvedValue([COMITENTE_UNO]);
    const bloque = makeBloque({ operaciones: [makeRawOp()] });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.ok).toBe(true);
    expect(result.filasResuelta).toBe(1);
    expect(result.filasConError).toBe(0);
    expect(result.filasConAdvertencia).toBe(0);

    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "RESUELTA",
          comitenteResueltoId: "com-1",
          tipoSujeto: "COMITENTE",
          conflictoNombre: false,
        }),
      }),
    );
  });

  it("T-U9 — comitente ambiguo desambiguado por nombre → fila RESUELTA", async () => {
    mocks.findManyComitente.mockResolvedValue([
      COMITENTE_UNO,
      { id: "com-2", nombre: "GARCIA PEDRO", esPropioBYG: false, carteraId: null },
    ]);
    // El bloque tiene el nombre exacto de com-1
    const bloque = makeBloque({
      nombreDetectado: "GARCIA JUAN",
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasResuelta).toBe(1);
    expect(result.filasConError).toBe(0);

    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "RESUELTA",
          comitenteResueltoId: "com-1",
        }),
      }),
    );
  });

  it("T-U10 — comitente ambiguo sin desambiguar → fila ERROR", async () => {
    mocks.findManyComitente.mockResolvedValue([
      COMITENTE_UNO,
      { id: "com-2", nombre: "GARCIA JUAN", esPropioBYG: false, carteraId: null }, // mismo nombre!
    ]);
    const bloque = makeBloque({ operaciones: [makeRawOp()] });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasConError).toBe(1);
    expect(result.filasResuelta).toBe(0);

    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "ERROR",
          comitenteResueltoId: undefined,
        }),
      }),
    );
  });

  it("T-U11a — cartera propia (esPropioBYG=true, carteraId asignado) → tipoSujeto CARTERA", async () => {
    mocks.findManyComitente.mockResolvedValue([
      { id: "com-byg", nombre: "BYG PROPIA", esPropioBYG: true, carteraId: "cart-1" },
    ]);
    const bloque = makeBloque({
      nombreDetectado: "BYG PROPIA",
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasResuelta).toBe(1);

    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "RESUELTA",
          tipoSujeto: "CARTERA",
          carteraResueltaId: "cart-1",
          comitenteResueltoId: undefined,
        }),
      }),
    );
  });

  it("T-U11b — esPropioBYG=true pero carteraId=null → fila ERROR (config inválida)", async () => {
    mocks.findManyComitente.mockResolvedValue([
      { id: "com-byg2", nombre: "BYG SIN CARTERA", esPropioBYG: true, carteraId: null },
    ]);
    const bloque = makeBloque({
      nombreDetectado: "BYG SIN CARTERA",
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasConError).toBe(1);
    expect(result.filasResuelta).toBe(0);

    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "ERROR" }),
      }),
    );
    const callData = mocks.createFila.mock.calls[0][0].data;
    // tipoSujeto, comitenteResueltoId y carteraResueltaId deben estar ausentes o ser undefined/null
    expect(callData.tipoSujeto == null).toBe(true);
    expect(callData.comitenteResueltoId == null).toBe(true);
    expect(callData.carteraResueltaId == null).toBe(true);
  });

  it("T-U11c — carteraId asignado (esPropioBYG=false) → tipoSujeto CARTERA igual", async () => {
    mocks.findManyComitente.mockResolvedValue([
      { id: "com-cart", nombre: "FONDO MIXTO", esPropioBYG: false, carteraId: "cart-2" },
    ]);
    const bloque = makeBloque({
      nombreDetectado: "FONDO MIXTO",
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasResuelta).toBe(1);

    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "RESUELTA",
          tipoSujeto: "CARTERA",
          carteraResueltaId: "cart-2",
          comitenteResueltoId: undefined,
        }),
      }),
    );
  });

  it("T-U12 — nombre diferente al del comitente → ADVERTENCIA + conflictoNombre=true", async () => {
    mocks.findManyComitente.mockResolvedValue([COMITENTE_UNO]);
    const bloque = makeBloque({
      nombreDetectado: "Juan Garcia",  // diferente capitalización
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasConAdvertencia).toBe(1);
    expect(result.filasConError).toBe(0);

    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "ADVERTENCIA",
          comitenteResueltoId: "com-1",
          conflictoNombre: true,
        }),
      }),
    );
  });
});

describe("processBolsaExcelUpload — resolución aproximada por nombre (E4.6C.1)", () => {
  it("T-U14 — número 11838 sin match exacto + nombre DANIEL resuelve al único candidato 11538 con warning y ADVERTENCIA", async () => {
    // Ni ComitenteInversion ni Cartera tienen 11838 exacto.
    mocks.findManyComitente.mockResolvedValueOnce([]); // lookup exacto por nroComitente
    mocks.findManyCartera.mockResolvedValueOnce([]); // lookup exacto por comitenteNumber
    // Fallback: búsqueda amplia por nombre — DANIEL/11538 es cartera propia.
    mocks.findManyComitente.mockResolvedValueOnce([]); // ningún ComitenteInversion se llama DANIEL
    mocks.findManyCartera.mockResolvedValueOnce([{ id: "cart-daniel", nombre: "DANIEL", comitenteNumber: "11538" }]);

    const bloque = makeBloque({
      nombreDetectado: "DANIEL",
      nroComitenteDetectado: "11838",
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasConAdvertencia).toBe(1);
    expect(result.filasResuelta).toBe(0);
    expect(result.filasConError).toBe(0);

    expect(mocks.createFila).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "ADVERTENCIA",
          tipoSujeto: "CARTERA",
          carteraResueltaId: "cart-daniel",
          comitenteResueltoId: undefined,
        }),
      }),
    );
    const callData = mocks.createFila.mock.calls[0][0].data;
    expect(callData.warningsJson).toEqual(
      expect.arrayContaining([
        "Número detectado 11838; asociado a DANIEL / 11538 por coincidencia de nombre. Requiere revisión.",
      ]),
    );
  });

  it("T-U15 — más de un candidato con el mismo nombre nunca resuelve por aproximación → fila ERROR", async () => {
    mocks.findManyComitente.mockResolvedValueOnce([]);
    mocks.findManyCartera.mockResolvedValueOnce([]);
    // Dos comitentes distintos, casualmente ambos llamados "DANIEL".
    mocks.findManyComitente.mockResolvedValueOnce([
      { id: "com-a", nombre: "DANIEL", nroComitente: "11538" },
      { id: "com-b", nombre: "DANIEL", nroComitente: "99999" },
    ]);
    mocks.findManyCartera.mockResolvedValueOnce([]);

    const bloque = makeBloque({
      nombreDetectado: "DANIEL",
      nroComitenteDetectado: "11838",
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasConError).toBe(1);
    expect(result.filasConAdvertencia).toBe(0);
    const callData = mocks.createFila.mock.calls[0][0].data;
    expect(callData.carteraResueltaId == null).toBe(true);
    expect(callData.comitenteResueltoId == null).toBe(true);
  });

  it("T-U16 — distancia de edición mayor a 1 nunca resuelve por aproximación → fila ERROR", async () => {
    mocks.findManyComitente.mockResolvedValueOnce([]);
    mocks.findManyCartera.mockResolvedValueOnce([]);
    mocks.findManyComitente.mockResolvedValueOnce([]);
    // "12345" vs "11838" difieren en más de 1 posición.
    mocks.findManyCartera.mockResolvedValueOnce([{ id: "cart-x", nombre: "DANIEL", comitenteNumber: "12345" }]);

    const bloque = makeBloque({
      nombreDetectado: "DANIEL",
      nroComitenteDetectado: "11838",
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasConError).toBe(1);
    const callData = mocks.createFila.mock.calls[0][0].data;
    expect(callData.carteraResueltaId == null).toBe(true);
  });

  it("T-U17 — largo de número distinto nunca resuelve por aproximación → fila ERROR", async () => {
    mocks.findManyComitente.mockResolvedValueOnce([]);
    mocks.findManyCartera.mockResolvedValueOnce([]);
    mocks.findManyComitente.mockResolvedValueOnce([]);
    // "1538" (4 dígitos) vs "11838" (5 dígitos) — largo distinto, nunca aproxima.
    mocks.findManyCartera.mockResolvedValueOnce([{ id: "cart-x", nombre: "DANIEL", comitenteNumber: "1538" }]);

    const bloque = makeBloque({
      nombreDetectado: "DANIEL",
      nroComitenteDetectado: "11838",
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasConError).toBe(1);
  });

  it("T-U18 — número detectado de menos de 4 dígitos nunca resuelve por aproximación, aunque el nombre y la distancia coincidan → fila ERROR", async () => {
    mocks.findManyComitente.mockResolvedValueOnce([]);
    mocks.findManyCartera.mockResolvedValueOnce([]);
    // El fallback amplio corta ANTES de volver a consultar la base: "153"
    // tiene menos de 4 dígitos, nunca llega a buscar candidatos por nombre.
    // Solo se consumen las 2 respuestas de arriba (lookup exacto); si el
    // código llegara a consultar de nuevo, estos mocks quedarían agotados y
    // Prisma real fallaría — más seguro que dejar valores de más sin usar.

    const bloque = makeBloque({
      nombreDetectado: "DANIEL",
      nroComitenteDetectado: "153", // 3 dígitos — por debajo del mínimo
      operaciones: [makeRawOp()],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.filasConError).toBe(1);
    expect(result.filasConAdvertencia).toBe(0);
    const callData = mocks.createFila.mock.calls[0][0].data;
    expect(callData.carteraResueltaId == null).toBe(true);
    expect(callData.erroresJson).toEqual(
      expect.arrayContaining([expect.stringMatching(/comitente no encontrado/i)]),
    );
  });
});

describe("processBolsaExcelUpload — contadores y lote", () => {
  it("T-U13 — contadores totalFilas/resueltas/advertencias/errores exactos", async () => {
    mocks.findManyComitente.mockResolvedValue([COMITENTE_UNO]);
    const bloque = makeBloque({
      nombreDetectado: "GARCIA JUAN",
      operaciones: [
        makeRawOp({ errors: [] }),                        // RESUELTA
        makeRawOp({ warnings: ["precio inusual"] }),      // ADVERTENCIA (op.warning)
        makeRawOp({ errors: ["ticker faltante"] }),       // ERROR (op.error)
      ],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.ok).toBe(true);
    expect(result.totalFilas).toBe(3);
    expect(result.filasResuelta).toBe(1);
    expect(result.filasConAdvertencia).toBe(1);
    expect(result.filasConError).toBe(1);

    // Los contadores también se escriben en el lote
    expect(mocks.createLote).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalFilas: 3,
          filasConAdvertencia: 1,
          filasConError: 1,
          estado: "REVISION_PENDIENTE",
        }),
      }),
    );
  });

  it("T-U14 — no se crean OperacionBolsa", async () => {
    mocks.findManyComitente.mockResolvedValue([COMITENTE_UNO]);
    const bloque = makeBloque({ operaciones: [makeRawOp()] });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    // El prisma mock nunca expone operacionBolsa — verificamos que no hay ninguna
    // propiedad de ese tipo en ninguna llamada
    const allCalls = [
      ...mocks.createLote.mock.calls,
      ...mocks.createArchivo.mock.calls,
      ...mocks.createFila.mock.calls,
    ];
    for (const call of allCalls) {
      const data = call[0]?.data ?? {};
      expect(Object.keys(data)).not.toContain("operacionBolsaId");
    }
  });
});

describe("processBolsaExcelUpload — archivo válido sin operaciones", () => {
  it("T-U15 — Excel vacío (0 operaciones) crea lote REVISION_PENDIENTE con totalFilas=0", async () => {
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult());

    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile()), "user-1");

    expect(result.ok).toBe(true);
    expect(result.estado).toBe("REVISION_PENDIENTE");
    expect(result.totalFilas).toBe(0);
    expect(mocks.createFila).not.toHaveBeenCalled();

    expect(mocks.createLote).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "REVISION_PENDIENTE", totalFilas: 0 }),
      }),
    );
  });
});

// ── Fecha operativa del lote (E4.5C) ──────────────────────────────────────────

describe("processBolsaExcelUpload — fecha operativa del lote", () => {
  it("T-U16 — Excel sin fecha operativa → error, sin tocar la DB", async () => {
    const result = await processBolsaExcelUpload(makeFormData(makeXlsxFile(), null), "user-1");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/fecha de operaciones/i);
    expect(mocks.findUniqueArchivo).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("T-U17 — fecha operativa anterior a hoy es aceptada y queda en el lote", async () => {
    mocks.findManyComitente.mockResolvedValue([COMITENTE_UNO]);
    const bloque = makeBloque({ operaciones: [makeRawOp()] });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(
      makeFormData(makeXlsxFile(), "2020-01-15"),
      "user-1",
    );

    expect(result.ok).toBe(true);
    expect(mocks.createLote).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fechaOperativa: new Date("2020-01-15T00:00:00.000Z") }),
      }),
    );
  });

  it("T-U18 — todas las filas reciben la fechaConcertacion del lote, no la detectada por el Excel", async () => {
    mocks.findManyComitente.mockResolvedValue([COMITENTE_UNO]);
    const bloque = makeBloque({
      operaciones: [
        makeRawOp({ fechaConcertacion: "2026-07-01" }),
        makeRawOp({ fechaConcertacion: "2026-07-14" }),
        makeRawOp({ fechaConcertacion: null }),
      ],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    await processBolsaExcelUpload(makeFormData(makeXlsxFile(), "2026-07-14"), "user-1");

    expect(mocks.createFila).toHaveBeenCalledTimes(3);
    for (const call of mocks.createFila.mock.calls) {
      expect(call[0].data.fechaConcertacion).toEqual(new Date("2026-07-14T00:00:00.000Z"));
    }
  });

  it("T-U19 — fecha detectada distinta de la operativa agrega warning, no error", async () => {
    mocks.findManyComitente.mockResolvedValue([COMITENTE_UNO]);
    const bloque = makeBloque({
      operaciones: [makeRawOp({ fechaConcertacion: "2026-07-01", errors: [] })],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(
      makeFormData(makeXlsxFile(), "2026-07-14"),
      "user-1",
    );

    expect(result.filasConError).toBe(0);
    expect(result.filasConAdvertencia).toBe(1);

    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.estado).toBe("ADVERTENCIA");
    expect(filaData.warningsJson).toEqual(
      expect.arrayContaining([expect.stringMatching(/fecha detectada.*difiere/i)]),
    );
  });

  it("T-U20 — 'Fecha no detectada' del parser ya no genera error de fila cuando hay fechaOperativa", async () => {
    mocks.findManyComitente.mockResolvedValue([COMITENTE_UNO]);
    const bloque = makeBloque({
      operaciones: [
        makeRawOp({ fechaConcertacion: null, errors: ["Fecha no detectada."] }),
      ],
    });
    mocks.parseBolsaExcel.mockReturnValue(emptyParseResult({ bloques: [bloque] }));

    const result = await processBolsaExcelUpload(
      makeFormData(makeXlsxFile(), "2026-07-14"),
      "user-1",
    );

    expect(result.filasConError).toBe(0);
    expect(result.filasResuelta).toBe(1);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.estado).toBe("RESUELTA");
    expect(filaData.erroresJson).toBeUndefined();
    expect(filaData.fechaConcertacion).toEqual(new Date("2026-07-14T00:00:00.000Z"));
  });
});

// ── resolveTickerAgainstCatalog (E4.6C.2) ───────────────────────────────────
//
// Misma fuente que el alta manual (bolsa/nueva/page.tsx: prisma.activo.
// findMany() sin filtro) — acá se prueba la lógica pura de resolución contra
// una lista de catálogo ya traída, más BrokerTickerAlias como alias.

describe("resolveTickerAgainstCatalog", () => {
  const CATALOGO_REAL = ["GGAL", "GGALD", "TSLA", "MELI", "AL30", "AL41", "AAPL", "AAPLD"];

  it("TICK-1: coincidencia exacta contra el catálogo", () => {
    expect(resolveTickerAgainstCatalog(["GGAL"], CATALOGO_REAL)).toEqual({ ticker: "GGAL", warning: null });
  });

  it("TICK-2: GAL (un solo candidato, único match a distancia 1) se asocia a GGAL con warning — nunca se corrige en silencio", () => {
    const result = resolveTickerAgainstCatalog(["GAL"], CATALOGO_REAL);
    expect(result.ticker).toBe("GGAL");
    expect(result.warning).toMatch(/GAL.*GGAL/);
  });

  it("TICK-3: ticker ambiguo (distancia 1 de más de un candidato del catálogo) nunca se corrige", () => {
    // "AL3" está a distancia 1 tanto de "AL30" como de... construimos un catálogo
    // ambiguo a propósito: dos tickers de 4 letras a un solo cambio de "AL3X".
    const catalogoAmbiguo = ["AL3A", "AL3B"];
    const result = resolveTickerAgainstCatalog(["AL3A".slice(0, 3) + "C"], catalogoAmbiguo); // "AL3C"
    expect(result.ticker).toBeNull();
    expect(result.warning).toBeNull();
  });

  it("TICK-4: variante dólar/MEP (sufijo D) de un ticker base ya listado se asocia con warning, aunque no esté literal en el catálogo", () => {
    // TSLAD no está en CATALOGO_REAL, pero TSLA sí — convención real ya usada
    // en el catálogo (GGAL/GGALD, AAPL/AAPLD).
    const result = resolveTickerAgainstCatalog(["TSLAD"], CATALOGO_REAL);
    expect(result.ticker).toBe("TSLAD");
    expect(result.warning).toMatch(/TSLAD/);
  });

  it("TICK-5: alias existente resuelve al ticker canónico del catálogo", () => {
    const result = resolveTickerAgainstCatalog(["MELI.BA"], CATALOGO_REAL, { "MELI.BA": "MELI" });
    expect(result.ticker).toBe("MELI");
    expect(result.warning).toMatch(/alias/i);
  });

  it("TICK-6: ticker totalmente ajeno al catálogo, sin alias ni sufijo D ni distancia chica, no resuelve", () => {
    const result = resolveTickerAgainstCatalog(["ZZZZZ"], CATALOGO_REAL);
    expect(result.ticker).toBeNull();
  });

  it("TICK-7: normaliza mayúsculas, espacios y caracteres OCR extraños antes de comparar", () => {
    expect(resolveTickerAgainstCatalog([" g g a l "], CATALOGO_REAL)).toEqual({ ticker: "GGAL", warning: null });
    expect(resolveTickerAgainstCatalog(["GG.AL"], CATALOGO_REAL)).toEqual({ ticker: "GGAL", warning: null });
  });

  it("TICK-8: múltiples lecturas del mismo recorte — si cualquiera matchea exacto, se usa esa", () => {
    const result = resolveTickerAgainstCatalog(["GAL", "GGAL"], CATALOGO_REAL);
    expect(result).toEqual({ ticker: "GGAL", warning: null });
  });
});

// ── checkCantidadCoherence / checkCaucionPrincipalCoherence (E4.6C.3) ──────
//
// E4.6C.2 derivaba un reemplazo desde precio×monto cuando eran incoherentes.
// E4.6C.3 revierte esa idea: precio y monto pueden estar tan corruptos como
// cantidad, así que su coincidencia numérica nunca es evidencia suficiente.
// Estas funciones SOLO pueden devolver un error — nunca un valor alternativo.

describe("checkCantidadCoherence", () => {
  it("CANT-1: 54625 × 0.5615 ≈ 30673.03 es coherente — sin error", () => {
    expect(checkCantidadCoherence("54625", "0.5615", "30673.03")).toEqual({ error: null });
  });

  it("CANT-2: 546295 (dígito de más insertado por el OCR) frente a la misma precio/monto — NUNCA se corrige, pero si la diferencia es mínima en términos de ratio puede seguir dentro de tolerancia; se exige el caso real de magnitud", () => {
    // 546295 × 0.5615 = 306.744,64 vs monto 30.673,03 → ratio ~10x: sí incoherente.
    const result = checkCantidadCoherence("546295", "0.5615", "30673.03");
    expect(result.error).toBe("Cantidad no confiable.");
  });

  it("CANT-3: valores coherentes (408, 1000, 64, 50000) nunca generan error", () => {
    expect(checkCantidadCoherence("408", "8205.000", "3352996.07").error).toBeNull();
    expect(checkCantidadCoherence("1000", "41200.000", "41265910.20").error).toBeNull();
    expect(checkCantidadCoherence("64", "24400.000", "1564098.07").error).toBeNull();
    expect(checkCantidadCoherence("50000", "0.76534", "38267.16").error).toBeNull();
  });

  it("CANT-4: si falta precio o monto, no hay nada contra qué validar — nunca error", () => {
    expect(checkCantidadCoherence("546295", null, "30673.03")).toEqual({ error: null });
    expect(checkCantidadCoherence("546295", "0.5615", null)).toEqual({ error: null });
  });

  it("CANT-5: 100 frente a la imagen real (1.000) — diferencia de magnitud clara con precio/monto reales", () => {
    // 100 × 41200 = 4.120.000 vs monto real 41.265.910,20 (~1.000 unidades) → ratio ~10x.
    const result = checkCantidadCoherence("100", "41200.000", "41265910.20");
    expect(result.error).toBe("Cantidad no confiable.");
  });

  it("CANT-6: una diferencia de magnitud (separador de miles perdido en precio) también queda incoherente", () => {
    const result = checkCantidadCoherence("408", "8205000", "3352996.07");
    expect(result.error).toBe("Cantidad no confiable.");
  });

  it("CANT-7: nunca devuelve un valor alternativo — solo error o null (no hay campo 'cantidad' en el resultado)", () => {
    const result = checkCantidadCoherence("100", "41200.000", "41265910.20");
    expect(Object.keys(result)).toEqual(["error"]);
  });
});

describe("checkCaucionPrincipalCoherence", () => {
  it("CAUC-1: principal 87.440.200 y monto a cobrar 87.492.602,86 (levemente mayor, con interés) es coherente", () => {
    expect(checkCaucionPrincipalCoherence("87440200", "87492602.86")).toEqual({ error: null });
  });

  it("CAUC-2: principal 402000 frente al monto a cobrar real 87492602.86 — diferencia de magnitud, se anula", () => {
    const result = checkCaucionPrincipalCoherence("402000", "87492602.86");
    expect(result.error).toMatch(/Principal no confiable/);
  });

  it("CAUC-3: el monto a cobrar/pagar nunca puede ser menor al principal", () => {
    const result = checkCaucionPrincipalCoherence("87440200", "50000000");
    expect(result.error).toMatch(/menor al principal/);
  });

  it("CAUC-4: sin datos suficientes, no hay error (nada que contrastar)", () => {
    expect(checkCaucionPrincipalCoherence(null, "87492602.86")).toEqual({ error: null });
    expect(checkCaucionPrincipalCoherence("87440200", null)).toEqual({ error: null });
  });
});
