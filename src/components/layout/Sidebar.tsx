"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  RefreshCw,
  Coins,
  Timer,
  History,
  Users,
  CalendarClock,
  Building2,
  Briefcase,
  Settings,
  ChevronDown,
  Landmark,
  BarChart3,
  Scale,
  Clock,
  ClipboardList,
  CandlestickChart,
  Tag,
  DollarSign,
  Upload,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ElementType };
type NavGroup = { group: string; items: NavItem[] };

const NAV_STATIC: NavGroup[] = [
  {
    group: "General",
    items: [
      { label: "Inicio",       href: "/inicio",            icon: LayoutDashboard },
      { label: "Posición",     href: "/posicion",          icon: Scale },
      { label: "Reportes",     href: "/reportes",          icon: BarChart3 },
      { label: "Rep. Mensual", href: "/reportes/mensual",  icon: CalendarClock },
    ],
  },
  {
    group: "Operativa",
    items: [
      { label: "Op. Bolsa",    href: "/bolsa",                  icon: CandlestickChart },
      { label: "Caja Oficina", href: "/operativa/mov-diarios",  icon: ArrowLeftRight },
      { label: "Rulos Bolsa",  href: "/operativa/rulos-bolsa",  icon: RefreshCw },
      { label: "Div. e Intereses", href: "/operativa/div-intereses", icon: Coins },
      { label: "Largo Plazo",  href: "/operativa/largo-plazo",  icon: Timer },
      { label: "Historial",    href: "/historial",               icon: History },
    ],
  },
  {
    group: "Clientes",
    items: [
      { label: "Clientes CC",     href: "/clientes/cc",            icon: Users        },
      { label: "Vencimientos PF", href: "/clientes/vencimientos-pf", icon: CalendarClock },
    ],
  },
];

const NAV_SISTEMA: NavGroup[] = [
  {
    group: "Sistema",
    items: [
      { label: "Honorarios",    href: "/honorarios",    icon: DollarSign    },
      { label: "Pendientes",    href: "/pendientes",    icon: Clock         },
      { label: "Precios",       href: "/precios",       icon: Tag           },
      { label: "Cierres",       href: "/cierres",       icon: CalendarClock },
      { label: "Auditoría",     href: "/auditoria",     icon: ClipboardList },
      { label: "Configuración", href: "/configuracion", icon: Settings      },
    ],
  },
];

type CarteraLink = { nombre: string; slug: string };
type CuentaInversionLink = { id: string; nombre: string };

// Maps each sidebar href to the permission key required to view it
const NAV_ITEM_PERMISSIONS: Record<string, string> = {
  "/inicio":                    "posicion:leer",
  "/posicion":                  "posicion:leer",
  "/reportes":                  "patrimonio:leer",
  "/reportes/mensual":          "patrimonio:leer",
  "/bolsa":                     "operaciones_rulo:leer",
  "/operativa/mov-diarios":     "mov_diarios:leer",
  "/operativa/nanu_trenque":    "mov_diarios:leer",
  "/operativa/rulos-bolsa":     "rulos:leer",
  "/operativa/div-intereses":   "div_intereses:leer",
  "/operativa/largo-plazo":     "largo_plazo:leer",
  "/historial":                 "historial:leer",
  "/clientes/cc":               "clientes:leer",
  "/clientes/vencimientos-pf":  "plazos_fijos:leer",
  "/comisiones":                "configuracion:leer",
  "/honorarios":                "configuracion:leer",
  "/pendientes":                "recordatorios:leer",
  "/precios":                   "activos:leer",
  "/cierres":                   "configuracion:leer",
  "/auditoria":                 "auditoria:leer",
  "/configuracion":             "configuracion:leer",
  "/cuentas-inversion/importar": "holdings:editar",
};

type CajaLink = { label: string; slug: string };

type SidebarProps = {
  carteras: CarteraLink[];
  cuentasInversion: CuentaInversionLink[];
  cajasSucursal: CajaLink[];
  allowedPermissions: string[] | null;
};

const ALL_SECTIONS = ["General", "Operativa", "Clientes", "Carteras", "Cuentas de Inversión", "Sistema"] as const;
type SectionKey = typeof ALL_SECTIONS[number];

