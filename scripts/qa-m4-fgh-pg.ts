/**
 * MACRO 4 — FIX PASS F/G/H — QA REAL contra Postgres (TEST V5).
 *
 * NO es parte de la suite de vitest. Ejecutar manualmente:
 *   npx tsx scripts/qa-m4-fgh-pg.ts
 *
 * Usa EXCLUSIVAMENTE TEST V5 vía TEST_DIRECT_URL de .env.test.local; verifica el
 * host y aborta si es producción. Fixtures AISLADOS (ids "qa-m4fgh-…", cliente y
 * caja inactivos) BORRADOS en finally; al final verifica 0 registros QA.
 *
 * Casos (servicios reales, transacciones reales):
 *   H. CC + caja: crear → revertir conjunto (CC 0, caja 0); doble reversión
 *      concurrente → una gana; fallo después de la reversa → rollback total
 *   G. CC de OperacionCambio: reversa desde CC → DENY sin cambios; reversa desde
 *      Cambio → CC y caja neutralizadas una vez; segunda → DENY
 *   F. liquidación de interés vs movimiento concurrente dentro del período, en los
 *      dos órdenes serializables (forzados): el monto persistido = cálculo sobre la
 *      vista que corresponde al orden real; nunca el cálculo viejo
 *   F0. liquidación aislada con movimiento intermedio = ORÁCULO diario independiente
 *
 * `--solo-f`: corre solo F0 / F-A / F-B / F3 (no repite H y G).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  crearMovimientoCCTx, liquidarInteresCCTx, registrarMovimientoCC, revertirOperacionCCTx,
} from "../src/lib/cc/integridad.service";
import { liquidarCambioTx, revertirCambioTx } from "../src/lib/caja/integridad.service";
import { deltaMovCC, saldoReconstruido } from "../src/lib/cc/integridad";

const PRODUCTION_HOST_FRAGMENT = "ep-cool-hill-acuymnh3";
const EXPECTED_TEST_HOST_FRAGMENT = "ep-purple-waterfall-act57gj7";
const QA = "qa-m4fgh";

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
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SOLO_F = process.argv.includes("--solo-f");
const CLI = `${QA}-cliente`, CLI2 = `${QA}-cliente2`, CAJA = `${QA}-caja`;
const CC = { h: `${QA}-cc-h`, gUsd: `${QA}-cc-g-usd`, gArs: `${QA}-cc-g-ars`, fa: `${QA}-cc-fa`, fb: `${QA}-cc-fb`, f0: `${QA}-cc-f0` };
const OP_G = `${QA}-op-g`;
const D = (v: Decimal.Value) => new Decimal(v);
const UTC = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

async function saldoCC(id: string) {
  const c = await db.cuentaCorriente.findUniqueOrThrow({ where: { id } });
  const movs = await db.movimientoCC.findMany({ where: { cuentaCorrienteId: id }, select: { tipo: true, monto: true } });
  return { almacenado: Number(c.saldo), reconstruido: saldoReconstruido(movs).toNumber() };
}
async function saldoCaja(moneda: "USD" | "ARS") {
  const movs = await db.movimientoCaja.findMany({ where: { cajaId: CAJA, moneda, confirmado: true }, select: { tipo: true, monto: true } });
  return movs.reduce((s, m) => s + Number(m.monto) * (m.tipo === "ENTRADA" ? 1 : -1), 0);
}

/**
 * ORÁCULO INDEPENDIENTE (no usa calcularInteresCCRealista): día por día de
 * [ini, fin), saldo vigente = movimientos no-INTERES con fecha ≤ ese día; interés
 * del día = saldo > 0 ? saldo × tasa / 365 : 0. Sin redondear.
 */
function interesEsperado(movs: { fecha: Date; tipo: string; monto: Decimal }[], ini: Date, fin: Date, tasa: Decimal): Decimal {
  let total = D(0);
  for (let d = ini; d < fin; d = new Date(d.getTime() + 86_400_000)) {
    const saldo = movs.filter((m) => m.tipo !== "INTERES" && m.fecha <= d).reduce((s, m) => s.plus(deltaMovCC(m.tipo, m.monto)), D(0));
    if (saldo.gt(0)) total = total.plus(saldo.mul(tasa).div(365));
  }
  return total;
}
/** Persistido (2 decimales) = oráculo redondeado: |dif| ≤ medio centavo. */
const cerca = (persistido: Decimal, oraculo: Decimal) => persistido.minus(oraculo).abs().lte("0.005000001");

