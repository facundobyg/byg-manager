import { describe, it, expect } from "vitest";
import {
  groupWordsIntoRows,
  detectTableHeader,
  detectComitenteInRow,
  isIgnoredRow,
  parseArgNumber,
  parseDate,
  parseDataRow,
  reconstructBolsaBlocks,
  extractOcrWords,
  type OcrWord,
  type OcrPage,
} from "./ocr-bolsa";

// ── Helpers ────────────────────────────────────────────────────────────────

function w(
  text: string,
  x0: number,
  y0: number,
  x1?: number,
  y1?: number,
  confidence = 90,
): OcrWord {
  return {
    text,
    bbox: { x0, y0, x1: x1 ?? x0 + text.length * 8, y1: y1 ?? y0 + 14 },
    confidence,
  };
}

// Simulates a full two-comitente image with COMPRA + VENTA + CAUCION_COLOCADORA
function makeFullWordSet(): OcrWord[] {
  const words: OcrWord[] = [
    // ── Comitente 1 header (y~20) ─────────────────────────────────────────
    w("JUAN", 10, 15, 50, 28),
    w("PEREZ", 55, 15, 100, 28),
    w("12345", 110, 15, 150, 28),

    // ── Table header (y~45) ────────────────────────────────────────────────
    w("OPERACION", 10, 40, 90, 54),
    w("FECHA", 100, 40, 140, 54),
    w("BONO", 150, 40, 185, 54),
    w("VN", 195, 40, 215, 54),
    w("PRECIO", 225, 40, 265, 54),
    w("MONTO", 275, 40, 315, 54),
    w("PLAZO", 325, 40, 365, 54),
    w("VTO", 375, 40, 405, 54),

    // ── Row 1: COMPRA AL30 48HS (y~70) ────────────────────────────────────
    w("COMPRA", 10, 65, 60, 79),
    w("10/07/2024", 100, 65, 165, 79),
    w("AL30", 150, 65, 185, 79),
    w("10.000", 195, 65, 235, 79),
    w("65,25", 225, 65, 265, 79),
    w("652.500", 275, 65, 315, 79),
    w("48HS", 325, 65, 360, 79),

    // ── Row 2: VENTA GD30 CI (y~90) ───────────────────────────────────────
    w("VENTA", 10, 85, 55, 99),
    w("10/07/2024", 100, 85, 165, 99),
    w("GD30", 150, 85, 185, 99),
    w("5.000", 195, 85, 225, 99),
    w("73,10", 225, 85, 265, 99),
    w("365.500", 275, 85, 315, 99),
    w("CI", 325, 85, 345, 99),

    // ── Ignored row: Resultado pesos (y~110) ──────────────────────────────
    w("Resultado", 10, 105, 80, 119),
    w("pesos", 85, 105, 130, 119),
    w("1.000.000", 140, 105, 220, 119),

    // ── Comitente 2 header (y~135) ────────────────────────────────────────
    w("MARIA", 10, 130, 55, 143),
    w("GARCIA", 60, 130, 110, 143),
    w("67890", 115, 130, 160, 143),

    // ── Table header 2 (y~160) ────────────────────────────────────────────
    w("OPERACION", 10, 155, 90, 169),
    w("FECHA", 100, 155, 140, 169),
    w("BONO", 150, 155, 185, 169),
    w("VN", 195, 155, 215, 169),
    w("PRECIO", 225, 155, 265, 169),
    w("MONTO", 275, 155, 315, 169),
    w("PLAZO", 325, 155, 365, 169),
    w("TASA", 375, 155, 410, 169),

    // ── Row 3: CAUCION_COLOCADORA (y~185) ─────────────────────────────────
    w("CAUCION", 10, 180, 70, 194),
    w("COLOCADORA", 75, 180, 155, 194),
    w("10/07/2024", 100, 180, 165, 194),
    w("1.000.000", 195, 180, 275, 194),
    w("25,50", 225, 180, 265, 194),
    w("1.025.000", 275, 180, 355, 194),
    w("7", 325, 180, 340, 194),
    w("42,5", 375, 180, 410, 194),
  ];
  return words;
}

// ── groupWordsIntoRows ──────────────────────────────────────────────────────

