import type { NextAuthConfig } from 'next-auth';
import { ROLES_2FA_OBLIGATORIO } from './lib/auth/permission-registry';

// 2FA obligatorio SOLO para los roles de ROLES_2FA_OBLIGATORIO (hoy: ADMIN) — si
// no está activado, solo pueden navegar a las rutas de abajo (activar 2FA, su
// cuenta, o logout). Para SOCIO / EMPLEADO el 2FA es voluntario: sin redirect.
const RUTAS_2FA_PERMITIDAS = ['/configuracion/2fa', '/configuracion/mi-cuenta'];

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role?: string; id?: string; twoFactorEnabled?: boolean };
        token.role = u.role ?? '';
        token.id = u.id ?? '';
        token.twoFactorEnabled = u.twoFactorEnabled ?? false;
      }
      // trigger === 'update' NO se maneja acá: el payload viene del cliente y no
      // es confiable. auth.ts (runtime Node) lo refresca desde DB (jwt-refresh.ts).
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;

      const role = auth.user.role;
      if (ROLES_2FA_OBLIGATORIO.has(role) && !auth.user.twoFactorEnabled) {
        const permitido = RUTAS_2FA_PERMITIDAS.some(
          (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + '/'),
        );
        if (!permitido) return Response.redirect(new URL('/configuracion/2fa', nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
