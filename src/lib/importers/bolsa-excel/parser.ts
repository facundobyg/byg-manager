import * as XLSX from "xlsx";
import type {
  BolsaExcelParseResult,
  BolsaExcelBloque,
  BolsaExcelRawOp,
  BolsaExcelParseOptions,
  BolsaExcelColumnMapping,
} from "./types";
import {
  interpretNumericCell,
  interpretTextCell,
  interpretDateCell,
  detectMoneda,
  inferMonedaFromTicker,
  normalizeOpBase,
  normalizePlazo,
  normalizeHeaderCell,
  type RawCell,
} from "./normalize";

// ── Celda interna del parser ─────────────────────────────────────────────────

interface CellData {
  value: unknown;
  formula: string | undefined;
  hasFormula: boolean;
  hasValue: boolean;
  type: string;
  formatted: string | undefined;
}

// Maps nombre canónico → índice de columna 0-based
type ColIndexMap = Record<string, number>;

// ── Lectura de celdas ────────────────────────────────────────────────────────

function readRowCells(
  ws: XLSX.WorkSheet,
  rowIdx: number,
  maxCol: number
): Record<string, CellData> {
  const result: Record<string, CellData> = {};
  for (let c = 0; c <= maxCol; c++) {
    const addr = XLSX.utils.encode_cell({ r: rowIdx, c });
    const cell = ws[addr] as XLSX.CellObject | undefined;
    if (!cell) continue;
    const hasValue = cell.v !== undefined && cell.v !== null;
    const hasFormula = !!cell.f;
    if (!hasValue && !hasFormula) continue;
    result[XLSX.utils.encode_col(c)] = {
      value: hasValue ? cell.v : null,
      formula: cell.f,
      hasFormula,
      hasValue,
      type: cell.t ?? "z",
      formatted: cell.w,
    };
  }
  return result;
}

function getTextValues(cells: Record<string, CellData>): string[] {
  return Object.values(cells)
    .filter((c) => c.value !== null && c.value !== undefined && String(c.value).trim() !== "")
    .map((c) => String(c.value).trim());
}

function getCellByColIdx(
  cells: Record<string, CellData>,
  colIdx: number
): CellData | undefined {
  return cells[XLSX.utils.encode_col(colIdx)];
}

function getRawCells(cells: Record<string, CellData>): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [col, cell] of Object.entries(cells)) {
    raw[col] = cell.hasFormula ? `=${cell.formula}` : cell.value;
  }
  return raw;
}

function toRawCell(cell: CellData): RawCell {
  return {
    v: cell.value,
    f: cell.formula,
    hasFormula: cell.hasFormula,
    hasValue: cell.hasValue,
  };
}

// ── Clasificación de filas ────────────────────────────────────────────────────

const IGNORE_ROW_RE =
  /resultado\s+pesos|resultado\s+u\.?s\.?d\.?|tipo\s+de\s+cambio\s+neto|tc\s+neto|\bsubtotal\b|\btotal\b|saldo\s+final/i;

const OP_TEXT_RE = /^(compra|venta|cauci[oó]n)/i;

function isOperationText(text: string): boolean {
  return OP_TEXT_RE.test(text.trim());
}

function tryBuildColMap(cells: Record<string, CellData>): ColIndexMap | null {
  const map: ColIndexMap = {};
  for (const [colLetter, cell] of Object.entries(cells)) {
    if (!cell.value) continue;
    const canonical = normalizeHeaderCell(String(cell.value));
    if (canonical) map[canonical] = XLSX.utils.decode_col(colLetter);
  }
  return Object.keys(map).length >= 2 ? map : null;
}

function colMapToColumnMapping(map: ColIndexMap): BolsaExcelColumnMapping {
  const result: BolsaExcelColumnMapping = {};
  for (const [key, idx] of Object.entries(map)) {
    (result as Record<string, string>)[key] = XLSX.utils.encode_col(idx);
  }
  return result;
}

type RowClass = "EMPTY" | "IGNORE" | "COLUMN_HEADER" | "OPERATION" | "COMITENTE_INFO";