describe("groupWordsIntoRows", () => {
  it("OCR-1: groups words at same Y into one row", () => {
    const words = [w("A", 10, 10), w("B", 50, 12), w("C", 100, 11)];
    const rows = groupWordsIntoRows(words);
    expect(rows).toHaveLength(1);
    expect(rows[0].map((x) => x.text)).toEqual(["A", "B", "C"]);
  });

  it("OCR-2: separates words more than rowGap apart", () => {
    const words = [w("A", 10, 10), w("B", 10, 30), w("C", 10, 50)];
    const rows = groupWordsIntoRows(words, 10);
    expect(rows).toHaveLength(3);
  });

  it("OCR-3: sorts words within a row by X", () => {
    const words = [w("Z", 100, 10), w("A", 10, 10), w("M", 55, 10)];
    const rows = groupWordsIntoRows(words);
    expect(rows[0].map((x) => x.text)).toEqual(["A", "M", "Z"]);
  });

  it("OCR-4: returns empty for empty input", () => {
    expect(groupWordsIntoRows([])).toHaveLength(0);
  });
});

// ── detectTableHeader ───────────────────────────────────────────────────────

describe("detectTableHeader", () => {
  it("OCR-5: detects header row with 3+ column keywords", () => {
    const row = [
      w("OPERACION", 10, 10),
      w("FECHA", 100, 10),
      w("BONO", 150, 10),
      w("VN", 200, 10),
      w("PRECIO", 230, 10),
    ];
    const result = detectTableHeader(row);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("OPERACION");
    expect(result).toHaveProperty("FECHA");
  });

  it("OCR-6: returns null for row with fewer than 3 column keywords", () => {
    const row = [w("OPERACION", 10, 10), w("FECHA", 100, 10), w("precio", 50, 10)];
    // 2 actual column keywords (OCR-5 needs 3 distinct) — PRECIO would be 3
    // Let's test with just 2 unique ones
    const row2 = [w("OPERACION", 10, 10), w("texto", 100, 10), w("libre", 150, 10)];
    expect(detectTableHeader(row2)).toBeNull();
  });

  it("OCR-7: maps column center X correctly", () => {
    // OPERACION centered at x ~30 (bbox 10-50)
    const row = [
      w("OPERACION", 10, 10, 50, 24),  // cx = 30
      w("FECHA", 100, 10, 140, 24),     // cx = 120
      w("VN", 200, 10, 220, 24),        // cx = 210
    ];
    const result = detectTableHeader(row);
    expect(result?.OPERACION?.cx).toBeCloseTo(30);
    expect(result?.FECHA?.cx).toBeCloseTo(120);
    expect(result?.CANTIDAD?.cx).toBeCloseTo(210);
  });
});

// ── detectComitenteInRow ────────────────────────────────────────────────────

describe("detectComitenteInRow", () => {
  it("OCR-8: detects nombre and numero", () => {
    const row = [w("JUAN", 10, 10), w("PEREZ", 55, 10), w("12345", 110, 10)];
    const result = detectComitenteInRow(row);
    expect(result).not.toBeNull();
    expect(result?.numero).toBe("12345");
    expect(result?.nombre).toMatch(/JUAN/);
  });

  it("OCR-9: returns null when no 5-6 digit number present", () => {
    const row = [w("OPERACION", 10, 10), w("FECHA", 100, 10)];
    expect(detectComitenteInRow(row)).toBeNull();
  });

  it("OCR-10: handles comitente with 6-digit number", () => {
    const row = [w("EMPRESA", 10, 10), w("SA", 70, 10), w("987654", 110, 10)];
    const result = detectComitenteInRow(row);
    expect(result?.numero).toBe("987654");
  });
});

// ── isIgnoredRow ────────────────────────────────────────────────────────────

describe("isIgnoredRow", () => {
  it("OCR-11: ignores 'Resultado pesos' row", () => {
    expect(isIgnoredRow([w("Resultado", 10, 10), w("pesos", 80, 10)])).toBe(true);
  });

  it("OCR-12: ignores 'Resultado USD' row", () => {
    expect(isIgnoredRow([w("Resultado", 10, 10), w("USD", 80, 10)])).toBe(true);
  });

  it("OCR-13: ignores 'Tipo de cambio' row", () => {
    expect(isIgnoredRow([w("Tipo", 10, 10), w("de", 50, 10), w("cambio", 70, 10)])).toBe(true);
  });

  it("OCR-14: ignores subtotal row", () => {
    expect(isIgnoredRow([w("Subtotal", 10, 10), w("100.000", 80, 10)])).toBe(true);
  });

  it("OCR-15: does not ignore normal operation row", () => {
    expect(isIgnoredRow([w("COMPRA", 10, 10), w("AL30", 80, 10)])).toBe(false);
  });
});

