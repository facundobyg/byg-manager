/**
 * MACRO 2 — Comparación SOLO LECTURA: fórmulas viejas (b49aa4d) vs motor canónico.
 *
 * NO es parte de la suite de vitest. Ejecutar manualmente:
 *   npx tsx scripts/compare-finance-test-v5.ts 2026-04 2026-08
 *
 * Usa EXCLUSIVAMENTE TEST V5 (byg-manager-test-v5 / br-flat-fire-acp039j3) vía
 * TEST_DIRECT_URL de .env.test.local. Verifica el host y aborta si es producción.
 * No escribe nada (solo findMany / findUnique).
 *
 * "Viejo" = réplica fiel de getResultadoCambioMensual (U1), getUtilidadMes (U2),
 * PN de /posicion y getBalanceGeneral de /reportes tal como estaban en b49aa4d.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { cargarFinanceDataset } from "../src/lib/finance/load";
import { construirLedger } from "../src/lib/finance/ledger";
import { calcularResultadoRealizado } from "../src/lib/finance/resultado";
import { calcularPatrimonioNeto } from "../src/lib/finance/patrimonio";
import { conciliarPeriodo } from "../src/lib/finance/reconciliacion";
import { rangoMes, ultimoDiaMes } from "../src/lib/finance/types";

const PRODUCTION_HOST_FRAGMENT = "ep-cool-hill-acuymnh3";
const EXPECTED_TEST_HOST_FRAGMENT = "ep-purple-waterfall-act57gj7";

function testUrl(): string {
  const raw = readFileSync(resolve(process.cwd(), ".env.test.local"), "utf8");
  const m = /^TEST_DIRECT_URL="([^"]+)"/m.exec(raw);
  if (!m) throw new Error("TEST_DIRECT_URL no encontrado en .env.test.local");
  const host = new URL(m[1]).hostname;
  if (host.includes(PRODUCTION_HOST_FRAGMENT)) throw new Error("ABORT: el host es PRODUCCIÓN");
  if (!host.includes(EXPECTED_TEST_HOST_FRAGMENT)) throw new Error(`ABORT: host inesperado ${host}`);
  return m[1];
}

const n = (v: unknown) => Number(v ?? 0);

/** Agrupa motivos por código (cantidad + primeros detalles) para un reporte legible. */
function resumirMotivos(rs: { code: string; severity: string; detail: string }[]) {
  const m = new Map<string, { severity: string; cantidad: number; ejemplos: string[] }>();
  for (const r of rs) {
    const e = m.get(r.code) ?? { severity: r.severity, cantidad: 0, ejemplos: [] };
    e.cantidad++;
    if (e.ejemplos.length < 2) e.ejemplos.push(r.detail);
    m.set(r.code, e);
  }
  return Object.fromEntries(m);
}
const r2 = (v: number | null) => (v === null ? null : Math.round(v * 100) / 100);

