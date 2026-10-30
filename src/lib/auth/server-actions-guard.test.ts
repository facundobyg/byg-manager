import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import ts from "typescript";
import { isPermissionKey } from "./permission-registry";

// MACRO 1 — AUDITORÍA DE PRESENCIA DE GUARD (AST, no grep).
//
// AUDITORÍA ESTRUCTURAL (heurística sobre el AST, sin ejecutar código). Qué verifica:
//   G1. Toda función exportada de un archivo "use server" invoca un guard
//       reconocido en una sentencia de PRIMER NIVEL de su cuerpo, de forma
//       incondicional: no dentro de if/try/loop, callbacks, el lado derecho de
//       &&/||/??, ramas de ternario ni llamadas opcionales; directamente o vía
//       un helper local que cumple estas mismas reglas.
//   G2. El resultado del guard se chequea con la POLARIDAD correcta y retorna/
//       lanza: `const x = await guard(); if (x) return …` / `if ("error" in x) return …`;
//       `return guard(…)`; o `if (!(await guard())) return`. Un `await guard()`
//       suelto, `if (!x) return` u otras formas no se reconocen (fallan).
//   G3. No hay escrituras evidentes (create/update/upsert/delete/$transaction/
//       $executeRaw/writeAuditLog/.set) ANTES del guard ni ENTRE el guard y su chequeo.
//   G4. Los archivos "use server" no usan `export {…}`, `export default` ni
//       `export *` (formas que este análisis no recorre).
//   G5. Las Server Actions INLINE ("use server" dentro de una función) solo
//       delegan en funciones importadas de archivos "use server" auditados
//       acá (o signOut) y no escriben directamente.
//
// Qué NO garantiza: que no exista un camino de ejecución que esquive el guard
// por semántica (excepciones, aliasing dinámico, condiciones en tiempo de
// ejecución). Los flujos críticos tienen además tests DIRECTOS de autorización
// sobre las acciones reales (ver *.authz.test.ts y permissions.test.ts).

const SRC = path.resolve(__dirname, "../..");
const GUARDS = new Set(["requireActionPermission", "requireCajaPermission", "requireOwnAccountGuard", "isCurrentAdmin"]);
const WRITE_RE = /\.(create|createMany|update|updateMany|upsert|delete|deleteMany|\$executeRaw|\$executeRawUnsafe|\$transaction)\(|writeAuditLog\(|\.set\(/;
const INLINE_ALLOWED_CALLS = new Set(["signOut"]);
/**
 * Wrappers locales que EJECUTAN la acción solo después de su propio guard
 * (devuelven el resultado de la acción, no el del guard): su resultado no
 * necesita chequearse en el caller. Deben cumplir igual G1–G3 por sí mismos.
 *  - runGated (bolsa/importar/[loteId]/actions.ts): gate() → if error return → fn().
 */
const ENFORCING_WRAPPERS = new Set(["runGated"]);

/** archivo (relativo a src) → función → motivo. */
const ALLOWLIST: Record<string, Record<string, string>> = {
  "app/(dashboard)/configuracion/lock-actions.ts": {
    acquireConfigLock: "lease de lock, no muta datos de negocio; exige sesión + canDoAction (2FA/preview-aware)",
    heartbeatConfigLock: "renueva el lease propio (ownerUserId de sesión + ownerClientId)",
    releaseConfigLock: "libera el lease propio",
  },
  "app/actions/session.ts": { logIdleTimeout: "solo audita el timeout de la propia sesión" },
  "lib/actions/preview.ts": { clearPreviewUser: "solo BORRA la cookie propia de 'ver como' (nunca fija); exige sesión" },
  "app/login/actions.ts": { authenticate: "login: previo a tener sesión" },
};

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

function isDirective(st: ts.Statement | undefined): boolean {
  return !!st && ts.isExpressionStatement(st) && ts.isStringLiteral(st.expression) && st.expression.text === "use server";
}

const isFunctionLike = (n: ts.Node) =>
  ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n);

/** Llamadas por identificador dentro de `node`, SIN entrar en funciones anidadas (callbacks). */
function directCalls(node: ts.Node): string[] {
  const names: string[] = [];
  const visit = (n: ts.Node) => {
    if (n !== node && isFunctionLike(n)) return;
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) names.push(n.expression.text);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return names;
}

type FnBody = ts.ConciseBody;

function collectFunctions(sf: ts.SourceFile) {
  const local = new Map<string, FnBody>();
  const exported = new Map<string, FnBody>();
  for (const st of sf.statements) {
    const isExp = !!ts.getModifiers(st as ts.HasModifiers)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (ts.isFunctionDeclaration(st) && st.name && st.body) {
      local.set(st.name.text, st.body);
      if (isExp) exported.set(st.name.text, st.body);
    } else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) {
          local.set(d.name.text, d.initializer.body);
          if (isExp) exported.set(d.name.text, d.initializer.body);
        }
      }
    }
  }
  return { local, exported };
}

