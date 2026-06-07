import { useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { TelemetryPayload, SessionSummary } from "./types/telemetry";
import {
  getCarName,
  getCarClassLabel,
  getCarClassColorClass,
  getDrivetrainTypeLabel
} from "./utils/carDatabase";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<"live" | "career" | "setup">("live");
  const [isConnected, setIsConnected] = useState(false);
  const [lastPacketTime, setLastPacketTime] = useState<number>(0);
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  
  // Session tracking
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [activeSessionData, setActiveSessionData] = useState<SessionSummary | null>(null);
  const [recentSession, setRecentSession] = useState<SessionSummary | null>(null);
  const [historicalSessions, setHistoricalSessions] = useState<SessionSummary[]>([]);
  
  // Unit toggle
  const [useImperial, setUseImperial] = useState(true);

  // Poll connection status based on last packet time
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastPacketTime > 0 && Date.now() - lastPacketTime > 2000) {
        setIsConnected(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastPacketTime]);

  // Load telemetry data and status events from Tauri
  useEffect(() => {
    let unlistenTelemetry: (() => void) | undefined;
    let unlistenStart: (() => void) | undefined;
    let unlistenEnd: (() => void) | undefined;

    async function setupListeners() {
      unlistenTelemetry = await listen<TelemetryPayload>("telemetry-data", (event) => {
        setTelemetry(event.payload);
        setIsConnected(true);
        setLastPacketTime(Date.now());
      });

      unlistenStart = await listen("session-started", () => {
        setLiveSessionActive(true);
        fetchActiveSession();
      });

      unlistenEnd = await listen<SessionSummary>("session-ended", (event) => {
        setLiveSessionActive(false);
        setRecentSession(event.payload);
        fetchActiveSession();
        fetchHistoricalSessions();
      });
    }

    setupListeners();
    fetchActiveSession();
    fetchHistoricalSessions();

    return () => {
      if (unlistenTelemetry) unlistenTelemetry();
      if (unlistenStart) unlistenStart();
      if (unlistenEnd) unlistenEnd();
    };
  }, []);

  // Poll active session data regularly if active to get server summaries
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (liveSessionActive) {
      interval = setInterval(() => {
        fetchActiveSession();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [liveSessionActive]);

  const fetchActiveSession = async () => {
    try {
      const session = await invoke<SessionSummary | null>("get_active_session");
      setActiveSessionData(session);
      if (session) setLiveSessionActive(true);
    } catch (err) {
      console.error("Failed to fetch active session:", err);
    }
  };

  const fetchHistoricalSessions = async () => {
    try {
      const logs = await invoke<SessionSummary[]>("get_historical_sessions");
      setHistoricalSessions(logs);
    } catch (err) {
      console.error("Failed to fetch historical sessions:", err);
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to delete all historical race sessions?")) {
      try {
        await invoke("delete_all_sessions");
        fetchHistoricalSessions();
        setRecentSession(null);
      } catch (err) {
        console.error("Failed to delete sessions:", err);
      }
    }
  };

  // Convert speeds (m/s)
  const formatSpeed = (mps: number) => {
    if (useImperial) {
      const mph = mps * 2.23694;
      return `${Math.round(mph)} MPH`;
    } else {
      const kph = mps * 3.6;
      return `${Math.round(kph)} KM/H`;
    }
  };

  const getSpeedValue = (mps: number) => {
    return useImperial ? mps * 2.23694 : mps * 3.6;
  };

  // Convert distances (meters)
  const formatDistance = (meters: number) => {
    if (useImperial) {
      const miles = meters * 0.000621371;
      return `${miles.toFixed(2)} mi`;
    } else {
      const km = meters / 1000;
      return `${km.toFixed(2)} km`;
    }
  };

  // Format epoch milliseconds to localized date string
  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Gear mapping
  const getGearLabel = (gear: number) => {
    if (gear === 0) return "R";
    if (gear === 1) return "N";
    return (gear - 1).toString();
  };

  // Tire temp colors mapping
  const getTireTempClass = (temp: number) => {
    if (temp < 50) return "cold";
    if (temp <= 85) return "optimum";
    if (temp <= 100) return "hot";
    return "overheated";
  };

  // Calculate career summaries
  const totalSessionsCount = historicalSessions.length;
  const lifetimeDistance = historicalSessions.reduce((acc, curr) => acc + curr.totalDistanceMeters, 0);
  const maxSpeedMps = historicalSessions.length > 0 ? Math.max(...historicalSessions.map(s => s.maxSpeedMps)) : 0;
  const overallAvgSpeedMps = historicalSessions.length > 0 
    ? historicalSessions.reduce((acc, curr) => acc + curr.avgSpeedMps, 0) / historicalSessions.length 
    : 0;
  
  // Calculate average lead foot index
  const averageLeadFoot = historicalSessions.length > 0
    ? historicalSessions.reduce((acc, curr) => acc + curr.leadFootIndex, 0) / historicalSessions.length
    : 0;

  // Driver Style label based on lead foot index
  const getDriverStyle = (index: number) => {
    if (index === 0) return "Spectator";
    if (index < 0.2) return "Smooth cruiser";
    if (index < 0.45) return "Balanced driver";
    if (index < 0.7) return "Fast & Aggressive";
    return "Lead-Foot Racer";
  };

  // Render Live HUD
  const renderLiveHUD = () => {
    if (!isConnected || !telemetry) {
      return (
        <div className="glass-card instructions-card">
          <div className="card-title">
            <span>NO TELEMETRY RECEIVED</span>
            <div className="status-badge">
              <span className="status-dot inactive"></span>
              <span>Disconnected</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p>The application is listening on UDP port <strong>5300</strong>. To feed telemetry data here, you must run the simulator or configure your game:</p>
            <ol className="instructions-list" style={{ marginLeft: "20px" }}>
              <li>Launch <strong>Forza Horizon 4 / 5</strong> or <strong>Motorsport</strong>.</li>
              <li>Go to <strong>Settings</strong> &gt; <strong>HUD and Gameplay</strong>.</li>
              <li>Scroll to the bottom to find <strong>Data Out</strong> settings.</li>
              <li>Set <strong>Data Out</strong> to <strong>ON</strong>.</li>
              <li>Set <strong>Data Out IP Address</strong> to <strong>127.0.0.1</strong> (or your local IP if running on separate devices).</li>
              <li>Set <strong>Data Out Port</strong> to <strong>5300</strong>.</li>
              <li>Set <strong>Data Out Format</strong> to <strong>Dash</strong> / <strong>Car Dash</strong>.</li>
            </ol>
            <p style={{ fontSize: "14px", color: "var(--neon-orange)" }}>
              <em>Note for Windows PC App version: You might need the "Windows Loopback Utility" to allow Microsoft Store apps to stream to local network hosts.</em>
            </p>
          </div>
        </div>
      );
    }

    // Speed calculation
    const speedVal = getSpeedValue(telemetry.speed);
    const speedPercent = Math.min((speedVal / 180) * 100, 100);
    // SVG gauge configuration
    const radius = 80;
    const circ = 2 * Math.PI * radius;
    const speedOffset = circ - (speedPercent / 100) * circ;

    // RPM calculation
    const rpmPercent = telemetry.engineMaxRpm > 0 
      ? Math.min((telemetry.currentEngineRpm / telemetry.engineMaxRpm) * 100, 100)
      : 0;
    const rpmOffset = circ - (rpmPercent / 100) * circ;
    const isRedline = telemetry.engineMaxRpm > 0 && (telemetry.currentEngineRpm / telemetry.engineMaxRpm) > 0.9;

    return (
      <div className="hud-layout">
        {/* Left Side: Speed & RPM Gauges */}
        <div className="glass-card" style={{ gap: "24px" }}>
          <div className="card-title">
            <span>LIVE INSTRUMENT HUD</span>
            <div className="status-badge">
              <span className="status-dot active"></span>
              <span>Live Telemetry</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "24px" }}>
            {/* Speed Gauge */}
            <div className="gauge-wrapper">
              <svg className="circular-gauge">
                <circle className="bg-ring" cx="100" cy="100" r={radius} />
                <circle
                  className="fill-ring"
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke="var(--neon-cyan)"
                  strokeDasharray={circ}
                  strokeDashoffset={speedOffset}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                />
              </svg>
              <div className="gauge-center-text">
                <span className="gauge-value" style={{ color: "var(--neon-cyan)" }}>
                  {Math.round(speedVal)}
                </span>
                <span className="gauge-unit">{useImperial ? "MPH" : "KM/H"}</span>
              </div>
            </div>

            {/* RPM Gauge */}
            <div className="gauge-wrapper">
              <svg className="circular-gauge">
                <circle className="bg-ring" cx="100" cy="100" r={radius} />
                <circle
                  className="fill-ring"
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke={isRedline ? "var(--neon-red)" : "var(--neon-orange)"}
                  strokeDasharray={circ}
                  strokeDashoffset={rpmOffset}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                />
              </svg>
              <div className="gauge-center-text">
                <span className={`gauge-value ${isRedline ? 'redline' : ''}`} style={{ color: isRedline ? 'var(--neon-red)' : 'var(--neon-orange)' }}>
                  {Math.round(telemetry.currentEngineRpm)}
                </span>
                <span className="gauge-unit">RPM</span>
              </div>
            </div>

            {/* Gear Indicator */}
            <div className="gear-display">
              <span className="gear-label">Gear</span>
              <span className={`gear-value-large ${isRedline ? 'redline' : ''}`}>
                {getGearLabel(telemetry.gear)}
              </span>
            </div>
          </div>

          {/* Vehicle summary line */}
          <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.15)", padding: "12px 18px", borderRadius: "10px", fontSize: "14px" }}>
            <div>Car Ordinal: <strong>{telemetry.carOrdinal}</strong></div>
            <div>Class: <strong className={`log-class-tag ${getCarClassColorClass(telemetry.carClass)}`}>{getCarClassLabel(telemetry.carClass)} {telemetry.carPerformanceIndex}</strong></div>
            <div>Drivetrain: <strong>{getDrivetrainTypeLabel(telemetry.drivetrainType)}</strong></div>
            <div>Engine: <strong>{telemetry.numCylinders} Cylinders</strong></div>
          </div>
        </div>

        {/* Right Side: Pedal Inputs & Tires Heatmap */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Pedal Inputs */}
          <div className="glass-card">
            <div className="card-title">PEDAL INPUTS</div>
            <div className="inputs-container">
              <div className="input-bar-group">
                <div className="input-bar-header">
                  <span>THROTTLE</span>
                  <span>{Math.round((telemetry.accel / 255) * 100)}%</span>
                </div>
                <div className="input-bar-bg">
                  <div className="input-bar-fill throttle" style={{ width: `${(telemetry.accel / 255) * 100}%` }}></div>
                </div>
              </div>

              <div className="input-bar-group">
                <div className="input-bar-header">
                  <span>BRAKE</span>
                  <span>{Math.round((telemetry.brake / 255) * 100)}%</span>
                </div>
                <div className="input-bar-bg">
                  <div className="input-bar-fill brake" style={{ width: `${(telemetry.brake / 255) * 100}%` }}></div>
                </div>
              </div>

              <div className="input-bar-group">
                <div className="input-bar-header">
                  <span>CLUTCH</span>
                  <span>{Math.round((telemetry.clutch / 255) * 100)}%</span>
                </div>
                <div className="input-bar-bg">
                  <div className="input-bar-fill clutch" style={{ width: `${(telemetry.clutch / 255) * 100}%` }}></div>
                </div>
              </div>

              <div className="input-bar-group">
                <div className="input-bar-header">
                  <span>HANDBRAKE</span>
                  <span>{Math.round((telemetry.handBrake / 255) * 100)}%</span>
                </div>
                <div className="input-bar-bg">
                  <div className="input-bar-fill handbrake" style={{ width: `${(telemetry.handBrake / 255) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tire Temps & Slip */}
          <div className="glass-card">
            <div className="card-title">TIRE TEMPS & SLIP</div>
            <div className="tires-grid">
              <div className={`tire-card ${getTireTempClass(telemetry.tireTempFrontLeft)}`}>
                <span className="tire-label">Front Left</span>
                <span className="tire-temp-val">{Math.round(telemetry.tireTempFrontLeft)}°C</span>
                <span className="tire-slip-val">Slip: {telemetry.tireSlipRatioFrontLeft.toFixed(2)}</span>
              </div>
              <div className={`tire-card ${getTireTempClass(telemetry.tireTempFrontRight)}`}>
                <span className="tire-label">Front Right</span>
                <span className="tire-temp-val">{Math.round(telemetry.tireTempFrontRight)}°C</span>
                <span className="tire-slip-val">Slip: {telemetry.tireSlipRatioFrontRight.toFixed(2)}</span>
              </div>
              <div className={`tire-card ${getTireTempClass(telemetry.tireTempRearLeft)}`}>
                <span className="tire-label">Rear Left</span>
                <span className="tire-temp-val">{Math.round(telemetry.tireTempRearLeft)}°C</span>
                <span className="tire-slip-val">Slip: {telemetry.tireSlipRatioRearLeft.toFixed(2)}</span>
              </div>
              <div className={`tire-card ${getTireTempClass(telemetry.tireTempRearRight)}`}>
                <span className="tire-label">Rear Right</span>
                <span className="tire-temp-val">{Math.round(telemetry.tireTempRearRight)}°C</span>
                <span className="tire-slip-val">Slip: {telemetry.tireSlipRatioRearRight.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Career tab
  const renderCareer = () => {
    return (
      <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Career Stats Grid */}
        <div className="glass-card">
          <div className="card-title">CAREER STATISTICS</div>
          <div className="career-overview">
            <div className="stat-box">
              <span className="stat-box-label">Aggregated Sessions</span>
              <span className="stat-box-value">{totalSessionsCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Lifetime Distance</span>
              <span className="stat-box-value">{formatDistance(lifetimeDistance)}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Personal Best Speed</span>
              <span className="stat-box-value">{formatSpeed(maxSpeedMps)}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Career Average Speed</span>
              <span className="stat-box-value">{formatSpeed(overallAvgSpeedMps)}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Lead-Foot Index</span>
              <span className="stat-box-value">{(averageLeadFoot * 100).toFixed(1)}%</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Driver Profile</span>
              <span className="stat-box-value" style={{ color: "var(--neon-orange)", fontSize: "16px" }}>{getDriverStyle(averageLeadFoot)}</span>
            </div>
          </div>
        </div>

        {/* Sessions History List */}
        <div className="glass-card">
          <div className="card-title">
            <span>DRIVING SESSION LOGS</span>
            {historicalSessions.length > 0 && (
              <button className="clear-btn" style={{ margin: 0 }} onClick={handleClearHistory}>
                CLEAR ALL
              </button>
            )}
          </div>
          {historicalSessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
              No recorded sessions found. Telemetry sessions are automatically aggregated and saved when you complete a race or return to the menu!
            </div>
          ) : (
            <div className="log-list">
              {historicalSessions.map((session) => (
                <div key={session.id} className="log-card">
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
                    <div className="log-metric">
                      <span className="log-metric-label">Duration</span>
                      <span className="log-metric-value">{formatDuration(session.durationSeconds)}</span>
                    </div>
                    <div className="log-metric">
                      <span className="log-metric-label">Distance</span>
                      <span className="log-metric-value">{formatDistance(session.totalDistanceMeters)}</span>
                    </div>
                    <div className="log-metric">
                      <span className="log-metric-label">Max Speed</span>
                      <span className="log-metric-value">{formatSpeed(session.maxSpeedMps)}</span>
                    </div>
                    <div className="log-metric">
                      <span className="log-metric-label">Avg Speed</span>
                      <span className="log-metric-value">{formatSpeed(session.avgSpeedMps)}</span>
                    </div>
                    <div className="log-metric">
                      <span className="log-metric-label">Lead-Foot</span>
                      <span className="log-metric-value">{(session.leadFootIndex * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Header Panel */}
      <header>
        <div className="brand">
          <h1>FORZA HUD & SCROBBLER</h1>
        </div>

        {/* Global toggles and state */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Unit Switcher */}
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "4px", display: "flex", gap: "2px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <button
              style={{ padding: "6px 12px", fontSize: "12px" }}
              className={`tab-btn ${useImperial ? "active" : ""}`}
              onClick={() => setUseImperial(true)}
            >
              MPH
            </button>
            <button
              style={{ padding: "6px 12px", fontSize: "12px" }}
              className={`tab-btn ${!useImperial ? "active" : ""}`}
              onClick={() => setUseImperial(false)}
            >
              KM/H
            </button>
          </div>

          <div className="status-badge">
            <span className={`status-dot ${isConnected ? "active" : "inactive"}`}></span>
            <span>{isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
          </div>
        </div>
      </header>

      {/* Tabs list */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "live" ? "active" : ""}`}
          onClick={() => setActiveTab("live")}
        >
          LIVE HUD
        </button>
        <button
          className={`tab-btn ${activeTab === "career" ? "active" : ""}`}
          onClick={() => setActiveTab("career")}
        >
          CAREER LOGS & SCROBBLES ({historicalSessions.length})
        </button>
      </div>

      {/* Main Workspace content */}
      <div className="main-content">
        {activeTab === "live" && (
          <div className="panel">
            {/* Live Session Aggregator Status Card */}
            {liveSessionActive && activeSessionData && (
              <div className="glass-card glow-cyan" style={{ borderLeft: "4px solid var(--neon-cyan)" }}>
                <div className="card-title">
                  <span>ACTIVE DRIVING SESSION TRACKING</span>
                  <div className="status-badge" style={{ borderColor: "rgba(0, 242, 254, 0.3)", background: "rgba(0, 242, 254, 0.05)" }}>
                    <span className="status-dot active"></span>
                    <span style={{ color: "var(--neon-cyan)" }}>Scrobbling Live...</span>
                  </div>
                </div>
                <div className="career-overview" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                  <div className="stat-box">
                    <span className="stat-box-label">Car</span>
                    <span className="stat-box-value" style={{ fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {getCarName(activeSessionData.carOrdinal)}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-label">Elapsed Time</span>
                    <span className="stat-box-value">{formatDuration(activeSessionData.durationSeconds)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-label">Distance Covered</span>
                    <span className="stat-box-value">{formatDistance(activeSessionData.totalDistanceMeters)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-label">Avg Speed</span>
                    <span className="stat-box-value">{formatSpeed(activeSessionData.avgSpeedMps)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-label">Max Speed</span>
                    <span className="stat-box-value">{formatSpeed(activeSessionData.maxSpeedMps)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-label">Current Lead-Foot</span>
                    <span className="stat-box-value">{(activeSessionData.leadFootIndex * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}

            {recentSession && !liveSessionActive && (
              <div className="glass-card" style={{ borderLeft: "4px solid var(--neon-green)", background: "rgba(57, 255, 20, 0.02)" }}>
                <div className="card-title">
                  <span>LAST SESSION SUMMARY COMPLETED</span>
                  <button className="clear-btn" style={{ margin: 0, padding: "4px 8px", fontSize: "11px", border: "1px solid var(--text-secondary)", color: "var(--text-secondary)" }} onClick={() => setRecentSession(null)}>
                    DISMISS
                  </button>
                </div>
                <div className="career-overview" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                  <div className="stat-box">
                    <span className="stat-box-label">Car</span>
                    <span className="stat-box-value" style={{ fontSize: "15px" }}>{getCarName(recentSession.carOrdinal)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-label">Duration</span>
                    <span className="stat-box-value">{formatDuration(recentSession.durationSeconds)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-label">Total Distance</span>
                    <span className="stat-box-value">{formatDistance(recentSession.totalDistanceMeters)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-label">Avg Speed</span>
                    <span className="stat-box-value">{formatSpeed(recentSession.avgSpeedMps)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-label">PB Speed</span>
                    <span className="stat-box-value">{formatSpeed(recentSession.maxSpeedMps)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-label">Style Profile</span>
                    <span className="stat-box-value" style={{ fontSize: "15px", color: "var(--neon-green)" }}>{getDriverStyle(recentSession.leadFootIndex)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Live Dashboard Display */}
            {renderLiveHUD()}
          </div>
        )}

        {activeTab === "career" && renderCareer()}
      </div>
    </div>
  );
}

export default App;
