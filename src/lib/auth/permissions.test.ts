import { describe, it, expect, vi, beforeEach } from "vitest";

// MACRO 1 — guard central de autorización (requireActionPermission y amigos).

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cookieValue: null as string | null,
  readOnly: false,
  writeAuditLog: vi.fn(),
  prisma: {
    user: { findUnique: vi.fn() },
    userPermiso: { findFirst: vi.fn(), findMany: vi.fn() },
    caja: { findMany: vi.fn() },
  },
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/services/audit.service", () => ({ writeAuditLog: mocks.writeAuditLog }));
vi.mock("@/lib/config", () => ({
  get readOnlyPreview() { return mocks.readOnly; },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "byg_preview_user" && mocks.cookieValue ? { value: mocks.cookieValue } : undefined),
  }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("REDIRECT"); }) }));

import {
  requireActionPermission,
  requireCajaPermission,
  canDoAction,
  hasPermission,
  getEffectivePermissions,
  requireOwnAccountGuard,
  isCurrentAdmin,
} from "./permissions";

type Usr = { id: string; name: string; role: string; activo?: boolean; twoFactorEnabled?: boolean };

const FACUNDO: Usr = { id: "u-fac", name: "Facundo", role: "ADMIN" };
const FRANCISCO: Usr = { id: "u-fran", name: "Francisco", role: "SOCIO" };
const AUGUSTO: Usr = { id: "u-aug", name: "Augusto", role: "SOCIO" };

let users: Record<string, Usr>;
/** overrides[userId][key] = concedido */
let overrides: Record<string, Record<string, boolean>>;

function loginAs(u: Usr | null) {
  mocks.auth.mockResolvedValue(u ? { user: { id: u.id, name: u.name, role: u.role } } : null);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookieValue = null;
  mocks.readOnly = false;
  users = {
    [FACUNDO.id]: { ...FACUNDO, activo: true, twoFactorEnabled: true },
    [FRANCISCO.id]: { ...FRANCISCO, activo: true, twoFactorEnabled: true },
    [AUGUSTO.id]: { ...AUGUSTO, activo: true, twoFactorEnabled: true },
  };
  overrides = {};
  mocks.prisma.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
    const u = users[where.id];
    return u ? { id: u.id, name: u.name, role: u.role, activo: u.activo ?? true, twoFactorEnabled: u.twoFactorEnabled ?? false } : null;
  });
  // findMany: { userId } (todas) o { userId, OR: [{ Permiso: { modulo, accion } }] } (canónica + legacy).
  mocks.prisma.userPermiso.findMany.mockImplementation(
    async ({ where }: { where: { userId: string; OR?: { Permiso: { modulo: string; accion: string } }[] } }) => {
      const pedidas = where.OR?.map((o) => `${o.Permiso.modulo}:${o.Permiso.accion}`);
      return Object.entries(overrides[where.userId] ?? {})
        .filter(([k]) => !pedidas || pedidas.includes(k))
        .map(([k, concedido]) => {
          const [modulo, accion] = k.split(":");
          return { concedido, temporal: false, fechaExpiracion: null, Permiso: { modulo, accion } };
        });
    },
  );
  mocks.prisma.caja.findMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) =>
    [
      { id: "caja-oficina", tipo: "CENTRAL_CONTABLE" },
      { id: "caja-trenque", tipo: "SUCURSAL_OPERATIVA" },
      { id: "caja-seguridad", tipo: "CAJA_SEGURIDAD" },
      { id: "caja-rara", tipo: "TIPO_FUTURO" },
    ].filter((c) => where.id.in.includes(c.id)),
  );
});

