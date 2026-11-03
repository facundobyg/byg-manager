/**
 * MACRO 4 — FIX FINAL INTERESES CC — QA REAL contra Postgres (TEST V5).
 *
 * NO es parte de la suite de vitest. Ejecutar manualmente:
 *   npx tsx scripts/qa-m4-intereses-pg.ts
 *
 * Usa EXCLUSIVAMENTE TEST V5 vía TEST_DIRECT_URL de .env.test.local; verifica el
 * host y aborta si es producción. Fixtures AISLADOS ("qa-m4int-…", cliente inactivo)
 * BORRADOS en finally; al final verifica 0 registros QA.
 *
 * Casos (servicios reales, transacciones reales; "hoy" fijo para reproducibilidad):
 *   1. vista previa con movimiento dentro del mes = ORÁCULO diario independiente
 *   2. aplicar (20/09) → monto persistido = recálculo del servidor = vista previa
 *   3. el camino del servidor no recibe monto; dos aplicaciones concurrentes → una
 *   4. período solapado (01/09–30/09 después de lo liquidado hasta 20/09) → DENY
 *   5. aplicar de nuevo (30/09) → solo días nuevos [20/09, 30/09)
 *   6. revertir el último interés y volver a aplicar → mismo tramo, sin doble interés
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  aplicarInteresPendienteCCTx, liquidarInteresCCTx, registrarMovimientoCC, revertirMovimientoCCTx,
} from "../src/lib/cc/integridad.service";
import { interesLiquidadoHasta, previewInteresPendienteCC, saldoReconstruido } from "../src/lib/cc/integridad";

const PRODUCTION_HOST_FRAGMENT = "ep-cool-hill-acuymnh3";
const EXPECTED_TEST_HOST_FRAGMENT = "ep-purple-waterfall-act57gj7";
const QA = "qa-m4int";

function testUrl(): string {
  const raw = readFileSync(resolve(process.cwd(), ".env.test.local"), "utf8");
  const m = /^TEST_DIRECT_URL="([^"]+)"/m.exec(raw);
  if (!m) throw new Error("TEST_DIRECT_URL no encontrado en .env.test.local");
  const host = new URL(m[1]).hostname;
  if (host.includes(PRODUCTION_HOST_FRAGMENT)) throw new Error("ABORT: el host es PRODUCCIÓN");
  if (!host.includes(EXPECTED_TEST_HOST_FRAGMENT)) throw new Error(`ABORT: host inesperado ${host}`);
  return m[1];
}

const db = new PrismaClient({ datasourceUrl: testUrl() });
const resultados: { caso: string; ok: boolean; detalle: string }[] = [];
const check = (caso: string, ok: boolean, detalle: string) => resultados.push({ caso, ok, detalle });
const D = (v: Decimal.Value) => new Decimal(v);
const U = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const CLI = `${QA}-cliente`, CC = `${QA}-cc-usd`;
const TASA = D("0.365"); // 0,1% diario: interés del día = saldo × 0,001

/** ORÁCULO INDEPENDIENTE: día por día de [ini, fin), saldo = movimientos no-INTERES (ni reversas de INTERES) con fecha ≤ día. */
function oraculo(movs: { fecha: Date; tipo: string; monto: Decimal; descripcion: string | null }[], ini: Date, fin: Date): Decimal {
  const reversasDeInteres = (m: { descripcion: string | null }) => /movref:|REVERSO INTERES/.test(m.descripcion ?? "");
  let total = D(0);
  for (let d = ini; d < fin; d = new Date(d.getTime() + 86_400_000)) {
    const saldo = movs.filter((m) => m.tipo !== "INTERES" && !reversasDeInteres(m) && m.fecha <= d)
      .reduce((s, m) => s.plus(m.tipo === "EGRESO" ? m.monto.neg() : m.monto), D(0));
    if (saldo.gt(0)) total = total.plus(saldo.mul(TASA).div(365));
  }
  return total;
}
const cerca = (a: Decimal, b: Decimal) => a.minus(b).abs().lte("0.005000001");

