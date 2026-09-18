/**
 * A3.1.1 — QA real contra Postgres (tests A–J) del motor de OperationalLock.
 *
 * NO es parte de la suite de vitest (no termina en .test.ts a propósito):
 * corre concurrencia real de transacciones contra una base Postgres real,
 * no mocks. Se ejecuta manualmente: npx tsx scripts/qa-a3-operational-locks-pg.ts
 *
 * Usa EXCLUSIVAMENTE la base QA dedicada `qa_a3_operational_locks` dentro de
 * TEST V5 (byg-manager-test-v5 / br-flat-fire-acp039j3). Verifica el host
 * antes de tocar nada y aborta si coincide con producción.
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

  console.log(`[qa-a3] host confirmado: ${EXPECTED_TEST_HOST_FRAGMENT} / db: ${QA_DB_NAME}`);

  // Import dinámico: el singleton de @/lib/prisma lee DATABASE_URL/DIRECT_URL
  // al construirse, así que debe importarse recién después de fijar el env.
  const { prisma } = await import("../src/lib/prisma");
  const engine = await import("../src/lib/locks/engine");
  const { LockConflictError, LockOwnershipError } = await import("../src/lib/locks/errors");
  const { LOCK_TTL_MS } = await import("../src/lib/locks/constants");

  // Doble check contra la propia conexión, no solo contra la URL local.
  const [{ current_database }] = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
  if (current_database !== QA_DB_NAME) {
    throw new Error(`ABORT: current_database() = "${current_database}", se esperaba "${QA_DB_NAME}".`);
  }
  console.log(`[qa-a3] conexión real verificada: current_database() = ${current_database}`);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const uuid = () => crypto.randomUUID();

  async function createFixtureUser(label: string): Promise<string> {
    const id = uuid();
    await prisma.user.create({
      data: {
        id,
        email: `a311-qa-${label}-${id}@example.invalid`,
        name: `QA ${label}`,
        passwordHash: "x",
        updatedAt: new Date(),
      },
    });
    return id;
  }

  /** Fuerza un lease "ya expirado" o "cerca de vencer" escribiendo directo en la fila (solo fixtures de test). */
  async function seedLock(opts: {
    lockKey: string;
    area: string;
    ownerUserId: string;
    ownerClientId: string;
    ageMs: number; // cuánto más viejo que ahora debe quedar lastHeartbeatAt/acquiredAt
  }) {
    await prisma.$executeRaw`
      INSERT INTO "OperationalLock" (id, "lockKey", area, "ownerUserId", "ownerClientId", "acquiredAt", "lastHeartbeatAt", "updatedAt")
      VALUES (
        ${uuid()}, ${opts.lockKey}, ${opts.area}, ${opts.ownerUserId}, ${opts.ownerClientId},
        clock_timestamp() - (${opts.ageMs}::bigint * interval '1 millisecond'),
        clock_timestamp() - (${opts.ageMs}::bigint * interval '1 millisecond'),
        clock_timestamp() - (${opts.ageMs}::bigint * interval '1 millisecond')
      )
      ON CONFLICT ("lockKey") DO UPDATE SET
        "ownerUserId" = EXCLUDED."ownerUserId",
        "ownerClientId" = EXCLUDED."ownerClientId",
        "acquiredAt" = EXCLUDED."acquiredAt",
        "lastHeartbeatAt" = EXCLUDED."lastHeartbeatAt",
        "updatedAt" = EXCLUDED."updatedAt"
    `;
  }

  async function getLock(lockKey: string) {
    return prisma.operationalLock.findUnique({ where: { lockKey } });
  }

  type TestResult = { name: string; pass: boolean; detail: string };
  const results: TestResult[] = [];

  function record(name: string, pass: boolean, detail: string) {
    results.push({ name, pass, detail });
    console.log(`[qa-a3] ${pass ? "PASS" : "FAIL"} — ${name}: ${detail}`);
  }

  // ── Fixture users compartidos entre tests ─────────────────────────────
  const userA = await createFixtureUser("A");
  const userB = await createFixtureUser("B");
  const clientA1 = uuid();
  const clientA2 = uuid();
  const clientB1 = uuid();

  // ── Test A — dos owners, misma key, exactamente uno gana ─────────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "CC" } });
    const [ra, rb] = await Promise.allSettled([
      engine.acquireLocks(["CC"], userA, clientA1),
      engine.acquireLocks(["CC"], userB, clientB1),
    ]);
    const winners = [ra, rb].filter((r) => r.status === "fulfilled").length;
    const losers = [ra, rb].filter(
      (r) => r.status === "rejected" && (r.reason instanceof LockConflictError),
    ).length;
    record(
      "A — misma key concurrente",
      winners === 1 && losers === 1,
      `winners=${winners} losers=${losers}`,
    );
  }

  // ── Test B — [CC,PF] vs [PF,CC], mismo orden normalizado, sin deadlock ─
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: { in: ["CC", "PF"] } } });
    const [ra, rb] = await Promise.allSettled([
      engine.acquireLocks(["CC", "PF"], userA, clientA1),
      engine.acquireLocks(["PF", "CC"], userB, clientB1),
    ]);
    const fulfilled = [ra, rb].filter((r) => r.status === "fulfilled");
    const rejected = [ra, rb].filter((r) => r.status === "rejected");
    const fullSetWinner = fulfilled.length === 1 && fulfilled[0].status === "fulfilled" && fulfilled[0].value.length === 2;
    const cc = await getLock("CC");
    const pf = await getLock("PF");
    const noPartial = cc !== null && pf !== null && cc.ownerUserId === pf.ownerUserId;
    record(
      "B — sets solapados sin deadlock, sin adquisición parcial",
      fulfilled.length === 1 && rejected.length === 1 && fullSetWinner && noPartial,
      `fulfilled=${fulfilled.length} rejected=${rejected.length} ccOwner=${cc?.ownerUserId} pfOwner=${pf?.ownerUserId}`,
    );
  }

  // ── Test C — overlap [BIND,BOLSA,CARTERA] vs [CARTERA] ────────────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: { in: ["BIND", "BOLSA", "CARTERA"] } } });
    const [ra, rb] = await Promise.allSettled([
      engine.acquireLocks(["BIND", "BOLSA", "CARTERA"], userA, clientA1),
      engine.acquireLocks(["CARTERA"], userB, clientB1),
    ]);
    const bind = await getLock("BIND");
    const bolsa = await getLock("BOLSA");
    const cartera = await getLock("CARTERA");
    const threeSetOk = ra.status === "fulfilled" || rb.status === "fulfilled";
    // Si A (el set de 3) perdió CARTERA, BIND y BOLSA no deben haber quedado huérfanos a su nombre.
    const noPartialOwnership =
      cartera !== null &&
      (bind === null || bind.ownerUserId === cartera.ownerUserId) &&
      (bolsa === null || bolsa.ownerUserId === cartera.ownerUserId);
    record(
      "C — overlap parcial de sets, sin partial ownership",
      threeSetOk && noPartialOwnership,
      `ra=${ra.status} rb=${rb.status} bind=${bind?.ownerUserId ?? "null"} bolsa=${bolsa?.ownerUserId ?? "null"} cartera=${cartera?.ownerUserId}`,
    );
  }

  // ── Test D — rollback en key intermedia, ninguna adquisición nueva persiste ─
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: { in: ["AAA_D", "BBB_D", "CCC_D"] } } });
    // BBB_D ya ocupada y vigente por B — A intentará [AAA_D, BBB_D, CCC_D] y debe fallar en BBB_D.
    await seedLock({ lockKey: "BBB_D", area: "BBB_D", ownerUserId: userB, ownerClientId: clientB1, ageMs: 0 });
    let threw = false;
    try {
      await engine.acquireLocks(["CCC_D", "AAA_D", "BBB_D"], userA, clientA1);
    } catch (e) {
      threw = e instanceof LockConflictError;
    }
    const aaa = await getLock("AAA_D");
    const ccc = await getLock("CCC_D");
    record(
      "D — rollback en key N no persiste adquisiciones nuevas",
      threw && aaa === null && ccc === null,
      `threw=${threw} aaa=${aaa ? "existe" : "null"} ccc=${ccc ? "existe" : "null"}`,
    );
  }

  // ── Test E — A ya posee CC, intenta [CC,PF] con PF ocupado por B, A conserva CC ─
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: { in: ["CC", "PF"] } } });
    await engine.acquireLocks(["CC"], userA, clientA1);
    await seedLock({ lockKey: "PF", area: "PF", ownerUserId: userB, ownerClientId: clientB1, ageMs: 0 });
    let threw = false;
    try {
      await engine.acquireLocks(["CC", "PF"], userA, clientA1);
    } catch (e) {
      threw = e instanceof LockConflictError;
    }
    const cc = await getLock("CC");
    record(
      "E — A conserva CC preexistente tras fallo en PF",
      threw && cc !== null && cc.ownerUserId === userA && cc.ownerClientId === clientA1,
      `threw=${threw} ccOwner=${cc?.ownerUserId}`,
    );
  }

  // ── Test F — expiry: antes del TTL no se puede adquirir, después sí ────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "F_KEY" } });
    await seedLock({ lockKey: "F_KEY", area: "F_KEY", ownerUserId: userA, ownerClientId: clientA1, ageMs: LOCK_TTL_MS - 5_000 });
    let beforeThrew = false;
    try {
      await engine.acquireLocks(["F_KEY"], userB, clientB1);
    } catch (e) {
      beforeThrew = e instanceof LockConflictError;
    }

    await seedLock({ lockKey: "F_KEY", area: "F_KEY", ownerUserId: userA, ownerClientId: clientA1, ageMs: LOCK_TTL_MS + 5_000 });
    let afterOk = false;
    try {
      const r = await engine.acquireLocks(["F_KEY"], userB, clientB1);
      afterOk = r.length === 1;
    } catch {
      afterOk = false;
    }
    record(
      "F — expiry real con clock_timestamp()",
      beforeThrew && afterOk,
      `beforeThrew=${beforeThrew} afterOk=${afterOk}`,
    );
  }

  // ── Test G — heartbeat tardío no resucita un lease vencido ────────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "G_KEY" } });
    await seedLock({ lockKey: "G_KEY", area: "G_KEY", ownerUserId: userA, ownerClientId: clientA1, ageMs: LOCK_TTL_MS + 5_000 });
    const result = await engine.heartbeatLocks(["G_KEY"], userA, clientA1);
    record(
      "G — heartbeat perdido no resucita lease vencido",
      result.status === "LOST",
      `status=${result.status}`,
    );
  }

  // ── Test H — takeover: key existente, inexistente, set mixto ──────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: { in: ["H_EXIST", "H_NEW"] } } });
    await engine.acquireLocks(["H_EXIST"], userA, clientA1);
    const takeover = await engine.takeoverLocks(["H_EXIST", "H_NEW"], userB, clientB1);
    const hExist = await getLock("H_EXIST");
    const hNew = await getLock("H_NEW");
    const prevOwnerRecorded = takeover.find((t) => t.lockKey === "H_EXIST")?.previousOwnerUserId === userA;
    const newOwnerRecorded = takeover.find((t) => t.lockKey === "H_NEW")?.previousOwnerUserId === null;
    record(
      "H — takeover atómico de set mixto (existente + inexistente)",
      takeover.length === 2 &&
        hExist?.ownerUserId === userB &&
        hNew?.ownerUserId === userB &&
        prevOwnerRecorded &&
        newOwnerRecorded,
      `hExistOwner=${hExist?.ownerUserId} hNewOwner=${hNew?.ownerUserId} prevOwnerRecorded=${prevOwnerRecorded}`,
    );
  }

  // ── Test I — takeover invalida heartbeat del owner anterior ────────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "I_KEY" } });
    await engine.acquireLocks(["I_KEY"], userA, clientA1);
    await engine.takeoverLocks(["I_KEY"], userB, clientB1);
    const result = await engine.heartbeatLocks(["I_KEY"], userA, clientA1);
    record(
      "I — heartbeat del owner previo tras takeover devuelve LOST",
      result.status === "LOST",
      `status=${result.status}`,
    );
  }

  // ── Test J — mutation vs expiry: sin ventana entre validar y escribir ──
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "J_KEY" } });
    // Lease de A cerca de vencer.
    await seedLock({ lockKey: "J_KEY", area: "J_KEY", ownerUserId: userA, ownerClientId: clientA2, ageMs: LOCK_TTL_MS - 2_000 });

    const holdMs = 3_000;
    let aCommitted = false;
    let bError: unknown = null;
    let bWaitedMs = 0;

    const aTx = prisma.$transaction(async (tx) => {
      await engine.requireOperationalLocks(tx, ["J_KEY"], userA, clientA2);
      // Tx financiera "activa": el row lock queda sostenido durante este sleep.
      await sleep(holdMs);
      aCommitted = true;
    }, { maxWait: 10_000, timeout: 15_000 });

    // Deja que A entre primero y tome el row lock antes de que B intente.
    await sleep(300);
    const bStart = Date.now();
    const bAttempt = engine.acquireLocks(["J_KEY"], userB, clientB1).catch((e) => {
      bError = e;
    });

    await Promise.all([aTx, bAttempt]);
    bWaitedMs = Date.now() - bStart;

    const jLock = await getLock("J_KEY");
    const bWasBlocked = bWaitedMs >= holdMs - 500; // debió esperar ~holdMs por el row lock, no responder al toque
    const bFailedAfterWaiting = bError instanceof LockConflictError;
    const stillOwnedByA = jLock !== null && jLock.ownerUserId === userA && jLock.ownerClientId === clientA2;

    record(
      "J — mutation vs expiry: B espera el row lock y falla tras el commit de A",
      aCommitted && bWasBlocked && bFailedAfterWaiting && stillOwnedByA,
      `aCommitted=${aCommitted} bWaitedMs=${bWaitedMs} bFailedAfterWaiting=${bFailedAfterWaiting} stillOwnedByA=${stillOwnedByA}`,
    );
  }

  // ── Limpieza de fixtures (solo lo creado por este script, dentro de QA) ─
  await prisma.operationalLock.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { startsWith: "a311-qa-" } } });
  console.log("[qa-a3] fixtures limpiados (OperationalLock + Users a311-qa-*) en qa_a3_operational_locks.");

  await prisma.$disconnect();

  console.log("\n=== A3.1.1 — RESULTADOS REALES POSTGRES ===");
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
  console.error("[qa-a3] ERROR FATAL:", err);
  process.exit(1);
});