describe("A/B/C/G — sesión, permiso, ADMIN", () => {
  it("A. sin sesión → rechazo sin tocar DB", async () => {
    loginAs(null);
    expect(await requireActionPermission("bolsa:crear")).toEqual({ error: "Sin sesión activa" });
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("B. SOCIO sin permiso por default de rol (configuracion:editar) → rechazo + audit", async () => {
    loginAs(FRANCISCO);
    expect(await requireActionPermission("configuracion:editar")).toEqual({ error: expect.stringMatching(/permisos/) });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ userId: FRANCISCO.id, accion: "ACCESO_DENEGADO" }));
  });

  it("B. override de revocación aplica → rechazo", async () => {
    overrides[FRANCISCO.id] = { "bolsa:crear": false };
    loginAs(FRANCISCO);
    expect(await requireActionPermission("bolsa:crear")).not.toBeNull();
  });

  it("C. SOCIO con permiso por default → permite", async () => {
    loginAs(FRANCISCO);
    expect(await requireActionPermission("bolsa:crear")).toBeNull();
  });

  it("C. override de grant habilita una clave administrativa otorgable", async () => {
    overrides[AUGUSTO.id] = { "configuracion:editar": true };
    loginAs(AUGUSTO);
    expect(await requireActionPermission("configuracion:editar")).toBeNull();
  });

  it("G. ADMIN real → permite cualquier clave registrada, incluidas adminOnly", async () => {
    loginAs(FACUNDO);
    expect(await requireActionPermission("usuarios:administrar")).toBeNull();
    expect(await requireActionPermission("sistema:admin")).toBeNull();
    expect(await requireActionPermission("cc:reconciliar")).toBeNull();
  });

  it("adminOnly no es otorgable por override (anti-escalada)", async () => {
    overrides[FRANCISCO.id] = { "usuarios:administrar": true, "sistema:admin": true };
    loginAs(FRANCISCO);
    expect(await requireActionPermission("usuarios:administrar")).not.toBeNull();
    expect(await requireActionPermission("sistema:admin")).not.toBeNull();
  });

  it("clave desconocida → rechazo incluso para ADMIN (fail closed)", async () => {
    loginAs(FACUNDO);
    expect(await requireActionPermission("mov_diarios:escribir")).not.toBeNull();
  });

  it("rol se lee de DB, no del JWT: degradado en DB → pierde ADMIN", async () => {
    users[FACUNDO.id].role = "SOCIO";
    loginAs(FACUNDO); // JWT todavía dice ADMIN
    expect(await requireActionPermission("usuarios:administrar")).not.toBeNull();
  });

  it("usuario desactivado → rechazo", async () => {
    users[FRANCISCO.id].activo = false;
    loginAs(FRANCISCO);
    expect(await requireActionPermission("bolsa:crear")).toEqual({ error: expect.stringMatching(/Sesión inválida/) });
  });
});

// PRE-CUTOVER (2026-11-04): 2FA OBLIGATORIO solo para ADMIN; para SOCIO / EMPLEADO es
// VOLUNTARIO (twoFactorEnabled=false no bloquea; los permisos siguen idénticos).
describe("D/E — 2FA en backend", () => {
  it("D. SOCIO con 2FA desactivado → opera con sus permisos normales (2FA voluntario)", async () => {
    users[FRANCISCO.id].twoFactorEnabled = false;
    loginAs(FRANCISCO);
    expect(await requireActionPermission("bolsa:crear")).toBeNull();
    expect(mocks.writeAuditLog).not.toHaveBeenCalledWith(expect.objectContaining({ metadata: { reason: "TWO_FACTOR_REQUIRED" } }));
  });

  it("D. SOCIO con 2FA desactivado → lo prohibido por política sigue prohibido (sin cambios de permisos)", async () => {
    users[FRANCISCO.id].twoFactorEnabled = false;
    overrides[FRANCISCO.id] = { "bolsa:crear": false };
    loginAs(FRANCISCO);
    expect(await requireActionPermission("bolsa:crear")).toEqual({ error: expect.stringMatching(/permisos/) });
  });

  it("D. ADMIN con 2FA desactivado → también rechazado", async () => {
    users[FACUNDO.id].twoFactorEnabled = false;
    loginAs(FACUNDO);
    expect(await requireActionPermission("bolsa:crear")).toEqual({ error: expect.stringMatching(/2FA/) });
  });

  it("D. canDoAction: ADMIN sin 2FA → bloqueado; SOCIO sin 2FA → según sus permisos", async () => {
    users[FACUNDO.id].twoFactorEnabled = false;
    loginAs(FACUNDO);
    expect(await canDoAction("bolsa:crear")).toBe(false);
    users[FRANCISCO.id].twoFactorEnabled = false;
    loginAs(FRANCISCO);
    expect(await canDoAction("bolsa:crear")).toBe(true);
  });

  it("D. lecturas (mode read): ADMIN sin 2FA → rechazo; SOCIO sin 2FA → permitido", async () => {
    users[FACUNDO.id].twoFactorEnabled = false;
    loginAs(FACUNDO);
    expect(await requireActionPermission("holdings:editar", { mode: "read" })).not.toBeNull();
    users[FRANCISCO.id].twoFactorEnabled = false;
    loginAs(FRANCISCO);
    expect(await requireActionPermission("holdings:editar", { mode: "read" })).toBeNull();
  });
  // E (acciones de configurar 2FA permitidas sin 2FA) se cubre en
  // server-actions-guard.test.ts: 2fa/actions.ts está en la allowlist explícita
  // y no pasa por este guard.
});

