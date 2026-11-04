import { describe, it, expect, vi, beforeEach } from "vitest";

// MACRO 6 — PRE-BETA: smoke de permisos de los 3 usuarios reales de la Beta.
// Guard REAL (permissions.ts + registry + políticas de user-policy.ts) y Server
// Actions REALES invocadas directamente (como haría un POST sin botón en la UI).
// Solo se mockean prisma, la sesión, cookies y Next. No reaudita las 57 claves:
// casos representativos por módulo (Caja, Cambio, CC/PF, Bolsa, Configuración,
// Custodia). Cada DENY verifica además 0 escrituras.

const m = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prisma: {
      user: { findUnique: fn(), update: fn() },
      userPermiso: { findMany: fn() },
      caja: { findMany: fn(), findUnique: fn(), findFirst: fn() },
      movimientoCaja: { findUnique: fn(), findMany: fn(), create: fn(), aggregate: fn() },
      operacionCambio: { create: fn() },
      cuentaCorriente: { findUnique: fn(), update: fn() },
      movimientoCC: { create: fn() },
      plazoFijo: { create: fn() },
      operacionBolsa: { findUnique: fn(), update: fn() },
      config: { upsert: fn() },
      posicionCartera: { findUnique: fn(), delete: fn() },
      $transaction: fn(),
      $queryRaw: fn(),
    },
    auth: vi.fn(),
    writeAuditLog: vi.fn(),
  };
});

