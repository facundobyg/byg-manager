/**
 * MACRO 5 — FIX PASS M5-F01 / M5-F02 — QA REAL contra Postgres (TEST V5).
 *
 * NO es parte de la suite de vitest. Ejecutar manualmente:
 *   npx tsx scripts/qa-m5-fix-pg.ts
 *
 * Usa EXCLUSIVAMENTE TEST V5 vía TEST_DIRECT_URL de .env.test.local; verifica el
 * host y aborta si es producción. Fixtures AISLADOS ("qa-m5fix-…") BORRADOS en
 * finally; al final verifica 0 registros QA (incluido el AuditLog de los ajustes).
 *
 * Casos (servicios reales, transacciones reales):
 *   A. compra USD CABLE → solo saldoUSDCable baja; operación con saldoUSD = CABLE
 *   B. compra USD MEP   → solo saldoUSDMep baja; operación con saldoUSD = MEP
 *   C. anular la compra MEP → saldoUSDMep exacto, Cable intacto
 *   D. ajuste manual confirmado → posición cambia, cash idéntico, AuditLog AJUSTE_POSICION antes/después
 *   E. ajuste sin confirmación → DENY, nada escrito
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { anularOperacionTx, concertarOperacionTx, type DatosConcertacion } from "../src/lib/bolsa/integridad.service";
import { ajusteAperturaPosicionTx } from "../src/lib/bolsa/ajustes.service";

const PRODUCTION_HOST_FRAGMENT = "ep-cool-hill-acuymnh3";
const EXPECTED_TEST_HOST_FRAGMENT = "ep-purple-waterfall-act57gj7";
const QA = "qa-m5fix";

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
const USER = `${QA}-user`, CARTERA = `${QA}-cartera`, TICKER = "QAM5FIXT", TICKER_AJ = "QAM5FIXA";
let seq = 0;

const datos = (saldoUSD: "CABLE" | "MEP"): DatosConcertacion => ({
  nroBoleto: null, alyc: null, fechaConcertacion: null, fechaLiquidacion: null, plazoLiquidacion: "T1",
  costos: { comisionPct: null, comisionFija: null, derechosMercado: null, gastos: null, impuestos: null, netoManual: null },
  comisionUSD: null, tcMepDia: null, esSenebi: false, senebiBruto: null, diasCaucion: null, tasaCaucion: null, saldoUSD,
});
async function compraUSD(cantidad: number, precio: number) {
  const id = `${QA}-op-${++seq}`;
  await db.operacionBolsa.create({ data: {
    id, carteraId: CARTERA, tipoOperacion: "COMPRA_ACCION", ticker: TICKER, cantidad, precio, moneda: "USD", mercado: "BYMA",
    operadorCargaId: USER, estado: "PENDIENTE_CONCERTACION", updatedAt: new Date(),
  } });
  return id;
}
async function cash() {
  const c = await db.cartera.findUniqueOrThrow({ where: { id: CARTERA } });
  return { ars: Number(c.saldoPesos), cable: Number(c.saldoUSDCable), mep: Number(c.saldoUSDMep) };
}

async function limpiar() {
  const ops = (await db.operacionBolsa.findMany({ where: { id: { startsWith: QA } }, select: { id: true } })).map((o) => o.id);
  await db.operacionBolsaLog.deleteMany({ where: { operacionId: { in: ops } } });
  await db.operacionBolsa.deleteMany({ where: { id: { in: ops } } });
  await db.posicionCartera.deleteMany({ where: { carteraId: CARTERA } });
  await db.auditLog.deleteMany({ where: { userId: USER } });
  await db.cartera.deleteMany({ where: { id: CARTERA } });
  await db.activo.deleteMany({ where: { ticker: { in: [TICKER, TICKER_AJ] } } });
  await db.user.deleteMany({ where: { id: USER } });
}

async function main() {
  console.log(`[qa-m5fix] host confirmado: ${EXPECTED_TEST_HOST_FRAGMENT}`);
  await limpiar();
  await db.user.create({ data: { id: USER, email: `${QA}@invalid.local`, name: "QA M5 FIX", passwordHash: "x", activo: false, updatedAt: new Date() } });
  await db.cartera.create({ data: { id: CARTERA, nombre: "QA M5 FIX Cartera", slug: `${QA}-cartera`, activa: false, saldoPesos: 500_000, saldoUSDCable: 10_000, saldoUSDMep: 10_000, updatedAt: new Date() } });

  // A. compra USD Cable
  const opA = await compraUSD(10, 100);
  await db.$transaction((tx) => concertarOperacionTx(tx, { operacionId: opA, userId: USER, datos: datos("CABLE") }));
  const a = await cash();
  const rowA = await db.operacionBolsa.findUniqueOrThrow({ where: { id: opA } });
  check("A. compra USD Cable → solo Cable baja", a.cable === 9_000 && a.mep === 10_000 && a.ars === 500_000 && rowA.saldoUSD === "CABLE", `${JSON.stringify(a)} ; saldoUSD ${rowA.saldoUSD}`);

  // B. compra USD MEP
  const opB = await compraUSD(5, 100);
  await db.$transaction((tx) => concertarOperacionTx(tx, { operacionId: opB, userId: USER, datos: datos("MEP") }));
  const b = await cash();
  const rowB = await db.operacionBolsa.findUniqueOrThrow({ where: { id: opB } });
  check("B. compra USD MEP → solo MEP baja", b.cable === 9_000 && b.mep === 9_500 && b.ars === 500_000 && rowB.saldoUSD === "MEP", `${JSON.stringify(b)} ; saldoUSD ${rowB.saldoUSD}`);

  // C. anular la compra MEP
  await db.$transaction((tx) => anularOperacionTx(tx, { operacionId: opB, userId: USER, motivo: "QA" }));
  const c = await cash();
  const log = await db.operacionBolsaLog.findFirst({ where: { operacionId: opB, accion: "EFECTOS_CONCERTACION" } });
  const campo = (log?.snapshot as { saldo?: { campo?: string } } | null)?.saldo?.campo;
  check("C. anulación MEP → restaura MEP exacto, Cable intacto", c.cable === 9_000 && c.mep === 10_000 && campo === "saldoUSDMep", `${JSON.stringify(c)} ; efectos.campo ${campo}`);

  // D. ajuste manual confirmado
  const cashD0 = await cash();
  await db.$transaction((tx) => ajusteAperturaPosicionTx(tx, {
    userId: USER, confirmarAjuste: true, carteraId: CARTERA, ticker: TICKER_AJ, descripcion: null, categoria: "ACCION_USD", monedaPrecio: "USD",
    cantidad: D(20), precio: D(50), fecha: new Date(Date.UTC(2026, 9, 1)),
  }));
  const activoAj = await db.activo.findUniqueOrThrow({ where: { ticker: TICKER_AJ } });
  const posD = await db.posicionCartera.findUnique({ where: { carteraId_activoId: { carteraId: CARTERA, activoId: activoAj.id } } });
  const auditD = await db.auditLog.findMany({ where: { userId: USER, accion: "AJUSTE_POSICION" } });
  const nuevos = auditD[0]?.datosNuevos as { cantidad?: string; costo?: string; description?: string } | null;
  check("D. ajuste confirmado → posición cambia, cash idéntico, AuditLog correcto",
    Number(posD?.cantidad) === 20 && Number(posD?.precioCompra) === 50 && JSON.stringify(await cash()) === JSON.stringify(cashD0)
    && auditD.length === 1 && nuevos?.cantidad === "20" && nuevos?.costo === "50" && /sin cash/.test(nuevos?.description ?? ""),
    `posición ${posD?.cantidad} @ ${posD?.precioCompra} ; cash ${JSON.stringify(await cash())} ; audit ${auditD.length} ${nuevos?.description ?? ""}`);

  // E. ajuste sin confirmación
  let errE = "";
  try {
    await db.$transaction((tx) => ajusteAperturaPosicionTx(tx, {
      userId: USER, confirmarAjuste: false, carteraId: CARTERA, ticker: TICKER_AJ, descripcion: null, categoria: "ACCION_USD", monedaPrecio: "USD",
      cantidad: D(999), precio: D(1), fecha: new Date(),
    }));
    errE = "APLICÓ";
  } catch (e) { errE = e instanceof Error ? e.message : String(e); }
  const posE = await db.posicionCartera.findUnique({ where: { carteraId_activoId: { carteraId: CARTERA, activoId: activoAj.id } } });
  const auditE = await db.auditLog.count({ where: { userId: USER, accion: "AJUSTE_POSICION" } });
  check("E. ajuste sin confirmación → DENY, nada escrito", errE.includes("ajuste / apertura sin movimiento de cash") && Number(posE?.cantidad) === 20 && auditE === 1,
    `${errE.slice(0, 60)} ; posición ${posE?.cantidad} ; audit ${auditE}`);
}

main()
  .catch((e) => check("EJECUCIÓN", false, e instanceof Error ? e.message : String(e)))
  .finally(async () => {
    await limpiar().catch((e) => check("LIMPIEZA", false, String(e)));
    const restos = await db.operacionBolsa.count({ where: { id: { startsWith: QA } } })
      + await db.cartera.count({ where: { id: CARTERA } })
      + await db.posicionCartera.count({ where: { carteraId: CARTERA } })
      + await db.activo.count({ where: { ticker: { in: [TICKER, TICKER_AJ] } } })
      + await db.auditLog.count({ where: { userId: USER } })
      + await db.user.count({ where: { id: USER } });
    check("SIN DATOS QA PERSISTIDOS", restos === 0, `registros QA restantes: ${restos}`);
    await db.$disconnect();
    for (const r of resultados) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.caso} — ${r.detalle}`);
    process.exit(resultados.every((r) => r.ok) ? 0 : 1);
  });
