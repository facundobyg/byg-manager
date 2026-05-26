import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs") as {
  compare(data: string, encrypted: string): Promise<boolean>;
};
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { verifyTOTP } from "@/lib/auth/totp";
import { writeAuditLog } from "@/lib/services/audit.service";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, totpCode: {} },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.passwordHash || !user.activo) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!passwordsMatch) return null;

        // 2FA check — enforced here regardless of pre-check in login action
        if (user.twoFactorEnabled) {
          const totpCode = ((credentials.totpCode as string) ?? "").trim();
          if (!totpCode || !user.twoFactorSecret) return null;
          if (!verifyTOTP(user.twoFactorSecret, totpCode)) return null;
          // Record last TOTP use (fire-and-forget, non-blocking)
          prisma.user.update({
            where: { id: user.id },
            data:  { twoFactorLastUsedAt: new Date() },
          }).catch(() => {});
          writeAuditLog({
            userId:      user.id,
            accion:      "TOTP_LOGIN_OK",
            entidad:     "Auth",
            description: `Login 2FA exitoso: ${user.email}`,
          }).catch(() => {});
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "";
        token.id = user.id ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  session: {
    strategy:   "jwt",
    maxAge:     8 * 60 * 60,  // 8 hours
    updateAge:  1 * 60 * 60,  // refresh token every 1 hour
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path:     "/",
        secure:   process.env.NODE_ENV === "production",
      },
    },
  },
  events: {
    async signIn({ user }) {
      await writeAuditLog({
        accion:      "LOGIN_OK",
        entidad:     "Auth",
        userId:      user.id,
        description: `Login exitoso: ${user.email}`,
      });
    },
    async signOut() {
      await writeAuditLog({
        accion:      "LOGOUT",
        entidad:     "Auth",
        description: "Sesión cerrada",
      });
    },
  },
});
