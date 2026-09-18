"use client";

// A3.1.2.1 — ownerClientId por tab, con detección de colisión entre tabs
// vivas (sessionStorage puede clonarse al duplicar una tab, dependiendo del
// navegador). La lógica de resolución está separada del wiring real de
// window/sessionStorage/BroadcastChannel para poder testearla sin DOM.
//
// Corrección lifecycle (revisión SESIÓN 16): sin un BroadcastChannel
// funcional no hay forma de verificar que un valor heredado de
// sessionStorage no esté ya en uso por otra tab viva — el fail-closed es
// incondicional: sin canal funcional, UNAVAILABLE, nunca se asume que
// sessionStorage es seguro por sí solo (ni siquiera para generar un id
// nuevo "total nadie más lo puede tener", porque lo que no podemos verificar
// es justamente si YA existe un id guardado que otra tab viva reclama).

import { useEffect, useState } from "react";

export const OWNER_CLIENT_ID_STORAGE_KEY = "byg-lock-owner-client-id";
const CHANNEL_NAME = "byg-lock-owner-client-id";
const CLAIM_WINDOW_MS = 200;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidStoredClientId(value: string | null | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

type ChannelMessage =
  | { kind: "claim"; clientId: string }
  | { kind: "probe"; clientId: string; tiebreaker: string };

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Único listener a la vez — alcanza para este protocolo y evita el lío de
 * hacer matching de referencias de función para poder desuscribir, como
 * exige addEventListener/removeEventListener nativos. */
export interface OwnerChannel {
  postMessage(msg: ChannelMessage): void;
  setMessageHandler(handler: ((msg: ChannelMessage) => void) | null): void;
  /** Llamar exactamente una vez al terminar de usar el canal (ver cleanup del hook). */
  close(): void;
}

export interface ResolveDeps {
  storage: KeyValueStorage;
  /** null = sin canal funcional: no soportado, o el constructor falló. */
  channel: OwnerChannel | null;
  generateId: () => string;
  wait: (ms: number) => Promise<void>;
}

export type OwnerClientIdResult = { status: "READY"; clientId: string } | { status: "UNAVAILABLE" };

/**
 * Resuelve el ownerClientId de esta tab. Fail-closed: sin canal funcional,
 * siempre UNAVAILABLE — nunca se genera ni se reutiliza un id sin poder
 * verificar colisión con otra tab viva.
 *
 * Con canal funcional:
 *  - sin valor válido en storage → genera uno nuevo.
 *  - valor válido → sondea (BroadcastChannel) si otra tab viva ya lo
 *    reclama, o si otra tab está resolviendo el MISMO id en este mismo
 *    instante (carrera simultánea, ej. dos tabs duplicadas a la vez).
 *    Ante cualquiera de los dos casos, genera un id nuevo — nunca dos tabs
 *    vivas terminan compartiendo el mismo ownerClientId.
 *
 * El desempate de la carrera simultánea es determinístico y simétrico: cada
 * tab compara su propio tiebreaker aleatorio contra el de la rival — la de
 * tiebreaker lexicográficamente menor conserva el id, la otra genera uno
 * nuevo. Ambas tabs llegan a la misma conclusión de forma independiente,
 * sin necesitar coordinación adicional.
 */
export async function resolveOwnerClientId(deps: ResolveDeps): Promise<OwnerClientIdResult> {
  const { storage, channel, generateId, wait } = deps;

  if (!channel) {
    return { status: "UNAVAILABLE" };
  }

  const stored = storage.getItem(OWNER_CLIENT_ID_STORAGE_KEY);

  if (!isValidStoredClientId(stored)) {
    const fresh = generateId();
    storage.setItem(OWNER_CLIENT_ID_STORAGE_KEY, fresh);
    return { status: "READY", clientId: fresh };
  }

  const myTiebreaker = generateId();
  let mustYield = false;
  let hasEchoed = false;

  channel.setMessageHandler((msg) => {
    if (msg.clientId !== stored) return;
    if (msg.kind === "claim") {
      mustYield = true; // otra tab ya tiene este id asentado
    } else if (msg.kind === "probe" && msg.tiebreaker !== myTiebreaker) {
      if (msg.tiebreaker < myTiebreaker) mustYield = true; // carrera simultánea: la rival gana el desempate
      // Reafirmar mi propio probe UNA vez: si la rival empezó a escuchar
      // recién después de que yo mandé el mío (probe perdido por orden de
      // arranque, no por ausencia real de rival), esto le da una segunda
      // oportunidad de oírme dentro de la misma ventana. Acotado a un solo
      // eco para no generar ping-pong infinito entre las dos tabs.
      if (!hasEchoed) {
        hasEchoed = true;
        channel.postMessage({ kind: "probe", clientId: stored, tiebreaker: myTiebreaker });
      }
    }
  });
  channel.postMessage({ kind: "probe", clientId: stored, tiebreaker: myTiebreaker });

  await wait(CLAIM_WINDOW_MS);
  channel.setMessageHandler(null);

  if (mustYield) {
    const fresh = generateId();
    storage.setItem(OWNER_CLIENT_ID_STORAGE_KEY, fresh);
    return { status: "READY", clientId: fresh };
  }
  return { status: "READY", clientId: stored };
}

/**
 * Registra esta tab como dueña de `clientId`: responde con "claim" a
 * cualquier probe futuro de otra tab preguntando por el mismo id. Devuelve
 * una función para dejar de responder (al desmontar).
 */
export function announceClaim(channel: OwnerChannel, clientId: string): () => void {
  channel.postMessage({ kind: "claim", clientId });
  channel.setMessageHandler((msg) => {
    if (msg.kind === "probe" && msg.clientId === clientId) {
      channel.postMessage({ kind: "claim", clientId });
    }
  });
  return () => channel.setMessageHandler(null);
}

export interface OwnerClientIdLifecycle {
  result: Promise<OwnerClientIdResult>;
  /** Idempotente — llamarla más de una vez es seguro (no repite el close del canal). */
  cleanup: () => void;
}

/**
 * Orquesta resolve → announce y expone un cleanup único que deja de
 * reclamar el id y cierra el canal exactamente una vez. Separado del hook
 * de React específicamente para poder testear el ciclo de vida (incluido
 * el cierre del canal) sin necesitar un renderer/DOM.
 */
export function startOwnerClientIdLifecycle(deps: ResolveDeps): OwnerClientIdLifecycle {
  let cancelled = false;
  let stopAnnouncing: (() => void) | undefined;
  let closed = false;

  const result = resolveOwnerClientId(deps).then((res) => {
    if (!cancelled && res.status === "READY" && deps.channel) {
      stopAnnouncing = announceClaim(deps.channel, res.clientId);
    }
    return res;
  });

  const cleanup = () => {
    cancelled = true;
    stopAnnouncing?.();
    if (!closed) {
      closed = true;
      deps.channel?.close();
    }
  };

  return { result, cleanup };
}

// ── Wiring real para el navegador ───────────────────────────────────────────

/** null si BroadcastChannel no existe, o si el constructor lanza (contextos
 * restringidos: sandboxes de iframe, ciertas políticas de documento, etc.).
 * Nunca deja escapar una excepción — fail-closed, no crashear la página. */
export function createBrowserChannel(): OwnerChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    return {
      postMessage: (msg) => bc.postMessage(msg),
      setMessageHandler: (handler) => {
        bc.onmessage = handler ? (event: MessageEvent<ChannelMessage>) => handler(event.data) : null;
      },
      close: () => bc.close(),
    };
  } catch {
    return null;
  }
}

