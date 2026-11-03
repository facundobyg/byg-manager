import { prisma } from "@/lib/prisma";
import { liquidarInteresCCTx, type LiquidacionCCInput, type LiquidacionCCResult } from "@/lib/cc/integridad.service";

export type { LiquidacionCCInput, LiquidacionCCResult };

/**
 * Liquida el interés CC de un período. MACRO 4 (F): lectura, cálculo, validación y
 * aplicación ocurren en UNA transacción, después del lock de la cuenta
 * (liquidarInteresCCTx); ninguna lectura previa decide el monto.
 */
export async function liquidarInteresCC(input: LiquidacionCCInput): Promise<LiquidacionCCResult> {
  return prisma.$transaction((tx) => liquidarInteresCCTx(tx, input), { timeout: 15000 });
}
