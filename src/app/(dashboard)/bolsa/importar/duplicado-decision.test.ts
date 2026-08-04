import { describe, it, expect } from "vitest";
import { debeActualizarLoteActivo, opcionesParaDuplicado } from "./duplicado-decision";

describe("debeActualizarLoteActivo (E4.6C.4 — regresión del bug de reanálisis silencioso)", () => {
  it("DD-1: un resultado DUPLICADO nunca debe fijarse como lote activo, aunque traiga loteId", () => {
    expect(debeActualizarLoteActivo({ estado: "DUPLICADO", loteId: "lote-viejo" })).toBe(false);
  });

  it("DD-2: un alta real (REVISION_PENDIENTE) con loteId sí se fija como lote activo", () => {
    expect(debeActualizarLoteActivo({ estado: "REVISION_PENDIENTE", loteId: "lote-nuevo" })).toBe(true);
  });

  it("DD-3: sin loteId nunca se fija como lote activo, sea cual sea el estado", () => {
    expect(debeActualizarLoteActivo({ estado: "REVISION_PENDIENTE", loteId: undefined })).toBe(false);
  });

  it("DD-4: un resultado FALLIDO con loteId (reanálisis fallido reportado) tampoco se trata como duplicado, pero solo DUPLICADO está explícitamente excluido", () => {
    // FALLIDO no es el caso reportado (nunca trae loteId en la práctica),
    // pero la función solo excluye el caso real y documentado: DUPLICADO.
    expect(debeActualizarLoteActivo({ estado: "FALLIDO", loteId: "lote-x" })).toBe(true);
  });
});

describe("opcionesParaDuplicado", () => {
  it("OD-1: duplicado editable (reanalizable=true) muestra ambas opciones — abrir y reanalizar — más cancelar", () => {
    expect(opcionesParaDuplicado(true)).toEqual({
      puedeAbrirExistente: true,
      puedeReanalizar: true,
      puedeCancelar: true,
    });
  });

  it("OD-2: lote enviado/aprobado (reanalizable=false) solo ofrece abrir el existente y cancelar, nunca reanalizar", () => {
    expect(opcionesParaDuplicado(false)).toEqual({
      puedeAbrirExistente: true,
      puedeReanalizar: false,
      puedeCancelar: true,
    });
  });

  it("OD-3: reanalizable indefinido (dato no disponible) se trata como no reanalizable, nunca se asume permiso", () => {
    expect(opcionesParaDuplicado(undefined)).toEqual({
      puedeAbrirExistente: true,
      puedeReanalizar: false,
      puedeCancelar: true,
    });
  });
});