/** Limpia el ownerClientId persistido. Reservado para un release explícito y
 * awaited en una navegación controlada futura — el ciclo de vida automático
 * del provider ya NO lo llama (ver ConfigLockProvider.tsx: el release
 * automático en cleanup se eliminó por la race documentada ahí). */
export function clearStoredOwnerClientId(): void {
  try {
    sessionStorage.removeItem(OWNER_CLIENT_ID_STORAGE_KEY);
  } catch {
    // sessionStorage puede no estar disponible (modo privado estricto, etc.) — no es fatal acá.
  }
}

/**
 * Hook: resuelve (una vez por montaje) el ownerClientId de esta tab. Fail
 * closed: si no se puede verificar de forma segura (sin BroadcastChannel
 * funcional), devuelve UNAVAILABLE — nunca un id "confiado a ciegas".
 * Devuelve null mientras la resolución está en curso.
 */
export function useOwnerClientId(): OwnerClientIdResult | null {
  const [result, setResult] = useState<OwnerClientIdResult | null>(null);

  useEffect(() => {
    let hookCancelled = false;
    const channel = createBrowserChannel();
    const lifecycle = startOwnerClientIdLifecycle({
      storage: sessionStorage,
      channel,
      generateId: () => crypto.randomUUID(),
      wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    });

    lifecycle.result.then((res) => {
      if (!hookCancelled) setResult(res);
    });

    return () => {
      hookCancelled = true;
      lifecycle.cleanup();
    };
  }, []);

  return result;
}
