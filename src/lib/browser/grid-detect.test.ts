import { describe, it, expect } from "vitest";
import {
  computeRowDarkCounts,
  computeColDarkCounts,
  computeColDarkCountsInRange,
  detectLinePositions,
  mergeNearbyLines,
  segmentTablesFromRowLines,
  buildRowBands,
  buildColumnBands,
  trimColumnBandsToCount,
  mergeLeadingBandsToCount,
  trimBlankEdgeBands,
  classifyTableHeader,
  planGridFromGray,
  CAUCION_COLUMN_ORDER,
  COMPRA_VENTA_COLUMN_ORDER,
  type GrayscaleGrid,
} from "./grid-detect";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Grilla en blanco (255 = blanco) de width x height. */
function whiteGrid(width: number, height: number): GrayscaleGrid {
  return { data: new Array(width * height).fill(255), width, height };
}

/** Pinta una línea horizontal completa (todo el ancho) en negro (0) en la fila y. */
function drawHLine(grid: GrayscaleGrid, y: number) {
  for (let x = 0; x < grid.width; x++) {
    (grid.data as number[])[y * grid.width + x] = 0;
  }
}

/** Pinta una línea vertical en negro (0) en la columna x, restringida a [yStart, yEnd). */
function drawVLine(grid: GrayscaleGrid, x: number, yStart: number, yEnd: number) {
  for (let y = yStart; y < yEnd; y++) {
    (grid.data as number[])[y * grid.width + x] = 0;
  }
}

// ── computeRowDarkCounts / computeColDarkCounts ─────────────────────────────

describe("computeRowDarkCounts / computeColDarkCounts", () => {
  it("GRID-1: cuenta correctamente los píxeles oscuros por fila y columna", () => {
    const grid = whiteGrid(10, 5);
    drawHLine(grid, 2);
    drawVLine(grid, 4, 0, 5);

    const rowCounts = computeRowDarkCounts(grid);
    expect(rowCounts[2]).toBe(10); // fila 2 toda negra
    expect(rowCounts[0]).toBe(1); // solo el píxel de la línea vertical

    const colCounts = computeColDarkCounts(grid);
    expect(colCounts[4]).toBe(5); // columna 4 toda negra
  });

  it("GRID-2: computeColDarkCountsInRange restringe el conteo a la franja Y indicada", () => {
    const grid = whiteGrid(10, 20);
    drawVLine(grid, 3, 0, 5); // línea vertical solo en y=[0,5)
    drawVLine(grid, 7, 10, 20); // otra línea vertical solo en y=[10,20)

    const countsInFirstRange = computeColDarkCountsInRange(grid, 0, 5);
    expect(countsInFirstRange[3]).toBe(5);
    expect(countsInFirstRange[7]).toBe(0); // esa línea vive fuera de este rango

    const countsInSecondRange = computeColDarkCountsInRange(grid, 10, 20);
    expect(countsInSecondRange[7]).toBe(10);
    expect(countsInSecondRange[3]).toBe(0);
  });
});

// ── detectLinePositions (detección de líneas) ───────────────────────────────

describe("detectLinePositions", () => {
  it("GRID-3: detecta como línea una fila/columna que cubre >= minCoverage de su eje transversal", () => {
    const counts = [1, 2, 10, 1, 9, 0]; // crossLength = 10
    const positions = detectLinePositions(counts, 10, 0.8);
    expect(positions).toEqual([2, 4]);
  });

  it("GRID-4: el texto (baja cobertura) nunca se confunde con una línea de grilla", () => {
    // Una fila de texto normal tiene pocos píxeles oscuros respecto al ancho total.
    const counts = [30, 500]; // crossLength = 1000 -> 3% y 50%
    const positions = detectLinePositions(counts, 1000, 0.5);
    expect(positions).toEqual([1]);
  });
});

// ── mergeNearbyLines (agrupación de líneas cercanas) ────────────────────────

describe("mergeNearbyLines", () => {
  it("GRID-5: une posiciones contiguas (grosor de línea real de varios px) en una sola posición promedio", () => {
    const merged = mergeNearbyLines([10, 11, 12, 50, 51], 2);
    expect(merged).toEqual([11, 51]);
  });

  it("GRID-6: posiciones lejanas entre sí quedan separadas", () => {
    const merged = mergeNearbyLines([0, 100, 200], 4);
    expect(merged).toEqual([0, 100, 200]);
  });

  it("GRID-7: array vacío devuelve array vacío", () => {
    expect(mergeNearbyLines([])).toEqual([]);
  });
});

