"use client";

import { NuevaCuentaCorrienteForm } from "./NuevaCuentaCorrienteForm";
import { NuevoPlazoFijoForm } from "./NuevoPlazoFijoForm";
import { Lock } from "lucide-react";

export function ClienteFormsClientSlot({
  clienteId,
  canWriteCC = true,
  canWritePF = true,
}: {
  clienteId: string;
  canWriteCC?: boolean;
  canWritePF?: boolean;
}) {
  if (!canWriteCC && !canWritePF) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-widest">
        <Lock size={10} />
        Solo lectura
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {canWriteCC && <NuevaCuentaCorrienteForm clienteId={clienteId} />}
      {canWritePF && <NuevoPlazoFijoForm clienteId={clienteId} />}
    </div>
  );
}