vi.mock("@/auth", () => ({ auth: m.auth, signOut: vi.fn(), unstable_update: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/config", () => ({ readOnlyPreview: false, betaMode: false }));
vi.mock("@/lib/services/audit.service", () => ({ writeAuditLog: m.writeAuditLog }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: vi.fn(), delete: vi.fn() }) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("REDIRECT"); }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/services/caja.service", () => ({ calcularSaldoCaja: vi.fn(), calcularSaldoCajaConCliente: vi.fn() }));
vi.mock("@/lib/services/config.service", () => ({
  setTCBlue: vi.fn(), setMesActivo: vi.fn(), setTCMep: vi.fn(), setTcMepDia: vi.fn(), updatePrecioActivo: vi.fn(),
  updatePreciosActivosBatch: vi.fn(), getProductoresConfig: vi.fn(), getAlycConfig: vi.fn(), updateAlycConfig: vi.fn(),
}));
vi.mock("@/lib/locks/withOperationalLocks", () => ({ withOperationalLocks: vi.fn() }));
vi.mock("@/lib/locks/keys", () => ({ assertValidClientId: vi.fn() }));
vi.mock("@/lib/locks/errors", () => ({ InvalidClientIdError: class extends Error {}, LockOwnershipError: class extends Error {} }));
// Módulos reales (sin alias "@/" en vitest): se re-exportan por ruta relativa.
vi.mock("@/lib/auth/permissions", async () => await import("./permissions"));
vi.mock("@/lib/auth/permission-registry", async () => await import("./permission-registry"));
vi.mock("@/lib/auth/user-policy", async () => await import("./user-policy"));
vi.mock("@/lib/parse-monto", async () => await import("../parse-monto"));
vi.mock("@/lib/caja/integridad", async () => await import("../caja/integridad"));
vi.mock("@/lib/caja/integridad.service", async () => await import("../caja/integridad.service"));
vi.mock("@/lib/cc/integridad", async () => await import("../cc/integridad"));
vi.mock("@/lib/cc/integridad.service", async () => await import("../cc/integridad.service"));
vi.mock("@/lib/bolsa/integridad", async () => await import("../bolsa/integridad"));
vi.mock("@/lib/bolsa/integridad.service", async () => await import("../bolsa/integridad.service"));
vi.mock("@/lib/bolsa/ajustes.service", async () => await import("../bolsa/ajustes.service"));
vi.mock("@/lib/custodia/beta", async () => await import("../custodia/beta"));
vi.mock("@/lib/services/precioPromedio.service", () => ({ calcularPrecioPromedio: vi.fn() }));

import { FRANCISCO_POLICY, AUGUSTO_POLICY } from "./user-policy";
import { requireActionPermission, requireCajaPermission } from "./permissions";
import { crearMovimientoCaja, transferirEntreCajas } from "../../app/(dashboard)/caja/actions";
import { crearOperacionCambio } from "../../app/(dashboard)/operativa/mov-diarios/actions";
import { crearMovimientoCC, crearPlazoFijoSimple } from "../../app/(dashboard)/clientes/actions";
import { concertarOperacion, anularOperacion } from "../../app/(dashboard)/bolsa/actions";
import { updateTCBlue } from "../../app/(dashboard)/configuracion/actions";
import { asignarACustodia, eliminarPosicion } from "../../app/(dashboard)/carteras/actions";
import { transferirActivo } from "../../app/(dashboard)/cartera/actions";
import { revertirTransferencia } from "../../app/(dashboard)/transferencias/actions";

type U = { id: string; name: string; role: string; activo: boolean; twoFactorEnabled: boolean };
const FACU = "u-facu", FRANCISCO = "u-fran", AUGUSTO = "u-aug";
const DENIED = "No tenés permisos para realizar esta acción.";
const CUSTODIA = "Las transferencias de activos a Custodia están temporalmente deshabilitadas durante la Beta.";
let users: Record<string, U>;
let overrides: Record<string, Record<string, boolean>>;
const CAJAS = [
  { id: "caja-oficina", slug: "oficina", tipo: "CENTRAL_CONTABLE" },
  { id: "caja-trenque", slug: "nanu_trenque", tipo: "SUCURSAL_OPERATIVA" },
];

const loginAs = (id: string) => m.auth.mockResolvedValue({ user: { id, name: users[id].name, role: users[id].role } });
const fd = (e: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(e)) f.append(k, v); return f; };
const escrituras = () =>
  [m.prisma.movimientoCaja.create, m.prisma.operacionCambio.create, m.prisma.cuentaCorriente.update, m.prisma.movimientoCC.create,
   m.prisma.plazoFijo.create, m.prisma.operacionBolsa.update, m.prisma.config.upsert, m.prisma.posicionCartera.delete, m.prisma.$transaction]
    .some((f) => f.mock.calls.length > 0);

beforeEach(() => {
  vi.clearAllMocks();
  users = {
    [FACU]:      { id: FACU,      name: "Facu",      role: "ADMIN", activo: true, twoFactorEnabled: true },
    [FRANCISCO]: { id: FRANCISCO, name: "Francisco", role: "SOCIO", activo: true, twoFactorEnabled: true },
    [AUGUSTO]:   { id: AUGUSTO,   name: "Augusto",   role: "SOCIO", activo: true, twoFactorEnabled: true },
  };
  overrides = { [FRANCISCO]: { ...(FRANCISCO_POLICY as Record<string, boolean>) }, [AUGUSTO]: { ...(AUGUSTO_POLICY as Record<string, boolean>) } };
  m.prisma.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => users[where.id] ?? null);
  m.prisma.userPermiso.findMany.mockImplementation(
    async ({ where }: { where: { userId: string; OR?: { Permiso: { modulo: string; accion: string } }[] } }) => {
      const pedidas = where.OR?.map((o) => `${o.Permiso.modulo}:${o.Permiso.accion}`);
      return Object.entries(overrides[where.userId] ?? {})
        .filter(([k]) => !pedidas || pedidas.includes(k))
        .map(([k, concedido]) => { const [modulo, accion] = k.split(":"); return { concedido, temporal: false, fechaExpiracion: null, Permiso: { modulo, accion } }; });
    });
  m.prisma.caja.findMany.mockImplementation(async (a?: { where?: { id?: { in: string[] } } }) =>
    a?.where?.id?.in ? CAJAS.filter((c) => a.where!.id!.in.includes(c.id)) : CAJAS);
  m.prisma.caja.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => CAJAS.find((c) => c.id === where.id) ?? null);
  m.prisma.$transaction.mockRejectedValue(new Error("TX_ALCANZADA")); // un permitido llega a la tx (y se corta acá)
});

