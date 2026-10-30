import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  ACTION_KEYS,
  EXPLICIT_ALTERNATIVE_KEYS,
  LEGACY_REVOCATION_BRIDGE,
  PERMISSIONS,
  REQUIERE_OFICINA_SI_IMPLICITO,
  TRANSITION_MONOTONIC_KEYS,
  effectivePermission,
  explicitGrant,
  getPermissionDef,
  type OverrideRow,
} from "./permission-registry";
import { AUGUSTO_POLICY, FRANCISCO_POLICY, SOLO_LECTURA_POLICY, type UserPolicy } from "./user-policy";

// MACRO 1 · R4 — Monotonicidad FORMAL de la transición, a nivel ACCIÓN.
//
//   A = código viejo (b49aa4d) + DB vieja      B = código nuevo + DB vieja
//   C = código nuevo + DB migrada               D = código viejo + DB migrada
//
// Se prueba, para TODA combinación de overrides admitida por
// PRECHECK TRANSITION MONOTONICITY (01_precheck.sql bloque 8):
//   B ⊆ A  ·  C ⊆ B  ·  D ⊆ A
// sobre cada Server Action cuya autorización cambió entre A y B, en cada
// contexto de caja (Oficina / Trenque / mixto / sin caja).
//
// - A: modelo del guard viejo, reconstruido de `git show b49aa4d:<archivo>`
//   (tabla OLD abajo, congelada: es historia).
// - B: resolución REAL (effectivePermission / explicitGrant) + los guards de
//   cada acción; la tabla NEW se valida contra el código fuente actual
//   (test "drift"), así no puede divergir de lo que realmente se exige.
// - C: espejo TS de 02_migrate.sql (materialización por estado efectivo).

// ── Modelo A (código viejo) ─────────────────────────────────────────────────
const OLD_EMPLEADO_ALLOWED = new Set([
  "holdings:comprar", "holdings:vender", "holdings:editar", "saldos:editar", "caja:operar_trenque",
  "operativa:crear", "cc:crear_movimiento", "clientes:crear", "pf:crear",
]);

/** requireActionPermission viejo: ADMIN; override EXACTO (legacy ignorado); SOCIO todo; EMPLEADO lista. */
function oldPerm(role: string, key: string, rows: readonly OverrideRow[]): boolean {
  if (role === "ADMIN") return true;
  const ov = rows.find((r) => r.clave === key);
  if (ov) return ov.concedido;
  if (role === "SOCIO") return true;
  if (role === "EMPLEADO") return OLD_EMPLEADO_ALLOWED.has(key);
  return false;
}

// ── Contextos ───────────────────────────────────────────────────────────────
type Scope = "O" | "T";
interface Ctx { role: string; a: (k: string) => boolean; b: (k: string) => boolean; bExplicit: (k: string) => boolean }

const scopeKey = (s: Scope) => (s === "O" ? "caja:operar_oficina" : "caja:operar_trenque");
const oldCaja = (c: Ctx, s: Scope) => c.a(scopeKey(s));          // viejo: slug trenque ? trenque : oficina
const newScope = (c: Ctx, cajas: Scope[]) => cajas.every((s) => c.b(scopeKey(s)));
const oldNoTrenque = (c: Ctx, cajas: Scope[]) => !cajas.some((s) => s === "O") || c.a("caja:operar_oficina");

const CAJAS_1: Scope[][] = [["O"], ["T"]];
const CAJAS_2: Scope[][] = [["O", "O"], ["O", "T"], ["T", "O"], ["T", "T"]];
const CAJAS_0_2: Scope[][] = [[], ["O"], ["T"], ["O", "T"]];

interface ActionSpec {
  name: string;
  file: string;
  fn: string;
  /** claves literales que la acción nueva pasa a requireActionPermission */
  newKeys: string[];
  newScope: boolean;
  contexts: Scope[][];
  A: (c: Ctx, cajas: Scope[]) => boolean;
  B: (c: Ctx, cajas: Scope[]) => boolean;
}

const CAJA = "src/app/(dashboard)/caja/actions.ts";
const MOV = "src/app/(dashboard)/operativa/mov-diarios/actions.ts";
const CLI = "src/app/(dashboard)/clientes/actions.ts";
const COM = "src/app/(dashboard)/comisiones/actions.ts";

