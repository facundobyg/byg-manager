import { describe, it, expect } from "vitest";
import { fechaNegocio, fechaNegocioDate, ZONA_NEGOCIO } from "./fecha-negocio";

// P1-03A.1 — la fecha de negocio es el día calendario en Argentina, no el día UTC.

describe("fechaNegocio (America/Argentina/Buenos_Aires)", () => {
  it("zona canónica", () => expect(ZONA_NEGOCIO).toBe("America/Argentina/Buenos_Aires"));

  it("CASO A: 2026-11-12T00:30:00Z = 11/11 21:30 ART → 2026-11-11 (no el día UTC)", () => {
    expect(fechaNegocio(new Date("2026-11-12T00:30:00Z"))).toBe("2026-11-11");
    expect(fechaNegocioDate(new Date("2026-11-12T00:30:00Z")).toISOString()).toBe("2026-11-11T00:00:00.000Z");
  });

  it("CASO B: inmediatamente antes de la medianoche argentina (23:59:59.999 ART) → mismo día", () => {
    expect(fechaNegocio(new Date("2026-11-12T02:59:59.999Z"))).toBe("2026-11-11");
  });

  it("CASO C: inmediatamente después de la medianoche argentina (00:00:00 ART) → día siguiente", () => {
    expect(fechaNegocio(new Date("2026-11-12T03:00:00.000Z"))).toBe("2026-11-12");
  });

  it("después de las 21:00 ART el día UTC ya cambió pero la fecha de negocio no", () => {
    for (const utc of ["2026-11-12T00:00:00Z", "2026-11-12T01:30:00Z", "2026-11-12T02:30:00Z"]) {
      expect(fechaNegocio(new Date(utc))).toBe("2026-11-11");
    }
    expect(fechaNegocio(new Date("2026-11-11T22:00:00Z"))).toBe("2026-11-11"); // 19:00 ART
  });

  it("cruce de mes y de año", () => {
    expect(fechaNegocio(new Date("2026-12-01T02:00:00Z"))).toBe("2026-11-30");
    expect(fechaNegocio(new Date("2027-01-01T01:00:00Z"))).toBe("2026-12-31");
  });

  it("instante inválido → error (no inventa una fecha)", () => {
    expect(() => fechaNegocio(new Date("no-es-fecha"))).toThrow(/inválido/);
  });
});
