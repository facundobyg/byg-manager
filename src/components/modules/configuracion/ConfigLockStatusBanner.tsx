"use client";

// A3.1.2.1 — banner mínimo para validar visualmente el ciclo de vida del
// lease CONFIG. No es funcional (no expone acciones), solo estado.

import { useConfigLock } from "./ConfigLockProvider";

const COPY: Record<string, { text: string; className: string }> = {
  LOADING: { text: "Verificando disponibilidad…", className: "border-slate-200 bg-slate-50 text-slate-500" },
  EDITABLE: { text: "Edición habilitada en esta pestaña", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  OCCUPIED: { text: "Solo lectura — otro usuario está editando", className: "border-amber-200 bg-amber-50 text-amber-700" },
  SAME_USER_OTHER_TAB: { text: "Solo lectura — estás editando en otra pestaña", className: "border-amber-200 bg-amber-50 text-amber-700" },
  LOST: { text: "Se perdió el lease de edición — pasaste a solo lectura", className: "border-red-200 bg-red-50 text-red-700" },
  DENIED: { text: "No tenés permisos para editar Configuración", className: "border-slate-200 bg-slate-50 text-slate-500" },
  CONNECTION_UNCERTAIN: {
    text: "No podemos confirmar en este momento que sigas teniendo el control de edición. La configuración queda temporalmente en modo consulta mientras verificamos la conexión.",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  CLIENT_ID_UNAVAILABLE: {
    text: "No se pudo verificar de forma segura esta pestaña. La configuración queda disponible en modo consulta.",
    className: "border-slate-200 bg-slate-50 text-slate-500",
  },
};

export function ConfigLockStatusBanner() {
  const { mode, ownerName, networkState } = useConfigLock();
  const copy = COPY[mode];

  return (
    <div className={`rounded-lg border px-4 py-2 text-[12px] font-semibold flex items-center gap-2 ${copy.className}`}>
      <span>{copy.text}</span>
      {mode === "OCCUPIED" && ownerName && <span className="font-normal">({ownerName})</span>}
      {networkState === "DEGRADED" && mode === "EDITABLE" && (
        <span className="font-normal text-amber-600">— reconectando…</span>
      )}
    </div>
  );
}