const ACTIONS: ActionSpec[] = [
  { name: "crearMovimientoCaja", file: CAJA, fn: "crearMovimientoCaja", newKeys: [], newScope: true, contexts: CAJAS_1,
    A: (c, [s]) => oldCaja(c, s), B: (c, k) => newScope(c, k) },
  { name: "cubrirParcial (original, pago)", file: CAJA, fn: "cubrirParcialMovimientoCaja", newKeys: [], newScope: true, contexts: CAJAS_2,
    A: (c, [, pago]) => oldCaja(c, pago), B: (c, k) => newScope(c, k) },
  { name: "anularPendiente", file: CAJA, fn: "anularMovimientoCajaPendiente", newKeys: ["caja:eliminar_movimiento"], newScope: true, contexts: CAJAS_1,
    A: (c) => c.a("caja:eliminar_movimiento"), B: (c, k) => c.b("caja:eliminar_movimiento") && newScope(c, k) },
  { name: "transferirEntreCajas", file: CAJA, fn: "transferirEntreCajas", newKeys: ["caja:transferir"], newScope: true, contexts: CAJAS_2,
    A: (c) => c.a("caja:transferir"), B: (c, k) => c.b("caja:transferir") && newScope(c, k) },
  { name: "registrarOperacionCambioEnCajas", file: CAJA, fn: "registrarOperacionCambioEnCajas", newKeys: ["cambio:operar"], newScope: true, contexts: CAJAS_2,
    A: (c) => c.a("caja:operar_oficina"), B: (c, k) => c.b("cambio:operar") && newScope(c, k) },
  { name: "revertirMovimientoCaja", file: CAJA, fn: "revertirMovimientoCaja", newKeys: ["caja:eliminar_movimiento"], newScope: true, contexts: CAJAS_1,
    A: (c) => c.a("caja:eliminar_movimiento"), B: (c, k) => c.b("caja:eliminar_movimiento") && newScope(c, k) },
  { name: "confirmarMovimientoCajaPendiente", file: CAJA, fn: "confirmarMovimientoCajaPendiente", newKeys: ["caja:operar_oficina"], newScope: true, contexts: CAJAS_1,
    A: (c) => c.a("caja:operar_oficina"),
    B: (c, k) => newScope(c, k) && (c.b("caja:operar_oficina") || c.bExplicit("caja:operar_trenque")) },
  { name: "transferirCajaACartera", file: CAJA, fn: "transferirCajaACartera", newKeys: ["caja:transferir"], newScope: true, contexts: CAJAS_1,
    A: (c) => c.a("caja:transferir"), B: (c, k) => c.b("caja:transferir") && newScope(c, k) },
  { name: "transferirCarteraACaja", file: CAJA, fn: "transferirCarteraACaja", newKeys: ["caja:transferir"], newScope: true, contexts: CAJAS_1,
    A: (c) => c.a("caja:transferir"), B: (c, k) => c.b("caja:transferir") && newScope(c, k) },

  { name: "crearMovimientoDiario (no transferencia)", file: MOV, fn: "crearMovimientoDiario", newKeys: ["operativa:crear", "caja:transferir"], newScope: true, contexts: CAJAS_1,
    A: (c, k) => c.a("operativa:crear") && oldNoTrenque(c, k), B: (c, k) => c.b("operativa:crear") && newScope(c, k) },
  { name: "crearMovimientoDiario (transferencia)", file: MOV, fn: "crearMovimientoDiario", newKeys: ["operativa:crear", "caja:transferir"], newScope: true, contexts: CAJAS_2,
    A: (c, k) => c.a("operativa:crear") && c.a("caja:transferir") && oldNoTrenque(c, k),
    B: (c, k) => c.b("operativa:crear") && c.b("caja:transferir") && newScope(c, k) },
  { name: "crearOperacionCambio (NO_LIQUIDADA/LIQUIDADA/PARCIAL)", file: MOV, fn: "crearOperacionCambio", newKeys: ["cambio:operar"], newScope: true, contexts: CAJAS_0_2,
    A: (c) => c.a("caja:operar_oficina"), B: (c, k) => c.b("cambio:operar") && newScope(c, k) },
  { name: "eliminarMovimientoCaja", file: MOV, fn: "eliminarMovimientoCaja", newKeys: ["caja:eliminar_movimiento"], newScope: true, contexts: CAJAS_1,
    A: (c) => c.a("caja:eliminar_movimiento"), B: (c, k) => c.b("caja:eliminar_movimiento") && newScope(c, k) },
  { name: "editarFechaMovimientoCaja", file: MOV, fn: "editarFechaMovimientoCaja", newKeys: ["caja:editar_movimiento"], newScope: true, contexts: CAJAS_1,
    A: (c, k) => c.a("caja:editar_movimiento") && oldNoTrenque(c, k), B: (c, k) => c.b("caja:editar_movimiento") && newScope(c, k) },
  { name: "editarMovimientoCajaCompleto", file: MOV, fn: "editarMovimientoCajaCompleto", newKeys: ["caja:editar_movimiento"], newScope: true, contexts: CAJAS_1,
    A: (c, k) => c.a("caja:editar_movimiento") && oldNoTrenque(c, k), B: (c, k) => c.b("caja:editar_movimiento") && newScope(c, k) },
  { name: "editarOperacionCambio (cobrada → Oficina / no)", file: MOV, fn: "editarOperacionCambio", newKeys: ["cambio:operar"], newScope: true, contexts: [[], ["O"]],
    A: (c) => c.a("caja:operar_oficina"), B: (c, k) => c.b("cambio:operar") && newScope(c, k) },
  { name: "relocalizarMovimientosIniciales", file: MOV, fn: "relocalizarMovimientosIniciales", newKeys: ["sistema:admin"], newScope: false, contexts: [[]],
    A: (c) => c.a("configuracion:editar"), B: (c) => c.b("sistema:admin") },
  { name: "cancelarOperacionCambioPendiente", file: MOV, fn: "cancelarOperacionCambioPendiente", newKeys: ["cambio:operar", "caja:eliminar_movimiento"], newScope: false, contexts: [[]],
    A: (c) => c.a("caja:eliminar_movimiento"), B: (c) => c.b("cambio:operar") && c.b("caja:eliminar_movimiento") },
  { name: "cobrarOperacionCambio", file: MOV, fn: "cobrarOperacionCambio", newKeys: ["cambio:operar"], newScope: true, contexts: [["O"]],
    A: (c) => c.a("caja:operar_oficina"), B: (c, k) => c.b("cambio:operar") && newScope(c, k) },
  { name: "liquidarPagoPendiente", file: MOV, fn: "liquidarPagoPendiente", newKeys: ["cambio:operar"], newScope: true, contexts: CAJAS_0_2,
    A: (c) => c.a("caja:operar_oficina"), B: (c, k) => c.b("cambio:operar") && newScope(c, k) },
  { name: "revertirOperacionCambio", file: MOV, fn: "revertirOperacionCambio", newKeys: ["cambio:operar"], newScope: true, contexts: CAJAS_0_2,
    A: (c) => c.a("caja:operar_oficina"), B: (c, k) => c.b("cambio:operar") && newScope(c, k) },

  { name: "crearMovimientoCC (impacta caja / no)", file: CLI, fn: "crearMovimientoCC", newKeys: ["cc:crear_movimiento"], newScope: true, contexts: [[], ["O"], ["T"]],
    A: (c) => c.a("cc:crear_movimiento"), B: (c, k) => c.b("cc:crear_movimiento") && newScope(c, k) },
  { name: "reconciliarSaldoCC", file: CLI, fn: "reconciliarSaldoCC", newKeys: ["cc:reconciliar"], newScope: false, contexts: [[]],
    A: (c) => c.a("saldos:editar"), B: (c) => c.b("cc:reconciliar") },

  { name: "crearProductor", file: COM, fn: "crearProductor", newKeys: ["sistema:admin"], newScope: false, contexts: [[]],
    A: (c) => c.role === "ADMIN", B: (c) => c.b("sistema:admin") },
  { name: "actualizarProductor", file: COM, fn: "actualizarProductor", newKeys: ["sistema:admin"], newScope: false, contexts: [[]],
    A: (c) => c.role === "ADMIN", B: (c) => c.b("sistema:admin") },
  // b49aa4d: PENDIENTE/REVISADO → ADMIN o SOCIO; PAGADO → solo ADMIN.
  { name: "marcarEstadoComision (PENDIENTE/REVISADO)", file: COM, fn: "marcarEstadoComision", newKeys: ["comisiones:gestionar", "sistema:admin"], newScope: false, contexts: [[]],
    A: (c) => c.role === "ADMIN" || c.role === "SOCIO", B: (c) => c.b("comisiones:gestionar") },
  { name: "marcarEstadoComision (PAGADO)", file: COM, fn: "marcarEstadoComision", newKeys: ["comisiones:gestionar", "sistema:admin"], newScope: false, contexts: [[]],
    A: (c) => c.role === "ADMIN", B: (c) => c.b("comisiones:gestionar") && c.b("sistema:admin") },
  { name: "asignarProductor", file: COM, fn: "asignarProductor", newKeys: ["comisiones:gestionar"], newScope: false, contexts: [[]],
    A: (c) => c.role === "ADMIN" || c.role === "SOCIO", B: (c) => c.b("comisiones:gestionar") },
];

