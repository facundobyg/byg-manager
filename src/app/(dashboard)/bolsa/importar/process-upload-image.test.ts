import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  findUniqueArchivo: vi.fn(),
  findFirstLote: vi.fn(),
  findUniqueLote: vi.fn(),
  findUniqueUser: vi.fn(),
  findManyComitente: vi.fn(),
  findManyCartera: vi.fn(),
  findManyActivo: vi.fn(),
  findManyBrokerTickerAlias: vi.fn(),
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

// Transitive dep: process-upload.ts → resolveComitente → parseBolsaExcel
vi.mock("@/lib/importers/bolsa-excel/parser", () => ({
  parseBolsaExcel: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bolsaImportArchivo: { findUnique: mocks.findUniqueArchivo, update: mocks.updateArchivo },
    bolsaImportLote: { findFirst: mocks.findFirstLote, findUnique: mocks.findUniqueLote },
    bolsaImportFila: { deleteMany: mocks.deleteManyFila, findMany: mocks.findManyFila },
    user: { findUnique: mocks.findUniqueUser },
    comitenteInversion: { findMany: mocks.findManyComitente },
    cartera: { findMany: mocks.findManyCartera },
    activo: { findMany: mocks.findManyActivo },
    brokerTickerAlias: { findMany: mocks.findManyBrokerTickerAlias },
    $transaction: mocks.transaction,
  },
}));

import { processBolsaImageUpload } from "./process-upload-image";
import type { BolsaImageParseResult } from "@/lib/importers/bolsa-image/types";
import { buildOpFromGridRow, encodeOcrCandidate, OCR_CANDIDATE_SEPARATOR } from "../../../../lib/browser/ocr-bolsa";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeParseResult(nOps = 1): BolsaImageParseResult {
  return {
    bloques: [
      {
        numeroBloque: 1,
        nombreDetectado: "Juan Perez",
        nroComitenteDetectado: "12345",
        operaciones: Array.from({ length: nOps }, (_, i) => ({
          numeroFila: i + 1,
          rawOperacion: `COMPRA AL30 48HS #${i}`,
          operacionBase: "COMPRA" as const,
          fechaConcertacion: "2024-07-10",
          ticker: "AL30",
          cantidad: "10000",
          precio: "65.25",
          monedaDetectada: null,
          montoNetoReferencia: "652500",
          plazo: "48HS",
          plazoNormalizado: "48HS",
          fechaVencimiento: null,
          tasaCaucion: null,
          montoCobrarReferencia: null,
          montoPagarReferencia: null,
          instrumentoHint: null,
          warnings: [],
          errors: [],
        })),
        warnings: [],
        errors: [],
      },
    ],
    warningsGlobales: [],
    erroresGlobales: [],
    totalOperaciones: nOps,
  };
}

const FECHA_OPERATIVA_DEFAULT = new Date("2024-07-10T00:00:00.000Z");

function makeInput(
  overrides?: Partial<{
    parseResult: BolsaImageParseResult;
    fileName: string;
    fileSize: number;
    fechaOperativa: Date;
    reanalizar: boolean;
  }>,
) {
  return {
    parseResult: overrides?.parseResult ?? makeParseResult(1),
    fileName: overrides?.fileName ?? "ops.jpg",
    fileSize: overrides?.fileSize ?? 1024,
    mimeType: "image/jpeg" as const,
    fechaOperativa: overrides?.fechaOperativa ?? FECHA_OPERATIVA_DEFAULT,
    reanalizar: overrides?.reanalizar,
  };
}

