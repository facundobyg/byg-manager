import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
const prisma = new PrismaClient();

function xd(serial) {
  return new Date((serial - 25569) * 86400 * 1000);
}

const PF4_ID = "522ea650-49c2-4083-9a33-5c7e26a88d05"; // created in prior run

const movs = [
  { serial: 45412, monto: 115 },
  { serial: 45443, monto: 115 },
  { serial: 45473, monto: 115 },
  { serial: 45504, monto: 115 },
  { serial: 45534, monto: 115 },
  { serial: 45565, monto: 115 },
  { serial: 45596, monto: 115 },
  { serial: 45626, monto: 115 },
  { serial: 45656, monto: 115 },
  { serial: 45688, monto: 115 },
  { serial: 45716, monto: 115 },
  { serial: 45747, monto: 115 },
  { serial: 45777, monto: 115 },
  { serial: 45807, monto: 115 },
  { serial: 45838, monto: 115 },
  { serial: 45869, monto: 115 },
  { serial: 45900, monto: 115 },
  { serial: 45930, monto: 115 },
  { serial: 45961, monto: 124 },
  { serial: 45991, monto: 124 },
  { serial: 46022, monto: 124 },
  { serial: 46053, monto: 124 },
  { serial: 46081, monto: 124 },
  { serial: 46112, monto: 124 },
  { serial: 46142, monto: 124 },
];

async function main() {
  // Check existing movements
  const existingMovs = await prisma.plazoFijoMovimiento.count({ where: { plazoFijoId: PF4_ID } });
  console.log(`PF4 existing movements: ${existingMovs}`);
  if (existingMovs >= 25) {
    console.log("- movements already complete, skipping");
  } else {
    // Delete partial if any
    if (existingMovs > 0) {
      await prisma.plazoFijoMovimiento.deleteMany({ where: { plazoFijoId: PF4_ID } });
      console.log(`- cleared ${existingMovs} partial movements`);
    }
    let cumul = 0;
    for (const { serial, monto } of movs) {
      cumul += monto;
      await prisma.plazoFijoMovimiento.create({
        data: {
          id: randomUUID(),
          plazoFijoId: PF4_ID,
          tipo: "INTERES",
          monto,
          fecha: xd(serial),
          descripcion: "Interés mensual",
          saldoAcumulado: cumul,
        },
      });
    }
    console.log(`✓ Created ${movs.length} INTERES movements (cumul=${cumul})`);
  }

  // AFTER totals
  const cachiPFs = await prisma.plazoFijo.findMany({
    where: { Cliente: { nombre: { contains: "Cachi", mode: "insensitive" } } },
    select: { id: true, saldoActual: true },
  });
  const cereigidoPFs = await prisma.plazoFijo.findMany({
    where: { Cliente: { nombre: { contains: "Cereigido", mode: "insensitive" } } },
    select: { id: true, saldoActual: true },
  });
  const cachiTotal = cachiPFs.reduce((s, p) => s + Number(p.saldoActual), 0);
  const cereigidoTotal = cereigidoPFs.reduce((s, p) => s + Number(p.saldoActual), 0);
  console.log(`\nAFTER Cachi: ${cachiTotal} (${cachiPFs.length} PFs)  expected 63525 (4)`);
  console.log(`AFTER Cereigido: ${cereigidoTotal} (${cereigidoPFs.length} PFs)  expected 158385 (5)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