// ── Espacio de overrides admitido por el precheck ───────────────────────────
// Claves que intervienen en las acciones de arriba. Las de MONOTONIC (bloque 8)
// solo admiten {ausente, false}; el resto {ausente, true, false}. Temporales y
// claves no canónicas fuera del puente: excluidas por el precheck.
const MONOTONIC = TRANSITION_MONOTONIC_KEYS as readonly string[];
const FREE = ["caja:operar_oficina", "caja:editar_movimiento", "caja:eliminar_movimiento", "caja:transferir", "operativa:crear"];
const RESTRICTED = ["caja:operar_trenque", "cambio:operar"];
const LEGACY_CAJA = ["caja:crear", "caja:editar", "caja:eliminar", "caja:escribir"];
const LEGACY_MOV = ["mov_diarios:crear", "mov_diarios:editar", "mov_diarios:eliminar", "mov_diarios:escribir"];

const row = (clave: string, concedido: boolean): OverrideRow => ({ clave, concedido, temporal: false, fechaExpiracion: null });

function* combos(): Generator<OverrideRow[]> {
  const freeOpts: (boolean | null)[] = [null, true, false];
  const restrOpts: (boolean | null)[] = [null, false];
  const legacyOpts = (keys: string[]): OverrideRow[][] => [[], ...keys.map((k) => [row(k, false)]), [row(keys[3], true)]];
  const sizes = [...FREE.map(() => 3), ...RESTRICTED.map(() => 2)];
  const total = sizes.reduce((a, b) => a * b, 1);
  for (let i = 0; i < total; i++) {
    let x = i;
    const base: OverrideRow[] = [];
    FREE.forEach((k) => { const v = freeOpts[x % 3]; x = Math.floor(x / 3); if (v !== null) base.push(row(k, v)); });
    RESTRICTED.forEach((k) => { const v = restrOpts[x % 2]; x = Math.floor(x / 2); if (v !== null) base.push(row(k, v)); });
    for (const lc of legacyOpts(LEGACY_CAJA)) for (const lm of legacyOpts(LEGACY_MOV)) yield [...base, ...lc, ...lm];
  }
}

