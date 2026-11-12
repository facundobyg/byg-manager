import { describe, it, expect, vi, beforeEach } from "vitest";

// P1-03A.2 — mes operativo sin MesContable activo = mes CALENDARIO ARGENTINO (no el UTC del servidor).

const st = vi.hoisted(() => ({ activo: null as null | { mes: string } }));
vi.mock("@/lib/prisma", () => ({ prisma: { mesContable: { findFirst: vi.fn(async () => st.activo) } } }));
vi.mock("@/lib/fecha-negocio", async () => await import("../fecha-negocio"));
import { getMesOperativo } from "./config.service";

beforeEach(() => { st.activo = null; });

describe("P1-03A.2 — getMesOperativo", () => {
  it("31/10 21:30 ART (UTC ya es 01/11) → sigue en 2026-10", async () => {
    expect(await getMesOperativo(new Date("2026-11-01T00:30:00Z"))).toBe("2026-10");
  });
  it("01/11 00:00 ART → 2026-11", async () => {
    expect(await getMesOperativo(new Date("2026-11-01T03:00:00Z"))).toBe("2026-11");
  });
  it("31/12 22:00 ART (UTC 01/01/2027) → 2026-12", async () => {
    expect(await getMesOperativo(new Date("2027-01-01T01:00:00Z"))).toBe("2026-12");
  });
  it("si hay MesContable activo, manda ese (sin cambios)", async () => {
    st.activo = { mes: "2026-04" };
    expect(await getMesOperativo(new Date("2026-11-01T00:30:00Z"))).toBe("2026-04");
  });
});
