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

type AvatarValidation = { ok: true; value: string | null } | { ok: false; error: string };

// Valida un avatar enviado como data URL: tamaño real decodificado + magic bytes
// reales del archivo (no solo el MIME que declara el navegador).
function validateAvatarDataUrl(raw: string): AvatarValidation {
  if (!raw) return { ok: true, value: null };

  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(raw);
  if (!match) return { ok: false, error: "Formato de imagen no permitido. Usá JPG, PNG o WebP." };

  const [, mime, b64] = match;

  let bytes: Buffer;
  try {
    bytes = Buffer.from(b64, "base64");
  } catch {
    return { ok: false, error: "Archivo de imagen inválido." };
  }

  if (bytes.length === 0 || bytes.length > 500 * 1024) {
    return { ok: false, error: "La imagen supera el límite de 500 KB." };
  }

  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng  = bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  const matchesDeclaredType =
    (mime === "jpeg" && isJpeg) ||
    (mime === "png"  && isPng)  ||
    (mime === "webp" && isWebp);

  if (!matchesDeclaredType) {
    return { ok: false, error: "El archivo no es una imagen válida (firma de bytes no coincide)." };
  }

  return { ok: true, value: raw };
}

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

export async function updateOwnProfile(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth() as { user?: { id?: string; name?: string } } | null;
  if (!session?.user?.id) redirect("/login");

  const name      = formData.get("name")?.toString().trim();
  const rawImage  = formData.get("image")?.toString() ?? "";
  const phone     = formData.get("phone")?.toString().trim() || null;
  const cargo     = formData.get("cargo")?.toString().trim() || null;
  const ubicacion = formData.get("ubicacion")?.toString().trim() || null;

  if (!name) return { error: "El nombre no puede estar vacío" };

  const imageResult = validateAvatarDataUrl(rawImage);
  if (!imageResult.ok) return { error: imageResult.error };
  const imageValue = imageResult.value;

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { name, image: imageValue, phone, cargo, ubicacion, updatedAt: new Date() },
  });

  await writeAuditLog({
    userId:      session.user.id,
    accion:      "UPDATE_OWN_PROFILE",
    entidad:     "User",
    entidadId:   session.user.id,
    description: `${session.user.name ?? "Usuario"} actualizó su perfil`,
  });

  revalidatePath("/configuracion/mi-cuenta");
  return { ok: true };
}
