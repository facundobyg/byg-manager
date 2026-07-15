import type { Worker as TesseractWorker } from "tesseract.js";
import type {
  BolsaImageRawOp,
  BolsaImageBloque,
  BolsaImageParseResult,
  BolsaImageOpBase,
} from "@/lib/importers/bolsa-image/types";

export type { Worker as TesseractWorker } from "tesseract.js";

// ── Shared types (pure, no browser/Tesseract deps — used in tests) ─────────

export interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
}

type ColKey =
  | "OPERACION"
  | "FECHA"
  | "TICKER"
  | "CANTIDAD"
  | "PRECIO"
  | "MONTO"
  | "PLAZO"
  | "VTO"
  | "TASA";

type ColMap = Partial<Record<ColKey, { cx: number }>>;

// ── Column keyword patterns ────────────────────────────────────────────────

const COL_KEYWORDS: Array<{ key: ColKey; patterns: RegExp[] }> = [
  { key: "OPERACION", patterns: [/OPERACI/i, /^OPERAC$/i] },
  { key: "FECHA", patterns: [/^FECHA$/i, /^FEC\.?$/i] },
  { key: "TICKER", patterns: [/^BONO$/i, /^TICKER$/i, /^INSTRUM/i, /^ESPECIE$/i] },
  { key: "CANTIDAD", patterns: [/^VN$/i, /^CANT\.?$/i, /^NOMINAL$/i, /^VN\.?$/i] },
  { key: "PRECIO", patterns: [/^PRECIO$/i, /^PX$/i] },
  { key: "MONTO", patterns: [/^MONTO$/i, /^NETO$/i, /^IMPORTE$/i] },
  { key: "PLAZO", patterns: [/^PLAZO$/i, /^PLZO\.?$/i] },
  { key: "VTO", patterns: [/^VTO\.?$/i, /^VCTO\.?$/i, /^VENC\.?$/i, /^VCTO$/i] },
  { key: "TASA", patterns: [/^TASA$/i, /^TNA$/i, /^TASA\.?$/i] },
];

const IGNORED_PATTERNS = [
  /resultado\s*pesos/i,
  /resultado\s*usd/i,
  /tipo\s*de\s*cambio/i,
  /subtotal/i,
  /observaci[oó]n/i,
  /comisi[oó]n/i,
];

// ── Pure helpers ───────────────────────────────────────────────────────────

function yCenter(w: OcrWord): number {
  return (w.bbox.y0 + w.bbox.y1) / 2;
}

function xCenter(w: OcrWord): number {
  return (w.bbox.x0 + w.bbox.x1) / 2;
}

/**
 * Groups words into rows by Y proximity.
 * Words within rowGap pixels of each other's Y center form a row.
 */
export function groupWordsIntoRows(words: OcrWord[], rowGap = 10): OcrWord[][] {
  if (words.length === 0) return [];
  const sorted = [...words].sort((a, b) => yCenter(a) - yCenter(b));
  const rows: OcrWord[][] = [];
  let current: OcrWord[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevY = yCenter(current[current.length - 1]);
    if (yCenter(sorted[i]) - prevY <= rowGap) {
      current.push(sorted[i]);
    } else {
      rows.push(current.sort((a, b) => a.bbox.x0 - b.bbox.x0));
      current = [sorted[i]];
    }
  }
  rows.push(current.sort((a, b) => a.bbox.x0 - b.bbox.x0));
  return rows;
}

/**
 * Detects if a row is a table header (3+ recognized column keywords).
 * Returns the column map or null.
 */
export function detectTableHeader(row: OcrWord[]): ColMap | null {
  const colMap: ColMap = {};
  let hits = 0;

  for (const word of row) {
    for (const { key, patterns } of COL_KEYWORDS) {
      if (patterns.some((p) => p.test(word.text))) {
        if (!(key in colMap)) {
          colMap[key] = { cx: xCenter(word) };
          hits++;
        }
        break;
      }
    }
  }

  return hits >= 3 ? colMap : null;
}

/**
 * Detects a comitente name+number in a row.
 * Looks for a 5–6 digit number alongside name text.
 * Returns null if no comitente pattern found.
 */
