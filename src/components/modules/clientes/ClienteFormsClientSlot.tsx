"use client";

import { NuevaCuentaCorrienteForm } from "./NuevaCuentaCorrienteForm";
import { NuevoPlazoFijoForm } from "./NuevoPlazoFijoForm";

export function ClienteFormsClientSlot({ clienteId }: { clienteId: string }) {
  return (
    <div className="flex items-center gap-2">
      <NuevaCuentaCorrienteForm clienteId={clienteId} />
      <NuevoPlazoFijoForm clienteId={clienteId} />
    </div>
  );
}
