import type {
  BolsaImageRawOp,
  BolsaImageBloque,
  BolsaImageParseResult,
  BolsaImageOpBase,
  BolsaImageMime,
} from "./types";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const VISION_MODEL = "claude-haiku-4-5-20251001";
const TIMEOUT_MS = 30_000;

const EXTRACTION_PROMPT = `Analizá la imagen de detalle de operaciones de bolsa y extraé la información en JSON estricto.

La imagen puede mostrar un resumen del día con uno o más comitentes. Para cada comitente identificá:
- Su nombre completo
- Su número de comitente (si aparece)
- Todas sus operaciones del día

Para cada operación extraé:
- rawOperacion: descripción textual completa tal cual aparece (ej. "Compra AL30 48hs")
- operacionBase: exactamente uno de "COMPRA", "VENTA", "CAUCION_COLOCADORA", "CAUCION_TOMADORA", "DESCONOCIDA"
- fechaConcertacion: fecha en formato YYYY-MM-DD, o null si no aparece
- ticker: código del activo (ej. "AL30", "GD30", "YPFD", "GGAL"), null si no aplica
- cantidad: cantidad o valor nominal como string numérico sin separadores de miles (ej. "10000"), null si no aparece
- precio: precio unitario como string numérico (ej. "65.25"), null si no aparece
- monedaDetectada: "ARS" o "USD", null si no se puede determinar
- montoNetoReferencia: monto neto total como string numérico sin separadores de miles, null si no aparece
- plazo: "CI", "24hs", "48hs", "72hs" o número de días para cauciones (ej. "7"), null si no aparece
- fechaVencimiento: fecha de vencimiento YYYY-MM-DD para cauciones, null para el resto
- tasaCaucion: tasa de la caución como string numérico (ej. "42.5"), null si no es caución
- montoCobrarReferencia: monto a cobrar como string numérico, null si no aplica
- montoPagarReferencia: monto a pagar como string numérico, null si no aplica
- instrumentoHint: tipo de instrumento reconocido ("bono", "accion", "cedear", "ON", "FCI", "opciones"), null si desconocido

IGNORAR completamente las siguientes filas/secciones (NO incluirlas en el array operaciones):
- "Resultado pesos" o cualquier fila de resultado en ARS
- "Resultado USD" o cualquier fila de resultado en dólares
- "Tipo de cambio neto" o cualquier fila de tipo de cambio
- Totales, subtotales y resúmenes financieros
- Observaciones, notas, textos en rojo o comentarios que no sean operaciones ejecutadas
- Comisiones y aranceles como filas separadas

Respondé ÚNICAMENTE con JSON válido, sin texto adicional antes ni después:
{
  "bloques": [
    {
      "nombreDetectado": "string o null",
      "nroComitenteDetectado": "string o null",
      "operaciones": [
        {
          "rawOperacion": "...",
          "operacionBase": "COMPRA|VENTA|CAUCION_COLOCADORA|CAUCION_TOMADORA|DESCONOCIDA",
          "fechaConcertacion": "YYYY-MM-DD o null",
          "ticker": "string o null",
          "cantidad": "string o null",
          "precio": "string o null",
          "monedaDetectada": "ARS|USD|null",
          "montoNetoReferencia": "string o null",
          "plazo": "string o null",
          "fechaVencimiento": "YYYY-MM-DD o null",
          "tasaCaucion": "string o null",
          "montoCobrarReferencia": "string o null",
          "montoPagarReferencia": "string o null",
          "instrumentoHint": "string o null"
        }
      ]
    }
  ],
  "warningsGlobales": [],
  "erroresGlobales": []
}`;

// ── Helpers públicos (exportados para tests) ──────────────────────────────────

export function extractJsonFromText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("No se encontró JSON válido en la respuesta del modelo de visión.");
    }
    return JSON.parse(text.slice(start, end + 1));
  }
}

export function normalizePlazoImg(s: string | null): string | null {
  if (!s) return null;
  const u = s.trim().toUpperCase();
  if (/^CI$|^CONTADO\s*INMEDIATO$/.test(u)) return "CI";
  if (/^24\s*(HS?\.?|HORAS?)$/.test(u)) return "24HS";
  if (/^48\s*(HS?\.?|HORAS?)$/.test(u)) return "48HS";
  if (/^72\s*(HS?\.?|HORAS?)$/.test(u)) return "72HS";
  return s.trim();
}

function normalizeOpBase(s: unknown): BolsaImageOpBase {
  const v = String(s ?? "").toUpperCase().trim();
  if (v === "COMPRA") return "COMPRA";
  if (v === "VENTA") return "VENTA";
  if (v === "CAUCION_COLOCADORA") return "CAUCION_COLOCADORA";
  if (v === "CAUCION_TOMADORA") return "CAUCION_TOMADORA";
  return "DESCONOCIDA";
}

function strOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" || s === "null" ? null : s;
}

function normalizeBloque(raw: unknown, idx: number): BolsaImageBloque {
  const b = (raw ?? {}) as Record<string, unknown>;
  const ops = Array.isArray(b.operaciones) ? b.operaciones : [];

  const operaciones: BolsaImageRawOp[] = ops.map((op: unknown, i: number) => {
    const o = (op ?? {}) as Record<string, unknown>;
    const plazo = strOrNull(o.plazo);
    const monedaRaw = strOrNull(o.monedaDetectada);
    return {
      numeroFila: i + 1,
      rawOperacion: strOrNull(o.rawOperacion) ?? "",
      operacionBase: normalizeOpBase(o.operacionBase),
      fechaConcertacion: strOrNull(o.fechaConcertacion),
      ticker: strOrNull(o.ticker),
      cantidad: strOrNull(o.cantidad),
      precio: strOrNull(o.precio),
      monedaDetectada: monedaRaw === "ARS" || monedaRaw === "USD" ? monedaRaw : null,
      montoNetoReferencia: strOrNull(o.montoNetoReferencia),
      plazo,
      plazoNormalizado: normalizePlazoImg(plazo),
      fechaVencimiento: strOrNull(o.fechaVencimiento),
      tasaCaucion: strOrNull(o.tasaCaucion),
      montoCobrarReferencia: strOrNull(o.montoCobrarReferencia),
      montoPagarReferencia: strOrNull(o.montoPagarReferencia),
      instrumentoHint: strOrNull(o.instrumentoHint),
      warnings: [],
      errors: [],
    };
  });

  return {
    numeroBloque: idx + 1,
    nombreDetectado: strOrNull(b.nombreDetectado),
    nroComitenteDetectado: strOrNull(b.nroComitenteDetectado),
    operaciones,
    warnings: [],
    errors: [],
  };
}

function validateParsedStructure(parsed: Record<string, unknown>): void {
  if (!Array.isArray(parsed.bloques)) {
    throw new Error("Respuesta del modelo inválida: 'bloques' no es un array.");
  }
  for (const bloque of parsed.bloques as unknown[]) {
    const b = bloque as Record<string, unknown>;
    if (!Array.isArray(b.operaciones)) {
      throw new Error("Respuesta del modelo inválida: bloque sin array 'operaciones'.");
    }
    for (const op of b.operaciones as unknown[]) {
      if (typeof (op as Record<string, unknown>).rawOperacion !== "string") {
        throw new Error("Respuesta del modelo inválida: operación sin 'rawOperacion' string.");
      }
    }
  }
}

// ── Parser principal ──────────────────────────────────────────────────────────

export async function parseBolsaImage(
  buf: Buffer,
  mimeType: BolsaImageMime,
): Promise<BolsaImageParseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada.");

  const base64 = buf.toString("base64");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mimeType, data: base64 },
              },
              { type: "text", text: EXTRACTION_PROMPT },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("El modelo de visión tardó demasiado. Intentá de nuevo.");
    }
    throw new Error("No se pudo contactar el servicio de extracción de imágenes.");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // No exponer detalles internos del API al cliente
    const status = response.status;
    if (status === 401 || status === 403) {
      throw new Error("Credenciales del servicio de visión inválidas. Contactá al administrador.");
    }
    if (status === 429) {
      throw new Error("Demasiadas solicitudes al servicio de visión. Esperá unos segundos e intentá de nuevo.");
    }
    throw new Error(`El servicio de extracción respondió con un error (${status}). Intentá de nuevo.`);
  }

  const json = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const textContent = json.content?.find((c) => c.type === "text")?.text ?? "";
  if (!textContent) throw new Error("Respuesta vacía del modelo de visión.");

  let parsed: Record<string, unknown>;
  try {
    parsed = extractJsonFromText(textContent) as Record<string, unknown>;
  } catch {
    throw new Error("El modelo devolvió un formato inesperado. Intentá de nuevo.");
  }

  try {
    validateParsedStructure(parsed);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Estructura de respuesta inválida.");
  }

  const rawBloques = Array.isArray(parsed.bloques) ? parsed.bloques : [];
  const bloques = rawBloques.map((b, i) => normalizeBloque(b, i));

  const warningsGlobales = Array.isArray(parsed.warningsGlobales)
    ? parsed.warningsGlobales.map(String)
    : [];
  const erroresGlobales = Array.isArray(parsed.erroresGlobales)
    ? parsed.erroresGlobales.map(String)
    : [];

  const totalOperaciones = bloques.reduce((sum, b) => sum + b.operaciones.length, 0);

  return { bloques, warningsGlobales, erroresGlobales, totalOperaciones };
}
