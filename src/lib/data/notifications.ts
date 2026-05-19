import { prisma } from "@/lib/prisma";

export type NotificationSeverity = "error" | "warning" | "info";

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  href: string;
  group: string;
};

function canSee(perms: string[] | null, perm: string): boolean {
  return perms === null || perms.includes(perm);
}

export async function getNotifications(
  allowedPermissions: string[] | null
): Promise<AppNotification[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in15Days = new Date(today);
  in15Days.setDate(in15Days.getDate() + 15);

  const [pfAlerts, activosSinPrecio, bolsaPendientes] = await Promise.all([
    canSee(allowedPermissions, "plazos_fijos:leer")
      ? prisma.plazoFijo.findMany({
          where: {
            OR: [
              { estado: "VENCIDO" },
              { estado: "ACTIVO", fechaVencimiento: { lte: in15Days } },
            ],
          },
          select: { id: true, fechaVencimiento: true, estado: true },
        })
      : null,

    canSee(allowedPermissions, "activos:leer")
      ? prisma.activo.count({ where: { precioActual: 0 } })
      : null,

    canSee(allowedPermissions, "bolsa:leer")
      ? prisma.operacionBolsa.count({
          where: { estado: "PENDIENTE_CONCERTACION", anulada: false },
        })
      : null,
  ]);

  const notifications: AppNotification[] = [];

  // ── Plazos Fijos ─────────────────────────────────────────────────────────
  if (pfAlerts) {
    const vencidos = pfAlerts.filter((p) => p.estado === "VENCIDO");
    const activos  = pfAlerts.filter((p) => p.estado === "ACTIVO");

    const msPerDay = 86_400_000;
    const criticos = activos.filter((p) => {
      const days = Math.ceil((p.fechaVencimiento.getTime() - today.getTime()) / msPerDay);
      return days <= 3;
    });
    const altos = activos.filter((p) => {
      const days = Math.ceil((p.fechaVencimiento.getTime() - today.getTime()) / msPerDay);
      return days > 3 && days <= 7;
    });
    const medios = activos.filter((p) => {
      const days = Math.ceil((p.fechaVencimiento.getTime() - today.getTime()) / msPerDay);
      return days > 7 && days <= 15;
    });

    if (vencidos.length > 0) {
      notifications.push({
        id: "pf-vencidos",
        title: `${vencidos.length} PF vencido${vencidos.length > 1 ? "s" : ""}`,
        description: "Plazos fijos vencidos sin renovar ni cancelar.",
        severity: "error",
        href: "/clientes/vencimientos-pf",
        group: "Clientes",
      });
    }
    if (criticos.length > 0) {
      notifications.push({
        id: "pf-criticos",
        title: `${criticos.length} PF vence${criticos.length > 1 ? "n" : ""} en ≤3 días`,
        description: "Vencimiento inminente — acción urgente requerida.",
        severity: "error",
        href: "/clientes/vencimientos-pf",
        group: "Clientes",
      });
    }
    if (altos.length > 0) {
      notifications.push({
        id: "pf-altos",
        title: `${altos.length} PF vence${altos.length > 1 ? "n" : ""} en 4–7 días`,
        description: "Plazos fijos próximos a vencer esta semana.",
        severity: "warning",
        href: "/clientes/vencimientos-pf",
        group: "Clientes",
      });
    }
    if (medios.length > 0) {
      notifications.push({
        id: "pf-medios",
        title: `${medios.length} PF vence${medios.length > 1 ? "n" : ""} en 8–15 días`,
        description: "Plazos fijos con vencimiento próximo.",
        severity: "info",
        href: "/clientes/vencimientos-pf",
        group: "Clientes",
      });
    }
  }

  // ── Activos sin precio ───────────────────────────────────────────────────
  if (activosSinPrecio) {
    notifications.push({
      id: "activos-sin-precio",
      title: `${activosSinPrecio} activo${activosSinPrecio > 1 ? "s" : ""} sin precio`,
      description: "Precio en 0 — afecta valuaciones de cartera.",
      severity: "warning",
      href: "/precios",
      group: "Sistema",
    });
  }

  // ── Operaciones bolsa pendientes de revisión ─────────────────────────────
  if (bolsaPendientes) {
    notifications.push({
      id: "bolsa-pendientes",
      title: `${bolsaPendientes} op${bolsaPendientes > 1 ? "s" : ""} pendiente${bolsaPendientes > 1 ? "s" : ""} de revisión`,
      description: "Operaciones de bolsa pendientes de revisión y comisiones.",
      severity: "warning",
      href: "/bolsa",
      group: "Bolsa",
    });
  }

  return notifications;
}
