import { describe, it, expect } from "vitest";
import { normalizarNumeroAR, formatearNumeroAR, esFechaISOValida, NumeroARError } from "./numero-ar";

// P1-03B — parser es-AR ESTRICTO (reemplaza parseFloat(raw.replace(",", "."))).

describe("P1-03B — normalizarNumeroAR: válidos", () => {
  it.each([
    ["30.088", "30088"],          // VN IAM: punto = miles, NO decimal
    ["51.385", "51385"],          // valuación IAM
    ["11.701", "11701"],          // VN IPA
    ["15.109", "15109"],          // valuación IPA
    ["1,707824", "1.707824"],
    ["1.234.567,5", "1234567.5"],
    ["1234567,5", "1234567.5"],   // sin miles también es válido
    ["66,00", "66.00"],
    ["0,5", "0.5"],
    ["100", "100"],
    ["007", "7"],
    ["  51.385  ", "51385"],
  ])("%s → %s", (raw, esperado) => {
    expect(normalizarNumeroAR(raw)).toBe(esperado);
  });
});

describe("P1-03B — normalizarNumeroAR: ambiguos / malformados → RECHAZO", () => {
  it.each([
    ["", "vacío"],
    ["   ", "vacío"],
    ["1.5", "punto que no agrupa de a 3 (¿decimal en-US?)"],
    ["1.2345", "grupo de 4"],
    ["1.707824", "punto decimal en-US"],
    ["1.234.5", "último grupo incompleto"],
    ["1,234,5", "dos comas"],
    ["1.234,5,6", "dos comas"],
    ["0.123", "grupo de miles que empieza en 0"],
    ["1234.567", "miles mal agrupados (4 dígitos antes del punto)"],
    ["-5", "negativo"],
    ["+5", "signo"],
    ["1e3", "notación científica"],
    ["12 345", "espacio interno"],
    ["$100", "símbolo"],
    ["USD 51.385", "texto"],
    [",5", "sin parte entera"],
    ["5,", "coma final"],
    ["5.", "punto final"],
    ["NaN", "no numérico"],
  ])("%s (%s)", (raw) => {
    expect(() => normalizarNumeroAR(raw)).toThrow(NumeroARError);
  });

  it("null/undefined → rechazo", () => {
    expect(() => normalizarNumeroAR(null)).toThrow(NumeroARError);
    expect(() => normalizarNumeroAR(undefined)).toThrow(NumeroARError);
  });

  it("escala: más decimales que maxDecimales → rechazo (no se redondea en silencio)", () => {
    expect(normalizarNumeroAR("1,123456", { maxDecimales: 6 })).toBe("1.123456");
    expect(() => normalizarNumeroAR("1,1234567", { maxDecimales: 6 })).toThrow(/7 decimales/);
    expect(() => normalizarNumeroAR("51.385,001", { maxDecimales: 2 })).toThrow(/máximo 2/);
  });

  it("precisión: más de 12 dígitos enteros → rechazo (Decimal(18,6))", () => {
    expect(normalizarNumeroAR("999.999.999.999")).toBe("999999999999");
    expect(() => normalizarNumeroAR("1.000.000.000.000")).toThrow(/12 dígitos/);
  });

  it("el mensaje nombra el campo", () => {
    expect(() => normalizarNumeroAR("1.5", { campo: "VN" })).toThrow(/^VN:/);
  });
});

describe("P1-03B — formatearNumeroAR (sin pasar por Number)", () => {
  it.each([
    ["51385", "51.385"],
    ["30088", "30.088"],
    ["1.707824", "1,707824"],
    ["1234567.5", "1.234.567,5"],
    ["51385.008512", "51.385,008512"],
    ["-0.001843", "-0,001843"],
    ["66.00", "66"],
    ["999", "999"],
  ])("%s → %s", (c, esperado) => {
    expect(formatearNumeroAR(c)).toBe(esperado);
  });
  it("minDecimales", () => {
    expect(formatearNumeroAR("51385.008512", { minDecimales: 2 })).toBe("51.385,008512");
    expect(formatearNumeroAR("15109", { minDecimales: 2 })).toBe("15.109,00");
  });
  it("round-trip: formatear → normalizar devuelve el canónico", () => {
    for (const c of ["1.707824", "1.291257", "51385", "1234567.5", "0.5"]) {
      expect(normalizarNumeroAR(formatearNumeroAR(c))).toBe(c);
    }
  });
});

describe("P1-03B — esFechaISOValida", () => {
  it("válidas / inválidas", () => {
    expect(esFechaISOValida("2026-11-12")).toBe(true);
    expect(esFechaISOValida("2028-02-29")).toBe(true);
    expect(esFechaISOValida("2026-02-30")).toBe(false);
    expect(esFechaISOValida("12/11/2026")).toBe(false);
    expect(esFechaISOValida("2026-11-12T00:00:00Z")).toBe(false);
    expect(esFechaISOValida("")).toBe(false);
    expect(esFechaISOValida(undefined)).toBe(false);
  });
});