// ── parseArgNumber ──────────────────────────────────────────────────────────

describe("parseArgNumber", () => {
  it("OCR-16: parses Argentine decimal '1.234,56'", () => {
    expect(parseArgNumber("1.234,56")).toBe("1234.56");
  });

  it("OCR-17: parses Argentine integer '1.234.567'", () => {
    expect(parseArgNumber("1.234.567")).toBe("1234567");
  });

  it("OCR-18: parses bare integer '10000'", () => {
    expect(parseArgNumber("10000")).toBe("10000");
  });

  it("OCR-19: parses standard decimal '65.25'", () => {
    expect(parseArgNumber("65.25")).toBe("65.25");
  });

  it("OCR-20: strips $ sign", () => {
    expect(parseArgNumber("$1.000")).toBe("1000");
  });

  it("OCR-21: returns null for non-numeric string", () => {
    expect(parseArgNumber("N/A")).toBeNull();
    expect(parseArgNumber("")).toBeNull();
  });
});

// ── parseDate ───────────────────────────────────────────────────────────────

describe("parseDate", () => {
  it("OCR-22: parses DD/MM/YYYY", () => {
    expect(parseDate("10/07/2024")).toBe("2024-07-10");
  });

  it("OCR-23: parses DD-MM-YYYY", () => {
    expect(parseDate("05-03-2024")).toBe("2024-03-05");
  });

  it("OCR-24: returns already ISO date as-is", () => {
    expect(parseDate("2024-07-10")).toBe("2024-07-10");
  });

  it("OCR-25: returns null for unparseable string", () => {
    expect(parseDate("notadate")).toBeNull();
  });
});

// ── parseDataRow ────────────────────────────────────────────────────────────

describe("parseDataRow", () => {
  const colMap = {
    OPERACION: { cx: 30 },  // x ~10–60
    FECHA: { cx: 130 },     // x ~100–160
    TICKER: { cx: 170 },    // x ~150–190
    CANTIDAD: { cx: 210 },  // x ~190–230
    PRECIO: { cx: 245 },    // x ~225–265
    MONTO: { cx: 295 },     // x ~275–315
    PLAZO: { cx: 342 },     // x ~325–365
  };

  it("OCR-26: parses COMPRA row correctly", () => {
    const row = [
      w("COMPRA", 10, 65, 60, 79),
      w("10/07/2024", 100, 65, 165, 79),
      w("AL30", 150, 65, 185, 79),
      w("10.000", 195, 65, 230, 79),
      w("65,25", 225, 65, 265, 79),
      w("652.500", 275, 65, 315, 79),
      w("48HS", 325, 65, 360, 79),
    ];
    const op = parseDataRow(row, colMap, 1);
    expect(op.operacionBase).toBe("COMPRA");
    expect(op.fechaConcertacion).toBe("2024-07-10");
    expect(op.ticker).toBe("AL30");
    expect(op.cantidad).toBe("10000");
    expect(op.precio).toBe("65.25");
    expect(op.montoNetoReferencia).toBe("652500");
    expect(op.plazoNormalizado).toBe("48HS");
    expect(op.numeroFila).toBe(1);
  });

  it("OCR-27: parses VENTA row correctly", () => {
    const row = [
      w("VENTA", 10, 85, 55, 99),
      w("10/07/2024", 100, 85, 165, 99),
      w("GD30", 150, 85, 185, 99),
      w("5.000", 195, 85, 225, 99),
      w("73,10", 225, 85, 265, 99),
      w("365.500", 275, 85, 315, 99),
      w("CI", 325, 85, 345, 99),
    ];
    const op = parseDataRow(row, colMap, 2);
    expect(op.operacionBase).toBe("VENTA");
    expect(op.ticker).toBe("GD30");
    expect(op.plazoNormalizado).toBe("CI");
    expect(op.errors).toHaveLength(0);
  });

  it("OCR-28: CAUCION_COLOCADORA detected from operation text", () => {
    const colMapCauc = { ...colMap, TASA: { cx: 390 } };
    const row = [
      w("CAUCION", 10, 180, 70, 194),
      w("COLOCADORA", 75, 180, 155, 194),
      w("10/07/2024", 100, 180, 165, 194),
      w("7", 325, 180, 340, 194),
      w("42,5", 375, 180, 410, 194),
    ];
    const op = parseDataRow(row, colMapCauc, 1);
    expect(op.operacionBase).toBe("CAUCION_COLOCADORA");
    expect(op.tasaCaucion).toBe("42.5");
    expect(op.plazoNormalizado).toBe("7");
  });

  it("OCR-29: missing fecha adds error", () => {
    const row = [w("COMPRA", 10, 65, 60, 79), w("AL30", 150, 65, 185, 79)];
    const op = parseDataRow(row, colMap, 1);
    expect(op.fechaConcertacion).toBeNull();
    expect(op.errors).toContain("Fecha no detectada.");
  });

  it("OCR-30: unknown operation adds error", () => {
    const row = [w("DESCONOCIDO", 10, 65, 90, 79), w("10/07/2024", 100, 65, 165, 79)];
    const op = parseDataRow(row, colMap, 1);
    expect(op.operacionBase).toBe("DESCONOCIDA");
    expect(op.errors).toContain("Tipo de operación no reconocido.");
  });

  it("OCR-31: low confidence words (<40) are excluded", () => {
    const row = [
      w("COMPRA", 10, 65, 60, 79, 90),
      w("GARBAGE", 225, 65, 265, 79, 25), // below threshold
      w("10/07/2024", 100, 65, 165, 79, 90),
    ];
    const op = parseDataRow(row, colMap, 1);
    expect(op.precio).toBeNull(); // GARBAGE excluded, no valid PRECIO
  });
});

