import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseBolsaImage, extractJsonFromText, normalizePlazoImg } from "./parser";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeOkResponse(text: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      content: [{ type: "text", text }],
    }),
  };
}

const SAMPLE_JSON = JSON.stringify({
  bloques: [
    {
      nombreDetectado: "Juan Perez",
      nroComitenteDetectado: "12345",
      operaciones: [
        {
          rawOperacion: "Compra AL30 48hs",
          operacionBase: "COMPRA",
          fechaConcertacion: "2024-07-10",
          ticker: "AL30",
          cantidad: "10000",
          precio: "65.25",
          monedaDetectada: "USD",
          montoNetoReferencia: "652500",
          plazo: "48hs",
          fechaVencimiento: null,
          tasaCaucion: null,
          montoCobrarReferencia: null,
          montoPagarReferencia: null,
          instrumentoHint: "bono",
        },
      ],
    },
  ],
  warningsGlobales: [],
  erroresGlobales: [],
});

describe("extractJsonFromText", () => {
  it("parses a clean JSON string", () => {
    const result = extractJsonFromText('{"a": 1}');
    expect(result).toEqual({ a: 1 });
  });

  it("extracts JSON embedded in surrounding text", () => {
    const result = extractJsonFromText('Aquí la info:\n{"a": 1}\n\nFin.');
    expect(result).toEqual({ a: 1 });
  });

  it("throws when no JSON is found", () => {
    expect(() => extractJsonFromText("sin json")).toThrow();
  });
});

describe("normalizePlazoImg", () => {
  it("returns null for null input", () => {
    expect(normalizePlazoImg(null)).toBeNull();
  });

  it('normalizes "ci" to "CI"', () => {
    expect(normalizePlazoImg("ci")).toBe("CI");
  });

  it('normalizes "48hs" to "48HS"', () => {
    expect(normalizePlazoImg("48hs")).toBe("48HS");
  });

  it('normalizes "24h" to "24HS"', () => {
    expect(normalizePlazoImg("24h")).toBe("24HS");
  });

  it("leaves caución days as-is", () => {
    expect(normalizePlazoImg("7")).toBe("7");
  });
});

