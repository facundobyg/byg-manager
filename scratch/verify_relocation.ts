import { prisma } from "../src/lib/prisma";

async function main() {
  const count = await prisma.movimientoCaja.count({
    where: {
      fecha: new Date(Date.UTC(2026, 4, 1))
    }
  });
  console.log(`Movements on 2026-05-01: ${count}`);
}

main();