export function detectComitenteInRow(
  row: OcrWord[],
): { nombre: string | null; numero: string | null } | null {
  const text = row.map((w) => w.text).join(" ");
  const numMatch = text.match(/\b(\d{5,6})\b/);
  if (!numMatch) return null;

  const numero = numMatch[1];
  const nombre = text
    .replace(numMatch[0], "")
    .replace(/[\/\-_|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { nombre: nombre.length >= 2 ? nombre : null, numero };
}

/**
 * Returns true if this row should be skipped entirely
 * (subtotals, results, exchange rates, etc.).
 */
export function isIgnoredRow(row: OcrWord[]): boolean {
  const text = row.map((w) => w.text).join(" ");
  return IGNORED_PATTERNS.some((p) => p.test(text));
}

/**
 * Parses an Argentine-formatted number ("1.234.567,89") into a standard
 * numeric string.  Returns null if the string can't be parsed as a number.
 */
export function parseArgNumber(s: string): string | null {
  if (!s) return null;
  const clean = s.replace(/\$/g, "").replace(/\s/g, "").trim();
  if (!clean) return null;

  // Argentine thousands+decimal: "1.234.567,89" or "1.234,56"
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(clean)) {
    return clean.replace(/\./g, "").replace(",", ".");
  }
  // Argentine integer with thousands: "1.234.567"
  if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
    return clean.replace(/\./g, "");
  }
  // Already standard decimal or bare integer
  if (/^\d+(\.\d+)?$/.test(clean)) return clean;

  return null;
}

/**
 * Parses a date in DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD to ISO YYYY-MM-DD.
 */