describe("parseBolsaImage", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    mockFetch.mockReset();
  });

  // ── API key ────────────────────────────────────────────────────────────────
  it("P-1: throws when ANTHROPIC_API_KEY is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    await expect(parseBolsaImage(Buffer.from("x"), "image/jpeg")).rejects.toThrow(
      "ANTHROPIC_API_KEY",
    );
  });

  // ── Happy path ─────────────────────────────────────────────────────────────
  it("P-2: parses a valid response into bloques and ops", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse(SAMPLE_JSON));
    const result = await parseBolsaImage(Buffer.from("fake"), "image/jpeg");

    expect(result.bloques).toHaveLength(1);
    expect(result.bloques[0].nombreDetectado).toBe("Juan Perez");
    expect(result.bloques[0].nroComitenteDetectado).toBe("12345");
    expect(result.bloques[0].operaciones).toHaveLength(1);

    const op = result.bloques[0].operaciones[0];
    expect(op.ticker).toBe("AL30");
    expect(op.operacionBase).toBe("COMPRA");
    expect(op.monedaDetectada).toBe("USD");
    expect(op.plazoNormalizado).toBe("48HS");
    expect(result.totalOperaciones).toBe(1);
  });

  // ── JSON con texto extra ───────────────────────────────────────────────────
  it("P-3: extracts JSON even when Claude wraps it in extra text", async () => {
    mockFetch.mockResolvedValueOnce(
      makeOkResponse(`Aquí la información:\n${SAMPLE_JSON}\n\nEso es todo.`),
    );
    const result = await parseBolsaImage(Buffer.from("x"), "image/png");
    expect(result.bloques).toHaveLength(1);
  });

  // ── JSON inválido ──────────────────────────────────────────────────────────
  it("P-4: throws sanitized error when response is not valid JSON", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse("Esto no es JSON para nada."));
    await expect(parseBolsaImage(Buffer.from("x"), "image/jpeg")).rejects.toThrow(
      /formato inesperado/i,
    );
  });

  // ── JSON válido pero estructura inválida (sin bloques) ────────────────────
  it("P-5: throws when JSON lacks required 'bloques' array", async () => {
    const bad = JSON.stringify({ result: "ok" });
    mockFetch.mockResolvedValueOnce(makeOkResponse(bad));
    await expect(parseBolsaImage(Buffer.from("x"), "image/jpeg")).rejects.toThrow(
      /inválida/i,
    );
  });

  // ── Operación sin rawOperacion ─────────────────────────────────────────────
  it("P-6: throws when an operation lacks rawOperacion string", async () => {
    const bad = JSON.stringify({
      bloques: [
        {
          nombreDetectado: "X",
          nroComitenteDetectado: "1",
          operaciones: [{ operacionBase: "COMPRA" }], // sin rawOperacion
        },
      ],
    });
    mockFetch.mockResolvedValueOnce(makeOkResponse(bad));
    await expect(parseBolsaImage(Buffer.from("x"), "image/jpeg")).rejects.toThrow(
      /inválida/i,
    );
  });

  // ── Error 401 → mensaje sanitizado ───────────────────────────────────────
  it("P-7: throws sanitized error for HTTP 401", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized - invalid api key",
    });
    const err = await parseBolsaImage(Buffer.from("x"), "image/jpeg").catch((e) => e);
    expect(err.message).toMatch(/credenciales/i);
    expect(err.message).not.toMatch(/api.key/i);
  });

  // ── Error 429 → mensaje específico ────────────────────────────────────────
  it("P-8: throws rate-limit message for HTTP 429", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429, text: async () => "rate limited" });
    const err = await parseBolsaImage(Buffer.from("x"), "image/jpeg").catch((e) => e);
    expect(err.message).toMatch(/demasiadas solicitudes/i);
  });

  // ── Error 500 → mensaje genérico sin detalles internos ────────────────────
  it("P-9: throws generic error for HTTP 500 without exposing internals", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error from Anthropic",
    });
    const err = await parseBolsaImage(Buffer.from("x"), "image/jpeg").catch((e) => e);
    expect(err.message).toMatch(/error.*500/i);
    expect(err.message).not.toMatch(/anthropic/i);
    expect(err.message).not.toMatch(/internal server error/i);
  });

  // ── Timeout via AbortController ───────────────────────────────────────────
  it("P-10: throws timeout error when fetch is aborted", async () => {
    mockFetch.mockRejectedValueOnce(
      Object.assign(new Error("The operation was aborted"), { name: "AbortError" }),
    );
    const err = await parseBolsaImage(Buffer.from("x"), "image/jpeg").catch((e) => e);
    expect(err.message).toMatch(/tardó demasiado/i);
  });

  // ── Error de red (no AbortError) → mensaje genérico ──────────────────────
  it("P-11: throws generic network error for non-abort fetch failures", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const err = await parseBolsaImage(Buffer.from("x"), "image/jpeg").catch((e) => e);
    expect(err.message).toMatch(/contactar el servicio/i);
    expect(err.message).not.toMatch(/ECONNREFUSED/i);
  });

  // ── Caución colocadora ─────────────────────────────────────────────────────
  it("P-12: maps CAUCION_COLOCADORA with all fields correctly", async () => {
    const json = JSON.stringify({
      bloques: [
        {
          nombreDetectado: "BYG Propia",
          nroComitenteDetectado: "99999",
          operaciones: [
            {
              rawOperacion: "Caución colocadora 7d",
              operacionBase: "CAUCION_COLOCADORA",
              fechaConcertacion: "2024-07-10",
              ticker: null,
              cantidad: null,
              precio: null,
              monedaDetectada: "ARS",
              montoNetoReferencia: "1000000",
              plazo: "7",
              fechaVencimiento: "2024-07-17",
              tasaCaucion: "42.5",
              montoCobrarReferencia: "1008137",
              montoPagarReferencia: null,
              instrumentoHint: null,
            },
          ],
        },
      ],
      warningsGlobales: [],
      erroresGlobales: [],
    });
    mockFetch.mockResolvedValueOnce(makeOkResponse(json));
    const result = await parseBolsaImage(Buffer.from("x"), "image/jpeg");
    const op = result.bloques[0].operaciones[0];
    expect(op.operacionBase).toBe("CAUCION_COLOCADORA");
    expect(op.tasaCaucion).toBe("42.5");
    expect(op.montoCobrarReferencia).toBe("1008137");
    expect(op.fechaVencimiento).toBe("2024-07-17");
  });

  // ── operacionBase desconocida ─────────────────────────────────────────────
  it("P-13: maps unknown operacionBase to DESCONOCIDA", async () => {
    const json = JSON.stringify({
      bloques: [
        {
          nombreDetectado: "X",
          nroComitenteDetectado: "1",
          operaciones: [
            {
              rawOperacion: "Algo raro",
              operacionBase: "ALGO_RARO",
              fechaConcertacion: null,
              ticker: null,
              cantidad: null,
              precio: null,
              monedaDetectada: null,
              montoNetoReferencia: null,
              plazo: null,
              fechaVencimiento: null,
              tasaCaucion: null,
              montoCobrarReferencia: null,
              montoPagarReferencia: null,
              instrumentoHint: null,
            },
          ],
        },
      ],
      warningsGlobales: [],
      erroresGlobales: [],
    });
    mockFetch.mockResolvedValueOnce(makeOkResponse(json));
    const result = await parseBolsaImage(Buffer.from("x"), "image/jpeg");
    expect(result.bloques[0].operaciones[0].operacionBase).toBe("DESCONOCIDA");
  });

  // ── Envía base64 con el media_type correcto ───────────────────────────────
  it("P-14: sends image as base64 with correct media_type", async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse(SAMPLE_JSON));
    const buf = Buffer.from("test-bytes");
    await parseBolsaImage(buf, "image/png");

    const body = JSON.parse(
      (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.model).toBe("claude-haiku-4-5-20251001");
    const imgContent = body.messages[0].content[0];
    expect(imgContent.source.media_type).toBe("image/png");
    expect(imgContent.source.data).toBe(buf.toString("base64"));
  });

  // ── bloques vacíos ─────────────────────────────────────────────────────────
  it("P-15: returns empty result for empty bloques array", async () => {
    const empty = JSON.stringify({ bloques: [], warningsGlobales: [], erroresGlobales: [] });
    mockFetch.mockResolvedValueOnce(makeOkResponse(empty));
    const result = await parseBolsaImage(Buffer.from("x"), "image/jpeg");
    expect(result.bloques).toHaveLength(0);
    expect(result.totalOperaciones).toBe(0);
  });

  // ── monedaDetectada inválida → null ───────────────────────────────────────
  it("P-16: coerces invalid monedaDetectada to null", async () => {
    const json = JSON.stringify({
      bloques: [
        {
          nombreDetectado: "T",
          nroComitenteDetectado: "1",
          operaciones: [
            {
              rawOperacion: "Compra X",
              operacionBase: "COMPRA",
              fechaConcertacion: null,
              ticker: "X",
              cantidad: "1",
              precio: "1",
              monedaDetectada: "EUR",
              montoNetoReferencia: null,
              plazo: null,
              fechaVencimiento: null,
              tasaCaucion: null,
              montoCobrarReferencia: null,
              montoPagarReferencia: null,
              instrumentoHint: null,
            },
          ],
        },
      ],
      warningsGlobales: [],
      erroresGlobales: [],
    });
    mockFetch.mockResolvedValueOnce(makeOkResponse(json));
    const result = await parseBolsaImage(Buffer.from("x"), "image/jpeg");
    expect(result.bloques[0].operaciones[0].monedaDetectada).toBeNull();
  });
});
