"use client";

// A3.1.2.1 — provider de UI para el lease CONFIG. Solo coordina/visualiza el
// estado del lock. NO habilita ninguna mutación todavía: los 17 formularios
// de Configuración siguen sin recibir ownerClientId ni Server Actions nuevas
// en esta fase. Montado únicamente alrededor del contenido editable de
// /configuracion (ver page.tsx) — nunca vía un layout compartido con
// 2FA/mi-cuenta/Data912.
//
// Corrección lifecycle (revisión SESIÓN 16 — ver REVIEW FINAL de A3.1.2.1):
// esta versión reemplaza la primera implementación para cerrar 4 gaps reales
// encontrados en esa auditoría: release automático inseguro, BroadcastChannel
// sin fail-closed, heartbeat con setInterval solapable, y "EDITABLE"
// indefinido sin confirmación del servidor (red caída / sleep-wake).

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useOwnerClientId } from "@/lib/locks/useOwnerClientId";
import { acquireConfigLock, heartbeatConfigLock } from "@/app/(dashboard)/configuracion/lock-actions";
import { LOCK_HEARTBEAT_MS } from "@/lib/locks/constants";
import { createHeartbeatScheduler, type HeartbeatScheduler } from "@/lib/locks/heartbeatScheduler";
import {
  STALENESS_MARGIN_MS,
  reduceHeartbeatOutcome,
  heartbeatConfirmsLease,
  type LeaseMode,
  type HeartbeatOutcome,
} from "@/lib/locks/connectionStaleness";

export type ConfigLockMode =
  | "LOADING"
  | "EDITABLE"
  | "OCCUPIED"
  | "SAME_USER_OTHER_TAB"
  | "LOST"
  | "DENIED"
  | "CONNECTION_UNCERTAIN"
  | "CLIENT_ID_UNAVAILABLE";

/**
 * "ONLINE": el último intento de comunicación con el servidor (acquire o
 * heartbeat) respondió con normalidad.
 * "DEGRADED": un heartbeat falló por red/transporte — el backend sigue
 * siendo la única autoridad, esto es solo informativo para la UI. Nunca
 * implica LOST ni CONNECTION_UNCERTAIN por sí solo (eso lo decide el timer
 * de staleness, no un único error aislado).
 */
export type ConfigLockNetworkState = "ONLINE" | "DEGRADED";

interface ConfigLockContextValue {
  mode: ConfigLockMode;
  ownerClientId: string | null;
  ownerName: string | null;
  networkState: ConfigLockNetworkState;
}

const ConfigLockContext = createContext<ConfigLockContextValue | null>(null);

export function useConfigLock(): ConfigLockContextValue {
  const ctx = useContext(ConfigLockContext);
  if (!ctx) {
    throw new Error("useConfigLock debe usarse dentro de <ConfigLockProvider>");
  }
  return ctx;
}