function getActiveSection(pathname: string | null): SectionKey {
  if (!pathname) return "General";
  if (pathname.startsWith("/cuentas-inversion"))                              return "Cuentas de Inversión";
  if (pathname.startsWith("/carteras"))                                       return "Carteras";
  if (pathname.startsWith("/clientes") || pathname.startsWith("/comisiones"))  return "Clientes";
  if (
    pathname.startsWith("/operativa") ||
    pathname.startsWith("/caja")      ||
    pathname.startsWith("/operaciones") ||
    pathname.startsWith("/bolsa")     ||
    pathname === "/historial"
  )                                                                           return "Operativa";
  if (pathname.startsWith("/reportes") || pathname.startsWith("/inicio") || pathname.startsWith("/posicion")) return "General";
  if (
    pathname.startsWith("/backup")        ||
    pathname.startsWith("/auditoria")     ||
    pathname.startsWith("/permisos")      ||
    pathname.startsWith("/pendientes")    ||
    pathname.startsWith("/precios")       ||
    pathname.startsWith("/configuracion") ||
    pathname.startsWith("/honorarios")    ||
    pathname.startsWith("/cierres")       ||
    pathname.startsWith("/estado")        ||
    pathname.startsWith("/deploy")
  )                                                                           return "Sistema";
  return "General";
}

function buildOpen(active: SectionKey): Record<SectionKey, boolean> {
  return Object.fromEntries(ALL_SECTIONS.map((s) => [s, s === active])) as Record<SectionKey, boolean>;
}

