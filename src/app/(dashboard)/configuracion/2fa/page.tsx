import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateQRCodeDataURL } from "@/lib/auth/totp";
import { generateSetupSecret } from "./actions";
import { SetupConfirmForm, DisableForm } from "./Forms";
import Link from "next/link";

const ROLES_CON_2FA = new Set(["ADMIN", "SOCIO", "EMPLEADO"]);

export default async function TwoFactorSetupPage() {
  const session = await auth() as { user?: { id?: string; role?: string } } | null;
  if (!session?.user?.role || !ROLES_CON_2FA.has(session.user.role)) redirect("/configuracion");

  const user = await prisma.user.findUnique({
    where: { id: session.user!.id },
    select: { email: true, twoFactorEnabled: true, twoFactorSecret: true, twoFactorLastUsedAt: true },
  });
  if (!user) redirect("/configuracion");

  let qrDataUrl: string | null = null;
  if (!user.twoFactorEnabled && user.twoFactorSecret) {
    qrDataUrl = await generateQRCodeDataURL(user.email, user.twoFactorSecret);
  }

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-lg">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Seguridad</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Autenticación 2FA</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">
          TOTP — Google Authenticator / Authy
        </p>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">
              Estado actual
            </h2>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                user.twoFactorEnabled
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {user.twoFactorEnabled ? "ACTIVADO" : "DESACTIVADO"}
            </span>
          </div>
          {user.twoFactorLastUsedAt && (
            <p className="text-[11px] text-slate-400 font-medium">
              Último uso:{" "}
              <span className="font-semibold text-slate-600">
                {new Date(user.twoFactorLastUsedAt).toLocaleString("es-AR", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </p>
          )}
        </div>

        <div className="px-6 py-6">
          {user.twoFactorEnabled ? (
            /* ── 2FA está ON — mostrar opción de desactivar ── */
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600">
                Cada vez que iniciés sesión necesitarás ingresar el código del autenticador.
              </p>
              <DisableForm />
            </div>
          ) : qrDataUrl ? (
            /* ── Secret generado pero no confirmado — mostrar QR ── */
            <SetupConfirmForm qrDataUrl={qrDataUrl} />
          ) : (
            /* ── Sin secret — mostrar botón de inicio ── */
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600">
                Activar 2FA agrega una capa de seguridad adicional. Al iniciar sesión se pedirá un código de 6 dígitos generado por tu autenticador.
              </p>
              <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                <li>Compatible con Google Authenticator, Authy, 1Password, Bitwarden</li>
                <li>El código cambia cada 30 segundos</li>
                <li>Si perdés acceso al autenticador, contactá al administrador de la base de datos</li>
              </ul>
              <form action={generateSetupSecret}>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Generar código QR
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      <Link href="/configuracion" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
        ← Volver a Configuración
      </Link>
    </div>
  );
}
