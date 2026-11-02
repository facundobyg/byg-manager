/**
 * MACRO 3 — QA REAL contra Postgres (TEST V5) de integridad Caja + Cambio.
 *
 * NO es parte de la suite de vitest. Ejecutar manualmente:
 *   npx tsx scripts/qa-m3-caja-cambio-pg.ts
 *
 * Usa EXCLUSIVAMENTE TEST V5 (byg-manager-test-v5 / br-flat-fire-acp039j3) vía
 * TEST_DIRECT_URL de .env.test.local. Verifica el host y aborta si es producción.
 * Fixtures AISLADOS (ids "qa-m3-…", cajas inactivas) creados al inicio y BORRADOS
 * en finally; al final verifica que no quede ningún registro QA.
 *
 * Casos (servicios reales de src/lib/caja/integridad.service.ts, transacciones reales):
 *   A. dos confirmaciones concurrentes del mismo pendiente → una sola aplica
 *   B. dos pagos parciales concurrentes que juntos superan el residual → uno solo
 *   C. pendiente 100 + parcial 30 + confirmar → caja 100
 *   D. doble reversión concurrente de una transferencia → un solo par de reversos
 *   E. transferencia: fallo en la segunda pata → rollback total (0 filas)
 *   F. dos liquidaciones totales concurrentes de la misma operación → una sola
 *   G. cambio + CC: cancelar antes de liquidar → CC exacta al estado previo
 *   H. cambio + CC: liquidar parcial + total, revertir → caja y CC en 0
 *   I. (fix pass L2) cambio entre cajas: 1 op + 2 patas vinculadas; fallo → rollback total
 *   J. (fix pass L3) edición vs liquidación concurrentes → nunca liquidado > total
 *   K. (fix pass L4) parser estricto; sin NaN en montos de caja / saldos de cartera
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  cancelarCambioTx, confirmarPendienteTx, cubrirParcialTx, editarCambioTx, liquidarCambioTx, revertirCambioTx, revertirMovimientoTx,
} from "../src/lib/caja/integridad.service";
import { parseMontoPositivo } from "../src/lib/caja/integridad";

const PRODUCTION_HOST_FRAGMENT = "ep-cool-hill-acuymnh3";
const EXPECTED_TEST_HOST_FRAGMENT = "ep-purple-waterfall-act57gj7";
const QA = "qa-m3";

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

const CAJA_A = `${QA}-caja-a`, CAJA_B = `${QA}-caja-b`, CLIENTE = `${QA}-cliente`;

async function saldo(cajaId: string, moneda: "USD" | "ARS"): Promise<number> {
  const movs = await db.movimientoCaja.findMany({ where: { cajaId, moneda, confirmado: true }, select: { tipo: true, monto: true } });
  return movs.reduce((s, m) => s + Number(m.monto) * (m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN" ? 1 : -1), 0);
}

async function limpiar() {
  const ops = (await db.operacionCambio.findMany({ where: { id: { startsWith: QA } }, select: { id: true } })).map((o) => o.id);
  await db.movimientoCaja.deleteMany({ where: { OR: [{ cajaId: { in: [CAJA_A, CAJA_B] } }, { operacionCambioId: { in: ops } }] } });
  const cuentas = (await db.cuentaCorriente.findMany({ where: { clienteId: CLIENTE }, select: { id: true } })).map((c) => c.id);
  await db.movimientoCC.deleteMany({ where: { cuentaCorrienteId: { in: cuentas } } });
  await db.cuentaCorriente.deleteMany({ where: { clienteId: CLIENTE } });
  await db.operacionCambio.deleteMany({ where: { id: { startsWith: QA } } });
  await db.cliente.deleteMany({ where: { id: CLIENTE } });
  await db.caja.deleteMany({ where: { id: { in: [CAJA_A, CAJA_B] } } });
}

async function pendiente(id: string, monto: number) {
  await db.movimientoCaja.create({ data: { id, cajaId: CAJA_A, tipo: "ENTRADA", moneda: "USD", monto, confirmado: false, fecha: new Date(), descripcion: "QA pendiente" } });
}

async function opCambio(id: string, cantidad: number) {
  await db.operacionCambio.create({
    data: { id, fecha: new Date(), tipo: "COMPRA_USD", moneda: "USD", cantidad, tipoCambio: 1000, totalARS: cantidad * 1000,
      descripcion: "[CC] QA op", pendiente: true, clienteId: CLIENTE, updatedAt: new Date() },
  });
}

async function main() {
  console.log(`[qa-m3] host confirmado: ${EXPECTED_TEST_HOST_FRAGMENT}`);
  await limpiar();
  await db.caja.createMany({ data: [
    { id: CAJA_A, slug: `${QA}-a`, label: "QA A", tipo: "CENTRAL_CONTABLE", activa: false, saldoInicialUSD: 1000, saldoInicialARS: 0 },
    { id: CAJA_B, slug: `${QA}-b`, label: "QA B", tipo: "SUCURSAL_OPERATIVA", activa: false },
  ] });
  await db.cliente.create({ data: { id: CLIENTE, nombre: "QA M3 Cliente", activo: false, updatedAt: new Date() } });

  // A. dos confirmaciones concurrentes
  await pendiente(`${QA}-pa`, 100);
  const confirmar = () => db.$transaction((tx) => confirmarPendienteTx(tx, { movimientoId: `${QA}-pa`, cajaEsperada: CAJA_A, userName: "qa" }));
  const rA = await Promise.allSettled([confirmar(), confirmar()]);
  const okA = rA.filter((r) => r.status === "fulfilled").length;
  const impactoA = await saldo(CAJA_A, "USD"); // solo movimientos (sin saldo inicial)
  check("A. confirmación concurrente", okA === 1 && impactoA === 100, `${okA} aplicada(s); impacto en caja ${impactoA}`);

  // B. dos parciales concurrentes 60 + 60 sobre 100
  await pendiente(`${QA}-pb`, 100);
  const cubrir = (n: string) => db.$transaction((tx) => cubrirParcialTx(tx, {
    movimientoId: `${QA}-pb`, cajaOriginalEsperada: CAJA_A, cajaPagoId: CAJA_A, monto: new Decimal(60), userName: "qa", pagoId: `${QA}-pago-${n}`,
  }));
  const rB = await Promise.allSettled([cubrir("1"), cubrir("2")]);
  const pagosB = await db.movimientoCaja.count({ where: { pagoDeId: `${QA}-pb` } });
  check("B. parciales concurrentes", rB.filter((r) => r.status === "fulfilled").length === 1 && pagosB === 1, `pagos creados: ${pagosB}`);

  // C. 100 + 30 + confirmar → 100
  await pendiente(`${QA}-pc`, 100);
  const antesC = await saldo(CAJA_A, "USD");
  await db.$transaction((tx) => cubrirParcialTx(tx, { movimientoId: `${QA}-pc`, cajaOriginalEsperada: CAJA_A, cajaPagoId: CAJA_A, monto: new Decimal(30), userName: "qa", pagoId: `${QA}-pago-c` }));
  await db.$transaction((tx) => confirmarPendienteTx(tx, { movimientoId: `${QA}-pc`, cajaEsperada: CAJA_A, userName: "qa" }));
  check("C. parcial + confirmar", (await saldo(CAJA_A, "USD")) - antesC === 100, `impacto total ${(await saldo(CAJA_A, "USD")) - antesC}`);

  // D. doble reversión concurrente de una transferencia
  const ref = `${QA}-tref`;
  await db.movimientoCaja.createMany({ data: [
    { id: `${QA}-t-out`, cajaId: CAJA_A, tipo: "TRANSFERENCIA_OUT", moneda: "USD", monto: 50, confirmado: true, fecha: new Date(), transferenciaRef: ref, descripcion: "TRANSFERENCIA | QA" },
    { id: `${QA}-t-in`, cajaId: CAJA_B, tipo: "TRANSFERENCIA_IN", moneda: "USD", monto: 50, confirmado: true, fecha: new Date(), transferenciaRef: ref, descripcion: "TRANSFERENCIA | QA" },
  ] });
  const revertir = (id: string) => db.$transaction((tx) => revertirMovimientoTx(tx, { movimientoId: id, cajasAutorizadas: [CAJA_A, CAJA_B] }));
  const rD = await Promise.allSettled([revertir(`${QA}-t-out`), revertir(`${QA}-t-in`)]);
  const reversosD = await db.movimientoCaja.count({ where: { descripcion: { startsWith: "REVERSO | ref:qa-m3-t-" } } });
  check("D. doble reversión concurrente", rD.filter((r) => r.status === "fulfilled").length === 1 && reversosD === 2,
    `reversos: ${reversosD}; saldo B ${await saldo(CAJA_B, "USD")}`);

  // E. atomicidad: falla la segunda pata → rollback total
  try {
    await db.$transaction(async (tx) => {
      await tx.movimientoCaja.create({ data: { id: `${QA}-e-out`, cajaId: CAJA_A, tipo: "TRANSFERENCIA_OUT", moneda: "USD", monto: 10, confirmado: true, fecha: new Date(), transferenciaRef: `${QA}-e` } });
      await tx.movimientoCaja.create({ data: { id: `${QA}-e-in`, cajaId: `${QA}-caja-inexistente`, tipo: "TRANSFERENCIA_IN", moneda: "USD", monto: 10, confirmado: true, fecha: new Date(), transferenciaRef: `${QA}-e` } });
    });
    check("E. atomicidad transferencia", false, "la segunda pata no falló");
  } catch {
    const n = await db.movimientoCaja.count({ where: { transferenciaRef: `${QA}-e` } });
    check("E. atomicidad transferencia", n === 0, `filas tras rollback: ${n}`);
  }

  // F. dos liquidaciones totales concurrentes
  await opCambio(`${QA}-op-f`, 100);
  const liquidar = () => db.$transaction((tx) => liquidarCambioTx(tx, {
    opId: `${QA}-op-f`, items: "TOTAL", cajaTotalId: CAJA_B, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "qa",
  }));
  const rF = await Promise.allSettled([liquidar(), liquidar()]);
  const patasF = await db.movimientoCaja.count({ where: { operacionCambioId: `${QA}-op-f` } });
  check("F. liquidación concurrente", rF.filter((r) => r.status === "fulfilled").length === 1 && patasF === 2, `patas: ${patasF}`);

  // G. cambio + CC: cancelar antes de liquidar → CC exacta al estado previo
  await opCambio(`${QA}-op-g`, 100);
  const cc = await db.cuentaCorriente.create({ data: { id: `${QA}-cc-usd`, clienteId: CLIENTE, moneda: "USD", saldo: 0, updatedAt: new Date() } });
  await db.$transaction(async (tx) => {   // efecto CC de la creación (como crearOperacionCambio)
    await tx.cuentaCorriente.update({ where: { id: cc.id }, data: { saldo: { increment: -100 } } });
    await tx.movimientoCC.create({ data: { id: `${QA}-ccm-g`, cuentaCorrienteId: cc.id, fecha: new Date(), tipo: "EGRESO", monto: 100, operacionCambioId: `${QA}-op-g`, descripcion: `QA | op:${QA}-op-g` } });
  });
  await db.$transaction((tx) => cancelarCambioTx(tx, { opId: `${QA}-op-g`, fecha: new Date() }));
  const ccG = Number((await db.cuentaCorriente.findUnique({ where: { id: cc.id } }))!.saldo);
  const opG = await db.operacionCambio.count({ where: { id: `${QA}-op-g` } });
  let dobleG = "";
  try { await db.$transaction((tx) => cancelarCambioTx(tx, { opId: `${QA}-op-g`, fecha: new Date() })); dobleG = "aplicó dos veces"; }
  catch (e) { dobleG = e instanceof Error ? e.message : "rechazada"; }
  check("G. cancelar cambio + CC", ccG === 0 && opG === 0 && dobleG === "Operación no encontrada", `saldo CC ${ccG}; segunda cancelación: ${dobleG}`);

  // H. cambio + CC: liquidar parcial + total, revertir → todo en 0
  await opCambio(`${QA}-op-h`, 100);
  await db.$transaction(async (tx) => {
    await tx.cuentaCorriente.update({ where: { id: cc.id }, data: { saldo: { increment: -100 } } });
    await tx.movimientoCC.create({ data: { id: `${QA}-ccm-h`, cuentaCorrienteId: cc.id, fecha: new Date(), tipo: "EGRESO", monto: 100, operacionCambioId: `${QA}-op-h`, descripcion: `QA | op:${QA}-op-h` } });
  });
  const antesH = { aUSD: await saldo(CAJA_A, "USD"), aARS: await saldo(CAJA_A, "ARS"), bUSD: await saldo(CAJA_B, "USD"), bARS: await saldo(CAJA_B, "ARS") };
  await db.$transaction((tx) => liquidarCambioTx(tx, { opId: `${QA}-op-h`, items: [{ cajaId: CAJA_A, div: new Decimal(30), ars: null }], fecha: new Date(), etiqueta: "Cobro Cambio", userName: "qa" }));
  await db.$transaction((tx) => liquidarCambioTx(tx, { opId: `${QA}-op-h`, items: "TOTAL", cajaTotalId: CAJA_B, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "qa" }));
  let sobre = "";
  try { await db.$transaction((tx) => liquidarCambioTx(tx, { opId: `${QA}-op-h`, items: [{ cajaId: CAJA_A, div: new Decimal(1), ars: null }], fecha: new Date(), etiqueta: "Cobro Cambio", userName: "qa" })); sobre = "aplicó"; }
  catch (e) { sobre = e instanceof Error ? e.message : "rechazada"; }
  await db.$transaction((tx) => revertirCambioTx(tx, { opId: `${QA}-op-h`, revertidoPor: "qa", fecha: new Date(), cajasAutorizadas: [CAJA_A, CAJA_B] }));
  const despuesH = { aUSD: await saldo(CAJA_A, "USD"), aARS: await saldo(CAJA_A, "ARS"), bUSD: await saldo(CAJA_B, "USD"), bARS: await saldo(CAJA_B, "ARS") };
  const ccH = Number((await db.cuentaCorriente.findUnique({ where: { id: cc.id } }))!.saldo);
  const iguales = JSON.stringify(antesH) === JSON.stringify(despuesH);
  check("H. sobreliquidación DENY + reversa caja + CC", iguales && ccH === 0 && sobre !== "aplicó",
    `cajas antes=después: ${iguales}; CC ${ccH}; sobreliquidación: ${sobre}`);

  // I. L2 — cambio entre cajas: OperacionCambio + 2 patas vinculadas en UNA tx; fallo → rollback total
  const cambioEntreCajas = (id: string, falla: boolean) => db.$transaction(async (tx) => {
    await tx.operacionCambio.create({ data: {
      id, fecha: new Date(), tipo: "COMPRA_USD", moneda: "USD", cantidad: 10, tipoCambio: new Decimal("1234.5678"), totalARS: new Decimal("12345.68"),
      cobroUSD: 10, cobroARS: new Decimal("12345.68"), descripcion: "QA cambio entre cajas", pendiente: true, updatedAt: new Date(),
    } });
    await liquidarCambioTx(tx, {
      opId: id, items: [{ cajaId: CAJA_A, cajaArsId: CAJA_B, div: new Decimal(10), ars: new Decimal("12345.68") }],
      fecha: new Date(), etiqueta: "Cambio", userName: "qa",
    });
    if (falla) throw new Error("falla simulada después de las patas");
  });
  await cambioEntreCajas(`${QA}-op-i`, false);
  const opI = await db.operacionCambio.findUnique({ where: { id: `${QA}-op-i` } });
  const patasI = await db.movimientoCaja.findMany({ where: { operacionCambioId: `${QA}-op-i` } });
  const usdI = patasI.find((m) => m.moneda === "USD"), arsI = patasI.find((m) => m.moneda === "ARS");
  const okI = !!opI && !opI.pendiente && patasI.length === 2 && patasI.every((m) => m.transferenciaRef === null && m.confirmado)
    && usdI?.cajaId === CAJA_A && usdI.tipo === "ENTRADA" && Number(usdI.monto) === 10
    && arsI?.cajaId === CAJA_B && arsI.tipo === "SALIDA" && arsI.monto.toString() === "12345.68";
  let rollbackI = -1;
  try { await cambioEntreCajas(`${QA}-op-i2`, true); } catch {
    rollbackI = (await db.operacionCambio.count({ where: { id: `${QA}-op-i2` } })) + (await db.movimientoCaja.count({ where: { operacionCambioId: `${QA}-op-i2` } }));
  }
  check("I. L2 cambio entre cajas: 1 op + 2 patas; rollback", okI && rollbackI === 0,
    `op liquidada: ${opI ? !opI.pendiente : "no existe"}; patas: ${patasI.length}; filas tras fallo: ${rollbackI}`);

  // J. L3 — edición vs liquidación concurrentes (servicio real editarCambioTx): nunca liquidado > total
  const rondasJ: string[] = [];
  let okJ = true;
  for (let i = 0; i < 6; i++) {
    const id = `${QA}-op-j${i}`;
    await opCambio(id, 100);
    const editar = () => db.$transaction((tx) => editarCambioTx(tx, { opId: id, fecha: null, cantidad: new Decimal(40), tipoCambio: null, cobro: null }));
    const liquidar = () => db.$transaction((tx) => liquidarCambioTx(tx, {
      opId: id, items: i % 2 === 0 ? [{ cajaId: CAJA_A, div: new Decimal(60), ars: null }] : "TOTAL", cajaTotalId: CAJA_A,
      fecha: new Date(), etiqueta: "Cobro Cambio", userName: "qa",
    }));
    const r = await Promise.allSettled(i < 3 ? [editar(), liquidar()] : [liquidar(), editar()]);
    const op = (await db.operacionCambio.findUnique({ where: { id } }))!;
    const patas = await db.movimientoCaja.findMany({ where: { operacionCambioId: id, moneda: "USD" } });
    const liquidado = patas.reduce((s, m) => s + Number(m.monto) * (m.tipo === "ENTRADA" ? 1 : -1), 0);
    const exitos = r.filter((x) => x.status === "fulfilled").length;
    const ok = liquidado <= Number(op.cantidad) && exitos >= 1;
    okJ &&= ok;
    rondasJ.push(`${i}:${exitos}ok liq=${liquidado}/tot=${Number(op.cantidad)}`);
  }
  check("J. L3 edición vs liquidación concurrente", okJ, rondasJ.join("; "));

  // K. L4 — el parser rechaza todo formato no decimal; la DB no contiene NaN/Infinity en montos de caja ni saldos de cartera
  const malos = ["0", "-5", "NaN", "Infinity", "0x10", "0b101", "0o17", "1e3", "12abc"];
  const aceptados = malos.filter((v) => parseMontoPositivo(v) !== null);
  const [{ n }] = await db.$queryRaw<{ n: bigint }[]>`
    SELECT (SELECT count(*) FROM "MovimientoCaja" WHERE monto = 'NaN'::numeric)
         + (SELECT count(*) FROM "Cartera" WHERE "saldoUSDCable" = 'NaN'::numeric OR "saldoUSDMep" = 'NaN'::numeric OR "saldoPesos" = 'NaN'::numeric) AS n`;
  check("K. L4 parser estricto / sin NaN en DB", aceptados.length === 0 && Number(n) === 0 && parseMontoPositivo("1500,50")?.toString() === "1500.5",
    `formatos aceptados: ${aceptados.length}; filas NaN en DB: ${Number(n)}`);
}

main()
  .catch((e) => check("EJECUCIÓN", false, e instanceof Error ? e.message : String(e)))
  .finally(async () => {
    await limpiar().catch((e) => check("LIMPIEZA", false, String(e)));
    const restos = await db.movimientoCaja.count({ where: { OR: [{ cajaId: { in: [CAJA_A, CAJA_B] } }, { id: { startsWith: QA } }] } })
      + await db.operacionCambio.count({ where: { id: { startsWith: QA } } })
      + await db.caja.count({ where: { id: { in: [CAJA_A, CAJA_B] } } })
      + await db.cliente.count({ where: { id: CLIENTE } });
    check("SIN DATOS QA PERSISTIDOS", restos === 0, `registros QA restantes: ${restos}`);
    await db.$disconnect();
    for (const r of resultados) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.caso} — ${r.detalle}`);
    process.exit(resultados.every((r) => r.ok) ? 0 : 1);
  });
