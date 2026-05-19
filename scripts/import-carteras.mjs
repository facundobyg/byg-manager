/**
 * Import carteras propias from Manager_BYG_v1_85_0.html backup
 * Source: DB.carteras section (lines ~2775-2886) + DB.precios
 * Usage: node --env-file=.env scripts/import-carteras.mjs
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// ── Prices from backup (DB.precios) ────────────────────────────────────────
const PRECIOS = {
  BONO_USD: { AE38:0.8093, AL29:0.6108, AL30:0.6061, AL35:0.7899, AL41:0.7473, CO26:0.101, GD30:0.6285, GD35:0.8021, GD38:0.8343, GD41:0.748, GD46:0.7 },
  ON_USD:   { BDC33:1.05, CS44D:1.01, HVS1D:1.0225, MGCMD:1.084, MGCQD:1.047, PNXCD:1.09, PN35D:1.057, TLCMD:1.1035, VSCTD:1.028, YM24D:1.0045 },
  ACCION_USD: { AAPL:259.48, AMC:1.39, BBARD:20.22, BRZU:106.99, GGALD:5.68, GLOBD:3.845, HIMS:27.09, JMIA:13.37, NIO:3.845, ROKU:95.2, SAVA:1.99, STNE:16.14, SUPV:12.21, UNH:286.93 },
  CEDEAR:   { AAPLD:19440, BABA:28460, BBAR:10180, BHIP:502, EWZ:28060, GLOB:5625, GPRK:12770, IBIT:7200, MELI:27100, META:44880, METR:2396, NU:13480, PYPL:9480, QQQ:46740, SNAP:10500, TSLA:43460, UPST:11880, VIST:30300, YPFD:59575 },
  CRIPTO:   { BTC:88331, ETH:2976, SOL:124.62 },
  FCI:      {},
};

// ── Cartera definitions ─────────────────────────────────────────────────────
const CARTERAS = [
  {
    nombre: "Daniel",
    slug:   "franciscodanielgiovini",
    tipo:   "COMPLETA",
    orden:  1,
    saldoUSDCable: 56509,
    saldoUSDMep:   0,
    saldoPesos:    22375910,
    posiciones: [
      // BONO_USD
      { ticker:"AE38",  desc:"Bono AE38",            cat:"BONO_USD",  qty:50000,  pcomp:0.5175,     moneda:"USD", fecha:"2024-01-01" },
      { ticker:"AL29",  desc:"Bono AL29",            cat:"BONO_USD",  qty:16640,  pcomp:0.6832,     moneda:"USD", fecha:"2024-01-01" },
      { ticker:"AL30",  desc:"Bono AL30",            cat:"BONO_USD",  qty:7845,   pcomp:0.502,      moneda:"USD", fecha:"2024-01-01" },
      { ticker:"AL41",  desc:"Bono AL41",            cat:"BONO_USD",  qty:200000, pcomp:0.4778,     moneda:"USD", fecha:"2024-01-01" },
      { ticker:"GD30",  desc:"Bono GD30",            cat:"BONO_USD",  qty:30000,  pcomp:0.549,      moneda:"USD", fecha:"2024-01-01" },
      { ticker:"GD35",  desc:"Bono GD35",            cat:"BONO_USD",  qty:50000,  pcomp:0.54,       moneda:"USD", fecha:"2024-01-01" },
      // ON_USD
      { ticker:"BDC33", desc:"BDC ON",               cat:"ON_USD",    qty:50000,  pcomp:0,          moneda:"USD", fecha:"2024-01-01" },
      { ticker:"MGCQD", desc:"MGCQ ON",              cat:"ON_USD",    qty:50000,  pcomp:0,          moneda:"USD", fecha:"2024-01-01" },
      { ticker:"VSCTD", desc:"VSC ON",               cat:"ON_USD",    qty:44000,  pcomp:0,          moneda:"USD", fecha:"2024-01-01" },
      { ticker:"YM24D", desc:"YPF ON",               cat:"ON_USD",    qty:50000,  pcomp:0,          moneda:"USD", fecha:"2024-01-01" },
      // FCI
      { ticker:"IAM RENTA USD", desc:"IAM Renta USD FCI", cat:"FCI", qty:30088, pcomp:0,            moneda:"USD", fecha:"2024-01-01" },
      { ticker:"IPA",   desc:"IPA FCI",              cat:"FCI",       qty:11701,  pcomp:0,          moneda:"USD", fecha:"2024-01-01" },
      // ACCION_USD (cable / ADR)
      { ticker:"AAPL",  desc:"Apple Inc.",           cat:"ACCION_USD", qty:30,    pcomp:248.65,     moneda:"USD", fecha:"2023-01-01" },
      { ticker:"AMC",   desc:"AMC Entertainment",    cat:"ACCION_USD", qty:550,   pcomp:12.83,      moneda:"USD", fecha:"2022-06-16" },
      { ticker:"BBARD", desc:"Banco BBVA Arg. ADR",  cat:"ACCION_USD", qty:500,   pcomp:12.25,      moneda:"USD", fecha:"2022-06-16" },
      { ticker:"BRZU",  desc:"Direxion Brazil 2X",   cat:"ACCION_USD", qty:70,    pcomp:84.1,       moneda:"USD", fecha:"2022-06-16" },
      { ticker:"GGALD", desc:"GGAL ADR",             cat:"ACCION_USD", qty:8000,  pcomp:5.414823,   moneda:"USD", fecha:"2023-01-01" },
      { ticker:"HIMS",  desc:"Hims & Hers Health",   cat:"ACCION_USD", qty:150,   pcomp:50.97,      moneda:"USD", fecha:"2023-01-01" },
      { ticker:"JMIA",  desc:"Jumia Technologies",   cat:"ACCION_USD", qty:400,   pcomp:14.1358,    moneda:"USD", fecha:"2022-06-16" },
      { ticker:"NIO",   desc:"NIO Inc.",             cat:"ACCION_USD", qty:650,   pcomp:10.53,      moneda:"USD", fecha:"2022-06-16" },
      { ticker:"ROKU",  desc:"Roku Inc.",            cat:"ACCION_USD", qty:20,    pcomp:181.7985,   moneda:"USD", fecha:"2022-06-16" },
      { ticker:"SAVA",  desc:"Cassava Sciences",     cat:"ACCION_USD", qty:1000,  pcomp:3.1834,     moneda:"USD", fecha:"2022-06-16" },
      { ticker:"STNE",  desc:"StoneCo Ltd.",         cat:"ACCION_USD", qty:320,   pcomp:17.546875,  moneda:"USD", fecha:"2022-06-16" },
      { ticker:"SUPV",  desc:"Grupo Supervielle",    cat:"ACCION_USD", qty:750,   pcomp:13.07,      moneda:"USD", fecha:"2022-06-16" },
      { ticker:"UNH",   desc:"UnitedHealth Group",   cat:"ACCION_USD", qty:20,    pcomp:315.13,     moneda:"USD", fecha:"2022-06-16" },
      // CEDEAR (acc_ars)
      { ticker:"AAPLD", desc:"Apple CEDEAR",         cat:"CEDEAR",    qty:550,   pcomp:5264.45,    moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"BBAR",  desc:"Banco BBVA Argentina", cat:"CEDEAR",    qty:900,   pcomp:2253.12,    moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"BHIP",  desc:"Boldt CEDEAR",         cat:"CEDEAR",    qty:50000, pcomp:238,        moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"EWZ",   desc:"iShares Brazil ETF",   cat:"CEDEAR",    qty:185,   pcomp:13546.28,   moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"GLOB",  desc:"Globant CEDEAR",       cat:"CEDEAR",    qty:330,   pcomp:10812.52,   moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"GPRK",  desc:"Grupo Pampa CEDEAR",   cat:"CEDEAR",    qty:400,   pcomp:10791.95,   moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"IBIT",  desc:"iShares Bitcoin Trust CEDEAR", cat:"CEDEAR", qty:1300, pcomp:7787,   moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"MELI",  desc:"MercadoLibre CEDEAR",  cat:"CEDEAR",    qty:780,   pcomp:5638.78,    moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"META",  desc:"Meta CEDEAR",          cat:"CEDEAR",    qty:250,   pcomp:2276.69,    moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"METR",  desc:"Metrogas CEDEAR",      cat:"CEDEAR",    qty:1700,  pcomp:2313.63,    moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"NU",    desc:"Nu Holdings CEDEAR",   cat:"CEDEAR",    qty:410,   pcomp:6139.64,    moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"PYPL",  desc:"PayPal CEDEAR",        cat:"CEDEAR",    qty:300,   pcomp:3792.96,    moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"QQQ",   desc:"QQQ ETF CEDEAR",       cat:"CEDEAR",    qty:200,   pcomp:3531.42,    moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"SNAP",  desc:"Snap CEDEAR",          cat:"CEDEAR",    qty:100,   pcomp:11579.39,   moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"TSLA",  desc:"Tesla CEDEAR",         cat:"CEDEAR",    qty:450,   pcomp:13977.51,   moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"UPST",  desc:"Upstart CEDEAR",       cat:"CEDEAR",    qty:250,   pcomp:4076.36,    moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"VIST",  desc:"Vista Energy CEDEAR",  cat:"CEDEAR",    qty:200,   pcomp:20331.93,   moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"YPFD",  desc:"YPF CEDEAR",           cat:"CEDEAR",    qty:100,   pcomp:18854.61,   moneda:"ARS", fecha:"2023-01-01" },
    ],
  },

  {
    nombre: "Grace",
    slug:   "gracuelasusanafulgueiras",
    tipo:   "COMPLETA",
    orden:  2,
    saldoUSDCable: 27982,
    saldoUSDMep:   0,
    saldoPesos:    9471207,
    posiciones: [
      // BONO_USD
      { ticker:"AE38",  desc:"Bono AE38",            cat:"BONO_USD",  qty:20000,  pcomp:0.5175,  moneda:"USD", fecha:"2024-01-01" },
      { ticker:"AL30",  desc:"Bono AL30",            cat:"BONO_USD",  qty:4500,   pcomp:0.502,   moneda:"USD", fecha:"2024-01-01" },
      { ticker:"AL35",  desc:"Bono AL35",            cat:"BONO_USD",  qty:20000,  pcomp:0.5019,  moneda:"USD", fecha:"2024-01-01" },
      { ticker:"AL41",  desc:"Bono AL41",            cat:"BONO_USD",  qty:65000,  pcomp:0.4778,  moneda:"USD", fecha:"2024-01-01" },
      { ticker:"GD30",  desc:"Bono GD30",            cat:"BONO_USD",  qty:20000,  pcomp:0.549,   moneda:"USD", fecha:"2024-01-01" },
      { ticker:"GD35",  desc:"Bono GD35",            cat:"BONO_USD",  qty:20000,  pcomp:0.54,    moneda:"USD", fecha:"2024-01-01" },
      // ON_USD
      { ticker:"HVS1D", desc:"Havanna ON",           cat:"ON_USD",    qty:29500,  pcomp:0,       moneda:"USD", fecha:"2024-01-01" },
      { ticker:"MGCMD", desc:"MGCM ON",              cat:"ON_USD",    qty:50000,  pcomp:0,       moneda:"USD", fecha:"2024-01-01" },
      { ticker:"PNXCD", desc:"Pan American serie C", cat:"ON_USD",    qty:50000,  pcomp:0,       moneda:"USD", fecha:"2024-01-01" },
      // ACCION_USD
      { ticker:"GGALD", desc:"GGAL ADR",             cat:"ACCION_USD", qty:1500,  pcomp:5.77,    moneda:"USD", fecha:"2023-01-01" },
      { ticker:"GLOBD", desc:"Globant ADR",          cat:"ACCION_USD", qty:800,   pcomp:7.29125, moneda:"USD", fecha:"2023-01-01" },
      { ticker:"NIO",   desc:"NIO Inc.",             cat:"ACCION_USD", qty:2000,  pcomp:4.915,   moneda:"USD", fecha:"2023-01-01" },
      // CEDEAR
      { ticker:"BABA",  desc:"Alibaba CEDEAR",       cat:"CEDEAR",    qty:280,   pcomp:3520.23, moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"MELI",  desc:"MercadoLibre CEDEAR",  cat:"CEDEAR",    qty:200,   pcomp:1561.39, moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"QQQ",   desc:"QQQ ETF CEDEAR",       cat:"CEDEAR",    qty:200,   pcomp:3568.45, moneda:"ARS", fecha:"2023-01-01" },
      { ticker:"TSLA",  desc:"Tesla CEDEAR",         cat:"CEDEAR",    qty:150,   pcomp:5074.64, moneda:"ARS", fecha:"2023-01-01" },
    ],
  },

  {
    nombre: "BYG",
    slug:   "augustoberjolish",
    tipo:   "COMPLETA",
    orden:  3,
    saldoUSDCable: 36670,
    saldoUSDMep:   0,
    saldoPesos:    2939699,
    posiciones: [
      { ticker:"CS44D", desc:"ON Cresud",        cat:"ON_USD", qty:19500, pcomp:1.01954, moneda:"USD", fecha:"2025-12-12" },
      { ticker:"PN35D", desc:"Pan American ON",  cat:"ON_USD", qty:24500, pcomp:1.0175,  moneda:"USD", fecha:"2025-12-11" },
    ],
  },

  {
    nombre: "Binance",
    slug:   "binance",
    tipo:   "CRIPTO",
    orden:  4,
    saldoUSDCable: 664,
    saldoUSDMep:   0,
    saldoPesos:    0,
    posiciones: [
      // Only BYG-owned entries from binance (propietario='BYG')
      { ticker:"BTC",  desc:"Bitcoin",  cat:"CRIPTO", qty:0.10781,  pcomp:92750.51, moneda:"USD", fecha:"2025-12-03" },
      { ticker:"ETH",  desc:"Ethereum", cat:"CRIPTO", qty:2,        pcomp:3120.88,  moneda:"USD", fecha:"2025-12-03" },
      { ticker:"SOL",  desc:"Solana",   cat:"CRIPTO", qty:45.26,    pcomp:155.46,   moneda:"USD", fecha:"2025-12-03" },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtN(n, d = 2) {
  return Number(n).toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function getPrecioActual(cat, ticker) {
  const p = PRECIOS[cat]?.[ticker];
  return p != null ? p : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const now = new Date();

  console.log("══════════════════════════════════════════════════");
  console.log("  IMPORT CARTERAS — Backup v1.85.0");
  console.log("══════════════════════════════════════════════════\n");

  // PREVIEW
  for (const c of CARTERAS) {
    console.log(`  ▸ ${c.nombre.padEnd(8)} (${c.tipo}) | USD cable: ${fmtN(c.saldoUSDCable)} | USD MEP: ${fmtN(c.saldoUSDMep)} | ARS: ${fmtN(c.saldoPesos, 0)} | Posiciones: ${c.posiciones.length}`);
  }
  console.log("");

  for (const cd of CARTERAS) {
    console.log(`\n══ ${cd.nombre.toUpperCase()} ══`);

    // 1. Upsert Cartera
    const existing = await prisma.cartera.findUnique({ where: { slug: cd.slug } });
    const cartera = await prisma.cartera.upsert({
      where: { slug: cd.slug },
      update: {
        nombre:        cd.nombre,
        tipo:          cd.tipo,
        orden:         cd.orden,
        saldoUSDCable: cd.saldoUSDCable,
        saldoUSDMep:   cd.saldoUSDMep,
        saldoPesos:    cd.saldoPesos,
        activa:        true,
        updatedAt:     now,
      },
      create: {
        id:            randomUUID(),
        nombre:        cd.nombre,
        slug:          cd.slug,
        tipo:          cd.tipo,
        orden:         cd.orden,
        saldoUSDCable: cd.saldoUSDCable,
        saldoUSDMep:   cd.saldoUSDMep,
        saldoPesos:    cd.saldoPesos,
        activa:        true,
        updatedAt:     now,
      },
    });
    console.log(`  ${existing ? "↺ Actualizada" : "✓ Creada"} cartera ID=${cartera.id}`);

    // 2. Delete existing positions for clean import
    const deleted = await prisma.posicionCartera.deleteMany({ where: { carteraId: cartera.id } });
    if (deleted.count > 0) console.log(`  · Eliminadas ${deleted.count} posiciones anteriores`);

    // 3. Upsert Activos + create positions
    let created = 0;
    for (const pos of cd.posiciones) {
      const precioActual = getPrecioActual(pos.cat, pos.ticker);

      // Upsert Activo by ticker
      await prisma.activo.upsert({
        where: { ticker: pos.ticker },
        update: {
          descripcion:  pos.desc,
          categoria:    pos.cat,
          monedaPrecio: pos.moneda,
          precioActual: precioActual,
          updatedAt:    now,
        },
        create: {
          id:           randomUUID(),
          ticker:       pos.ticker,
          descripcion:  pos.desc,
          categoria:    pos.cat,
          monedaPrecio: pos.moneda,
          precioActual: precioActual,
          updatedAt:    now,
        },
      });

      // Find activo for FK
      const activo = await prisma.activo.findUnique({ where: { ticker: pos.ticker } });

      // Create PosicionCartera
      await prisma.posicionCartera.create({
        data: {
          id:          randomUUID(),
          carteraId:   cartera.id,
          activoId:    activo.id,
          cantidad:    pos.qty,
          precioCompra: pos.pcomp,
          fecha:       new Date(pos.fecha),
          updatedAt:   now,
        },
      });

      const priceStr = precioActual != null ? `@ ${pos.moneda} ${fmtN(precioActual, pos.cat === "CEDEAR" ? 0 : 4)}` : "@ precio pendiente";
      console.log(`    ✓ ${pos.ticker.padEnd(18)} ${pos.cat.padEnd(12)} qty=${fmtN(pos.qty, 0).padStart(8)}  ${priceStr}`);
      created++;
    }
    console.log(`  → ${created} posiciones importadas`);
  }

  // VERIFICATION
  console.log("\n══ VERIFICACIÓN FINAL ══");
  for (const cd of CARTERAS) {
    const c = await prisma.cartera.findUnique({
      where: { slug: cd.slug },
      include: { PosicionCartera: { include: { Activo: true } } },
    });

    let totalInv = 0;
    let totalVal = 0;
    for (const pos of c.PosicionCartera) {
      const qty = Number(pos.cantidad);
      const pcomp = Number(pos.precioCompra);
      const pact = pos.Activo.precioActual != null ? Number(pos.Activo.precioActual) : null;
      totalInv += qty * pcomp;
      if (pact != null) totalVal += qty * pact;
    }

    console.log(`  ${c.nombre.padEnd(8)} | ${c.PosicionCartera.length} pos | USD cable ${fmtN(Number(c.saldoUSDCable))} | inv ${fmtN(totalInv, 0)} | val ${fmtN(totalVal, 0)}`);
  }

  console.log("\n  ✅ Import completo");
  console.log("  ⚠  Precios son de backup (dic 2025). Actualizar via /precios o Activos.");
  console.log("  ⚠  FCI (IAM RENTA USD, IPA): precioActual=null — pendiente de precio.");
  console.log("  ⚠  ONs con pcomp=0: datos no disponibles en backup.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
