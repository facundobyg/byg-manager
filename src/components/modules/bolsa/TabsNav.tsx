"use client";

import { useRouter } from "next/navigation";
import { LayoutGrid, History } from "lucide-react";

type Props = { fecha: string; tab: string };

export function TabsNav({ fecha, tab }: Props) {
  const router = useRouter();

  function goMesa(newFecha: string) {
    router.push(`/bolsa?tab=mesa&fecha=${newFecha}`);
  }

  function goHistorial() {
    router.push("/bolsa?tab=historial");
  }

  const isMesa = tab !== "historial";

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Tab buttons */}
      <div className="flex rounded-xl overflow-hidden border border-byg-border text-[11px] font-black uppercase tracking-widest">
        <button
          type="button"
          onClick={() => goMesa(fecha)}
          className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${
            isMesa
              ? "bg-byg-accent text-white"
              : "bg-byg-surface text-byg-muted hover:bg-byg-surface-2"
          }`}
        >
          <LayoutGrid size={12} />
          Mesa diaria
        </button>
        <button
          type="button"
          onClick={goHistorial}
          className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${
            !isMesa
              ? "bg-byg-accent text-white"
              : "bg-byg-surface text-byg-muted hover:bg-byg-surface-2"
          }`}
        >
          <History size={12} />
          Historial
        </button>
      </div>

      {/* Date picker (only on mesa) */}
      {isMesa && (
        <input
          type="date"
          value={fecha}
          onChange={(e) => e.target.value && goMesa(e.target.value)}
          className="px-3 py-1.5 text-[12px] bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40"
        />
      )}
    </div>
  );
}