// ── reconstructBolsaBlocks ──────────────────────────────────────────────────

describe("reconstructBolsaBlocks", () => {
  it("OCR-32: returns empty array for empty input", () => {
    expect(reconstructBolsaBlocks([])).toHaveLength(0);
  });

  it("OCR-33: ignores words with confidence < 30", () => {
    const words = [w("COMPRA", 10, 10, 60, 24, 20)]; // below threshold
    expect(reconstructBolsaBlocks(words)).toHaveLength(0);
  });

  it("OCR-34: reconstructs two comitente blocks from full word set", () => {
    const blocks = reconstructBolsaBlocks(makeFullWordSet());
    expect(blocks).toHaveLength(2);
  });

  it("OCR-35: first block has correct comitente info", () => {
    const blocks = reconstructBolsaBlocks(makeFullWordSet());
    expect(blocks[0].nroComitenteDetectado).toBe("12345");
    expect(blocks[0].nombreDetectado).toMatch(/JUAN/);
  });

  it("OCR-36: second block has correct comitente info", () => {
    const blocks = reconstructBolsaBlocks(makeFullWordSet());
    expect(blocks[1].nroComitenteDetectado).toBe("67890");
    expect(blocks[1].nombreDetectado).toMatch(/MARIA/);
  });

  it("OCR-37: COMPRA and VENTA rows parsed in first block", () => {
    const blocks = reconstructBolsaBlocks(makeFullWordSet());
    const ops = blocks[0].operaciones;
    expect(ops).toHaveLength(2);
    expect(ops[0].operacionBase).toBe("COMPRA");
    expect(ops[1].operacionBase).toBe("VENTA");
  });

  it("OCR-38: CAUCION_COLOCADORA in second block", () => {
    const blocks = reconstructBolsaBlocks(makeFullWordSet());
    const ops = blocks[1].operaciones;
    expect(ops).toHaveLength(1);
    expect(ops[0].operacionBase).toBe("CAUCION_COLOCADORA");
  });

  it("OCR-39: ignored rows excluded from operations", () => {
    const blocks = reconstructBolsaBlocks(makeFullWordSet());
    const allOps = blocks.flatMap((b) => b.operaciones);
    // "Resultado pesos" row must NOT appear as an operation
    expect(allOps.every((op) => !op.rawOperacion.toLowerCase().includes("resultado"))).toBe(true);
  });

  it("OCR-40: Argentine numbers parsed correctly in operations", () => {
    const blocks = reconstructBolsaBlocks(makeFullWordSet());
    const compra = blocks[0].operaciones[0];
    expect(compra.cantidad).toBe("10000");
    expect(compra.precio).toBe("65.25");
    expect(compra.montoNetoReferencia).toBe("652500");
  });

  it("OCR-41: block without comitente header still created (unknown comitente)", () => {
    // Table header and data with no comitente header before it
    const words: OcrWord[] = [
      w("OPERACION", 10, 10, 90, 24),
      w("FECHA", 100, 10, 140, 24),
      w("VN", 150, 10, 170, 24),
      w("PRECIO", 180, 10, 220, 24),
      w("COMPRA", 10, 35, 60, 49),
      w("10/07/2024", 100, 35, 165, 49),
    ];
    const blocks = reconstructBolsaBlocks(words);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].nombreDetectado).toBeNull();
    expect(blocks[0].nroComitenteDetectado).toBeNull();
  });

  it("OCR-46: parses an operation row with no header at all via positional fallback", () => {
    const words: OcrWord[] = [
      w("COMPRA", 10, 10),
      w("10/07/2024", 100, 10),
      w("AL30", 150, 10),
      w("10.000", 195, 10),
    ];
    const blocks = reconstructBolsaBlocks(words);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].operaciones).toHaveLength(1);
    expect(blocks[0].operaciones[0].operacionBase).toBe("COMPRA");
    expect(blocks[0].operaciones[0].fechaConcertacion).toBe("2024-07-10");
  });

  // Synthetic full-document scenario: comitente DANIEL/11538, one table with a
  // single-line header (7 ops), a second table whose header is split across two
  // vertically separated rows (1 caución), a "Tipo de cambio Neto" row that must
  // be ignored, and a third group of 3 ops with no header at all (positional
  // fallback reusing the last known column map). Expected total: 11 operations.
  it("OCR-47: reconstructs 11 operations across split headers, ignored rows and positional fallback", () => {
    const words: OcrWord[] = [
      // Comitente
      w("DANIEL", 10, 10),
      w("11538", 70, 10),

      // Table 1 — single-row header
      w("OPERACION", 10, 40),
      w("FECHA", 100, 40),
      w("BONO", 150, 40),
      w("VN", 195, 40),
      w("PRECIO", 225, 40),
      w("MONTO", 275, 40),
      w("PLAZO", 325, 40),
      w("VTO", 375, 40),

      // Table 1 — 7 operations
      w("COMPRA", 10, 65), w("10/07/2024", 100, 65), w("AL30", 150, 65), w("10.000", 195, 65), w("65,25", 225, 65), w("652.500", 275, 65), w("48HS", 325, 65),
      w("VENTA", 10, 85), w("10/07/2024", 100, 85), w("GD30", 150, 85), w("5.000", 195, 85), w("73,10", 225, 85), w("365.500", 275, 85), w("CI", 325, 85),
      w("COMPRA", 10, 105), w("11/07/2024", 100, 105), w("AE38", 150, 105), w("2.000", 195, 105), w("55,00", 225, 105), w("110.000", 275, 105), w("24HS", 325, 105),
      w("VENTA", 10, 125), w("11/07/2024", 100, 125), w("AL29", 150, 125), w("3.000", 195, 125), w("60,50", 225, 125), w("181.500", 275, 125), w("CI", 325, 125),
      w("COMPRA", 10, 145), w("12/07/2024", 100, 145), w("AL35", 150, 145), w("1.500", 195, 145), w("70,20", 225, 145), w("105.300", 275, 145), w("48HS", 325, 145),
      w("VENTA", 10, 165), w("12/07/2024", 100, 165), w("GD35", 150, 165), w("4.000", 195, 165), w("80,10", 225, 165), w("320.400", 275, 165), w("CI", 325, 165),
      w("COMPRA", 10, 185), w("13/07/2024", 100, 185), w("AL41", 150, 185), w("2.500", 195, 185), w("45,75", 225, 185), w("114.375", 275, 185), w("24HS", 325, 185),

      // Table 2 — header split across two vertically separated rows
      w("OPERACION", 10, 210),
      w("FECHA", 100, 210),
      w("PLAZO", 325, 225),
      w("TASA", 375, 225),

      // Table 2 — 1 caución
      w("CAUCION", 10, 250), w("COLOCADORA", 75, 250), w("14/07/2024", 100, 250), w("7", 325, 250), w("42,5", 375, 250),

      // Ignored row — must not be counted
      w("Tipo", 10, 275), w("de", 50, 275), w("cambio", 70, 275), w("Neto", 130, 275),

      // Comitente repeated before a headerless group of operations — same comitente must be preserved
      w("DANIEL", 10, 300),
      w("11538", 70, 300),

      // 3 more operations with no header — positional fallback
      w("COMPRA", 10, 325), w("15/07/2024", 100, 325), w("AL30", 150, 325), w("1.000", 195, 325), w("66,00", 225, 325), w("66.000", 275, 325), w("48HS", 325, 325),
      w("VENTA", 10, 345), w("15/07/2024", 100, 345), w("GD30", 150, 345), w("500", 195, 345), w("74,00", 225, 345), w("37.000", 275, 345), w("CI", 325, 345),
      w("VENTA", 10, 365), w("16/07/2024", 100, 365), w("GD35", 150, 365), w("500", 195, 365), w("30,00", 225, 365), w("15.000", 275, 365), w("CI", 325, 365),
    ];

    const blocks = reconstructBolsaBlocks(words);
    const allOps = blocks.flatMap((b) => b.operaciones);

    expect(allOps).toHaveLength(11);
    expect(blocks.every((b) => b.nombreDetectado?.includes("DANIEL"))).toBe(true);
    expect(blocks.every((b) => b.nroComitenteDetectado === "11538")).toBe(true);
    expect(allOps.every((op) => !op.rawOperacion.toLowerCase().includes("tipo"))).toBe(true);
    expect(allOps.filter((op) => op.operacionBase.startsWith("CAUCION"))).toHaveLength(1);
    expect(allOps.filter((op) => op.operacionBase === "COMPRA")).toHaveLength(5);
    expect(allOps.filter((op) => op.operacionBase === "VENTA")).toHaveLength(5);
  });
});