function setupTransaction(loteId = "lote-img-1", archivoId = "archivo-img-1") {
  const lote = { id: loteId };
  const archivo = { id: archivoId };
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb({
      bolsaImportLote: {
        create: mocks.createLote.mockResolvedValue(lote),
        update: mocks.updateLote.mockResolvedValue(lote),
      },
      bolsaImportArchivo: {
        create: mocks.createArchivo.mockResolvedValue(archivo),
        update: mocks.updateArchivo.mockResolvedValue(archivo),
      },
      bolsaImportFila: {
        create: mocks.createFila.mockResolvedValue({ id: "fila-x" }),
        deleteMany: mocks.deleteManyFila.mockResolvedValue({ count: 0 }),
        findMany: mocks.findManyFila.mockResolvedValue([]),
      },
      auditLog: { create: mocks.createAuditLog },
    }),
  );
  return { lote, archivo };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("processBolsaImageUpload (OCR — no image sent to server)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueArchivo.mockResolvedValue(null);
    mocks.findFirstLote.mockResolvedValue(null);
    mocks.findUniqueLote.mockResolvedValue(null);
    mocks.findManyComitente.mockResolvedValue([
      { id: "comitente-1", nombre: "Juan Perez", esPropioBYG: false, carteraId: null },
    ]);
    mocks.findManyCartera.mockResolvedValue([]);
    mocks.findManyActivo.mockResolvedValue([{ ticker: "AL30" }]);
    mocks.findManyBrokerTickerAlias.mockResolvedValue([]);
  });

  // ── T-IMG-1: invalid parseResult structure ────────────────────────────────
  it("T-IMG-1: returns error for invalid parseResult structure", async () => {
    const result = await processBolsaImageUpload(
      {
        parseResult: { bloques: "wrong" } as unknown as BolsaImageParseResult,
        fileName: "x.jpg",
        fileSize: 0,
        mimeType: "image/jpeg",
        fechaOperativa: FECHA_OPERATIVA_DEFAULT,
      },
      "user-1",
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/inválida/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // ── T-IMG-2: duplicate content hash ──────────────────────────────────────
  it("T-IMG-2: returns DUPLICADO when content hash already exists", async () => {
    mocks.findUniqueArchivo.mockResolvedValue({
      id: "archivo-prev",
      loteId: "lote-prev",
      createdAt: new Date("2024-07-01T00:00:00Z"),
      estado: "LISTO",
    });
    const result = await processBolsaImageUpload(makeInput(), "user-1");
    expect(result.ok).toBe(true);
    expect(result.estado).toBe("DUPLICADO");
    expect(result.archivoExistente?.loteId).toBe("lote-prev");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // ── Reanálisis de un archivo duplicado (E4.6A) ───────────────────────────
  describe("reanálisis", () => {
    const ARCHIVO_EXISTENTE = {
      id: "archivo-prev",
      loteId: "lote-prev",
      createdAt: new Date("2024-07-01T00:00:00Z"),
      estado: "LISTO",
    };

    it("T-IMG-2b: duplicado sin reanalizar=true nunca toca la transacción", async () => {
      mocks.findUniqueArchivo.mockResolvedValue(ARCHIVO_EXISTENTE);
      mocks.findUniqueLote.mockResolvedValue({ id: "lote-prev", estado: "REVISION_PENDIENTE", creadoPorId: "user-1" });

      const result = await processBolsaImageUpload(makeInput(), "user-1");

      expect(result.estado).toBe("DUPLICADO");
      expect(result.archivoExistente?.reanalizable).toBe(true);
      expect(mocks.transaction).not.toHaveBeenCalled();
    });

    it("T-IMG-2c: reanalizar=true en un lote REVISION_PENDIENTE reemplaza las filas de ESE archivo en una sola transacción", async () => {
      mocks.findUniqueArchivo.mockResolvedValue(ARCHIVO_EXISTENTE);
      mocks.findUniqueLote.mockResolvedValue({ id: "lote-prev", estado: "REVISION_PENDIENTE", creadoPorId: "user-1" });
      setupTransaction();

      const result = await processBolsaImageUpload(makeInput({ reanalizar: true }), "user-1");

      expect(result.ok).toBe(true);
      expect(result.estado).toBe("REVISION_PENDIENTE");
      expect(result.loteId).toBe("lote-prev");
      expect(result.archivoId).toBe("archivo-prev");
      expect(mocks.transaction).toHaveBeenCalledTimes(1);
      expect(mocks.deleteManyFila).toHaveBeenCalledWith({ where: { archivoId: "archivo-prev" } });
      expect(mocks.updateArchivo).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "archivo-prev" } }));
      expect(mocks.createFila).toHaveBeenCalledTimes(1);
      expect(mocks.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ accion: "LOTE_REANALIZADO" }) }),
      );
    });

    it("T-IMG-2d: reanalizar=true en un lote EN_VALIDACION es rechazado, nunca reemplaza filas", async () => {
      mocks.findUniqueArchivo.mockResolvedValue(ARCHIVO_EXISTENTE);
      mocks.findUniqueLote.mockResolvedValue({ id: "lote-prev", estado: "EN_VALIDACION", creadoPorId: "user-1" });

      const result = await processBolsaImageUpload(makeInput({ reanalizar: true }), "user-1");

      expect(result.estado).toBe("DUPLICADO");
      expect(result.archivoExistente?.reanalizable).toBe(false);
      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.deleteManyFila).not.toHaveBeenCalled();
    });

    it("T-IMG-2e: reanalizar=true por un usuario que no creó el lote y no es ADMIN es rechazado", async () => {
      mocks.findUniqueArchivo.mockResolvedValue(ARCHIVO_EXISTENTE);
      mocks.findUniqueLote.mockResolvedValue({ id: "lote-prev", estado: "REVISION_PENDIENTE", creadoPorId: "otro-user" });
      mocks.findUniqueUser.mockResolvedValue({ role: "EMPLEADO" });

      const result = await processBolsaImageUpload(makeInput({ reanalizar: true }), "user-1");

      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/permisos/i);
      expect(mocks.deleteManyFila).not.toHaveBeenCalled();
    });

    it("T-IMG-2f: reanalizar=true en un lote DEVUELTO sí se admite", async () => {
      mocks.findUniqueArchivo.mockResolvedValue(ARCHIVO_EXISTENTE);
      mocks.findUniqueLote.mockResolvedValue({ id: "lote-prev", estado: "DEVUELTO", creadoPorId: "user-1" });
      setupTransaction();

      const result = await processBolsaImageUpload(makeInput({ reanalizar: true }), "user-1");

      expect(result.ok).toBe(true);
      expect(result.estado).toBe("REVISION_PENDIENTE");
    });
  });

  // ── T-IMG-3: valid result creates lote REVISION_PENDIENTE ────────────────
  it("T-IMG-3: valid OCR result creates lote and returns REVISION_PENDIENTE", async () => {
    setupTransaction("lote-img-1", "archivo-img-1");
    const result = await processBolsaImageUpload(makeInput(), "user-1");
    expect(result.ok).toBe(true);
    expect(result.estado).toBe("REVISION_PENDIENTE");
    expect(result.loteId).toBe("lote-img-1");
    expect(result.totalFilas).toBe(1);
  });

  // ── T-IMG-4: lote created with origen IMAGEN ─────────────────────────────
  it("T-IMG-4: lote is created with origen IMAGEN", async () => {
    setupTransaction();
    await processBolsaImageUpload(makeInput(), "user-1");
    const loteData = mocks.createLote.mock.calls[0][0].data;
    expect(loteData.origen).toBe("IMAGEN");
    expect(loteData.estado).toBe("REVISION_PENDIENTE");
    expect(loteData.creadoPorId).toBe("user-1");
  });

  // ── T-IMG-5: existingLoteId increments counters ───────────────────────────
  it("T-IMG-5: existingLoteId increments lote counters instead of creating new lote", async () => {
    mocks.findFirstLote.mockResolvedValue({ id: "lote-1", creadoPorId: "user-1" });
    setupTransaction("lote-1", "archivo-2");

    const result = await processBolsaImageUpload(
      makeInput({ parseResult: makeParseResult(3) }),
      "user-1",
      "lote-1",
    );

    expect(result.ok).toBe(true);
    expect(result.loteId).toBe("lote-1");
    expect(mocks.createLote).not.toHaveBeenCalled();
    expect(mocks.updateLote).toHaveBeenCalledTimes(1);
    const updateCall = mocks.updateLote.mock.calls[0][0];
    expect(updateCall.where.id).toBe("lote-1");
    expect(updateCall.data.totalFilas.increment).toBe(3);
  });

  // ── T-IMG-6: invalid existingLoteId returns error ────────────────────────
  it("T-IMG-6: existingLoteId not owned by user returns error", async () => {
    mocks.findFirstLote.mockResolvedValue(null);
    const result = await processBolsaImageUpload(makeInput(), "user-1", "lote-ajeno");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/lote no encontrado/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // ── T-IMG-7: empty bloques returns error — never creates an empty lote ──────
  it("T-IMG-7: empty bloques returns error without creating a lote", async () => {
    const result = await processBolsaImageUpload(
      makeInput({
        parseResult: { bloques: [], warningsGlobales: [], erroresGlobales: [], totalOperaciones: 0 },
      }),
      "user-1",
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no se detectaron operaciones/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // ── T-IMG-8: all rows forced to ADVERTENCIA (never RESUELTA) ─────────────
  it("T-IMG-8: all rows are ADVERTENCIA at minimum — never RESUELTA", async () => {
    mocks.findManyComitente.mockResolvedValue([
      { id: "comitente-1", nombre: "Juan Perez", esPropioBYG: false, carteraId: null },
    ]);
    setupTransaction();
    await processBolsaImageUpload(makeInput(), "user-1");

    const filaData = mocks.createFila.mock.calls[0][0].data;
    // Even a "clean" row must be ADVERTENCIA, not RESUELTA
    expect(filaData.estado).toBe("ADVERTENCIA");
  });

  // ── T-IMG-9: rows with errors stay ERROR ─────────────────────────────────
  it("T-IMG-9: rows with errors are marked ERROR", async () => {
    const parseResult = makeParseResult(1);
    parseResult.bloques[0].operaciones[0].errors = ["Tipo de operación no reconocido."];
    parseResult.bloques[0].operaciones[0].operacionBase = "DESCONOCIDA";

    setupTransaction();
    await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.estado).toBe("ERROR");
    expect(filaData.erroresJson).toContain("Tipo de operación no reconocido.");
  });

  // ── T-IMG-10: filasResuelta always 0 for OCR ─────────────────────────────
  it("T-IMG-10: filasResuelta is always 0 for OCR imports", async () => {
    setupTransaction();
    const result = await processBolsaImageUpload(makeInput({ parseResult: makeParseResult(3) }), "user-1");
    expect(result.filasResuelta).toBe(0);
  });

  // ── T-IMG-11: archivo stored with IMAGEN origen ──────────────────────────
  it("T-IMG-11: archivo is created with origen IMAGEN and estado LISTO", async () => {
    setupTransaction();
    await processBolsaImageUpload(makeInput({ fileName: "screenshot.png" }), "user-1");
    const archivoData = mocks.createArchivo.mock.calls[0][0].data;
    expect(archivoData.origen).toBe("IMAGEN");
    expect(archivoData.estado).toBe("LISTO");
    expect(archivoData.errorMessage).toBeNull();
  });

  // ── T-IMG-12: PNG mimeType stored correctly ──────────────────────────────
  it("T-IMG-12: PNG mimeType is stored in archivo", async () => {
    setupTransaction();
    await processBolsaImageUpload(
      {
        parseResult: makeParseResult(1),
        fileName: "screenshot.png",
        fileSize: 2048,
        mimeType: "image/png",
        fechaOperativa: FECHA_OPERATIVA_DEFAULT,
      },
      "user-1",
    );
    const archivoData = mocks.createArchivo.mock.calls[0][0].data;
    expect(archivoData.mimeType).toBe("image/png");
  });

  // ── T-IMG-13: CAUCION_COLOCADORA maps to tipoOperacionResuelta ───────────
  it("T-IMG-13: CAUCION_COLOCADORA maps to tipoOperacionResuelta", async () => {
    const parseResult: BolsaImageParseResult = {
      bloques: [
        {
          numeroBloque: 1,
          nombreDetectado: "Juan Perez",
          nroComitenteDetectado: "12345",
          operaciones: [
            {
              numeroFila: 1,
              rawOperacion: "CAUCION COLOCADORA 7d",
              operacionBase: "CAUCION_COLOCADORA",
              fechaConcertacion: "2024-07-10",
              ticker: null,
              cantidad: null,
              precio: null,
              monedaDetectada: null,
              montoNetoReferencia: "1000000",
              plazo: "7",
              plazoNormalizado: "7",
              fechaVencimiento: "2024-07-17",
              tasaCaucion: "42.5",
              montoCobrarReferencia: null,
              montoPagarReferencia: null,
              instrumentoHint: null,
              warnings: [],
              errors: [],
            },
          ],
          warnings: [],
          errors: [],
        },
      ],
      warningsGlobales: [],
      erroresGlobales: [],
      totalOperaciones: 1,
    };
    setupTransaction();
    await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.tipoOperacionResuelta).toBe("CAUCION_COLOCADORA");
    expect(filaData.tasaCaucion).toBe("42.5");
    expect(filaData.fechaVencimiento).toEqual(new Date("2024-07-17"));
  });

  // ── T-IMG-14: CARTERA comitente resolution ───────────────────────────────
  it("T-IMG-14: CARTERA comitente resolved via esPropioBYG", async () => {
    mocks.findManyComitente.mockResolvedValue([
      { id: "byg-c", nombre: "Juan Perez", esPropioBYG: true, carteraId: "cartera-byg" },
    ]);
    setupTransaction();
    await processBolsaImageUpload(makeInput(), "user-1");

    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.carteraResueltaId).toBe("cartera-byg");
    expect(filaData.comitenteResueltoId).toBeUndefined();
    expect(filaData.tipoSujeto).toBe("CARTERA");
  });

  // ── T-IMG-15: never creates OperacionBolsa ───────────────────────────────
  it("T-IMG-15: never creates OperacionBolsa — only staging tables touched", async () => {
    setupTransaction();
    await processBolsaImageUpload(makeInput(), "user-1");
    // The prisma mock has no operacionBolsa — if the code tried to access it, it would throw
    expect(mocks.createLote).toHaveBeenCalledTimes(1);
    expect(mocks.createArchivo).toHaveBeenCalledTimes(1);
    expect(mocks.createFila).toHaveBeenCalledTimes(1);
  });

  // ── T-IMG-16: no image sent to server ───────────────────────────────────
  it("T-IMG-16: processBolsaImageUpload accepts no File — image stays client-side", async () => {
    setupTransaction();
    // The new signature has no File parameter — this test verifies the contract
    const result = await processBolsaImageUpload(
      {
        parseResult: makeParseResult(1),
        fileName: "ops.jpg",
        fileSize: 500_000,
        mimeType: "image/jpeg",
        fechaOperativa: FECHA_OPERATIVA_DEFAULT,
      },
      "user-1",
    );
    expect(result.ok).toBe(true);
    // No file bytes in the created archivo record
    const archivoData = mocks.createArchivo.mock.calls[0][0].data;
    expect(archivoData.tamano).toBe(500_000);
    expect(archivoData).not.toHaveProperty("rawBytes");
  });

  // ── T-IMG-18: 0 operations never returns ok:true ─────────────────────────
  it("T-IMG-18: 0 total operations returns error — REVISION_PENDIENTE never emitted", async () => {
    // Bloque present but all operaciones arrays empty
    const parseResult: BolsaImageParseResult = {
      bloques: [
        {
          numeroBloque: 1,
          nombreDetectado: "Juan Perez",
          nroComitenteDetectado: "12345",
          operaciones: [],
          warnings: [],
          errors: [],
        },
      ],
      warningsGlobales: [],
      erroresGlobales: [],
      totalOperaciones: 0,
    };
    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no se detectaron operaciones/i);
    expect(result.estado).toBeUndefined();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // ── T-IMG-17: multiple bloques in single result ──────────────────────────
  it("T-IMG-17: multiple bloques result in multiple fila creates", async () => {
    mocks.findManyComitente.mockResolvedValue([
      { id: "c1", nombre: "Juan Perez", esPropioBYG: false, carteraId: null },
      { id: "c2", nombre: "Maria Garcia", esPropioBYG: false, carteraId: null },
    ]);
    const parseResult: BolsaImageParseResult = {
      bloques: [
        {
          numeroBloque: 1,
          nombreDetectado: "Juan Perez",
          nroComitenteDetectado: "12345",
          operaciones: [
            { numeroFila: 1, rawOperacion: "COMPRA AL30", operacionBase: "COMPRA", fechaConcertacion: "2024-07-10", ticker: "AL30", cantidad: "10000", precio: "65", monedaDetectada: null, montoNetoReferencia: null, plazo: null, plazoNormalizado: null, fechaVencimiento: null, tasaCaucion: null, montoCobrarReferencia: null, montoPagarReferencia: null, instrumentoHint: null, warnings: [], errors: [] },
            { numeroFila: 2, rawOperacion: "VENTA GD30", operacionBase: "VENTA", fechaConcertacion: "2024-07-10", ticker: "GD30", cantidad: "5000", precio: "73", monedaDetectada: null, montoNetoReferencia: null, plazo: null, plazoNormalizado: null, fechaVencimiento: null, tasaCaucion: null, montoCobrarReferencia: null, montoPagarReferencia: null, instrumentoHint: null, warnings: [], errors: [] },
          ],
          warnings: [],
          errors: [],
        },
        {
          numeroBloque: 2,
          nombreDetectado: "Maria Garcia",
          nroComitenteDetectado: "67890",
          operaciones: [
            { numeroFila: 1, rawOperacion: "COMPRA YPFD", operacionBase: "COMPRA", fechaConcertacion: "2024-07-10", ticker: "YPFD", cantidad: "100", precio: "12000", monedaDetectada: null, montoNetoReferencia: null, plazo: null, plazoNormalizado: null, fechaVencimiento: null, tasaCaucion: null, montoCobrarReferencia: null, montoPagarReferencia: null, instrumentoHint: null, warnings: [], errors: [] },
          ],
          warnings: [],
          errors: [],
        },
      ],
      warningsGlobales: [],
      erroresGlobales: [],
      totalOperaciones: 3,
    };
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");
    expect(result.totalFilas).toBe(3);
    expect(mocks.createFila).toHaveBeenCalledTimes(3);
  });

  // ── T-IMG-19: out-of-range tasaCaucion never reaches prisma.create ───────
  it("T-IMG-19: a tasaCaucion that doesn't fit Decimal(8,4) is nulled before Prisma, row marked ERROR", async () => {
    const parseResult: BolsaImageParseResult = {
      bloques: [
        {
          numeroBloque: 1,
          nombreDetectado: "Daniel",
          nroComitenteDetectado: "11538",
          operaciones: [
            {
              numeroFila: 1,
              rawOperacion: "CAUCION COLOCADORA",
              operacionBase: "CAUCION_COLOCADORA",
              fechaConcertacion: "2026-07-14",
              ticker: null,
              cantidad: "87440200.00",
              precio: null,
              monedaDetectada: null,
              montoNetoReferencia: null,
              plazo: null,
              plazoNormalizado: null,
              fechaVencimiento: "2026-07-15",
              // Corrupted upstream value — a monto that leaked into tasaCaucion.
              tasaCaucion: "87440200.00",
              montoCobrarReferencia: "87492602.86",
              montoPagarReferencia: null,
              instrumentoHint: null,
              warnings: [],
              errors: [],
            },
          ],
          warnings: [],
          errors: [],
        },
      ],
      warningsGlobales: [],
      erroresGlobales: [],
      totalOperaciones: 1,
    };
    setupTransaction();
    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.ok).toBe(true);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.tasaCaucion).toBeUndefined();
    expect(filaData.estado).toBe("ERROR");
    expect(filaData.erroresJson).toEqual(
      expect.arrayContaining([expect.stringMatching(/tasa de caución fuera de rango/i)]),
    );
    // The valid fields must pass through untouched.
    expect(filaData.cantidad).toBe("87440200.00");
    expect(filaData.montoCobrarReferencia).toBe("87492602.86");
  });

  // ── T-IMG-20: Prisma/Postgres errors are never exposed verbatim to the UI ─
  it("T-IMG-20: a raw Prisma/Postgres error is sanitized before reaching result.error", async () => {
    mocks.transaction.mockRejectedValue(
      new Error(
        'invalid input syntax for type numeric: "87440200.00" — numeric field overflow in column "tasaCaucion" (Postgres)',
      ),
    );
    const result = await processBolsaImageUpload(makeInput(), "user-1");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("No se pudo guardar una de las filas detectadas.");
    expect(result.error).not.toMatch(/numeric field overflow/i);
    expect(result.error).not.toMatch(/postgres/i);
    expect(result.error).not.toMatch(/tasaCaucion/i);
  });

  // ── Fecha operativa del lote (E4.5C) ─────────────────────────────────────
  // La validación de "obligatoria"/"formato inválido" para imágenes vive en
  // actions.ts (parseFechaOperativa) — cubierta en actions.test.ts (ACT-1/2).

  it("T-IMG-22: todas las filas reciben la fechaConcertacion del lote, no la detectada por el OCR", async () => {
    const parseResult = makeParseResult(2);
    parseResult.bloques[0].operaciones[0].fechaConcertacion = "2024-06-01";
    parseResult.bloques[0].operaciones[1].fechaConcertacion = null;
    setupTransaction();

    await processBolsaImageUpload(
      makeInput({ parseResult, fechaOperativa: new Date("2024-07-10T00:00:00.000Z") }),
      "user-1",
    );

    expect(mocks.createFila).toHaveBeenCalledTimes(2);
    for (const call of mocks.createFila.mock.calls) {
      expect(call[0].data.fechaConcertacion).toEqual(new Date("2024-07-10T00:00:00.000Z"));
    }
  });

  it("T-IMG-23: fecha detectada por OCR distinta de la operativa agrega warning, no error", async () => {
    const parseResult = makeParseResult(1);
    parseResult.bloques[0].operaciones[0].fechaConcertacion = "2024-06-01";
    setupTransaction();

    const result = await processBolsaImageUpload(
      makeInput({ parseResult, fechaOperativa: new Date("2024-07-10T00:00:00.000Z") }),
      "user-1",
    );

    // La fila sigue siendo ADVERTENCIA mínima (OCR nunca es RESUELTA), pero
    // NO pasa a ERROR solo por la diferencia de fecha.
    expect(result.filasConError).toBe(0);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.estado).toBe("ADVERTENCIA");
    expect(filaData.warningsJson).toEqual(
      expect.arrayContaining([expect.stringMatching(/fecha detectada.*difiere/i)]),
    );
  });

  it("T-IMG-24: 'Fecha no detectada' del OCR ya no marca la fila ERROR cuando hay fechaOperativa", async () => {
    const parseResult = makeParseResult(1);
    parseResult.bloques[0].operaciones[0].fechaConcertacion = null;
    parseResult.bloques[0].operaciones[0].errors = ["Fecha no detectada."];
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(0);
    expect(result.filasConAdvertencia).toBe(1);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.estado).toBe("ADVERTENCIA");
    expect(filaData.erroresJson).toBeUndefined();
    expect(filaData.fechaConcertacion).toEqual(FECHA_OPERATIVA_DEFAULT);
  });
});

