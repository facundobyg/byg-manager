// Lógica pura de decisión frente a un archivo duplicado (E4.6C.4) — extraída
// de ImportarBolsaForm.tsx para poder testearla sin renderizar el componente.
//
// El bug reportado en producción (imagen reanalizada con una fecha nueva que
// terminó devolviendo el lote anterior sin avisar) no era un problema de
// datos: el servidor ya distinguía DUPLICADO de un alta real. La causa era
// que el cliente trataba CUALQUIER resultado con loteId — incluido un
// DUPLICADO — como "el lote activo de este envío", ofreciendo un atajo
// silencioso hacia el lote viejo. Estas dos funciones son las que deciden
// eso, ahora aisladas y testeadas explícitamente.

import type { ProcessBolsaResult } from "./process-upload";

/**
 * Solo un resultado que NO sea un duplicado detectado representa un lote
 * recién creado o ampliado por este envío — nunca el lote preexistente de
 * un archivo repetido. Determina si conviene recordar `loteId` como "lote
 * activo" de la tanda (el que alimenta el atajo "Revisar lote").
 */
export function debeActualizarLoteActivo(result: Pick<ProcessBolsaResult, "estado" | "loteId">): boolean {
  return !!result.loteId && result.estado !== "DUPLICADO";
}

export interface OpcionesDuplicado {
  /** Siempre disponible — ver el lote existente nunca está bloqueado. */
  puedeAbrirExistente: boolean;
  /** Solo si el lote sigue en un estado editable (REVISION_PENDIENTE/FALLIDO/DEVUELTO). */
  puedeReanalizar: boolean;
  /** Descartar la decisión sin tocar nada — siempre disponible. */
  puedeCancelar: boolean;
}

/**
 * Traduce `reanalizable` (calculado en el servidor a partir del estado del
 * lote) a las opciones que la UI debe ofrecer ante un duplicado. Un lote
 * EN_VALIDACION/APROBADO/CONFIRMADO nunca ofrece "Reanalizar" — solo abrir
 * el existente o cancelar.
 */
export function opcionesParaDuplicado(reanalizable: boolean | undefined): OpcionesDuplicado {
  return {
    puedeAbrirExistente: true,
    puedeReanalizar: reanalizable === true,
    puedeCancelar: true,
  };
}
