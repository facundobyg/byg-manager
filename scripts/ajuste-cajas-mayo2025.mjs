/**
 * Ajuste de saldos de cajas + carga de pendientes a liquidar
 * Fuente: Excel backup mayo 2025
 * Usar: node scripts/ajuste-cajas-mayo2025.mjs
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// ── Saldos objetivo según Excel ─────────────────────────────────────────────
const TARGET = {
  oficina:        { usd: 51551,      ars: 7465430     },
  facu_cas:       { usd: 0,          ars: 0           },
  fran:           { usd: 20000,      ars: 0           },
  nanu_trenque:   { usd: 23833,      ars: 14430100    },
  banco_fran:     { usd: 25000,      ars: 0           },
  caja_seguridad: { usd: 160000,     ars: 0           },
};

const EXPECTED_TOTAL = { usd: 280384, ars: 21895530 };

// ── Pendientes a liquidar (van a OFI, confirmado=false) ──────────────────────
const PENDIENTES_USD = [
  { tipo: "ENTRADA", monto: 5000,   desc: "DEBE ARNAUD" },
  { tipo: "ENTRADA", monto: 1100,   desc: "DEBE GERARD" },
  { tipo: "ENTRADA", monto: 2000,   desc: "DEBE BARBI" },
  { tipo: "SALIDA",  monto: 1800,   desc: "DEBO CHULE" },
];

const PENDIENTES_ARS = [
  { tipo: "ENTRADA", monto: 209350,      desc: "Alquiler Trenque" },
  { tipo: "ENTRADA", monto: 210000,      desc: "EXPENSAS alberdi" },
  { tipo: "ENTRADA", monto: 600000,      desc: "Sueldo Hugo + AGUINALDO" },
  { tipo: "ENTRADA", monto: 1401200,     desc: "Prevision Monotributo" },
  { tipo: "ENTRADA", monto: 1393650,     desc: "DEBO GUIDO POR TTS" },
  { tipo: "SALIDA",  monto: 1280000,     desc: "DEBO FACU" },
  { tipo: "SALIDA",  monto: 955650,      desc: "DEBE NANU POR TT" },
  { tipo: "SALIDA",  monto: 1300000,     desc: "DEBE FRAN" },
  { tipo: "ENTRADA", monto: 130000,      desc: "DEBO CHULE" },
  { tipo: "SALIDA",  monto: 34698443.50, desc: "DEBE INDUSTRIAL COMISIONES" },
];

const AJUSTE_DESC = "AJUSTE INICIAL BACKUP EXCEL - caja física";

// ── Helpers ──────────────────────────────────────────────────────────────────
async function calcBalance(cajaId) {
  const aggr = await prisma.movimientoCaja.groupBy({
    by: ["moneda", "tipo"],
    where: { cajaId, confirmado: true },
    _sum: { monto: true },
  });
  let usd = 0, ars = 0;
  for (const g of aggr) {
    const m = Number(g._sum.monto ?? 0);
    const add = g.tipo === "ENTRADA" || g.tipo === "TRANSFERENCIA_IN";
    if (g.moneda === "USD") usd = add ? usd + m : usd - m;
    if (g.moneda === "ARS") ars = add ? ars + m : ars - m;
  }
  return { usd, ars };
}

function fmtN(n) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // ── 1. Crear caja FRAN si no existe ────────────────────────────────────────
  console.log("=== PASO 1: Crear caja FRAN si falta ===");

  const franExiste = await prisma.caja.findUnique({ where: { slug: "fran" } });
  if (!franExiste) {
    await prisma.caja.create({
      data: {
        id: randomUUID(),
        slug: "fran",
        label: "FRAN",
        orden: 6,
        saldoInicialUSD: 0,
        saldoInicialARS: 0,
        activa: true,
        esPrincipal: false,
      },
    });
    console.log("  ✓ Caja FRAN creada");
  } else {
    console.log("  · Caja FRAN ya existe");
  }

  // ── 2. Ajustar saldos ──────────────────────────────────────────────────────
  console.log("\n=== PASO 2: Ajustar saldos de cajas ===");

  const cajas = await prisma.caja.findMany({ where: { activa: true }, orderBy: { orden: "asc" } });

  for (const caja of cajas) {
    const target = TARGET[caja.slug];
    if (!target) {
      console.log(`  · ${caja.slug}: sin target, omitida`);
      continue;
    }

    const mov = await calcBalance(caja.id);
    const curUSD = Number(caja.saldoInicialUSD) + mov.usd;
    const curARS = Number(caja.saldoInicialARS) + mov.ars;
    const dUSD = target.usd - curUSD;
    const dARS = target.ars - curARS;

    console.log(`  ${caja.slug.padEnd(16)} cur USD=${fmtN(curUSD)} ARS=${fmtN(curARS)} | Δ USD=${fmtN(dUSD)} ARS=${fmtN(dARS)}`);

    if (Math.abs(dUSD) > 0.005) {
      await prisma.movimientoCaja.create({
        data: {
          id: randomUUID(),
          cajaId: caja.id,
          fecha: today,
          tipo: dUSD > 0 ? "ENTRADA" : "SALIDA",
          moneda: "USD",
          monto: Math.abs(dUSD),
          descripcion: AJUSTE_DESC,
          confirmado: true,
        },
      });
      console.log(`    ✓ USD ajuste ${dUSD > 0 ? "+" : ""}${fmtN(dUSD)}`);
    }

    if (Math.abs(dARS) > 0.005) {
      await prisma.movimientoCaja.create({
        data: {
          id: randomUUID(),
          cajaId: caja.id,
          fecha: today,
          tipo: dARS > 0 ? "ENTRADA" : "SALIDA",
          moneda: "ARS",
          monto: Math.abs(dARS),
          descripcion: AJUSTE_DESC,
          confirmado: true,
        },
      });
      console.log(`    ✓ ARS ajuste ${dARS > 0 ? "+" : ""}${fmtN(dARS)}`);
    }

    if (Math.abs(dUSD) <= 0.005 && Math.abs(dARS) <= 0.005) {
      console.log(`    · Ya en target`);
    }
  }

  // ── 3. Crear pendientes (unconfirmed) en caja principal ───────────────────
  console.log("\n=== PASO 3: Cargar pendientes a liquidar ===");

  const principal = await prisma.caja.findFirst({ where: { esPrincipal: true } });
  if (!principal) throw new Error("No hay caja principal");
  console.log(`  Caja principal: ${principal.slug}`);

  // Eliminar pendientes con mismo tag para no duplicar
  const deleted = await prisma.movimientoCaja.deleteMany({
    where: {
      cajaId: principal.id,
      confirmado: false,
      descripcion: { contains: AJUSTE_DESC },
    },
  });
  if (deleted.count > 0) console.log(`  · Eliminados ${deleted.count} pendientes anteriores (re-carga)`);

  for (const p of PENDIENTES_USD) {
    await prisma.movimientoCaja.create({
      data: {
        id: randomUUID(),
        cajaId: principal.id,
        fecha: today,
        tipo: p.tipo,
        moneda: "USD",
        monto: p.monto,
        descripcion: `${p.desc} - ${AJUSTE_DESC}`,
        confirmado: false,
      },
    });
    console.log(`  ✓ USD ${p.tipo === "ENTRADA" ? "+" : "-"}${fmtN(p.monto)} — ${p.desc}`);
  }

  for (const p of PENDIENTES_ARS) {
    await prisma.movimientoCaja.create({
      data: {
        id: randomUUID(),
        cajaId: principal.id,
        fecha: today,
        tipo: p.tipo,
        moneda: "ARS",
        monto: p.monto,
        descripcion: `${p.desc} - ${AJUSTE_DESC}`,
        confirmado: false,
      },
    });
    console.log(`  ✓ ARS ${p.tipo === "ENTRADA" ? "+" : "-"}${fmtN(p.monto)} — ${p.desc}`);
  }

  // ── 4. Verificación final ──────────────────────────────────────────────────
  console.log("\n=== PASO 4: Verificación final ===");

  const cajasFinales = await prisma.caja.findMany({ where: { activa: true }, orderBy: { orden: "asc" } });
  let totalUSD = 0, totalARS = 0;

  for (const caja of cajasFinales) {
    const mov = await calcBalance(caja.id);
    const usd = Number(caja.saldoInicialUSD) + mov.usd;
    const ars = Number(caja.saldoInicialARS) + mov.ars;
    totalUSD += usd;
    totalARS += ars;
    console.log(`  ${caja.label.padEnd(20)} USD: ${fmtN(usd).padStart(14)}  ARS: ${fmtN(ars).padStart(18)}`);
  }

  console.log("  " + "─".repeat(60));
  console.log(`  ${"TOTAL".padEnd(20)} USD: ${fmtN(totalUSD).padStart(14)}  ARS: ${fmtN(totalARS).padStart(18)}`);
  console.log(`  ${"ESPERADO".padEnd(20)} USD: ${fmtN(EXPECTED_TOTAL.usd).padStart(14)}  ARS: ${fmtN(EXPECTED_TOTAL.ars).padStart(18)}`);

  const usdOk = Math.abs(totalUSD - EXPECTED_TOTAL.usd) < 0.01;
  const arsOk = Math.abs(totalARS - EXPECTED_TOTAL.ars) < 0.01;
  console.log(`\n  USD ✓: ${usdOk}  ARS ✓: ${arsOk}`);

  if (!usdOk || !arsOk) {
    console.error("\n  ⚠ TOTALES NO COINCIDEN — revisar ajustes");
    process.exit(1);
  }

  console.log("\n  ✅ Cajas ajustadas correctamente");
  console.log("  ✅ Pendientes cargados");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
