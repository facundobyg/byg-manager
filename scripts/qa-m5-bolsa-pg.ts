/**
 * MACRO 5 — QA REAL contra Postgres (TEST V5) de Carteras propias + Bolsa.
 *
 * NO es parte de la suite de vitest. Ejecutar manualmente:
 *   npx tsx scripts/qa-m5-bolsa-pg.ts
 *
 * Usa EXCLUSIVAMENTE TEST V5 vía TEST_DIRECT_URL de .env.test.local; verifica el
 * host y aborta si es producción. Fixtures AISLADOS ("qa-m5-…": usuario inactivo,
 * cartera inactiva, ticker propio) BORRADOS en finally; al final verifica 0 registros QA.
 *
 * Casos (servicios reales de src/lib/bolsa/integridad.service.ts, transacciones reales):
 *   A. compra concertada → posición + cash en la misma tx
 *   B. segunda compra → costo promedio ponderado
 *   C. venta parcial → cash + costo de lo vendido (resultado = neto − cant × costo)
 *   D. anular la venta → posición, costo y cash exactos al estado previo
 *   E. dos ventas concurrentes por toda la posición → una sola; posición nunca negativa
 *   F. doble liquidación concurrente → una; doble anulación concurrente → una
 *   G. atomicidad: concertación que falla (moneda sin saldo) → la operación sigue pendiente
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { anularOperacionTx, concertarOperacionTx, liquidarOperacionTx, type DatosConcertacion } from "../src/lib/bolsa/integridad.service";

const PRODUCTION_HOST_FRAGMENT = "ep-cool-hill-acuymnh3";
const EXPECTED_TEST_HOST_FRAGMENT = "ep-purple-waterfall-act57gj7";
const QA = "qa-m5";

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
const USER = `${QA}-user`, CARTERA = `${QA}-cartera`, TICKER = "QAM5TICK";
let seq = 0;

const datos = (comisionFija: number | null = null): DatosConcertacion => ({
  nroBoleto: null, alyc: null, fechaConcertacion: null, fechaLiquidacion: null, plazoLiquidacion: "T1",
  costos: { comisionPct: null, comisionFija: comisionFija === null ? null : D(comisionFija), derechosMercado: null, gastos: null, impuestos: null, netoManual: null },
  comisionUSD: null, tcMepDia: null, esSenebi: false, senebiBruto: null, diasCaucion: null, tasaCaucion: null, saldoUSD: null,
});

async function nuevaOp(tipo: "COMPRA_ACCION" | "VENTA_ACCION", cantidad: number, precio: number, moneda: "ARS" | "EUR" = "ARS") {
  const id = `${QA}-op-${++seq}`;
  await db.operacionBolsa.create({ data: {
    id, carteraId: CARTERA, tipoOperacion: tipo, ticker: TICKER, cantidad, precio, moneda, mercado: "BYMA",
    operadorCargaId: USER, estado: "PENDIENTE_CONCERTACION", updatedAt: new Date(),
  } });
  return id;
}
const concertar = (id: string, com: number | null = null) => db.$transaction((tx) => concertarOperacionTx(tx, { operacionId: id, userId: USER, datos: datos(com) }), { timeout: 15000 });

async function estado() {
  const c = await db.cartera.findUniqueOrThrow({ where: { id: CARTERA } });
  const activo = await db.activo.findUnique({ where: { ticker: TICKER } });
  const p = activo ? await db.posicionCartera.findUnique({ where: { carteraId_activoId: { carteraId: CARTERA, activoId: activo.id } } }) : null;
  return { cash: Number(c.saldoPesos), cant: p ? Number(p.cantidad) : 0, costo: p ? Number(p.precioCompra) : null };
}

async function limpiar() {
  const ops = (await db.operacionBolsa.findMany({ where: { id: { startsWith: QA } }, select: { id: true } })).map((o) => o.id);
  await db.operacionBolsaLog.deleteMany({ where: { operacionId: { in: ops } } });
  await db.operacionBolsa.deleteMany({ where: { id: { in: ops } } });
  await db.posicionCartera.deleteMany({ where: { carteraId: CARTERA } });
  await db.cartera.deleteMany({ where: { id: CARTERA } });
  await db.activo.deleteMany({ where: { ticker: TICKER } });
  await db.user.deleteMany({ where: { id: USER } });
}

async function main() {
  console.log(`[qa-m5] host confirmado: ${EXPECTED_TEST_HOST_FRAGMENT}`);
  await limpiar();
  await db.user.create({ data: { id: USER, email: `${QA}@invalid.local`, name: "QA M5", passwordHash: "x", activo: false, updatedAt: new Date() } });
  await db.cartera.create({ data: { id: CARTERA, nombre: "QA M5 Cartera", slug: `${QA}-cartera`, activa: false, saldoPesos: 1_000_000, updatedAt: new Date() } });

  // A. compra
  await concertar(await nuevaOp("COMPRA_ACCION", 100, 1000));
  const a = await estado();
  check("A. compra → posición + cash", a.cash === 900_000 && a.cant === 100 && a.costo === 1000, JSON.stringify(a));

  // B. segunda compra con comisión → promedio ponderado (100×1000 + 100×1200 + 100) / 200 = 1100,5
  await concertar(await nuevaOp("COMPRA_ACCION", 100, 1200), 100);
  const b = await estado();
  check("B. segunda compra → costo promedio", b.cash === 779_900 && b.cant === 200 && b.costo === 1100.5, JSON.stringify(b));

  // C. venta parcial
  const venta = await nuevaOp("VENTA_ACCION", 50, 1300);
  await concertar(venta);
  const c = await estado();
  const log = await db.operacionBolsaLog.findFirst({ where: { operacionId: venta, accion: "COSTO_CARTERA" } });
  const costoU = Number((log?.snapshot as { costoUnitario?: string } | null)?.costoUnitario);
  const resultado = 65_000 - 50 * costoU;
  check("C. venta parcial → cash + resultado contra costo promedio", c.cash === 844_900 && c.cant === 150 && c.costo === 1100.5 && resultado === 9_975,
    `${JSON.stringify(c)} ; costo unitario ${costoU} ; resultado ${resultado}`);

  // D. anular la venta
  await db.$transaction((tx) => anularOperacionTx(tx, { operacionId: venta, userId: USER, motivo: "QA" }));
  const d = await estado();
  check("D. anulación → estado previo exacto", JSON.stringify(d) === JSON.stringify(b), `${JSON.stringify(d)} = ${JSON.stringify(b)}`);

  // E. dos ventas concurrentes por toda la posición
  const [v1, v2] = [await nuevaOp("VENTA_ACCION", 200, 1300), await nuevaOp("VENTA_ACCION", 200, 1300)];
  const rE = await Promise.allSettled([concertar(v1), concertar(v2)]);
  const e = await estado();
  const errE = rE.filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason?.message ?? "")).join(" | ");
  const estadosE = (await db.operacionBolsa.findMany({ where: { id: { in: [v1, v2] } }, select: { estado: true } })).map((x) => x.estado).sort();
  check("E. ventas concurrentes → una sola, posición nunca negativa", rE.filter((r) => r.status === "fulfilled").length === 1 && e.cant === 0 && e.cash === 779_900 + 260_000 && errE.includes("Stock insuficiente")
    && JSON.stringify(estadosE) === JSON.stringify(["CONCERTADA", "PENDIENTE_CONCERTACION"]), `${JSON.stringify(e)} ; estados ${estadosE.join(",")} ; rechazo: ${errE.slice(0, 50)}`);

  // F. doble liquidación / doble anulación concurrentes
  const vendida = rE[0].status === "fulfilled" ? v1 : v2;
  const liq = () => db.$transaction((tx) => liquidarOperacionTx(tx, { operacionId: vendida, userId: USER, fechaLiquidacion: null }));
  const rL = await Promise.allSettled([liq(), liq()]);
  const an = () => db.$transaction((tx) => anularOperacionTx(tx, { operacionId: vendida, userId: USER, motivo: "QA" }));
  const rA = await Promise.allSettled([an(), an()]);
  const f = await estado();
  const logsLiq = await db.operacionBolsaLog.count({ where: { operacionId: vendida, accion: "LIQUIDACION" } });
  const logsAn = await db.operacionBolsaLog.count({ where: { operacionId: vendida, accion: "ANULACION" } });
  check("F. doble liquidación / doble anulación concurrentes → una sola", rL.filter((r) => r.status === "fulfilled").length === 1 && rA.filter((r) => r.status === "fulfilled").length === 1
    && logsLiq === 1 && logsAn === 1 && JSON.stringify(f) === JSON.stringify(b), `liq ok ${rL.filter((r) => r.status === "fulfilled").length} ; anul ok ${rA.filter((r) => r.status === "fulfilled").length} ; estado ${JSON.stringify(f)}`);

  // G. atomicidad
  const eur = await nuevaOp("COMPRA_ACCION", 1, 1, "EUR");
  let errG = "";
  try { await concertar(eur); errG = "APLICÓ"; } catch (er) { errG = er instanceof Error ? er.message : String(er); }
  const opG = await db.operacionBolsa.findUniqueOrThrow({ where: { id: eur } });
  const logsG = await db.operacionBolsaLog.count({ where: { operacionId: eur } });
  check("G. falla en la concertación → rollback total", errG.includes("no tiene saldo") && opG.estado === "PENDIENTE_CONCERTACION" && logsG === 0 && JSON.stringify(await estado()) === JSON.stringify(b),
    `estado ${opG.estado} ; logs ${logsG}`);
}

main()
  .catch((e) => check("EJECUCIÓN", false, e instanceof Error ? e.message : String(e)))
  .finally(async () => {
    await limpiar().catch((e) => check("LIMPIEZA", false, String(e)));
    const restos = await db.operacionBolsa.count({ where: { id: { startsWith: QA } } })
      + await db.cartera.count({ where: { id: CARTERA } })
      + await db.posicionCartera.count({ where: { carteraId: CARTERA } })
      + await db.activo.count({ where: { ticker: TICKER } })
      + await db.user.count({ where: { id: USER } });
    check("SIN DATOS QA PERSISTIDOS", restos === 0, `registros QA restantes: ${restos}`);
    await db.$disconnect();
    for (const r of resultados) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.caso} — ${r.detalle}`);
    process.exit(resultados.every((r) => r.ok) ? 0 : 1);
  });
