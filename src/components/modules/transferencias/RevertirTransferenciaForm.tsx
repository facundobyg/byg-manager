"use client";

import { useActionState } from "react";
import { revertirTransferencia } from "@/app/(dashboard)/transferencias/actions";

const initialState = null as { error?: string; success?: boolean } | null;

export function RevertirTransferenciaForm({ logId }: { logId: string }) {
  const [state, action, pending] = useActionState(revertirTransferencia, initialState);

  if (state?.success) {
    return <span className="text-[10px] font-semibold text-slate-400">Revertida</span>;
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <form action={action}>
        <input type="hidden" name="logId" value={logId} />
        <button
          type="submit"
          disabled={pending}
          className="text-[10px] font-black px-2 py-1 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          {pending ? "..." : "Revertir"}
        </button>
      </form>
      {state?.error && (
        <span className="text-[10px] text-red-500 max-w-[140px] text-right">{state.error}</span>
      )}
    </div>
  );
}