export function parseDate(s: string): string | null {
  const m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    return `${m[3]}-${mo}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return s.trim();
  return null;
}

function normalizePlazoOcr(s: string | null): string | null {
  if (!s) return null;
  const u = s.trim().toUpperCase();
  if (/^CI$|^CONTADO/.test(u)) return "CI";
  if (/^24\s*H/.test(u)) return "24HS";
  if (/^48\s*H/.test(u)) return "48HS";
  if (/^72\s*H/.test(u)) return "72HS";
  if (/^\d+$/.test(u)) return u; // caución days
  return s.trim();
}

function detectOpBase(text: string): BolsaImageOpBase {
  const t = text.toUpperCase();
  if (/COMPRA/.test(t)) return "COMPRA";
  if (/VENTA/.test(t)) return "VENTA";
  const isCaucion = /CAUCI/.test(t) || /\bCAUC\b/.test(t);
  if (isCaucion) {
    if (/COLOC/.test(t)) return "CAUCION_COLOCADORA";
    if (/\bTOM/.test(t)) return "CAUCION_TOMADORA";
    return "CAUCION_COLOCADORA";
  }
  return "DESCONOCIDA";
}

function assignToColumn(word: OcrWord, colMap: ColMap): ColKey | null {
  const cx = xCenter(word);
  let best: ColKey | null = null;
  let bestDist = Infinity;
  for (const [key, bounds] of Object.entries(colMap) as [ColKey, { cx: number }][]) {
    const dist = Math.abs(cx - bounds.cx);
    if (dist < bestDist) {
      bestDist = dist;
      best = key;
    }
  }
  return best;
}

/**
 * Parses one row of OCR words into a BolsaImageRawOp using the column map.
 */
export function parseDataRow(
  row: OcrWord[],
  colMap: ColMap,
  rowNum: number,
): BolsaImageRawOp {
  const cols: Partial<Record<ColKey, string[]>> = {};

  for (const word of row) {
    if (word.confidence < 40) continue;
    const key = assignToColumn(word, colMap);
    if (key) {
      cols[key] = [...(cols[key] ?? []), word.text];
    }
  }

  const get = (k: ColKey): string => (cols[k] ?? []).join(" ").trim();

  const operacionText = get("OPERACION");
  const tickerText = get("TICKER");
  const rawOperacion = [operacionText, tickerText].filter(Boolean).join(" ") || operacionText;
  const operacionBase = detectOpBase(operacionText || rawOperacion);

  const fechaRaw = get("FECHA");
  const allRowText = row.map((w) => w.text).join(" ");
  const fechaConcertacion =
    parseDate(fechaRaw) ??
    (() => {
      const m = allRowText.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
      return m ? parseDate(m[0]) : null;
    })();

  const tickerUpper = tickerText.toUpperCase();
  const tickerMatch = tickerUpper.match(/\b([A-Z][A-Z0-9]{1,5})\b/);
  const ticker = tickerMatch ? tickerMatch[1] : null;

  const plazoRaw = get("PLAZO") || null;
  const plazoNorm = normalizePlazoOcr(plazoRaw);

  const errors: string[] = [];
  if (!fechaConcertacion) errors.push("Fecha no detectada.");
  if (operacionBase === "DESCONOCIDA") errors.push("Tipo de operación no reconocido.");

  return {
    numeroFila: rowNum,
    rawOperacion,
    operacionBase,
    fechaConcertacion,
    ticker,
    cantidad: parseArgNumber(get("CANTIDAD")),
    precio: parseArgNumber(get("PRECIO")),
    monedaDetectada: null,
    montoNetoReferencia: parseArgNumber(get("MONTO")),
    plazo: plazoRaw,
    plazoNormalizado: plazoNorm,
    fechaVencimiento: parseDate(get("VTO")),
    tasaCaucion: parseArgNumber(get("TASA")),
    montoCobrarReferencia: null,
    montoPagarReferencia: null,
    instrumentoHint: null,
    warnings: [],
    errors,
  };
}

/**
 * Reconstructs bolsa blocks from a flat array of OCR words with bounding boxes.
 * Pure function — no browser or Tesseract dependencies.
 */
export function reconstructBolsaBlocks(words: OcrWord[]): BolsaImageBloque[] {
  const filtered = words.filter((w) => w.confidence >= 30 && w.text.trim().length > 0);
  const rows = groupWordsIntoRows(filtered);

  const blocks: BolsaImageBloque[] = [];
  let currentNombre: string | null = null;
  let currentNumero: string | null = null;
  let currentColMap: ColMap | null = null;
  let currentOps: BolsaImageRawOp[] = [];
  let blockCount = 0;
  let rowNum = 0;

  function flushBlock() {
    if (currentOps.length > 0 || currentColMap !== null) {
      blocks.push({
        numeroBloque: blockCount + 1,
        nombreDetectado: currentNombre,
        nroComitenteDetectado: currentNumero,
        operaciones: currentOps,
        warnings: [],
        errors: [],
      });
      blockCount++;
    }
    currentOps = [];
    currentColMap = null;
  }

  for (const row of rows) {
    if (row.length === 0) continue;
    if (isIgnoredRow(row)) continue;

    // Table header takes highest priority
    const header = detectTableHeader(row);
    if (header) {
      if (currentColMap !== null && currentOps.length > 0) flushBlock();
      currentColMap = header;
      rowNum = 0;
      continue;
    }

    // Comitente header: short row with a 5-6 digit number (outside data region)
    const isShortRow = row.length <= 5;
    const comitente = isShortRow ? detectComitenteInRow(row) : null;
    if (comitente) {
      if (currentOps.length > 0) flushBlock();
      currentNombre = comitente.nombre;
      currentNumero = comitente.numero;
      currentColMap = null;
      rowNum = 0;
      continue;
    }

    // Data row — only parse if we have a column map
    if (currentColMap !== null) {
      rowNum++;
      currentOps.push(parseDataRow(row, currentColMap, rowNum));
    }
  }

  flushBlock();
  return blocks;
}

// ── OCR word extraction — pure, testable ──────────────────────────────────────

/**
 * Minimal Page shape needed by extractOcrWords — a subset of Tesseract.Page.
 * Exported so tests can build mock pages without importing tesseract.js.
 */
export interface OcrPage {
  blocks: Array<{
    paragraphs: Array<{
      lines: Array<{
        words: Array<{
          text: string;
          confidence: number;
          bbox: { x0: number; y0: number; x1: number; y1: number };
        }>;
      }>;
    }>;
  }> | null;
  text: string;
  tsv: string | null;
}

/**
 * Parses Tesseract TSV output into OcrWord[].
 * TSV columns (tab-separated, header on first line):
 *   level page_num block_num par_num line_num word_num left top width height conf text
 * Level 5 = word; conf < 0 = non-word structural row.
 */
function wordsFromTsv(tsv: string): OcrWord[] {
  const words: OcrWord[] = [];
  const lines = tsv.split("\n");
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split("\t");
    if (parts.length < 12) continue;
    if (parseInt(parts[0], 10) !== 5) continue;
    const conf = parseFloat(parts[10]);
    if (conf < 0) continue;
    const text = parts.slice(11).join("\t").trim();
    if (!text) continue;
    const left = parseInt(parts[6], 10);
    const top = parseInt(parts[7], 10);
    const width = parseInt(parts[8], 10);
    const height = parseInt(parts[9], 10);
    words.push({
      text,
      confidence: conf,
      bbox: { x0: left, y0: top, x1: left + width, y1: top + height },
    });
  }
  return words;
}

/**
 * Extracts OcrWord[] from a Tesseract page result.
 * Primary source: data.blocks (full bbox per word).
 * Fallback: data.tsv (also contains bbox per word).
 * Returns [] if neither is available — caller should validate.
 */
export function extractOcrWords(page: OcrPage): OcrWord[] {
  if (page.blocks && page.blocks.length > 0) {
    const words = page.blocks.flatMap((block) =>
      block.paragraphs.flatMap((para) =>
        para.lines.flatMap((line) =>
          line.words.map((w) => ({
            text: w.text,
            confidence: w.confidence,
            bbox: w.bbox,
          })),
        ),
      ),
    );
    if (words.length > 0) return words;
  }
  if (page.tsv) return wordsFromTsv(page.tsv);
  return [];
}

// ── Browser-dependent functions ─────────────────────────────────────────────

/**
 * Preprocesses an image for OCR:
 * - scales to optimal resolution (min 1200px, max 2400px on long side)
 * - converts to greyscale with contrast enhancement
 */
export async function preprocessImageForOcr(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => {
      URL.revokeObjectURL(url);
      resolve(el);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen."));
    };
    el.src = url;
  });

  const MAX_DIM = 2400;
  const MIN_DIM = 1200;
  let tw = img.naturalWidth;
  let th = img.naturalHeight;
  const longSide = Math.max(tw, th);

  if (longSide > MAX_DIM) {
    const ratio = MAX_DIM / longSide;
    tw = Math.round(tw * ratio);
    th = Math.round(th * ratio);
  } else if (longSide < MIN_DIM) {
    const ratio = MIN_DIM / longSide;
    tw = Math.round(tw * ratio);
    th = Math.round(th * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible.");

  ctx.drawImage(img, 0, 0, tw, th);

  // Greyscale + contrast stretch [40, 220] → [0, 255]
  const imageData = ctx.getImageData(0, 0, tw, th);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const contrasted = Math.max(0, Math.min(255, ((lum - 40) / 180) * 255));
    d[i] = d[i + 1] = d[i + 2] = contrasted;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

/**
 * Creates a reusable Tesseract worker (spa+eng).
 * Call `worker.terminate()` after processing the whole batch.
 *
 * Assets servidos desde el mismo origen (/tesseract/) para evitar dependencias
 * de CDN externas en producción. Los archivos se copian vía postinstall
 * (scripts/copy-tesseract-public.mjs → public/tesseract/).
 */
export async function createOcrWorker(): Promise<TesseractWorker> {
  const { createWorker } = await import("tesseract.js");
  return createWorker(["spa", "eng"], 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract",
    langPath: "/tesseract/lang-data",
    workerBlobURL: false,
    gzip: true,
  });
}

/**
 * OCRs a single image using the provided worker.
 * The image is NOT sent to any server — all processing is local.
 *
 * @param onProgress - callback with one of:
 *   "Preparando imagen" | "Leyendo texto" | "Armando operaciones"
 */
export async function ocrBolsaImage(
  file: File,
  worker: TesseractWorker,
  onProgress: (msg: string) => void,
): Promise<BolsaImageParseResult> {
  onProgress("Preparando imagen");
  const canvas = await preprocessImageForOcr(file);

  onProgress("Leyendo texto");
  // Request blocks+tsv explicitly — in v7 these are null unless asked for.
  const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true, tsv: true });

  onProgress("Armando operaciones");
  const ocrWords = extractOcrWords(data as OcrPage);

  if (ocrWords.length === 0) {
    const hasText = data.text?.trim().length > 0;
    if (hasText) {
      throw new Error(
        "El OCR leyó texto, pero no pudo reconstruir la tabla (sin coordenadas de palabras). Intentá con una imagen más nítida.",
      );
    }
    throw new Error(
      "El OCR no encontró texto en la imagen. Verificá que sea una imagen clara del detalle de operaciones.",
    );
  }

  const bloques = reconstructBolsaBlocks(ocrWords);
  const totalOperaciones = bloques.reduce((s, b) => s + b.operaciones.length, 0);

  if (totalOperaciones === 0) {
    throw new Error(
      "El OCR procesó la imagen pero no detectó operaciones de bolsa. Verificá que la imagen corresponda a un detalle de operaciones con encabezado de tabla visible.",
    );
  }

  return { bloques, warningsGlobales: [], erroresGlobales: [], totalOperaciones };
}
