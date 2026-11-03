/**
 * MACRO 4 — QA REAL contra Postgres (TEST V5) de integridad CC + PF.
 *
 * NO es parte de la suite de vitest. Ejecutar manualmente:
 *   npx tsx scripts/qa-m4-cc-pf-pg.ts
 *
 * Usa EXCLUSIVAMENTE TEST V5 vía TEST_DIRECT_URL de .env.test.local; verifica el
 * host y aborta si es producción. Fixtures AISLADOS (ids "qa-m4-…", clientes
 * inactivos) creados al inicio y BORRADOS en finally; al final verifica que no
 * quede ningún registro QA.
 *
 * Casos (servicios reales de src/lib/cc/integridad.service.ts, transacciones reales):
 *   A. crear PF desde CC → EGRESO + PF en una tx; saldo = reconstrucción
 *   B. 12 movimientos CC concurrentes sobre la misma cuenta → sin lost update
 *   C. dos intereses concurrentes del mismo día → uno solo
 *   D. dos reversiones concurrentes de la misma operación PF → una gana; PF CANCELADO
 *   E. atomicidad PF + CC: fallo después de revertir → nada persiste (CC y PF intactos)
 *   F. cliente con historia → DELETE DENY; cliente vacío → se elimina
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  aplicarInteresCCTx, crearPfDesdeCCTx, eliminarClienteSeguroTx, registrarMovimientoCC, revertirOperacionCCTx,
} from "../src/lib/cc/integridad.service";
import { saldoReconstruido } from "../src/lib/cc/integridad";

const PRODUCTION_HOST_FRAGMENT = "ep-cool-hill-acuymnh3";
const EXPECTED_TEST_HOST_FRAGMENT = "ep-purple-waterfall-act57gj7";
const QA = "qa-m4";

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

const CLI = `${QA}-cliente`, CLI_VACIO = `${QA}-cliente-vacio`, CC_USD = `${QA}-cc-usd`, CC_VACIA = `${QA}-cc-vacia`;

async function saldos(cuentaId: string) {
  const c = await db.cuentaCorriente.findUniqueOrThrow({ where: { id: cuentaId } });
  const movs = await db.movimientoCC.findMany({ where: { cuentaCorrienteId: cuentaId }, select: { tipo: true, monto: true } });
  return { almacenado: Number(c.saldo), reconstruido: saldoReconstruido(movs).toNumber() };
}

async function limpiar() {
  const cuentas = (await db.cuentaCorriente.findMany({ where: { clienteId: { in: [CLI, CLI_VACIO] } }, select: { id: true } })).map((c) => c.id);
  await db.movimientoCC.deleteMany({ where: { cuentaCorrienteId: { in: cuentas } } });
  const pfs = (await db.plazoFijo.findMany({ where: { clienteId: { in: [CLI, CLI_VACIO] } }, select: { id: true } })).map((p) => p.id);
  await db.plazoFijoMovimiento.deleteMany({ where: { plazoFijoId: { in: pfs } } });
  await db.plazoFijo.deleteMany({ where: { id: { in: pfs } } });
  await db.cuentaCorriente.deleteMany({ where: { id: { in: cuentas } } });
  await db.cliente.deleteMany({ where: { id: { in: [CLI, CLI_VACIO] } } });
}

async function main() {
  console.log(`[qa-m4] host confirmado: ${EXPECTED_TEST_HOST_FRAGMENT}`);
  await limpiar();
  await db.cliente.createMany({ data: [
    { id: CLI, nombre: "QA M4 Cliente", activo: false, updatedAt: new Date() },
    { id: CLI_VACIO, nombre: "QA M4 Cliente Vacio", activo: false, updatedAt: new Date() },
  ] });
  await db.cuentaCorriente.createMany({ data: [
    { id: CC_USD, clienteId: CLI, moneda: "USD", saldo: 0, updatedAt: new Date() },
    { id: CC_VACIA, clienteId: CLI_VACIO, moneda: "USD", saldo: 0, updatedAt: new Date() },
  ] });
  const hoy = new Date();
  await db.$transaction((tx) => registrarMovimientoCC(tx, { cuentaId: CC_USD, tipo: "INGRESO", monto: new Decimal(1000), fecha: hoy, descripcion: "QA depósito" }));

  // A. PF desde CC
  const pfA = await db.$transaction((tx) => crearPfDesdeCCTx(tx, {
    clienteId: CLI, moneda: "USD", capital: new Decimal(400), tasaAnual: new Decimal(5),
    fechaInicio: new Date(Date.UTC(2026, 9, 1)), fechaVencimiento: new Date(Date.UTC(2026, 10, 1)),
  }));
  const sA = await saldos(CC_USD);
  const pfRow = await db.plazoFijo.findUniqueOrThrow({ where: { id: pfA.plazoFijoId } });
  check("A. PF desde CC + reconciliación", sA.almacenado === 600 && sA.reconstruido === 600 && pfRow.estado === "ACTIVO" && pfRow.notas === `PF desde CC | op:${pfA.operationRef}`,
    `saldo ${sA.almacenado} / reconstruido ${sA.reconstruido}; PF ${pfRow.estado}`);

  // B. 12 movimientos concurrentes (6 ingresos de 10, 6 egresos de 3) → +42
  const antesB = (await saldos(CC_USD)).almacenado;
  const rB = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => db.$transaction((tx) => registrarMovimientoCC(tx, {
    cuentaId: CC_USD, tipo: i % 2 ? "EGRESO" : "INGRESO", monto: new Decimal(i % 2 ? 3 : 10), fecha: hoy, descripcion: `QA concurrente ${i}`,
  }))));
  const sB = await saldos(CC_USD);
  check("B. movimientos CC concurrentes", rB.every((r) => r.status === "fulfilled") && sB.almacenado - antesB === 42 && sB.almacenado === sB.reconstruido,
    `delta ${sB.almacenado - antesB} (esperado 42); almacenado ${sB.almacenado} = reconstruido ${sB.reconstruido}`);

  // C. dos intereses concurrentes del mismo día
  const inicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  const fin = new Date(inicio.getTime() + 86_400_000);
  const interes = () => db.$transaction((tx) => aplicarInteresCCTx(tx, {
    cuentaId: CC_USD, monto: new Decimal(7), fecha: hoy, descripcion: `INTERES CC | op:${crypto.randomUUID()}`, dedupe: { desde: inicio, hasta: fin, mismoMonto: true },
  }));
  const rC = await Promise.all([interes(), interes()]);
  const nInteres = await db.movimientoCC.count({ where: { cuentaCorrienteId: CC_USD, tipo: "INTERES" } });
  check("C. intereses concurrentes", rC.filter((r) => r.aplicado).length === 1 && nInteres === 1, `aplicados: ${rC.filter((r) => r.aplicado).length}; INTERES en DB: ${nInteres}`);

  // D. doble reversión concurrente del PF
  const antesD = (await saldos(CC_USD)).almacenado;
  const revertir = () => db.$transaction((tx) => revertirOperacionCCTx(tx, { operationRef: pfA.operationRef, fecha: hoy }));
  const rD = await Promise.allSettled([revertir(), revertir()]);
  const inversos = await db.movimientoCC.count({ where: { cuentaCorrienteId: CC_USD, descripcion: { endsWith: `ref:${pfA.operationRef}` } } });
  const pfD = await db.plazoFijo.findUniqueOrThrow({ where: { id: pfA.plazoFijoId } });
  const sD = await saldos(CC_USD);
  check("D. doble reversión concurrente PF+CC", rD.filter((r) => r.status === "fulfilled").length === 1 && inversos === 1 && pfD.estado === "CANCELADO"
    && sD.almacenado - antesD === 400 && sD.almacenado === sD.reconstruido,
    `ok: ${rD.filter((r) => r.status === "fulfilled").length}; inversos: ${inversos}; PF ${pfD.estado}; delta CC ${sD.almacenado - antesD}`);

  // E. atomicidad: fallo después de revertir CC + cancelar PF → nada persiste
  const pfE = await db.$transaction((tx) => crearPfDesdeCCTx(tx, {
    clienteId: CLI, moneda: "USD", capital: new Decimal(100), tasaAnual: new Decimal(5),
    fechaInicio: new Date(Date.UTC(2026, 9, 2)), fechaVencimiento: new Date(Date.UTC(2026, 10, 2)),
  }));
  const antesE = await saldos(CC_USD);
  let falloE = "";
  try {
    await db.$transaction(async (tx) => {
      await revertirOperacionCCTx(tx, { operationRef: pfE.operationRef, fecha: hoy });
      throw new Error("falla simulada después de la reversión");
    });
  } catch (e) { falloE = e instanceof Error ? e.message : String(e); }
  const despuesE = await saldos(CC_USD);
  const pfEDb = await db.plazoFijo.findUniqueOrThrow({ where: { id: pfE.plazoFijoId } });
  check("E. atomicidad PF + CC", falloE.includes("falla simulada") && despuesE.almacenado === antesE.almacenado && despuesE.reconstruido === antesE.reconstruido && pfEDb.estado === "ACTIVO",
    `CC ${antesE.almacenado}→${despuesE.almacenado}; PF ${pfEDb.estado}`);

  // F. eliminación de clientes
  let denyF = "";
  try { await db.$transaction((tx) => eliminarClienteSeguroTx(tx, CLI)); denyF = "BORRADO"; } catch (e) { denyF = e instanceof Error ? e.message : String(e); }
  const sigueF = await db.cliente.count({ where: { id: CLI } });
  await db.$transaction((tx) => eliminarClienteSeguroTx(tx, CLI_VACIO));
  const vacioF = await db.cliente.count({ where: { id: CLI_VACIO } });
  check("F. delete cliente con historia DENY / vacío OK", denyF.includes("historia financiera") && sigueF === 1 && vacioF === 0,
    `con historia: ${denyF.slice(0, 60)}…; vacío borrado: ${vacioF === 0}`);
}

main()
  .catch((e) => check("EJECUCIÓN", false, e instanceof Error ? e.message : String(e)))
  .finally(async () => {
    await limpiar().catch((e) => check("LIMPIEZA", false, String(e)));
    const restos = await db.cliente.count({ where: { id: { startsWith: QA } } })
      + await db.cuentaCorriente.count({ where: { id: { startsWith: QA } } })
      + await db.cuentaCorriente.count({ where: { clienteId: { startsWith: QA } } })
      + await db.plazoFijo.count({ where: { clienteId: { startsWith: QA } } })
      + await db.movimientoCC.count({ where: { cuentaCorrienteId: { startsWith: QA } } });
    check("SIN DATOS QA PERSISTIDOS", restos === 0, `registros QA restantes: ${restos}`);
    await db.$disconnect();
    for (const r of resultados) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.caso} — ${r.detalle}`);
    process.exit(resultados.every((r) => r.ok) ? 0 : 1);
  });