// ── Caución column mapping (MONTO COL./TOM. vs MONTO A COBRAR/PAGAR) ────────
//
// Real-world bug: cauciones print OPERACIÓN | FECHA CONC. | VTO |
// MONTO COL./TOM. | TASA | MONTO A COBRAR/PAGAR. The generic header matcher
// only keeps the FIRST "MONTO" it sees, so the second "MONTO" column (monto a
// cobrar/pagar) had no dedicated slot and its data bled into TASA, producing
// a Decimal(8,4) numeric field overflow when persisted.

describe("caución column mapping", () => {
  // Header row: OPERACION | FECHA | VTO | MONTO COL./TOM. | TASA | MONTO A COBRAR/PAGAR
  const caucionHeaderRow: OcrWord[] = [
    w("OPERACION", 10, 40, 90, 54),
    w("FECHA", 110, 40, 160, 54),
    w("VTO", 180, 40, 215, 54),
    w("MONTO", 235, 40, 275, 54),
    w("COL./TOM.", 278, 40, 320, 54),
    w("TASA", 340, 40, 380, 54),
    w("MONTO", 400, 40, 440, 54),
    w("A", 443, 40, 455, 54),
    w("COBRAR/PAGAR", 458, 40, 520, 54),
  ];

  it("OCR-48: detectTableHeader splits the two MONTO columns into MONTO_INICIAL and MONTO_COBRAR_PAGAR", () => {
    const colMap = detectTableHeader(caucionHeaderRow);
    expect(colMap).not.toBeNull();
    expect(colMap?.MONTO_INICIAL).toBeDefined();
    expect(colMap?.MONTO_COBRAR_PAGAR).toBeDefined();
    // MONTO_INICIAL must stay clear of TASA's column, and MONTO_COBRAR_PAGAR of MONTO_INICIAL's.
    expect(colMap!.MONTO_INICIAL!.cx).toBeLessThan(colMap!.TASA!.cx);
    expect(colMap!.TASA!.cx).toBeLessThan(colMap!.MONTO_COBRAR_PAGAR!.cx);
  });

  // Real fixture reported in E4.5B: DANIEL/11538, CAUCION_COLOCADORA.
  it("OCR-49: real caución fixture — monto colocado never lands in tasaCaucion, montoCobrarReferencia parsed correctly", () => {
    const dataRow: OcrWord[] = [
      w("CAUCION", 10, 70, 60, 84),
      w("COLOCADORA", 55, 70, 105, 84),
      w("14/07/2026", 115, 70, 175, 84),
      w("15/07/2026", 180, 70, 240, 84),
      w("87.440.200,00", 250, 70, 330, 84),
      w("22,90", 345, 70, 375, 84),
      w("87.492.602,86", 430, 70, 510, 84),
    ];
    const colMap = detectTableHeader(caucionHeaderRow)!;
    const op = parseDataRow(dataRow, colMap, 1);

    expect(op.operacionBase).toBe("CAUCION_COLOCADORA");
    expect(op.fechaConcertacion).toBe("2026-07-14");
    expect(op.fechaVencimiento).toBe("2026-07-15");
    expect(op.cantidad).toBe("87440200.00");
    expect(op.tasaCaucion).toBe("22.90");
    expect(op.montoCobrarReferencia).toBe("87492602.86");
    expect(op.montoPagarReferencia).toBeNull();
    expect(op.errors).toHaveLength(0);
  });

  it("OCR-50: a monto misassigned to TASA is rejected as out-of-range, never reaches tasaCaucion", () => {
    // Simulates a degraded column map (e.g. fallback path) where TASA is the
    // only recognized column near a large monto value — the safety net must
    // null it out and flag an error regardless of how it got there.
    const degradedColMap = {
      OPERACION: { cx: 30 },
      FECHA: { cx: 130 },
      TASA: { cx: 300 },
    };
    const row: OcrWord[] = [
      w("CAUCION", 10, 10, 60, 24),
      w("COLOCADORA", 65, 10, 145, 24),
      w("14/07/2026", 100, 10, 165, 24),
      w("87.440.200,00", 275, 10, 355, 24),
    ];
    const op = parseDataRow(row, degradedColMap, 1);

    expect(op.tasaCaucion).toBeNull();
    expect(op.errors).toContain("Tasa de caución fuera de rango válido.");
  });

  it("OCR-51: a valid small tasa (22,90%) is never rejected", () => {
    const colMap = { OPERACION: { cx: 30 }, FECHA: { cx: 130 }, TASA: { cx: 300 } };
    const row: OcrWord[] = [
      w("CAUCION", 10, 10, 60, 24),
      w("COLOCADORA", 65, 10, 145, 24),
      w("14/07/2026", 100, 10, 165, 24),
      w("22,90", 280, 10, 320, 24),
    ];
    const op = parseDataRow(row, colMap, 1);
    expect(op.tasaCaucion).toBe("22.90");
    expect(op.errors).not.toContain("Tasa de caución fuera de rango válido.");
  });
});