// ── segmentTablesFromRowLines / buildRowBands (límites de filas) ───────────

describe("segmentTablesFromRowLines", () => {
  it("GRID-8: agrupa líneas horizontales cercanas en la misma tabla y separa tablas con un salto grande", () => {
    // Tabla 1: líneas en 0,20,40,60 (filas de 20px). Salto grande. Tabla 2: 200,220,240.
    const blocks = segmentTablesFromRowLines([0, 20, 40, 60, 200, 220, 240], 60);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].rowLines).toEqual([0, 20, 40, 60]);
    expect(blocks[1].rowLines).toEqual([200, 220, 240]);
  });

  it("GRID-9: una línea aislada (sin par) nunca forma una tabla válida", () => {
    const blocks = segmentTablesFromRowLines([0, 20, 40, 300], 60);
    // El grupo [300] queda solo — 1 línea no es una tabla.
    expect(blocks).toHaveLength(1);
    expect(blocks[0].rowLines).toEqual([0, 20, 40]);
  });

  it("GRID-10: array vacío no produce tablas", () => {
    expect(segmentTablesFromRowLines([])).toEqual([]);
  });
});

describe("buildRowBands / buildColumnBands (límites de filas y columnas)", () => {
  it("GRID-11: buildRowBands arma bandas consecutivas entre cada par de líneas", () => {
    const bands = buildRowBands([0, 20, 40, 60]);
    expect(bands).toEqual([
      { start: 0, end: 20 },
      { start: 20, end: 40 },
      { start: 40, end: 60 },
    ]);
  });

  it("GRID-12: buildColumnBands usa las líneas interiores y agrega los bordes izquierdo/derecho", () => {
    const bands = buildColumnBands([100, 200, 300], 0, 400);
    expect(bands).toEqual([
      { start: 0, end: 100 },
      { start: 100, end: 200 },
      { start: 200, end: 300 },
      { start: 300, end: 400 },
    ]);
  });

  it("GRID-13: si una línea coincide con el borde, no se duplica", () => {
    const bands = buildColumnBands([0, 150, 400], 0, 400, 6);
    expect(bands).toEqual([
      { start: 0, end: 150 },
      { start: 150, end: 400 },
    ]);
  });
});

describe("trimColumnBandsToCount", () => {
  it("GRID-13b: recorta un margen angosto sobrante desde el extremo izquierdo", () => {
    // Real E4.6C: un margen en blanco de 58px antes de la primera columna de
    // datos real (148px+) — mucho más angosto que cualquier columna legítima.
    const bands = [
      { start: 0, end: 58 },
      { start: 58, end: 206 },
      { start: 206, end: 332 },
      { start: 332, end: 457 },
      { start: 457, end: 609 },
      { start: 609, end: 748 },
      { start: 748, end: 893 },
    ];
    const trimmed = trimColumnBandsToCount(bands, 6);
    expect(trimmed).toEqual(bands.slice(1));
  });

  it("GRID-13c: nunca recorta del medio — una columna angosta legítima (VN) se conserva", () => {
    const bands = [
      { start: 0, end: 150 },
      { start: 150, end: 180 }, // columna angosta legítima en el medio
      { start: 180, end: 320 },
    ];
    const trimmed = trimColumnBandsToCount(bands, 3);
    expect(trimmed).toEqual(bands); // ya tiene la cantidad esperada, no se toca
  });

  it("GRID-13d: si ya coincide con la cantidad esperada, no cambia nada", () => {
    const bands = [
      { start: 0, end: 100 },
      { start: 100, end: 200 },
    ];
    expect(trimColumnBandsToCount(bands, 2)).toEqual(bands);
  });
});

