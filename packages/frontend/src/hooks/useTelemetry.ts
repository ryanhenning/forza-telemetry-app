import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { TelemetryPayload } from "../types/telemetry";

/** How long without a packet before the game counts as disconnected. */
const CONNECTION_TIMEOUT_MS = 2000;
const CONNECTION_POLL_MS = 1000;

export interface TelemetryState {
  telemetry: TelemetryPayload | null;
  isConnected: boolean;
}

/**
 * Subscribes to the `telemetry-data` events the Rust UDP listener emits and
 * tracks whether packets are still arriving.
 */
export function useTelemetry(): TelemetryState {
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // A ref, so 60Hz packets don't restart the timeout interval or re-render.
  const lastPacketTime = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    listen<TelemetryPayload>("telemetry-data", (event) => {
      lastPacketTime.current = Date.now();
      setTelemetry(event.payload);
      setIsConnected(true);
    }).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const last = lastPacketTime.current;
      if (last > 0 && Date.now() - last > CONNECTION_TIMEOUT_MS) {
        setIsConnected(false);
      }
    }, CONNECTION_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return { telemetry, isConnected };
}
