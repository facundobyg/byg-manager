"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/services/audit.service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs") as {
  compare(data: string, encrypted: string): Promise<boolean>;
  hash(data: string, saltOrRounds: number): Promise<string>;
};

export async function changeOwnPassword(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth() as { user?: { id?: string; name?: string } } | null;
  if (!session?.user?.id) redirect("/login");

  const currentPassword = formData.get("currentPassword")?.toString();
  const newPassword     = formData.get("newPassword")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!currentPassword || !newPassword || !confirmPassword)
    return { error: "Todos los campos son obligatorios" };
  if (newPassword.length < 8)
    return { error: "La nueva contraseña debe tener al menos 8 caracteres" };
  if (newPassword !== confirmPassword)
    return { error: "Las contraseñas no coinciden" };
  if (currentPassword === newPassword)
    return { error: "La nueva contraseña debe ser diferente a la actual" };

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, name: true, email: true, passwordHash: true },
  });
  if (!user) redirect("/login");

  const currentOk = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentOk) return { error: "Contraseña actual incorrecta" };

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data:  { passwordHash: newHash, mustChangePassword: false, updatedAt: new Date() },
  });

  await writeAuditLog({
    userId:      user.id,
    accion:      "CHANGE_OWN_PASSWORD",
    entidad:     "User",
    entidadId:   user.id,
    description: `${user.name} cambió su propia contraseña`,
  });

  revalidatePath("/configuracion/mi-cuenta");
  return { ok: true };
}