// ── Positional-fallback caching regression (real lote dca3f66b…, 13/13 ERROR) ─
//
// Root cause found auditing lote dca3f66b-c954-4aea-9266-c991381d6206: when no
// real header is ever detected, reconstructBolsaBlocks used to build a
// positional column map from the FIRST op-candidate row and cache it as
// currentColMap/lastGoodColMap for every row that followed — including rows
// with a completely different shape (a 2-word "CAUCION COLOCADORA" label vs a
// 1-word "COMPRA" label, different column counts). Reusing one row's word
// positions as another row's columns glued dates into OPERACION (→ "Fecha no
// detectada" on every row) and, because the "known column map" branch accepts
// ANY row unconditionally, swept non-operational lines in as phantom
// DESCONOCIDA operations too.

describe("positional fallback must not leak across differently-shaped rows", () => {
  it("OCR-52: a caución row's ad hoc column map must not corrupt a later, differently-shaped compra row, and non-operational rows must never become phantom operations", () => {
    const words: OcrWord[] = [
      // Row 1: CAUCION COLOCADORA — no header anywhere in this document.
      w("CAUCION", 10, 10, 60, 24),
      w("COLOCADORA", 65, 10, 145, 24),
      w("14/07/2026", 160, 10, 220, 24),
      w("87.440.200,00", 235, 10, 320, 24),
      w("22,90", 335, 10, 375, 24),
      w("87.492.602,86", 390, 10, 470, 24),

      // Row 2: a non-operational line — must never become a phantom "operation".
      w("Saldo", 10, 40, 60, 54),
      w("anterior", 65, 40, 125, 54),
      w("0,00", 130, 40, 170, 54),

      // Row 3: COMPRA — a single-word label and a different trailing column
      // count than row 1, i.e. structurally unrelated to it.
      w("COMPRA", 10, 70, 60, 84),
      w("15/07/2026", 70, 70, 130, 84),
      w("AL30", 140, 70, 180, 84),
      w("10.000", 190, 70, 230, 84),
      w("65,25", 240, 70, 280, 84),
      w("652.500", 290, 70, 330, 84),
      w("48HS", 340, 70, 380, 84),
    ];

    const blocks = reconstructBolsaBlocks(words);
    const ops = blocks.flatMap((b) => b.operaciones);

    // Only the 2 real operations must survive — "Saldo anterior" must never
    // surface as a phantom DESCONOCIDA operation.
    expect(ops).toHaveLength(2);
    expect(ops.every((op) => op.operacionBase !== "DESCONOCIDA")).toBe(true);

    const [caucion, compra] = ops;

    expect(caucion.operacionBase).toBe("CAUCION_COLOCADORA");
    expect(caucion.fechaConcertacion).toBe("2026-07-14");
    expect(caucion.errors).not.toContain("Fecha no detectada.");

    // The date must land in its own FECHA slot, not get glued into OPERACION.
    expect(compra.operacionBase).toBe("COMPRA");
    expect(compra.rawOperacion).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(compra.ticker).toBe("AL30");
    expect(compra.fechaConcertacion).toBe("2026-07-15");
    expect(compra.errors).not.toContain("Fecha no detectada.");
    expect(compra.cantidad).toBe("10000");
    expect(compra.precio).toBe("65.25");
  });
});