async function viejoU1(db: PrismaClient, mes: string) {
  const [ops, movs, cfg] = await Promise.all([
    db.operacionCambio.findMany({ where: { mesContable: mes } }),
    db.movimientoCaja.findMany({ where: { confirmado: true, descripcion: { startsWith: "[RESULTADO_OPERATIVO:" }, Caja: { esPrincipal: true } } }),
    db.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);
  const tc = n(cfg?.valor || "1000");
  let total = 0;
  for (const op of ops) {
    if (op.tipo.startsWith("COMPRA")) total += n(op.cantidad) - n(op.totalARS) / tc;
    else if (op.tipo.startsWith("VENTA")) total += -n(op.cantidad) + n(op.totalARS) / tc;
  }
  for (const m of movs) {
    const u = m.moneda === "ARS" ? n(m.monto) / tc : n(m.monto);
    total += m.tipo === "ENTRADA" ? u : -u;
  }
  return total;
}

async function viejoU2(db: PrismaClient, mes: string) {
  const [y, mm] = mes.split("-").map(Number);
  const desde = new Date(Date.UTC(y, mm - 1, 1));
  const hasta = new Date(Date.UTC(y, mm, 1));
  const VENTA = new Set(["VENTA_BONO", "VENTA_ACCION", "VENTA_CEDEAR", "CAUCION_COLOCADORA"]);
  const ING = new Set(["HONORARIO_CLIENTE", "HONORARIO_EXTERNO", "COMISION", "AJUSTE", "OTRO"]);
  const [ops, arb, movs, cfg] = await Promise.all([
    db.operacionCambio.findMany({ where: { mesContable: mes } }),
    db.operacionBolsa.findMany({ where: { grupoArbitrajeId: { not: null }, anulada: false, fechaOperativa: { gte: desde, lt: hasta } } }),
    db.movimientoCaja.findMany({ where: { confirmado: true, fecha: { gte: desde, lt: hasta }, descripcion: { startsWith: "[RESULTADO_OPERATIVO:" } } }),
    db.config.findUnique({ where: { clave: "tc_blue" } }),
  ]);
  const tc = n(cfg?.valor ?? "1000");
  let total = 0;
  for (const op of ops) {
    if (op.tipo.startsWith("COMPRA_")) total += n(op.cantidad) - n(op.totalARS) / tc;
    else if (op.tipo.startsWith("VENTA_")) total += -n(op.cantidad) + n(op.totalARS) / tc;
    else if (ING.has(op.tipo)) total += (n(op.totalARS) + n(op.cobroUSD) * tc) / tc;
    else if (op.tipo === "GASTO_OPERATIVO") total -= n(op.totalARS) / tc;
  }
  const grupos = new Map<string, typeof arb>();
  for (const o of arb) grupos.set(o.grupoArbitrajeId!, [...(grupos.get(o.grupoArbitrajeId!) ?? []), o]);
  for (const g of Array.from(grupos.values())) {
    if (!g.every((o) => o.estado !== "PENDIENTE_CONCERTACION")) continue;
    for (const o of g) {
      const v = n(o.cantidad) * n(o.precio) * (VENTA.has(o.tipoOperacion) ? 1 : -1);
      total += o.moneda === "ARS" ? v / tc : o.moneda === "USD" ? v : 0;
    }
  }
  for (const m of movs) {
    const ars = m.moneda === "USD" ? n(m.monto) * tc : n(m.monto);
    total += (m.tipo === "ENTRADA" ? ars : -ars) / tc;
  }
  return total;
}

async function viejoPN(db: PrismaClient) {
  const cfg = await db.config.findUnique({ where: { clave: "tc_blue" } });
  const tc = n(cfg?.valor ?? "1000");
  const [cajas, grp, clientes, carteras, props, pend, movAll, ccAll, pfAct, posAll] = await Promise.all([
    db.caja.findMany({ where: { activa: true } }),
    db.movimientoCaja.groupBy({ by: ["cajaId", "moneda", "tipo"], where: { confirmado: true }, _sum: { monto: true } }),
    db.cliente.findMany({ where: { activo: true }, include: { CuentaCorriente: true, PlazoFijo: { where: { estado: "ACTIVO" } } } }),
    db.cartera.findMany({ where: { activa: true }, include: { PosicionCartera: { include: { Activo: true } } } }),
    db.propiedad.findMany({ where: { activa: true }, include: { InversionInmobiliaria: true } }),
    db.movimientoCaja.findMany({ where: { confirmado: false, anulado: false, tipo: { in: ["ENTRADA", "SALIDA"] } } }),
    db.movimientoCaja.findMany({ where: { confirmado: true } }),
    db.cuentaCorriente.findMany(),
    db.plazoFijo.findMany({ where: { estado: "ACTIVO" } }),
    db.posicionCartera.findMany({ include: { Activo: true } }),
  ]);
  const ids = new Set(cajas.map((c) => c.id));
  let caja = cajas.reduce((s, c) => s + n(c.saldoInicialUSD) + n(c.saldoInicialARS) / tc, 0);
  for (const g of grp) {
    if (!ids.has(g.cajaId) || (g.moneda !== "USD" && g.moneda !== "ARS")) continue;
    const s = g.tipo === "ENTRADA" || g.tipo === "TRANSFERENCIA_IN" ? 1 : -1;
    caja += (s * n(g._sum.monto)) / (g.moneda === "ARS" ? tc : 1);
  }
  const cart = carteras.reduce((s, c) => s + c.PosicionCartera.reduce((a, p) => a + (p.Activo.precioActual == null ? 0 : n(p.cantidad) * (p.Activo.monedaPrecio === "ARS" ? n(p.Activo.precioActual) / tc : n(p.Activo.precioActual))), 0)
    + n(c.saldoUSDCable) + n(c.saldoUSDMep) + n(c.saldoPesos) / tc, 0);
  const prop = props.reduce((s, p) => s + p.InversionInmobiliaria.reduce((a, m) => m.tipo === "RENTA" ? a : a + (m.tipo === "INGRESO" || m.tipo === "MEJORA" ? 1 : -1) * (m.moneda === "ARS" ? n(m.monto) / tc : m.moneda === "USD" ? n(m.monto) : 0), 0), 0);
  let ccA = 0, ccP = 0, pf = 0;
  for (const c of clientes) {
    const t = c.CuentaCorriente.reduce((a, x) => a + (x.moneda === "USD" ? n(x.saldo) : x.moneda === "ARS" ? n(x.saldo) / tc : 0), 0);
    ccA += Math.max(0, -t); ccP += Math.max(0, t);
    pf += c.PlazoFijo.reduce((a, x) => a + (x.moneda === "USD" ? n(x.saldoActual) : n(x.saldoActual) / tc), 0);
  }
  const pu = (m: { moneda: string; monto: unknown }) => (m.moneda === "ARS" ? n(m.monto) / tc : n(m.monto));
  const rec = pend.filter((m) => m.tipo === "ENTRADA").reduce((s, m) => s + pu(m), 0);
  const pay = pend.filter((m) => m.tipo === "SALIDA").reduce((s, m) => s + pu(m), 0);
  const posicion = caja + cart + prop + ccA + rec - ccP - pf - pay;

  // getBalanceGeneral (reportes) b49aa4d
  const toUSD = (v: number, m: string) => (m === "ARS" ? v / tc : v);
  const cajaR = movAll.reduce((s, m) => s + (m.tipo === "ENTRADA" || m.tipo === "TRANSFERENCIA_IN" ? 1 : -1) * toUSD(n(m.monto), m.moneda), 0);
  let ccAr = 0, ccPr = 0;
  for (const c of ccAll) { const u = toUSD(n(c.saldo), c.moneda); if (u < 0) ccAr += -u; else ccPr += u; }
  const cartR = posAll.reduce((s, p) => s + n(p.cantidad) * (p.Activo.monedaPrecio === "ARS" ? n(p.Activo.precioActual ?? p.precioCompra) / tc : n(p.Activo.precioActual ?? p.precioCompra)), 0);
  const pfR = pfAct.reduce((s, p) => s + toUSD(n(p.capital), p.moneda), 0);
  const reportes = cajaR + ccAr + cartR - pfR - ccPr;
  return { posicion, reportes, tc };
}

async function main() {
  const meses = process.argv.slice(2).length ? process.argv.slice(2) : ["2026-04", "2026-08"];
  const db = new PrismaClient({ datasourceUrl: testUrl() });
  try {
    const ds = await cargarFinanceDataset(db);
    const ledger = construirLedger(ds);
    const out: Record<string, unknown> = { hoy: ds.hoy, tcAdvertencias: ds.tc.advertencias };

    for (const mes of meses) {
      const r = calcularResultadoRealizado(ds, ledger, mes);
      out[mes] = {
        viejoU1: r2(await viejoU1(db, mes)),
        viejoU2: r2(await viejoU2(db, mes)),
        nuevoRealizadoUSD: r2(r.totalUSD),
        quality: r.quality,
        knownSubtotalUSD: r2(r.knownSubtotalUSD),
        qualityReasons: resumirMotivos(r.qualityReasons),
        porCategoriaUSD: Object.fromEntries(Object.entries(r.porCategoria).filter(([, v]) => v.usd !== 0).map(([k, v]) => [k, r2(v.usd)])),
        fx: Object.fromEntries(Object.entries(r.fx).filter(([, v]) => v.cantidadVendida > 0)),
        excluidos: Object.fromEntries(Object.entries(r.excluidos).filter(([, v]) => v.cantidad > 0)),
        tc: { faltantes: r.tc.faltantes, aproximados: r.tc.aproximados.length, desfaseMaxDias: r.tc.desfaseMaxDias, fuentes: r.tc.fuentes },
        advertencias: Array.from(new Set(r.advertencias)).slice(0, 12),
      };
      const inicio = new Date(`${rangoMes(mes).desde}T00:00:00Z`);
      inicio.setUTCDate(inicio.getUTCDate() - 1);
      const c = conciliarPeriodo(ds, ledger, inicio.toISOString().slice(0, 10), ultimoDiaMes(mes));
      (out[mes] as Record<string, unknown>).invariante = {
        variacionNativa: c.variacionNativa, residualNativo: c.residualNativo, usd: c.usd,
        explicado: c.explicado, flujosPatrimonialesPorSubtipo: c.flujosPatrimonialesPorSubtipo,
        realizadoFueraDeComponentesHistoricos: c.realizadoFueraDeComponentesHistoricos, advertencias: c.advertencias,
      };
    }

    const viejo = await viejoPN(db);
    const pn = calcularPatrimonioNeto(ds);
    out.patrimonio = {
      viejoPosicion: r2(viejo.posicion),
      viejoReportes: r2(viejo.reportes),
      nuevoCanonico: r2(pn.pnUSD),
      quality: pn.quality,
      knownSubtotalUSD: r2(pn.knownSubtotalUSD),
      qualityReasons: resumirMotivos(pn.qualityReasons),
      corte: pn.corte,
      tcCorte: pn.tc,
      componentesUSD: Object.fromEntries(Object.entries(pn.componentes).map(([k, c]) => [k, r2(c.usd)])),
      custodiaExcluidaUSD: r2(pn.custodiaExcluidaUSD),
      advertencias: pn.advertencias.slice(0, 15),
      tcViejo: viejo.tc,
    };
    console.log(JSON.stringify(out, (_k, v) => (v instanceof Decimal ? v.toNumber() : v), 2));
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