describe("F — readOnlyPreview y 'ver como'", () => {
  it("F. readOnlyPreview global → mutación rechazada antes de consultar DB", async () => {
    mocks.readOnly = true;
    loginAs(FACUNDO);
    expect(await requireActionPermission("bolsa:crear")).toEqual({ error: "Modo lectura activo" });
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("F. readOnlyPreview global → lectura (mode read) permitida", async () => {
    mocks.readOnly = true;
    loginAs(FACUNDO);
    expect(await requireActionPermission("holdings:editar", { mode: "read" })).toBeNull();
  });

  it("F. ADMIN en 'ver como' → mutación rechazada", async () => {
    mocks.cookieValue = FRANCISCO.id;
    loginAs(FACUNDO);
    expect(await requireActionPermission("bolsa:crear")).toEqual({ error: expect.stringMatching(/ver como/) });
  });

  it("F. ADMIN en 'ver como' → lectura permitida", async () => {
    mocks.cookieValue = FRANCISCO.id;
    loginAs(FACUNDO);
    expect(await requireActionPermission("holdings:editar", { mode: "read" })).toBeNull();
  });

  it("F. cookie de preview en un no-ADMIN no tiene efecto", async () => {
    mocks.cookieValue = AUGUSTO.id;
    loginAs(FRANCISCO);
    expect(await requireActionPermission("bolsa:crear")).toBeNull();
  });

  it("F. 'ver como': canDoAction / hasPermission evalúan al usuario previsualizado", async () => {
    overrides[FRANCISCO.id] = { "cc:crear_movimiento": false };
    mocks.cookieValue = FRANCISCO.id;
    loginAs(FACUNDO);
    expect(await canDoAction("cc:crear_movimiento")).toBe(false);
    expect(await canDoAction("bolsa:crear")).toBe(true);
    expect(await hasPermission("configuracion:leer")).toBe(false);
  });

  it("audit de rechazo registra el actor autenticado real", async () => {
    mocks.cookieValue = FRANCISCO.id;
    loginAs(AUGUSTO);
    overrides[AUGUSTO.id] = { "bolsa:concertar": false };
    await requireActionPermission("bolsa:concertar");
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ userId: AUGUSTO.id }));
  });
});

describe("S03/S12 — Scope de caja por Caja.tipo, exigiendo TODOS los scopes", () => {
  const SOLO_OFICINA = { "caja:operar_trenque": false };
  const SOLO_TRENQUE = { "caja:operar_oficina": false };
  const NINGUNA = { "caja:operar_oficina": false, "caja:operar_trenque": false };

  it.each([
    ["Oficina sola",   ["caja-oficina"],                 {},           true],
    ["Oficina sola",   ["caja-oficina"],                 SOLO_TRENQUE, false],
    ["Trenque sola",   ["caja-trenque"],                 SOLO_TRENQUE, true],
    ["Trenque sola",   ["caja-trenque"],                 SOLO_OFICINA, false],
    ["ambas",          ["caja-oficina", "caja-trenque"], {},           true],
    ["ambas",          ["caja-oficina", "caja-trenque"], SOLO_OFICINA, false],
    ["ambas",          ["caja-oficina", "caja-trenque"], SOLO_TRENQUE, false],
    ["ambas",          ["caja-oficina", "caja-trenque"], NINGUNA,      false],
    ["seguridad=Oficina", ["caja-seguridad"],            SOLO_TRENQUE, false],
  ] as const)("%s con permisos %j → permitido=%s", async (_l, cajas, ov, permitido) => {
    overrides[AUGUSTO.id] = { ...ov };
    loginAs(AUGUSTO);
    const r = await requireCajaPermission(cajas);
    expect(r === null).toBe(permitido);
  });

  it("ADMIN → ambas permitidas", async () => {
    loginAs(FACUNDO);
    expect(await requireCajaPermission(["caja-oficina", "caja-trenque"])).toBeNull();
  });

  it("tipo sin regla conocida → DENY aun para ADMIN (no se asume scope)", async () => {
    loginAs(FACUNDO);
    expect(await requireCajaPermission(["caja-rara"])).not.toBeNull();
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ metadata: { reason: "CAJA_SIN_SCOPE" } }));
  });

  it("caja inexistente → DENY (fail closed)", async () => {
    loginAs(FACUNDO);
    expect(await requireCajaPermission(["caja-fantasma"])).not.toBeNull();
  });

  it("sin cajas involucradas → no exige scope", async () => {
    loginAs(AUGUSTO);
    expect(await requireCajaPermission([null, undefined, ""])).toBeNull();
    expect(mocks.prisma.caja.findMany).not.toHaveBeenCalled();
  });
});

