import { describe, it, expect, vi, beforeEach } from "vitest";

// PRE-CUTOVER (2026-11-04) — POLÍTICA 2FA: obligatorio SOLO para ADMIN; para SOCIO /
// EMPLEADO (Francisco, Augusto) es VOLUNTARIO. twoFactorEnabled=false no impide el
// login, no redirige a /configuracion/2fa y no cambia permisos. Si el usuario lo
// activa, el login lo exige con la lógica existente (auth.ts authorize).

const m = vi.hoisted(() => ({
  config: null as null | { providers: { authorize: (c: Record<string, string>) => Promise<unknown> }[] },
  prisma: { user: { findUnique: vi.fn(), update: vi.fn(async () => ({})) } },
  verifyTOTP: vi.fn(),
}));
vi.mock("next-auth", () => ({
  default: (cfg: typeof m.config) => { m.config = cfg; return { handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn(), unstable_update: vi.fn() }; },
}));
vi.mock("next-auth/providers/credentials", () => ({ default: (c: unknown) => c }));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/auth/totp", () => ({ verifyTOTP: m.verifyTOTP }));
vi.mock("@/lib/services/audit.service", () => ({ writeAuditLog: vi.fn(async () => undefined) }));
vi.mock("@/auth.config", async () => await import("../../auth.config"));
vi.mock("@/lib/auth/jwt-refresh", async () => await import("./jwt-refresh"));

import { authConfig } from "../../auth.config";
import { ROLES_2FA_OBLIGATORIO } from "./permission-registry";
import "../../auth";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs") as { hashSync(s: string, r: number): string };

type U = { role: string; twoFactorEnabled: boolean };
/** Middleware real (authConfig.callbacks.authorized) para una sesión y una ruta. */
function middleware(user: U | null, path: string): { tipo: "ok" } | { tipo: "redirect"; destino: string } | { tipo: "login" } {
  const r = authConfig.callbacks.authorized({
    auth: user ? { user: { id: "x", ...user }, expires: "" } as never : null,
    request: { nextUrl: new URL(`https://byg.test${path}`) } as never,
  });
  if (r === true) return { tipo: "ok" };
  if (r === false) return { tipo: "login" };
  return { tipo: "redirect", destino: new URL((r as Response).headers.get("location")!).pathname };
}

const FRANCISCO: U = { role: "SOCIO", twoFactorEnabled: false };
const AUGUSTO: U = { role: "SOCIO", twoFactorEnabled: false };
const EMPLEADO: U = { role: "EMPLEADO", twoFactorEnabled: false };
const FACU_SIN_2FA: U = { role: "ADMIN", twoFactorEnabled: false };
const FACU: U = { role: "ADMIN", twoFactorEnabled: true };

describe("política 2FA — SSOT", () => {
  it("solo ADMIN es obligatorio; SOCIO y EMPLEADO voluntario", () => {
    expect(Array.from(ROLES_2FA_OBLIGATORIO)).toEqual(["ADMIN"]);
  });
});

describe("middleware: SOCIO / EMPLEADO sin 2FA navegan normal (sin redirect obligatorio)", () => {
  it.each(["/posicion", "/bolsa", "/carteras/propia", "/inicio"])("2. Francisco (SOCIO, 2FA OFF) → %s sin redirect", (ruta) => {
    expect(middleware(FRANCISCO, ruta)).toEqual({ tipo: "ok" });
  });
  it.each(["/caja/nanu_trenque", "/operativa/mov-diarios", "/clientes/cc", "/clientes/pf"])("4. Augusto (SOCIO, 2FA OFF) → %s sin redirect", (ruta) => {
    expect(middleware(AUGUSTO, ruta)).toEqual({ tipo: "ok" });
  });
  it("EMPLEADO sin 2FA → sin redirect", () => {
    expect(middleware(EMPLEADO, "/posicion")).toEqual({ tipo: "ok" });
  });
  it("6. SOCIO puede entrar voluntariamente a /configuracion/2fa (y mi-cuenta)", () => {
    expect(middleware(FRANCISCO, "/configuracion/2fa")).toEqual({ tipo: "ok" });
    expect(middleware(AUGUSTO, "/configuracion/mi-cuenta")).toEqual({ tipo: "ok" });
  });
});

