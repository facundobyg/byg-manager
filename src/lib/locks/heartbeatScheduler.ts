// A3.1.2.1 (corrección lifecycle) — scheduler puro de heartbeat con garantía
// de una única request in-flight por instancia. Reemplaza el patrón
// setInterval(async () => ...), que permite que una request más lenta que
// intervalMs se solape con la siguiente. Recursive setTimeout: el próximo
// tick solo se programa DESPUÉS de que el anterior termina (éxito o error).
//
// Puro respecto de React/DOM: setTimeout/clearTimeout son inyectables para
// poder testear determinísticamente sin fake timers globales ni jsdom.

export interface HeartbeatSchedulerDeps {
  intervalMs: number;
  /** Una sola ejecución de heartbeat. El scheduler no interpreta el resultado. */
  runHeartbeat: () => Promise<void>;
  setTimeoutFn?: (cb: () => void, ms: number) => unknown;
  clearTimeoutFn?: (handle: unknown) => void;
}

export interface HeartbeatScheduler {
  /** Arranca el ciclo — no-op si ya estaba corriendo. Programa el primer tick a `intervalMs`. */
  start(): void;
  /** Detiene el ciclo. Un tick ya in-flight puede terminar, pero nunca reprograma otro. */
  stop(): void;
  /**
   * Ejecuta un heartbeat ya, cancelando el timer pendiente. No-op si ya hay
   * uno in-flight (nunca duplica) o si el scheduler está detenido.
   */
  runNow(): void;
  isInFlight(): boolean;
}

export function createHeartbeatScheduler(deps: HeartbeatSchedulerDeps): HeartbeatScheduler {
  const setTimeoutFn = deps.setTimeoutFn ?? ((cb, ms) => setTimeout(cb, ms));
  const clearTimeoutFn = deps.clearTimeoutFn ?? ((handle) => clearTimeout(handle as Parameters<typeof clearTimeout>[0]));

  let stopped = true;
  let inFlight = false;
  let timer: unknown = null;

  function clearTimer() {
    if (timer !== null) {
      clearTimeoutFn(timer);
      timer = null;
    }
  }

  async function tick() {
    if (stopped) return;
    inFlight = true;
    try {
      await deps.runHeartbeat();
    } catch {
      // El scheduler nunca debe crashear (unhandled rejection) por un
      // runHeartbeat que rechaza — interpretar el resultado/error es
      // responsabilidad exclusiva del caller (ver ConfigLockProvider, que
      // ya envuelve heartbeatConfigLock en su propio try/catch). Acá solo
      // nos importa no perder el ciclo de reprogramación.
    } finally {
      inFlight = false;
    }
    // Recién acá, con el intento anterior YA resuelto, se programa el
    // siguiente — nunca antes. Esto es lo que garantiza máximo un in-flight.
    if (!stopped) {
      timer = setTimeoutFn(() => void tick(), deps.intervalMs);
    }
  }

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      clearTimer();
      timer = setTimeoutFn(() => void tick(), deps.intervalMs);
    },
    stop() {
      stopped = true;
      clearTimer();
    },
    runNow() {
      if (stopped || inFlight) return;
      clearTimer();
      void tick();
    },
    isInFlight() {
      return inFlight;
    },
  };
}