async function movs() {
  return (await db.movimientoCC.findMany({ where: { cuentaCorrienteId: CC }, orderBy: [{ fecha: "asc" }, { createdAt: "asc" }] }))
    .map((m) => ({ id: m.id, fecha: m.fecha, tipo: m.tipo as string, monto: D(m.monto.toString()), descripcion: m.descripcion }));
}
async function saldos() {
  const c = await db.cuentaCorriente.findUniqueOrThrow({ where: { id: CC } });
  return { almacenado: Number(c.saldo), reconstruido: saldoReconstruido(await movs()).toNumber() };
}
const intereses = async () => (await movs()).filter((m) => m.tipo === "INTERES");

async function limpiar() {
  await db.movimientoCC.deleteMany({ where: { cuentaCorrienteId: CC } });
  await db.cuentaCorriente.deleteMany({ where: { id: CC } });
  await db.cliente.deleteMany({ where: { id: CLI } });
}

async function main() {
  console.log(`[qa-m4int] host confirmado: ${EXPECTED_TEST_HOST_FRAGMENT}`);
  await limpiar();
  await db.cliente.create({ data: { id: CLI, nombre: "QA M4 Intereses", activo: false, tasaCC: TASA, updatedAt: new Date() } });
  await db.cuentaCorriente.create({ data: { id: CC, clienteId: CLI, moneda: "USD", saldo: 0, updatedAt: new Date() } });
  await db.$transaction(async (tx) => {
    await registrarMovimientoCC(tx, { cuentaId: CC, tipo: "INGRESO", monto: D(100000), fecha: U("2026-08-01"), descripcion: "QA saldo previo" });
    await registrarMovimientoCC(tx, { cuentaId: CC, tipo: "INGRESO", monto: D(50000), fecha: U("2026-09-05"), descripcion: "QA ingreso del mes" });
    await registrarMovimientoCC(tx, { cuentaId: CC, tipo: "EGRESO", monto: D(30000), fecha: U("2026-09-12"), descripcion: "QA egreso del mes" });
  });
  const dia20 = new Date("2026-09-20T15:00:00Z"), dia30 = new Date("2026-09-30T15:00:00Z");

  // 1. vista previa vs oráculo
  const prev = previewInteresPendienteCC(await movs(), TASA, dia20);
  const or1 = oraculo(await movs(), U("2026-09-01"), U("2026-09-20"));
  check("1. vista previa = oráculo diario", prev.interesTotal.minus(or1).abs().lt("0.000001") && prev.inicio.getTime() === U("2026-09-01").getTime() && prev.fin.getTime() === U("2026-09-20").getTime(),
    `vista previa ${prev.interesTotal.toFixed(6)} ; oráculo ${or1.toFixed(6)} ; período ${prev.inicio.toISOString().slice(0, 10)}..${prev.fin.toISOString().slice(0, 10)} (fin exclusivo)`);

  // 2–3. aplicar (sin monto del cliente) + concurrencia
  const ap = () => db.$transaction((tx) => aplicarInteresPendienteCCTx(tx, { cuentaId: CC, ahora: dia20 }), { timeout: 15000 });
  const r2 = await Promise.allSettled([ap(), ap()]);
  const ints2 = await intereses();
  const s2 = await saldos();
  check("2. monto persistido = recálculo del servidor = vista previa", ints2.length === 1 && cerca(ints2[0].monto, prev.interesTotal) && cerca(ints2[0].monto, or1) && ints2[0].fecha.getTime() === U("2026-09-20").getTime() && s2.almacenado === s2.reconstruido,
    `persistido ${ints2[0]?.monto} ; fecha ${ints2[0]?.fecha.toISOString().slice(0, 10)} ; saldo ${s2.almacenado} = reconstruido ${s2.reconstruido}`);
  const errores = r2.filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason?.message ?? ""));
  check("3. el servidor no recibe monto; dos aplicaciones concurrentes → una", r2.filter((r) => r.status === "fulfilled").length === 1 && errores.every((e) => e.includes("No hay días pendientes")) && aplicarInteresPendienteCCTx.length === 2,
    `aplicadas: ${r2.filter((r) => r.status === "fulfilled").length} ; rechazo: ${errores.join(" | ").slice(0, 60)}`);

  // 4. solapamiento
  let deny4 = "";
  try { await db.$transaction((tx) => liquidarInteresCCTx(tx, { cuentaId: CC, fechaInicio: U("2026-09-01"), fechaFin: U("2026-09-30"), tasa: TASA, interesAplicado: D(0) })); deny4 = "APLICÓ"; }
  catch (e) { deny4 = e instanceof Error ? e.message : String(e); }
  check("4. período solapado → DENY", deny4.includes("liquidado hasta el 2026-09-20") && (await intereses()).length === 1, deny4.slice(0, 90));

  // 5. siguiente aplicación: solo días nuevos
  const or5 = oraculo(await movs(), U("2026-09-20"), U("2026-09-30"));
  await db.$transaction((tx) => aplicarInteresPendienteCCTx(tx, { cuentaId: CC, ahora: dia30 }), { timeout: 15000 });
  const ints5 = await intereses();
  const or1a30 = oraculo(await movs(), U("2026-09-01"), U("2026-09-30"));
  check("5. aplicar de nuevo → solo [20/09, 30/09)", ints5.length === 2 && cerca(ints5[1].monto, or5) && cerca(ints5[0].monto.plus(ints5[1].monto), or1a30),
    `segundo ${ints5[1]?.monto} = oráculo tramo nuevo ${or5.toFixed(2)} ; suma ${ints5[0]?.monto.plus(ints5[1]?.monto ?? 0)} = oráculo 01–30 ${or1a30.toFixed(2)}`);

  // 6. revertir el último y volver a aplicar
  await db.$transaction((tx) => revertirMovimientoCCTx(tx, { id: ints5[1].id, userName: "qa", fecha: U("2026-09-30") }));
  const hasta6 = interesLiquidadoHasta(await movs());
  await db.$transaction((tx) => aplicarInteresPendienteCCTx(tx, { cuentaId: CC, ahora: dia30 }), { timeout: 15000 });
  const todos6 = await movs();
  const vigentes = todos6.filter((m) => m.tipo === "INTERES" && !todos6.some((r) => (r.descripcion ?? "").includes(`movref:${m.id}`)));
  const s6 = await saldos();
  check("6. revertir y volver a liquidar → consistente", hasta6?.getTime() === U("2026-09-20").getTime() && vigentes.length === 2 && cerca(vigentes[1].monto, or5) && s6.almacenado === s6.reconstruido,
    `liquidado hasta tras reversa ${hasta6?.toISOString().slice(0, 10)} ; vigentes ${vigentes.map((v) => v.monto.toString()).join(" + ")} ; saldo ${s6.almacenado} = reconstruido ${s6.reconstruido}`);
}

main()
  .catch((e) => check("EJECUCIÓN", false, e instanceof Error ? e.message : String(e)))
  .finally(async () => {
    await limpiar().catch((e) => check("LIMPIEZA", false, String(e)));
    const restos = await db.cliente.count({ where: { id: { startsWith: QA } } })
      + await db.cuentaCorriente.count({ where: { OR: [{ id: { startsWith: QA } }, { clienteId: { startsWith: QA } }] } })
      + await db.movimientoCC.count({ where: { cuentaCorrienteId: { startsWith: QA } } });
    check("SIN DATOS QA PERSISTIDOS", restos === 0, `registros QA restantes: ${restos}`);
    await db.$disconnect();
    for (const r of resultados) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.caso} — ${r.detalle}`);
    process.exit(resultados.every((r) => r.ok) ? 0 : 1);
  });
