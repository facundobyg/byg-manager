import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  parseBolsaImage: vi.fn(),
  findUniqueArchivo: vi.fn(),
  findFirstLote: vi.fn(),
  findManyComitente: vi.fn(),
  transaction: vi.fn(),
  createLote: vi.fn(),
  updateLote: vi.fn(),
  createArchivo: vi.fn(),
  createFila: vi.fn(),
}));

vi.mock("@/lib/importers/bolsa-image/parser", () => ({
  parseBolsaImage: mocks.parseBolsaImage,
}));

// Transitive dep de process-upload.ts (resolveComitente importa from process-upload.ts
// que a su vez importa parseBolsaExcel) — mock para evitar fallo de resolución
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeImageFile(name = "ops.jpg", sizeBytes = 1024): File {
  return new File([Buffer.alloc(sizeBytes, 0xff)], name, { type: "image/jpeg" });
}

function makeFormData(file: File): FormData {
  const fd = new FormData();
  fd.append("file", file);
  return fd;
}

function makeParseResult(nOps = 1) {
  return {
    bloques: [
      {
        numeroBloque: 1,
        nombreDetectado: "Juan Perez",
        nroComitenteDetectado: "12345",
        operaciones: Array.from({ length: nOps }, (_, i) => ({
          numeroFila: i + 1,
          rawOperacion: `Compra AL30 48hs #${i}`,
          operacionBase: "COMPRA",
          fechaConcertacion: "2024-07-10",
          ticker: "AL30",
          cantidad: "1000",
          precio: "65",
          monedaDetectada: "USD",
          montoNetoReferencia: "65000",
          plazo: "48hs",
          plazoNormalizado: "48HS",
          fechaVencimiento: null,
          tasaCaucion: null,
          montoCobrarReferencia: null,
          montoPagarReferencia: null,
          instrumentoHint: "bono",
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

describe("processBolsaImageUpload (single image per request)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueArchivo.mockResolvedValue(null);
    mocks.findFirstLote.mockResolvedValue(null);
    mocks.findManyComitente.mockResolvedValue([
      { id: "comitente-1", nombre: "Juan Perez", esPropioBYG: false, carteraId: null },
    ]);
    mocks.parseBolsaImage.mockResolvedValue(makeParseResult(1));
  });

  // ── T-IMG-1: sin archivo ───────────────────────────────────────────────────
  it("T-IMG-1: returns error when no file attached", async () => {
    const result = await processBolsaImageUpload(new FormData(), "user-1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/ninguna imagen/i);
  });

  // ── T-IMG-2: extensión inválida ────────────────────────────────────────────
  it("T-IMG-2: returns error for non-image extension", async () => {
    const fd = makeFormData(new File(["x"], "ops.pdf", { type: "application/pdf" }));
    const result = await processBolsaImageUpload(fd, "user-1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no es una imagen/i);
  });

  // ── T-IMG-3: archivo demasiado grande ─────────────────────────────────────
  it("T-IMG-3: returns error for file exceeding 4 MB", async () => {
    const big = new File([Buffer.alloc(5 * 1024 * 1024)], "big.jpg", {
      type: "image/jpeg",
    });
    const result = await processBolsaImageUpload(makeFormData(big), "user-1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/4 MB/);
  });

  // ── T-IMG-4: imagen duplicada ──────────────────────────────────────────────
  it("T-IMG-4: returns DUPLICADO when hash already exists", async () => {
    mocks.findUniqueArchivo.mockResolvedValue({
      id: "archivo-prev",
      loteId: "lote-prev",
      createdAt: new Date("2024-07-01T00:00:00Z"),
      estado: "LISTO",
    });
    const result = await processBolsaImageUpload(makeFormData(makeImageFile()), "user-1");
    expect(result.ok).toBe(true);
    expect(result.estado).toBe("DUPLICADO");
    expect(result.archivoExistente?.loteId).toBe("lote-prev");
    expect(result.archivoExistente?.estadoArchivo).toBe("LISTO");
    expect(mocks.parseBolsaImage).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // ── T-IMG-5: imagen válida → REVISION_PENDIENTE ───────────────────────────
  it("T-IMG-5: valid image creates lote and returns REVISION_PENDIENTE", async () => {
    setupTransaction("lote-img-1", "archivo-img-1");
    const result = await processBolsaImageUpload(makeFormData(makeImageFile("ops.jpg")), "user-1");
    expect(result.ok).toBe(true);
    expect(result.estado).toBe("REVISION_PENDIENTE");
    expect(result.loteId).toBe("lote-img-1");
    expect(result.totalFilas).toBe(1);
    expect(result.filasResuelta).toBe(1);
    expect(result.filasConError).toBe(0);
    expect(result.filasConAdvertencia).toBe(0);
  });

  // ── T-IMG-6: lote creado con origen IMAGEN ────────────────────────────────
  it("T-IMG-6: lote is created with origen IMAGEN and estado REVISION_PENDIENTE", async () => {
    setupTransaction();
    await processBolsaImageUpload(makeFormData(makeImageFile()), "user-1");
    const loteData = mocks.createLote.mock.calls[0][0].data;
    expect(loteData.origen).toBe("IMAGEN");
    expect(loteData.estado).toBe("REVISION_PENDIENTE");
    expect(loteData.creadoPorId).toBe("user-1");
  });

  // ── T-IMG-7: segunda imagen con existingLoteId → update en vez de create ──
  it("T-IMG-7: second image with existingLoteId increments lote counters instead of creating", async () => {
    mocks.findFirstLote.mockResolvedValue({ id: "lote-1", creadoPorId: "user-1" });
    mocks.parseBolsaImage.mockResolvedValue(makeParseResult(3)); // 3 ops
    setupTransaction("lote-1", "archivo-2");

    const result = await processBolsaImageUpload(makeFormData(makeImageFile("b.jpg")), "user-1", "lote-1");

    expect(result.ok).toBe(true);
    expect(result.estado).toBe("REVISION_PENDIENTE");
    expect(result.loteId).toBe("lote-1");

    // No debe crear un lote nuevo
    expect(mocks.createLote).not.toHaveBeenCalled();
    // Debe hacer update
    expect(mocks.updateLote).toHaveBeenCalledTimes(1);
    const updateCall = mocks.updateLote.mock.calls[0][0];
    expect(updateCall.where.id).toBe("lote-1");
    expect(updateCall.data.totalFilas.increment).toBe(3);
  });

  // ── T-IMG-8: existingLoteId inválido o sin permisos ──────────────────────
  it("T-IMG-8: existingLoteId not owned by user returns error", async () => {
    mocks.findFirstLote.mockResolvedValue(null); // not found for this user
    const result = await processBolsaImageUpload(
      makeFormData(makeImageFile()),
      "user-1",
      "lote-ajeno",
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/lote no encontrado/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  // ── T-IMG-9: segunda imagen fallida → archivo ERROR, lote no se recrea ────
  it("T-IMG-9: parse error on second image marks archivo ERROR, does not create new lote", async () => {
    mocks.findFirstLote.mockResolvedValue({ id: "lote-1", creadoPorId: "user-1" });
    mocks.parseBolsaImage.mockRejectedValueOnce(new Error("El modelo de visión tardó demasiado."));
    setupTransaction("lote-1", "archivo-2");

    const result = await processBolsaImageUpload(
      makeFormData(makeImageFile("bad.jpg")),
      "user-1",
      "lote-1",
    );

    expect(result.ok).toBe(true);
    expect(result.estado).toBe("FALLIDO");
    expect(result.error).toMatch(/tardó demasiado/i);
    expect(mocks.createLote).not.toHaveBeenCalled();
    expect(mocks.updateLote).toHaveBeenCalledTimes(1);
    const archivoData = mocks.createArchivo.mock.calls[0][0].data;
    expect(archivoData.estado).toBe("ERROR");
    expect(archivoData.errorMessage).toMatch(/tardó demasiado/i);
  });

  // ── T-IMG-10: primera imagen fallida → lote FALLIDO, archivo ERROR ────────
  it("T-IMG-10: parse error on first image creates lote FALLIDO", async () => {
    mocks.parseBolsaImage.mockRejectedValueOnce(new Error("API timeout"));
    setupTransaction("lote-err", "archivo-err");

    const result = await processBolsaImageUpload(makeFormData(makeImageFile()), "user-1");

    expect(result.ok).toBe(true);
    expect(result.estado).toBe("FALLIDO");
    expect(result.error).toMatch(/API timeout/);
    expect(mocks.createLote).toHaveBeenCalledTimes(1);
    const loteData = mocks.createLote.mock.calls[0][0].data;
    expect(loteData.estado).toBe("FALLIDO");
    const archivoData = mocks.createArchivo.mock.calls[0][0].data;
    expect(archivoData.estado).toBe("ERROR");
    expect(archivoData.errorMessage).toMatch(/API timeout/);
  });

  // ── T-IMG-11: API timeout propagado ──────────────────────────────────────
  it("T-IMG-11: AbortError-style timeout is captured as parseError", async () => {
    const err = Object.assign(new Error("El modelo de visión tardó demasiado. Intentá de nuevo."), {
      name: "AbortError",
    });
    mocks.parseBolsaImage.mockRejectedValueOnce(err);
    setupTransaction();

    const result = await processBolsaImageUpload(makeFormData(makeImageFile()), "user-1");
    expect(result.estado).toBe("FALLIDO");
    expect(result.error).toMatch(/tardó demasiado/i);
    const archivoData = mocks.createArchivo.mock.calls[0][0].data;
    expect(archivoData.errorMessage).toMatch(/tardó demasiado/i);
  });

  // ── T-IMG-12: JSON inválido propagado ────────────────────────────────────
  it("T-IMG-12: JSON format error from parser is captured as parseError", async () => {
    mocks.parseBolsaImage.mockRejectedValueOnce(
      new Error("El modelo devolvió un formato inesperado. Intentá de nuevo."),
    );
    setupTransaction();

    const result = await processBolsaImageUpload(makeFormData(makeImageFile()), "user-1");
    expect(result.estado).toBe("FALLIDO");
    expect(result.error).toMatch(/formato inesperado/i);
    const archivoData = mocks.createArchivo.mock.calls[0][0].data;
    expect(archivoData.errorMessage).toMatch(/formato inesperado/i);
  });

  // ── T-IMG-17: ANTHROPIC_API_KEY sanitizado en result.error ───────────────
  it("T-IMG-17: ANTHROPIC_API_KEY is not exposed in result.error", async () => {
    mocks.parseBolsaImage.mockRejectedValueOnce(
      new Error("ANTHROPIC_API_KEY no configurada."),
    );
    setupTransaction();

    const result = await processBolsaImageUpload(makeFormData(makeImageFile()), "user-1");
    expect(result.estado).toBe("FALLIDO");
    expect(result.error).toBeDefined();
    expect(result.error).not.toMatch(/ANTHROPIC_API_KEY/);
    expect(result.error).toMatch(/administrador/i);
  });

  // ── T-IMG-13: nunca crea OperacionBolsa ──────────────────────────────────
  it("T-IMG-13: never creates OperacionBolsa — only staging tables touched", async () => {
    setupTransaction();
    await processBolsaImageUpload(makeFormData(makeImageFile()), "user-1");

    // Verificar que solo se llama a create de bolsaImportFila (no operacionBolsa)
    expect(mocks.createFila).toHaveBeenCalled();
    // El mock de prisma no tiene operacionBolsa — si el código intentara accederlo, explotaría
    // Verificamos que los únicos creates son lote, archivo y fila
    expect(mocks.createLote).toHaveBeenCalledTimes(1);
    expect(mocks.createArchivo).toHaveBeenCalledTimes(1);
    expect(mocks.createFila).toHaveBeenCalledTimes(1);
  });

  // ── T-IMG-14: CARTERA comitente ───────────────────────────────────────────
  it("T-IMG-14: maps CARTERA comitente via esPropioBYG+carteraId", async () => {
    mocks.findManyComitente.mockResolvedValue([
      { id: "comitente-byg", nombre: "BYG Propia", esPropioBYG: true, carteraId: "cartera-byg" },
    ]);
    setupTransaction();

    await processBolsaImageUpload(makeFormData(makeImageFile()), "user-1");

    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.carteraResueltaId).toBe("cartera-byg");
    expect(filaData.comitenteResueltoId).toBeUndefined();
    expect(filaData.tipoSujeto).toBe("CARTERA");
  });

  // ── T-IMG-15: PNG → image/png mimeType ───────────────────────────────────
  it("T-IMG-15: PNG file gets image/png mimeType in archivo", async () => {
    setupTransaction();
    await processBolsaImageUpload(makeFormData(makeImageFile("screenshot.png")), "user-1");
    const archivoData = mocks.createArchivo.mock.calls[0][0].data;
    expect(archivoData.mimeType).toBe("image/png");
    expect(archivoData.origen).toBe("IMAGEN");
  });

  // ── T-IMG-16: CAUCION_COLOCADORA → tipoOperacionResuelta ─────────────────
  it("T-IMG-16: CAUCION_COLOCADORA maps to tipoOperacionResuelta", async () => {
    mocks.parseBolsaImage.mockResolvedValue({
      bloques: [
        {
          numeroBloque: 1,
          nombreDetectado: "Juan Perez",
          nroComitenteDetectado: "12345",
          operaciones: [
            {
              numeroFila: 1,
              rawOperacion: "Caución colocadora",
              operacionBase: "CAUCION_COLOCADORA",
              fechaConcertacion: "2024-07-10",
              ticker: null,
              cantidad: null,
              precio: null,
              monedaDetectada: "ARS",
              montoNetoReferencia: "1000000",
              plazo: "7",
              plazoNormalizado: "7",
              fechaVencimiento: "2024-07-17",
              tasaCaucion: "42.5",
              montoCobrarReferencia: "1008137",
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
    });
    setupTransaction();

    await processBolsaImageUpload(makeFormData(makeImageFile()), "user-1");

    const filaData = mocks.createFila.mock.calls[0][0].data;
    expect(filaData.tipoOperacionResuelta).toBe("CAUCION_COLOCADORA");
    expect(filaData.tasaCaucion).toBe("42.5");
    expect(filaData.montoCobrarReferencia).toBe("1008137");
    expect(filaData.fechaVencimiento).toEqual(new Date("2024-07-17"));
  });
});