describe("mergeLeadingBandsToCount (E4.6C.1 — CAUCION con celda OPERACION combinada)", () => {
  it("GRID-27: fusiona las bandas líderes en una sola celda OPERACION ancha — layout real de la caución", () => {
    // 8 bandas físicas de grilla (compartidas con las tablas de compra/venta),
    // pero CAUCION solo tiene 6 columnas reales: "CAUCION COL." ocupa el
    // ancho de las primeras 3 bandas (margen en blanco + 2 columnas reales).
    const bands = [
      { start: 0, end: 58 },
      { start: 58, end: 206 },
      { start: 206, end: 332 },
      { start: 332, end: 457 },
      { start: 457, end: 609 },
      { start: 609, end: 748 },
      { start: 748, end: 893 },
      { start: 893, end: 1090 },
    ];
    const merged = mergeLeadingBandsToCount(bands, 6);
    expect(merged).toEqual([
      { start: 0, end: 332 }, // OPERACION combinada
      { start: 332, end: 457 }, // FECHA_CONC
      { start: 457, end: 609 }, // VTO
      { start: 609, end: 748 }, // MONTO_INICIAL
      { start: 748, end: 893 }, // TASA
      { start: 893, end: 1090 }, // MONTO_COBRAR_PAGAR
    ]);
  });

  it("GRID-28: si ya coincide con la cantidad esperada, no cambia nada", () => {
    const bands = [
      { start: 0, end: 100 },
      { start: 100, end: 200 },
    ];
    expect(mergeLeadingBandsToCount(bands, 2)).toEqual(bands);
  });
});

describe("trimBlankEdgeBands (E4.6C.1 — recorte de CAUCION por contenido real, no por ancho)", () => {
  function gridWithInkOnlyInMiddleBands(width: number, height: number, bands: number[][]): GrayscaleGrid {
    const data = new Array(width * height).fill(255);
    for (const [x0, x1] of bands) {
      for (let y = 3; y < height - 3; y += 2) {
        for (let x = x0 + 2; x < x1 - 2; x += 3) data[y * width + x] = 0;
      }
    }
    return { data, width, height };
  }

  it("GRID-30: descarta el margen izquierdo angosto Y el sobrante final ANCHO (sin contenido), aunque el sobrante sea más ancho que las columnas reales", () => {
    // Reproduce la geometría real: 8 bandas físicas, la 1a angosta (58px, sin
    // tinta) y la última ancha (197px, TAMBIÉN sin tinta) — un recorte por
    // ancho puro (trimColumnBandsToCount) nunca elegiría esta última por ser
    // la más ancha del conjunto.
    const bands = [
      { start: 0, end: 58 },
      { start: 58, end: 206 },
      { start: 206, end: 332 },
      { start: 332, end: 457 },
      { start: 457, end: 609 },
      { start: 609, end: 748 },
      { start: 748, end: 893 },
      { start: 893, end: 1090 },
    ];
    const grid = gridWithInkOnlyInMiddleBands(1090, 50, [
      [58, 206],
      [206, 332],
      [332, 457],
      [457, 609],
      [609, 748],
      [748, 893],
    ]);

    const trimmed = trimBlankEdgeBands(bands, grid, [{ start: 0, end: 50 }], 6);
    expect(trimmed).toEqual(bands.slice(1, 7));
  });

  it("GRID-31: si ningún extremo está vacío, cae al recorte por ancho como último recurso", () => {
    const bands = [
      { start: 0, end: 60 }, // angosto, CON contenido
      { start: 60, end: 200 },
      { start: 200, end: 340 },
      { start: 340, end: 500 }, // ancho, CON contenido
    ];
    const grid = gridWithInkOnlyInMiddleBands(500, 50, [
      [0, 60],
      [60, 200],
      [200, 340],
      [340, 500],
    ]);

    const trimmed = trimBlankEdgeBands(bands, grid, [{ start: 0, end: 50 }], 3);
    // Ningún extremo está vacío -> recorte por ancho: descarta el más angosto de los dos extremos.
    expect(trimmed).toEqual(trimColumnBandsToCount(bands, 3));
  });

  it("GRID-32: si ya coincide con la cantidad esperada, no cambia nada", () => {
    const bands = [
      { start: 0, end: 100 },
      { start: 100, end: 200 },
    ];
    const grid = gridWithInkOnlyInMiddleBands(200, 50, [[0, 200]]);
    expect(trimBlankEdgeBands(bands, grid, [{ start: 0, end: 50 }], 2)).toEqual(bands);
  });
});

// ── classifyTableHeader (clasificación caución vs compra/venta) ────────────

