// Detección de grilla visual (E4.6C) — primitivas puras, sin dependencias de
// Canvas/DOM/Tesseract, para poder testearlas con datos sintéticos. El modo
// GRID de ocr-bolsa.ts las usa sobre un grayscale real extraído de un canvas;
// los tests las ejercitan con arrays de intensidad construidos a mano.

export interface GrayscaleGrid {
  data: Uint8ClampedArray | number[];
  width: number;
  height: number;
}

/** Cuenta de píxeles "oscuros" (< darkThreshold) por fila — proyección horizontal. */
export function computeRowDarkCounts(grid: GrayscaleGrid, darkThreshold = 128): number[] {
  const { data, width, height } = grid;
  const counts = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    let c = 0;
    const rowStart = y * width;
    for (let x = 0; x < width; x++) {
      if (data[rowStart + x] < darkThreshold) c++;
    }
    counts[y] = c;
  }
  return counts;
}

/** Cuenta de píxeles "oscuros" (< darkThreshold) por columna — proyección vertical. */
export function computeColDarkCounts(grid: GrayscaleGrid, darkThreshold = 128): number[] {
  return computeColDarkCountsInRange(grid, 0, grid.height, darkThreshold);
}

/**
 * Igual que computeColDarkCounts pero restringida a una franja vertical
 * [yStart, yEnd) — las líneas verticales de una tabla solo existen dentro de
 * su propio rango de filas, nunca a lo largo de toda la imagen, así que las
 * líneas de columna de cada tabla deben detectarse dentro de su propia
 * franja, no globalmente.
 */
export function computeColDarkCountsInRange(
  grid: GrayscaleGrid,
  yStart: number,
  yEnd: number,
  darkThreshold = 128,
): number[] {
  const { data, width } = grid;
  const counts = new Array(width).fill(0);
  const from = Math.max(0, yStart);
  const to = Math.min(grid.height, yEnd);
  for (let y = from; y < to; y++) {
    const rowStart = y * width;
    for (let x = 0; x < width; x++) {
      if (data[rowStart + x] < darkThreshold) counts[x]++;
    }
  }
  return counts;
}

/**
 * Una posición es "línea" cuando la fracción de píxeles oscuros a lo largo de
 * su eje transversal supera minCoverage — una línea de grilla real cubre casi
 * todo el ancho/alto de la tabla, a diferencia del texto (que solo ocupa una
 * fracción pequeña de su fila/columna).
 */
export function detectLinePositions(counts: number[], crossLength: number, minCoverage = 0.5): number[] {
  if (crossLength <= 0) return [];
  const positions: number[] = [];
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] / crossLength >= minCoverage) positions.push(i);
  }
  return positions;
}

/**
 * Une posiciones de línea contiguas (a distancia <= maxGap) en una sola
 * posición promedio — una línea de grilla de 2-3px de grosor produce varias
 * posiciones consecutivas que representan la MISMA línea física.
 */
export function mergeNearbyLines(positions: number[], maxGap = 4): number[] {
  if (positions.length === 0) return [];
  const sorted = [...positions].sort((a, b) => a - b);
  const merged: number[] = [];
  let group: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - group[group.length - 1] <= maxGap) {
      group.push(sorted[i]);
    } else {
      merged.push(Math.round(group.reduce((a, b) => a + b, 0) / group.length));
      group = [sorted[i]];
    }
  }
  merged.push(Math.round(group.reduce((a, b) => a + b, 0) / group.length));
  return merged;
}

export interface TableBlock {
  top: number;
  bottom: number;
  /** Líneas horizontales (bordes de fila) dentro de esta tabla, de arriba a abajo. */
  rowLines: number[];
}

/**
 * Agrupa líneas horizontales en tablas separadas: un salto grande entre dos
 * líneas consecutivas (texto suelto, "Tipo de cambio Neto", espacio en
 * blanco, o directamente el borde compartido entre dos tablas contiguas)
 * marca el fin de una tabla y el inicio de la siguiente. Una tabla válida
 * necesita al menos 2 líneas (borde superior + al menos un separador de
 * fila) — una línea aislada no forma una tabla.
 *
 * Sin `minGapForNewTable` explícito, el umbral es ADAPTATIVO: se calcula
 * sobre la mediana de los saltos entre líneas consecutivas. Un umbral fijo
 * no sirve porque una fila real puede ser mucho más alta que sus vecinas
 * (p.ej. la fila de datos de una caución, con más texto por celda, contra
 * las filas angostas de compra/venta) sin que eso sea un salto entre tablas
 * — así que el punto de corte se define en relación a la altura de fila
 * típica del documento, no como un valor absoluto de píxeles.
 */
