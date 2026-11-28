import { SessionSummary } from "../types/telemetry";
import { getCarClassColorClass, getCarClassLabel, getCarName } from "../utils/carDatabase";
import {
  computeCareerStats,
  formatDate,
  formatDistance,
  formatDuration,
  formatPercent,
  formatSpeed,
  getDriverStyle,
} from "../utils/formatters";
import { StatBox } from "./StatBox";

interface CareerDashboardProps {
  sessions: SessionSummary[];
  useImperial: boolean;
  onClearHistory: () => void;
}

export function CareerDashboard({ sessions, useImperial, onClearHistory }: CareerDashboardProps) {
  const stats = computeCareerStats(sessions);

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Career Stats Grid */}
      <div className="glass-card">
        <div className="card-title">CAREER STATISTICS</div>
        <div className="career-overview">
          <StatBox label="Aggregated Sessions" value={stats.totalSessions} />
          <StatBox label="Lifetime Distance" value={formatDistance(stats.lifetimeDistanceMeters, useImperial)} />
          <StatBox label="Personal Best Speed" value={formatSpeed(stats.maxSpeedMps, useImperial)} />
          <StatBox label="Career Average Speed" value={formatSpeed(stats.avgSpeedMps, useImperial)} />
          <StatBox label="Lead-Foot Index" value={formatPercent(stats.avgLeadFootIndex, 1)} />
          <StatBox
            label="Driver Profile"
            value={getDriverStyle(stats.avgLeadFootIndex)}
            valueStyle={{ color: "var(--neon-orange)", fontSize: "16px" }}
          />
        </div>
      </div>

      {/* Sessions History List */}
      <div className="glass-card">
        <div className="card-title">
          <span>DRIVING SESSION LOGS</span>
          {sessions.length > 0 && (
            <button className="clear-btn" style={{ margin: 0 }} onClick={onClearHistory}>
              CLEAR ALL
            </button>
          )}
        </div>
        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
            No recorded sessions found. Telemetry sessions are automatically aggregated and saved when you complete a race or return to the menu!
          </div>
        ) : (
          <div className="log-list">
            {sessions.map((session) => (
              <SessionLogCard key={session.id} session={session} useImperial={useImperial} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SessionLogCardProps {
  session: SessionSummary;
  useImperial: boolean;
}

function SessionLogCard({ session, useImperial }: SessionLogCardProps) {
  const metrics = [
    { label: "Duration", value: formatDuration(session.durationSeconds) },
    { label: "Distance", value: formatDistance(session.totalDistanceMeters, useImperial) },
    { label: "Max Speed", value: formatSpeed(session.maxSpeedMps, useImperial) },
    { label: "Avg Speed", value: formatSpeed(session.avgSpeedMps, useImperial) },
    { label: "Lead-Foot", value: formatPercent(session.leadFootIndex) },
  ];

  return (
    <div className="log-card">
      <div className="log-main">
        <span className="log-car">{getCarName(session.carOrdinal)}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
          <span className={`log-class-tag ${getCarClassColorClass(session.carClass)}`}>
            {getCarClassLabel(session.carClass)} {session.carPerformanceIndex}
          </span>
          <span className="log-date">{formatDate(session.startTime)}</span>
        </div>
      </div>

      <div className="log-metrics">
        {metrics.map(({ label, value }) => (
          <div key={label} className="log-metric">
            <span className="log-metric-label">{label}</span>
            <span className="log-metric-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
