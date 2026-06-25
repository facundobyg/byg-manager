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

  const in1Day = new Date(today);
  in1Day.setDate(in1Day.getDate() + 1);

  const [pfAlerts, activosSinPrecio, bolsaPendientes, caucionesActivas, saldosNegativos, tcBlueConfig] = await Promise.all([
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

    canSee(allowedPermissions, "bolsa:leer")
      ? prisma.operacionBolsa.findMany({
          where: {
            tipoOperacion: { in: ["CAUCION_COLOCADORA", "CAUCION_TOMADORA"] },
            anulada: false,
            diasCaucion: { not: null },
          },
          select: { id: true, fechaConcertacion: true, fechaCarga: true, diasCaucion: true },
        })
      : null,

    canSee(allowedPermissions, "banco_industrial:leer")
      ? prisma.saldoComitenteInversion.findMany({
          where: {
            OR: [{ saldoARS: { lt: 0 } }, { saldoUSDCable: { lt: 0 } }, { saldoUSDMep: { lt: 0 } }],
          },
          select: { saldoARS: true, saldoUSDCable: true, saldoUSDMep: true },
        })
      : null,

    canSee(allowedPermissions, "banco_industrial:leer")
      ? prisma.config.findUnique({ where: { clave: "tc_blue" } })
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

  // ── Cauciones por vencer en 1 día (carteras propias y comitentes) ──────────
  if (caucionesActivas) {
    const msPerDay = 86_400_000;
    const porVencer = caucionesActivas.filter((c) => {
      const base = c.fechaConcertacion ?? c.fechaCarga;
      const vencimiento = new Date(base);
      vencimiento.setDate(vencimiento.getDate() + (c.diasCaucion ?? 0));
      const dias = Math.ceil((vencimiento.getTime() - today.getTime()) / msPerDay);
      return dias >= 0 && dias <= 1;
    });

    if (porVencer.length > 0) {
      notifications.push({
        id: "cauciones-por-vencer",
        title: `${porVencer.length} caución${porVencer.length > 1 ? "es" : ""} vence${porVencer.length > 1 ? "n" : ""} en 1 día`,
        description: "Cauciones de carteras propias o comitentes con vencimiento inminente.",
        severity: "warning",
        href: "/bolsa",
        group: "Bolsa",
      });
    }
  }

  // ── Saldos negativos en cuentas comitentes (informativo — no afecta patrimonio BYG) ──
  if (saldosNegativos && saldosNegativos.length > 0) {
    const tcBlue = tcBlueConfig?.valor ? Number(tcBlueConfig.valor) : null;
    const totalNegUSD = saldosNegativos.reduce((s, sc) => {
      const ars  = Number(sc.saldoARS)      < 0 ? Number(sc.saldoARS)      : 0;
      const cable = Number(sc.saldoUSDCable) < 0 ? Number(sc.saldoUSDCable) : 0;
      const mep   = Number(sc.saldoUSDMep)   < 0 ? Number(sc.saldoUSDMep)   : 0;
      const arsUSD = tcBlue && tcBlue > 0 ? ars / tcBlue : 0;
      return s + arsUSD + cable + mep;
    }, 0);

    notifications.push({
      id: "comitentes-saldo-negativo",
      title: `${saldosNegativos.length} cuenta${saldosNegativos.length > 1 ? "s" : ""} comitente con saldo negativo`,
      description: `Equivalente aprox. USD ${totalNegUSD.toFixed(2)} · custodia de terceros, no afecta patrimonio BYG.`,
      severity: "warning",
      href: "/cuentas-inversion",
      group: "Sistema",
    });
  }

  return notifications;
}
