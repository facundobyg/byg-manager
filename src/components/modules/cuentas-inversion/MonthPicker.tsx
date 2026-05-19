"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { mes: string };

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function label(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

export function MonthPicker({ mes }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push(`?mes=${addMonths(mes, -1)}`)}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <ChevronLeft size={16} className="text-slate-500" />
      </button>
      <input
        type="month"
        value={mes}
        onChange={(e) => e.target.value && router.push(`?mes=${e.target.value}`)}
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
      />
      <button
        onClick={() => router.push(`?mes=${addMonths(mes, 1)}`)}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <ChevronRight size={16} className="text-slate-500" />
      </button>
    </div>
  );
}