function returnsOrThrows(st: ts.Statement): boolean {
  let found = false;
  const visit = (n: ts.Node) => {
    if (found || isFunctionLike(n)) return;
    if (ts.isReturnStatement(n) || ts.isThrowStatement(n)) { found = true; return; }
    ts.forEachChild(n, visit);
  };
  visit(st);
  return found;
}

type Verdict = { ok: true } | { ok: false; reason: string };

/**
 * Llamadas que se ejecutan INCONDICIONALMENTE al evaluar `node`: no entra en
 * callbacks, ni en el operando derecho de &&, ||, ??, ni en las ramas de un
 * ternario, ni en llamadas opcionales `f?.()`. (R2-04: `flag && await guard()`.)
 */
function unconditionalCalls(node: ts.Node): string[] {
  const names: string[] = [];
  const LOGICAL = new Set([ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken]);
  const visit = (n: ts.Node) => {
    if (n !== node && isFunctionLike(n)) return;
    if (ts.isBinaryExpression(n) && LOGICAL.has(n.operatorToken.kind)) { visit(n.left); return; }
    if (ts.isConditionalExpression(n)) { visit(n.condition); return; }
    if (ts.isCallExpression(n) && n.questionDotToken) { visit(n.expression); return; }
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) names.push(n.expression.text);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return names;
}

function stripParens(e: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(e)) e = e.expression;
  return e;
}

/**
 * Polaridad del chequeo (R2-04): la rama que retorna/lanza debe ser la del
 * RECHAZO. Formas aceptadas: `if (x)` (guards que devuelven {error}|null) y
 * `if ("error" in x)` (guards/helpers que devuelven {error}|{…ok}).
 * `if (!x)`, comparaciones u otras formas → no reconocidas.
 */
function isDenialCheck(cond: ts.Expression, name: string): boolean {
  const c = stripParens(cond);
  if (ts.isIdentifier(c)) return c.text === name;
  return ts.isBinaryExpression(c) && c.operatorToken.kind === ts.SyntaxKind.InKeyword
    && ts.isStringLiteral(c.left) && c.left.text === "error"
    && ts.isIdentifier(stripParens(c.right)) && (stripParens(c.right) as ts.Identifier).text === name;
}

/** `!(await guard())` / `!guard()`: el retorno ocurre cuando el guard NO autoriza. */
function isNegatedGuardCondition(cond: ts.Expression): boolean {
  const c = stripParens(cond);
  return ts.isPrefixUnaryExpression(c) && c.operator === ts.SyntaxKind.ExclamationToken;
}

const hasWrite = (sts: readonly ts.Statement[]) => sts.some((x) => WRITE_RE.test(x.getText()));

