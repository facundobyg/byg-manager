import { describe, it, expect, vi } from "vitest";
import { createHeartbeatScheduler } from "./heartbeatScheduler";

/** Cola de timers manual — permite disparar/verificar sin fake timers globales. */
function makeFakeTimers() {
  let nextId = 1;
  const pending = new Map<number, { cb: () => void; ms: number }>();
  return {
    setTimeoutFn: (cb: () => void, ms: number): unknown => {
      const id = nextId++;
      pending.set(id, { cb, ms });
      return id;
    },
    clearTimeoutFn: (id: unknown): void => {
      pending.delete(id as number);
    },
    /** Dispara TODOS los timers pendientes en este instante (simula que pasó su `ms`). */
    fireAll() {
      const entries = Array.from(pending.values());
      pending.clear();
      for (const { cb } of entries) cb();
    },
    pendingCount: () => pending.size,
    pendingMs: () => Array.from(pending.values()).map((p) => p.ms),
  };
}

/** Deferred controlable para simular una request de heartbeat "lenta". */
function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("createHeartbeatScheduler", () => {
  it("start() programa exactamente un timer a intervalMs, no dispara antes", () => {
    const timers = makeFakeTimers();
    const runHeartbeat = vi.fn(async () => {});
    const scheduler = createHeartbeatScheduler({
      intervalMs: 25_000,
      runHeartbeat,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    scheduler.start();

    expect(timers.pendingCount()).toBe(1);
    expect(timers.pendingMs()).toEqual([25_000]);
    expect(runHeartbeat).not.toHaveBeenCalled();
  });

  it("start() es no-op si ya está corriendo (no duplica el timer)", () => {
    const timers = makeFakeTimers();
    const scheduler = createHeartbeatScheduler({
      intervalMs: 25_000,
      runHeartbeat: async () => {},
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    scheduler.start();
    scheduler.start();

    expect(timers.pendingCount()).toBe(1);
  });

  it("E. request de heartbeat más lenta que intervalMs nunca se solapa con la siguiente", async () => {
    const timers = makeFakeTimers();
    const calls: ReturnType<typeof deferred>[] = [];
    const runHeartbeat = vi.fn(async () => {
      const d = deferred();
      calls.push(d);
      await d.promise;
    });
    const scheduler = createHeartbeatScheduler({
      intervalMs: 25_000,
      runHeartbeat,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    scheduler.start();
    timers.fireAll(); // dispara el primer tick (t=25s)
    await flush();

    expect(runHeartbeat).toHaveBeenCalledTimes(1);
    expect(scheduler.isInFlight()).toBe(true);
    // Nada reprogramado todavía: el primer intento sigue pendiente.
    expect(timers.pendingCount()).toBe(0);

    // "Pasan" otros 25s mientras el primer intento sigue sin resolver — no
    // hay ningún timer pendiente que disparar, así que no puede iniciarse
    // una segunda request por esta vía.
    timers.fireAll();
    await flush();
    expect(runHeartbeat).toHaveBeenCalledTimes(1);

    // Recién cuando el primer intento resuelve se programa el siguiente.
    calls[0].resolve();
    await flush();
    expect(scheduler.isInFlight()).toBe(false);
    expect(timers.pendingCount()).toBe(1);
    expect(runHeartbeat).toHaveBeenCalledTimes(1);

    timers.fireAll();
    await flush();
    expect(runHeartbeat).toHaveBeenCalledTimes(2);
    calls[1].resolve();
    await flush();
  });

  it("un runHeartbeat que rechaza igual reprograma el siguiente tick (no se cuelga el scheduler)", async () => {
    const timers = makeFakeTimers();
    let callCount = 0;
    const runHeartbeat = vi.fn(async () => {
      callCount += 1;
      if (callCount === 1) throw new Error("network error");
    });
    const scheduler = createHeartbeatScheduler({
      intervalMs: 25_000,
      runHeartbeat,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    scheduler.start();
    timers.fireAll();
    await flush();
    // El scheduler no propaga el rechazo (no hay unhandled rejection) y
    // reprograma igual.
    expect(timers.pendingCount()).toBe(1);
  });

  it("stop() cancela el timer pendiente y ningún tick futuro se dispara", () => {
    const timers = makeFakeTimers();
    const runHeartbeat = vi.fn(async () => {});
    const scheduler = createHeartbeatScheduler({
      intervalMs: 25_000,
      runHeartbeat,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    scheduler.start();
    scheduler.stop();

    expect(timers.pendingCount()).toBe(0);
    timers.fireAll();
    expect(runHeartbeat).not.toHaveBeenCalled();
  });

  it("stop() durante un tick in-flight no cancela ese request, pero no reprograma otro después", async () => {
    const timers = makeFakeTimers();
    const d = deferred();
    const runHeartbeat = vi.fn(async () => {
      await d.promise;
    });
    const scheduler = createHeartbeatScheduler({
      intervalMs: 25_000,
      runHeartbeat,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    scheduler.start();
    timers.fireAll();
    await flush();
    expect(scheduler.isInFlight()).toBe(true);

    scheduler.stop();
    d.resolve();
    await flush();

    expect(runHeartbeat).toHaveBeenCalledTimes(1);
    expect(timers.pendingCount()).toBe(0); // no reprogramó nada tras el stop
  });

  it("runNow() ejecuta de inmediato y cancela el timer pendiente", async () => {
    const timers = makeFakeTimers();
    const runHeartbeat = vi.fn(async () => {});
    const scheduler = createHeartbeatScheduler({
      intervalMs: 25_000,
      runHeartbeat,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    scheduler.start();
    expect(timers.pendingCount()).toBe(1);

    scheduler.runNow();
    expect(timers.pendingCount()).toBe(0); // canceló el timer que esperaba a los 25s
    await flush();
    expect(runHeartbeat).toHaveBeenCalledTimes(1);
    expect(timers.pendingCount()).toBe(1); // reprogramó el siguiente ciclo normalmente
  });

  it("runNow() es no-op si ya hay un heartbeat in-flight (nunca duplica)", async () => {
    const timers = makeFakeTimers();
    const d = deferred();
    const runHeartbeat = vi.fn(async () => {
      await d.promise;
    });
    const scheduler = createHeartbeatScheduler({
      intervalMs: 25_000,
      runHeartbeat,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    scheduler.start();
    timers.fireAll();
    await flush();
    expect(scheduler.isInFlight()).toBe(true);

    scheduler.runNow();
    scheduler.runNow();
    await flush();

    expect(runHeartbeat).toHaveBeenCalledTimes(1);
    d.resolve();
    await flush();
  });

  it("runNow() es no-op si el scheduler está detenido", () => {
    const timers = makeFakeTimers();
    const runHeartbeat = vi.fn(async () => {});
    const scheduler = createHeartbeatScheduler({
      intervalMs: 25_000,
      runHeartbeat,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    scheduler.runNow(); // nunca se llamó start()
    expect(runHeartbeat).not.toHaveBeenCalled();
  });
});
