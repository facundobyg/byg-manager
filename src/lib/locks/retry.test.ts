import { describe, it, expect, vi } from "vitest";
import { extractSqlState, isRetryableError, withDeadlockRetry, MAX_LOCK_RETRY_ATTEMPTS } from "./retry";

function knownRequestError(code: string, metaCode?: string) {
  const err = new Error(`prisma error ${code}`) as Error & { code: string; meta?: { code: string } };
  err.code = code;
  if (metaCode) err.meta = { code: metaCode };
  return err;
}

describe("extractSqlState", () => {
  it("reconoce P2034 (transaction conflict) como 40001", () => {
    expect(extractSqlState(knownRequestError("P2034"))).toBe("40001");
  });

  it("extrae el SQLSTATE real desde meta.code cuando viene encapsulado", () => {
    expect(extractSqlState(knownRequestError("P2010", "40001"))).toBe("40001");
    expect(extractSqlState(knownRequestError("P2010", "40P01"))).toBe("40P01");
  });

  it("reconoce el SQLSTATE si aparece directo en .code", () => {
    expect(extractSqlState(knownRequestError("40001"))).toBe("40001");
    expect(extractSqlState(knownRequestError("40P01"))).toBe("40P01");
  });

  it("hace fallback a buscar el SQLSTATE en el mensaje", () => {
    const err = new Error("deadlock detected, sqlstate 40P01");
    expect(extractSqlState(err)).toBe("40P01");
  });

  it("devuelve null para un P2010 sin SQLSTATE retryable en meta", () => {
    expect(extractSqlState(knownRequestError("P2010", "23505"))).toBeNull();
  });

  it("devuelve null para errores normales sin ninguna señal retryable", () => {
    expect(extractSqlState(new Error("algo genérico"))).toBeNull();
    expect(extractSqlState(new TypeError("validation error"))).toBeNull();
    expect(extractSqlState(null)).toBeNull();
    expect(extractSqlState(undefined)).toBeNull();
    expect(extractSqlState("string error")).toBeNull();
  });

  it("sigue error.cause si el error de primer nivel no trae señal", () => {
    const inner = knownRequestError("40001");
    const outer = new Error("wrapped") as Error & { cause?: unknown };
    outer.cause = inner;
    expect(extractSqlState(outer)).toBe("40001");
  });
});

describe("isRetryableError", () => {
  it("true para 40001/40P01", () => {
    expect(isRetryableError(knownRequestError("40001"))).toBe(true);
    expect(isRetryableError(knownRequestError("40P01"))).toBe(true);
  });

  it("false para lock ocupado / UUID inválido / permisos / errores desconocidos", () => {
    expect(isRetryableError(new Error("El recurso \"CC\" está en uso por otro usuario."))).toBe(false);
    expect(isRetryableError(new Error("ownerClientId inválido"))).toBe(false);
    expect(isRetryableError(new Error("No tenés permisos para realizar esta acción."))).toBe(false);
    expect(isRetryableError(new Error("boom"))).toBe(false);
  });
});

describe("withDeadlockRetry", () => {
  it("reintenta en 40001 y devuelve el resultado si el intento siguiente pasa", async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      if (calls < 2) throw knownRequestError("40001");
      return "ok";
    });
    const result = await withDeadlockRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("reintenta en 40P01 y devuelve el resultado si el intento siguiente pasa", async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      if (calls < 2) throw knownRequestError("40P01");
      return "ok";
    });
    const result = await withDeadlockRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("NO reintenta errores normales (lock conflict, UUID inválido, etc.)", async () => {
    const fn = vi.fn(async () => {
      throw new Error("El recurso \"CC\" está en uso por otro usuario.");
    });
    await expect(withDeadlockRetry(fn)).rejects.toThrow('está en uso');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("respeta el máximo de 3 intentos TOTAL y propaga el último error", async () => {
    const fn = vi.fn(async () => {
      throw knownRequestError("40001");
    });
    await expect(withDeadlockRetry(fn)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(MAX_LOCK_RETRY_ATTEMPTS);
  });
});