export function segmentTablesFromRowLines(rowLines: number[], minGapForNewTable?: number): TableBlock[] {
  if (rowLines.length === 0) return [];
  const sorted = [...rowLines].sort((a, b) => a - b);

  let threshold = minGapForNewTable;
  if (threshold === undefined) {
    const gaps = sorted.slice(1).map((v, i) => v - sorted[i]);
    if (gaps.length === 0) {
      threshold = 60;
    } else {
      const sortedGaps = [...gaps].sort((a, b) => a - b);
      const median = sortedGaps[Math.floor(sortedGaps.length / 2)];
      // Umbral generoso a propósito: separar tablas realmente distintas (un
      // salto grande de texto/espacio en blanco) es la única responsabilidad
      // de esta pasada. Distinguir una fila más alta dentro de un bloque
      // (p.ej. la única fila de una caución pegada a la tabla siguiente sin
      // espacio real entre ambas) es responsabilidad de splitByRowHeightOutlier,
      // que corre después con un criterio más fino.
      threshold = Math.max(median * 3, median + 10);
    }
  }

  const blocks: TableBlock[] = [];
  let current: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - current[current.length - 1] <= threshold) {
      current.push(sorted[i]);
    } else {
      blocks.push({ top: current[0], bottom: current[current.length - 1], rowLines: current });
      current = [sorted[i]];
    }
  }
  blocks.push({ top: current[0], bottom: current[current.length - 1], rowLines: current });

  return blocks.filter((b) => b.rowLines.length >= 2).flatMap(splitByRowHeightOutlier);
}

/**
 * Cuando dos tablas están apiladas sin espacio real entre ellas (comparten la
 * misma línea de borde — el fondo de una es el techo de la siguiente), el
 * salto entre líneas no sirve para separarlas: la única señal geométrica
 * disponible es que la ÚLTIMA fila de datos de la primera tabla es mucho más
 * alta que el resto (p.ej. la única fila de una caución, con más texto por
 * celda, contra las filas angostas de compra/venta que le siguen sin
 * separación). Se busca una banda cuya altura sea un outlier muy por encima
 * de la mediana del bloque — nunca la primera banda (el propio encabezado
 * puede ser legítimamente más alto) — y se corta el bloque justo después,
 * compartiendo esa línea límite entre ambos sub-bloques resultantes.
 */
function splitByRowHeightOutlier(block: TableBlock): TableBlock[] {
  const lines = block.rowLines;
  if (lines.length < 4) return [block];

  const heights: number[] = [];
  for (let i = 1; i < lines.length; i++) heights.push(lines[i] - lines[i - 1]);

  const sortedHeights = [...heights].sort((a, b) => a - b);
  const median = sortedHeights[Math.floor(sortedHeights.length / 2)];

  for (let i = 1; i < heights.length - 1; i++) {
    if (heights[i] > median * 1.6 && heights[i] > heights[0] * 1.3) {
      const splitLineIndex = i + 1;
      const firstLines = lines.slice(0, splitLineIndex + 1);
      const secondLines = lines.slice(splitLineIndex);
      if (firstLines.length >= 2 && secondLines.length >= 2) {
        return [
          { top: firstLines[0], bottom: firstLines[firstLines.length - 1], rowLines: firstLines },
          ...splitByRowHeightOutlier({
            top: secondLines[0],
            bottom: secondLines[secondLines.length - 1],
            rowLines: secondLines,
          }),
        ];
      }
    }
  }
  return [block];
}

export interface Band {
  start: number;
  end: number;
}

/** Bandas de fila: el espacio entre cada par de líneas horizontales consecutivas. */
export function buildRowBands(rowLines: number[]): Band[] {
  const sorted = [...rowLines].sort((a, b) => a - b);
  const bands: Band[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    bands.push({ start: sorted[i], end: sorted[i + 1] });
  }
  return bands;
}

