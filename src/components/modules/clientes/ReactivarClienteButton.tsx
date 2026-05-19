"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { reactivarCliente } from "@/app/(dashboard)/clientes/actions";

export function ReactivarClienteButton({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(reactivarCliente, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={clienteId} />
      <button
        type="submit"
        disabled={pending}
        className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors uppercase tracking-widest border border-emerald-200 disabled:opacity-50"
      >
        {pending ? "…" : "Reactivar"}
      </button>
    </form>
  );
}
