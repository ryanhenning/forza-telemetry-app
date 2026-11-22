import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { SessionSummary } from "../types/telemetry";

/** How often to refresh the running totals while a session is live. */
const ACTIVE_SESSION_POLL_MS = 1000;

export interface SessionTrackerState {
  /** True while the backend is aggregating a session. */
  liveSessionActive: boolean;
  /** Running totals for the live session, if any. */
  activeSession: SessionSummary | null;
  /** The session that most recently ended, until dismissed. */
  recentSession: SessionSummary | null;
  /** All saved sessions. */
  historicalSessions: SessionSummary[];
  dismissRecentSession: () => void;
  /** Asks for confirmation, then deletes every saved session. */
  clearHistory: () => Promise<void>;
}

/**
 * Tracks the live session and saved session history through the backend's
 * `session-started` / `session-ended` events and session commands.
 */
export function useSessionTracker(): SessionTrackerState {
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [activeSession, setActiveSession] = useState<SessionSummary | null>(null);
  const [recentSession, setRecentSession] = useState<SessionSummary | null>(null);
  const [historicalSessions, setHistoricalSessions] = useState<SessionSummary[]>([]);

  const fetchActiveSession = useCallback(async () => {
    try {
      const session = await invoke<SessionSummary | null>("get_active_session");
      setActiveSession(session);
      if (session) setLiveSessionActive(true);
    } catch (err) {
      console.error("Failed to fetch active session:", err);
    }
  }, []);

  const fetchHistoricalSessions = useCallback(async () => {
    try {
      const logs = await invoke<SessionSummary[]>("get_historical_sessions");
      setHistoricalSessions(logs);
    } catch (err) {
      console.error("Failed to fetch historical sessions:", err);
    }
  }, []);

  // Subscribe to session lifecycle events and load the initial state.
  useEffect(() => {
    let cancelled = false;
    const unlisteners: Array<() => void> = [];
    const keep = (fn: () => void) => {
      if (cancelled) fn();
      else unlisteners.push(fn);
    };

    listen("session-started", () => {
      setLiveSessionActive(true);
      fetchActiveSession();
    }).then(keep);

    listen<SessionSummary>("session-ended", (event) => {
      setLiveSessionActive(false);
      setRecentSession(event.payload);
      fetchActiveSession();
      fetchHistoricalSessions();
    }).then(keep);

    fetchActiveSession();
    fetchHistoricalSessions();

    return () => {
      cancelled = true;
      unlisteners.forEach((fn) => fn());
    };
  }, [fetchActiveSession, fetchHistoricalSessions]);

  // Poll running totals while a session is live.
  useEffect(() => {
    if (!liveSessionActive) return;
    const interval = setInterval(fetchActiveSession, ACTIVE_SESSION_POLL_MS);
    return () => clearInterval(interval);
  }, [liveSessionActive, fetchActiveSession]);

  const dismissRecentSession = useCallback(() => setRecentSession(null), []);

  const clearHistory = useCallback(async () => {
    if (!confirm("Are you sure you want to delete all historical race sessions?")) return;
    try {
      await invoke("delete_all_sessions");
      await fetchHistoricalSessions();
      setRecentSession(null);
    } catch (err) {
      console.error("Failed to delete sessions:", err);
    }
  }, [fetchHistoricalSessions]);

  return {
    liveSessionActive,
    activeSession,
    recentSession,
    historicalSessions,
    dismissRecentSession,
    clearHistory,
  };
}