/**
 * Bandas de columna dentro de los límites [left, right] de una tabla — solo
 * usa las líneas verticales que caen dentro de ese rango, e incluye los
 * bordes izquierdo/derecho como límites implícitos si ninguna línea detectada
 * coincide exactamente con ellos.
 */
export function buildColumnBands(vLines: number[], left: number, right: number, edgeTolerance = 6): Band[] {
  const inside = vLines.filter((x) => x >= left - edgeTolerance && x <= right + edgeTolerance).sort((a, b) => a - b);

  const bounds: number[] = [];
  if (inside.length === 0 || inside[0] - left > edgeTolerance) bounds.push(left);
  for (const x of inside) bounds.push(x);
  if (inside.length === 0 || right - inside[inside.length - 1] > edgeTolerance) bounds.push(right);

  const bands: Band[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    if (bounds[i + 1] - bounds[i] > 0) bands.push({ start: bounds[i], end: bounds[i + 1] });
  }
  return bands;
}

/**
 * Cuando se detectan más bandas de columna que campos esperados para el tipo
 * de tabla ya clasificado, la(s) banda(s) sobrante(s) suele ser un margen en
 * blanco sin contenido real (p.ej. el borde exterior izquierdo de la tabla,
 * detectado como línea propia pero sin ninguna celda de dato detrás) — mucho
 * más angosta que las columnas de datos reales. Se recorta desde los
 * extremos (nunca del medio, donde sí puede haber una columna angosta
 * legítima como VN) descartando en cada paso el extremo más angosto, hasta
 * llegar a la cantidad de columnas esperada.
 */
export function trimColumnBandsToCount(bands: Band[], expectedCount: number): Band[] {
  let result = [...bands];
  while (result.length > expectedCount && result.length > 0) {
    const firstWidth = result[0].end - result[0].start;
    const lastWidth = result[result.length - 1].end - result[result.length - 1].start;
    if (firstWidth <= lastWidth) {
      result = result.slice(1);
    } else {
      result = result.slice(0, -1);
    }
  }
  return result;
}

/**
 * En tablas de caución, "CAUCION COL." (o "CAUCION TOMADORA") a veces ocupa
 * visualmente más ancho que el resto de las celdas de operación — cuando eso
 * pasa, la celda OPERACION real abarca varias bandas de columna de la grilla
 * física compartida con las tablas de compra/venta. Acá se FUSIONAN las
 * bandas líderes en una sola celda OPERACION ancha, y el resto de las
 * columnas se mapean 1 a 1 — nunca se descarta contenido real, solo se
 * amplía dónde hace falta. Ver trimBlankEdgeBands para el caso (más común en
 * la práctica) de un margen vacío en vez de una celda realmente fusionada.
 */
export function mergeLeadingBandsToCount(bands: Band[], expectedCount: number): Band[] {
  if (bands.length <= expectedCount) return bands;
  const mergeCount = bands.length - expectedCount + 1;
  const merged: Band = { start: bands[0].start, end: bands[mergeCount - 1].end };
  return [merged, ...bands.slice(mergeCount)];
}

/**
 * Tinta dentro de una banda, restringida a UNA fila (nunca un rango que
 * abarque varias filas): si el rango cruzara una línea divisoria horizontal
 * entre filas, esa línea —que cubre todo el ancho de la tabla— contaminaría
 * por igual a TODAS las bandas, incluidas las genuinamente vacías. Al pasar
 * el propio rowBand (que ya excluye sus líneas superior/inferior vía
 * borderMargin) esa contaminación nunca ocurre.
 */
function countInkInBand(
  grid: GrayscaleGrid,
  band: Band,
  rowBand: Band,
  darkThreshold: number,
  borderMargin: number,
): number {
  const { data, width } = grid;
  const y0 = Math.min(rowBand.end, rowBand.start + borderMargin);
  const y1 = Math.max(y0, rowBand.end - borderMargin);
  const x0 = Math.min(band.end, band.start + borderMargin);
  const x1 = Math.max(x0, band.end - borderMargin);
  let count = 0;
  for (let y = y0; y < y1; y++) {
    const rowStart = y * width;
    for (let x = x0; x < x1; x++) {
      if (data[rowStart + x] < darkThreshold) count++;
    }
  }
  return count;
}

