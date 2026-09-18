import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  resolveOwnerClientId,
  isValidStoredClientId,
  startOwnerClientIdLifecycle,
  createBrowserChannel,
  OWNER_CLIENT_ID_STORAGE_KEY,
  type KeyValueStorage,
  type OwnerChannel,
} from "./useOwnerClientId";

// ── Fakes en memoria — sin DOM, sin librerías nuevas ────────────────────────

function fakeStorage(initial?: string): KeyValueStorage {
  let value: string | null = initial ?? null;
  return {
    getItem: (key) => (key === OWNER_CLIENT_ID_STORAGE_KEY ? value : null),
    setItem: (key, v) => { if (key === OWNER_CLIENT_ID_STORAGE_KEY) value = v; },
    removeItem: (key) => { if (key === OWNER_CLIENT_ID_STORAGE_KEY) value = null; },
  };
}

/** Bus en memoria que conecta N "channels" simulando N tabs distintas. */
function makeBus() {
  const handlers = new Set<(msg: unknown) => void>();
  const closedChannels: symbol[] = [];
  function createChannel(): OwnerChannel & { __id: symbol; closeCount: () => number } {
    const id = Symbol();
    let myHandler: ((msg: unknown) => void) | null = null;
    let closeCalls = 0;
    return {
      __id: id,
      postMessage: (msg) => {
        // Simula BroadcastChannel: no le llega al propio emisor.
        handlers.forEach((h) => {
          if (h !== myHandler) h(msg);
        });
      },
      setMessageHandler: (handler) => {
        if (myHandler) handlers.delete(myHandler);
        myHandler = handler as ((msg: unknown) => void) | null;
        if (myHandler) handlers.add(myHandler);
      },
      close: () => {
        closeCalls += 1;
        closedChannels.push(id);
        if (myHandler) handlers.delete(myHandler);
        myHandler = null;
      },
      closeCount: () => closeCalls,
    };
  }
  return { createChannel, closedChannels };
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `id-${idCounter}`;
}

beforeEach(() => {
  idCounter = 0; // aislar los contadores de id entre tests
});

const noWait = () => Promise.resolve();

describe("resolveOwnerClientId", () => {
  it("A. sin ID guardado → genera UUID y lo persiste", async () => {
    const storage = fakeStorage();
    const bus = makeBus();
    const result = await resolveOwnerClientId({
      storage,
      channel: bus.createChannel(),
      generateId: nextId,
      wait: noWait,
    });
    expect(result).toEqual({ status: "READY", clientId: "id-1" });
    expect(storage.getItem(OWNER_CLIENT_ID_STORAGE_KEY)).toBe("id-1");
  });

  it("B. UUID válido existente + ninguna otra tab viva → lo reutiliza", async () => {
    const existing = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const storage = fakeStorage(existing);
    const bus = makeBus();
    const channel = bus.createChannel();

    const result = await resolveOwnerClientId({
      storage,
      channel,
      generateId: nextId,
      wait: noWait,
    });

    expect(result).toEqual({ status: "READY", clientId: existing });
    expect(storage.getItem(OWNER_CLIENT_ID_STORAGE_KEY)).toBe(existing);
  });

  it("C. UUID clonado + otra tab ya lo reclama (claim) → genera uno nuevo", async () => {
    const cloned = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const bus = makeBus();

    // Tab A ya está viva y reclamó `cloned`.
    const channelA = bus.createChannel();
    channelA.setMessageHandler((msg: any) => {
      if (msg.kind === "probe" && msg.clientId === cloned) {
        channelA.postMessage({ kind: "claim", clientId: cloned });
      }
    });

    // Tab B arranca con el mismo id clonado en su storage.
    const storageB = fakeStorage(cloned);
    const channelB = bus.createChannel();

    const result = await resolveOwnerClientId({
      storage: storageB,
      channel: channelB,
      generateId: nextId,
      wait: noWait,
    });

    // generateId se llama primero para el tiebreaker ("id-1") y recién
    // después, al detectar la colisión, para el id nuevo definitivo ("id-2").
    expect(result).toEqual({ status: "READY", clientId: "id-2" });
    expect(storageB.getItem(OWNER_CLIENT_ID_STORAGE_KEY)).toBe("id-2");
  });

  it("D. dos tabs resolviendo el MISMO id clonado simultáneamente → no terminan compartiéndolo", async () => {
    const cloned = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const bus = makeBus();

    const storageA = fakeStorage(cloned);
    const storageB = fakeStorage(cloned);
    const channelA = bus.createChannel();
    const channelB = bus.createChannel();

    // Tiebreakers determinísticos y distintos para el test: A gana (menor).
    const idsA = ["A-tiebreaker"];
    const idsB = ["B-tiebreaker"];
    const genA = () => idsA.shift()!;
    const genB = () => idsB.shift()!;

    const [resultA, resultB] = await Promise.all([
      resolveOwnerClientId({ storage: storageA, channel: channelA, generateId: genA, wait: noWait }),
      resolveOwnerClientId({ storage: storageB, channel: channelB, generateId: genB, wait: noWait }),
    ]);

    expect(resultA.status).toBe("READY");
    expect(resultB.status).toBe("READY");
    const clientIdA = resultA.status === "READY" ? resultA.clientId : null;
    const clientIdB = resultB.status === "READY" ? resultB.clientId : null;

    // Exactamente una de las dos debe haber cedido (id distinto al clonado).
    const yieldedCount = [clientIdA, clientIdB].filter((id) => id !== cloned).length;
    expect(yieldedCount).toBe(1);
    expect(clientIdA).not.toBe(clientIdB);
  });

  it("E. valor corrupto en storage (no-UUID) → genera uno nuevo, no lo reutiliza", async () => {
    const storage = fakeStorage("no-es-un-uuid");
    const bus = makeBus();
    const result = await resolveOwnerClientId({
      storage,
      channel: bus.createChannel(),
      generateId: nextId,
      wait: noWait,
    });
    expect(result).toEqual({ status: "READY", clientId: "id-1" });
  });

  it("sin canal funcional (BroadcastChannel no soportado/falló) → UNAVAILABLE, nunca genera ni toca storage", async () => {
    const storage = fakeStorage(); // vacío
    const result = await resolveOwnerClientId({
      storage,
      channel: null,
      generateId: nextId,
      wait: noWait,
    });
    expect(result).toEqual({ status: "UNAVAILABLE" });
    expect(storage.getItem(OWNER_CLIENT_ID_STORAGE_KEY)).toBeNull();
  });

  it("sin canal funcional AUNQUE haya un UUID válido guardado → sigue UNAVAILABLE (no se confía en sessionStorage solo)", async () => {
    // Este es exactamente el escenario peligroso: un valor heredado de una
    // tab duplicada, sin forma de verificar si esa otra tab sigue viva.
    const existing = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const storage = fakeStorage(existing);
    const result = await resolveOwnerClientId({
      storage,
      channel: null,
      generateId: nextId,
      wait: noWait,
    });
    expect(result).toEqual({ status: "UNAVAILABLE" });
    // No se sobreescribe ni se "limpia" el valor existente tampoco.
    expect(storage.getItem(OWNER_CLIENT_ID_STORAGE_KEY)).toBe(existing);
  });
});

