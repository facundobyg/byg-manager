"use server"

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs") as {
  compare(data: string, encrypted: string): Promise<boolean>;
};

export type LoginState = { error?: string; needsTwoFactor?: boolean } | undefined;

export async function authenticate(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email    = (formData.get("email")    as string ?? "").trim();
  const password = (formData.get("password") as string ?? "");
  const totpCode = (formData.get("totpCode") as string ?? "").trim();

  // Pre-check: if password is correct and 2FA is required, ask for TOTP code
  if (!totpCode) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { twoFactorEnabled: true, activo: true, passwordHash: true },
      });
      if (user?.activo && user.twoFactorEnabled && user.passwordHash) {
        const passwordOk = await bcrypt.compare(password, user.passwordHash);
        if (passwordOk) return { needsTwoFactor: true };
      }
    } catch {
      // fall through to signIn — will fail with generic error
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      totpCode,
      redirectTo: "/posicion",
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) return { error: "Credenciales inválidas." };
    return { error: "Error de servidor. Intente nuevamente." };
  }
}
