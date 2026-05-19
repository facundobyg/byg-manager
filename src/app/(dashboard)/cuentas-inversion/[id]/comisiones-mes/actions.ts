"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { readOnlyPreview } from "@/lib/config";

export async function saveConfigComisionesBolsa(
  _prevState: unknown,
  formData: FormData,
) {
  if (readOnlyPreview) return { error: "Modo lectura activo" };

  const iibbPct  = parseFloat(formData.get("iibbPct")  as string);
  const bancoPct = parseFloat(formData.get("bancoPct") as string);
  const ipsPct   = parseFloat(formData.get("ipsPct")   as string);
  const otroPct  = parseFloat(formData.get("otroPct")  as string);

  if ([iibbPct, bancoPct, ipsPct, otroPct].some(isNaN))
    return { error: "Todos los porcentajes deben ser números válidos" };

  const upsert = (clave: string, valor: number) =>
    prisma.config.upsert({
      where:  { clave },
      update: { valor: String(valor), updatedAt: new Date() },
      create: { id: crypto.randomUUID(), clave, valor: String(valor), updatedAt: new Date() },
    });

  await prisma.$transaction([
    upsert("bolsa_iibb_pct",  iibbPct),
    upsert("bolsa_banco_pct", bancoPct),
    upsert("bolsa_ips_pct",   ipsPct),
    upsert("bolsa_otro_pct",  otroPct),
  ]);

  revalidatePath("/cuentas-inversion", "layout");
  return { ok: true as const };
}
