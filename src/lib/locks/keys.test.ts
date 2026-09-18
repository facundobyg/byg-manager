import { describe, it, expect } from "vitest";
import {
  normalizeLockKeys,
  isValidUuid,
  assertValidClientId,
  assertValidOwnerUserId,
  deriveLockArea,
  cajaLockKey,
  bindBatchLockKey,
  LOCK_AREA,
} from "./keys";
import { LockKeyError, InvalidClientIdError } from "./errors";

describe("normalizeLockKeys", () => {
  it("ordena lexicográficamente sin importar el orden recibido", () => {
    expect(normalizeLockKeys(["PF", "CC"])).toEqual(["CC", "PF"]);
    expect(normalizeLockKeys(["CC", "PF"])).toEqual(["CC", "PF"]);
  });

  it("hace trim de cada key", () => {
    expect(normalizeLockKeys(["  CC  ", " PF"])).toEqual(["CC", "PF"]);
  });

  it("deduplica keys repetidas", () => {
    expect(normalizeLockKeys(["CC", "CC", "PF"])).toEqual(["CC", "PF"]);
  });

  it("produce el mismo set determinístico para dos ordenes de entrada distintos", () => {
    const a = normalizeLockKeys(["BOLSA", "BIND", "CARTERA"]);
    const b = normalizeLockKeys(["CARTERA", "BIND", "BOLSA"]);
    expect(a).toEqual(b);
  });

  it("rechaza array vacío", () => {
    expect(() => normalizeLockKeys([])).toThrow(LockKeyError);
  });

  it("rechaza si no es un array", () => {
    expect(() => normalizeLockKeys(null as unknown as string[])).toThrow(LockKeyError);
  });

  it("rechaza una key vacía dentro del set", () => {
    expect(() => normalizeLockKeys(["CC", ""])).toThrow(LockKeyError);
  });

  it("rechaza una key que es solo espacios", () => {
    expect(() => normalizeLockKeys(["CC", "   "])).toThrow(LockKeyError);
  });
});

describe("isValidUuid / assertValidClientId", () => {
  it("acepta un UUID v4 válido", () => {
    expect(isValidUuid("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
  });

  it("rechaza strings que no son UUID", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("")).toBe(false);
    expect(isValidUuid(123 as unknown as string)).toBe(false);
  });

  it("assertValidClientId lanza InvalidClientIdError para valores inválidos", () => {
    expect(() => assertValidClientId("not-a-uuid")).toThrow(InvalidClientIdError);
    expect(() => assertValidClientId(undefined)).toThrow(InvalidClientIdError);
  });

  it("assertValidClientId no lanza para un UUID válido", () => {
    expect(() => assertValidClientId("f47ac10b-58cc-4372-a567-0e02b2c3d479")).not.toThrow();
  });
});

describe("assertValidOwnerUserId", () => {
  it("rechaza string vacío o solo espacios", () => {
    expect(() => assertValidOwnerUserId("")).toThrow(LockKeyError);
    expect(() => assertValidOwnerUserId("   ")).toThrow(LockKeyError);
  });

  it("rechaza valores no-string", () => {
    expect(() => assertValidOwnerUserId(undefined)).toThrow(LockKeyError);
  });

  it("acepta un id no vacío", () => {
    expect(() => assertValidOwnerUserId("user-123")).not.toThrow();
  });
});

describe("deriveLockArea", () => {
  it("una key estática es su propia área", () => {
    expect(deriveLockArea("PF")).toBe("PF");
    expect(deriveLockArea(LOCK_AREA.CC)).toBe("CC");
  });

  it("una key dinámica usa el prefijo antes de ':'", () => {
    expect(deriveLockArea("CAJA:abc123")).toBe("CAJA");
    expect(deriveLockArea("BIND_BATCH:xyz")).toBe("BIND_BATCH");
  });
});

describe("lock key builders", () => {
  it("cajaLockKey construye CAJA:{cajaId}", () => {
    expect(cajaLockKey("caja-1")).toBe("CAJA:caja-1");
  });

  it("bindBatchLockKey construye BIND_BATCH:{batchId}", () => {
    expect(bindBatchLockKey("batch-1")).toBe("BIND_BATCH:batch-1");
  });

  it("las keys construidas resuelven al área dinámica correcta", () => {
    expect(deriveLockArea(cajaLockKey("caja-1"))).toBe("CAJA");
    expect(deriveLockArea(bindBatchLockKey("batch-1"))).toBe("BIND_BATCH");
  });
});