function classifyRow(
  cells: Record<string, CellData>,
  colIndexMap: ColIndexMap | null
): RowClass {
  const textVals = getTextValues(cells);
  if (textVals.length === 0) return "EMPTY";
  if (IGNORE_ROW_RE.test(textVals.join(" "))) return "IGNORE";
  if (tryBuildColMap(cells)) return "COLUMN_HEADER";

  if (colIndexMap?.operacion !== undefined) {
    const opCell = getCellByColIdx(cells, colIndexMap.operacion);
    if (opCell?.value && String(opCell.value).trim()) {
      if (isOperationText(String(opCell.value))) return "OPERATION";
      // Op desconocida: confirmar con valor en otra columna mapeada (fecha/ticker/cantidad)
      const hasSecondaryValue =
        (colIndexMap.fecha !== undefined && getCellByColIdx(cells, colIndexMap.fecha)?.hasValue) ||
        (colIndexMap.ticker !== undefined && getCellByColIdx(cells, colIndexMap.ticker)?.hasValue) ||
        (colIndexMap.cantidad !== undefined && getCellByColIdx(cells, colIndexMap.cantidad)?.hasValue);
      if (hasSecondaryValue) return "OPERATION";
    }
  }
  if (textVals.length > 0 && isOperationText(textVals[0])) return "OPERATION";

  return "COMITENTE_INFO";
}

function extractComitenteInfo(textVals: string[]): {
  name: string | null;
  nro: string | null;
} {
  let name: string | null = null;
  let nro: string | null = null;
  for (const t of textVals) {
    if (/^\d{4,8}$/.test(t)) {
      nro = t;
    } else if (/[a-záéíóúñü]/i.test(t) && t.length > 2 && !isOperationText(t)) {
      name = t;
    }
  }
  return { name, nro };
}

// ── Parsing de una fila de operación ─────────────────────────────────────────

function parseNumericColCell(
  cells: Record<string, CellData>,
  colIdx: number | undefined,
  field: "cantidad" | "precio" | "monto" | "tasa"
): { value: string | null; rawStr: string; warnings: string[]; errors: string[] } {
  if (colIdx === undefined) return { value: null, rawStr: "", warnings: [], errors: [] };
  const cell = getCellByColIdx(cells, colIdx);
  if (!cell) return { value: null, rawStr: "", warnings: [], errors: [] };
  const result = interpretNumericCell(toRawCell(cell), field);
  return { value: result.value, rawStr: result.rawStr, warnings: result.warnings, errors: result.errors };
}

function parseDateColCell(
  cells: Record<string, CellData>,
  colIdx: number | undefined,
  fallback: string | null
): { fecha: string | null; warnings: string[]; errors: string[] } {
  if (colIdx === undefined) return { fecha: fallback, warnings: [], errors: [] };
  const cell = getCellByColIdx(cells, colIdx);
  if (!cell) return { fecha: fallback, warnings: [], errors: [] };
  const r = interpretDateCell(toRawCell(cell), "fecha", fallback);
  return { fecha: r.value, warnings: r.warnings, errors: r.errors };
}

