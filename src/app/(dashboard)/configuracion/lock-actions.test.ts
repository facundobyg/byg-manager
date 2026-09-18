import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  canDoAction: vi.fn(),
  acquireLocks: vi.fn(),
  heartbeatLocks: vi.fn(),
  releaseLocks: vi.fn(),
  prisma: {
    operationalLock: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/permissions", () => ({ canDoAction: mocks.canDoAction }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/locks/engine", () => ({
  acquireLocks: mocks.acquireLocks,
  heartbeatLocks: mocks.heartbeatLocks,
  releaseLocks: mocks.releaseLocks,
}));
// No hay vitest.config con alias "@/*" — mockeamos el módulo real vía import
// relativo (sin alias) para que assertValidClientId/errores sean el código
// real, no un doble. lock-actions.ts sigue usando "@/lib/locks/keys" como
// el resto de la app; esta indirección vive solo acá, en el test.
vi.mock("@/lib/locks/keys", async () => {
  return await import("../../../lib/locks/keys");
});
// lock-actions.ts también importa LockConflictError de "@/lib/locks/errors"
// (no mockeado, sin espiarlo) — misma indirección para que resuelva.
vi.mock("@/lib/locks/errors", async () => {
  return await import("../../../lib/locks/errors");
});

import { acquireConfigLock, heartbeatConfigLock, releaseConfigLock } from "./lock-actions";
import { LockConflictError, InvalidClientIdError } from "@/lib/locks/errors";

const USER_A = "user-a";
const USER_B = "user-b";
const CLIENT_1 = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const CLIENT_2 = "a1b2c3d4-58cc-4372-a567-0e02b2c3d479";

function session(userId: string | null) {
  return userId ? { user: { id: userId, name: "Alguien", role: "SOCIO" } } : null;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("acquireConfigLock", () => {
  it("F. usuario con capacidad de escritura adquiere CONFIG → EDITABLE", async () => {
    mocks.auth.mockResolvedValue(session(USER_A));
    mocks.canDoAction.mockResolvedValue(true);
    mocks.acquireLocks.mockResolvedValue([{ lockKey: "CONFIG", acquiredAt: new Date() }]);

    const result = await acquireConfigLock(CLIENT_1);

    expect(result).toEqual({ mode: "EDITABLE" });
    expect(mocks.acquireLocks).toHaveBeenCalledWith(["CONFIG"], USER_A, CLIENT_1);
  });

  it("G. lock ocupado por otro usuario → READ_ONLY_OCCUPIED con su nombre", async () => {
    mocks.auth.mockResolvedValue(session(USER_A));
    mocks.canDoAction.mockResolvedValue(true);
    mocks.acquireLocks.mockRejectedValue(new LockConflictError("CONFIG"));
    mocks.prisma.operationalLock.findUnique.mockResolvedValue({ ownerUserId: USER_B });
    mocks.prisma.user.findUnique.mockResolvedValue({ name: "Francisco" });

    const result = await acquireConfigLock(CLIENT_1);

    expect(result).toEqual({ mode: "READ_ONLY_OCCUPIED", ownerName: "Francisco" });
    expect(mocks.acquireLocks).toHaveBeenCalledTimes(2); // único reintento
  });

  it("H. lock ocupado por el mismo usuario en otra tab → READ_ONLY_SAME_USER_TAB", async () => {
    mocks.auth.mockResolvedValue(session(USER_A));
    mocks.canDoAction.mockResolvedValue(true);
    mocks.acquireLocks.mockRejectedValue(new LockConflictError("CONFIG"));
    mocks.prisma.operationalLock.findUnique.mockResolvedValue({ ownerUserId: USER_A });

    const result = await acquireConfigLock(CLIENT_2);

    expect(result).toEqual({ mode: "READ_ONLY_SAME_USER_TAB" });
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled(); // no hace falta resolver nombre propio
  });

  it("I. usuario sin ninguna capacidad de escritura → DENIED sin intentar acquire", async () => {
    mocks.auth.mockResolvedValue(session(USER_A));
    mocks.canDoAction.mockResolvedValue(false);

    const result = await acquireConfigLock(CLIENT_1);

    expect(result).toEqual({ mode: "DENIED" });
    expect(mocks.acquireLocks).not.toHaveBeenCalled();
  });

  it("sin sesión → DENIED", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await acquireConfigLock(CLIENT_1);

    expect(result).toEqual({ mode: "DENIED" });
    expect(mocks.acquireLocks).not.toHaveBeenCalled();
  });

  it("ownerClientId inválido → lanza antes de tocar el motor", async () => {
    mocks.auth.mockResolvedValue(session(USER_A));
    await expect(acquireConfigLock("no-es-un-uuid")).rejects.toThrow(InvalidClientIdError);
    expect(mocks.acquireLocks).not.toHaveBeenCalled();
  });

  it("J. doble conflict y el lock se liberó justo en el medio → NUNCA declara EDITABLE sin reacquire confirmado", async () => {
    mocks.auth.mockResolvedValue(session(USER_A));
    mocks.canDoAction.mockResolvedValue(true);
    mocks.acquireLocks.mockRejectedValue(new LockConflictError("CONFIG"));
    // El lock ya no existe para cuando se resuelve el owner (se liberó/expiró
    // entre el segundo conflict y esta lectura) — igual debe quedar READ_ONLY,
    // nunca EDITABLE, porque no hubo una adquisición confirmada.
    mocks.prisma.operationalLock.findUnique.mockResolvedValue(null);

    const result = await acquireConfigLock(CLIENT_1);

    expect(result.mode).not.toBe("EDITABLE");
    expect(result).toEqual({ mode: "READ_ONLY_OCCUPIED", ownerName: null });
    expect(mocks.acquireLocks).toHaveBeenCalledTimes(2);
  });

  it("error inesperado (no LockConflictError) se propaga sin transformarlo", async () => {
    mocks.auth.mockResolvedValue(session(USER_A));
    mocks.canDoAction.mockResolvedValue(true);
    mocks.acquireLocks.mockRejectedValue(new Error("DB caída"));

    await expect(acquireConfigLock(CLIENT_1)).rejects.toThrow("DB caída");
    expect(mocks.acquireLocks).toHaveBeenCalledTimes(1); // no reintenta errores que no son LockConflictError
  });
});

