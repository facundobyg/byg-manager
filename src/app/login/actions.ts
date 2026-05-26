"use server"

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { isRateLimited, recordFailedAttempt } from "@/lib/auth/rate-limit";
import { writeAuditLog } from "@/lib/services/audit.service";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs") as {
  compare(data: string, encrypted: string): Promise<boolean>;
};

export type LoginState = { error?: string; needsTwoFactor?: boolean } | undefined;

async function getClientIp(): Promise<string> {
  const store = await headers();
  return store.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function authenticate(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email    = (formData.get("email")    as string ?? "").trim();
  const password = (formData.get("password") as string ?? "");
  const totpCode = (formData.get("totpCode") as string ?? "").trim();

  const ip = await getClientIp();

  // ── Rate limit ────────────────────────────────────────────────────────────
  if (isRateLimited(ip)) {
    return { error: "Demasiados intentos. Esperá unos minutos." };
  }

  // ── 2FA pre-check: if enabled and password correct, ask for TOTP ─────────
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
      // fall through to signIn
    }
  }

  // ── signIn ────────────────────────────────────────────────────────────────
  try {
    await signIn("credentials", { email, password, totpCode, redirectTo: "/posicion" });
  } catch (error) {
    if (isRedirectError(error)) throw error; // success — redirect is intentional

    if (error instanceof AuthError) {
      recordFailedAttempt(ip);
      await writeAuditLog({
        accion:      "LOGIN_FAIL",
        entidad:     "Auth",
        description: `Login fallido: ${email} desde IP ${ip}`,
      });
      return { error: "Credenciales inválidas." };
    }

    // Unexpected server error — log internally, never expose to client
    console.error("[login] unexpected error:", error);
    return { error: "Error de servidor. Intente nuevamente." };
  }
}