async function limpiar() {
  const cuentas = Object.values(CC);
  await db.movimientoCC.deleteMany({ where: { cuentaCorrienteId: { in: cuentas } } });
  await db.movimientoCaja.deleteMany({ where: { OR: [{ cajaId: CAJA }, { operacionCambioId: OP_G }] } });
  await db.operacionCambio.deleteMany({ where: { id: OP_G } });
  await db.cuentaCorriente.deleteMany({ where: { id: { in: cuentas } } });
  await db.cliente.deleteMany({ where: { id: { in: [CLI, CLI2] } } });
  await db.caja.deleteMany({ where: { id: CAJA } });
}

async function main() {
  console.log(`[qa-m4fgh] host confirmado: ${EXPECTED_TEST_HOST_FRAGMENT}`);
  await limpiar();
  await db.caja.create({ data: { id: CAJA, slug: `${QA}-caja`, label: "QA M4 FGH", tipo: "CENTRAL_CONTABLE", activa: false } });
  await db.cliente.createMany({ data: [
    { id: CLI, nombre: "QA M4 FGH", activo: false, updatedAt: new Date() },
    { id: CLI2, nombre: "QA M4 FGH 2", activo: false, updatedAt: new Date() },
  ] });
  // Una cuenta por caso (unique cliente+moneda): las de G y F usan otros clientes lógicos vía moneda distinta.
  await db.cuentaCorriente.createMany({ data: [
    { id: CC.h, clienteId: CLI, moneda: "USD", saldo: 0, updatedAt: new Date() },
    { id: CC.gArs, clienteId: CLI, moneda: "ARS", saldo: 0, updatedAt: new Date() },
    { id: CC.fa, clienteId: CLI, moneda: "EUR", saldo: 0, updatedAt: new Date() },
    { id: CC.fb, clienteId: CLI, moneda: "BRL", saldo: 0, updatedAt: new Date() },
    { id: CC.f0, clienteId: CLI2, moneda: "USD", saldo: 0, updatedAt: new Date() },
  ] });
  const hoy = UTC(2026, 10, 15);

  if (!SOLO_F) {
  // ── H ──
  const { operationRef: refH } = await db.$transaction((tx) => crearMovimientoCCTx(tx, {
    cuentaId: CC.h, tipo: "INGRESO", monto: D(100), fecha: hoy, descripcion: "QA depósito", cajaImpactoId: CAJA,
  }));
  const h0 = { cc: (await saldoCC(CC.h)).almacenado, caja: await saldoCaja("USD") };
  // fallo forzado después de crear las dos reversas → rollback total
  let falloH = "";
  try {
    await db.$transaction(async (tx) => {
      await revertirOperacionCCTx(tx, { operationRef: refH!, fecha: hoy, cajasAutorizadas: [CAJA] });
      throw new Error("falla simulada");
    });
  } catch (e) { falloH = e instanceof Error ? e.message : String(e); }
  const h1 = { cc: (await saldoCC(CC.h)).almacenado, caja: await saldoCaja("USD"), movsCC: await db.movimientoCC.count({ where: { cuentaCorrienteId: CC.h } }), movsCaja: await db.movimientoCaja.count({ where: { cajaId: CAJA } }) };
  // doble reversión concurrente
  const rev = () => db.$transaction((tx) => revertirOperacionCCTx(tx, { operationRef: refH!, fecha: hoy, cajasAutorizadas: [CAJA] }));
  const rH = await Promise.allSettled([rev(), rev()]);
  const sH = await saldoCC(CC.h);
  const h2 = { cc: sH.almacenado, caja: await saldoCaja("USD"), movsCC: await db.movimientoCC.count({ where: { cuentaCorrienteId: CC.h } }), movsCaja: await db.movimientoCaja.count({ where: { cajaId: CAJA } }) };
  check("H. CC + caja: creación, rollback, reversa conjunta, doble reversión",
    h0.cc === 100 && h0.caja === 100 && falloH === "falla simulada" && h1.cc === 100 && h1.caja === 100 && h1.movsCC === 1 && h1.movsCaja === 1
    && rH.filter((r) => r.status === "fulfilled").length === 1 && h2.cc === 0 && h2.caja === 0 && sH.reconstruido === 0 && h2.movsCC === 2 && h2.movsCaja === 2,
    `creado CC ${h0.cc}/caja ${h0.caja}; tras fallo CC ${h1.cc}/caja ${h1.caja} (${h1.movsCC}+${h1.movsCaja} filas); concurrente ok=${rH.filter((r) => r.status === "fulfilled").length}; final CC ${h2.cc}/caja ${h2.caja} (${h2.movsCC}+${h2.movsCaja} filas)`);

  // ── G ──
  const ccUsdG = (await db.cuentaCorriente.findFirst({ where: { clienteId: CLI, moneda: "USD" } }))!.id;
  await db.operacionCambio.create({ data: {
    id: OP_G, fecha: hoy, tipo: "COMPRA_USD", moneda: "USD", cantidad: 10, tipoCambio: 1000, totalARS: 10000, cobroUSD: 10, cobroARS: 10000,
    descripcion: "[CC] QA op", pendiente: true, clienteId: CLI, updatedAt: new Date(),
  } });
  await db.$transaction(async (tx) => { // CC como crearOperacionCambio: patas con operacionCambioId + op:<id>
    await registrarMovimientoCC(tx, { cuentaId: ccUsdG, tipo: "EGRESO", monto: D(10), fecha: hoy, descripcion: `Compra USD 10 — Op Cambio | op:${OP_G}`, operacionCambioId: OP_G });
    await registrarMovimientoCC(tx, { cuentaId: CC.gArs, tipo: "INGRESO", monto: D(10000), fecha: hoy, descripcion: `Contrapartida ARS | op:${OP_G}`, operacionCambioId: OP_G });
  });
  await db.$transaction((tx) => liquidarCambioTx(tx, { opId: OP_G, items: "TOTAL", cajaTotalId: CAJA, fecha: hoy, etiqueta: "Cambio", userName: "qa" }));
  const g0 = { usd: (await saldoCC(ccUsdG)).almacenado, ars: (await saldoCC(CC.gArs)).almacenado, cajaUsd: await saldoCaja("USD"), cajaArs: await saldoCaja("ARS"), movsCC: await db.movimientoCC.count({ where: { operacionCambioId: OP_G } }) };
  let denyG = "";
  try { await db.$transaction((tx) => revertirOperacionCCTx(tx, { operationRef: OP_G, fecha: hoy })); denyG = "APLICÓ"; } catch (e) { denyG = e instanceof Error ? e.message : String(e); }
  const opG1 = await db.operacionCambio.findUniqueOrThrow({ where: { id: OP_G } });
  const g1 = { usd: (await saldoCC(ccUsdG)).almacenado, ars: (await saldoCC(CC.gArs)).almacenado, cajaUsd: await saldoCaja("USD"), cajaArs: await saldoCaja("ARS"), movsCC: await db.movimientoCC.count({ where: { operacionCambioId: OP_G } }) };
  await db.$transaction((tx) => revertirCambioTx(tx, { opId: OP_G, revertidoPor: "qa", fecha: hoy, cajasAutorizadas: [CAJA] }));
  let segunda = "";
  try { await db.$transaction((tx) => revertirCambioTx(tx, { opId: OP_G, revertidoPor: "qa", fecha: hoy, cajasAutorizadas: [CAJA] })); segunda = "APLICÓ"; } catch (e) { segunda = e instanceof Error ? e.message : String(e); }
  const g2 = { usd: (await saldoCC(ccUsdG)).almacenado, ars: (await saldoCC(CC.gArs)).almacenado, cajaUsd: await saldoCaja("USD"), cajaArs: await saldoCaja("ARS") };
  check("G. CC de OperacionCambio: DENY desde CC; neutraliza una vez desde Cambio",
    denyG.startsWith("Esta cuenta corriente pertenece a una operación de cambio") && JSON.stringify(g0) === JSON.stringify(g1) && opG1.descripcion === "[CC] QA op"
    && segunda.includes("ya fue revertida") && g2.usd === g0.usd + 10 && g2.ars === g0.ars - 10000 && g2.cajaUsd === g0.cajaUsd - 10 && g2.cajaArs === g0.cajaArs + 10000,
    `DENY CC: ${denyG.slice(0, 45)}…; sin cambios: ${JSON.stringify(g0) === JSON.stringify(g1)}; tras Cambio CC usd ${g0.usd}→${g2.usd}, ars ${g0.ars}→${g2.ars}, caja usd ${g0.cajaUsd}→${g2.cajaUsd}; 2ª: ${segunda.slice(0, 30)}`);

  }

  // ── F ──
  const ini = UTC(2026, 9, 1), fin = UTC(2026, 9, 30), tasa = D("0.5");
  const fMov = (cuentaId: string) => (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) =>
    registrarMovimientoCC(tx, { cuentaId, tipo: "EGRESO", monto: D(500000), fecha: UTC(2026, 9, 10), descripcion: "QA movimiento concurrente en el período" });
  for (const id of [CC.fa, CC.fb]) {
    await db.$transaction((tx) => registrarMovimientoCC(tx, { cuentaId: id, tipo: "INGRESO", monto: D(1000000), fecha: UTC(2026, 8, 1), descripcion: "QA depósito previo" }));
    // Segundo corte posterior al movimiento concurrente (cubre también el tramo final).
    await db.$transaction((tx) => registrarMovimientoCC(tx, { cuentaId: id, tipo: "INGRESO", monto: D(1), fecha: UTC(2026, 9, 20), descripcion: "QA corte posterior" }));
  }
  const movsDe = async (id: string) => (await db.movimientoCC.findMany({ where: { cuentaCorrienteId: id } })).map((m) => ({ fecha: m.fecha, tipo: m.tipo as string, monto: D(m.monto.toString()), descripcion: m.descripcion, id: m.id }));

  // F0: liquidación aislada con movimiento intermedio vs oráculo diario.
  await db.$transaction(async (tx) => {
    await registrarMovimientoCC(tx, { cuentaId: CC.f0, tipo: "INGRESO", monto: D(1000000), fecha: UTC(2026, 8, 15), descripcion: "QA saldo conocido" });
    await registrarMovimientoCC(tx, { cuentaId: CC.f0, tipo: "EGRESO", monto: D(500000), fecha: UTC(2026, 9, 10), descripcion: "QA egreso intermedio" });
  });
  const r0 = await db.$transaction((tx) => liquidarInteresCCTx(tx, { cuentaId: CC.f0, fechaInicio: ini, fechaFin: fin, tasa, interesAplicado: D(0) }));
  const movs0 = await movsDe(CC.f0);
  const int0 = movs0.find((m) => m.tipo === "INTERES")!;
  const oraculo0 = interesEsperado(movs0, ini, fin, tasa);
  const manual0 = D(9 * 1_000_000 + 20 * 500_000).mul(tasa).div(365); // 9 días a 1.000.000 + 20 días a 500.000
  const s0 = await saldoCC(CC.f0);
  check("F0. interés persistido = oráculo diario independiente",
    cerca(int0.monto, oraculo0) && oraculo0.minus(manual0).abs().lt("0.000001") && D(r0.interesCalculado).minus(oraculo0).abs().lt("0.000001") && int0.fecha.getTime() === fin.getTime() && s0.almacenado === s0.reconstruido,
    `persistido ${int0.monto} ; oráculo ${oraculo0.toFixed(6)} ; manual ${manual0.toFixed(6)} ; fecha ${int0.fecha.toISOString().slice(0, 10)}`);

  // Orden A: T1 (liquidación) toma el lock primero y lo retiene; T2 (movimiento) espera.
  const sinT2 = interesEsperado(await movsDe(CC.fa), ini, fin, tasa);
  let liberarA!: () => void; const t1Tomo = new Promise<void>((r) => { liberarA = r; });
  const orden: string[] = [];
  const t1A = db.$transaction(async (tx) => {
    const r = await liquidarInteresCCTx(tx, { cuentaId: CC.fa, fechaInicio: ini, fechaFin: fin, tasa, interesAplicado: D(0) });
    liberarA(); await sleep(1200); orden.push("T1 commit");
    return r;
  }, { timeout: 15000 });
  await t1Tomo;
  const t2A = db.$transaction(async (tx) => { await fMov(CC.fa)(tx); orden.push("T2 escribió"); }, { timeout: 15000 });
  const [rA] = await Promise.all([t1A, t2A]);
  const movsA = await movsDe(CC.fa);
  const intA = movsA.find((m) => m.tipo === "INTERES")!;
  const conT2A = interesEsperado(movsA.filter((m) => m.tipo !== "INTERES"), ini, fin, tasa);
  const sA = await saldoCC(CC.fa);
  check("F-A. T1 gana el lock: calcula sin T2; T2 entra después",
    orden.join(">") === "T1 commit>T2 escribió" && cerca(intA.monto, sinT2) && D(rA.interesCalculado).minus(sinT2).abs().lt("0.000001") && conT2A.minus(sinT2).abs().gt(1) && sA.almacenado === sA.reconstruido,
    `orden ${orden.join(" > ")}; interés ${intA.monto} = oráculo sin T2 ${sinT2.toFixed(2)} (con T2 sería ${conT2A.toFixed(2)})`);

  // Orden B: T2 (movimiento) toma la fila primero y la retiene; T1 espera y recalcula con T2.
  let liberarB!: () => void; const t2Tomo = new Promise<void>((r) => { liberarB = r; });
  const ordenB: string[] = [];
  const t2B = db.$transaction(async (tx) => { await fMov(CC.fb)(tx); liberarB(); await sleep(1200); ordenB.push("T2 commit"); }, { timeout: 15000 });
  await t2Tomo;
  const t1B = db.$transaction(async (tx) => {
    const r = await liquidarInteresCCTx(tx, { cuentaId: CC.fb, fechaInicio: ini, fechaFin: fin, tasa, interesAplicado: D(0) });
    ordenB.push("T1 calculó");
    return r;
  }, { timeout: 15000 });
  const [, rB] = await Promise.all([t2B, t1B]);
  const movsB = await movsDe(CC.fb);
  const intB = movsB.find((m) => m.tipo === "INTERES")!;
  const conT2B = interesEsperado(movsB.filter((m) => m.tipo !== "INTERES"), ini, fin, tasa);
  const sinT2B = interesEsperado(movsB.filter((m) => m.tipo !== "INTERES" && m.descripcion !== "QA movimiento concurrente en el período"), ini, fin, tasa);
  const sB = await saldoCC(CC.fb);
  check("F-B. T2 gana: T1 espera el lock y recalcula incluyendo T2",
    ordenB.join(">") === "T2 commit>T1 calculó" && cerca(intB.monto, conT2B) && D(rB.interesCalculado).minus(conT2B).abs().lt("0.000001") && conT2B.minus(sinT2B).abs().gt(1) && sB.almacenado === sB.reconstruido,
    `orden ${ordenB.join(" > ")}; interés ${intB.monto} = oráculo con T2 ${conT2B.toFixed(2)} (sin T2 sería ${sinT2B.toFixed(2)})`);

  // F3: duplicado del mismo período sigue rechazado
  let dup = "";
  try { await db.$transaction((tx) => liquidarInteresCCTx(tx, { cuentaId: CC.fb, fechaInicio: ini, fechaFin: fin, tasa, interesAplicado: D(0) })); dup = "APLICÓ"; } catch (e) { dup = e instanceof Error ? e.message : String(e); }
  check("F3. duplicado del período rechazado", (dup.includes("ya fue liquidado") || dup.includes("liquidado hasta")) && (await db.movimientoCC.count({ where: { cuentaCorrienteId: CC.fb, tipo: "INTERES" } })) === 1, dup);
}

main()
  .catch((e) => check("EJECUCIÓN", false, e instanceof Error ? e.message : String(e)))
  .finally(async () => {
    await limpiar().catch((e) => check("LIMPIEZA", false, String(e)));
    const restos = await db.cliente.count({ where: { id: { startsWith: QA } } })
      + await db.caja.count({ where: { id: { startsWith: QA } } })
      + await db.cuentaCorriente.count({ where: { OR: [{ id: { startsWith: QA } }, { clienteId: { startsWith: QA } }] } })
      + await db.movimientoCC.count({ where: { cuentaCorrienteId: { startsWith: QA } } })
      + await db.movimientoCaja.count({ where: { OR: [{ cajaId: { startsWith: QA } }, { operacionCambioId: { startsWith: QA } }] } })
      + await db.operacionCambio.count({ where: { id: { startsWith: QA } } });
    check("SIN DATOS QA PERSISTIDOS", restos === 0, `registros QA restantes: ${restos}`);
    await db.$disconnect();
    for (const r of resultados) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.caso} — ${r.detalle}`);
    process.exit(resultados.every((r) => r.ok) ? 0 : 1);
  });
