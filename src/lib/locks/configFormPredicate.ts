// A3.1.2.2 — predicado puro mínimo para habilitar/deshabilitar los
// formularios de Configuración cableados al lease CONFIG. Extraído aparte
// (en vez de inline en cada componente) para poder testearlo sin
// jsdom/testing-library, que el proyecto no tiene. NO es una state machine:
// es exactamente la condición que el JSX ya necesita para `disabled`.
//
// Recordatorio: esto es UX únicamente. Deshabilitar el submit acá no
// reemplaza la verificación real — cada Server Action revalida el lease
// (requireOperationalLocks) dentro de su propia transacción.

import type { ConfigLockMode } from "@/components/modules/configuracion/ConfigLockProvider";

export function isConfigFormEditable(mode: ConfigLockMode): boolean {
  return mode === "EDITABLE";
}
