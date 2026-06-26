// Parser puro de "Reporte de Tenencia Valorizada" (Bind Inversiones).
// No escribe en DB, no resuelve contra Data912, no crea Activos/Holdings.
// Ver Módulo 4.12A (análisis) y 4.12B (esta implementación), Sesión 12.
//
// El PDF no tiene tablas reales — son fragmentos de texto posicionados por
// x/y. Las columnas numéricas están alineadas a la derecha dentro de un
// ancho fijo, así que para saber a qué columna pertenece un número hay que
// mirar su posición X, no el orden en que aparece (las celdas vacías no
// dejan ningún rastro en el texto). Los rangos de abajo se calibraron contra
// los 2 PDFs reales de 4.12A/4.12B (ver _tmp-probe-pdf usado para calibrar,
// ya borrado).

import { parseEsArNumber, parseDenominacion, normalizeSectionType, isKnownSectionName, inferInstrumentAndCurrency } from "./normalize";
import type { BindTenenciasParsedFile, BindTenenciasRow, BindTenenciasSection } from "./types";

type NumericColumnKey =
  | "quote"
  | "saldoVencidoQuantity"
  | "saldoVencidoAmountARS"
  | "pending24AmountARS"
  | "pending48AmountARS"
  | "pendingFutureAmountARS"
  | "garantiaQuantity"
  | "garantiaAmountARS"
  | "totalAmountARS";

// [minX, maxX) — calibrados contra valores reales cortos/largos/negativos en
// ambos PDFs de muestra (BHIP, GGAL, Pesos, URA, AL41).
const COLUMN_BRACKETS: { key: NumericColumnKey; minX: number; maxX: number }[] = [
  { key: "quote", minX: 150, maxX: 220 },
  { key: "saldoVencidoQuantity", minX: 220, maxX: 290 },
  { key: "saldoVencidoAmountARS", minX: 290, maxX: 350 },
  { key: "pending24AmountARS", minX: 350, maxX: 415 },
  { key: "pending48AmountARS", minX: 415, maxX: 495 },
  { key: "pendingFutureAmountARS", minX: 495, maxX: 580 },
  { key: "garantiaQuantity", minX: 580, maxX: 645 },
  { key: "garantiaAmountARS", minX: 645, maxX: 705 },
  { key: "totalAmountARS", minX: 705, maxX: 820 },
];

const DENOMINACION_MAX_X = 150;
const TOTAL_LABEL_MIN_X = 660; // "Total :" siempre observado en x≈670.2

const HEADER_LABELS = new Set([
  "Denominación", "Cotización", "Saldo Vencido", "Pendiente de Liquidación",
  "Garantía", "Saldo Total", "Cantidad", "Importe", "24 Hs.", "48 Hs.", "Futuro",
]);

interface RawTextItem { x: number; y: number; str: string }
interface RawLine { y: number; items: RawTextItem[] }

async function extractLinesByPage(data: Uint8Array): Promise<RawLine[][]> {
  // Import dinámico — build legacy de pdf.js, pensado para Node (sin DOM).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;

  const pages: RawLine[][] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const byY = new Map<number, RawTextItem[]>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of content.items as any[]) {
      const x = item.transform[4];
      const y = Math.round(item.transform[5] * 10) / 10;
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push({ x, y, str: item.str });
    }
    const lines = Array.from(byY.entries())
      .map(([y, items]) => ({ y, items: items.sort((a, b) => a.x - b.x) }))
      .sort((a, b) => b.y - a.y); // arriba hacia abajo (Y de PDF crece para arriba)
    pages.push(lines);
  }
  return pages;
}

function joinText(items: RawTextItem[]): string {
  return items.map((i) => i.str).join("").replace(/\s+/g, " ").trim();
}

function classifyColumn(x: number): NumericColumnKey | null {
  for (const b of COLUMN_BRACKETS) {
    if (x >= b.minX && x < b.maxX) return b.key;
  }
  return null;
}

function emptyRowValues(): Record<NumericColumnKey, number | null> {
  return {
    quote: null, saldoVencidoQuantity: null, saldoVencidoAmountARS: null,
    pending24AmountARS: null, pending48AmountARS: null, pendingFutureAmountARS: null,
    garantiaQuantity: null, garantiaAmountARS: null, totalAmountARS: null,
  };
}

function isReportTitleLine(text: string): boolean {
  return text.includes("Reporte de Tenencia Valorizada");
}

function isAccountLine(text: string): boolean {
  return text.includes("Cuenta :") || text.includes("Cuenta:");
}

// "Hoja N° 1 de 2" — margen de página, no es una fila de datos.
function isPageFooterLine(text: string): boolean {
  return /^Hoja N/.test(text.trim());
}

function isHeaderLine(items: RawTextItem[]): boolean {
  const joined = joinText(items);
  if (HEADER_LABELS.has(joined)) return true;
  // La línea de cabecera principal junta varias etiquetas con espacios en blanco grandes.
  const tokens = items.map((i) => i.str.trim()).filter(Boolean);
  return tokens.length > 0 && tokens.every((t) => HEADER_LABELS.has(t));
}