// ── Matriz por guard (lo mismo que ejecuta cada Server Action antes de escribir) ──
const MATRIZ: [string, string, boolean, boolean, boolean][] = [
  //  módulo         clave                    FACU  FRANCISCO AUGUSTO
  ["Caja",          "caja:operar_oficina",    true, false,    false],
  ["Caja",          "caja:operar_trenque",    true, false,    true],
  ["Caja",          "caja:transferir",        true, false,    false],
  ["Cambio",        "cambio:operar",          true, false,    true],
  ["CC",            "cc:crear_movimiento",    true, false,    true],
  ["CC",            "cc:intereses",           true, false,    true],
  ["PF",            "pf:crear",               true, false,    true],
  ["Bolsa",         "bolsa:crear",            true, true,     true],
  ["Bolsa",         "bolsa:concertar",        true, true,     false],
  ["Bolsa",         "bolsa:anular",           true, true,     false],
  ["Configuración", "configuracion:editar",   true, false,    false],
  ["Configuración", "usuarios:administrar",   true, false,    false],
];

describe("MACRO 6 — permisos Beta: matriz representativa por módulo", () => {
  it.each(MATRIZ)("%s · %s → Facu %s / Francisco %s / Augusto %s", async (_mod, clave, facu, fran, aug) => {
    for (const [who, esperado] of [[FACU, facu], [FRANCISCO, fran], [AUGUSTO, aug]] as const) {
      loginAs(who);
      const r = await requireActionPermission(clave);
      expect(r === null, `${users[who].name} ${clave}`).toBe(esperado);
    }
  });

  it("scope de caja: Augusto opera Trenque pero no Oficina; Francisco ninguna; Facu ambas", async () => {
    loginAs(AUGUSTO);
    expect(await requireCajaPermission(["caja-trenque"])).toBeNull();
    expect(await requireCajaPermission(["caja-oficina"])).toEqual({ error: DENIED });
    expect(await requireCajaPermission(["caja-oficina", "caja-trenque"])).toEqual({ error: DENIED });
    loginAs(FRANCISCO);
    expect(await requireCajaPermission(["caja-trenque"])).toEqual({ error: DENIED });
    loginAs(FACU);
    expect(await requireCajaPermission(["caja-oficina", "caja-trenque"])).toBeNull();
  });
});