function sumInkAcrossRows(grid: GrayscaleGrid, band: Band, rowBands: Band[], darkThreshold: number, borderMargin: number): number {
  let total = 0;
  for (const rowBand of rowBands) {
    total += countInkInBand(grid, band, rowBand, darkThreshold, borderMargin);
  }
  return total;
}

export interface TrimBlankEdgeOptions {
  darkThreshold?: number;
  /** Franja en px a ignorar cerca de cada borde (horizontal Y vertical) de
   * la celda — evita contar la propia línea de grilla como "tinta" de
   * contenido, tanto la línea divisoria de fila como la de columna. */
  borderMargin?: number;
  /** Tinta máxima para considerar una banda "vacía". */
  minInk?: number;
}

/**
 * Recorta bandas de columna sobrantes basándose en CONTENIDO real (tinta),
 * no en ancho — un margen vacío puede ser tan ancho como una columna con
 * datos real (p.ej. el espacio sobrante al final de una tabla de caución,
 * que tiene menos columnas que las de compra/venta pero comparte la misma
 * grilla física, así que su margen final resulta más ancho que cualquier
 * columna real, no más angosto). trimColumnBandsToCount asume que el margen
 * siempre es la banda más angosta — cuando esa asunción falla, esta función
 * mira el píxel real dentro de cada extremo para decidir. La tinta se suma
 * fila por fila (nunca sobre un rango que mezcle varias filas) para no
 * confundir una línea divisoria horizontal con contenido real. Si ninguno de
 * los dos extremos está genuinamente vacío, cae al recorte por ancho como
 * último recurso.
 */
export function trimBlankEdgeBands(
  bands: Band[],
  grid: GrayscaleGrid,
  rowBands: Band[],
  expectedCount: number,
  opts: TrimBlankEdgeOptions = {},
): Band[] {
  const darkThreshold = opts.darkThreshold ?? 180;
  const borderMargin = opts.borderMargin ?? 3;
  const minInk = opts.minInk ?? 2;

  let result = [...bands];
  while (result.length > expectedCount) {
    const frontInk = sumInkAcrossRows(grid, result[0], rowBands, darkThreshold, borderMargin);
    const backInk = sumInkAcrossRows(grid, result[result.length - 1], rowBands, darkThreshold, borderMargin);

    if (frontInk <= minInk && frontInk <= backInk) {
      result = result.slice(1);
    } else if (backInk <= minInk) {
      result = result.slice(0, -1);
    } else {
      // Ningún extremo está realmente vacío — no hay señal de contenido para
      // decidir, recortar por ancho como último recurso.
      return trimColumnBandsToCount(result, expectedCount);
    }
  }
  return result;
}

export type TableKind = "CAUCION" | "COMPRA_VENTA" | "DESCONOCIDA";

const CAUCION_HEADER_PATTERN = /\bVTO\b|\bVCTO\b|MONTO\s*COL|MONTO\s*TOM|\bTASA\b|COBRAR|PAGAR/i;
const COMPRA_VENTA_HEADER_PATTERN = /\bBONO\b|\bFUTURO\b|\bVN\b|\bNOMINAL\b|\bPLAZO\b|MONTO\s*NETO/i;

/**
 * Clasifica una tabla por el texto OCR de su fila de encabezado — cauciones
 * llevan VTO/MONTO COL.-TOM./TASA/MONTO A COBRAR-PAGAR; compra/venta llevan
 * BONO (o FUTURO)/VN/PRECIO/MONTO NETO/PLAZO. Nunca se decide por cercanía de
 * columnas entre filas — solo por el vocabulario del propio encabezado.
 */
export function classifyTableHeader(headerCellsText: string[]): TableKind {
  const text = headerCellsText.join(" ");
  const isCaucion = CAUCION_HEADER_PATTERN.test(text);
  const isCompraVenta = COMPRA_VENTA_HEADER_PATTERN.test(text);

  if (isCaucion && !isCompraVenta) return "CAUCION";
  if (isCompraVenta && !isCaucion) return "COMPRA_VENTA";
  return "DESCONOCIDA";
}

