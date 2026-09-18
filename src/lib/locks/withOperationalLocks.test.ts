import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
// Estos tests verifican la COMPOSICIÓN/wiring del wrapper (orden de llamadas,
// identidad del TransactionClient propagado, que el retry envuelva la
// transacción completa) — no la atomicidad real de Postgres. Esa evidencia
// vive en scripts/qa-a312-config-lease-pg.ts (tests P/Q), contra Postgres real.

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  requireOperationalLocks: vi.fn(),
  withDeadlockRetry: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));

vi.mock("./engine", () => ({
  requireOperationalLocks: mocks.requireOperationalLocks,
}));

vi.mock("./retry", () => ({
  withDeadlockRetry: mocks.withDeadlockRetry,
}));

import { withOperationalLocks } from "./withOperationalLocks";

const FAKE_TX = { __fakeTransactionClient: true };

beforeEach(() => {
  vi.clearAllMocks();
  // Por defecto: withDeadlockRetry ejecuta el thunk una sola vez (sin reintento).
  mocks.withDeadlockRetry.mockImplementation((fn: () => unknown) => fn());
  // Por defecto: $transaction ejecuta el callback con un tx fake y devuelve su resultado.
  mocks.transaction.mockImplementation((cb: (tx: unknown) => unknown) => cb(FAKE_TX));
  mocks.requireOperationalLocks.mockResolvedValue(undefined);
});

describe("withOperationalLocks", () => {
  it("N. llama requireOperationalLocks dentro de la transacción, con las keys/owner correctos", async () => {
    await withOperationalLocks(["CONFIG"], "user-1", "client-1", async () => "ok");

    expect(mocks.requireOperationalLocks).toHaveBeenCalledTimes(1);
    expect(mocks.requireOperationalLocks).toHaveBeenCalledWith(FAKE_TX, ["CONFIG"], "user-1", "client-1");
  });

  it("O. el callback recibe exactamente el mismo TransactionClient que requireOperationalLocks", async () => {
    let callbackTx: unknown;
    await withOperationalLocks(["CONFIG"], "user-1", "client-1", async (tx) => {
      callbackTx = tx;
      return "ok";
    });

    const requireTx = mocks.requireOperationalLocks.mock.calls[0][0];
    expect(callbackTx).toBe(FAKE_TX);
    expect(callbackTx).toBe(requireTx);
  });

  it("requireOperationalLocks se llama ANTES que el callback (orden dentro de la tx)", async () => {
    const order: string[] = [];
    mocks.requireOperationalLocks.mockImplementation(async () => {
      order.push("require");
    });

    await withOperationalLocks(["CONFIG"], "user-1", "client-1", async () => {
      order.push("callback");
      return "ok";
    });

    expect(order).toEqual(["require", "callback"]);
  });

  it("si requireOperationalLocks lanza, el callback nunca se ejecuta", async () => {
    mocks.requireOperationalLocks.mockRejectedValue(new Error("lock ownership inválido"));
    const callback = vi.fn(async () => "no debería correr");

    await expect(
      withOperationalLocks(["CONFIG"], "user-1", "client-1", callback),
    ).rejects.toThrow("lock ownership inválido");

    expect(callback).not.toHaveBeenCalled();
  });

  it("Q. la transacción completa (incluido requireOperationalLocks) queda envuelta por withDeadlockRetry", async () => {
    await withOperationalLocks(["CONFIG"], "user-1", "client-1", async () => "ok");

    expect(mocks.withDeadlockRetry).toHaveBeenCalledTimes(1);
    // El thunk pasado a withDeadlockRetry es el que dispara $transaction — verificamos
    // que $transaction no se invoque fuera de ese thunk (es decir, recién al ejecutarlo).
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("devuelve el valor resuelto por el callback", async () => {
    const result = await withOperationalLocks(["CONFIG"], "user-1", "client-1", async () => 42);
    expect(result).toBe(42);
  });

  it("usa LOCK_TX_OPTIONS al abrir la transacción", async () => {
    await withOperationalLocks(["CONFIG"], "user-1", "client-1", async () => "ok");
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { maxWait: 5000, timeout: 8000 });
  });
});
