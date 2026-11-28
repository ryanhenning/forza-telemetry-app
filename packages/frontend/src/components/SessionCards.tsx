import { SessionSummary } from "../types/telemetry";
import { getCarName } from "../utils/carDatabase";
import {
  formatDistance,
  formatDuration,
  formatPercent,
  formatSpeed,
  getDriverStyle,
} from "../utils/formatters";
import { StatBox } from "./StatBox";

const gridStyle = { gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" };

interface ActiveSessionCardProps {
  session: SessionSummary;
  useImperial: boolean;
}

/** Running totals for the session currently being scrobbled. */
export function ActiveSessionCard({ session, useImperial }: ActiveSessionCardProps) {
  return (
    <div className="glass-card glow-cyan" style={{ borderLeft: "4px solid var(--neon-cyan)" }}>
      <div className="card-title">
        <span>ACTIVE DRIVING SESSION TRACKING</span>
        <div className="status-badge" style={{ borderColor: "rgba(0, 242, 254, 0.3)", background: "rgba(0, 242, 254, 0.05)" }}>
          <span className="status-dot active"></span>
          <span style={{ color: "var(--neon-cyan)" }}>Scrobbling Live...</span>
        </div>
      </div>
      <div className="career-overview" style={gridStyle}>
        <StatBox
          label="Car"
          value={getCarName(session.carOrdinal)}
          valueStyle={{ fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        />
        <StatBox label="Elapsed Time" value={formatDuration(session.durationSeconds)} />
        <StatBox label="Distance Covered" value={formatDistance(session.totalDistanceMeters, useImperial)} />
        <StatBox label="Avg Speed" value={formatSpeed(session.avgSpeedMps, useImperial)} />
        <StatBox label="Max Speed" value={formatSpeed(session.maxSpeedMps, useImperial)} />
        <StatBox label="Current Lead-Foot" value={formatPercent(session.leadFootIndex)} />
      </div>
    </div>
  );
}

interface LastSessionCardProps {
  session: SessionSummary;
  useImperial: boolean;
  onDismiss: () => void;
}

/** Summary of the session that just ended. */
export function LastSessionCard({ session, useImperial, onDismiss }: LastSessionCardProps) {
  return (
    <div className="glass-card" style={{ borderLeft: "4px solid var(--neon-green)", background: "rgba(57, 255, 20, 0.02)" }}>
      <div className="card-title">
        <span>LAST SESSION SUMMARY COMPLETED</span>
        <button className="clear-btn" style={{ margin: 0, padding: "4px 8px", fontSize: "11px", border: "1px solid var(--text-secondary)", color: "var(--text-secondary)" }} onClick={onDismiss}>
          DISMISS
        </button>
      </div>
      <div className="career-overview" style={gridStyle}>
        <StatBox label="Car" value={getCarName(session.carOrdinal)} valueStyle={{ fontSize: "15px" }} />
        <StatBox label="Duration" value={formatDuration(session.durationSeconds)} />
        <StatBox label="Total Distance" value={formatDistance(session.totalDistanceMeters, useImperial)} />
        <StatBox label="Avg Speed" value={formatSpeed(session.avgSpeedMps, useImperial)} />
        <StatBox label="PB Speed" value={formatSpeed(session.maxSpeedMps, useImperial)} />
        <StatBox
          label="Style Profile"
          value={getDriverStyle(session.leadFootIndex)}
          valueStyle={{ fontSize: "15px", color: "var(--neon-green)" }}
        />
      </div>
    </div>
  );
}
