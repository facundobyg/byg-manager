import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  OVERRIDABLE_KEYS, isPermissionKey, LEGACY_REVOCATION_BRIDGE, PERMISSIONS, REQUIERE_OFICINA_SI_IMPLICITO,
  EXPLICIT_ALTERNATIVE_KEYS, TRANSITION_MONOTONIC_KEYS,
} from "./permission-registry";
import { FRANCISCO_POLICY, AUGUSTO_POLICY, type UserPolicy } from "./user-policy";

// La migración SQL de overrides (prisma/data-migrations/20261029_macro1_permisos)
// debe aplicar EXACTAMENTE la política de user-policy.ts, conocer EXACTAMENTE las
// claves otorgables del registro y no contener operaciones masivas peligrosas.

const DIR = path.resolve(__dirname, "../../../prisma/data-migrations/20261029_macro1_permisos");
const read = (f: string) => fs.readFileSync(path.join(DIR, f), "utf8");
const block = (sql: string, name: string) => {
  const a = sql.indexOf(`-- ${name}:BEGIN`);
  const b = sql.indexOf(`-- ${name}:END`);
  expect(a, `bloque ${name}`).toBeGreaterThanOrEqual(0);
  expect(b).toBeGreaterThan(a);
  return sql.slice(a, b);
};

const esperado = (label: string, policy: UserPolicy) =>
  Object.entries(policy).map(([k, v]) => `${label}|${k}|${v}`);
const POLITICA = [...esperado("FRANCISCO", FRANCISCO_POLICY), ...esperado("AUGUSTO", AUGUSTO_POLICY)].sort();

