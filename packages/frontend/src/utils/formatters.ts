import { SessionSummary } from "../types/telemetry";

const MPS_TO_MPH = 2.23694;
const MPS_TO_KPH = 3.6;
const METERS_TO_MILES = 0.000621371;

/** Converts a speed in m/s to MPH or KM/H. */
export function getSpeedValue(mps: number, useImperial: boolean): number {
  return useImperial ? mps * MPS_TO_MPH : mps * MPS_TO_KPH;
}

export function getSpeedUnit(useImperial: boolean): string {
  return useImperial ? "MPH" : "KM/H";
}

/** Formats a speed in m/s, e.g. "112 MPH". */
export function formatSpeed(mps: number, useImperial: boolean): string {
  return `${Math.round(getSpeedValue(mps, useImperial))} ${getSpeedUnit(useImperial)}`;
}

/** Formats a distance in meters, e.g. "3.21 mi". */
export function formatDistance(meters: number, useImperial: boolean): string {
  return useImperial
    ? `${(meters * METERS_TO_MILES).toFixed(2)} mi`
    : `${(meters / 1000).toFixed(2)} km`;
}

/** Formats epoch milliseconds as a short localized date and time. */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formats seconds as m:ss. */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/** Formats a 0..1 ratio as a percentage. */
export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** Forza gear values: 0 = reverse, 1 = neutral, 2 = 1st gear, and so on. */
export function getGearLabel(gear: number): string {
  if (gear === 0) return "R";
  if (gear === 1) return "N";
  return (gear - 1).toString();
}

export type TireTempClass = "cold" | "optimum" | "hot" | "overheated";

export function getTireTempClass(temp: number): TireTempClass {
  if (temp < 50) return "cold";
  if (temp <= 85) return "optimum";
  if (temp <= 100) return "hot";
  return "overheated";
}

/** Driver style label based on the 0..1 lead-foot index. */
export function getDriverStyle(index: number): string {
  if (index === 0) return "Spectator";
  if (index < 0.2) return "Smooth cruiser";
  if (index < 0.45) return "Balanced driver";
  if (index < 0.7) return "Fast & Aggressive";
  return "Lead-Foot Racer";
}

/** Converts a 0..255 pedal value to a 0..100 percentage. */
export function pedalPercent(value: number): number {
  return (value / 255) * 100;
}

export interface CareerStats {
  totalSessions: number;
  lifetimeDistanceMeters: number;
  maxSpeedMps: number;
  avgSpeedMps: number;
  avgLeadFootIndex: number;
}

/** Aggregates lifetime statistics across all saved sessions. */
export function computeCareerStats(sessions: SessionSummary[]): CareerStats {
  const count = sessions.length;
  if (count === 0) {
    return {
      totalSessions: 0,
      lifetimeDistanceMeters: 0,
      maxSpeedMps: 0,
      avgSpeedMps: 0,
      avgLeadFootIndex: 0,
    };
  }
  const sum = (pick: (s: SessionSummary) => number) =>
    sessions.reduce((acc, s) => acc + pick(s), 0);
  return {
    totalSessions: count,
    lifetimeDistanceMeters: sum((s) => s.totalDistanceMeters),
    maxSpeedMps: Math.max(...sessions.map((s) => s.maxSpeedMps)),
    avgSpeedMps: sum((s) => s.avgSpeedMps) / count,
    avgLeadFootIndex: sum((s) => s.leadFootIndex) / count,
  };
}