describe("processBolsaImageUpload — endurecimiento financiero modo GRID (E4.6C.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueArchivo.mockResolvedValue(null);
    mocks.findFirstLote.mockResolvedValue(null);
    mocks.findUniqueLote.mockResolvedValue(null);
    mocks.findManyComitente.mockResolvedValue([
      { id: "comitente-1", nombre: "Juan Perez", esPropioBYG: false, carteraId: null },
    ]);
    mocks.findManyCartera.mockResolvedValue([]);
    mocks.findManyActivo.mockResolvedValue([{ ticker: "AL30" }]);
    mocks.findManyBrokerTickerAlias.mockResolvedValue([]);
  });

  function makeGridParseResult(opOverrides: Partial<BolsaImageParseResult["bloques"][0]["operaciones"][0]>) {
    const parseResult = makeParseResult(1);
    parseResult.modo = "GRID";
    Object.assign(parseResult.bloques[0].operaciones[0], opOverrides);
    return parseResult;
  }

  it("E-1: ticker inexistente en el catálogo (Activo) queda null y agrega error puntual — fila ERROR", async () => {
    // Catálogo del beforeEach solo tiene AL30 — "GAAL" no aparece ni exacto,
    // ni por alias, ni por sufijo D, ni por distancia de edición pequeña.
    const parseResult = makeGridParseResult({ ticker: "GAAL", cantidad: "408", precio: "8.205", montoNetoReferencia: "3348.84" });
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(1);
    expect(mocks.findManyActivo).toHaveBeenCalled();
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.ticker).toBeUndefined(); // columna resuelta: null → undefined en el create data
    expect(filaData.erroresJson).toContain("Ticker no reconocido: GAAL");
    // El texto OCR original se conserva intacto en rawJson pese a que la columna quedó null.
    expect((filaData.rawJson as { ticker: string | null }).ticker).toBe("GAAL");
  });

  it("E-2: cantidad × precio muy por fuera del monto neto (separador perdido) bloquea la fila con 'Cantidad no confiable.', nunca se corrige", async () => {
    // 408 × 8.205.000 (separador decimal perdido por el OCR) vs monto real 3.352.996 — 1000x de diferencia.
    mocks.findManyActivo.mockResolvedValue([{ ticker: "GGAL" }]);
    const parseResult = makeGridParseResult({
      ticker: "GGAL",
      cantidad: "408",
      precio: "8205000",
      montoNetoReferencia: "3352996.07",
    });
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(1);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.erroresJson).toContain("Cantidad no confiable.");
    expect(filaData.cantidad).toBeUndefined(); // nunca se reemplaza por un valor derivado
  });

  it("E-3: cantidad × precio coherente con el monto no bloquea la fila (caso base, sin discrepancia)", async () => {
    mocks.findManyActivo.mockResolvedValue([{ ticker: "GGAL" }]);
    const parseResult = makeGridParseResult({
      ticker: "GGAL",
      cantidad: "100",
      precio: "41200",
      montoNetoReferencia: "4120000", // 100 × 41200 = 4.120.000: coherente con 100, no dispara nada
    });
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    // Con 100 × 41200 = monto exacto, esta combinación YA es coherente —
    // ver E4.6C.2-1 para el caso real de re-derivación (AL30D).
    expect(result.filasConError).toBe(0);
  });

  it("E-4: cantidad y precio coherentes con el monto (dentro de tolerancia por gastos) no agregan error", async () => {
    // 408 × 8.205,000 ≈ 3.347.640 vs monto 3.352.996,07 — diferencia ~0.16%, normal por comisión.
    mocks.findManyActivo.mockResolvedValue([{ ticker: "GGAL" }]);
    const parseResult = makeGridParseResult({
      ticker: "GGAL",
      cantidad: "408",
      precio: "8205.000",
      montoNetoReferencia: "3352996.07",
    });
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(0);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.erroresJson).toBeUndefined();
    expect(filaData.ticker).toBe("GGAL");
  });

  it("E-5: CAUCION nunca pasa por la validación de ticker/cantidad×precio de compra-venta, pero SÍ valida principal vs. monto a cobrar (coherente aquí)", async () => {
    const parseResult = makeGridParseResult({
      rawOperacion: "CAUCION COLOCADORA",
      operacionBase: "CAUCION_COLOCADORA",
      ticker: null,
      cantidad: "87440200.00",
      precio: null,
      montoNetoReferencia: null,
      tasaCaucion: "22.90",
      montoCobrarReferencia: "87492602.86",
    });
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(0);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.ticker).toBeUndefined();
    expect(filaData.cantidad).toBe("87440200.00"); // principal conservado — es coherente con el monto a cobrar
  });

  it("E4.6C.3-2: CAUCION — principal 402000 frente al monto a cobrar real 87492602.86 (diferencia de magnitud) queda null + ERROR, nunca se infiere desde otra columna", async () => {
    const parseResult = makeGridParseResult({
      rawOperacion: "CAUCION COLOCADORA",
      operacionBase: "CAUCION_COLOCADORA",
      ticker: null,
      cantidad: "402000",
      precio: null,
      montoNetoReferencia: null,
      tasaCaucion: "22.90",
      montoCobrarReferencia: "87492602.86",
    });
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(1);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.cantidad).toBeUndefined(); // principal anulado, nunca reemplazado por un valor inferido
    expect(filaData.erroresJson).toEqual(expect.arrayContaining([expect.stringMatching(/Principal no confiable/)]));
    // El valor OCR original queda intacto en rawJson.
    expect((filaData.rawJson as { cantidad: string | null }).cantidad).toBe("402000");
  });

  it("E4.6C.3-5: ticker resuelto por sufijo D (fuzzy) sin ningún otro problema en la fila queda ADVERTENCIA, nunca ERROR ni RESUELTA — exige revisión explícita antes de LISTA", async () => {
    mocks.findManyActivo.mockResolvedValue([{ ticker: "AL30" }]);
    const parseResult = makeGridParseResult({
      ticker: "AL30D",
      cantidad: "408",
      precio: "8205.000",
      montoNetoReferencia: "3348840.00", // 408 × 8205 = exactamente coherente
    });
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(0);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.estado).toBe("ADVERTENCIA");
    expect(filaData.ticker).toBe("AL30D");
    expect(filaData.warningsJson).toEqual(expect.arrayContaining([expect.stringMatching(/AL30D/)]));
  });

  it("E4.6C.3-6: de punta a punta — dos lecturas ilegibles de cantidad (campo obligatorio) llegan como 'Cantidad no detectado.' y la fila queda ERROR", async () => {
    mocks.findManyActivo.mockResolvedValue([{ ticker: "AL30" }]);
    const realOp = buildOpFromGridRow(
      {
        OPERACION: "COMPRA",
        FECHA_CONC: "14-07-26",
        TICKER: "AL30",
        CANTIDAD: `${encodeOcrCandidate("###", 15)}${OCR_CANDIDATE_SEPARATOR}${encodeOcrCandidate("", 0)}`,
        PRECIO: "65,25",
        MONTO: "$6.525,00",
        PLAZO: "24hs",
      },
      1,
    );
    const parseResult = makeGridParseResult(realOp);
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(1);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.estado).toBe("ERROR");
    expect(filaData.erroresJson).toContain("Cantidad no detectado.");
    expect(filaData.cantidad).toBeUndefined();
  });

  it("E4.6C.3-7: de punta a punta — lectura única de baja confianza llega como 'Cantidad no confiable.' y la fila queda ERROR", async () => {
    mocks.findManyActivo.mockResolvedValue([{ ticker: "AL30" }]);
    const realOp = buildOpFromGridRow(
      {
        OPERACION: "COMPRA",
        FECHA_CONC: "14-07-26",
        TICKER: "AL30",
        CANTIDAD: `${encodeOcrCandidate("54625", 30)}${OCR_CANDIDATE_SEPARATOR}${encodeOcrCandidate("###", 0)}`,
        PRECIO: "65,25",
        MONTO: "$3.564.281,25",
        PLAZO: "24hs",
      },
      1,
    );
    const parseResult = makeGridParseResult(realOp);
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(1);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.estado).toBe("ERROR");
    expect(filaData.erroresJson).toContain("Cantidad no confiable.");
    expect(filaData.cantidad).toBeUndefined();
  });

  it("E4.6C.3-8: de punta a punta — lectura única confiable y coherente con el resto de la fila se acepta, la fila queda ADVERTENCIA (nunca ERROR)", async () => {
    mocks.findManyActivo.mockResolvedValue([{ ticker: "AL30" }]);
    const realOp = buildOpFromGridRow(
      {
        OPERACION: "COMPRA",
        FECHA_CONC: "14-07-26",
        TICKER: "AL30",
        CANTIDAD: `${encodeOcrCandidate("100", 88)}${OCR_CANDIDATE_SEPARATOR}${encodeOcrCandidate("###", 0)}`,
        PRECIO: "65,25",
        MONTO: "$6.525,00", // 100 × 65,25 = 6.525 — coherente
        PLAZO: "24hs",
      },
      1,
    );
    const parseResult = makeGridParseResult(realOp);
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(0);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.estado).toBe("ADVERTENCIA");
    expect(filaData.cantidad).toBe("100");
  });

  it("E-6: fuera del modo GRID (modo GENERIC_OCR o ausente), el mismo ticker inexistente NO se valida contra el catálogo", async () => {
    const parseResult = makeParseResult(1);
    // Sin modo === "GRID" — el endurecimiento de E4.6C.1/E4.6C.2 no aplica a este flujo.
    parseResult.bloques[0].operaciones[0].ticker = "GAAL";
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(mocks.findManyActivo).not.toHaveBeenCalled();
    expect(result.filasConError).toBe(0);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.ticker).toBe("GAAL");
  });

  it("E-7: cantidad negativa o cero queda ERROR con 'Cantidad inválida.'", async () => {
    mocks.findManyActivo.mockResolvedValue([{ ticker: "GGAL" }]);
    const parseResult = makeGridParseResult({ ticker: "GGAL", cantidad: "0", precio: "100", montoNetoReferencia: null });
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(1);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.erroresJson).toContain("Cantidad inválida.");
  });
});

