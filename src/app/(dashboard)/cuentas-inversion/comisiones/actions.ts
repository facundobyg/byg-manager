"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string; success?: boolean };

export async function saveComisionesConfig(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const iibbRaw = formData.get("iibb_pct")?.toString().trim();
  const ipsRaw  = formData.get("ips_pct")?.toString().trim();
  const otroRaw = formData.get("otro_pct")?.toString().trim();

  const toNum = (raw: string | undefined) => {
    const n = parseFloat(raw ?? "");
    return isNaN(n) ? null : n;
  };

  const iibb = toNum(iibbRaw);
  const ips  = toNum(ipsRaw);
  const otro = toNum(otroRaw);

  if (iibb === null || iibb < 0 || iibb > 100) return { error: "IIBB % inválido (0–100)" };
  if (ips  === null || ips  < 0 || ips  > 100) return { error: "Participación IPS inválida (0–100)" };
  if (otro === null || otro < 0 || otro > 100) return { error: "Participación OTRO inválida (0–100)" };

  await Promise.all([
    prisma.config.upsert({
      where:  { clave: "comisiones_iibb_pct" },
      update: { valor: String(iibb) },
      create: { id: crypto.randomUUID(), clave: "comisiones_iibb_pct", valor: String(iibb), updatedAt: new Date() },
    }),
    prisma.config.upsert({
      where:  { clave: "comisiones_ips_pct" },
      update: { valor: String(ips) },
      create: { id: crypto.randomUUID(), clave: "comisiones_ips_pct", valor: String(ips), updatedAt: new Date() },
    }),
    prisma.config.upsert({
      where:  { clave: "comisiones_otro_pct" },
      update: { valor: String(otro) },
      create: { id: crypto.randomUUID(), clave: "comisiones_otro_pct", valor: String(otro), updatedAt: new Date() },
    }),
  ]);

  revalidatePath("/cuentas-inversion/comisiones");
  return { success: true };
}
