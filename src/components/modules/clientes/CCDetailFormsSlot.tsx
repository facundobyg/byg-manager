"use client";

import { NuevoMovimientoCCForm } from "./NuevoMovimientoCCForm";
import { InteresCCForm } from "./InteresCCForm";

export function CCDetailFormsSlot({
  cuentaId,
  clienteId,
}: {
  cuentaId: string;
  clienteId: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <NuevoMovimientoCCForm cuentaId={cuentaId} clienteId={clienteId} />
      <InteresCCForm cuentaId={cuentaId} clienteId={clienteId} />
    </div>
  );
}