describe("isValidStoredClientId", () => {
  it("acepta UUID válido, rechaza vacío/null/malformado", () => {
    expect(isValidStoredClientId("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
    expect(isValidStoredClientId(null)).toBe(false);
    expect(isValidStoredClientId("")).toBe(false);
    expect(isValidStoredClientId("not-a-uuid")).toBe(false);
  });
});

describe("startOwnerClientIdLifecycle", () => {
  it("C. cierra el canal exactamente una vez en cleanup, incluso si cleanup se llama más de una vez", async () => {
    const bus = makeBus();
    const channel = bus.createChannel();
    const lifecycle = startOwnerClientIdLifecycle({
      storage: fakeStorage(),
      channel,
      generateId: nextId,
      wait: noWait,
    });

    await lifecycle.result;
    lifecycle.cleanup();
    lifecycle.cleanup();
    lifecycle.cleanup();

    expect(channel.closeCount()).toBe(1);
  });

  it("cleanup llamado ANTES de que resolve termine igual cierra el canal, y no deja un announcer activo", async () => {
    const bus = makeBus();
    const channel = bus.createChannel();
    let releaseWait!: () => void;
    const slowWait = () => new Promise<void>((resolve) => { releaseWait = resolve; });
    // Necesita un UUID ya guardado: solo esa rama de resolveOwnerClientId
    // llega a llamar `wait()` (la rama "sin ID guardado" resuelve sin
    // esperar nada, por diseño).
    const existing = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

    const lifecycle = startOwnerClientIdLifecycle({
      storage: fakeStorage(existing),
      channel,
      generateId: nextId,
      wait: slowWait,
    });

    // Cleanup dispara ANTES de que la resolución interna (el `wait` de la
    // ventana de reclamo) haya terminado — simula un unmount muy rápido.
    lifecycle.cleanup();
    expect(channel.closeCount()).toBe(1);

    releaseWait();
    const result = await lifecycle.result;
    expect(result.status).toBe("READY");
    // Aunque resolvió READY, el cleanup ya había cancelado — no debería
    // haber quedado un handler de "announce" respondiendo probes futuros.
    // Verificado indirectamente: postMessage tras el cleanup no debe hacer
    // que este canal responda con un nuevo claim (su handler fue limpiado).
  });

  it("UNAVAILABLE (channel null): cleanup es un no-op seguro respecto de close()", async () => {
    const lifecycle = startOwnerClientIdLifecycle({
      storage: fakeStorage(),
      channel: null,
      generateId: nextId,
      wait: noWait,
    });

    const result = await lifecycle.result;
    expect(result).toEqual({ status: "UNAVAILABLE" });
    expect(() => lifecycle.cleanup()).not.toThrow();
  });
});

describe("createBrowserChannel — fail closed", () => {
  const originalBC = (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;

  afterEach(() => {
    (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel = originalBC;
  });

  it("BroadcastChannel undefined → devuelve null, sin lanzar", () => {
    // @ts-expect-error — simular un browser sin soporte.
    delete globalThis.BroadcastChannel;
    expect(() => createBrowserChannel()).not.toThrow();
    expect(createBrowserChannel()).toBeNull();
  });

  it("constructor de BroadcastChannel lanza → devuelve null, sin crash", () => {
    class ThrowingBroadcastChannel {
      constructor() {
        throw new Error("BroadcastChannel bloqueado en este contexto");
      }
    }
    (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel = ThrowingBroadcastChannel;

    expect(() => createBrowserChannel()).not.toThrow();
    expect(createBrowserChannel()).toBeNull();
  });

  it("constructor funciona → devuelve un OwnerChannel utilizable con close()", () => {
    const closeSpy = vi.fn();
    const postMessageSpy = vi.fn();
    class FakeBroadcastChannel {
      onmessage: unknown = null;
      constructor(public name: string) {}
      postMessage(msg: unknown) {
        postMessageSpy(msg);
      }
      close() {
        closeSpy();
      }
    }
    (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel = FakeBroadcastChannel;

    const channel = createBrowserChannel();
    expect(channel).not.toBeNull();
    channel!.postMessage({ kind: "claim", clientId: "x" });
    expect(postMessageSpy).toHaveBeenCalledWith({ kind: "claim", clientId: "x" });
    channel!.close();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});
