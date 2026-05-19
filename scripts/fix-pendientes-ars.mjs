/**
 * Corrige la dirección (tipo) de los pendientes ARS cargados con signo incorrecto.
 * Usar: node --env-file=.env scripts/fix-pendientes-ars.mjs
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TO_SALIDA = [
  "Alquiler Trenque",
  "EXPENSAS alberdi",
  "Sueldo Hugo + AGUINALDO",
  "Prevision Monotributo",
  "DEBO GUIDO POR TTS",
  "DEBO CHULE",
];

const TO_ENTRADA = [
  "DEBE NANU POR TT",
  "DEBE FRAN",
  "DEBE INDUSTRIAL COMISIONES",
];

async function main() {
  console.log("=== Corrigiendo dirección de pendientes ARS ===\n");

  for (const desc of TO_SALIDA) {
    const r = await prisma.movimientoCaja.updateMany({
      where: { confirmado: false, moneda: "ARS", tipo: "ENTRADA", descripcion: { contains: desc } },
      data:  { tipo: "SALIDA" },
    });
    console.log(`  SALIDA  ${r.count > 0 ? "✓" : "·"} ${desc} (${r.count} actualizado)`);
  }

  for (const desc of TO_ENTRADA) {
    const r = await prisma.movimientoCaja.updateMany({
      where: { confirmado: false, moneda: "ARS", tipo: "SALIDA", descripcion: { contains: desc } },
      data:  { tipo: "ENTRADA" },
    });
    console.log(`  ENTRADA ${r.count > 0 ? "✓" : "·"} ${desc} (${r.count} actualizado)`);
  }

  console.log("\n=== Estado final pendientes ARS (confirmado=false) ===\n");
  const pend = await prisma.movimientoCaja.findMany({
    where: { confirmado: false, moneda: "ARS" },
    orderBy: [{ tipo: "asc" }, { monto: "asc" }],
  });

  for (const p of pend) {
    const dir = p.tipo === "ENTRADA" ? "↑ COBRAR" : "↓ PAGAR ";
    const monto = Number(p.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 });
    const desc = p.descripcion?.split(" - ")[0] ?? "";
    console.log(`  ${dir}  ARS ${monto.padStart(18)}  ${desc}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