function buildOperation(
  cells: Record<string, CellData>,
  colIndexMap: ColIndexMap | null,
  rowNumber: number,
  fallbackFecha: string | null
): BolsaExcelRawOp {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!colIndexMap) {
    errors.push("Operación detectada sin fila de encabezados (sin columnMapping)");
  }

  // rawOperacion (crítico: fórmula sin cache → error)
  const opColIdx = colIndexMap?.operacion;
  let rawOperacion = "";
  if (opColIdx !== undefined) {
    const cell = getCellByColIdx(cells, opColIdx);
    if (cell) {
      const r = interpretTextCell(toRawCell(cell), "operacion", true);
      errors.push(...r.errors);
      rawOperacion = r.value ?? "";
    }
  } else {
    rawOperacion = getTextValues(cells)[0] ?? "";
  }

  const operacionBase = normalizeOpBase(rawOperacion);
  if (operacionBase === "DESCONOCIDA" && rawOperacion) {
    warnings.push(`Tipo de operación no reconocido: "${rawOperacion}"`);
  }

  // ticker (crítico: fórmula sin cache → error)
  const tickerColIdx = colIndexMap?.ticker;
  let ticker: string | null = null;
  if (tickerColIdx !== undefined) {
    const cell = getCellByColIdx(cells, tickerColIdx);
    if (cell) {
      const r = interpretTextCell(toRawCell(cell), "ticker", true);
      errors.push(...r.errors);
      if (r.value) ticker = r.value.toUpperCase();
    }
  }

  // fecha (crítica: fórmula sin cache → error)
  const { fecha: fechaConcertacion, warnings: wFecha, errors: eFecha } = parseDateColCell(
    cells,
    colIndexMap?.fecha,
    fallbackFecha
  );
  warnings.push(...wFecha);
  errors.push(...eFecha);

  // campos numéricos
  const { value: cantidad, warnings: wCant, errors: eCant } = parseNumericColCell(cells, colIndexMap?.cantidad, "cantidad");
  warnings.push(...wCant);
  errors.push(...eCant);

  const { value: precio, warnings: wPrec, errors: ePrec } = parseNumericColCell(cells, colIndexMap?.precio, "precio");
  warnings.push(...wPrec);
  errors.push(...ePrec);

  // campos referenciales (warning, no error)
  const { value: montoNeto, warnings: wMonto } = parseNumericColCell(cells, colIndexMap?.montoNeto, "monto");
  warnings.push(...wMonto);

  const { value: tasaCaucion, warnings: wTasa, errors: eTasa } = parseNumericColCell(cells, colIndexMap?.tasa, "tasa");
  warnings.push(...wTasa);
  errors.push(...eTasa);

  const { value: montoCobrar, warnings: wCobrar } = parseNumericColCell(cells, colIndexMap?.montoCobrar, "monto");
  warnings.push(...wCobrar);

  const { value: montoPagar, warnings: wPagar } = parseNumericColCell(cells, colIndexMap?.montoPagar, "monto");
  warnings.push(...wPagar);

  // plazo (no crítico: fórmula sin cache → warning)
  let plazo: string | null = null;
  let plazoNormalizado: string | null = null;
  if (colIndexMap?.plazo !== undefined) {
    const cell = getCellByColIdx(cells, colIndexMap.plazo);
    if (cell) {
      const r = interpretTextCell(toRawCell(cell), "plazo", false);
      warnings.push(...r.warnings);
      if (r.value) {
        const norm = normalizePlazo(r.value);
        plazo = norm.raw;
        plazoNormalizado = norm.normalized;
        if (!norm.normalized) warnings.push(`Plazo no reconocido: "${norm.raw}"`);
      }
    }
  }

  // vencimiento (crítico: fórmula sin cache → error)
  let fechaVencimiento: string | null = null;
  if (colIndexMap?.vencimiento !== undefined) {
    const cell = getCellByColIdx(cells, colIndexMap.vencimiento);
    if (cell) {
      const r = interpretDateCell(toRawCell(cell), "vencimiento", null);
      errors.push(...r.errors);
      warnings.push(...r.warnings);
      fechaVencimiento = r.value;
    }
  }

  if (fechaConcertacion && fechaVencimiento && fechaVencimiento <= fechaConcertacion) {
    errors.push(`Vencimiento (${fechaVencimiento}) ≤ concertación (${fechaConcertacion})`);
  }

  // moneda
  let monedaDetectada = null as "ARS" | "USD" | null;
  let monedaEsInferencia = false;

  const montoCell =
    colIndexMap?.montoNeto !== undefined
      ? getCellByColIdx(cells, colIndexMap.montoNeto)
      : undefined;
  const montoRaw = montoCell?.formatted ?? (montoCell?.value ? String(montoCell.value) : "");
  const fromMonto = detectMoneda(montoRaw);
  if (fromMonto.moneda) {
    monedaDetectada = fromMonto.moneda;
  } else if (ticker) {
    const fromTicker = inferMonedaFromTicker(ticker);
    if (fromTicker.moneda) {
      monedaDetectada = fromTicker.moneda;
      monedaEsInferencia = true;
      warnings.push(`Moneda inferida desde sufijo de ticker "${ticker}" como ${fromTicker.moneda}`);
    }
  }

  // instrumentoHint
  let instrumentoHint: string | null = null;
  if (operacionBase === "CAUCION_COLOCADORA" || operacionBase === "CAUCION_TOMADORA") {
    instrumentoHint = "CAUCION";
  } else if (ticker) {
    if (/^(GD|AL|AE|TX)[0-9]/i.test(ticker)) instrumentoHint = "BONO";
    else if (/CEDEAR/i.test(ticker)) instrumentoHint = "CEDEAR";
  }

  return {
    numeroFila: rowNumber,
    rawCells: getRawCells(cells),
    rawOperacion,
    operacionBase,
    fechaConcertacion,
    ticker,
    cantidad,
    precio,
    monedaDetectada,
    monedaEsInferencia,
    montoNetoReferencia: montoNeto,
    plazo,
    plazoNormalizado,
    fechaVencimiento,
    tasaCaucion,
    montoCobrarReferencia: montoCobrar,
    montoPagarReferencia: montoPagar,
    instrumentoHint,
    warnings,
    errors,
  };
}

