import { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Topbar } from "@/components/layout/Topbar";
import { auth } from "@/auth";
import { readOnlyPreview, betaMode } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { getEffectivePermissions } from "@/lib/auth/permissions";
import { getNotifications, type AppNotification } from "@/lib/data/notifications";

const PREVIEW_COOKIE = "byg_preview_user";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  let carteras: { nombre: string; slug: string }[] = [];
  let cuentasInversion: { id: string; nombre: string }[] = [];
  let session = null;
  let previewUsers: { id: string; name: string; role: string }[] = [];
  let currentPreviewId: string | null = null;
  let allowedPermissions: string[] | null = null;
  let notifications: AppNotification[] = [];
  let mustChangePassword = false;
  let userImage: string | null = null;

  try {
    const results = await Promise.allSettled([
      auth(),
      prisma.cartera.findMany({
        select: { nombre: true, slug: true },
        orderBy: { orden: "asc" },
      }),
      prisma.cuentaInversion.findMany({
        where: { activa: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: "asc" },
      }),
    ]);

    if (results[0].status === "fulfilled") session = results[0].value;
    if (results[1].status === "fulfilled") carteras = results[1].value;
    if (results[2].status === "fulfilled") cuentasInversion = results[2].value;

    if (session?.user?.role === "ADMIN") {
      const store = await cookies();
      currentPreviewId = store.get(PREVIEW_COOKIE)?.value ?? null;
      previewUsers = await prisma.user.findMany({
        where: { activo: true, role: { not: "ADMIN" } },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      });
    }

    if (session?.user) {
      const realRole = session.user.role as UserRole;
      if (realRole === "ADMIN" && !currentPreviewId) {
        allowedPermissions = null; // admin sees all
      } else if (realRole === "ADMIN" && currentPreviewId) {
        const previewUser = previewUsers.find((u) => u.id === currentPreviewId);
        if (previewUser) {
          const perms = await getEffectivePermissions(previewUser.id, previewUser.role as UserRole);
          allowedPermissions = Array.from(perms);
        }
      } else {
        const perms = await getEffectivePermissions(session.user.id, realRole);
        allowedPermissions = Array.from(perms);
      }
    }
    notifications = await getNotifications(allowedPermissions);

    if (session?.user?.id) {
      const u = await prisma.user.findUnique({
        where:  { id: session.user.id },
        select: { mustChangePassword: true, image: true },
      });
      mustChangePassword = u?.mustChangePassword ?? false;
      userImage = u?.image ?? null;
    }
  } catch (error) {
    console.error("DashboardLayout: Error loading sidebar data", error);
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const previewUser = currentPreviewId
    ? previewUsers.find((u) => u.id === currentPreviewId)
    : null;

  return (
    <DashboardShell
      carteras={carteras}
      cuentasInversion={cuentasInversion}
      allowedPermissions={allowedPermissions}
    >
      <Topbar
        userName={session?.user?.name}
        userRole={session?.user?.role}
        userImage={userImage}
        isAdmin={isAdmin}
        previewUsers={previewUsers}
        currentPreviewId={currentPreviewId}
        notifications={notifications}
      />
      {readOnlyPreview && (
        <div className="bg-amber-500 text-black text-xs font-bold text-center py-1 tracking-wide uppercase sticky top-0 z-50">
          Modo lectura activo
        </div>
      )}
      {previewUser && (
        <div className="bg-purple-600 text-white text-xs font-bold text-center py-1 tracking-wide uppercase sticky top-0 z-50">
          Vista previa como: {previewUser.name} ({previewUser.role})
        </div>
      )}
      {betaMode && (
        <div className="bg-blue-700 text-white text-[11px] font-bold text-center py-1 tracking-[0.2em] uppercase shrink-0">
          BETA PRIVADA · v2.0 · acceso restringido
        </div>
      )}
      {mustChangePassword && (
        <div className="bg-red-600 text-white text-[11px] font-bold text-center py-1 tracking-[0.15em] uppercase shrink-0">
          Debés cambiar tu contraseña —{" "}
          <a href="/configuracion/mi-cuenta" className="underline hover:opacity-80">
            Cambiar ahora
          </a>
        </div>
      )}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </DashboardShell>
  );
}
