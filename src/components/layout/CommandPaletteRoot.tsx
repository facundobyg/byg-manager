"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type PaletteItem = {
  label: string;
  href: string;
  perm?: string;
  group: string;
};

const PALETTE_ITEMS: PaletteItem[] = [
  { label: "Posición",          href: "/posicion",                 perm: "posicion:leer",        group: "General"   },
  { label: "Análisis",          href: "/analisis",                 perm: "analisis:leer",         group: "General"   },
  { label: "Reportes",          href: "/reportes",                 perm: "patrimonio:leer",       group: "General"   },
  { label: "Op. Bolsa",         href: "/bolsa",                    perm: "operaciones_rulo:leer", group: "Operativa" },
  { label: "Caja Oficina",      href: "/operativa/mov-diarios",    perm: "mov_diarios:leer",      group: "Operativa" },
  { label: "Caja Trenque",      href: "/operativa/nanu_trenque",   perm: "mov_diarios:leer",      group: "Operativa" },
  { label: "Rulos Bolsa",       href: "/operativa/rulos-bolsa",    perm: "rulos:leer",            group: "Operativa" },
  { label: "Div. e Intereses",  href: "/operativa/div-intereses",  perm: "div_intereses:leer",    group: "Operativa" },
  { label: "Largo Plazo",       href: "/operativa/largo-plazo",    perm: "largo_plazo:leer",      group: "Operativa" },
  { label: "Historial",         href: "/historial",                perm: "historial:leer",        group: "Operativa" },
  { label: "Clientes CC",       href: "/clientes/cc",              perm: "clientes:leer",         group: "Clientes"  },
  { label: "Vencimientos PF",   href: "/clientes/vencimientos-pf", perm: "plazos_fijos:leer",     group: "Clientes"  },
  { label: "Pendientes",        href: "/pendientes",               perm: "recordatorios:leer",    group: "Sistema"   },
  { label: "Precios",           href: "/precios",                  perm: "activos:leer",          group: "Sistema"   },
  { label: "Auditoría",         href: "/auditoria",                perm: "auditoria:leer",        group: "Sistema"   },
  { label: "Permisos",          href: "/permisos",                 perm: "usuarios:leer",         group: "Sistema"   },
  { label: "Backup",            href: "/backup",                   perm: "backups:leer",          group: "Sistema"   },
  { label: "Configuración",     href: "/configuracion",            perm: "configuracion:leer",    group: "Sistema"   },
];

export function CommandPaletteRoot({
  allowedPermissions,
}: {
  allowedPermissions: string[] | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const permSet = allowedPermissions !== null ? new Set(allowedPermissions) : null;
  const canSee = (perm?: string) => !perm || permSet === null || permSet.has(perm);

  const visibleItems = PALETTE_ITEMS.filter((item) => canSee(item.perm));
  const filtered = query
    ? visibleItems.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.group.toLowerCase().includes(query.toLowerCase())
      )
    : visibleItems;

  const handleOpen = useCallback(() => setOpen(true), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("byg:cmdpalette:open" as keyof WindowEventMap, handleOpen as EventListener);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("byg:cmdpalette:open" as keyof WindowEventMap, handleOpen as EventListener);
    };
  }, [handleOpen]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
  }

  function onKeyNav(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIdx]) {
      navigate(filtered[selectedIdx].href);
    }
  }

  if (!open) return null;

  // Group items for display
  const groups = filtered.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-byg-surface border border-byg-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyNav}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-byg-border">
          <Search size={15} className="text-byg-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar o navegar..."
            className="flex-1 bg-transparent text-byg-text placeholder:text-byg-muted text-sm outline-none"
          />
          <kbd className="text-[10px] font-mono text-byg-muted bg-byg-bg border border-byg-border rounded px-1.5 py-0.5 shrink-0">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-byg-muted">Sin resultados</p>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-byg-muted">
                  {group}
                </p>
                {items.map((item) => {
                  const idx = globalIdx++;
                  const isSelected = idx === selectedIdx;
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors text-left ${
                        isSelected
                          ? "bg-byg-surface-2 text-byg-text"
                          : "text-byg-muted hover:bg-byg-surface-2 hover:text-byg-text"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
