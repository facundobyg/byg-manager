"use client";
import { useRouter } from "next/navigation";

export function VerPFButton({ pfId }: { pfId: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        try {
          router.push(`/clientes/pf/${pfId}`);
        } catch (e) {
          console.error("VerPFButton nav error:", e);
        }
      }}
      className="inline-flex items-center text-[10px] font-black px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-emerald-600 transition-colors uppercase tracking-widest shadow-sm"
    >
      Ver →
    </button>
  );
}