/** Orden fijo de columnas por tipo de tabla — una vez clasificada la tabla, la
 * posición geométrica (no el texto) decide qué campo es cada columna. */
export const CAUCION_COLUMN_ORDER = [
  "OPERACION",
  "FECHA_CONC",
  "VTO",
  "MONTO_INICIAL",
  "TASA",
  "MONTO_COBRAR_PAGAR",
] as const;

export const COMPRA_VENTA_COLUMN_ORDER = [
  "OPERACION",
  "FECHA_CONC",
  "TICKER",
  "CANTIDAD",
  "PRECIO",
  "MONTO",
  "PLAZO",
] as const;

export type CaucionColumnKey = (typeof CAUCION_COLUMN_ORDER)[number];
export type CompraVentaColumnKey = (typeof COMPRA_VENTA_COLUMN_ORDER)[number];

// ── Plan de lectura por grilla (puro — geometría únicamente, sin OCR) ───────

export interface GridTablePlan {
  /** Franja Y de la fila de encabezado de esta tabla. */
  headerBand: Band;
  /** Franjas Y de las filas de datos (todo lo que sigue al encabezado). */
  dataRowBands: Band[];
  /** Franjas X de columna, de izquierda a derecha. */
  columnBands: Band[];
}

export interface GridDetectionPlan {
  /** Franja Y por encima de la primera tabla — ahí vive "NOMBRE NUMERO". */
  comitenteHeaderBand: Band;
  tables: GridTablePlan[];
}

export interface PlanGridOptions {
  darkThreshold?: number;
  minRowCoverage?: number;
  minColCoverage?: number;
  lineMergeGap?: number;
  minTableGap?: number;
  /** Mínimo de bandas de columna para aceptar una tabla como válida. */
  minColumnBands?: number;
}

/**
 * Construye el plan geométrico completo de lectura por grilla a partir de un
 * grayscale: detecta líneas horizontales, segmenta tablas separadas, y dentro
 * de cada tabla detecta sus propias líneas verticales (restringidas a su
 * franja de filas — una tabla más angosta que otra no hereda columnas
 * ajenas). Devuelve null cuando no hay líneas suficientes para reconstruir al
 * menos una tabla válida — la llamadora debe caer al OCR genérico (fallback).
 */
export function planGridFromGray(grid: GrayscaleGrid, opts: PlanGridOptions = {}): GridDetectionPlan | null {
  const darkThreshold = opts.darkThreshold ?? 128;
  const minRowCoverage = opts.minRowCoverage ?? 0.5;
  const minColCoverage = opts.minColCoverage ?? 0.5;
  const lineMergeGap = opts.lineMergeGap ?? 4;
  // Sin valor explícito, segmentTablesFromRowLines calcula un umbral
  // adaptativo según la altura de fila típica del documento.
  const minTableGap = opts.minTableGap;
  const minColumnBands = opts.minColumnBands ?? 3;

  const rowCounts = computeRowDarkCounts(grid, darkThreshold);
  const rawRowLines = detectLinePositions(rowCounts, grid.width, minRowCoverage);
  const rowLines = mergeNearbyLines(rawRowLines, lineMergeGap);

  const tableBlocks = segmentTablesFromRowLines(rowLines, minTableGap);
  if (tableBlocks.length === 0) return null;

  const comitenteHeaderBand: Band = { start: 0, end: tableBlocks[0].top };

  const tables: GridTablePlan[] = [];
  for (const block of tableBlocks) {
    const rowBands = buildRowBands(block.rowLines);
    if (rowBands.length < 2) continue;

    const colCounts = computeColDarkCountsInRange(grid, block.top, block.bottom, darkThreshold);
    const rawColLines = detectLinePositions(colCounts, block.bottom - block.top, minColCoverage);
    const colLines = mergeNearbyLines(rawColLines, lineMergeGap);
    const columnBands = buildColumnBands(colLines, 0, grid.width);
    if (columnBands.length < minColumnBands) continue;

    tables.push({ headerBand: rowBands[0], dataRowBands: rowBands.slice(1), columnBands });
  }

  if (tables.length === 0) return null;
  return { comitenteHeaderBand, tables };
}
