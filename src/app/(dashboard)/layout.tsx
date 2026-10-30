import { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Topbar } from "@/components/layout/Topbar";
import { SessionIdleWatcher } from "@/components/layout/SessionIdleWatcher";
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
  let cajasSucursal: { label: string; slug: string }[] = [];
  let session = null;
  let previewUsers: { id: string; name: string; role: string }[] = [];
  let currentPreviewId: string | null = null;
  // [] = fallo cerrado (UI sin nav restringida) si algo falla abajo; null solo para ADMIN vigente en DB.
  let allowedPermissions: string[] | null = [];
  let notifications: AppNotification[] = [];
  let mustChangePassword = false;
  let userImage: string | null = null;
  let dbIsAdmin = false;

  try {
    // auth() only decodes/verifies the JWT cookie — no DB round trip — so it
    // resolves first and lets every other (real) query below run in one batch
    // instead of being serialized behind it.
    session = await auth();

    // isAdminJwt solo decide qué consultar en paralelo; la decisión final usa el rol de DB (abajo).
    const isAdminJwt = session?.user?.role === "ADMIN";
    const isAdmin = isAdminJwt;
    if (isAdmin) {
      const store = await cookies();
      currentPreviewId = store.get(PREVIEW_COOKIE)?.value ?? null;
    }

    const [carterasRes, cuentasRes, cajasRes, previewUsersRes, userRes] = await Promise.allSettled([
      prisma.cartera.findMany({
        select: { nombre: true, slug: true },
        orderBy: { orden: "asc" },
      }),
      prisma.cuentaInversion.findMany({
        where: { activa: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.caja.findMany({
        where: { activa: true, tipo: "SUCURSAL_OPERATIVA" },
        select: { label: true, slug: true },
        orderBy: { label: "asc" },
      }),
      isAdmin
        ? prisma.user.findMany({
            where: { activo: true, role: { not: "ADMIN" } },
            select: { id: true, name: true, role: true },
            orderBy: { name: "asc" },
          })
        : Promise.resolve([] as { id: string; name: string; role: string }[]),
      session?.user?.id
        ? prisma.user.findUnique({
            where: { id: session.user.id },
            select: { mustChangePassword: true, image: true, role: true, activo: true },
          })
        : Promise.resolve(null),
    ]);

    if (carterasRes.status === "fulfilled") carteras = carterasRes.value;
    if (cuentasRes.status === "fulfilled") cuentasInversion = cuentasRes.value;
    if (cajasRes.status === "fulfilled") cajasSucursal = cajasRes.value as { label: string; slug: string }[];
    if (previewUsersRes.status === "fulfilled") previewUsers = previewUsersRes.value;
    if (userRes.status === "fulfilled" && userRes.value) {
      mustChangePassword = userRes.value.mustChangePassword ?? false;
      userImage = userRes.value.image ?? null;
      dbIsAdmin = userRes.value.activo && userRes.value.role === "ADMIN";
    }
    if (!dbIsAdmin) {
      // JWT dice ADMIN pero DB no (degradado/inactivo): nada de modo admin ni "ver como".
      previewUsers = [];
      currentPreviewId = null;
    }

    if (session?.user) {
      if (dbIsAdmin && !currentPreviewId) {
        allowedPermissions = null; // admin sees all
      } else if (dbIsAdmin && currentPreviewId) {
        const previewUser = previewUsers.find((u) => u.id === currentPreviewId);
        if (previewUser) {
          const perms = await getEffectivePermissions(previewUser.id, previewUser.role as UserRole);
          allowedPermissions = Array.from(perms);
        }
      } else {
        // Server-authoritative: permisos del sidebar según el rol VIGENTE en DB
        // (degradado/inactivo ⇒ nada administrativo). Inactivo ⇒ CLIENTE ⇒ nada.
        const dbRole = userRes.status === "fulfilled" && userRes.value?.activo ? userRes.value.role : "CLIENTE";
        allowedPermissions = Array.from(await getEffectivePermissions(session.user.id as string, dbRole));
      }
    }
    notifications = await getNotifications(allowedPermissions);
  } catch (error) {
    console.error("DashboardLayout: Error loading sidebar data", error);
  }

  const isAdmin = dbIsAdmin;
  const previewUser = currentPreviewId
    ? previewUsers.find((u) => u.id === currentPreviewId)
    : null;

  return (
    <DashboardShell
      carteras={carteras}
      cuentasInversion={cuentasInversion}
      cajasSucursal={cajasSucursal}
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
      <SessionIdleWatcher />
    </DashboardShell>
  );
}
