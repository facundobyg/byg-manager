import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseBolsaExcel } from "./parser";
import {
  parseArNumber,
  parseArDate,
  excelSerialToISO,
  normalizePlazo,
  detectMoneda,
  inferMonedaFromTicker,
  normalizeOpBase,
  interpretNumericCell,
  interpretTextCell,
  interpretDateCell,
  type RawCell,
} from "./normalize";

// ── Helpers ──────────────────────────────────────────────────────────────────

type TestCell = string | number | Date | null | undefined;

interface MakeBufferOpts {
  sheetName?: string;
  formulaPatches?: Record<string, { f: string; v?: number }>;
  extraSheets?: Record<string, TestCell[][]>;
  merges?: XLSX.Range[];
}

function makeBuffer(rows: TestCell[][], opts: MakeBufferOpts = {}): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows as unknown[][], { cellDates: true });

  for (const [addr, { f, v }] of Object.entries(opts.formulaPatches ?? {})) {
    const cell: XLSX.CellObject = { t: "n", f };
    if (v !== undefined) cell.v = v;
    ws[addr] = cell;
  }
  if (opts.merges) ws["!merges"] = opts.merges;

  XLSX.utils.book_append_sheet(wb, ws, opts.sheetName ?? "Ops");

  for (const [name, data] of Object.entries(opts.extraSheets ?? {})) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(data as unknown[][], { cellDates: true }),
      name
    );
  }
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function makeEmptySheetBuffer(): Buffer {
  const wb = XLSX.utils.book_new();
  // Hoja sin !ref (truly empty)
  const ws: XLSX.WorkSheet = {};
  XLSX.utils.book_append_sheet(wb, ws, "Vacia");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

const HDR = ["OPERACION", "FECHA CONC.", "BONO", "VN", "PRECIO", "MONTO NETO"];
const OP_COMPRA = ["COMPRA", "01/07/2026", "AL30", 16480, "40,36", "665.333,00"];
const OP_VENTA = ["VENTA", "01/07/2026", "GD30", 10000, "78,50", "785.000,00"];

// ═══════════════════════════════════════════════════════════════════
// SECCIÓN 1 — normalize (funciones puras)
// ═══════════════════════════════════════════════════════════════════

describe("parseArNumber", () => {
  // Requisito 28 — redondeo sin artefactos
  it("T01 — multi-dot + coma: 16.119.285,77 → 16119285.77 (req 28)", () => {
    const r = parseArNumber("16.119.285,77", "monto");
    expect(r.value).toBe("16119285.77");
    expect(r.warnings).toHaveLength(0);
  });

  // Requisito 5 — número con punto único: campo diferencia la interpretación
  it("T02a — cantidad '16.480' punto único 3 dec → miles 16480 + warning (req 5)", () => {
    const r = parseArNumber("16.480", "cantidad");
    expect(r.value).toBe("16480");
    expect(r.warnings.some((w) => w.includes("miles"))).toBe(true);
  });

  it("T02b — precio '978.112' punto único 3 dec → decimal 978.112 sin warning (req 5)", () => {
    const r = parseArNumber("978.112", "precio");
    expect(r.value).toBe("978.112");
    expect(r.warnings).toHaveLength(0);
  });

  it("T02c — monto '10.580' punto único 3 dec → miles 10580.00 + warning (req 5)", () => {
    const r = parseArNumber("10.580", "monto");
    expect(r.value).toBe("10580.00");
    expect(r.warnings.some((w) => w.includes("miles"))).toBe(true);
  });

  it("T02d — tasa '35.500' punto único 3 dec → decimal 35.5 sin warning (req 5)", () => {
    const r = parseArNumber("35.500", "tasa");
    expect(r.value).toBe("35.5");
    expect(r.warnings).toHaveLength(0);
  });

  it("T03 — coma como decimal: '978,112' precio → 978.112 (req 28)", () => {
    const r = parseArNumber("978,112", "precio");
    expect(r.value).toBe("978.112");
  });

  it("T04 — prefijo ARS eliminado: 'ARS 1.234,56' monto → 1234.56", () => {
    expect(parseArNumber("ARS 1.234,56", "monto").value).toBe("1234.56");
  });

  it("T05 — negativo con paréntesis: '(1.234,56)' → -1234.56", () => {
    expect(parseArNumber("(1.234,56)", "monto").value).toBe("-1234.56");
  });

  it("T06 — float nativo sin artefactos: 978.112 precio → '978.112' (req 28)", () => {
    const r = parseArNumber(978.112, "precio");
    expect(r.value).toBe("978.112");
    expect(r.value).not.toMatch(/\d{5,}/); // no exceso de dígitos
  });
});

describe("parseArDate", () => {
  it("T07 — ISO passthrough: 2026-07-01 → 2026-07-01", () => {
    expect(parseArDate("2026-07-01")).toBe("2026-07-01");
  });

  // Requisito 13 — fecha de texto
  it("T08 — DD/MM/YYYY argentino → ISO (req 13)", () => {
    expect(parseArDate("01/07/2026")).toBe("2026-07-01");
  });

  it("T09 — DD-MM-YY (2 dígitos) → ISO (req 13)", () => {
    expect(parseArDate("01-07-26")).toBe("2026-07-01");
  });

  // Requisito 12 — fecha nativa Excel
  it("T10 — serial Excel → ISO (req 12)", () => {
    const epoch = new Date(1899, 11, 30);
    const target = new Date(2026, 6, 1);
    const serial = Math.round((target.getTime() - epoch.getTime()) / 86400000);
    expect(excelSerialToISO(serial)).toBe("2026-07-01");
  });
});

describe("normalizePlazo", () => {
  it("T11a — CI reconocido", () => {
    expect(normalizePlazo("CI").normalized).toBe("CI");
    expect(normalizePlazo("Contado Inmediato").normalized).toBe("CI");
  });

  it("T11b — 24hs / 48hs / desconocido", () => {
    expect(normalizePlazo("48hs.").normalized).toBe("48HS");
    expect(normalizePlazo("24 horas").normalized).toBe("24HS");
    expect(normalizePlazo("OTRO").normalized).toBeNull();
  });
});

describe("detectMoneda / inferMonedaFromTicker", () => {
  it("T12a — ARS y USD directos", () => {
    expect(detectMoneda("ARS 1234").moneda).toBe("ARS");
    expect(detectMoneda("USD 500").moneda).toBe("USD");
    expect(detectMoneda("texto irrelevante").moneda).toBeNull();
  });

  // Requisito 27 — ticker D → USD inferido
  it("T12b — sufijo D en ticker → USD + esInferencia true (req 27)", () => {
    const r = inferMonedaFromTicker("AL30D");
    expect(r.moneda).toBe("USD");
    expect(r.esInferencia).toBe(true);
  });

  it("T12c — sin sufijo D → null", () => {
    expect(inferMonedaFromTicker("AL30").moneda).toBeNull();
    expect(inferMonedaFromTicker(null).moneda).toBeNull();
  });
});

describe("normalizeOpBase", () => {
  // Requisitos 8, 9, 10, 11, 23
  it("T13 — COMPRA / VENTA / cauciones / DESCONOCIDA (req 8,9,10,11,23)", () => {
    expect(normalizeOpBase("COMPRA")).toBe("COMPRA");
    expect(normalizeOpBase("VENTA")).toBe("VENTA");
    expect(normalizeOpBase("CAUCION COLOCADORA")).toBe("CAUCION_COLOCADORA");
    expect(normalizeOpBase("Caución Tomadora")).toBe("CAUCION_TOMADORA");
    expect(normalizeOpBase("ARBITRAJE")).toBe("DESCONOCIDA");
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECCIÓN 2 — interpretNumericCell (unit tests directos, req 16,17)
// ═══════════════════════════════════════════════════════════════════

describe("interpretNumericCell — tests unitarios directos", () => {
  // Requisito 15 — fórmula con cache
  it("T-IC1 — fórmula con cache normal: usa valor, preserva fórmula (req 15)", () => {
    const cell: RawCell = { v: 978.112, f: "G5/E5", hasFormula: true, hasValue: true };
    const r = interpretNumericCell(cell, "precio");
    expect(r.value).toBe("978.112");
    expect(r.formula).toBe("G5/E5");
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });

  // Requisito 16 — fórmula con cache = 0 (cero real, no ausencia)
  it("T-IC2 — fórmula con cache = 0: devuelve '0', no null (req 16)", () => {
    const cell: RawCell = { v: 0, f: "G5/E5", hasFormula: true, hasValue: true };
    const r = interpretNumericCell(cell, "precio");
    expect(r.value).not.toBeNull();
    expect(r.value).toBe("0");
    expect(r.formula).toBe("G5/E5");
    expect(r.errors).toHaveLength(0);
  });

  // Requisito 17 — fórmula sin cache (v === undefined)
  it("T-IC3 — fórmula sin cache campo crítico (cantidad): null + error bloqueante (req 17)", () => {
    const cell: RawCell = { v: undefined, f: "G5/E5", hasFormula: true, hasValue: false };
    const r = interpretNumericCell(cell, "cantidad");
    expect(r.value).toBeNull();
    expect(r.formula).toBe("G5/E5");
    expect(r.errors.some((e) => e.includes("sin valor cacheado"))).toBe(true);
    expect(r.warnings).toHaveLength(0); // campo crítico va a errors, no warnings
  });

  it("T-IC4 — fórmula sin cache campo referencial (monto): null + warning no bloqueante (req 17)", () => {
    const cell: RawCell = { v: undefined, f: "G5/E5", hasFormula: true, hasValue: false };
    const r = interpretNumericCell(cell, "monto");
    expect(r.value).toBeNull();
    expect(r.formula).toBe("G5/E5");
    expect(r.warnings.some((w) => w.includes("sin valor cacheado"))).toBe(true);
    expect(r.errors).toHaveLength(0); // referencial va a warnings, no errors
  });

  it("T-IC5 — fórmula sin cache (v === null): igual que undefined (req 17)", () => {
    const cell: RawCell = { v: null, f: "G5/E5", hasFormula: true, hasValue: false };
    const r = interpretNumericCell(cell, "precio");
    expect(r.value).toBeNull();
    expect(r.errors.some((e) => e.includes("sin valor cacheado"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECCIÓN 3 — parseBolsaExcel (integración)
// ═══════════════════════════════════════════════════════════════════

describe("parseBolsaExcel — estructura de bloques", () => {
  // Requisito 1 — 20 comitentes × 1 op
  it("T14 — 20 comitentes × 1 op → 20 bloques, 20 ops (req 1)", () => {
    const rows: TestCell[][] = [];
    for (let i = 1; i <= 20; i++) {
      const nombre = `COMITENTE ${String(i).padStart(2, "0")}`;
      const nro = `${10000 + i}`;
      rows.push([nombre, null, null, nro]);
      rows.push([...HDR]);
      rows.push(["COMPRA", "01/07/2026", "AL30", 1000, "40", "40000,00"]);
      rows.push([null], [null], [null]);
    }
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.totalBloques).toBe(20);
    expect(result.estadisticas.totalOperaciones).toBe(20);
    expect(result.estadisticas.totalCompras).toBe(20);
    expect(result.bloques[0].nombreDetectado).toBe("COMITENTE 01");
    expect(result.bloques[19].nombreDetectado).toBe("COMITENTE 20");
    expect(result.bloques.every((b) => b.nroComitenteDetectado !== null)).toBe(true);
    expect(result.erroresGlobales).toHaveLength(0);
  });

  // Requisito 2 — 1 comitente × varios ops
  it("T15 — 1 comitente, 3 ops (req 2, 8, 9)", () => {
    const rows: TestCell[][] = [
      ["FIRMA ABC SA", null, "22222"],
      [...HDR],
      ["COMPRA", "01/07/2026", "AL30", 1000, "40", "40000,00"],
      ["VENTA", "01/07/2026", "GD30", 500, "80", "40000,00"],
      ["COMPRA", "01/07/2026", "TX26", 2000, "50", "100000,00"],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.totalBloques).toBe(1);
    expect(result.estadisticas.totalOperaciones).toBe(3);
    expect(result.estadisticas.totalCompras).toBe(2);
    expect(result.estadisticas.totalVentas).toBe(1);
    expect(result.bloques[0].nombreDetectado).toBe("FIRMA ABC SA");
    expect(result.bloques[0].nroComitenteDetectado).toBe("22222");
  });

  // Requisitos 3, 4 — mismo comitente, 2 tablas (encabezado repetido)
  it("T16 — mismo comitente, encabezado repetido → 2 bloques, mismo nombre/nro (req 3, 4)", () => {
    const rows: TestCell[][] = [
      ["JUAN PEREZ", null, "33333"],
      [...HDR],
      [...OP_COMPRA],
      [...HDR], // encabezado repetido = nuevo bloque
      [...OP_VENTA],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.totalBloques).toBe(2);
    expect(result.bloques[0].nombreDetectado).toBe("JUAN PEREZ");
    expect(result.bloques[1].nombreDetectado).toBe("JUAN PEREZ");
    expect(result.bloques[0].nroComitenteDetectado).toBe("33333");
    expect(result.bloques[1].nroComitenteDetectado).toBe("33333");
    expect(result.estadisticas.totalOperaciones).toBe(2);
  });

  // Requisito 5 — columnas desplazadas
  it("T17 — columnas desplazadas (inicio en col C) (req 5)", () => {
    const rows: TestCell[][] = [
      [null, null, "CLIENTE DESPLAZADO", null, "44444"],
      [null, null, "OPERACION", "FECHA CONC.", "BONO", "VN", "PRECIO", "MONTO NETO"],
      [null, null, "COMPRA", "01/07/2026", "AL30", 16480, "40,36", "665.333,00"],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.totalOperaciones).toBe(1);
    const op = result.operaciones[0];
    expect(op.operacionBase).toBe("COMPRA");
    expect(op.ticker).toBe("AL30");
    expect(op.cantidad).toBe("16480");
    expect(op.precio).toBe("40.36");
    expect(op.montoNetoReferencia).toBe("665333.00");
    expect(result.bloques[0].nombreDetectado).toBe("CLIENTE DESPLAZADO");
  });

  // Requisito 6 — filas vacías: < 3 no dividen; ≥ 3 dividen
  it("T18a — 3 filas vacías = separación de bloque (req 6)", () => {
    const rows: TestCell[][] = [
      ["COMITENTE A", null, "55555"],
      [...HDR],
      [...OP_COMPRA],
      [null], [null], [null],
      ["COMITENTE B", null, "66666"],
      [...HDR],
      [...OP_VENTA],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.totalBloques).toBe(2);
    expect(result.bloques[0].nombreDetectado).toBe("COMITENTE A");
    expect(result.bloques[1].nombreDetectado).toBe("COMITENTE B");
  });

  it("T18b — 2 filas vacías dentro de un bloque NO dividen (req 6)", () => {
    const rows: TestCell[][] = [
      ["COMITENTE UNICO", null, "77777"],
      [...HDR],
      [...OP_COMPRA],
      [null],
      [null], // solo 2 vacías → no divide
      [...OP_VENTA],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.totalBloques).toBe(1);
    expect(result.estadisticas.totalOperaciones).toBe(2);
  });

  // Requisito 7 — celdas combinadas (merged)
  it("T_MERGED — celda combinada en nombre de comitente → se lee correctamente (req 7)", () => {
    const rows: TestCell[][] = [
      ["CLIENTE MERGED", null, null, "88888"], // nombre mergeado con B1 y C1
      [...HDR],
      [...OP_COMPRA],
    ];
    // Merge A1:C1 (nombre abarca 3 columnas)
    const merges: XLSX.Range[] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    const result = parseBolsaExcel(makeBuffer(rows, { merges }));
    expect(result.estadisticas.totalOperaciones).toBe(1);
    expect(result.bloques[0].nombreDetectado).toBe("CLIENTE MERGED");
  });
});

describe("parseBolsaExcel — operaciones y tipos", () => {
  // Requisitos 10, 11 — caución
  it("T_CAUCION — CAUCION COLOCADORA y CAUCION TOMADORA (req 10, 11)", () => {
    const HDR_CAUC = ["OPERACION", "FECHA CONC.", "VN", "TASA", "MONTO NETO", "VENCIMIENTO"];
    const rows: TestCell[][] = [
      ["BANCO XYZ", null, "12300"],
      [...HDR_CAUC],
      ["CAUCION COLOCADORA", "01/07/2026", 1000000, "35,5", "1007708,33", "08/07/2026"],
      ["CAUCION TOMADORA", "01/07/2026", 500000, "36,0", "503500,00", "08/07/2026"],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.totalCauciones).toBe(2);
    expect(result.operaciones[0].operacionBase).toBe("CAUCION_COLOCADORA");
    expect(result.operaciones[0].instrumentoHint).toBe("CAUCION");
    expect(result.operaciones[1].operacionBase).toBe("CAUCION_TOMADORA");
    expect(result.operaciones[0].tasaCaucion).toBe("35.5");
  });

  // Requisito 12 — fecha nativa Excel (Date object)
  it("T_DATE_NATIVE — fecha como Date nativo de Excel → ISO (req 12)", () => {
    const nativeDate = new Date(2026, 6, 1); // 2026-07-01
    const rows: TestCell[][] = [
      ["CLIENTE FECHA", null, "11100"],
      [...HDR],
      ["COMPRA", nativeDate, "AL30", 1000, "40", "40000,00"],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.operaciones[0].fechaConcertacion).toBe("2026-07-01");
  });

  // Requisito 13 — fecha de texto (ya cubierto parcialmente por T08 unit, confirmamos en parser)
  it("T_DATE_TEXT — fecha de texto en parser → ISO (req 13)", () => {
    const rows: TestCell[][] = [
      ["CLIENTE", null, "11101"],
      [...HDR],
      ["COMPRA", "15/06/2026", "AL30", 1000, "40", "40000,00"],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.operaciones[0].fechaConcertacion).toBe("2026-06-15");
  });

  // Requisito 14 — fecha fallback
  it("T23 — fallbackFechaOperativa cuando no hay columna fecha (req 14)", () => {
    const rows: TestCell[][] = [
      ["CLIENTE SIN FECHA", null, "13579"],
      ["OPERACION", "BONO", "VN", "PRECIO", "MONTO NETO"],
      ["COMPRA", "AL30", 1000, "40", "40000,00"],
    ];
    const result = parseBolsaExcel(makeBuffer(rows), { fallbackFechaOperativa: "2026-07-14" });
    expect(result.estadisticas.totalOperaciones).toBe(1);
    expect(result.operaciones[0].fechaConcertacion).toBe("2026-07-14");
  });

  // Requisito 23 — operación desconocida
  it("T_DESCONOCIDA — operación no reconocida → DESCONOCIDA + warning (req 23)", () => {
    const rows: TestCell[][] = [
      ["CLIENTE", null, "00099"],
      [...HDR],
      ["CANJE", "01/07/2026", "AL30", 1000, "40", "40000,00"],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.operaciones[0].operacionBase).toBe("DESCONOCIDA");
    expect(result.operaciones[0].warnings.some((w) => w.includes("no reconocido"))).toBe(true);
  });
});

describe("parseBolsaExcel — filas ignoradas", () => {
  // Requisitos 18, 19, 20
  it("T19 — RESULTADO PESOS/USD y TIPO DE CAMBIO NETO ignorados (req 18,19,20)", () => {
    const rows: TestCell[][] = [
      ["CLIENTE XYZ", null, "77777"],
      [...HDR],
      [...OP_COMPRA],
      ["RESULTADO PESOS", null, null, null, null, "665333,00"],
      ["RESULTADO USD", null, null, null, null, "500"],
      ["TIPO DE CAMBIO NETO", null, null, null, null, "1330"],
      ["SUBTOTAL", null, null, null, null, "100"],
      [...OP_VENTA],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.totalOperaciones).toBe(2);
    expect(result.estadisticas.totalBloques).toBe(1);
  });
});

describe("parseBolsaExcel — fórmulas en workbook (integración)", () => {
  // Requisito 15 — fórmula con cache → usa valor
  it("T20 — fórmula con cache: usa valor, rawCells contiene fórmula (req 15)", () => {
    const rows: TestCell[][] = [
      ["FORMULA SA", null, "88888"],
      [...HDR],
      ["COMPRA", "01/07/2026", "AL30", 16480, "40,36", null],
    ];
    const result = parseBolsaExcel(makeBuffer(rows, { formulaPatches: { F3: { f: "D3*E3", v: 665333.0 } } }));
    expect(result.operaciones[0].montoNetoReferencia).toBe("665333.00");
    expect(String(result.operaciones[0].rawCells.F)).toContain("D3*E3");
  });

  // Requisito 16 — fórmula con cache = 0
  it("T21 — fórmula con cache = 0: devuelve '0.00', rawCells preserva fórmula (req 16)", () => {
    const rows: TestCell[][] = [
      ["FORMULA CERO", null, "99999"],
      [...HDR],
      ["COMPRA", "01/07/2026", "AL30", 16480, "40,36", null],
    ];
    const result = parseBolsaExcel(makeBuffer(rows, { formulaPatches: { F3: { f: "D3*E3", v: 0 } } }));
    expect(result.operaciones[0].montoNetoReferencia).toBe("0.00");
    expect(String(result.operaciones[0].rawCells.F)).toContain("D3*E3");
    expect(result.operaciones[0].errors).toHaveLength(0);
  });
});

describe("parseBolsaExcel — moneda y derivaciones", () => {
  // Requisito 27 — ticker D → USD inferido + warning
  it("T22 — ticker sufijo D → USD, esInferencia true, warning (req 27)", () => {
    const rows: TestCell[][] = [
      ["CLIENTE AL30D", null, "12345"],
      [...HDR],
      ["COMPRA", "01/07/2026", "AL30D", 1000, "40", "40000,00"],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    const op = result.operaciones[0];
    expect(op.ticker).toBe("AL30D");
    expect(op.monedaDetectada).toBe("USD");
    expect(op.monedaEsInferencia).toBe(true);
    expect(op.warnings.some((w) => w.includes("Moneda inferida"))).toBe(true);
  });
});

describe("parseBolsaExcel — comitente", () => {
  // Requisito 22 — nombre sin número
  it("T24 — nombre sin número de comitente → nroComitenteDetectado null (req 22)", () => {
    const rows: TestCell[][] = [
      ["SOLO NOMBRE SA"],
      [...HDR],
      [...OP_COMPRA],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.bloques[0].nombreDetectado).toBe("SOLO NOMBRE SA");
    expect(result.bloques[0].nroComitenteDetectado).toBeNull();
  });

  // Requisito 21 — comitente faltante (op sin comitente)
  it("T_SIN_COMITENTE — ops sin comitente → error bloqueante en cada op (req 21)", () => {
    const rows: TestCell[][] = [
      [...HDR], // encabezado sin comitente previo
      [...OP_COMPRA],
      [...OP_VENTA],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.bloquesSinComitente).toBeGreaterThan(0);
    expect(result.estadisticas.operacionesSinComitente).toBe(2);
    result.operaciones.forEach((op) => {
      expect(op.errors.some((e) => e.includes("sin comitente"))).toBe(true);
    });
  });
});

describe("parseBolsaExcel — anti-derrame", () => {
  // Requisito 29 — anti-derrame comitente nuevo completo
  it("T25 — 2 comitentes: ops asignadas al bloque correcto (req 29)", () => {
    const rows: TestCell[][] = [
      ["COMITENTE ALFA", null, "11100"],
      [...HDR],
      ["COMPRA", "01/07/2026", "AL30", 500, "40", "20000,00"],
      ["VENTA", "01/07/2026", "GD30", 200, "80", "16000,00"],
      [null], [null], [null],
      ["COMITENTE BETA", null, "22200"],
      [...HDR],
      ["COMPRA", "01/07/2026", "TX26", 1000, "50", "50000,00"],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.totalBloques).toBe(2);
    expect(result.estadisticas.totalOperaciones).toBe(3);
    expect(result.bloques[0].nombreDetectado).toBe("COMITENTE ALFA");
    expect(result.bloques[0].operaciones.map((o) => o.ticker)).toEqual(["AL30", "GD30"]);
    expect(result.bloques[1].nombreDetectado).toBe("COMITENTE BETA");
    expect(result.bloques[1].operaciones[0].ticker).toBe("TX26");
    expect(result.estadisticas.operacionesSinComitente).toBe(0);
  });

  // Requisito 30 — anti-derrame: nombre nuevo sin número, luego op sin encabezado
  it("T30 — comitente B aparece sin nro, luego op sin headers → no va a bloque A (req 30)", () => {
    const rows: TestCell[][] = [
      ["CLIENTE A", null, "11111"],
      [...HDR],
      ["COMPRA", "01/07/2026", "AL30", 1000, "40", "40000,00"],
      ["CLIENTE B"], // nuevo comitente, sin número aún
      ["COMPRA", "01/07/2026", "GD30", 500, "80", "40000,00"], // op sin headers para B
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.estadisticas.totalBloques).toBe(2);
    // Bloque A: solo AL30
    expect(result.bloques[0].nombreDetectado).toBe("CLIENTE A");
    expect(result.bloques[0].operaciones.every((o) => o.ticker === "AL30")).toBe(true);
    // Bloque B: con error por falta de encabezados, no contaminó a A
    expect(result.bloques[1].nombreDetectado).toBe("CLIENTE B");
    expect(result.bloques[1].nroComitenteDetectado).toBeNull();
    expect(result.bloques[1].operaciones).toHaveLength(1);
    // Sin column mapping el ticker no se puede extraer; lo que importa es el error
    expect(
      result.bloques[1].operaciones[0].errors.some((e) => e.includes("sin fila de encabezados") || e.includes("columnMapping"))
    ).toBe(true);
  });

  // Requisito 31 — op ambigua no va silenciosamente al comitente anterior
  it("T31 — op sin comitente previo → error, no va a bloque inventado (req 31)", () => {
    const rows: TestCell[][] = [
      // Sin ningún comitente previo
      [...HDR],
      ["COMPRA", "01/07/2026", "AL30", 1000, "40", "40000,00"],
    ];
    const result = parseBolsaExcel(makeBuffer(rows));
    expect(result.bloques[0].nombreDetectado).toBeNull();
    expect(result.bloques[0].nroComitenteDetectado).toBeNull();
    expect(result.operaciones[0].errors.some((e) => e.includes("sin comitente"))).toBe(true);
    expect(result.estadisticas.operacionesSinComitente).toBe(1);
  });
});

describe("parseBolsaExcel — hojas y archivos", () => {
  // Requisito 24 — varias hojas no vacías
  it("T_MULTI_SHEET — varias hojas → advertencia + procesa solo la primera (req 24)", () => {
    const rows: TestCell[][] = [
      ["CLIENTE", null, "11111"],
      [...HDR],
      [...OP_COMPRA],
    ];
    const result = parseBolsaExcel(
      makeBuffer(rows, {
        extraSheets: {
          Hoja2: [["OPERACION", "BONO"], ["COMPRA", "AL30"]],
          Hoja3: [["OPERACION", "BONO"], ["VENTA", "GD30"]],
        },
      })
    );
    expect(result.hojasNoVacias).toBe(3);
    expect(result.warningsGlobales.some((w) => w.includes("3 hojas"))).toBe(true);
    // Solo procesa la primera
    expect(result.estadisticas.totalOperaciones).toBe(1);
  });

  // Requisito 25 — archivo vacío (hoja sin contenido)
  it("T_EMPTY_FILE — hoja sin contenido → error en erroresGlobales (req 25)", () => {
    const result = parseBolsaExcel(makeEmptySheetBuffer());
    expect(result.erroresGlobales.length).toBeGreaterThan(0);
    expect(result.estadisticas.totalOperaciones).toBe(0);
  });

  // Requisito 26 — archivo inválido / sheetName inexistente
  it("T25b — sheetName inexistente → error en erroresGlobales (req 26)", () => {
    const rows: TestCell[][] = [["CLIENTE", null], [...HDR], [...OP_COMPRA]];
    const result = parseBolsaExcel(makeBuffer(rows), { sheetName: "HOJA_INEXISTENTE" });
    expect(result.erroresGlobales.length).toBeGreaterThan(0);
    expect(result.erroresGlobales[0]).toContain("HOJA_INEXISTENTE");
    expect(result.estadisticas.totalOperaciones).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECCIÓN 4 — interpretTextCell / interpretDateCell (unit tests directos)
// ═══════════════════════════════════════════════════════════════════

describe("interpretTextCell — tests unitarios directos", () => {
  // ticker con fórmula y cache
  it("T-TX1 — ticker: fórmula con cache 'AL30' → valor usado, fórmula preservada", () => {
    const cell: RawCell = { v: "AL30", f: "VLOOKUP(A1,Tickers,2,0)", hasFormula: true, hasValue: true };
    const r = interpretTextCell(cell, "ticker", true);
    expect(r.value).toBe("AL30");
    expect(r.formula).toBe("VLOOKUP(A1,Tickers,2,0)");
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });

  // ticker con fórmula sin cache → error bloqueante
  it("T-TX2 — ticker: fórmula sin cache → null + error bloqueante", () => {
    const cell: RawCell = { v: undefined, f: "VLOOKUP(A1,Tickers,2,0)", hasFormula: true, hasValue: false };
    const r = interpretTextCell(cell, "ticker", true);
    expect(r.value).toBeNull();
    expect(r.formula).toBe("VLOOKUP(A1,Tickers,2,0)");
    expect(r.errors.some((e) => e.includes("sin valor cacheado") && e.includes("ticker"))).toBe(true);
    expect(r.warnings).toHaveLength(0);
  });

  // tipo de operación con fórmula sin cache → error bloqueante
  it("T-TX3 — operacion: fórmula sin cache → null + error (campo crítico)", () => {
    const cell: RawCell = { v: undefined, f: "IF(B1>0,\"COMPRA\",\"VENTA\")", hasFormula: true, hasValue: false };
    const r = interpretTextCell(cell, "operacion", true);
    expect(r.value).toBeNull();
    expect(r.errors.some((e) => e.includes("sin valor cacheado") && e.includes("operacion"))).toBe(true);
    expect(r.warnings).toHaveLength(0);
  });

  // plazo con fórmula sin cache → warning (no bloqueante)
  it("T-TX4 — plazo: fórmula sin cache → null + warning (no bloqueante)", () => {
    const cell: RawCell = { v: undefined, f: "A5", hasFormula: true, hasValue: false };
    const r = interpretTextCell(cell, "plazo", false);
    expect(r.value).toBeNull();
    expect(r.warnings.some((w) => w.includes("sin valor cacheado") && w.includes("plazo"))).toBe(true);
    expect(r.errors).toHaveLength(0);
  });
});

describe("interpretDateCell — tests unitarios directos", () => {
  // fecha con fórmula y cache serial Excel
  it("T-DT1 — fecha: fórmula con cache serial → ISO parseado, fórmula preservada", () => {
    const epoch = new Date(1899, 11, 30);
    const target = new Date(2026, 6, 1); // 2026-07-01
    const serial = Math.round((target.getTime() - epoch.getTime()) / 86400000);
    const cell: RawCell = { v: serial, f: "TODAY()", hasFormula: true, hasValue: true };
    const r = interpretDateCell(cell, "fecha", null);
    expect(r.value).toBe("2026-07-01");
    expect(r.formula).toBe("TODAY()");
    expect(r.errors).toHaveLength(0);
  });

  // fecha con fórmula sin cache → null + error, NO usa fallback
  it("T-DT2 — fecha: fórmula sin cache → null + error, ignora fallback", () => {
    const cell: RawCell = { v: undefined, f: "TODAY()", hasFormula: true, hasValue: false };
    const r = interpretDateCell(cell, "fecha", "2026-07-14");
    expect(r.errors.some((e) => e.includes("sin valor cacheado") && e.includes("fecha"))).toBe(true);
    expect(r.value).toBeNull(); // NO hereda fallback aunque exista
    expect(r.warnings).toHaveLength(0);
  });

  // vencimiento de caución con fórmula sin cache → null + error
  it("T-DT3 — vencimiento: fórmula sin cache → null + error (campo crítico)", () => {
    const cell: RawCell = { v: undefined, f: "A1+7", hasFormula: true, hasValue: false };
    const r = interpretDateCell(cell, "vencimiento", null);
    expect(r.value).toBeNull();
    expect(r.errors.some((e) => e.includes("sin valor cacheado") && e.includes("vencimiento"))).toBe(true);
    expect(r.warnings).toHaveLength(0);
  });

  // celda vacía sin fórmula → usa fallback (no es lo mismo que fórmula sin cache)
  it("T-DT4 — celda vacía sin fórmula → usa fallback (herencia válida)", () => {
    const cell: RawCell = { v: undefined, f: undefined, hasFormula: false, hasValue: false };
    const r = interpretDateCell(cell, "fecha", "2026-07-14");
    expect(r.value).toBe("2026-07-14");
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });

  // cache = 0 con fórmula → hasValue=true, NO se trata como cache ausente
  it("T-DT5 — fórmula con cache = 0 → hasValue=true, no genera error bloqueante", () => {
    const cell: RawCell = { v: 0, f: "A1+B1", hasFormula: true, hasValue: true };
    const r = interpretDateCell(cell, "fecha", "2026-07-14");
    // v=0 (serial 1899-12-30) está fuera del rango de parseArDate → usa fallback con warning
    // pero NO error bloqueante (≠ cache ausente)
    expect(r.errors).toHaveLength(0);
  });
});