/** G1+G2+G3 sobre un cuerpo. `local` permite helpers del mismo archivo. */
function auditBody(body: FnBody, local: Map<string, FnBody>, seen = new Set<FnBody>()): Verdict {
  if (seen.has(body)) return { ok: false, reason: "recursión sin guard" };
  seen.add(body);
  const isGuardCall = (name: string) =>
    GUARDS.has(name) || (local.has(name) && auditBody(local.get(name)!, local, new Set(seen)).ok);

  if (!ts.isBlock(body)) {
    return unconditionalCalls(body).some(isGuardCall) ? { ok: true } : { ok: false, reason: "sin guard" };
  }

  const sts = body.statements;
  for (let i = 0; i < sts.length; i++) {
    const st = sts[i];
    const previas = sts.slice(0, i);

    if (ts.isIfStatement(st) && unconditionalCalls(st.expression).some(isGuardCall)) {
      // if (!(await guard())) return …
      if (!isNegatedGuardCondition(st.expression)) return { ok: false, reason: "polaridad del chequeo incorrecta" };
      if (!returnsOrThrows(st.thenStatement)) return { ok: false, reason: "resultado del guard no chequeado" };
      if (hasWrite(previas)) return { ok: false, reason: "escritura antes del guard" };
      return { ok: true };
    }

    if (ts.isReturnStatement(st) && st.expression && unconditionalCalls(st.expression).some(isGuardCall)) {
      if (hasWrite(previas)) return { ok: false, reason: "escritura antes del guard" };
      return { ok: true };
    }

    if (ts.isExpressionStatement(st) && unconditionalCalls(st).some(isGuardCall)) {
      return { ok: false, reason: "resultado del guard ignorado" };
    }

    if (ts.isVariableStatement(st)) {
      const calls = unconditionalCalls(st);
      if (calls.some((c) => ENFORCING_WRAPPERS.has(c) && isGuardCall(c))) {
        if (hasWrite(previas)) return { ok: false, reason: "escritura antes del guard" };
        return { ok: true };
      }
      if (calls.some(isGuardCall)) {
        if (hasWrite(previas)) return { ok: false, reason: "escritura antes del guard" };
        const names = st.declarationList.declarations.map((d) => (ts.isIdentifier(d.name) ? d.name.text : "")).filter(Boolean);
        // Primer `if` posterior que referencia el resultado: debe ser el chequeo correcto.
        const j = sts.findIndex((later, k) => k > i && ts.isIfStatement(later)
          && names.some((n) => new RegExp(`\\b${n}\\b`).test(later.expression.getText())));
        if (j < 0) return { ok: false, reason: "resultado del guard no chequeado" };
        const chk = sts[j] as ts.IfStatement;
        if (!names.some((n) => isDenialCheck(chk.expression, n))) return { ok: false, reason: "polaridad del chequeo incorrecta" };
        if (!returnsOrThrows(chk.thenStatement)) return { ok: false, reason: "resultado del guard no chequeado" };
        if (hasWrite(sts.slice(i + 1, j))) return { ok: false, reason: "escritura entre el guard y su chequeo" };
        return { ok: true };
      }
    }
  }
  return { ok: false, reason: "sin guard incondicional de primer nivel" };
}

const files = walk(SRC)
  .map((abs) => ({ abs, rel: path.relative(SRC, abs).split(path.sep).join("/") }))
  .map((f) => ({ ...f, sf: ts.createSourceFile(f.abs, fs.readFileSync(f.abs, "utf8"), ts.ScriptTarget.Latest, true) }));

const serverFiles = files.filter((f) => isDirective(f.sf.statements[0]));
const serverFileAbs = new Set(serverFiles.map((f) => path.normalize(f.abs)));

describe("G1–G4. Server Actions de archivo — guard backend obligatorio", () => {
  it("encuentra los archivos 'use server' (sanity)", () => {
    expect(serverFiles.length).toBeGreaterThanOrEqual(34);
  });

  it("G4. sin export {…} / export default / export * en archivos 'use server'", () => {
    const prohibidos: string[] = [];
    for (const f of serverFiles) {
      for (const st of f.sf.statements) {
        const isDefault = !!ts.getModifiers(st as ts.HasModifiers)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
        // `export type {…}` se borra al compilar: no puede exponer acciones.
        const reExportValor = ts.isExportDeclaration(st) && !st.isTypeOnly;
        if (reExportValor || ts.isExportAssignment(st) || isDefault) prohibidos.push(`${f.rel}: ${st.getText().slice(0, 60)}`);
      }
    }
    expect(prohibidos).toEqual([]);
  });

  const cases = serverFiles.flatMap((f) => {
    const { local, exported } = collectFunctions(f.sf);
    return Array.from(exported.entries()).map(([name, body]) => ({ file: f.rel, name, body, local }));
  });

  it.each(cases.map((c) => [`${c.file}#${c.name}`, c] as const))("%s", (_label, c) => {
    const allowReason = ALLOWLIST[c.file]?.[c.name];
    if (allowReason) {
      if (c.file !== "app/login/actions.ts") {
        expect(directCalls(c.body).includes("auth"), `${c.file}#${c.name} (allowlist: ${allowReason}) debe validar sesión`).toBe(true);
      }
      return;
    }
    const v = auditBody(c.body, c.local);
    expect(v, `${c.file}#${c.name}`).toEqual({ ok: true });
  });

  it("la allowlist no referencia funciones inexistentes", () => {
    for (const [file, fns] of Object.entries(ALLOWLIST)) {
      const f = serverFiles.find((s) => s.rel === file);
      expect(f, `allowlist: ${file} no es un archivo 'use server'`).toBeDefined();
      const { exported } = collectFunctions(f!.sf);
      for (const fn of Object.keys(fns)) expect(exported.has(fn), `${file}#${fn}`).toBe(true);
    }
  });
});

