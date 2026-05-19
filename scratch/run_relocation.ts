import { relocalizarMovimientosIniciales } from "../src/app/(dashboard)/operativa/mov-diarios/actions";

async function main() {
  console.log("Relocalizing initial/import movements to 01/05/2026...");
  const result = await relocalizarMovimientosIniciales();
  if (result.ok) {
    console.log(`Success! Updated ${result.count} movements.`);
  } else {
    console.error("Error:", result.error);
  }
}

main();
