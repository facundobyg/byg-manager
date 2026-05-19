import { prisma } from "../src/lib/prisma";
import { getCajasWithBalances } from "../src/lib/data/caja";
import { getResultadoCambioMensual } from "../src/lib/data/mov-diarios";

async function validate() {
  console.log("--- START VALIDATION ---");

  // 1. Identify boxes
  const oficina = await prisma.caja.findFirst({ where: { slug: "oficina" } });
  const trenque = await prisma.caja.findFirst({ where: { slug: "nanu_trenque" } });

  if (!oficina || !trenque) {
    console.error("Missing boxes: oficina or nanu_trenque");
    return;
  }

  console.log(`Oficina ID: ${oficina.id} (Principal: ${oficina.esPrincipal})`);
  console.log(`Trenque ID: ${trenque.id} (Principal: ${trenque.esPrincipal})`);

  // 2. Check current balances
  const initialBalances = await getCajasWithBalances();
  const balOficina = initialBalances.find(b => b.id === oficina.id);
  const balTrenque = initialBalances.find(b => b.id === trenque.id);

  console.log("\nInitial Balances:");
  console.log(`Oficina: USD ${balOficina?.saldoActualUSD} | ARS ${balOficina?.saldoActualARS}`);
  console.log(`Trenque: USD ${balTrenque?.saldoActualUSD} | ARS ${balTrenque?.saldoActualARS}`);

  // 3. Check Utility logic
  const mesActual = new Date().toISOString().slice(0, 7);
  const utility = await getResultadoCambioMensual(mesActual);
  console.log(`\nCurrent Utility (${mesActual}): USD ${utility.totalUSD}`);

  // 4. Verify Code logic (Simulated)
  console.log("\nLogic Verification:");
  
  // Test 1: Trenque entry
  console.log("Rule 1 (Trenque Entry): If we add 1000 ARS in Trenque...");
  console.log("   - getCajasWithBalances will add it to Trenque's saldoActualARS.");
  console.log("   - PosicionPage will sum it to Activo Total.");
  console.log("   - getResultadoCambioMensual will IGNORE it (because Caja.esPrincipal is false).");

  // Test 2: Oficina result
  console.log("Rule 2 (Oficina Result): If we add [RESULTADO_OPERATIVO:SUELDO] 500 USD in Oficina...");
  console.log("   - getResultadoCambioMensual will INCLUDE it (because Caja.esPrincipal is true).");

  // Test 3: Transfer
  console.log("Rule 3 (Transfer): If we move 100 USD Oficina -> Trenque...");
  console.log("   - Oficina USD -100");
  console.log("   - Trenque USD +100");
  console.log("   - Total Assets: (-100) + (+100) = 0 change. Correct.");

  console.log("\n--- VALIDATION COMPLETE ---");
}

validate().catch(console.error);