// ── Parser principal ──────────────────────────────────────────────────────────

export function parseBolsaExcel(
  buffer: Buffer,
  options: BolsaExcelParseOptions = {}
): BolsaExcelParseResult {
  const warningsGlobales: string[] = [];
  const erroresGlobales: string[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,
      cellFormula: true,
      cellNF: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    erroresGlobales.push(`No se pudo leer el archivo Excel: ${msg}`);
    return buildResult("", 0, [], [], warningsGlobales, erroresGlobales);
  }

  if (!workbook.SheetNames?.length) {
    erroresGlobales.push("El archivo no contiene hojas");
    return buildResult("", 0, [], [], warningsGlobales, erroresGlobales);
  }

  const nonEmpty = workbook.SheetNames.filter((n) => {
    const ws = workbook.Sheets[n];
    return ws && ws["!ref"];
  });

  if (!nonEmpty.length) {
    erroresGlobales.push("El archivo no contiene hojas con contenido");
    return buildResult("", 0, [], [], warningsGlobales, erroresGlobales);
  }

  let sheetName: string;
  if (options.sheetName) {
    if (!workbook.Sheets[options.sheetName]) {
      erroresGlobales.push(
        `Hoja "${options.sheetName}" no encontrada. Disponibles: ${workbook.SheetNames.join(", ")}`
      );
      return buildResult(options.sheetName, nonEmpty.length, [], [], warningsGlobales, erroresGlobales);
    }
    sheetName = options.sheetName;
  } else {
    sheetName = nonEmpty[0];
    if (nonEmpty.length > 1) {
      warningsGlobales.push(
        `Se encontraron ${nonEmpty.length} hojas con contenido: ${nonEmpty.join(", ")}. ` +
          `Se procesó únicamente "${sheetName}".`
      );
    }
  }

  const ws = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws["!ref"]!);
  const maxRow = range.e.r;
  const maxCol = range.e.c;
  const fallback = options.fallbackFechaOperativa ?? null;

  const bloques: BolsaExcelBloque[] = [];

  let currentName: string | null = null;
  let currentNro: string | null = null;
  let currentColMap: ColIndexMap | null = null;
  let currentOps: BolsaExcelRawOp[] = [];
  let currentWarnings: string[] = [];
  let currentErrors: string[] = [];
  let blockStart = 0;
  let emptyCount = 0;

  function finalizeBlock(endRow: number) {
    if (currentOps.length === 0 && currentColMap === null) return;
    bloques.push({
      numeroBloque: bloques.length + 1,
      filaInicio: blockStart + 1,
      filaFin: endRow + 1,
      nombreDetectado: currentName,
      nroComitenteDetectado: currentNro,
      encabezadosDetectados: currentColMap ? Object.keys(currentColMap) : [],
      columnMapping: currentColMap ? colMapToColumnMapping(currentColMap) : {},
      operaciones: currentOps,
      warnings: currentWarnings,
      errors: currentErrors,
    });
    currentOps = [];
    currentWarnings = [];
    currentErrors = [];
  }

  for (let r = range.s.r; r <= maxRow; r++) {
    const cells = readRowCells(ws, r, maxCol);
    const textVals = getTextValues(cells);

    if (textVals.length === 0) {
      emptyCount++;
      if (emptyCount >= 3 && currentOps.length > 0) {
        finalizeBlock(r - 1);
        currentColMap = null;
      }
      continue;
    }
    emptyCount = 0;

    const rowClass = classifyRow(cells, currentColMap);

    if (rowClass === "IGNORE") continue;

    if (rowClass === "COLUMN_HEADER") {
      const newMap = tryBuildColMap(cells)!;
      if (currentOps.length > 0) {
        finalizeBlock(r - 1);
        blockStart = r;
      } else {
        blockStart = r;
      }
      currentColMap = newMap;
      continue;
    }

    if (rowClass === "OPERATION") {
      if (currentOps.length === 0 && currentColMap === null) blockStart = r;
      const op = buildOperation(cells, currentColMap, r + 1, fallback);
      if (currentName === null && currentNro === null) {
        op.errors.push("Operación sin comitente detectado");
      }
      currentOps.push(op);
      continue;
    }

    if (rowClass === "COMITENTE_INFO") {
      const { name, nro } = extractComitenteInfo(textVals);
      if (name !== null && name !== currentName) {
        if (currentOps.length > 0) finalizeBlock(r - 1);
        currentName = name;
        currentNro = null;
        currentColMap = null;
        blockStart = r;
      }
      if (nro !== null) currentNro = nro;
    }
  }

  if (currentOps.length > 0) finalizeBlock(maxRow);

  const allOps = bloques.flatMap((b) => b.operaciones);
  return buildResult(sheetName, nonEmpty.length, bloques, allOps, warningsGlobales, erroresGlobales);
}