const ALL_COMBOS: OverrideRow[][] = Array.from(combos());

const ROLES = ["SOCIO", "EMPLEADO", "CLIENTE", "ADMIN"];

function ctxFor(role: string, rows: OverrideRow[], oldRows: OverrideRow[] = rows): Ctx {
  const memo = new Map<string, boolean>();
  return {
    role,
    a: (k) => oldPerm(role, k, oldRows),
    b: (k) => { if (!memo.has(k)) memo.set(k, effectivePermission(role, k, rows)); return memo.get(k)!; },
    bExplicit: (k) => role !== "ADMIN" && explicitGrant(k, rows),
  };
}

function firstViolation(check: (role: string, rows: OverrideRow[]) => string | null): string | null {
  for (const rows of ALL_COMBOS) {
    for (const role of ROLES) {
      const v = check(role, rows);
      if (v) return `${role} ${JSON.stringify(rows.map((r) => `${r.clave}=${r.concedido}`))}: ${v}`;
    }
  }
  return null;
}

// ── Espejo TS de 02_migrate.sql (SOCIO target) ──────────────────────────────
const BRIDGE_CANON = Array.from(new Set(Object.values(LEGACY_REVOCATION_BRIDGE).flat())) as string[];
const LEGACY_KEYS = Object.keys(LEGACY_REVOCATION_BRIDGE);

