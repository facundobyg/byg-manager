import { describe, it, expect, beforeEach, vi } from "vitest";
import type { BolsaExcelBloque, BolsaExcelParseResult, BolsaExcelRawOp } from "@/lib/importers/bolsa-excel/types";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
// vi.hoisted permite referenciar los mocks desde los factories de vi.mock

const mocks = vi.hoisted(() => ({
  parseBolsaExcel: vi.fn(),
  findUniqueArchivo: vi.fn(),
  findManyComitente: vi.fn(),
  transaction: vi.fn(),
  createLote: vi.fn(),
  createArchivo: vi.fn(),
  createFila: vi.fn(),
}));

vi.mock("@/lib/importers/bolsa-excel/parser", () => ({
  parseBolsaExcel: mocks.parseBolsaExcel,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bolsaImportArchivo: { findUnique: mocks.findUniqueArchivo },
    comitenteInversion: { findMany: mocks.findManyComitente },
    $transaction: mocks.transaction,
  },
}));

import { processBolsaExcelUpload } from "./process-upload";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeXlsxFile(name = "ops.xlsx", size = 1024): File {
  const buf = Buffer.alloc(size, 0x50);
  return new File([buf], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function makeFormData(file: File, fechaOperativa: string | null = "2026-07-14"): FormData {
  const fd = new FormData();
  fd.set("file", file);
  if (fechaOperativa !== null) fd.set("fechaOperativa", fechaOperativa);
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
  // Sin comitentes por defecto
  mocks.findManyComitente.mockResolvedValue([]);
  // Parser vacío por defecto
  mocks.parseBolsaExcel.mockReturnValue(emptyParseResult());

  // Retornos de los creates dentro de la transacción
  mocks.createLote.mockResolvedValue({ id: "lote-1", createdAt: new Date() });
  mocks.createArchivo.mockResolvedValue({ id: "arch-1", loteId: "lote-1", createdAt: new Date() });
  mocks.createFila.mockResolvedValue({});

  // La transacción llama al callback con un tx mock
  mocks.transaction.mockImplementation(
    async (callback: (tx: {
      bolsaImportLote: { create: typeof mocks.createLote };
      bolsaImportArchivo: { create: typeof mocks.createArchivo };
      bolsaImportFila: { create: typeof mocks.createFila };
    }) => Promise<unknown>) => {
      return callback({
        bolsaImportLote: { create: mocks.createLote },
        bolsaImportArchivo: { create: mocks.createArchivo },
        bolsaImportFila: { create: mocks.createFila },
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
