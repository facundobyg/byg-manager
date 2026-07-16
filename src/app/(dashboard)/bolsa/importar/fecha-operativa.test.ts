import { describe, it, expect } from "vitest";
import { todayLocalISODate, parseFechaOperativa, isoDateString } from "./fecha-operativa";

describe("todayLocalISODate", () => {
  it("FOP-1: default de hoy — devuelve la fecha local, no la UTC, para una hora que cruza el día en UTC-3", () => {
    // 2026-07-16 23:30 hora local (UTC-3) == 2026-07-17 02:30 UTC.
    // Si se usara UTC directamente, devolvería el día siguiente por error.
    const local = new Date(2026, 6, 16, 23, 30, 0);
    expect(todayLocalISODate(local)).toBe("2026-07-16");
  });

  it("FOP-2: devuelve la fecha de hoy cuando no se pasa ningún argumento", () => {
    const now = new Date();
    const expected = todayLocalISODate(now);
    expect(todayLocalISODate()).toBe(expected);
  });
});

describe("parseFechaOperativa", () => {
  it("FOP-3: acepta una fecha válida", () => {
    const d = parseFechaOperativa("2026-07-10");
    expect(d).not.toBeNull();
    expect(isoDateString(d!)).toBe("2026-07-10");
  });

  it("FOP-4: rechaza fecha faltante (null/undefined)", () => {
    expect(parseFechaOperativa(null)).toBeNull();
    expect(parseFechaOperativa(undefined)).toBeNull();
  });

  it("FOP-5: rechaza string vacío", () => {
    expect(parseFechaOperativa("")).toBeNull();
  });

  it("FOP-6: rechaza formato inválido", () => {
    expect(parseFechaOperativa("10/07/2026")).toBeNull();
    expect(parseFechaOperativa("2026-7-10")).toBeNull();
    expect(parseFechaOperativa("no es una fecha")).toBeNull();
  });

  it("FOP-7: rechaza fecha calendario inexistente", () => {
    expect(parseFechaOperativa("2026-13-01")).toBeNull();
    expect(parseFechaOperativa("2026-02-30")).toBeNull();
  });

  it("FOP-8: acepta una fecha anterior a hoy", () => {
    const d = parseFechaOperativa("2020-01-01");
    expect(d).not.toBeNull();
    expect(isoDateString(d!)).toBe("2020-01-01");
  });
});