function migrar(pre: OverrideRow[], policy: UserPolicy): OverrideRow[] {
  const M = new Set<string>([...Object.keys(policy), ...BRIDGE_CANON, ...REQUIERE_OFICINA_SI_IMPLICITO]);
  const post = pre.filter((r) => !LEGACY_KEYS.includes(r.clave));
  for (const k of Array.from(M)) {
    const bEff = effectivePermission("SOCIO", k, pre);
    const pol = (policy as Record<string, boolean | undefined>)[k];
    const objetivo = bEff && (pol ?? true);
    const explicitoOk = !(EXPLICIT_ALTERNATIVE_KEYS as readonly string[]).includes(k)
      || effectivePermission("SOCIO", "caja:operar_oficina", pre) || (bEff && explicitGrant(k, pre));
    const materializar = (pol !== undefined || (REQUIERE_OFICINA_SI_IMPLICITO as readonly string[]).includes(k) || !objetivo)
      && (!objetivo || explicitoOk);
    if (!materializar) continue;
    const i = post.findIndex((r) => r.clave === k);
    if (i >= 0) post[i] = { ...post[i], concedido: objetivo };
    else post.push(row(k, objetivo));
  }
  return post;
}

const POLICIES: [string, UserPolicy][] = [
  ["FRANCISCO", FRANCISCO_POLICY], ["AUGUSTO", AUGUSTO_POLICY], ["SOLO_LECTURA", SOLO_LECTURA_POLICY], ["vacía", {}],
];

// ── Tests ───────────────────────────────────────────────────────────────────
describe("R4 — tabla NEW = código fuente actual (drift)", () => {
  const root = path.resolve(__dirname, "../../..");
  const body = (file: string, fn: string) => {
    const src = fs.readFileSync(path.join(root, file), "utf8");
    const a = src.indexOf(`export async function ${fn}(`);
    expect(a, `${file}#${fn}`).toBeGreaterThanOrEqual(0);
    const b = src.indexOf("\nexport ", a + 1);
    return src.slice(a, b < 0 ? undefined : b);
  };

  it.each(ACTIONS.map((x) => [x.name, x] as const))("%s", (_n, spec) => {
    const src = body(spec.file, spec.fn);
    const keys = Array.from(src.matchAll(/requireActionPermission\(\s*"([a-z_]+:[a-z_]+)"/g)).map((m) => m[1]);
    expect(Array.from(new Set(keys)).sort()).toEqual([...spec.newKeys].sort());
    expect(/requireCajaPermission\(/.test(src)).toBe(spec.newScope);
  });

  it("confirmar: la alternativa explícita es caja:operar_trenque", () => {
    expect(body(CAJA, "confirmarMovimientoCajaPendiente")).toMatch(/requireActionPermission\("caja:operar_oficina", \{ orExplicitGrant: "caja:operar_trenque" \}\)/);
  });

  it("toda alternativa orExplicitGrant del código está en EXPLICIT_ALTERNATIVE_KEYS", () => {
    const dir = path.join(root, "src");
    const found = new Set<string>();
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) {
          for (const m of Array.from(fs.readFileSync(p, "utf8").matchAll(/orExplicitGrant:\s*"([a-z_]+:[a-z_]+)"/g))) found.add(m[1]);
        }
      }
    };
    walk(dir);
    expect(Array.from(found).sort()).toEqual([...EXPLICIT_ALTERNATIVE_KEYS].sort());
  });
});