describe("middleware: ADMIN sigue con 2FA obligatorio, sin loops", () => {
  it("9. ADMIN sin 2FA → redirect a /configuracion/2fa desde cualquier ruta operativa", () => {
    expect(middleware(FACU_SIN_2FA, "/posicion")).toEqual({ tipo: "redirect", destino: "/configuracion/2fa" });
    expect(middleware(FACU_SIN_2FA, "/permisos")).toEqual({ tipo: "redirect", destino: "/configuracion/2fa" });
  });
  it("10. sin loop: ADMIN sin 2FA en /configuracion/2fa (y mi-cuenta) → ok", () => {
    expect(middleware(FACU_SIN_2FA, "/configuracion/2fa")).toEqual({ tipo: "ok" });
    expect(middleware(FACU_SIN_2FA, "/configuracion/mi-cuenta")).toEqual({ tipo: "ok" });
  });
  it("ADMIN con 2FA → navega normal", () => {
    expect(middleware(FACU, "/permisos")).toEqual({ tipo: "ok" });
  });
  it("no logueado → login; logueado en /login → redirect a /", () => {
    expect(middleware(null, "/posicion")).toEqual({ tipo: "login" });
    expect(middleware(FRANCISCO, "/login")).toEqual({ tipo: "redirect", destino: "/" });
  });
});

describe("login (auth.ts authorize real): 2FA OFF entra con contraseña; 2FA ON lo exige", () => {
  const hash = bcrypt.hashSync("clave-correcta", 4);
  const user = (p: Partial<{ role: string; twoFactorEnabled: boolean; twoFactorSecret: string | null }>) => ({
    id: "u", email: "u@byg.test", name: "U", role: "SOCIO", activo: true, passwordHash: hash, twoFactorEnabled: false, twoFactorSecret: null, ...p,
  });
  const authorize = (c: Record<string, string>) => m.config!.providers[0].authorize(c);
  beforeEach(() => { m.prisma.user.findUnique.mockReset(); m.verifyTOTP.mockReset(); });

  it("1/3. SOCIO (Francisco / Augusto) con 2FA OFF → login permitido solo con contraseña", async () => {
    m.prisma.user.findUnique.mockResolvedValue(user({ role: "SOCIO", twoFactorEnabled: false }));
    expect(await authorize({ email: "u@byg.test", password: "clave-correcta" })).toMatchObject({ id: "u", role: "SOCIO", twoFactorEnabled: false });
    expect(m.verifyTOTP).not.toHaveBeenCalled();
  });

  it("contraseña incorrecta → rechazo (sin cambios)", async () => {
    m.prisma.user.findUnique.mockResolvedValue(user({}));
    expect(await authorize({ email: "u@byg.test", password: "mala" })).toBeNull();
  });

  it("5. usuario con 2FA ON (voluntario o ADMIN) → sin código: rechazo; código inválido: rechazo; válido: OK", async () => {
    m.prisma.user.findUnique.mockResolvedValue(user({ twoFactorEnabled: true, twoFactorSecret: "SECRET" }));
    expect(await authorize({ email: "u@byg.test", password: "clave-correcta" })).toBeNull();
    m.verifyTOTP.mockReturnValue(false);
    expect(await authorize({ email: "u@byg.test", password: "clave-correcta", totpCode: "000000" })).toBeNull();
    m.verifyTOTP.mockReturnValue(true);
    expect(await authorize({ email: "u@byg.test", password: "clave-correcta", totpCode: "123456" })).toMatchObject({ id: "u", twoFactorEnabled: true });
  });
});