export function ConfigLockProvider({ children }: { children: ReactNode }) {
  const ownerClientIdResult = useOwnerClientId();
  const [mode, setMode] = useState<ConfigLockMode>("LOADING");
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [networkState, setNetworkState] = useState<ConfigLockNetworkState>("ONLINE");

  // Leído dentro de closures async (heartbeat, visibilitychange) que no
  // pueden depender de un `mode` de render capturado por cierre.
  const modeRef = useRef<ConfigLockMode>(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (!ownerClientIdResult) return; // LOADING — useOwnerClientId todavía resolviendo.

    if (ownerClientIdResult.status === "UNAVAILABLE") {
      // No se pudo verificar de forma segura la identidad de esta tab
      // (BroadcastChannel no disponible o su constructor falló). Nunca se
      // intenta acquire en este caso — quedar en solo lectura es la única
      // opción segura (ver REVIEW FINAL A3.1.2.1 §2).
      setMode("CLIENT_ID_UNAVAILABLE");
      return;
    }

    const ownerClientId = ownerClientIdResult.clientId;
    // Flag de "sigo siendo la ejecución activa de este montaje" — toda
    // continuación async (acquire, heartbeat, verificación por
    // visibilitychange) la chequea antes de tocar estado. Cubre tanto el
    // unmount real como el caso más sutil de una respuesta tardía llegando
    // después de que este mismo efecto ya se desmontó.
    let active = true;
    let lastConfirmedAt = 0;
    let stalenessTimer: ReturnType<typeof setTimeout> | null = null;
    let scheduler: HeartbeatScheduler | null = null;

    function clearStalenessTimer() {
      if (stalenessTimer !== null) {
        clearTimeout(stalenessTimer);
        stalenessTimer = null;
      }
    }

    /** Rearma el timer que degrada a CONNECTION_UNCERTAIN si no hay una
     * nueva confirmación exitosa dentro de STALENESS_MARGIN_MS. Se llama en
     * cada confirmación (acquire EDITABLE, heartbeat OK) — nunca decide
     * ownership, solo deja de MOSTRAR editable sin confirmación reciente. */
    function armStalenessTimer() {
      clearStalenessTimer();
      stalenessTimer = setTimeout(() => {
        if (!active) return;
        if (modeRef.current === "EDITABLE" || modeRef.current === "CONNECTION_UNCERTAIN") {
          setMode("CONNECTION_UNCERTAIN");
        }
      }, STALENESS_MARGIN_MS);
    }

    function confirmEditable() {
      lastConfirmedAt = Date.now();
      setMode("EDITABLE");
      setOwnerName(null);
      setNetworkState("ONLINE");
      armStalenessTimer();
    }

    async function runHeartbeat() {
      let outcome: HeartbeatOutcome;
      try {
        const result = await heartbeatConfigLock(ownerClientId);
        outcome = result.status === "LOST" ? { kind: "LOST" } : { kind: "OK" };
      } catch {
        outcome = { kind: "ERROR" };
      }
      if (!active) return; // late response tras unmount — nunca modifica estado

      // Regla absoluta (fix SESIÓN 16 — bug real encontrado en la MICRO
      // REVIEW): confirmEditable() — y por lo tanto refrescar
      // lastConfirmedAt/rearmar el watchdog de staleness — se dispara
      // EXCLUSIVAMENTE cuando el heartbeat confirmó de verdad (outcome.kind
      // === "OK"). Nunca por inspeccionar `next.mode`: reduceHeartbeatOutcome
      // puede devolver mode:"EDITABLE" para un ERROR (es lo que hay que
      // MOSTRAR mientras tanto), y eso NO es lo mismo que una confirmación
      // real — confundir ambas cosas permitía que heartbeats fallidos
      // repetidos reiniciaran el reloj de staleness indefinidamente.
      if (heartbeatConfirmsLease(outcome)) {
        confirmEditable();
        return;
      }

      const currentLeaseMode: LeaseMode = modeRef.current === "CONNECTION_UNCERTAIN" ? "CONNECTION_UNCERTAIN" : "EDITABLE";
      const next = reduceHeartbeatOutcome(currentLeaseMode, outcome);

      if (next.mode === "LOST") {
        setMode("LOST");
        setOwnerName(null);
        clearStalenessTimer();
        scheduler?.stop();
        return;
      }

      // next.mode es "EDITABLE" (sin confirmar — se sigue mostrando así
      // mientras no venza el watchdog) o "CONNECTION_UNCERTAIN". En ambos
      // casos: nunca tocar lastConfirmedAt ni el timer de staleness acá —
      // solo el watchdog (por vencimiento) o una confirmación real (arriba)
      // pueden mover el modo desde este punto.
      setMode(next.mode);
      setNetworkState(next.networkState);
    }

    scheduler = createHeartbeatScheduler({ intervalMs: LOCK_HEARTBEAT_MS, runHeartbeat });

    acquireConfigLock(ownerClientId)
      .then((status) => {
        if (!active) return;
        setNetworkState("ONLINE");
        switch (status.mode) {
          case "EDITABLE":
            confirmEditable();
            scheduler!.start();
            break;
          case "READ_ONLY_OCCUPIED":
            setMode("OCCUPIED");
            setOwnerName(status.ownerName);
            break;
          case "READ_ONLY_SAME_USER_TAB":
            setMode("SAME_USER_OTHER_TAB");
            setOwnerName(null);
            break;
          case "DENIED":
            setMode("DENIED");
            setOwnerName(null);
            break;
        }
      })
      .catch(() => {
        // Error inesperado (no un conflicto de lock, sino falla real) al
        // intentar adquirir: nunca habilitar edición sin confirmación.
        if (!active) return;
        setMode("DENIED");
        setOwnerName(null);
      });

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (modeRef.current !== "EDITABLE" && modeRef.current !== "CONNECTION_UNCERTAIN") return;
      // Al volver a foreground (posible sleep/wake prolongado) nunca hay que
      // confiar en un heartbeat potencialmente viejo: pasar a conservador
      // YA, y verificar contra el servidor de inmediato, sin esperar el
      // próximo tick de 25s.
      setMode("CONNECTION_UNCERTAIN");
      scheduler?.runNow();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      clearStalenessTimer();
      scheduler?.stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Corrección lifecycle (SESIÓN 16): a propósito NO se llama
      // releaseConfigLock acá. Un release fire-and-forget disparado en este
      // cleanup puede llegar al servidor DESPUÉS de un acquire posterior de
      // la MISMA tab (mismo ownerClientId) — por ejemplo navegación rápida
      // fuera→dentro de /configuracion, F5, o remount de React Strict Mode
      // (activo en este proyecto, ver next.config) — y borrar el lease
      // recién renovado: releaseLocks matchea por (lockKey, ownerUserId,
      // ownerClientId) sin ninguna noción de versión/generación, así que no
      // puede distinguir "mi release viejo" de "mi lease nuevo". Ver REVIEW
      // FINAL A3.1.2.1 §6 para el análisis completo de esta race.
      //
      // Por eso el único mecanismo de liberación acá es el TTL del servidor
      // (80s) — cubre F5, cierre de tab, crash y cualquier navegación no
      // controlada. Si la misma tab vuelve a /configuracion antes del TTL,
      // reutiliza el mismo ownerClientId y simplemente renueva su propio
      // lease (acquireLocks ya es idempotente para el mismo owner+tab).
      // Un release explícito y AWAITED (no fire-and-forget) para
      // navegación controlada queda para una iteración futura —
      // releaseConfigLock sigue existiendo y testeado en lock-actions.ts,
      // solo que este provider no lo dispara automáticamente.
    };
  }, [ownerClientIdResult]);

  const value: ConfigLockContextValue = {
    mode,
    ownerClientId: ownerClientIdResult?.status === "READY" ? ownerClientIdResult.clientId : null,
    ownerName,
    networkState,
  };

  return <ConfigLockContext.Provider value={value}>{children}</ConfigLockContext.Provider>;
}
