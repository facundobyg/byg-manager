/**
 * MACRO 6 — PRE-BETA QA — suite transversal contra Postgres REAL (TEST V5).
 *
 * NO es parte de la suite de vitest. Ejecutar manualmente:
 *   npx tsx scripts/qa-m6-prebeta-pg.ts
 *
 * Usa EXCLUSIVAMENTE TEST V5 vía TEST_DIRECT_URL de .env.test.local; verifica el
 * host y aborta si es producción. Fixtures AISLADOS ("qa-m6-…", cajas / cartera /
 * clientes inactivos) BORRADOS en finally; al final verifica 0 registros QA.
 *
 * Servicios reales + transacciones reales. Además de cada módulo, verifica que el
 * MOTOR FINANCIERO (Macro 2: PN y Resultado) consuma el MISMO hecho económico:
 * ΔPN nativo por moneda vs una línea base tomada tras crear los fixtures.
 *
 *   1. Cambio completo (pendiente → parcial → resto → CC → resultado → PN → reversa)
 *   2. Pendiente de caja (100 → 30 → 20 → confirmar; reversa de parcial)
 *   3. Transferencia Oficina ↔ Trenque
 *   4. Movimiento CC con impacto en caja
 *   5. PF desde CC
 *   6. Intereses CC
 *   7. Cartera propia compra / compra / venta / liquidar / anular
 *   8. Cable / MEP
 *   9. Baja de posición (eliminarPosicion) — custodia NO (fuera de Beta)
 *  10. Concurrencia transversal A–F
 *  15. Calidad: posición sin precio → INCOMPLETE (nunca un total falso)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  confirmarPendienteTx, cubrirParcialTx, liquidarCambioTx, revertirCambioTx, revertirMovimientoTx,
} from "../src/lib/caja/integridad.service";
import { esReversaValida, refReverso, vinculoFinanciero } from "../src/lib/caja/integridad";
import {
  aplicarInteresPendienteCCTx, crearMovimientoCCTx, crearPfDesdeCCTx, liquidarInteresCCTx, registrarMovimientoCC,
  revertirMovimientoCCTx, revertirOperacionCCTx,
} from "../src/lib/cc/integridad.service";
import { interesLiquidadoHasta, previewInteresPendienteCC, saldoReconstruido, validarEdicionPF } from "../src/lib/cc/integridad";
import { anularOperacionTx, concertarOperacionTx, liquidarOperacionTx, type DatosConcertacion } from "../src/lib/bolsa/integridad.service";
import { ajusteBajaPosicionTx, ajustePosicionTx } from "../src/lib/bolsa/ajustes.service";
import { cargarFinanceDataset } from "../src/lib/finance/load";
import { calcularPatrimonioNeto } from "../src/lib/finance/patrimonio";
import { construirLedger } from "../src/lib/finance/ledger";
import { calcularResultadoRealizado } from "../src/lib/finance/resultado";

const PRODUCTION_HOST_FRAGMENT = "ep-cool-hill-acuymnh3";
const EXPECTED_TEST_HOST_FRAGMENT = "ep-purple-waterfall-act57gj7";
const QA = "qa-m6";

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
const err = (e: unknown) => (e instanceof Error ? e.message : String(e));
async function deny(fn: () => Promise<unknown>): Promise<string> {
  try { await fn(); return "APLICÓ"; } catch (e) { return err(e); }
}
const TX = { timeout: 20000 };
/** QA_M6_CASOS="1,3" corre solo esos smokes (default: todos). */
const CASOS = (process.env.QA_M6_CASOS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
const correr = (n: number) => CASOS.length === 0 || CASOS.includes(String(n));

const USER = `${QA}-user`, OFI = `${QA}-caja-ofi`, TRE = `${QA}-caja-tre`;
const CLI = `${QA}-cli`, CLI_INT = `${QA}-cli-int`, CARTERA = `${QA}-cartera`;
const TK = "QAM6ARS", TK_USD = "QAM6USD", TK_SP = "QAM6SINP";
const HOY = new Date();
const TASA = D("0.365");

// ── Lecturas ────────────────────────────────────────────────────────────────
async function cajaNeto(cajaId: string, moneda: string): Promise<number> {
  const movs = await db.movimientoCaja.findMany({ where: { cajaId, moneda: moneda as never, confirmado: true } });
  return movs.reduce((s, m) => s + Number(m.monto) * (m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN" ? 1 : -1), 0);
}
async function ccSaldo(clienteId: string, moneda: string): Promise<{ almacenado: number; reconstruido: number }> {
  const c = await db.cuentaCorriente.findUnique({ where: { clienteId_moneda: { clienteId, moneda: moneda as never } } });
  if (!c) return { almacenado: 0, reconstruido: 0 };
  const movs = await db.movimientoCC.findMany({ where: { cuentaCorrienteId: c.id } });
  return { almacenado: Number(c.saldo), reconstruido: saldoReconstruido(movs.map((m) => ({ tipo: m.tipo, monto: m.monto }))).toNumber() };
}
async function motor(mes?: string) {
  const ds = await cargarFinanceDataset(db as never);
  const pn = calcularPatrimonioNeto(ds, ds.hoy);
  const res = calcularResultadoRealizado(ds, construirLedger(ds), mes ?? ds.hoy.slice(0, 7));
  return { ds, pn, res };
}
let base: { USD: number; ARS: number } = { USD: 0, ARS: 0 };
async function dPN(): Promise<{ USD: number; ARS: number }> {
  const { pn } = await motor();
  return { USD: +(pn.porMoneda.USD - base.USD).toFixed(6), ARS: +(pn.porMoneda.ARS - base.ARS).toFixed(6) };
}
const igual = (a: { USD: number; ARS: number }, b: { USD: number; ARS: number }) => Math.abs(a.USD - b.USD) < 1e-6 && Math.abs(a.ARS - b.ARS) < 1e-6;
async function partidas(ids: string[], mes?: string) {
  const { res } = await motor(mes);
  return res.partidas.filter((p) => ids.includes(p.origenId));
}

// ── Limpieza ────────────────────────────────────────────────────────────────
async function limpiar() {
  const clientes = [CLI, CLI_INT];
  const opsC = (await db.operacionCambio.findMany({ where: { OR: [{ id: { startsWith: QA } }, { clienteId: { in: clientes } }] }, select: { id: true } })).map((o) => o.id);
  await db.movimientoCaja.deleteMany({ where: { OR: [{ cajaId: { in: [OFI, TRE] } }, { operacionCambioId: { in: opsC } }] } });
  const cuentas = (await db.cuentaCorriente.findMany({ where: { clienteId: { in: clientes } }, select: { id: true } })).map((c) => c.id);
  await db.movimientoCC.deleteMany({ where: { cuentaCorrienteId: { in: cuentas } } });
  const pfs = (await db.plazoFijo.findMany({ where: { clienteId: { in: clientes } }, select: { id: true } })).map((p) => p.id);
  await db.plazoFijoMovimiento.deleteMany({ where: { plazoFijoId: { in: pfs } } });
  await db.plazoFijo.deleteMany({ where: { id: { in: pfs } } });
  await db.cuentaCorriente.deleteMany({ where: { id: { in: cuentas } } });
  await db.operacionCambio.deleteMany({ where: { id: { in: opsC } } });
  await db.cliente.deleteMany({ where: { id: { in: clientes } } });
  await db.caja.deleteMany({ where: { id: { in: [OFI, TRE] } } });
  const opsB = (await db.operacionBolsa.findMany({ where: { id: { startsWith: QA } }, select: { id: true } })).map((o) => o.id);
  await db.operacionBolsaLog.deleteMany({ where: { operacionId: { in: opsB } } });
  await db.operacionBolsa.deleteMany({ where: { id: { in: opsB } } });
  await db.posicionCartera.deleteMany({ where: { carteraId: CARTERA } });
  await db.cartera.deleteMany({ where: { id: CARTERA } });
  await db.activo.deleteMany({ where: { ticker: { in: [TK, TK_USD, TK_SP] } } });
  await db.auditLog.deleteMany({ where: { userId: USER } });
  await db.user.deleteMany({ where: { id: USER } });
}
async function restos(): Promise<number> {
  const clientes = [CLI, CLI_INT];
  return await db.movimientoCaja.count({ where: { cajaId: { in: [OFI, TRE] } } })
    + await db.operacionCambio.count({ where: { OR: [{ id: { startsWith: QA } }, { clienteId: { in: clientes } }] } })
    + await db.cuentaCorriente.count({ where: { clienteId: { in: clientes } } })
    + await db.plazoFijo.count({ where: { clienteId: { in: clientes } } })
    + await db.cliente.count({ where: { id: { in: clientes } } })
    + await db.caja.count({ where: { id: { in: [OFI, TRE] } } })
    + await db.operacionBolsa.count({ where: { id: { startsWith: QA } } })
    + await db.posicionCartera.count({ where: { carteraId: CARTERA } })
    + await db.cartera.count({ where: { id: CARTERA } })
    + await db.activo.count({ where: { ticker: { in: [TK, TK_USD, TK_SP] } } })
    + await db.auditLog.count({ where: { userId: USER } })
    + await db.user.count({ where: { id: USER } });
}

// ── Helpers de dominio ──────────────────────────────────────────────────────
/** Réplica exacta del alta de crearOperacionCambio (op + patas CC si impactoCC), sin liquidar. */
async function crearCambioConCC(id: string, cantidad: number, tc: number) {
  await db.$transaction(async (tx) => {
    const totalARS = D(cantidad).mul(tc);
    await tx.operacionCambio.create({ data: {
      id, fecha: U(HOY.toISOString().slice(0, 10)), tipo: "COMPRA_USD", clienteNombre: "QA M6", clienteId: CLI, moneda: "USD",
      cantidad: D(cantidad), tipoCambio: D(tc), totalARS, cobroUSD: D(cantidad), cobroARS: totalARS,
      descripcion: "[CC] QA M6 cambio", pendiente: true, updatedAt: new Date(),
    } });
    const ccUSD = await tx.cuentaCorriente.upsert({ where: { clienteId_moneda: { clienteId: CLI, moneda: "USD" } },
      create: { id: crypto.randomUUID(), clienteId: CLI, moneda: "USD", saldo: D(-cantidad), updatedAt: new Date() },
      update: { saldo: { increment: D(-cantidad) }, updatedAt: new Date() } });
    await tx.movimientoCC.create({ data: { id: crypto.randomUUID(), cuentaCorrienteId: ccUSD.id, fecha: new Date(), tipo: "EGRESO", monto: D(cantidad), descripcion: `Compra USD — Op Cambio | op:${id}`, operacionCambioId: id } });
    const ccARS = await tx.cuentaCorriente.upsert({ where: { clienteId_moneda: { clienteId: CLI, moneda: "ARS" } },
      create: { id: crypto.randomUUID(), clienteId: CLI, moneda: "ARS", saldo: totalARS, updatedAt: new Date() },
      update: { saldo: { increment: totalARS }, updatedAt: new Date() } });
    await tx.movimientoCC.create({ data: { id: crypto.randomUUID(), cuentaCorrienteId: ccARS.id, fecha: new Date(), tipo: "INGRESO", monto: totalARS, descripcion: `Contrapartida ARS | op:${id}`, operacionCambioId: id } });
  }, TX);
}
/** Cambio SIN CC (VENTA de USD desde caja), para resultado realizado FX. */
async function crearCambioSimple(id: string, tipo: "COMPRA_USD" | "VENTA_USD", cantidad: number, tc: number) {
  const totalARS = D(cantidad).mul(tc);
  await db.operacionCambio.create({ data: {
    id, fecha: U(HOY.toISOString().slice(0, 10)), tipo, moneda: "USD", cantidad: D(cantidad), tipoCambio: D(tc), totalARS,
    cobroUSD: D(cantidad), cobroARS: totalARS, descripcion: "QA M6 cambio", pendiente: true, updatedAt: new Date(),
  } });
}
const liquidar = (opId: string, items: "TOTAL" | { cajaId: string; div: Decimal; ars: Decimal | null }[]) =>
  db.$transaction((tx) => liquidarCambioTx(tx, { opId, items, cajaTotalId: OFI, fecha: new Date(), etiqueta: "Cobro Cambio", userName: "qa" }), TX);
const revertirCambio = (opId: string) =>
  db.$transaction((tx) => revertirCambioTx(tx, { opId, revertidoPor: "qa", fecha: new Date(), cajasAutorizadas: [OFI, TRE] }), TX);

async function pendiente(id: string, monto: number) {
  await db.movimientoCaja.create({ data: { id, cajaId: OFI, tipo: "ENTRADA", moneda: "USD", monto, confirmado: false, fecha: new Date(), descripcion: "QA M6 pendiente" } });
}
const parcial = (movimientoId: string, monto: number, pagoId: string) =>
  db.$transaction((tx) => cubrirParcialTx(tx, { movimientoId, cajaOriginalEsperada: OFI, cajaPagoId: OFI, monto: D(monto), userName: "qa", pagoId }), TX);
const confirmar = (movimientoId: string) =>
  db.$transaction((tx) => confirmarPendienteTx(tx, { movimientoId, cajaEsperada: OFI, userName: "qa" }), TX);

/** Réplica exacta del alta de transferirEntreCajas (dos patas, mismo ref, una tx). */
async function transferir(monto: number): Promise<{ ref: string; out: string; inn: string }> {
  const ref = crypto.randomUUID(), out = `${QA}-tout-${ref.slice(0, 8)}`, inn = `${QA}-tin-${ref.slice(0, 8)}`;
  await db.$transaction(async (tx) => {
    await tx.movimientoCaja.create({ data: { id: out, cajaId: OFI, tipo: "TRANSFERENCIA_OUT", moneda: "USD", monto, confirmado: true, fecha: new Date(), transferenciaRef: ref, descripcion: `TRANSFERENCIA | op:${ref}` } });
    await tx.movimientoCaja.create({ data: { id: inn, cajaId: TRE, tipo: "TRANSFERENCIA_IN", moneda: "USD", monto, confirmado: true, fecha: new Date(), transferenciaRef: ref, descripcion: `TRANSFERENCIA | op:${ref}` } });
  });
  return { ref, out, inn };
}
const revertirCaja = (movimientoId: string) => db.$transaction((tx) => revertirMovimientoTx(tx, { movimientoId, cajasAutorizadas: [OFI, TRE] }), TX);

let seq = 0;
const datos = (saldoUSD: "CABLE" | "MEP" | null = null, comisionFija: number | null = null): DatosConcertacion => ({
  nroBoleto: null, alyc: null, fechaConcertacion: null, fechaLiquidacion: null, plazoLiquidacion: "T1",
  costos: { comisionPct: null, comisionFija: comisionFija === null ? null : D(comisionFija), derechosMercado: null, gastos: null, impuestos: null, netoManual: null },
  comisionUSD: null, tcMepDia: null, esSenebi: false, senebiBruto: null, diasCaucion: null, tasaCaucion: null, saldoUSD,
});
async function opBolsa(tipo: "COMPRA_ACCION" | "VENTA_ACCION", ticker: string, cantidad: number, precio: number, moneda: "ARS" | "USD" = "ARS") {
  const id = `${QA}-op-${++seq}`;
  await db.operacionBolsa.create({ data: {
    id, carteraId: CARTERA, tipoOperacion: tipo, ticker, cantidad, precio, moneda, mercado: "BYMA",
    operadorCargaId: USER, estado: "PENDIENTE_CONCERTACION", updatedAt: new Date(),
  } });
  return id;
}
const concertar = (id: string, d: DatosConcertacion = datos()) => db.$transaction((tx) => concertarOperacionTx(tx, { operacionId: id, userId: USER, datos: d }), TX);
async function cartera(ticker = TK) {
  const c = await db.cartera.findUniqueOrThrow({ where: { id: CARTERA } });
  const a = await db.activo.findUnique({ where: { ticker } });
  const p = a ? await db.posicionCartera.findUnique({ where: { carteraId_activoId: { carteraId: CARTERA, activoId: a.id } } }) : null;
  return { ars: Number(c.saldoPesos), cable: Number(c.saldoUSDCable), mep: Number(c.saldoUSDMep), cant: p ? Number(p.cantidad) : 0, costo: p ? Number(p.precioCompra) : null, posId: p?.id ?? null };
}

// ═════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log(`[qa-m6] host confirmado: ${EXPECTED_TEST_HOST_FRAGMENT}`);
  await limpiar();
  await db.user.create({ data: { id: USER, email: `${QA}@invalid.local`, name: "QA M6", passwordHash: "x", activo: false, updatedAt: new Date() } });
  await db.caja.createMany({ data: [
    { id: OFI, slug: `${QA}-ofi`, label: "QA M6 Oficina", tipo: "CENTRAL_CONTABLE", activa: false },
    { id: TRE, slug: `${QA}-tre`, label: "QA M6 Trenque", tipo: "SUCURSAL_OPERATIVA", activa: false },
  ] });
  await db.cliente.createMany({ data: [
    { id: CLI, nombre: "QA M6 Cliente", activo: false, updatedAt: new Date() },
    { id: CLI_INT, nombre: "QA M6 Intereses", activo: false, tasaCC: TASA, updatedAt: new Date() },
  ] });
  await db.cartera.create({ data: { id: CARTERA, nombre: "QA M6 Cartera", slug: `${QA}-cartera`, activa: false, saldoPesos: 1_000_000, saldoUSDCable: 10_000, saldoUSDMep: 10_000, updatedAt: new Date() } });
  await db.activo.createMany({ data: [
    { id: `${QA}-act-ars`, ticker: TK, categoria: "ACCION_ARS", monedaPrecio: "ARS", precioActual: 1000, updatedAt: new Date() },
    { id: `${QA}-act-usd`, ticker: TK_USD, categoria: "ACCION_USD", monedaPrecio: "USD", precioActual: 100, updatedAt: new Date() },
  ] });
  const b0 = await motor();
  base = { USD: b0.pn.porMoneda.USD, ARS: b0.pn.porMoneda.ARS };

  // ── 1. CAMBIO COMPLETO (MACRO 6 fix final: CC y Caja mutuamente excluyentes) ──
  if (correr(1)) {
    // 1a. Cambio CON impacto CC: la CC registra el canje; liquidar en Caja → DENY (todas las vías
    //     pasan por liquidarCambioTx); nada cambia; la reversa neutraliza la CC una vez.
    const opCC = `${QA}-cambio-cc`;
    await crearCambioConCC(opCC, 100, 1000);
    const cajaCC0 = { usd: await cajaNeto(OFI, "USD"), ars: await cajaNeto(OFI, "ARS") };
    const cc0 = { usd: await ccSaldo(CLI, "USD"), ars: await ccSaldo(CLI, "ARS") };
    const pn0 = await dPN();
    const m0 = await motor();
    const det0 = m0.pn.detalle.clientes.find((c) => c.id === CLI);
    const denyTotal = await deny(() => liquidar(opCC, "TOTAL"));
    const denyParcial = await deny(() => liquidar(opCC, [{ cajaId: OFI, div: D(30), ars: null }]));
    const patasCC = await db.movimientoCaja.count({ where: { operacionCambioId: opCC } });
    const cc1 = { usd: await ccSaldo(CLI, "USD"), ars: await ccSaldo(CLI, "ARS") };
    const pn1 = await dPN();
    const opCCRow = await db.operacionCambio.findUniqueOrThrow({ where: { id: opCC } });
    const partCC = await partidas([opCC]);
    await revertirCambio(opCC);
    const cc2 = { usd: await ccSaldo(CLI, "USD"), ars: await ccSaldo(CLI, "ARS") };
    const cajaCC2 = { usd: await cajaNeto(OFI, "USD"), ars: await cajaNeto(OFI, "ARS") };
    const pn2 = await dPN();
    const reversosCC = await db.movimientoCC.count({ where: { operacionCambioId: opCC, descripcion: { startsWith: "[REVERSO]" } } });
    const dobleCC = await deny(() => revertirCambio(opCC));
    const reversosCC2 = await db.movimientoCC.count({ where: { operacionCambioId: opCC, descripcion: { startsWith: "[REVERSO]" } } });
    const liqRevertida = await deny(() => liquidar(opCC, "TOTAL"));
    check("1a. Cambio + CC → Caja DENY, CC intacta; reversa neutraliza CC una vez",
      cc0.usd.almacenado === -100 && cc0.ars.almacenado === 100_000 && det0?.ccNativo.USD === -100 && det0?.ccNativo.ARS === 100_000
      && denyTotal.includes("impacta Cuenta Corriente") && denyParcial.includes("impacta Cuenta Corriente") && patasCC === 0
      && JSON.stringify(cc1) === JSON.stringify(cc0) && igual(pn1, pn0) && opCCRow.pendiente && !String(opCCRow.descripcion).includes("[PARCIAL]") && partCC.length === 0
      && cajaCC2.usd === cajaCC0.usd && cajaCC2.ars === cajaCC0.ars
      && cc2.usd.almacenado === 0 && cc2.ars.almacenado === 0 && cc2.usd.reconstruido === 0 && cc2.ars.reconstruido === 0 && igual(pn2, { USD: 0, ARS: 0 })
      && reversosCC === 2 && dobleCC.includes("ya fue revertida") && reversosCC2 === 2 && liqRevertida !== "APLICÓ",
      `CC ${cc0.usd.almacenado}/${cc0.ars.almacenado} (motor cliente ${JSON.stringify(det0?.ccNativo)}) ; Caja total: ${denyTotal.slice(0, 55)} ; parcial: DENY ; patas caja ${patasCC} ; CC intacta ${JSON.stringify(cc1) === JSON.stringify(cc0)} ; ΔPN sin cambio ${igual(pn1, pn0)} ; resultado ${partCC.length} ; `
      + `reversa: CC ${cc2.usd.almacenado}/${cc2.ars.almacenado} (= reconstruida), caja sin cambio, ΔPN ${JSON.stringify(pn2)}, reversos CC ${reversosCC} ; doble: ${dobleCC.slice(0, 30)} (reversos ${reversosCC2}) ; liquidar revertida: ${liqRevertida.slice(0, 30)}`);

    // 1b. Cambio SIN CC: pendiente → parcial → residual en Caja → resultado → reversa (sin regresión).
    const op = `${QA}-cambio-1`;
    await crearCambioSimple(op, "COMPRA_USD", 100, 1000);
    const c0 = { usd: await cajaNeto(OFI, "USD"), ars: await cajaNeto(OFI, "ARS") };
    const pnB0 = await dPN();
    await liquidar(op, [{ cajaId: OFI, div: D(30), ars: null }]);
    const c1 = { usd: await cajaNeto(OFI, "USD") - c0.usd, ars: await cajaNeto(OFI, "ARS") - c0.ars };
    await liquidar(op, "TOTAL");
    const c2 = { usd: await cajaNeto(OFI, "USD") - c0.usd, ars: await cajaNeto(OFI, "ARS") - c0.ars };
    const sobre = await deny(() => liquidar(op, [{ cajaId: OFI, div: D(1), ars: null }]));
    const pnB2 = await dPN();
    const venta = `${QA}-cambio-1v`;
    await crearCambioSimple(venta, "VENTA_USD", 40, 1100);
    const partVentaPend = await partidas([venta]);
    await liquidar(venta, "TOTAL");
    const partVenta = await partidas([venta]);
    await revertirCambio(venta);
    const partVentaRev = await partidas([venta]);
    await revertirCambio(op);
    const c3 = { usd: await cajaNeto(OFI, "USD") - c0.usd, ars: await cajaNeto(OFI, "ARS") - c0.ars };
    const pnB3 = await dPN();
    const doble = await deny(() => revertirCambio(op));
    check("1b. Cambio sin CC: pendiente → parcial → residual → resultado → reversa",
      c1.usd === 30 && c1.ars === -30_000 && c2.usd === 100 && c2.ars === -100_000 && sobre !== "APLICÓ"
      && igual(pnB2, { USD: pnB0.USD + 100, ARS: pnB0.ARS - 100_000 })
      && partVentaPend.length === 0 && partVenta.length > 0 && partVentaRev.length === 0
      && c3.usd === 0 && c3.ars === 0 && igual(pnB3, pnB0) && doble.includes("ya fue revertida"),
      `parcial ${c1.usd}/${c1.ars} ; residual → ${c2.usd}/${c2.ars} ; sobreliq: ${sobre.slice(0, 35)} ; ΔPN ${JSON.stringify({ USD: pnB2.USD - pnB0.USD, ARS: pnB2.ARS - pnB0.ARS })} ; `
      + `FX venta: pendiente ${partVentaPend.length}, liquidada ${partVenta.map((p) => `${p.categoria} ${p.moneda} ${p.monto.toFixed(2)}`).join(",")}, revertida ${partVentaRev.length} ; reversa caja ${c3.usd}/${c3.ars}, ΔPN vuelve ${igual(pnB3, pnB0)} ; doble: ${doble.slice(0, 30)}`);
  }

  // ── 2. PENDIENTE DE CAJA ──────────────────────────────────────────────────
  if (correr(2)) {
    const P = `${QA}-pend-1`;
    const caja0 = await cajaNeto(OFI, "USD");
    await pendiente(P, 100);
    const a = { caja: await cajaNeto(OFI, "USD") - caja0, pn: await dPN() };
    await parcial(P, 30, `${QA}-pago-1`);
    const b = { caja: await cajaNeto(OFI, "USD") - caja0, pn: await dPN() };
    await parcial(P, 20, `${QA}-pago-2`);
    const c = { caja: await cajaNeto(OFI, "USD") - caja0, pn: await dPN() };
    await confirmar(P);
    const d = { caja: await cajaNeto(OFI, "USD") - caja0, pn: await dPN() };
    const sobre = await deny(() => parcial(P, 1, `${QA}-pago-x`));
    // reversa de un parcial y confirmación del residual
    const Q = `${QA}-pend-2`;
    await pendiente(Q, 100);
    await parcial(Q, 40, `${QA}-pago-3`);
    await revertirCaja(`${QA}-pago-3`);
    const e = { caja: await cajaNeto(OFI, "USD") - caja0, pn: await dPN() };
    await confirmar(Q);
    const f = { caja: await cajaNeto(OFI, "USD") - caja0, pn: await dPN() };
    const dobleConf = await deny(() => confirmar(Q));
    check("2. Pendiente de caja (100 → 30 → 20 → confirmar = 100; reversa de parcial)",
      a.caja === 0 && igual(a.pn, { USD: 100, ARS: 0 }) && b.caja === 30 && igual(b.pn, { USD: 100, ARS: 0 }) && c.caja === 50 && igual(c.pn, { USD: 100, ARS: 0 })
      && d.caja === 100 && igual(d.pn, { USD: 100, ARS: 0 }) && sobre !== "APLICÓ"
      && e.caja === 100 && igual(e.pn, { USD: 200, ARS: 0 }) && f.caja === 200 && igual(f.pn, { USD: 200, ARS: 0 }) && dobleConf !== "APLICÓ",
      `caja/ΔPN USD: pendiente ${a.caja}/${a.pn.USD} ; +30 ${b.caja}/${b.pn.USD} ; +20 ${c.caja}/${c.pn.USD} ; confirmar ${d.caja}/${d.pn.USD} (no 150) ; post-confirmación parcial: ${sobre.slice(0, 30)} ; `
      + `2º pendiente 100, parcial 40 revertido ${e.caja}/${e.pn.USD} ; residual confirmado ${f.caja}/${f.pn.USD} ; doble confirmación: ${dobleConf.slice(0, 30)}`);
  }

  // ── 3. TRANSFERENCIA OFICINA ↔ TRENQUE ────────────────────────────────────
  if (correr(3)) {
    const o0 = await cajaNeto(OFI, "USD"), t0 = await cajaNeto(TRE, "USD"), pn0 = await dPN();
    const t = await transferir(70);
    const legs = await db.movimientoCaja.findMany({ where: { transferenciaRef: t.ref } });
    const o1 = await cajaNeto(OFI, "USD") - o0, t1 = await cajaNeto(TRE, "USD") - t0, pn1 = await dPN();
    const part = await partidas([t.out, t.inn]);
    const vinculos = legs.map((l) => vinculoFinanciero(l));   // guard de editar / eliminar una pata (mov-diarios/actions)
    await revertirCaja(t.inn);                                  // revertir: siempre el PAR completo
    const o2 = await cajaNeto(OFI, "USD") - o0, t2 = await cajaNeto(TRE, "USD") - t0, pn2 = await dPN();
    const reversos = await db.movimientoCaja.findMany({ where: { cajaId: { in: [OFI, TRE] }, descripcion: { startsWith: "REVERSO | ref:" } } });
    const rev = reversos.filter((r) => [t.out, t.inn].includes(refReverso(r.descripcion) ?? ""));
    const validas = rev.every((r) => esReversaValida(legs.find((l) => l.id === refReverso(r.descripcion))!, r));
    const doble1 = await deny(() => revertirCaja(t.out)), doble2 = await deny(() => revertirCaja(t.inn));
    check("3. Transferencia Oficina ↔ Trenque",
      legs.length === 2 && o1 === -70 && t1 === 70 && igual(pn1, pn0) && part.length === 0 && vinculos.every((v) => v === "TRANSFERENCIA")
      && rev.length === 2 && validas && o2 === 0 && t2 === 0 && igual(pn2, pn0) && doble1 !== "APLICÓ" && doble2 !== "APLICÓ",
      `patas ${legs.length} mismo ref ; Oficina ${o1} / Trenque +${t1} ; ΔPN ${JSON.stringify(pn1)} = antes ; resultado ${part.length} ; vínculo ${vinculos.join("/")} (editar/eliminar una pata → DENY) ; `
      + `reversa desde una pata → ${rev.length} reversos válidos=${validas} ; neto ${o2}/${t2} ; doble: ${doble1.slice(0, 30)} | ${doble2.slice(0, 30)}`);
  }

  // ── 4. CC + CAJA ──────────────────────────────────────────────────────────
  if (correr(4)) {
    const o0 = await cajaNeto(OFI, "USD"), cc0 = await ccSaldo(CLI, "USD"), pn0 = await dPN();
    const cuenta = await db.cuentaCorriente.findUniqueOrThrow({ where: { clienteId_moneda: { clienteId: CLI, moneda: "USD" } } });
    const { operationRef: ref4 } = await db.$transaction((tx) => crearMovimientoCCTx(tx, { cuentaId: cuenta.id, tipo: "INGRESO", monto: D(500), fecha: new Date(), descripcion: "QA M6 depósito", cajaImpactoId: OFI }), TX);
    const operationRef = ref4!;
    const pataCaja = await db.movimientoCaja.findFirstOrThrow({ where: { cajaId: OFI, descripcion: { endsWith: `op:${operationRef}` } } });
    const pataCC = await db.movimientoCC.findFirstOrThrow({ where: { cuentaCorrienteId: cuenta.id, descripcion: { endsWith: `op:${operationRef}` } } });
    const o1 = await cajaNeto(OFI, "USD") - o0, cc1 = await ccSaldo(CLI, "USD"), pn1 = await dPN();
    const desdeCaja = await deny(() => revertirCaja(pataCaja.id));
    await db.$transaction((tx) => revertirOperacionCCTx(tx, { operationRef, fecha: new Date(), cajasAutorizadas: [OFI] }), TX);
    const o2 = await cajaNeto(OFI, "USD") - o0, cc2 = await ccSaldo(CLI, "USD"), pn2 = await dPN();
    const revCaja = await db.movimientoCaja.findFirst({ where: { cajaId: OFI, descripcion: { startsWith: `REVERSO | ref:${pataCaja.id}` } } });
    const doble = await deny(() => db.$transaction((tx) => revertirOperacionCCTx(tx, { operationRef, fecha: new Date(), cajasAutorizadas: [OFI] }), TX));
    check("4. CC + Caja (un hecho, reversa conjunta)",
      o1 === 500 && cc1.almacenado - cc0.almacenado === 500 && !!pataCC && igual(pn1, pn0) && desdeCaja.includes("cuenta corriente")
      && o2 === 0 && cc2.almacenado === cc0.almacenado && cc2.almacenado === cc2.reconstruido && !!revCaja && esReversaValida(pataCaja, revCaja!)
      && igual(pn2, pn0) && doble !== "APLICÓ",
      `caja +${o1} / CC +${cc1.almacenado - cc0.almacenado} op:${operationRef.slice(0, 8)} ; ΔPN ${JSON.stringify(pn1)} (neutral) ; reversa desde Caja: ${desdeCaja.slice(0, 50)} ; `
      + `reversa desde CC: caja ${o2}, CC ${cc2.almacenado}=${cc2.reconstruido}, reverso caja válido (Macro 3) ${revCaja ? esReversaValida(pataCaja, revCaja) : false} ; doble: ${doble.slice(0, 30)}`);
  }

  // ── 5. PF DESDE CC ────────────────────────────────────────────────────────
  if (correr(5)) {
    const cuenta = await db.cuentaCorriente.findUniqueOrThrow({ where: { clienteId_moneda: { clienteId: CLI, moneda: "USD" } } });
    await db.$transaction((tx) => registrarMovimientoCC(tx, { cuentaId: cuenta.id, tipo: "INGRESO", monto: D(1000), fecha: new Date(), descripcion: "QA M6 saldo" }), TX);
    const cc0 = await ccSaldo(CLI, "USD"), pn0 = await dPN();
    const pf = await db.$transaction((tx) => crearPfDesdeCCTx(tx, { clienteId: CLI, moneda: "USD", capital: D(400), tasaAnual: D(5), fechaInicio: new Date(), fechaVencimiento: new Date(Date.now() + 30 * 86_400_000) }), TX);
    const cc1 = await ccSaldo(CLI, "USD"), pn1 = await dPN();
    const pfRow = await db.plazoFijo.findUniqueOrThrow({ where: { id: pf.plazoFijoId } });
    const { pn } = await motor();
    const det = pn.detalle.clientes.find((c) => c.id === CLI);
    const edicion = validarEdicionPF({ capital: pfRow.capital, saldoActual: pfRow.saldoActual, estado: pfRow.estado, moneda: pfRow.moneda, clienteId: pfRow.clienteId }, { capital: 999 });
    await db.$transaction((tx) => revertirOperacionCCTx(tx, { operationRef: pf.operationRef, fecha: new Date() }), TX);
    const cc2 = await ccSaldo(CLI, "USD"), pn2 = await dPN();
    const pf2 = await db.plazoFijo.findUniqueOrThrow({ where: { id: pf.plazoFijoId } });
    const doble = await deny(() => db.$transaction((tx) => revertirOperacionCCTx(tx, { operationRef: pf.operationRef, fecha: new Date() }), TX));
    check("5. PF desde CC (sin doble pasivo)",
      cc1.almacenado === cc0.almacenado - 400 && cc1.almacenado === cc1.reconstruido && pfRow.estado === "ACTIVO" && Number(pfRow.saldoActual) === 400
      && igual(pn1, pn0) && det?.pfNativo.USD === 400 && !!edicion && cc2.almacenado === cc0.almacenado && cc2.almacenado === cc2.reconstruido
      && pf2.estado === "CANCELADO" && igual(pn2, pn0) && doble !== "APLICÓ",
      `CC ${cc0.almacenado} → ${cc1.almacenado} (= reconstruido ${cc1.reconstruido}) ; PF ${pfRow.estado} ${pfRow.saldoActual} ; ΔPN ${JSON.stringify(pn1)} = antes (CC↓ + PF↑) ; motor PF cliente ${det?.pfNativo.USD} ; `
      + `edición capital: ${edicion?.slice(0, 40)} ; reversa: PF ${pf2.estado}, CC ${cc2.almacenado} ; doble: ${doble.slice(0, 30)}`);
  }

  // ── 6. INTERESES CC ───────────────────────────────────────────────────────
  if (correr(6)) {
    const cc = await db.cuentaCorriente.create({ data: { id: `${QA}-cc-int`, clienteId: CLI_INT, moneda: "USD", saldo: 0, updatedAt: new Date() } });
    await db.$transaction(async (tx) => {
      await registrarMovimientoCC(tx, { cuentaId: cc.id, tipo: "INGRESO", monto: D(100_000), fecha: U("2026-08-01"), descripcion: "QA saldo previo" });
      await registrarMovimientoCC(tx, { cuentaId: cc.id, tipo: "EGRESO", monto: D(30_000), fecha: U("2026-09-12"), descripcion: "QA egreso" });
    }, TX);
    const movs = async () => (await db.movimientoCC.findMany({ where: { cuentaCorrienteId: cc.id }, orderBy: [{ fecha: "asc" }, { createdAt: "asc" }] }))
      .map((m) => ({ id: m.id, fecha: m.fecha, tipo: m.tipo as string, monto: D(m.monto.toString()), descripcion: m.descripcion }));
    const dia20 = new Date("2026-09-20T15:00:00Z"), dia30 = new Date("2026-09-30T15:00:00Z");
    const prevVieja = previewInteresPendienteCC(await movs(), TASA, dia20).interesTotal;
    // movimiento nuevo entre la vista previa y la aplicación
    await db.$transaction((tx) => registrarMovimientoCC(tx, { cuentaId: cc.id, tipo: "INGRESO", monto: D(50_000), fecha: U("2026-09-05"), descripcion: "QA ingreso tardío" }), TX);
    const prevNueva = previewInteresPendienteCC(await movs(), TASA, dia20).interesTotal;
    await db.$transaction((tx) => aplicarInteresPendienteCCTx(tx, { cuentaId: cc.id, ahora: dia20 }), TX);
    const i1 = (await movs()).filter((m) => m.tipo === "INTERES");
    const solape = await deny(() => db.$transaction((tx) => liquidarInteresCCTx(tx, { cuentaId: cc.id, fechaInicio: U("2026-09-01"), fechaFin: U("2026-09-30"), tasa: TASA, interesAplicado: D(0) }), TX));
    const tramo = previewInteresPendienteCC(await movs(), TASA, dia30).interesTotal;
    await db.$transaction((tx) => aplicarInteresPendienteCCTx(tx, { cuentaId: cc.id, ahora: dia30 }), TX);
    const i2 = (await movs()).filter((m) => m.tipo === "INTERES");
    const resAntes = (await partidas(i2.map((i) => i.id), "2026-09")).filter((p) => p.categoria === "INTERES_CC");
    await db.$transaction((tx) => revertirMovimientoCCTx(tx, { id: i2[1].id, userName: "qa", fecha: U("2026-09-30") }), TX);
    const hasta = interesLiquidadoHasta(await movs());
    const resDespues = (await partidas(i2.map((i) => i.id), "2026-09")).filter((p) => p.categoria === "INTERES_CC");
    const dobleRev = await deny(() => db.$transaction((tx) => revertirMovimientoCCTx(tx, { id: i2[1].id, userName: "qa", fecha: U("2026-09-30") }), TX));
    const s = await db.cuentaCorriente.findUniqueOrThrow({ where: { id: cc.id } });
    const rec = saldoReconstruido((await movs()).map((m) => ({ tipo: m.tipo, monto: m.monto })));
    const sumaRes = resAntes.reduce((a, p) => a + Math.abs(p.monto), 0);
    check("6. Intereses CC (servidor recalcula; solo días nuevos; solape DENY; reversa reabre)",
      !prevVieja.eq(prevNueva) && i1.length === 1 && i1[0].monto.minus(prevNueva).abs().lte("0.005000001") && solape.includes("liquidado hasta")
      && i2.length === 2 && i2[1].monto.minus(tramo).abs().lte("0.005000001")
      && resAntes.length === 2 && Math.abs(sumaRes - i2[0].monto.plus(i2[1].monto).toNumber()) < 0.01 && resDespues.length === 1
      && hasta?.toISOString().slice(0, 10) === "2026-09-20" && dobleRev !== "APLICÓ" && rec.eq(D(s.saldo.toString())),
      `preview vieja ${prevVieja.toFixed(2)} → nueva ${prevNueva.toFixed(2)} ; persistido ${i1[0]?.monto} ; solape: ${solape.slice(0, 45)} ; 2º tramo ${i2[1]?.monto} = preview ${tramo.toFixed(2)} ; `
      + `resultado Macro 2 INTERES_CC ${resAntes.length} partidas Σ${sumaRes.toFixed(2)} → tras reversa ${resDespues.length} ; liquidado hasta ${hasta?.toISOString().slice(0, 10)} ; doble reversa: ${dobleRev.slice(0, 30)} ; saldo ${s.saldo} = reconstruido ${rec}`);
  }

  // ── 7. CARTERA PROPIA ─────────────────────────────────────────────────────
  if (correr(7)) {
    const pn0 = await dPN();
    const c1 = await opBolsa("COMPRA_ACCION", TK, 100, 1000);
    await concertar(c1);
    const a = await cartera(), pnA = await dPN(), resA = await partidas([c1]);
    const c2 = await opBolsa("COMPRA_ACCION", TK, 100, 1200);
    await concertar(c2, datos(null, 100));
    const b = await cartera(), pnB = await dPN();
    const v = await opBolsa("VENTA_ACCION", TK, 50, 1300);
    await concertar(v);
    const c = await cartera(), resV = await partidas([v]);
    await db.$transaction((tx) => liquidarOperacionTx(tx, { operacionId: v, userId: USER, fechaLiquidacion: new Date() }), TX);
    const cLiq = await cartera();
    const anul = await deny(() => db.$transaction((tx) => anularOperacionTx(tx, { operacionId: v, userId: USER, motivo: "QA M6" }), TX));
    const d = await cartera(), resD = await partidas([v]), pnD = await dPN();
    const est = (await db.operacionBolsa.findUniqueOrThrow({ where: { id: v } })).estado;
    const ventaRes = resV.find((p) => p.categoria === "CARTERA_VENTA");
    // ΔPN de compra = Δcash + Δ(cantidad × precio de mercado). Precio de mercado = 1000.
    check("7. Cartera propia compra / compra / venta / liquidar / anular",
      a.ars === 900_000 && a.cant === 100 && a.costo === 1000 && igual(pnA, pn0) && resA.length === 0
      && b.ars === 779_900 && b.cant === 200 && b.costo === 1100.5 && igual(pnB, { USD: pn0.USD, ARS: pn0.ARS - 120_100 + 100_000 })
      && c.ars === 844_900 && c.cant === 150 && c.costo === 1100.5 && ventaRes?.moneda === "ARS" && Math.abs((ventaRes?.monto ?? 0) - 9_975) < 1e-6
      && JSON.stringify(cLiq) === JSON.stringify(c) && anul === "APLICÓ" && est === "ANULADA"
      && d.ars === b.ars && d.cant === b.cant && d.costo === b.costo && resD.length === 0 && igual(pnD, pnB),
      `compra: ${JSON.stringify({ ars: a.ars, cant: a.cant, costo: a.costo })} ΔPN ${JSON.stringify(pnA)} resultado ${resA.length} ; 2ª compra promedio ${b.costo} ; `
      + `venta: cash ${c.ars} cant ${c.cant} resultado motor ${ventaRes?.categoria} ${ventaRes?.monto} ; liquidar sin efecto ${JSON.stringify(cLiq) === JSON.stringify(c)} ; anular tras liquidar: ${anul.slice(0, 40)} → ${est}, estado previo exacto ${d.ars === b.ars && d.cant === b.cant && d.costo === b.costo}, resultado ${resD.length}`);
  }

  // ── 8. CABLE / MEP ────────────────────────────────────────────────────────
  if (correr(8)) {
    const pn0 = await dPN();
    const k = await opBolsa("COMPRA_ACCION", TK_USD, 10, 100, "USD");
    await concertar(k, datos("CABLE"));
    const a = await cartera(TK_USD);
    const m = await opBolsa("COMPRA_ACCION", TK_USD, 5, 100, "USD");
    await concertar(m, datos("MEP"));
    const b = await cartera(TK_USD), pnB = await dPN();
    const sinElegir = await deny(async () => { const x = await opBolsa("COMPRA_ACCION", TK_USD, 1, 100, "USD"); await concertar(x, datos(null)); });
    await db.$transaction((tx) => anularOperacionTx(tx, { operacionId: m, userId: USER, motivo: "QA" }), TX);
    const c = await cartera(TK_USD);
    check("8. Cable / MEP (la bolsa incorrecta queda intacta)",
      a.cable === 9_000 && a.mep === 10_000 && b.cable === 9_000 && b.mep === 9_500 && igual(pnB, pn0) && sinElegir !== "APLICÓ"
      && c.cable === 9_000 && c.mep === 10_000 && c.cant === 10,
      `Cable compra → cable ${a.cable} mep ${a.mep} ; MEP compra → cable ${b.cable} mep ${b.mep} ; ΔPN ${JSON.stringify(pnB)} = antes ; sin elegir: ${sinElegir.slice(0, 50)} ; anular MEP → cable ${c.cable} mep ${c.mep}`);
  }

  // ── 9. BAJA DE POSICIÓN (eliminarPosicion) ────────────────────────────────
  if (correr(9)) {
    const a0 = await cartera(TK_USD);
    const sinConf = await deny(() => db.$transaction((tx) => ajusteBajaPosicionTx(tx, { userId: USER, confirmarAjuste: false, posicionId: a0.posId! }), TX));
    // AuditLog con FK inválida → la baja debe hacer rollback completo
    const auditFalla = await deny(() => db.$transaction((tx) => ajusteBajaPosicionTx(tx, { userId: `${QA}-no-existe`, confirmarAjuste: true, posicionId: a0.posId! }), TX));
    const a1 = await cartera(TK_USD);
    await db.$transaction((tx) => ajusteBajaPosicionTx(tx, { userId: USER, confirmarAjuste: true, posicionId: a0.posId! }), TX);
    const a2 = await cartera(TK_USD);
    const audit = await db.auditLog.findMany({ where: { userId: USER, accion: "AJUSTE_POSICION", entidadId: a0.posId! } });
    const prev = audit[0]?.datosPrevios as { cantidad?: string } | null, nuev = audit[0]?.datosNuevos as { cantidad?: string; description?: string } | null;
    check("9. Baja de posición = AJUSTE confirmado, audit en la misma tx, cash intacto",
      sinConf.includes("ajuste / apertura") && auditFalla !== "APLICÓ" && a1.cant === a0.cant && a1.posId === a0.posId
      && a2.cant === 0 && a2.posId === null && a2.cable === a0.cable && a2.mep === a0.mep && a2.ars === a0.ars
      && audit.length === 1 && prev?.cantidad === String(a0.cant) && nuev?.cantidad === "0" && /sin cash/.test(nuev?.description ?? ""),
      `sin confirmar: ${sinConf.slice(0, 40)} ; audit falla → rollback, posición ${a1.cant} ; confirmado → posición ${a2.cant}, cash idéntico ; AuditLog ${audit.length}: ${prev?.cantidad} → ${nuev?.cantidad}`);
  }

  // ── 15. CALIDAD: posición sin precio → INCOMPLETE ─────────────────────────
  if (correr(15)) {
    await db.activo.create({ data: { id: `${QA}-act-sp`, ticker: TK_SP, categoria: "ACCION_ARS", monedaPrecio: "ARS", precioActual: null, updatedAt: new Date() } });
    await db.posicionCartera.create({ data: { id: `${QA}-pos-sp`, carteraId: CARTERA, activoId: `${QA}-act-sp`, cantidad: 5, precioCompra: 10, fecha: new Date(), updatedAt: new Date() } });
    const { pn } = await motor();
    const det = pn.detalle.carteras.find((c) => c.id === CARTERA);
    const razon = pn.qualityReasons.some((r) => r.code === "MISSING_MARKET_PRICE" && r.detail.includes(TK_SP));
    await db.posicionCartera.delete({ where: { id: `${QA}-pos-sp` } });
    check("15. Sin precio → INCOMPLETE, nunca un total falso",
      det?.sinPrecio === 1 && det.totalUSD === null && det.posicionesUSD === null && pn.quality === "INCOMPLETE" && pn.pnUSD === null && razon,
      `cartera QA sinPrecio ${det?.sinPrecio}, totalUSD ${det?.totalUSD} ; PN quality ${pn.quality}, pnUSD ${pn.pnUSD} ; razón MISSING_MARKET_PRICE ${razon}`);
  }

  // ── 10. CONCURRENCIA TRANSVERSAL ──────────────────────────────────────────
  if (correr(10)) {
    // A. doble confirmación de un pendiente
    const P = `${QA}-pend-cA`;
    await pendiente(P, 100);
    const c0 = await cajaNeto(OFI, "USD");
    const rA = await Promise.allSettled([confirmar(P), confirmar(P)]);
    const okA = rA.filter((r) => r.status === "fulfilled").length === 1 && (await cajaNeto(OFI, "USD")) - c0 === 100;
    // B. doble reversión (las dos patas de una transferencia, en paralelo)
    const t = await transferir(10);
    const rB = await Promise.allSettled([revertirCaja(t.out), revertirCaja(t.inn)]);
    const revB = (await db.movimientoCaja.findMany({ where: { cajaId: { in: [OFI, TRE] }, descripcion: { startsWith: "REVERSO | ref:" } } }))
      .filter((r) => [t.out, t.inn].includes(refReverso(r.descripcion) ?? "")).length;
    const okB = rB.filter((r) => r.status === "fulfilled").length === 1 && revB === 2;
    // C. doble liquidación total de un cambio
    const opC = `${QA}-cambio-cC`;
    await crearCambioSimple(opC, "COMPRA_USD", 20, 1000);
    const rC = await Promise.allSettled([liquidar(opC, "TOTAL"), liquidar(opC, "TOTAL")]);
    const patasC = await db.movimientoCaja.count({ where: { operacionCambioId: opC } });
    const okC = rC.filter((r) => r.status === "fulfilled").length === 1 && patasC === 2;
    await revertirCambio(opC);
    // D. dos ventas por toda la posición
    const pos = await cartera();
    const [v1, v2] = [await opBolsa("VENTA_ACCION", TK, pos.cant, 1300), await opBolsa("VENTA_ACCION", TK, pos.cant, 1300)];
    const rD = await Promise.allSettled([concertar(v1), concertar(v2)]);
    const dD = await cartera();
    const okD = rD.filter((r) => r.status === "fulfilled").length === 1 && dD.cant === 0 && dD.ars === pos.ars + pos.cant * 1300;
    // E. aplicación de interés vs movimiento concurrente en la misma cuenta
    const ccE = await db.cuentaCorriente.findUniqueOrThrow({ where: { id: `${QA}-cc-int` } });
    const movsE = async () => (await db.movimientoCC.findMany({ where: { cuentaCorrienteId: ccE.id } })).map((m) => ({ id: m.id, fecha: m.fecha, tipo: m.tipo as string, monto: D(m.monto.toString()), descripcion: m.descripcion }));
    const dia10oct = new Date("2026-10-10T15:00:00Z");
    const sinMov = previewInteresPendienteCC(await movsE(), TASA, dia10oct).interesTotal;
    const conMov = previewInteresPendienteCC([...(await movsE()), { id: "x", fecha: U("2026-10-02"), tipo: "INGRESO", monto: D(10_000), descripcion: null }], TASA, dia10oct).interesTotal;
    const rE = await Promise.allSettled([
      db.$transaction((tx) => aplicarInteresPendienteCCTx(tx, { cuentaId: ccE.id, ahora: dia10oct }), TX),
      db.$transaction((tx) => registrarMovimientoCC(tx, { cuentaId: ccE.id, tipo: "INGRESO", monto: D(10_000), fecha: U("2026-10-02"), descripcion: "QA concurrente" }), TX),
    ]);
    const intE = (await movsE()).filter((m) => m.tipo === "INTERES" && m.fecha.toISOString().startsWith("2026-10"));
    const sE = await db.cuentaCorriente.findUniqueOrThrow({ where: { id: ccE.id } });
    const recE = saldoReconstruido((await movsE()).map((m) => ({ tipo: m.tipo, monto: m.monto })));
    const okE = rE.every((r) => r.status === "fulfilled") && intE.length === 1
      && (intE[0].monto.minus(sinMov).abs().lte("0.005000001") || intE[0].monto.minus(conMov).abs().lte("0.005000001")) && recE.eq(D(sE.saldo.toString()));
    // F. ajuste de cartera vs operación concurrentes (misma cartera, mismo activo)
    const c1 = await opBolsa("COMPRA_ACCION", TK, 10, 1000);
    await concertar(c1);
    const f0 = await cartera();
    const vF = await opBolsa("VENTA_ACCION", TK, 10, 1000);
    const rF = await Promise.allSettled([
      concertar(vF),
      db.$transaction((tx) => ajustePosicionTx(tx, { userId: USER, confirmarAjuste: true, posicionId: f0.posId!, precioCompra: D(900) }), TX),
    ]);
    const fF = await cartera();
    const estF = (await db.operacionBolsa.findUniqueOrThrow({ where: { id: vF } })).estado;
    const vendio = estF === "CONCERTADA";
    const okF = rF.some((r) => r.status === "fulfilled") && fF.cant >= 0 && fF.ars === f0.ars + (vendio ? 10_000 : 0) && fF.cant === (vendio ? 0 : 10);
    check("10. Concurrencia transversal A–F", okA && okB && okC && okD && okE && okF,
      `A doble confirmación ${okA} ; B doble reversión ${okB} (${revB} reversos) ; C doble liquidación ${okC} (patas ${patasC}) ; D dos ventas ${okD} (cant ${dD.cant}) ; `
      + `E interés vs movimiento ${okE} (interés ${intE[0]?.monto} ∈ {${sinMov.toFixed(2)}, ${conMov.toFixed(2)}}, saldo=reconstruido) ; F ajuste vs venta ${okF} (${rF.map((r) => r.status[0]).join("")}, venta ${estF}, cash Δ${fF.ars - f0.ars}, cant ${fF.cant})`);
  }
}

main()
  .catch((e) => check("EJECUCIÓN", false, err(e)))
  .finally(async () => {
    await limpiar().catch((e) => check("LIMPIEZA", false, err(e)));
    const n = await restos();
    check("SIN DATOS QA PERSISTIDOS", n === 0, `registros QA restantes: ${n}`);
    await db.$disconnect();
    for (const r of resultados) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.caso} — ${r.detalle}`);
    process.exit(resultados.every((r) => r.ok) ? 0 : 1);
  });