describe("processBolsaImageUpload — comitente global, catálogo compartido y coherencia (E4.6C.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueArchivo.mockResolvedValue(null);
    mocks.findFirstLote.mockResolvedValue(null);
    mocks.findUniqueLote.mockResolvedValue(null);
    mocks.findManyComitente.mockResolvedValue([]);
    mocks.findManyCartera.mockResolvedValue([{ id: "cart-daniel", nombre: "Daniel", comitenteNumber: "11538" }]);
    mocks.findManyActivo.mockResolvedValue([{ ticker: "AL30" }, { ticker: "AL41" }]);
    mocks.findManyBrokerTickerAlias.mockResolvedValue([]);
  });

  it("E4.6C.3-1: AL30D — ticker se resuelve por sufijo D con warning, pero cantidad 546295 incoherente con precio×monto queda null + ERROR (nunca se corrige)", async () => {
    const parseResult = makeParseResult(1);
    parseResult.modo = "GRID";
    Object.assign(parseResult.bloques[0].operaciones[0], {
      ticker: "AL30D",
      cantidad: "546295",
      precio: "0.5615",
      montoNetoReferencia: "30673.03",
    });
    setupTransaction();

    const result = await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    expect(result.filasConError).toBe(1);
    const filaData = mocks.createFila.mock.calls[0][0].data;
    // Ticker: AL30D no está literal en el catálogo, pero AL30 sí — variante dólar/MEP reconocida con warning (ADVERTENCIA).
    expect(filaData.ticker).toBe("AL30D");
    expect(filaData.warningsJson).toEqual(expect.arrayContaining([expect.stringMatching(/AL30D/)]));
    // Cantidad: 546295 × 0.5615 ≈ 306.744 vs monto real 30.673,03 — ratio ~10x, incoherente -> nunca se corrige, queda null + error.
    expect(filaData.cantidad).toBeUndefined();
    expect(filaData.erroresJson).toContain("Cantidad no confiable.");
    // El valor OCR original de ambos campos queda intacto en rawJson pese al null.
    const raw = filaData.rawJson as { ticker: string | null; cantidad: string | null };
    expect(raw.ticker).toBe("AL30D");
    expect(raw.cantidad).toBe("546295");
  });

  it("E4.6C.2-2: el catálogo de tickers se trae con la misma consulta sin filtro que usa el alta manual (bolsa/nueva)", async () => {
    const parseResult = makeParseResult(1);
    parseResult.modo = "GRID";
    setupTransaction();

    await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    // prisma.activo.findMany() sin where — igual que src/app/(dashboard)/bolsa/nueva/page.tsx.
    expect(mocks.findManyActivo).toHaveBeenCalledWith(expect.objectContaining({ select: { ticker: true } }));
    const callArg = mocks.findManyActivo.mock.calls[0][0];
    expect(callArg.where).toBeUndefined();
  });

  it("E4.6C.2-3: las 11 filas (simuladas con 3 bloques) comparten el mismo destino de comitente resuelto", async () => {
    const base = makeParseResult(1).bloques[0].operaciones[0];
    const parseResult: BolsaImageParseResult = {
      modo: "GRID",
      bloques: [
        { numeroBloque: 1, nombreDetectado: "DANIEL", nroComitenteDetectado: "11538", operaciones: [base], warnings: [], errors: [] },
        { numeroBloque: 2, nombreDetectado: "DANIEL", nroComitenteDetectado: "11538", operaciones: [base, base], warnings: [], errors: [] },
        { numeroBloque: 3, nombreDetectado: "DANIEL", nroComitenteDetectado: "11538", operaciones: [base], warnings: [], errors: [] },
      ],
      warningsGlobales: [],
      erroresGlobales: [],
      totalOperaciones: 4,
    };
    mocks.findManyCartera.mockResolvedValue([{ id: "cart-daniel", nombre: "DANIEL", comitenteNumber: "11538" }]);
    setupTransaction();

    await processBolsaImageUpload(makeInput({ parseResult }), "user-1");

    const allFilaData = mocks.createFila.mock.calls.map((c) => c[0].data);
    expect(allFilaData).toHaveLength(4);
    expect(allFilaData.every((f) => f.carteraResueltaId === "cart-daniel")).toBe(true);
    expect(allFilaData.every((f) => f.tipoSujeto === "CARTERA")).toBe(true);
  });
});