describe("R3 — auditoría, 2FA en lecturas, cookie inerte, puente legacy", () => {
  it("R2-08: si el AuditLog falla, el rechazo se mantiene", async () => {
    mocks.writeAuditLog.mockRejectedValue(new Error("db caída"));
    overrides[FRANCISCO.id] = { "bolsa:crear": false };
    loginAs(FRANCISCO);
    expect(await requireActionPermission("bolsa:crear")).toEqual({ error: expect.stringMatching(/permisos/) });
  });

  it("R2-08: usuario de sesión inexistente en DB → rechazo auditado USER_NOT_FOUND", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u-borrado", name: "X", role: "ADMIN" } });
    expect(await requireActionPermission("bolsa:crear")).not.toBeNull();
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ userId: "u-borrado", metadata: { reason: "USER_NOT_FOUND" } }));
  });

  it("R2-03: hasPermission (páginas) exige 2FA del ADMIN real; SOCIO sin 2FA accede a lo permitido", async () => {
    users[FACUNDO.id].twoFactorEnabled = false;
    loginAs(FACUNDO);
    expect(await hasPermission("posicion:leer")).toBe(false);
    users[FRANCISCO.id].twoFactorEnabled = false;
    loginAs(FRANCISCO);
    expect(await hasPermission("posicion:leer")).toBe(true);
  });

  it("R2-07: cookie de 'ver como' en un no-ADMIN es inerte (cuenta propia permitida)", async () => {
    mocks.cookieValue = AUGUSTO.id;
    loginAs(FRANCISCO);
    expect(await requireOwnAccountGuard({ allowWithout2FA: true })).toEqual({ userId: FRANCISCO.id });
  });

  it("puente: revocación legacy restringe la clave canónica en el guard real", async () => {
    overrides[FRANCISCO.id] = { "caja:escribir": false, "mov_diarios:crear": false };
    loginAs(FRANCISCO);
    expect(await requireActionPermission("caja:operar_oficina")).not.toBeNull();
    expect(await requireActionPermission("cambio:operar")).not.toBeNull();
    expect(await requireActionPermission("bolsa:crear")).toBeNull();
    const set = await getEffectivePermissions(FRANCISCO.id, "SOCIO");
    expect(set.has("caja:transferir")).toBe(false);
  });

  it("puente: un grant legacy no concede nada", async () => {
    overrides[AUGUSTO.id] = { "caja:escribir": true, "configuracion:escribir": true };
    loginAs(AUGUSTO);
    expect(await requireActionPermission("configuracion:editar")).not.toBeNull();
  });
});

describe("S06 — clave desconocida = DENY incluso ADMIN en TODOS los caminos", () => {
  it("hasPermission / canDoAction / requireActionPermission", async () => {
    loginAs(FACUNDO);
    expect(await hasPermission("mov_diarios:escribir")).toBe(false);
    expect(await canDoAction("mov_diarios:escribir")).toBe(false);
    expect(await requireActionPermission("mov_diarios:escribir")).not.toBeNull();
  });
});

describe("S10 — rechazos auditados con reason code y actor real", () => {
  it.each([
    ["permiso",   () => { overrides[FRANCISCO.id] = { "bolsa:crear": false }; }, FRANCISCO, "PERMISSION_DENIED"],
    ["2FA",       () => { users[FACUNDO.id].twoFactorEnabled = false; },         FACUNDO,   "TWO_FACTOR_REQUIRED"],
    ["inactivo",  () => { users[FRANCISCO.id].activo = false; },                 FRANCISCO, "USER_INACTIVE"],
    ["preview",   () => { mocks.cookieValue = FRANCISCO.id; },                   FACUNDO,   "PREVIEW_READ_ONLY"],
    ["readOnly",  () => { mocks.readOnly = true; },                              FACUNDO,   "GLOBAL_READ_ONLY"],
  ] as const)("%s", async (_l, setup, actor, reason) => {
    setup();
    loginAs(actor);
    expect(await requireActionPermission("bolsa:crear")).not.toBeNull();
    expect(mocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ userId: actor.id, accion: "ACCESO_DENEGADO", metadata: { reason } }),
    );
  });

  it("el audit no incluye secretos", async () => {
    users[FACUNDO.id].twoFactorEnabled = false;
    loginAs(FACUNDO);
    await requireActionPermission("bolsa:crear");
    const payload = JSON.stringify(mocks.writeAuditLog.mock.calls);
    expect(payload).not.toMatch(/password|secret|totp|token|ownerClientId/i);
  });
});

