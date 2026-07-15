import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  findUniqueArchivo: vi.fn(),
  findFirstLote: vi.fn(),
  findManyComitente: vi.fn(),
  transaction: vi.fn(),
  createLote: vi.fn(),
  updateLote: vi.fn(),
  createArchivo: vi.fn(),
  createFila: vi.fn(),
}));

// Transitive dep: process-upload.ts → resolveComitente → parseBolsaExcel
vi.mock("@/lib/importers/bolsa-excel/parser", () => ({
  parseBolsaExcel: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bolsaImportArchivo: { findUnique: mocks.findUniqueArchivo },
    bolsaImportLote: { findFirst: mocks.findFirstLote },
    comitenteInversion: { findMany: mocks.findManyComitente },
    $transaction: mocks.transaction,
  },
}));

import { processBolsaImageUpload } from "./process-upload-image";
import type { BolsaImageParseResult } from "@/lib/importers/bolsa-image/types";

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

function makeInput(overrides?: Partial<{ parseResult: BolsaImageParseResult; fileName: string; fileSize: number }>) {
  return {
    parseResult: overrides?.parseResult ?? makeParseResult(1),
    fileName: overrides?.fileName ?? "ops.jpg",
    fileSize: overrides?.fileSize ?? 1024,
    mimeType: "image/jpeg" as const,
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
      bolsaImportArchivo: { create: mocks.createArchivo.mockResolvedValue(archivo) },
      bolsaImportFila: { create: mocks.createFila.mockResolvedValue({ id: "fila-x" }) },
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
    mocks.findManyComitente.mockResolvedValue([
      { id: "comitente-1", nombre: "Juan Perez", esPropioBYG: false, carteraId: null },
    ]);
  });

  // ── T-IMG-1: invalid parseResult structure ────────────────────────────────
  it("T-IMG-1: returns error for invalid parseResult structure", async () => {
    const result = await processBolsaImageUpload(
      { parseResult: { bloques: "wrong" } as unknown as BolsaImageParseResult, fileName: "x.jpg", fileSize: 0, mimeType: "image/jpeg" },
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
      { parseResult: makeParseResult(1), fileName: "screenshot.png", fileSize: 2048, mimeType: "image/png" },
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
});