describe("classifyTableHeader", () => {
  it("GRID-14: clasifica como CAUCION cuando el encabezado tiene VTO/MONTO COL./TASA/MONTO A COBRAR", () => {
    expect(classifyTableHeader(["OPERACION FECHA CONC. VTO MONTO COL. TASA MONTO A COBRAR"])).toBe("CAUCION");
  });

  it("GRID-15: clasifica como COMPRA_VENTA cuando el encabezado tiene BONO/VN/PRECIO/MONTO NETO/PLAZO", () => {
    expect(classifyTableHeader(["OPERACION FECHA CONC. BONO VN PRECIO MONTO NETO PLAZO"])).toBe("COMPRA_VENTA");
  });

  it("GRID-16: encabezado ilegible o ambiguo se clasifica como DESCONOCIDA — nunca se inventa el tipo", () => {
    expect(classifyTableHeader(["asdf qwer"])).toBe("DESCONOCIDA");
    expect(classifyTableHeader(["VTO BONO VN TASA"])).toBe("DESCONOCIDA"); // mezcla ambigua
  });
});

// ── planGridFromGray — layout sintético real (E4.6C) ────────────────────────
//
// Modela la estructura visual real de la imagen fixture: encabezado DANIEL/
// 11538 (sin líneas), tabla de caución (1 fila de datos, 6 columnas), tabla
// compra/venta #1 (7 filas, 7 columnas), tabla compra/venta #2 (3 filas, 7
// columnas) — separadas por huecos > minTableGap donde vive el texto
// ignorado ("Tipo de cambio Neto"), que nunca entra a ninguna tabla porque
// cae fuera de cualquier rowBand detectada.

function makeRealLayoutGrid(): GrayscaleGrid {
  const width = 700;
  const height = 620;
  const grid = whiteGrid(width, height);

  // Tabla 1 — caución: header 30-50, 1 fila de datos 50-70. 6 columnas.
  const caucionLines = [30, 50, 70];
  caucionLines.forEach((y) => drawHLine(grid, y));
  const caucionCols = [80, 220, 340, 460, 560];
  caucionCols.forEach((x) => drawVLine(grid, x, 30, 70));

  // Tabla 2 — compra/venta #1: header 140-160, 7 filas de datos (160-300). 7 columnas.
  const table2Lines = [140, 160, 180, 200, 220, 240, 260, 280, 300];
  table2Lines.forEach((y) => drawHLine(grid, y));
  const table2Cols = [80, 180, 280, 380, 460, 560];
  table2Cols.forEach((x) => drawVLine(grid, x, 140, 300));

  // Tabla 3 — compra/venta #2: header 400-420, 3 filas de datos (420-480). 7 columnas.
  const table3Lines = [400, 420, 440, 460, 480];
  table3Lines.forEach((y) => drawHLine(grid, y));
  const table3Cols = [80, 180, 280, 380, 460, 560];
  table3Cols.forEach((x) => drawVLine(grid, x, 400, 480));

  return grid;
}

describe("planGridFromGray — layout real de 11 filas (E4.6C)", () => {
  it("GRID-17: segmenta las 3 tablas separadas por el hueco donde vive el texto ignorado", () => {
    const plan = planGridFromGray(makeRealLayoutGrid());
    expect(plan).not.toBeNull();
    expect(plan!.tables).toHaveLength(3);
  });

  it("GRID-18: el total de filas de datos across las 3 tablas es exactamente 11 (1 + 7 + 3)", () => {
    const plan = planGridFromGray(makeRealLayoutGrid());
    const totalDataRows = plan!.tables.reduce((s, t) => s + t.dataRowBands.length, 0);
    expect(totalDataRows).toBe(11);
    expect(plan!.tables[0].dataRowBands).toHaveLength(1);
    expect(plan!.tables[1].dataRowBands).toHaveLength(7);
    expect(plan!.tables[2].dataRowBands).toHaveLength(3);
  });

  it("GRID-19: cada tabla tiene suficientes bandas de columna para mapear su tipo de fila", () => {
    const plan = planGridFromGray(makeRealLayoutGrid());
    for (const table of plan!.tables) {
      expect(table.columnBands.length).toBeGreaterThanOrEqual(CAUCION_COLUMN_ORDER.length - 1);
      expect(table.columnBands.length).toBeLessThanOrEqual(COMPRA_VENTA_COLUMN_ORDER.length);
    }
  });

  it("GRID-20: sin líneas de grilla (imagen sin bordes) devuelve null — la llamadora debe usar el fallback genérico", () => {
    expect(planGridFromGray(whiteGrid(200, 200))).toBeNull();
  });
});