describe("S05 — guard de cuenta propia", () => {
  it("activo + sin preview → permite (aun sin 2FA si allowWithout2FA)", async () => {
    users[FRANCISCO.id].twoFactorEnabled = false;
    loginAs(FRANCISCO);
    expect(await requireOwnAccountGuard({ allowWithout2FA: true })).toEqual({ userId: FRANCISCO.id });
  });

  it("ADMIN sin 2FA y allowWithout2FA=false → DENY", async () => {
    users[FACUNDO.id].twoFactorEnabled = false;
    loginAs(FACUNDO);
    expect(await requireOwnAccountGuard({ allowWithout2FA: false })).toEqual({ error: expect.stringMatching(/2FA/) });
  });

  it("SOCIO sin 2FA y allowWithout2FA=false → permitido (2FA voluntario)", async () => {
    users[FRANCISCO.id].twoFactorEnabled = false;
    loginAs(FRANCISCO);
    expect(await requireOwnAccountGuard({ allowWithout2FA: false })).toEqual({ userId: FRANCISCO.id });
  });

  it("usuario inactivo → DENY", async () => {
    users[FRANCISCO.id].activo = false;
    loginAs(FRANCISCO);
    expect(await requireOwnAccountGuard({ allowWithout2FA: true })).toHaveProperty("error");
  });

  it("'ver como' → DENY (Facundo no edita la cuenta del previsualizado ni la propia)", async () => {
    mocks.cookieValue = FRANCISCO.id;
    loginAs(FACUNDO);
    expect(await requireOwnAccountGuard({ allowWithout2FA: true })).toEqual({ error: expect.stringMatching(/ver como/) });
  });

  it("readOnlyPreview → DENY", async () => {
    mocks.readOnly = true;
    loginAs(FRANCISCO);
    expect(await requireOwnAccountGuard({ allowWithout2FA: true })).toEqual({ error: "Modo lectura activo" });
  });

  it("sin sesión → DENY", async () => {
    loginAs(null);
    expect(await requireOwnAccountGuard({ allowWithout2FA: true })).toEqual({ error: "Sin sesión activa" });
  });
});

describe("S09 — isCurrentAdmin usa DB, no el JWT", () => {
  it("ADMIN vigente → true", async () => {
    loginAs(FACUNDO);
    expect(await isCurrentAdmin()).toBe(true);
  });
  it("JWT ADMIN pero DB SOCIO → false", async () => {
    users[FACUNDO.id].role = "SOCIO";
    loginAs(FACUNDO);
    expect(await isCurrentAdmin()).toBe(false);
  });
  it("ADMIN inactivo o sin 2FA → false", async () => {
    users[FACUNDO.id].twoFactorEnabled = false;
    loginAs(FACUNDO);
    expect(await isCurrentAdmin()).toBe(false);
  });
});

describe("Páginas / sidebar usan el mismo registro", () => {
  it("getEffectivePermissions SOCIO: vistas operativas sí, administrativas no", async () => {
    const set = await getEffectivePermissions(FRANCISCO.id, "SOCIO");
    expect(set.has("posicion:leer")).toBe(true);
    expect(set.has("configuracion:leer")).toBe(false);
    expect(set.has("auditoria:leer")).toBe(false);
    expect(set.has("usuarios:leer")).toBe(false);
  });

  it("getEffectivePermissions aplica overrides canónicos", async () => {
    overrides[FRANCISCO.id] = { "recordatorios:leer": false, "configuracion:leer": true };
    const set = await getEffectivePermissions(FRANCISCO.id, "SOCIO");
    expect(set.has("recordatorios:leer")).toBe(false);
    expect(set.has("configuracion:leer")).toBe(true);
  });

  it("hasPermission ADMIN sin preview → true", async () => {
    loginAs(FACUNDO);
    expect(await hasPermission("usuarios:leer")).toBe(true);
  });
});