describe("heartbeatConfigLock", () => {
  it("K. heartbeat con owner correcto → OK", async () => {
    mocks.auth.mockResolvedValue(session(USER_A));
    mocks.heartbeatLocks.mockResolvedValue({ status: "OK" });

    const result = await heartbeatConfigLock(CLIENT_1);

    expect(result).toEqual({ status: "OK" });
    expect(mocks.heartbeatLocks).toHaveBeenCalledWith(["CONFIG"], USER_A, CLIENT_1);
  });

  it("L. heartbeat expirado/perdido → LOST", async () => {
    mocks.auth.mockResolvedValue(session(USER_A));
    mocks.heartbeatLocks.mockResolvedValue({ status: "LOST", renewed: [], lost: ["CONFIG"] });

    const result = await heartbeatConfigLock(CLIENT_1);

    expect(result).toEqual({ status: "LOST" });
  });

  it("sin sesión → LOST (no queda ambiguo, nunca OK sin auth)", async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await heartbeatConfigLock(CLIENT_1);
    expect(result).toEqual({ status: "LOST" });
    expect(mocks.heartbeatLocks).not.toHaveBeenCalled();
  });
});

describe("releaseConfigLock", () => {
  it("M. libera exclusivamente el lock de ESE owner+tab — nunca de otro user/tab", async () => {
    mocks.auth.mockResolvedValue(session(USER_A));
    mocks.releaseLocks.mockResolvedValue(1);

    await releaseConfigLock(CLIENT_1);

    expect(mocks.releaseLocks).toHaveBeenCalledWith(["CONFIG"], USER_A, CLIENT_1);
    expect(mocks.releaseLocks).not.toHaveBeenCalledWith(["CONFIG"], USER_B, expect.anything());
  });

  it("sin sesión → no llama al motor", async () => {
    mocks.auth.mockResolvedValue(null);
    await releaseConfigLock(CLIENT_1);
    expect(mocks.releaseLocks).not.toHaveBeenCalled();
  });
});