// ── Server Action directa (sin UI): lo prohibido falla con 0 escrituras ─────────
describe("MACRO 6 — Server Actions directas prohibidas → DENY con 0 escrituras", () => {
  const casos: [string, string, () => Promise<unknown>][] = [
    ["Caja: Augusto crea movimiento en Oficina", AUGUSTO, () => crearMovimientoCaja(null, fd({ cajaId: "caja-oficina", tipo: "ENTRADA", monto: "100", moneda: "USD" }))],
    ["Caja: Francisco crea movimiento en Trenque", FRANCISCO, () => crearMovimientoCaja(null, fd({ cajaId: "caja-trenque", tipo: "ENTRADA", monto: "100", moneda: "USD" }))],
    ["Caja: Augusto transfiere Oficina → Trenque", AUGUSTO, () => transferirEntreCajas(null, fd({ origenId: "caja-oficina", destinoId: "caja-trenque", monto: "10", moneda: "USD" }))],
    ["Cambio: Francisco crea operación", FRANCISCO, () => crearOperacionCambio({}, fd({ fecha: "2026-11-03", tipoOp: "COMPRA", moneda: "USD", cantidad: "100", tipoCambio: "1000", estado: "NO_LIQUIDADA" }))],
    ["CC: Francisco crea movimiento CC", FRANCISCO, () => crearMovimientoCC(null, fd({ cuentaId: "cc-1", tipo: "INGRESO", monto: "100" }))],
    ["PF: Francisco crea plazo fijo", FRANCISCO, () => crearPlazoFijoSimple(null, fd({ clienteId: "cl-1", capital: "100", moneda: "USD" }))],
    ["Bolsa: Augusto concerta", AUGUSTO, () => concertarOperacion(null, fd({ id: "op-1" }))],
    ["Bolsa: Augusto anula", AUGUSTO, () => anularOperacion(null, fd({ id: "op-1", motivo: "x" }))],
    ["Bolsa: Augusto baja una posición (bolsa:anular)", AUGUSTO, () => eliminarPosicion(null, fd({ posicionId: "pos-1", confirmarAjuste: "on" }))],
    ["Configuración: Francisco cambia TC blue", FRANCISCO, () => updateTCBlue({}, fd({ valor: "1200" }))],
    ["Configuración: Augusto cambia TC blue", AUGUSTO, () => updateTCBlue({}, fd({ valor: "1200" }))],
  ];
  it.each(casos)("%s", async (_n, who, call) => {
    loginAs(who);
    const r = (await call()) as { error?: string };
    expect(r?.error).toBe(DENIED); // rechazo del guard, no de una validación posterior
    expect(escrituras()).toBe(false);
  });
});

describe("MACRO 6 — permitidos llegan a la transacción (Server Action real)", () => {
  it("Augusto crea movimiento en Trenque → pasa el guard y llega a escribir", async () => {
    loginAs(AUGUSTO);
    m.prisma.movimientoCaja.create.mockResolvedValue({});
    const r = (await crearMovimientoCaja(null, fd({ cajaId: "caja-trenque", tipo: "ENTRADA", monto: "100", moneda: "USD", slug: "nanu_trenque" }))) as { error?: string };
    expect(r?.error).not.toBe(DENIED);
    expect(m.prisma.movimientoCaja.create.mock.calls.length + m.prisma.$transaction.mock.calls.length).toBeGreaterThan(0);
  });

  it("Facu crea movimiento en Oficina → pasa el guard y llega a escribir", async () => {
    loginAs(FACU);
    m.prisma.movimientoCaja.create.mockResolvedValue({});
    const r = (await crearMovimientoCaja(null, fd({ cajaId: "caja-oficina", tipo: "ENTRADA", monto: "100", moneda: "USD", slug: "oficina" }))) as { error?: string };
    expect(r?.error).not.toBe(DENIED);
    expect(m.prisma.movimientoCaja.create.mock.calls.length + m.prisma.$transaction.mock.calls.length).toBeGreaterThan(0);
  });

  it("Francisco concerta en Bolsa → pasa el guard y llega a la transacción", async () => {
    loginAs(FRANCISCO);
    const r = (await concertarOperacion(null, fd({ id: "op-1" }))) as { error?: string };
    expect(r?.error).not.toBe(DENIED);
  });
});

describe("MACRO 6 — Custodia fuera de la Beta: DENY para los 3 (incluido Facu), 0 escrituras", () => {
  const acciones: [string, () => Promise<unknown>][] = [
    ["asignarACustodia", () => asignarACustodia(null, fd({ posicionId: "p", clienteId: "c", cantidad: "1" }))],
    ["transferirActivo", () => transferirActivo(null, fd({ posicionId: "p", clienteId: "c", cantidad: "1" }))],
    ["revertirTransferencia", () => revertirTransferencia(null, fd({ logId: "l" }))],
  ];
  it.each(acciones)("%s", async (_n, call) => {
    for (const who of [FACU, FRANCISCO, AUGUSTO]) {
      loginAs(who);
      expect(await call()).toEqual({ error: CUSTODIA });
    }
    expect(escrituras()).toBe(false);
  });
});