describe("G5. Server Actions inline ('use server' dentro de una función)", () => {
  function resolveImport(fromAbs: string, spec: string): string | null {
    const base = spec.startsWith("@/") ? path.join(SRC, spec.slice(2)) : spec.startsWith(".") ? path.resolve(path.dirname(fromAbs), spec) : null;
    if (!base) return null;
    for (const cand of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return path.normalize(cand);
    }
    return null;
  }

  const inline: { where: string; body: ts.Block; imports: Map<string, string | null> }[] = [];
  for (const f of files) {
    const imports = new Map<string, string | null>();
    for (const st of f.sf.statements) {
      if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
        const target = resolveImport(f.abs, st.moduleSpecifier.text);
        for (const el of st.importClause.namedBindings.elements) imports.set(el.name.text, target);
      }
    }
    const visit = (n: ts.Node) => {
      if (isFunctionLike(n)) {
        const body = (n as ts.FunctionLikeDeclaration).body;
        if (body && ts.isBlock(body) && isDirective(body.statements[0]) && !isDirective(f.sf.statements[0])) {
          const { line } = f.sf.getLineAndCharacterOfPosition(n.getStart());
          inline.push({ where: `${f.rel}:${line + 1}`, body, imports });
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(f.sf);
  }

  it("encuentra las actions inline conocidas (sanity)", () => expect(inline.length).toBeGreaterThanOrEqual(4));

  it.each(inline.map((x) => [x.where, x] as const))("%s solo delega en acciones auditadas", (_w, x) => {
    expect(WRITE_RE.test(x.body.getText()), "escribe directamente").toBe(false);
    for (const call of directCalls(x.body)) {
      if (INLINE_ALLOWED_CALLS.has(call)) continue;
      const target = x.imports.get(call);
      expect(target && serverFileAbs.has(target), `${call} no viene de un archivo 'use server' auditado`).toBe(true);
    }
  });
});

describe("El detector realmente detecta (casos negativos conocidos)", () => {
  function check(src: string): Record<string, string> {
    const sf = ts.createSourceFile("x.ts", `"use server";\n${src}`, ts.ScriptTarget.Latest, true);
    const { local, exported } = collectFunctions(sf);
    return Object.fromEntries(Array.from(exported.entries()).map(([n, b]) => {
      const v = auditBody(b, local);
      return [n, v.ok ? "OK" : v.reason];
    }));
  }

  it("sin guard / guard correcto", () => {
    expect(check(`
      export async function abierta() { await prisma.x.create({}); }
      export async function cerrada() { const d = await requireActionPermission("bolsa:crear"); if (d) return d; }
    `)).toEqual({ abierta: "sin guard incondicional de primer nivel", cerrada: "OK" });
  });

  it("escritura antes del guard", () => {
    expect(check(`
      export async function f() { await prisma.x.update({}); const d = await requireActionPermission("bolsa:crear"); if (d) return d; }
    `)).toEqual({ f: "escritura antes del guard" });
  });

  it("resultado ignorado / no chequeado", () => {
    expect(check(`
      export async function suelto() { await requireActionPermission("bolsa:crear"); await prisma.x.create({}); }
      export async function asignadoSinIf() { const d = await requireActionPermission("bolsa:crear"); await prisma.x.create({}); }
    `)).toEqual({ suelto: "resultado del guard ignorado", asignadoSinIf: "resultado del guard no chequeado" });
  });

  it("guard dentro de condición / try", () => {
    expect(check(`
      export async function enIf(f) { if (f) { const d = await requireActionPermission("x:y"); if (d) return d; } await prisma.x.create({}); }
      export async function enTry() { try { const d = await requireActionPermission("x:y"); if (d) return d; } catch {} }
    `)).toEqual({ enIf: "sin guard incondicional de primer nivel", enTry: "sin guard incondicional de primer nivel" });
  });

  it("retorno temprano con escritura antes del guard", () => {
    expect(check(`
      export async function f(x) { if (x) { await prisma.x.delete({}); return; } const d = await requireActionPermission("x:y"); if (d) return d; }
    `)).toEqual({ f: "escritura antes del guard" });
  });

  it("guard en un callback nunca ejecutado", () => {
    expect(check(`
      export async function f() { const nunca = async () => { const d = await requireActionPermission("x:y"); if (d) return d; }; await prisma.x.create({}); }
    `)).toEqual({ f: "sin guard incondicional de primer nivel" });
  });

  it("vía helper local: guardado → OK; helper sin chequeo → falla", () => {
    expect(check(`
      async function gate() { const d = await requireActionPermission("x:y"); if (d) return { error: d.error }; return { ok: true }; }
      async function malGate() { await requireActionPermission("x:y"); return { ok: true }; }
      export async function a() { const g = await gate(); if ("error" in g) return g; }
      export const b = async () => { const g = await malGate(); if ("error" in g) return g; };
    `)).toEqual({ a: "OK", b: "sin guard incondicional de primer nivel" });
  });

  it("R2-04 Codex #1: `flag && await guard()` no cuenta como guard", () => {
    expect(check(`
      export async function f(flag) { const d = flag && await requireActionPermission("x:y"); if (d) return d; await prisma.x.create({}); }
      export async function g(flag) { const d = flag ? await requireActionPermission("x:y") : null; if (d) return d; await prisma.x.create({}); }
      export async function h(flag) { const d = flag ?? await requireActionPermission("x:y"); if (d) return d; await prisma.x.create({}); }
    `)).toEqual({ f: "sin guard incondicional de primer nivel", g: "sin guard incondicional de primer nivel", h: "sin guard incondicional de primer nivel" });
  });

  it("R2-04 Codex #2: guard → escritura → chequeo", () => {
    expect(check(`
      export async function f() { const d = await requireActionPermission("x:y"); await prisma.x.create({}); if (d) return d; }
    `)).toEqual({ f: "escritura entre el guard y su chequeo" });
  });

  it("R2-04 Codex #3: polaridad invertida `if (!x) return` → escritura", () => {
    expect(check(`
      export async function f() { const d = await requireActionPermission("x:y"); if (!d) return; await prisma.x.create({}); }
      export async function g() { const r = await requireOwnAccountGuard({}); if (!("error" in r)) return; await prisma.x.create({}); }
      export async function h() { if (await isCurrentAdmin()) return; await cookies().set("x"); }
    `)).toEqual({ f: "polaridad del chequeo incorrecta", g: "polaridad del chequeo incorrecta", h: "polaridad del chequeo incorrecta" });
  });

  it("guard en condición de if con retorno → OK", () => {
    expect(check(`
      export async function f() { if (!(await isCurrentAdmin())) return; await cookies().set("x"); }
    `)).toEqual({ f: "OK" });
  });
});

describe("Claves de vista en layout/sidebar/notificaciones existen en el registro", () => {
  it("ninguna clave literal 'modulo:leer' desconocida", () => {
    const desconocidas: string[] = [];
    for (const f of files.filter((x) => /components\/layout\/|lib\/data\/notifications\.ts/.test(x.rel))) {
      const visit = (n: ts.Node) => {
        if (ts.isStringLiteral(n) && /^[a-z_]+:leer$/.test(n.text) && !isPermissionKey(n.text)) desconocidas.push(`${f.rel}: ${n.text}`);
        ts.forEachChild(n, visit);
      };
      visit(f.sf);
    }
    expect(desconocidas).toEqual([]);
  });
});

describe("Claves de permiso usadas en el código existen en el registro", () => {
  const CHECKERS = new Set(["requireActionPermission", "canDoAction", "requirePermission", "hasPermission"]);
  const usos: { where: string; key: string }[] = [];
  for (const f of files) {
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && CHECKERS.has(n.expression.text)) {
        const arg = n.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
          const { line } = f.sf.getLineAndCharacterOfPosition(n.getStart());
          usos.push({ where: `${f.rel}:${line + 1}`, key: arg.text });
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(f.sf);
  }

  it("hay usos (sanity)", () => expect(usos.length).toBeGreaterThan(100));
  it("ninguna clave desconocida", () => {
    expect(usos.filter((u) => !isPermissionKey(u.key))).toEqual([]);
  });
});