describe("MACRO 1 — migración de datos de permisos", () => {
  it("POLICY de 02_migrate.sql = user-policy.ts", () => {
    const rows = Array.from(block(read("02_migrate.sql"), "POLICY").matchAll(/\('(\w+)', '(\w+)', '(\w+)', (true|false)\)/g))
      .map((m) => `${m[1]}|${m[2]}:${m[3]}|${m[4]}`);
    expect(rows.sort()).toEqual(POLITICA);
  });

  it("POLICY de 03_postcheck.sql = user-policy.ts", () => {
    const rows = Array.from(block(read("03_postcheck.sql"), "POLICY").matchAll(/\('(\w+)', '([a-z_]+:[a-z_]+)', (true|false)\)/g))
      .map((m) => `${m[1]}|${m[2]}|${m[3]}`);
    expect(rows.sort()).toEqual(POLITICA);
  });

  it.each(["01_precheck.sql", "02_migrate.sql", "03_postcheck.sql"])("CANON de %s = claves otorgables del registro", (f) => {
    const claves = Array.from(block(read(f), "CANON").matchAll(/\('([a-z_]+:[a-z_]+)'\)/g)).map((m) => m[1]);
    expect(claves.sort()).toEqual([...OVERRIDABLE_KEYS].sort());
  });

  it("LEGACY solo contiene claves NO canónicas (nunca borra una clave vigente)", () => {
    const claves = Array.from(block(read("02_migrate.sql"), "LEGACY").matchAll(/\('(\w+)', '(\w+)'\)/g)).map((m) => `${m[1]}:${m[2]}`);
    expect(claves.length).toBeGreaterThan(0);
    for (const k of claves) expect(isPermissionKey(k), k).toBe(false);
  });

  it("LEGACY de la migración = claves del puente de compatibilidad (mismo mapping)", () => {
    const claves = Array.from(block(read("02_migrate.sql"), "LEGACY").matchAll(/\('(\w+)', '(\w+)'\)/g)).map((m) => `${m[1]}:${m[2]}`);
    expect(claves.sort()).toEqual(Object.keys(LEGACY_REVOCATION_BRIDGE).sort());
  });

  it("TARGETS commiteado con placeholders (los ids reales se completan solo al ejecutar)", () => {
    const t = block(read("02_migrate.sql"), "TARGETS");
    for (const p of ["__FRANCISCO_USER_ID__", "__FRANCISCO_EMAIL__", "__AUGUSTO_USER_ID__", "__AUGUSTO_EMAIL__"]) expect(t).toContain(p);
  });

  it.each(["02_migrate.sql", "04_rollback.sql"])("%s no tiene borrados/updates masivos sin filtro sobre UserPermiso", (f) => {
    const sql = read(f);
    expect(sql).not.toMatch(/DELETE FROM "UserPermiso"\s*;/);
    for (const m of Array.from(sql.matchAll(/(DELETE FROM|UPDATE) "UserPermiso"[^;]*;/g))) {
      expect(m[0], "toda escritura sobre UserPermiso está acotada").toMatch(/WHERE|USING/);
    }
  });

  it.each(["02_migrate.sql", "04_rollback.sql"])("%s: bloques DO $$ … END $$ bien delimitados", (f) => {
    const sql = read(f);
    const abre = (sql.match(/^DO \$\$\s*$/gm) ?? []).length;
    const cierra = (sql.match(/^END \$\$;\s*$/gm) ?? []).length;
    expect(abre).toBeGreaterThan(0);
    expect(abre).toBe(cierra);
    expect(sql).not.toMatch(/^DO \$\s*$/m);
  });

  it.each(["02_migrate.sql", "04_rollback.sql"])("%s: toma el mismo lock de fila que la app sobre los User target", (f) => {
    expect(read(f)).toMatch(/FROM "User" WHERE id IN \(SELECT user_id FROM [^)]*\) ORDER BY id FOR UPDATE/);
  });

  // ── R4: tablas que replican la resolución efectiva dentro de la migración ──
  const claves = (sql: string, name: string) =>
    Array.from(block(sql, name).matchAll(/\('([a-z_]+:[a-z_]+)'\)/g)).map((m) => m[1]).sort();

  it("BRIDGE de 02_migrate.sql = LEGACY_REVOCATION_BRIDGE (par a par)", () => {
    const pares = Array.from(block(read("02_migrate.sql"), "BRIDGE").matchAll(/\('([a-z_]+:[a-z_]+)', '([a-z_]+:[a-z_]+)'\)/g)).map((m) => `${m[1]}>${m[2]}`).sort();
    const esperado = Object.entries(LEGACY_REVOCATION_BRIDGE).flatMap(([l, cs]) => cs.map((c) => `${l}>${c}`)).sort();
    expect(pares).toEqual(esperado);
  });

  it("IMPLICA de 02_migrate.sql = REQUIERE_OFICINA_SI_IMPLICITO", () => {
    expect(claves(read("02_migrate.sql"), "IMPLICA")).toEqual([...REQUIERE_OFICINA_SI_IMPLICITO].sort());
  });

  it("ALT_EXPLICIT de 02_migrate.sql = EXPLICIT_ALTERNATIVE_KEYS", () => {
    expect(claves(read("02_migrate.sql"), "ALT_EXPLICIT")).toEqual([...EXPLICIT_ALTERNATIVE_KEYS].sort());
  });

  it("SOCIO_DEFAULT de 02_migrate.sql = defaults SOCIO del registro (sin adminOnly)", () => {
    const esperado = PERMISSIONS.filter((p) => (p.defaults as readonly string[]).includes("SOCIO") && !(p as { adminOnly?: boolean }).adminOnly).map((p) => p.key).sort();
    expect(claves(read("02_migrate.sql"), "SOCIO_DEFAULT")).toEqual(esperado);
  });

  it.each(["01_precheck.sql", "02_migrate.sql"])("MONOTONIC de %s = TRANSITION_MONOTONIC_KEYS", (f) => {
    expect(claves(read(f), "MONOTONIC")).toEqual([...TRANSITION_MONOTONIC_KEYS].sort());
  });

  it("01_precheck.sql expone PRECHECK TRANSITION MONOTONICITY con ok + detalle", () => {
    expect(read("01_precheck.sql")).toMatch(/'PRECHECK TRANSITION MONOTONICITY' AS chequeo,\s+NOT EXISTS \(SELECT 1 FROM fallas\) AS ok/);
  });

  it("02_migrate.sql materializa ANTES de borrar legacy y verifica POST ≤ PRE", () => {
    const sql = read("02_migrate.sql");
    const ins = sql.indexOf("-- ── a2) INSERT");
    const del = sql.indexOf("-- ── b) DELETE");
    expect(ins).toBeGreaterThan(0);
    expect(del).toBeGreaterThan(ins);
    expect(sql).toContain("ampliaría acceso (POST > PRE)");
    expect(sql).toContain("efectivo POST distinto del objetivo");
  });

  it("el rollback borra también _macro1_expected", () => {
    expect(read("04_rollback.sql")).toContain('DROP TABLE IF EXISTS "_macro1_expected"');
  });

  it("el rollback revierte desde el log, no desde una copia total", () => {
    const sql = read("04_rollback.sql");
    expect(sql).toContain('FROM "_macro1_perm_log" ORDER BY seq DESC');
    expect(sql).not.toMatch(/INSERT INTO "UserPermiso"[^;]*SELECT[^;]*FROM "_macro1_perm_snapshot"/);
  });
});
