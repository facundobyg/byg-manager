// MACRO 2 — Adapter de DUEÑO ECONÓMICO para Rulo / Div-Int / Largo Plazo.
//
// Estos registros guardan `detalles.cuenta` como TEXTO de una lista fija
// (CUENTAS_OPERATIVAS_ACTUALES = "Daniel", "Grace", "BYG"). No hay FK a Cartera,
// Cliente ni Comitente, y el modelo de Cartera no declara propietario. Asociar
// esa cadena a una cartera propia o a un cliente sería inferir el dueño por
// NOMBRE, lo que la decisión de negocio prohíbe.
//
// Por eso el dueño queda DESCONOCIDO y estos hechos NO entran en utilidad ni PN:
// se informan aparte con su monto. Para habilitarlos hace falta un vínculo
// estructural (FK cuenta→Cartera/Comitente) o una tabla de mapeo explícita
// aprobada por negocio; cuando exista, se resuelve SOLO acá.

export type OwnerEconomico = "BYG" | "CLIENTE" | "DESCONOCIDO";

export interface OwnerResuelto {
  owner: OwnerEconomico;
  motivo: string;
}

export function resolverOwnerCuentaOperativa(_cuenta: string | null): OwnerResuelto {
  return {
    owner: "DESCONOCIDO",
    motivo: "detalles.cuenta es texto sin vínculo estructural a Cartera/Cliente; no se infiere el dueño por nombre",
  };
}
