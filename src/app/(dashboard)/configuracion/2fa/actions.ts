"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateTOTPSecret, verifyTOTP } from "@/lib/auth/totp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/services/audit.service";
import { requireOwnAccountGuard } from "@/lib/auth/permissions";

type ActionResult = { success: true } | { error: string };

const ROLES_CON_2FA = new Set(["ADMIN", "SOCIO", "EMPLEADO"]);

// Cuenta propia: usuario activo, actor real (no "ver como"), no readOnly.
// Sin 2FA previo a propósito: es el flujo que lo activa. El rol sale de DB.
async function getOwnUser() {
  const guard = await requireOwnAccountGuard({ allowWithout2FA: true });
  if ("error" in guard) return guard;
  const user = await prisma.user.findUnique({
    where: { id: guard.userId },
    select: { id: true, email: true, role: true, twoFactorEnabled: true, twoFactorSecret: true, twoFactorLastUsedAt: true },
  });
  if (!user || !ROLES_CON_2FA.has(user.role)) return { error: "Sin permisos" };
  return user;
}

export async function generateSetupSecret(): Promise<void> {
  const user = await getOwnUser();
  if ("error" in user) return;
  if (user.twoFactorEnabled) return;
  const secret = generateTOTPSecret();
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });
  revalidatePath("/configuracion/2fa");
}

export async function confirmEnable2FA(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const user = await getOwnUser();
  if ("error" in user) return user;
  if (!user.twoFactorSecret) return { error: "Generá el código QR primero." };

  const code = ((formData.get("code") as string) ?? "").trim();
  if (!verifyTOTP(user.twoFactorSecret, code)) return { error: "Código incorrecto. Revisá el reloj del dispositivo." };

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });
  await writeAuditLog({ accion: "ENABLE_2FA_CONFIRMED", entidad: "Auth", userId: user.id, description: `2FA activado y confirmado: ${user.email}` });
  await unstable_update({ user: { twoFactorEnabled: true } }).catch(() => {});
  revalidatePath("/configuracion/2fa");
  return { success: true };
}

export async function disable2FA(_prev: unknown, formData: FormData): Promise<ActionResult> {
  // Exige el código TOTP actual (abajo): solo puede desactivarlo quien lo tiene.
  const user = await getOwnUser();
  if ("error" in user) return user;
  if (!user.twoFactorEnabled) return { error: "2FA no está activado." };
  if (!user.twoFactorSecret) return { error: "Estado inconsistente. Contactá soporte." };

  const code = ((formData.get("code") as string) ?? "").trim();
  if (!verifyTOTP(user.twoFactorSecret, code)) return { error: "Código incorrecto." };

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  await writeAuditLog({ accion: "DISABLE_2FA_CONFIRMED", entidad: "Auth", userId: user.id, description: `2FA desactivado con código verificado: ${user.email}` });
  await unstable_update({ user: { twoFactorEnabled: false } }).catch(() => {});
  revalidatePath("/configuracion/2fa");
  return { success: true };
}
