import { prisma } from "../src/lib/prisma";

async function main() {
  const movs = await prisma.movimientoCaja.findMany({
    where: {
      OR: [
        { descripcion: { contains: "INICIAL", mode: "insensitive" } },
        { descripcion: { contains: "IMPORT", mode: "insensitive" } },
        { descripcion: { contains: "SALDO", mode: "insensitive" } }
      ]
    },
    take: 10
  });
  console.log(JSON.stringify(movs, null, 2));
}

main();