// ── Builder de resultado ──────────────────────────────────────────────────────

function buildResult(
  hojaProceada: string,
  hojasNoVacias: number,
  bloques: BolsaExcelBloque[],
  operaciones: BolsaExcelRawOp[],
  warningsGlobales: string[],
  erroresGlobales: string[]
): BolsaExcelParseResult {
  const bases = operaciones.map((o) => o.operacionBase);
  const totalWarnings =
    warningsGlobales.length +
    bloques.reduce(
      (s, b) =>
        s +
        b.warnings.length +
        b.operaciones.reduce((ss, o) => ss + o.warnings.length, 0),
      0
    );
  const totalErrors =
    erroresGlobales.length +
    bloques.reduce(
      (s, b) =>
        s +
        b.errors.length +
        b.operaciones.reduce((ss, o) => ss + o.errors.length, 0),
      0
    );

  return {
    hojaProceada,
    hojasNoVacias,
    bloques,
    operaciones,
    warningsGlobales,
    erroresGlobales,
    estadisticas: {
      totalBloques: bloques.length,
      totalOperaciones: operaciones.length,
      totalCompras: bases.filter((b) => b === "COMPRA").length,
      totalVentas: bases.filter((b) => b === "VENTA").length,
      totalCauciones: bases.filter(
        (b) => b === "CAUCION_COLOCADORA" || b === "CAUCION_TOMADORA"
      ).length,
      totalDesconocidas: bases.filter((b) => b === "DESCONOCIDA").length,
      totalWarnings,
      totalErrors,
      bloquesSinComitente: bloques.filter(
        (b) => b.nombreDetectado === null && b.nroComitenteDetectado === null
      ).length,
      operacionesSinComitente: operaciones.filter((o) =>
        o.errors.some((e) => e.includes("sin comitente"))
      ).length,
    },
  };
}