function buildRow(sectionName: string, denomLines: RawTextItem[][], numericValues: Record<NumericColumnKey, number | null>): BindTenenciasRow {
  // Dentro de una línea los tokens ya incluyen sus propios separadores de
  // espacio; ENTRE líneas (texto que se corta por el ancho de columna) no
  // hay ningún token de espacio, así que hay que unirlas con " " a mano.
  const firstLineText = joinText(denomLines[0] ?? []);
  const fullText = denomLines.map((l) => joinText(l)).filter(Boolean).join(" ");
  const parsedDenom = parseDenominacion(firstLineText);
  const warnings: string[] = [];

  const sectionType = normalizeSectionType(sectionName);
  if (!parsedDenom.matched && sectionType !== "CASH_USD_CABLE" && sectionType !== "CASH_USD_MEP" && sectionType !== "CASH_ARS") {
    warnings.push(`No se pudo extraer ticker/código de "${fullText}" — pendiente de mapeo manual.`);
  }

  const totalQuantity =
    numericValues.saldoVencidoQuantity != null || numericValues.garantiaQuantity != null
      ? (numericValues.saldoVencidoQuantity ?? 0) + (numericValues.garantiaQuantity ?? 0)
      : null;

  const componentesImporte = [
    numericValues.saldoVencidoAmountARS,
    numericValues.pending24AmountARS,
    numericValues.pending48AmountARS,
    numericValues.pendingFutureAmountARS,
    numericValues.garantiaAmountARS,
  ].filter((v): v is number => v != null);
  const totalAmountCalculado = componentesImporte.length > 0 ? componentesImporte.reduce((a, b) => a + b, 0) : null;

  if (numericValues.totalAmountARS != null && totalAmountCalculado != null) {
    const diff = Math.abs(numericValues.totalAmountARS - totalAmountCalculado);
    if (diff > 0.05) {
      warnings.push(
        `Saldo Total impreso ($${numericValues.totalAmountARS.toFixed(2)}) no coincide con la suma de componentes ($${totalAmountCalculado.toFixed(2)}), diferencia $${diff.toFixed(2)}.`,
      );
    }
  }

  const { instrumentType, nativeCurrency } = inferInstrumentAndCurrency(sectionType, parsedDenom.ticker);
  const continuationText = denomLines.slice(1).map((l) => joinText(l)).filter(Boolean).join(" ");
  const descriptionClean = [parsedDenom.description, continuationText].filter(Boolean).join(" ") || fullText;

  return {
    sectionName,
    ticker: parsedDenom.ticker,
    brokerCode: parsedDenom.brokerCode,
    descriptionRaw: fullText,
    descriptionClean,
    quote: numericValues.quote,
    saldoVencidoQuantity: numericValues.saldoVencidoQuantity,
    saldoVencidoAmountARS: numericValues.saldoVencidoAmountARS,
    pending24AmountARS: numericValues.pending24AmountARS,
    pending48AmountARS: numericValues.pending48AmountARS,
    pendingFutureAmountARS: numericValues.pendingFutureAmountARS,
    garantiaQuantity: numericValues.garantiaQuantity,
    garantiaAmountARS: numericValues.garantiaAmountARS,
    totalQuantity,
    totalAmountARS: numericValues.totalAmountARS ?? totalAmountCalculado,
    inferredInstrumentType: instrumentType,
    inferredNativeCurrency: nativeCurrency,
    warnings,
  };
}

