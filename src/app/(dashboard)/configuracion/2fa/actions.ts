"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateTOTPSecret, verifyTOTP } from "@/lib/auth/totp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/services/audit.service";

type ActionResult = { success: true } | { error: string };

async function getAdminUser() {
  const session = await auth() as { user?: { id?: string; role?: string } } | null;
  if (session?.user?.role !== "ADMIN") redirect("/");
  if (!session.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, twoFactorEnabled: true, twoFactorSecret: true, twoFactorLastUsedAt: true },
  });
  if (!user) redirect("/");
  return user;
}

export async function generateSetupSecret(): Promise<void> {
  const user = await getAdminUser();
  if (user.twoFactorEnabled) return;
  const secret = generateTOTPSecret();
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });
  revalidatePath("/configuracion/2fa");
}

export async function confirmEnable2FA(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const user = await getAdminUser();
  if (!user.twoFactorSecret) return { error: "Generá el código QR primero." };

  const code = ((formData.get("code") as string) ?? "").trim();
  if (!verifyTOTP(user.twoFactorSecret, code)) return { error: "Código incorrecto. Revisá el reloj del dispositivo." };

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });
  await writeAuditLog({ accion: "ENABLE_2FA_CONFIRMED", entidad: "Auth", userId: user.id, description: `2FA activado y confirmado: ${user.email}` });
  revalidatePath("/configuracion/2fa");
  return { success: true };
}

export async function disable2FA(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const user = await getAdminUser();
  if (!user.twoFactorEnabled) return { error: "2FA no está activado." };
  if (!user.twoFactorSecret) return { error: "Estado inconsistente. Contactá soporte." };

  const code = ((formData.get("code") as string) ?? "").trim();
  if (!verifyTOTP(user.twoFactorSecret, code)) return { error: "Código incorrecto." };

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  await writeAuditLog({ accion: "DISABLE_2FA_CONFIRMED", entidad: "Auth", userId: user.id, description: `2FA desactivado con código verificado: ${user.email}` });
  revalidatePath("/configuracion/2fa");
  return { success: true };
}
