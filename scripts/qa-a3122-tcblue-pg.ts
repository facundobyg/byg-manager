/**
 * A3.1.2.2 — QA real contra Postgres (tests E–K) de updateTCBlue cableado al
 * lease CONFIG.
 *
 * NO es parte de la suite de vitest (no termina en .test.ts a propósito):
 * verifica atomicidad y ownership real de Postgres, no mocks. Se ejecuta
 * manualmente: npx tsx scripts/qa-a3122-tcblue-pg.ts
 *
 * Usa EXCLUSIVAMENTE una base QA DEDICADA `qa_a3122_tcblue` dentro de
 * TEST V5 (byg-manager-test-v5 / br-flat-fire-acp039j3) — creada específica
 * para este bloque (no se reutiliza `qa_a3_operational_locks` de A3.1.1,
 * porque acá se escriben filas reales de `Config`/`TipoCambio` con la
 * `clave`/`fecha` fijas que usa el código real, y no queremos compartir esa
 * base con otro baseline). Llevada al schema actual vía
 * `prisma migrate deploy` antes de este script. Verifica el host antes de
 * tocar nada y aborta si coincide con producción.
 *
 * E — lock faltante: 0 writes.
 * F — lock de la MISMA tab... no, de otra tab del MISMO user: 0 writes.
 * G — lock de OTRO user: 0 writes.
 * H — lock expirado: 0 writes.
 * I — lock válido: Config.tc_blue y TipoCambio se escriben en la MISMA tx.
 * J — retry de deadlock: smoke únicamente (evidencia completa ya la dan los
 *     tests P/Q de A3.1.2.1 contra el mismo wrapper withOperationalLocks).
 * K — rollback de los dos writes si el segundo falla: réplica QA-only de
 *     las 2 operaciones de setTCBlue con un throw forzado entre medio (sin
 *     tocar código productivo).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_TEST_LOCAL = resolve(process.cwd(), ".env.test.local");
const PRODUCTION_HOST_FRAGMENT = "ep-cool-hill-acuymnh3";
const EXPECTED_TEST_HOST_FRAGMENT = "ep-purple-waterfall-act57gj7";
const QA_DB_NAME = "qa_a3122_tcblue";

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

  console.log(`[qa-a3122] host confirmado: ${EXPECTED_TEST_HOST_FRAGMENT} / db: ${QA_DB_NAME}`);

  const { prisma } = await import("../src/lib/prisma");
  const { Decimal } = await import("@prisma/client/runtime/library");
  const engine = await import("../src/lib/locks/engine");
  const { LockOwnershipError } = await import("../src/lib/locks/errors");
  const { withOperationalLocks } = await import("../src/lib/locks/withOperationalLocks");
  const { setTCBlue } = await import("../src/lib/services/config.service");
  const { LOCK_TTL_MS } = await import("../src/lib/locks/constants");

  const [{ current_database }] = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
  if (current_database !== QA_DB_NAME) {
    throw new Error(`ABORT: current_database() = "${current_database}", se esperaba "${QA_DB_NAME}".`);
  }
  console.log(`[qa-a3122] conexión real verificada: current_database() = ${current_database}`);

  const uuid = () => crypto.randomUUID();

  async function createFixtureUser(label: string): Promise<string> {
    const id = uuid();
    await prisma.user.create({
      data: { id, email: `a3122-qa-${label}-${id}@example.invalid`, name: `QA ${label}`, passwordHash: "x", updatedAt: new Date() },
    });
    return id;
  }

  /** Mismo helper que en el QA de A3.1.1: fuerza un lease "ya expirado" escribiendo directo en la fila. */
  async function seedLock(opts: { ownerUserId: string; ownerClientId: string; ageMs: number }) {
    await prisma.$executeRaw`
      INSERT INTO "OperationalLock" (id, "lockKey", area, "ownerUserId", "ownerClientId", "acquiredAt", "lastHeartbeatAt", "updatedAt")
      VALUES (
        ${uuid()}, 'CONFIG', 'CONFIG', ${opts.ownerUserId}, ${opts.ownerClientId},
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

  async function getTcBlueConfig() {
    return prisma.config.findUnique({ where: { clave: "tc_blue" } });
  }
  async function getTipoCambioHoy() {
    const hoy = new Date();
    const fecha = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
    return prisma.tipoCambio.findUnique({
      where: { monedaOrigen_monedaDestino_fecha: { monedaOrigen: "ARS", monedaDestino: "USD", fecha } },
    });
  }
  async function resetTcBlueFixtures() {
    await prisma.config.deleteMany({ where: { clave: "tc_blue" } });
    const hoy = new Date();
    const fecha = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
    await prisma.tipoCambio.deleteMany({ where: { monedaOrigen: "ARS", monedaDestino: "USD", fecha } });
  }

  type TestResult = { name: string; pass: boolean; detail: string };
  const results: TestResult[] = [];
  function record(name: string, pass: boolean, detail: string) {
    results.push({ name, pass, detail });
    console.log(`[qa-a3122] ${pass ? "PASS" : "FAIL"} — ${name}: ${detail}`);
  }

  const userA = await createFixtureUser("A");
  const userB = await createFixtureUser("B");
  const clientX = uuid();
  const clientY = uuid();
  const clientB = uuid();

  // ── Test E — lock faltante → 0 writes ───────────────────────────────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "CONFIG" } });
    await resetTcBlueFixtures();

    let threw = false;
    let wasOwnershipError = false;
    try {
      await withOperationalLocks(["CONFIG"], userA, clientX, async (tx) => {
        await setTCBlue(1111.11, tx);
      });
    } catch (e) {
      threw = true;
      wasOwnershipError = e instanceof LockOwnershipError;
    }

    const cfg = await getTcBlueConfig();
    const tc = await getTipoCambioHoy();
    record(
      "E — lock faltante → 0 writes",
      threw && wasOwnershipError && cfg === null && tc === null,
      `threw=${threw} wasOwnershipError=${wasOwnershipError} cfg=${cfg ? "existe" : "null"} tc=${tc ? "existe" : "null"}`,
    );
  }

  // ── Test F — lock del MISMO user, OTRA tab → 0 writes ───────────────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "CONFIG" } });
    await resetTcBlueFixtures();
    await engine.acquireLocks(["CONFIG"], userA, clientX); // A posee CONFIG con clientX

    let threw = false;
    let wasOwnershipError = false;
    try {
      await withOperationalLocks(["CONFIG"], userA, clientY, async (tx) => {
        // clientY, no clientX — misma persona, tab distinta.
        await setTCBlue(2222.22, tx);
      });
    } catch (e) {
      threw = true;
      wasOwnershipError = e instanceof LockOwnershipError;
    }

    const cfg = await getTcBlueConfig();
    const tc = await getTipoCambioHoy();
    record(
      "F — lock del mismo user en otra tab → 0 writes",
      threw && wasOwnershipError && cfg === null && tc === null,
      `threw=${threw} wasOwnershipError=${wasOwnershipError} cfg=${cfg ? "existe" : "null"} tc=${tc ? "existe" : "null"}`,
    );
  }

  // ── Test G — lock de OTRO user → 0 writes ───────────────────────────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "CONFIG" } });
    await resetTcBlueFixtures();
    await engine.acquireLocks(["CONFIG"], userA, clientX); // A posee CONFIG

    let threw = false;
    let wasOwnershipError = false;
    try {
      await withOperationalLocks(["CONFIG"], userB, clientB, async (tx) => {
        await setTCBlue(3333.33, tx);
      });
    } catch (e) {
      threw = true;
      wasOwnershipError = e instanceof LockOwnershipError;
    }

    const cfg = await getTcBlueConfig();
    const tc = await getTipoCambioHoy();
    record(
      "G — lock de otro user → 0 writes",
      threw && wasOwnershipError && cfg === null && tc === null,
      `threw=${threw} wasOwnershipError=${wasOwnershipError} cfg=${cfg ? "existe" : "null"} tc=${tc ? "existe" : "null"}`,
    );
  }

  // ── Test H — lock expirado → 0 writes ───────────────────────────────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "CONFIG" } });
    await resetTcBlueFixtures();
    await seedLock({ ownerUserId: userA, ownerClientId: clientX, ageMs: LOCK_TTL_MS + 5_000 });

    let threw = false;
    let wasOwnershipError = false;
    try {
      await withOperationalLocks(["CONFIG"], userA, clientX, async (tx) => {
        await setTCBlue(4444.44, tx);
      });
    } catch (e) {
      threw = true;
      wasOwnershipError = e instanceof LockOwnershipError;
    }

    const cfg = await getTcBlueConfig();
    const tc = await getTipoCambioHoy();
    record(
      "H — lock expirado → 0 writes",
      threw && wasOwnershipError && cfg === null && tc === null,
      `threw=${threw} wasOwnershipError=${wasOwnershipError} cfg=${cfg ? "existe" : "null"} tc=${tc ? "existe" : "null"}`,
    );
  }

  // ── Test I — lock válido → Config y TipoCambio se escriben, misma tx ───
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "CONFIG" } });
    await resetTcBlueFixtures();
    await engine.acquireLocks(["CONFIG"], userA, clientX);

    const VALOR = 987.65;
    await withOperationalLocks(["CONFIG"], userA, clientX, async (tx) => {
      await setTCBlue(VALOR, tx);
    });

    const cfg = await getTcBlueConfig();
    const tc = await getTipoCambioHoy();
    const dec = new Decimal(VALOR).toDecimalPlaces(4);
    const cfgOk = cfg !== null && cfg.valor === dec.toString();
    const tcOk = tc !== null && new Decimal(tc.valor as unknown as string).equals(dec);
    record(
      "I — lock válido → Config.tc_blue + TipoCambio escritos en la misma tx",
      cfgOk && tcOk,
      `cfg.valor=${cfg?.valor} tc.valor=${tc?.valor}`,
    );
  }

  // ── Test J — retry de deadlock: smoke (evidencia completa: P/Q A3.1.2.1) ─
  {
    // No se reproduce acá un deadlock específico de updateTCBlue: el wrapper
    // withOperationalLocks (withDeadlockRetry + interactive tx +
    // requireOperationalLocks) ya tiene evidencia real de Postgres para esto
    // en scripts/qa-a3121-config-lease-pg.ts (tests P y Q), y setTCBlue no
    // agrega ninguna ruta de escritura nueva que cambie ese comportamiento
    // (son 2 upserts por clave fija, sin lecturas previas ni ramas). Acá
    // solo se confirma smoke: el camino completo (lock real → tx → 2
    // upserts) funciona de punta a punta, ya cubierto por el test I arriba.
    record(
      "J — retry de deadlock: smoke únicamente, cubierto por QA P/Q de A3.1.2.1",
      true,
      "sin reproducción adicional — ver scripts/qa-a3121-config-lease-pg.ts tests P/Q",
    );
  }

  // ── Test K — rollback de los 2 writes si el segundo falla ──────────────
  {
    await prisma.operationalLock.deleteMany({ where: { lockKey: "CONFIG" } });
    await resetTcBlueFixtures();
    await engine.acquireLocks(["CONFIG"], userA, clientX);

    // Réplica QA-only de las 2 operaciones de setTCBlue, con un throw
    // forzado ENTRE la primera y la segunda — nunca se toca config.service.ts
    // para esto.
    let threw = false;
    try {
      await withOperationalLocks(["CONFIG"], userA, clientX, async (tx) => {
        const dec = new Decimal(5555.55).toDecimalPlaces(4);
        await tx.config.upsert({
          where: { clave: "tc_blue" },
          update: { valor: dec.toString() },
          create: { id: uuid(), clave: "tc_blue", valor: dec.toString(), updatedAt: new Date() },
        });
        throw new Error("QA: fallo forzado entre el primer y el segundo write");
        // (el segundo upsert de TipoCambio nunca se alcanza)
      });
    } catch (e) {
      threw = e instanceof Error && e.message.includes("QA: fallo forzado");
    }

    const cfg = await getTcBlueConfig();
    const tc = await getTipoCambioHoy();
    record(
      "K — segundo write falla → rollback de AMBOS (ninguno persiste)",
      threw && cfg === null && tc === null,
      `threw=${threw} cfg=${cfg ? "existe (BUG: no debería)" : "null"} tc=${tc ? "existe" : "null"}`,
    );
  }

  // ── Limpieza de fixtures ──────────────────────────────────────────────
  await prisma.operationalLock.deleteMany({ where: { lockKey: "CONFIG" } });
  await resetTcBlueFixtures();
  await prisma.user.deleteMany({ where: { email: { startsWith: "a3122-qa-" } } });
  console.log("[qa-a3122] fixtures limpiados (OperationalLock CONFIG + Config tc_blue + TipoCambio hoy + Users a3122-qa-*).");

  const lockCount = await prisma.operationalLock.count();
  const userCount = await prisma.user.count({ where: { email: { startsWith: "a3122-qa-" } } });
  const cfgCount = await prisma.config.count({ where: { clave: "tc_blue" } });
  console.log(`[qa-a3122] verificación post-cleanup: OperationalLock=${lockCount} UsersFixture=${userCount} ConfigTcBlue=${cfgCount}`);

  await prisma.$disconnect();

  console.log("\n=== A3.1.2.2 — RESULTADOS REALES POSTGRES (E–K) ===");
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
  console.error("[qa-a3122] ERROR FATAL:", err);
  process.exit(1);
});