export function Sidebar({ carteras, cuentasInversion, cajasSucursal, allowedPermissions }: SidebarProps) {
  const permSet = allowedPermissions !== null ? new Set(allowedPermissions) : null;

  function canSee(href: string): boolean {
    if (permSet === null) return true;
    const perm = NAV_ITEM_PERMISSIONS[href];
    if (!perm) return true;
    return permSet.has(perm);
  }

  const canSeeCarteras = permSet === null || permSet.has("carteras:leer");
  const canSeeCuentas  = permSet === null || permSet.has("banco_industrial:leer");
  const canSeeComisiones = canSee("/comisiones");
  const canSeeImportar   = canSee("/cuentas-inversion/importar");

  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<SectionKey, boolean>>(() => 
    buildOpen(getActiveSection(mounted ? pathname : null))
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setOpen(buildOpen(getActiveSection(pathname)));
    }
  }, [pathname, mounted]);

  if (!mounted) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-64 bg-byg-sidebar border-r border-byg-border" />
    );
  }

  const toggle = (key: SectionKey) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-byg-sidebar border-r border-byg-border text-byg-text">
      <Link
        href="/inicio"
        className="flex h-20 items-center justify-center border-b border-byg-border shrink-0 px-4 hover:bg-[var(--byg-nav-hover)] transition-colors"
      >
        <img src="/brand/bg-logo-light.png" alt="BG Advisors" className="w-[170px] max-w-[170px] h-auto object-contain dark:hidden" />
        <img src="/brand/bg-logo-dark.png"  alt="BG Advisors" className="w-[185px] max-w-[185px] h-auto object-contain hidden dark:block" />
      </Link>

      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4 gap-5">
        {NAV_STATIC
          .map((s) => ({ ...s, items: s.items.filter((item) => canSee(item.href)) }))
          .filter((s) => s.items.length > 0)
          .map((section) => {
            const extraItems: NavItem[] = section.group === "Operativa" && canSee("/operativa/mov-diarios")
              ? cajasSucursal.map((c) => ({ label: c.label, href: `/operativa/${c.slug}`, icon: ArrowLeftRight }))
              : [];
            return (
              <NavSection
                key={section.group}
                section={section}
                pathname={pathname}
                isOpen={open[section.group as SectionKey]}
                onToggle={() => toggle(section.group as SectionKey)}
                extraItems={extraItems}
              />
            );
          })}

        {/* Dynamic Carteras group */}
        {canSeeCarteras && (
          <div>
            <SectionHeader label="Carteras" isOpen={open.Carteras} onToggle={() => toggle("Carteras")} />
            {open.Carteras && (
              <div className="flex flex-col gap-0.5">
                {carteras.map((c) => {
                  const href   = `/carteras/${c.slug}`;
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={c.slug}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-byg-muted hover:bg-[var(--byg-nav-hover)] hover:text-byg-text"
                      }`}
                    >
                      <Briefcase size={16} />
                      {c.nombre}
                    </Link>
                  );
                })}
                {(() => {
                  const href   = "/carteras/inmobiliarias";
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-byg-muted hover:bg-[var(--byg-nav-hover)] hover:text-byg-text"
                      }`}
                    >
                      <Building2 size={16} />
                      Inmobiliarias
                    </Link>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Cuentas de Inversión — dynamic from DB + Comisiones/Importar fixed */}
        {(canSeeCuentas || canSeeComisiones || canSeeImportar) && (
          <div>
            <SectionHeader label="Cuentas de Inversión" isOpen={open["Cuentas de Inversión"]} onToggle={() => toggle("Cuentas de Inversión")} />
            {open["Cuentas de Inversión"] && (
              <div className="flex flex-col gap-0.5">
                {canSeeCuentas && cuentasInversion.map((c) => {
                  const href   = `/cuentas-inversion/${c.id}`;
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={c.id}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-byg-muted hover:bg-[var(--byg-nav-hover)] hover:text-byg-text"
                      }`}
                    >
                      <Landmark size={16} />
                      {c.nombre}
                    </Link>
                  );
                })}
                {canSeeCuentas && cuentasInversion.length === 0 && (
                  <p className="px-3 py-2 text-xs text-byg-muted italic">Sin cuentas activas</p>
                )}
                {canSeeComisiones && (() => {
                  const href   = "/comisiones";
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-byg-muted hover:bg-[var(--byg-nav-hover)] hover:text-byg-text"
                      }`}
                    >
                      <DollarSign size={16} />
                      Comisiones
                    </Link>
                  );
                })()}
                {canSeeImportar && (() => {
                  const href   = "/cuentas-inversion/importar";
                  const active = pathname === href || pathname.startsWith(href + "/") || pathname.startsWith("/cuentas-inversion/importaciones/bind");
                  return (
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-byg-muted hover:bg-[var(--byg-nav-hover)] hover:text-byg-text"
                      }`}
                    >
                      <Upload size={16} />
                      Importar
                    </Link>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {NAV_SISTEMA
          .map((s) => ({ ...s, items: s.items.filter((item) => canSee(item.href)) }))
          .filter((s) => s.items.length > 0)
          .map((section) => (
            <NavSection
              key={section.group}
              section={section}
              pathname={pathname}
              isOpen={open[section.group as SectionKey]}
              onToggle={() => toggle(section.group as SectionKey)}
            />
          ))}
      </nav>

      <div className="border-t border-byg-border p-4 text-center text-xs text-byg-muted shrink-0">
        v2.0
      </div>
    </aside>
  );
}

function SectionHeader({ label, isOpen, onToggle }: { label: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 mb-0.5 rounded-lg hover:bg-[var(--byg-nav-hover)] cursor-pointer group transition-colors"
    >
      <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-byg-muted group-hover:text-byg-text transition-colors">
        {label}
      </span>
      <ChevronDown
        size={14}
        className={`text-byg-muted group-hover:text-byg-text transition-all ${isOpen ? "" : "-rotate-90"}`}
      />
    </button>
  );
}

function NavSection({
  section, pathname, isOpen, onToggle, extraItems = [],
}: {
  section: NavGroup; pathname: string; isOpen: boolean; onToggle: () => void;
  extraItems?: NavItem[];
}) {
  return (
    <div>
      <SectionHeader label={section.group} isOpen={isOpen} onToggle={onToggle} />
      {isOpen && (
        <div className="flex flex-col gap-0.5">
          {[...section.items, ...extraItems].map((item) => {
            const Icon        = item.icon;
            const isExact     = pathname === item.href;
            const isPrefix    = pathname.startsWith(item.href + "/");
            const allItems = [...section.items, ...extraItems];
            const betterMatch = isPrefix && allItems.some(
              (other) =>
                other.href !== item.href &&
                other.href.length > item.href.length &&
                (pathname === other.href || pathname.startsWith(other.href + "/")),
            );
            const active = isExact || (isPrefix && !betterMatch);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-byg-muted hover:bg-[var(--byg-nav-hover)] hover:text-byg-text"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
