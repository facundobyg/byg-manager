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
  type OcrWord,
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
});