describe("R4 — B ⊆ A en TODAS las combinaciones admitidas", () => {
  it(`acción × contexto de caja × rol × overrides (${ACTIONS.length} acciones)`, () => {
    const v = firstViolation((role, rows) => {
      const c = ctxFor(role, rows);
      for (const s of ACTIONS) for (const k of s.contexts) if (s.B(c, k) && !s.A(c, k)) return `${s.name} ${k.join("+")}`;
      return null;
    });
    expect(v).toBeNull();
  });

  it("acciones con la MISMA clave en A y B: cada clave de acción, cada rol, {ausente,true,false} (+ legacy)", () => {
    for (const key of ACTION_KEYS) {
      const opciones: OverrideRow[][] = [[], [row(key, false)], ...(MONOTONIC.includes(key) ? [] : [[row(key, true)]])];
      for (const o of opciones) for (const extra of [[], ...LEGACY_CAJA.concat(LEGACY_MOV).map((l) => [row(l, false)]), [row("caja:operar_oficina", false)]]) {
        const rows = [...o, ...extra];
        for (const role of ROLES) {
          if (effectivePermission(role, key, rows) && !oldPerm(role, key, rows)) {
            throw new Error(`B ⊄ A: ${role} ${key} ${JSON.stringify(rows)}`);
          }
        }
      }
    }
  });

  it("la exploración es exhaustiva sobre lo declarado (tamaño del espacio)", () => {
    const n = ALL_COMBOS.length;
    expect(n).toBe(3 ** FREE.length * 2 ** RESTRICTED.length * 6 * 6);
  });
});

describe("R4 — C ⊆ B y D ⊆ A (espejo de la migración, por política)", () => {
  it.each(POLICIES)("política %s: para toda combinación SOCIO, toda acción y toda clave", (_n, policy) => {
    for (const pre of ALL_COMBOS) {
      const post = migrar(pre, policy);
      const b = ctxFor("SOCIO", pre);
      const c = ctxFor("SOCIO", post);
      const d = ctxFor("SOCIO", post, post);
      const aCtx = ctxFor("SOCIO", pre);
      for (const s of ACTIONS) for (const k of s.contexts) {
        if (s.B(c, k) && !s.B(b, k)) throw new Error(`C ⊄ B: ${s.name} ${k} ${JSON.stringify(pre)}`);
        if (s.A(d, k) && !s.A(aCtx, k)) throw new Error(`D ⊄ A: ${s.name} ${k} ${JSON.stringify(pre)}`);
      }
      for (const p of PERMISSIONS) {
        if (effectivePermission("SOCIO", p.key, post) && !effectivePermission("SOCIO", p.key, pre)) {
          throw new Error(`C ⊄ B clave ${p.key} ${JSON.stringify(pre)}`);
        }
      }
      // sin legacy después de migrar; política respetada como techo
      expect(post.some((r) => LEGACY_KEYS.includes(r.clave))).toBe(false);
      for (const [k, v] of Object.entries(policy)) if (v === false) expect(effectivePermission("SOCIO", k, post)).toBe(false);
    }
  });

  it("datos reales (sin legacy en Augusto, legacy de caja+mov en Francisco): C = política exacta", () => {
    const francisco = [...LEGACY_CAJA, ...LEGACY_MOV].map((k) => row(k, false));
    const postF = migrar(francisco, FRANCISCO_POLICY);
    for (const [k, v] of Object.entries(FRANCISCO_POLICY)) expect(effectivePermission("SOCIO", k, postF), k).toBe(v);
    const postA = migrar([], AUGUSTO_POLICY);
    for (const [k, v] of Object.entries(AUGUSTO_POLICY)) expect(effectivePermission("SOCIO", k, postA), k).toBe(v);
  });
});

