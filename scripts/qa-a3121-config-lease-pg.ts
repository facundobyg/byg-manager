/**
 * A3.1.2.1 — QA real contra Postgres (tests P y Q) de withOperationalLocks.
 *
 * NO es parte de la suite de vitest (no termina en .test.ts a propósito):
 * verifica atomicidad real de Postgres, no mocks. Se ejecuta manualmente:
 *   npx tsx scripts/qa-a3121-config-lease-pg.ts
 *
 * Usa EXCLUSIVAMENTE la base QA dedicada `qa_a3_operational_locks` dentro de
 * TEST V5 (byg-manager-test-v5 / br-flat-fire-acp039j3) — la misma base QA
 * ya usada por A3.1.1, reutilizada porque withOperationalLocks es un wrapper
 * fino sobre ese mismo motor/tabla OperationalLock. Verifica el host antes
 * de tocar nada y aborta si coincide con producción.
 *
 * P — lock faltante: el callback NUNCA ejecuta writes (probado en Postgres
 *     real, no con el orden de llamadas de un mock: se intenta un write de
 *     negocio real dentro del callback y se confirma que nunca se persiste).
 * Q — el retry envuelve la transacción COMPLETA: se fuerza un deadlock real
 *     de Postgres entre dos withOperationalLocks concurrentes y se confirma
 *     que, tras el retry, cada escritura se aplicó exactamente una vez (sin
 *     duplicados ni writes parciales de un intento abortado).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_TEST_LOCAL = resolve(process.cwd(), ".env.test.local");
const PRODUCTION_HOST_FRAGMENT = "ep-cool-hill-acuymnh3";
const EXPECTED_TEST_HOST_FRAGMENT = "ep-purple-waterfall-act57gj7";
const QA_DB_NAME = "qa_a3_operational_locks";

function loadTestEnv(): { directUrl: string } {
  const raw = readFileSync(ENV_TEST_LOCAL, "utf8");
  const match = /^TEST_DIRECT_URL="([^"]+)"/m.exec(raw);
  if (!match) throw new Error("No se encontró TEST_DIRECT_URL en .env.test.local");
  return { directUrl: match[1] };
}

function withDatabase(url: string, dbName: string): string {
  const u = new URL(url);
  u.pathname = `/${dbName}`;
  return u.toString();
}

async function main() {
  const { directUrl } = loadTestEnv();

  if (directUrl.includes(PRODUCTION_HOST_FRAGMENT)) {
    throw new Error("ABORT: TEST_DIRECT_URL apunta a producción. No se ejecuta nada.");
  }
  if (!directUrl.includes(EXPECTED_TEST_HOST_FRAGMENT)) {
    throw new Error(
      `ABORT: host inesperado. Se esperaba ${EXPECTED_TEST_HOST_FRAGMENT}, no coincide con TEST_DIRECT_URL actual.`,
    );
  }

  const qaUrl = withDatabase(directUrl, QA_DB_NAME);
  process.env.DATABASE_URL = qaUrl;
  process.env.DIRECT_URL = qaUrl;

  console.log(`[qa-a3121] host confirmado: ${EXPECTED_TEST_HOST_FRAGMENT} / db: ${QA_DB_NAME}`);

  const { prisma } = await import("../src/lib/prisma");
  const engine = await import("../src/lib/locks/engine");
  const { LockOwnershipError } = await import("../src/lib/locks/errors");
  const { withOperationalLocks } = await import("../src/lib/locks/withOperationalLocks");

  const [{ current_database }] = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
  if (current_database !== QA_DB_NAME) {
    throw new Error(`ABORT: current_database() = "${current_database}", se esperaba "${QA_DB_NAME}".`);
  }
  console.log(`[qa-a3121] conexión real verificada: current_database() = ${current_database}`);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const uuid = () => crypto.randomUUID();

  async function createFixtureUser(label: string, name: string): Promise<string> {
    const id = uuid();
    await prisma.user.create({
      data: { id, email: `a3121-qa-${label}-${id}@example.invalid`, name, passwordHash: "x", updatedAt: new Date() },
    });
    return id;
  }

  type TestResult = { name: string; pass: boolean; detail: string };
  const results: TestResult[] = [];
  function record(name: string, pass: boolean, detail: string) {
    results.push({ name, pass, detail });
    console.log(`[qa-a3121] ${pass ? "PASS" : "FAIL"} — ${name}: ${detail}`);
  }

  const userA = await createFixtureUser("A", "QA Lease A");
  const userB = await createFixtureUser("B", "QA Lease B");
  const clientA = uuid();
  const clientB = uuid();

  // ── Test P — lock faltante: el callback nunca ejecuta writes ───────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "QA_P" } });
    const target = await createFixtureUser("P-target", "before");

    let threw = false;
    let wasOwnershipError = false;
    try {
      await withOperationalLocks(["QA_P"], userA, clientA, async (tx) => {
        // Si esto llegara a ejecutarse, sería un bug real de atomicidad —
        // no un artefacto de mock. Escribe sobre una fila real.
        await tx.user.update({ where: { id: target }, data: { name: "after (NO DEBERÍA PASAR)" } });
      });
    } catch (e) {
      threw = true;
      wasOwnershipError = e instanceof LockOwnershipError;
    }

    const after = await prisma.user.findUnique({ where: { id: target }, select: { name: true } });
    record(
      "P — lock faltante: callback nunca persiste writes",
      threw && wasOwnershipError && after?.name === "before",
      `threw=${threw} wasOwnershipError=${wasOwnershipError} nameDespues="${after?.name}"`,
    );
  }

  // ── Test Q — retry envuelve la transacción completa (deadlock real) ────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: { in: ["QA_Q"] } } });
    // Ambos owners ya tienen el lease QA_Q (mismo lockKey, no hay conflicto
    // de lock entre ellos) — el deadlock se fuerza a nivel de filas de
    // negocio (dos Users), no del OperationalLock.
    await engine.releaseAllMyClientLocks(userA, clientA);
    await engine.releaseAllMyClientLocks(userB, clientB);
    await engine.acquireLocks(["QA_Q"], userA, clientA);
    // QA_Q es de área única: para que ambos lo posean simultáneamente sin
    // pisarse, cada uno adquiere su propia key.
    await prisma.operationalLock.deleteMany({ where: { lockKey: "QA_Q_B" } });
    await engine.acquireLocks(["QA_Q_B"], userB, clientB);

    const u1 = await createFixtureUser("Q1", "0");
    const u2 = await createFixtureUser("Q2", "0");

    let attemptsA = 0;
    let attemptsB = 0;

    // TxA: toca u1 primero, espera, toca u2 después.
    const txA = withOperationalLocks(["QA_Q"], userA, clientA, async (tx) => {
      attemptsA += 1;
      const row1 = await tx.user.findUniqueOrThrow({ where: { id: u1 } });
      await tx.user.update({ where: { id: u1 }, data: { name: String(Number(row1.name) + 1) } });
      await sleep(500);
      const row2 = await tx.user.findUniqueOrThrow({ where: { id: u2 } });
      await tx.user.update({ where: { id: u2 }, data: { name: String(Number(row2.name) + 1) } });
      return "A";
    });

    // Deja que A tome el lock de u1 primero.
    await sleep(100);

    // TxB: toca u2 primero, espera, toca u1 después → orden opuesto, deadlock real.
    const txB = withOperationalLocks(["QA_Q_B"], userB, clientB, async (tx) => {
      attemptsB += 1;
      const row2 = await tx.user.findUniqueOrThrow({ where: { id: u2 } });
      await tx.user.update({ where: { id: u2 }, data: { name: String(Number(row2.name) + 1) } });
      await sleep(500);
      const row1 = await tx.user.findUniqueOrThrow({ where: { id: u1 } });
      await tx.user.update({ where: { id: u1 }, data: { name: String(Number(row1.name) + 1) } });
      return "B";
    });

    const [resA, resB] = await Promise.allSettled([txA, txB]);

    const bothSucceeded = resA.status === "fulfilled" && resB.status === "fulfilled";
    const finalU1 = await prisma.user.findUniqueOrThrow({ where: { id: u1 } });
    const finalU2 = await prisma.user.findUniqueOrThrow({ where: { id: u2 } });
    // Cada fixture debe reflejar EXACTAMENTE 2 incrementos (uno por tx) — si
    // un retry hubiera re-aplicado un intento parcial ya comprometido, o si
    // requireOperationalLocks no se hubiera vuelto a ejecutar en el retry,
    // el valor final no sería "2".
    const noDuplicateWrites = finalU1.name === "2" && finalU2.name === "2";
    // Al menos uno de los dos attempts debió reintentar (>1) para que haya
    // habido un deadlock real detectado y resuelto por withDeadlockRetry.
    const sawRetry = attemptsA > 1 || attemptsB > 1;

    record(
      "Q — retry de deadlock envuelve la transacción completa, sin writes duplicados",
      bothSucceeded && noDuplicateWrites && sawRetry,
      `bothSucceeded=${bothSucceeded} attemptsA=${attemptsA} attemptsB=${attemptsB} u1=${finalU1.name} u2=${finalU2.name}`,
    );
  }

  // ── Limpieza de fixtures ────────────────────────────────────────────────
  await prisma.operationalLock.deleteMany({ where: { lockKey: { in: ["QA_P", "QA_Q", "QA_Q_B"] } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "a3121-qa-" } } });
  console.log("[qa-a3121] fixtures limpiados (OperationalLock QA_P/QA_Q/QA_Q_B + Users a3121-qa-*).");

  await prisma.$disconnect();

  console.log("\n=== A3.1.2.1 — RESULTADOS REALES POSTGRES (P, Q) ===");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}`);
  }
  const failed = results.filter((r) => !r.pass);
  if (failed.length > 0) {
    console.error(`\n${failed.length} test(s) FALLARON.`);
    process.exit(1);
  }
  console.log(`\nTodos los tests (${results.length}) pasaron.`);
}

main().catch((err) => {
  console.error("[qa-a3121] ERROR FATAL:", err);
  process.exit(1);
});