export async function parseBindTenenciasPdf(data: Uint8Array, fileName: string): Promise<BindTenenciasParsedFile> {
  const warnings: string[] = [];
  const errors: string[] = [];

  let pagesLines: RawLine[][];
  try {
    pagesLines = await extractLinesByPage(data);
  } catch (e) {
    return {
      fileName, reportDate: null, reportTime: null, accountNumber: null, accountName: null, pages: 0,
      sections: [], totals: { grandTotalAmountARS: null, computedGrandTotalAmountARS: null, matchesGrandTotal: false },
      warnings: [], errors: [`PDF ilegible: ${e instanceof Error ? e.message : "error desconocido"}`],
    };
  }

  let reportDate: string | null = null;
  let reportTime: string | null = null;
  let accountNumber: string | null = null;
  let accountName: string | null = null;

  const sections: BindTenenciasSection[] = [];
  let currentSection: BindTenenciasSection | null = null;
  let openDenomLines: RawTextItem[][] | null = null;
  let openNumericValues: Record<NumericColumnKey, number | null> | null = null;
  let grandTotalAmountARS: number | null = null;

  function closeOpenRow() {
    if (currentSection && openDenomLines && openNumericValues) {
      const row = buildRow(currentSection.name, openDenomLines, openNumericValues);
      currentSection.rows.push(row);
      warnings.push(...row.warnings.map((w) => `[${currentSection!.name}] ${w}`));
    }
    openDenomLines = null;
    openNumericValues = null;
  }

  for (const lines of pagesLines) {
    for (const line of lines) {
      const joined = joinText(line.items);
      if (!joined) continue;

      if (isPageFooterLine(joined)) continue;

      if (isReportTitleLine(joined)) {
        const m = /al (\d{2})\/(\d{2})\/(\d{4})/.exec(joined);
        if (m) reportDate = `${m[3]}-${m[2]}-${m[1]}`;
        continue;
      }
      if (isAccountLine(joined)) {
        const dateMatch = /^(\d{2}\/\d{2}\/\d{4})/.exec(joined);
        const timeMatch = /(\d{2}:\d{2}:\d{2})$/.exec(joined);
        const cuentaMatch = /Cuenta\s*:\s*(\S+)\s*-\s*(.*?)(?:\s*\d{2}:\d{2}:\d{2})?$/.exec(joined);
        if (dateMatch && !reportDate) reportDate = dateMatch[1].split("/").reverse().join("-");
        if (timeMatch) reportTime = timeMatch[1];
        if (cuentaMatch) {
          accountNumber = cuentaMatch[1].trim();
          accountName = cuentaMatch[2].trim();
        }
        continue;
      }
      if (isHeaderLine(line.items)) continue;

      // Línea "Total :". La primera después de abrir una sección es el
      // subtotal de esa sección (la cierra). Una segunda "Total :" sin una
      // sección nueva en el medio es el total general del documento (visto
      // en ambos PDFs: el cierre de la última sección va seguido de un
      // "Total :" suelto que es el total general, no de otra sección).
      const totalItem = line.items.find((i) => i.x >= TOTAL_LABEL_MIN_X && i.x < 705 && i.str.trim().startsWith("Total"));
      if (totalItem) {
        closeOpenRow();
        const totalAmountItem = line.items.find((i) => classifyColumn(i.x) === "totalAmountARS");
        const amount = totalAmountItem ? parseEsArNumber(totalAmountItem.str) : null;
        if (currentSection && currentSection.totalAmountARS === null) {
          currentSection.totalAmountARS = amount;
          sections.push(currentSection);
          currentSection = null;
        } else {
          grandTotalAmountARS = amount;
        }
        continue;
      }

      // ¿La línea tiene algún número de columna de datos? -> nueva fila.
      const numericTokens = line.items.filter((i) => i.x >= DENOMINACION_MAX_X && /\d/.test(i.str));
      if (numericTokens.length > 0) {
        closeOpenRow();
        const denomItems = line.items.filter((i) => i.x < DENOMINACION_MAX_X);
        const values = emptyRowValues();
        for (const tok of numericTokens) {
          const col = classifyColumn(tok.x);
          if (!col) continue;
          values[col] = parseEsArNumber(tok.str);
        }
        openDenomLines = [denomItems];
        openNumericValues = values;
        continue;
      }

      // Sin números: nombre de sección conocida, o continuación de denominación.
      if (isKnownSectionName(joined) || (!currentSection && joined.length > 0)) {
        closeOpenRow();
        if (currentSection) sections.push(currentSection);
        currentSection = { name: joined, normalizedType: normalizeSectionType(joined), rows: [], totalAmountARS: null };
        continue;
      }

      if (openDenomLines) {
        openDenomLines = [...openDenomLines, line.items];
        continue;
      }

      warnings.push(`Línea sin clasificar fuera de cualquier fila/sección: "${joined}"`);
    }
  }

  closeOpenRow();
  if (currentSection) {
    warnings.push(`[${currentSection.name}] Sección quedó abierta sin línea "Total :" — posible PDF truncado.`);
    sections.push(currentSection);
  }

  const computedGrandTotalAmountARS = sections.reduce((acc, s) => acc + (s.totalAmountARS ?? 0), 0);
  if (grandTotalAmountARS == null) {
    warnings.push("No se encontró la línea de total general del documento.");
  }
  const matchesGrandTotal =
    grandTotalAmountARS != null && Math.abs(grandTotalAmountARS - computedGrandTotalAmountARS) <= 0.05;

  for (const section of sections) {
    const computedSectionTotal = section.rows.reduce((acc, r) => acc + (r.totalAmountARS ?? 0), 0);
    if (section.totalAmountARS != null) {
      const diff = Math.abs(section.totalAmountARS - computedSectionTotal);
      if (diff > 0.05) {
        warnings.push(
          `[${section.name}] Total de sección impreso ($${section.totalAmountARS.toFixed(2)}) no coincide con la suma de filas ($${computedSectionTotal.toFixed(2)}), diferencia $${diff.toFixed(2)}.`,
        );
      }
    } else {
      warnings.push(`[${section.name}] No se encontró línea "Total :" para la sección.`);
    }
  }

  if (!accountNumber) errors.push("No se pudo extraer el número de cuenta del PDF.");
  if (sections.length === 0) warnings.push("No se detectó ninguna sección — revisar formato del PDF.");

  return {
    fileName,
    reportDate,
    reportTime,
    accountNumber,
    accountName,
    pages: pagesLines.length,
    sections,
    totals: { grandTotalAmountARS, computedGrandTotalAmountARS, matchesGrandTotal },
    warnings,
    errors,
  };
}