// ── extractOcrWords ───────────────────────────────────────────────────────────

describe("extractOcrWords", () => {
  function makeBlocksPage(words: OcrWord[]): OcrPage {
    return {
      text: words.map((w) => w.text).join(" "),
      tsv: null,
      blocks: [
        {
          paragraphs: [
            {
              lines: [
                {
                  words: words.map((w) => ({
                    text: w.text,
                    confidence: w.confidence,
                    bbox: w.bbox,
                  })),
                },
              ],
            },
          ],
        },
      ],
    };
  }

  it("OCR-42: extracts words from blocks with correct bbox and confidence", () => {
    const input: OcrWord[] = [
      w("OPERACION", 10, 40, 90, 54, 95),
      w("FECHA", 100, 40, 140, 54, 92),
    ];
    const page = makeBlocksPage(input);
    const result = extractOcrWords(page);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("OPERACION");
    expect(result[0].confidence).toBe(95);
    expect(result[0].bbox).toEqual({ x0: 10, y0: 40, x1: 90, y1: 54 });
    expect(result[1].text).toBe("FECHA");
  });

  it("OCR-43: falls back to TSV when blocks is null", () => {
    const tsv = [
      "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext",
      "1\t1\t0\t0\t0\t0\t0\t0\t850\t1100\t-1\t",
      "5\t1\t1\t1\t1\t1\t10\t40\t80\t14\t95.5\tOPERACION",
      "5\t1\t1\t1\t1\t2\t100\t40\t40\t14\t91.0\tFECHA",
    ].join("\n");
    const page: OcrPage = { text: "OPERACION FECHA", tsv, blocks: null };
    const result = extractOcrWords(page);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("OPERACION");
    expect(result[0].bbox).toEqual({ x0: 10, y0: 40, x1: 90, y1: 54 });
    expect(result[0].confidence).toBeCloseTo(95.5);
    expect(result[1].text).toBe("FECHA");
    expect(result[1].bbox).toEqual({ x0: 100, y0: 40, x1: 140, y1: 54 });
  });

  it("OCR-44: returns [] when blocks is null and tsv is null", () => {
    const page: OcrPage = { text: "COMPRA VENTA", tsv: null, blocks: null };
    expect(extractOcrWords(page)).toEqual([]);
  });

  it("OCR-45: TSV filters out non-word rows (level≠5) and conf=-1 structural rows", () => {
    const tsv = [
      "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext",
      "1\t1\t0\t0\t0\t0\t0\t0\t850\t1100\t-1\t",   // page row
      "2\t1\t1\t0\t0\t0\t0\t0\t200\t100\t-1\t",    // block row
      "4\t1\t1\t1\t1\t0\t0\t40\t200\t14\t-1\t",    // line row
      "5\t1\t1\t1\t1\t1\t10\t40\t80\t14\t88.0\tCOMPRA", // real word
      "5\t1\t1\t1\t1\t2\t0\t0\t0\t0\t-1\t",        // word with conf=-1 (skip)
    ].join("\n");
    const page: OcrPage = { text: "COMPRA", tsv, blocks: null };
    const result = extractOcrWords(page);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("COMPRA");
  });
});