describe("R4 — casos de Codex R3 explícitos", () => {
  it("R3-F01: SOCIO con caja:operar_oficina=false, sin revocar cambio/mov_diarios → crearOperacionCambio NO_LIQUIDADA: A deny, B deny", () => {
    const rows = [row("caja:operar_oficina", false)];
    const spec = ACTIONS.find((a) => a.fn === "crearOperacionCambio")!;
    expect(spec.A(ctxFor("SOCIO", rows), [])).toBe(false);
    expect(spec.B(ctxFor("SOCIO", rows), [])).toBe(false);
  });

  it("R3-F02: legacy caja:escribir=false → C no recupera operar_trenque/editar/eliminar (B ni C)", () => {
    const pre = [row("caja:escribir", false)];
    for (const [, policy] of POLICIES) {
      const post = migrar(pre, policy);
      for (const k of ["caja:operar_oficina", "caja:operar_trenque", "caja:editar_movimiento", "caja:eliminar_movimiento", "caja:transferir", "cambio:operar"]) {
        expect(effectivePermission("SOCIO", k, pre), `B ${k}`).toBe(false);
        expect(effectivePermission("SOCIO", k, post), `C ${k}`).toBe(false);
      }
    }
  });

  it("hallazgo R4: oficina=false previa + política Trenque=true → NO se materializa grant explícito de Trenque", () => {
    const pre = [row("caja:operar_oficina", false)];
    const post = migrar(pre, AUGUSTO_POLICY);
    expect(post.find((r) => r.clave === "caja:operar_trenque")).toBeUndefined();
    const confirmar = ACTIONS.find((a) => a.fn === "confirmarMovimientoCajaPendiente")!;
    expect(confirmar.B(ctxFor("SOCIO", pre), ["T"])).toBe(false);
    expect(confirmar.B(ctxFor("SOCIO", post), ["T"])).toBe(false);
  });

  it("R3-F02 con la política de Augusto (trenque/cambio=true): PRE=false gana sobre política=true", () => {
    const post = migrar([row("caja:escribir", false)], AUGUSTO_POLICY);
    expect(post.find((r) => r.clave === "caja:operar_trenque")?.concedido).toBe(false);
    expect(post.find((r) => r.clave === "cambio:operar")?.concedido).toBe(false);
  });
});

describe("R4 — marcarEstadoComision: diferencia histórica PAGADO vs PENDIENTE/REVISADO", () => {
  const pend = ACTIONS.find((a) => a.name === "marcarEstadoComision (PENDIENTE/REVISADO)")!;
  const pagado = ACTIONS.find((a) => a.name === "marcarEstadoComision (PAGADO)")!;

  it("A (b49aa4d): SOCIO puede PENDIENTE/REVISADO pero no PAGADO; ADMIN ambos", () => {
    expect(pend.A(ctxFor("SOCIO", []), [])).toBe(true);
    expect(pagado.A(ctxFor("SOCIO", []), [])).toBe(false);
    expect(pagado.A(ctxFor("ADMIN", []), [])).toBe(true);
  });

  it("B: SOCIO PAGADO denegado aun con override sistema:admin=true (adminOnly)", () => {
    expect(pagado.B(ctxFor("SOCIO", [row("sistema:admin", true)]), [])).toBe(false);
    expect(pagado.B(ctxFor("ADMIN", []), [])).toBe(true);
  });

  it("el código actual exige sistema:admin solo para PAGADO", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../../..", COM), "utf8");
    expect(src).toMatch(/estado === "PAGADO"[\s\S]{0,200}requireActionPermission\("sistema:admin"\)/);
  });
});

describe("R4 — invariantes del registro usados por la prueba", () => {
  it("RESTRICTED (explorado solo {ausente,false}) ⊆ MONOTONIC", () => {
    for (const k of RESTRICTED) expect(MONOTONIC).toContain(k);
  });

  it("toda clave MONOTONIC existe en el registro", () => {
    for (const k of MONOTONIC) expect(getPermissionDef(k), k).toBeTruthy();
  });

  it("EMPLEADO: Trenque por default sigue disponible (la implicación no toca a Trenque)", () => {
    expect(effectivePermission("EMPLEADO", "caja:operar_trenque", [])).toBe(true);
    expect(effectivePermission("EMPLEADO", "cambio:operar", [])).toBe(false);
  });

  it("implicación: solo aplica sin override canónico propio; legacy de la clave gana siempre", () => {
    expect(effectivePermission("SOCIO", "cambio:operar", [row("caja:operar_oficina", false)])).toBe(false);
    expect(effectivePermission("SOCIO", "cambio:operar", [row("caja:operar_oficina", false), row("cambio:operar", true)])).toBe(true);
    expect(effectivePermission("SOCIO", "cambio:operar", [row("caja:escribir", false)])).toBe(false);
    expect(effectivePermission("SOCIO", "cambio:operar", [row("cambio:operar", true), row("mov_diarios:crear", false)])).toBe(false);
    expect(effectivePermission("ADMIN", "cambio:operar", [row("caja:operar_oficina", false)])).toBe(true);
  });
});
