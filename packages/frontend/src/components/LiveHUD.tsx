import { TelemetryPayload } from "../types/telemetry";
import {
  getCarClassColorClass,
  getCarClassLabel,
  getDrivetrainTypeLabel,
} from "../utils/carDatabase";
import { getGearLabel, getSpeedUnit, getSpeedValue } from "../utils/formatters";
import { CircularGauge } from "./CircularGauge";
import { NoTelemetryInstructions } from "./NoTelemetryInstructions";
import { PedalInputs } from "./PedalInputs";
import { TiresHeatmap } from "./TiresHeatmap";

/** Speed (in the display unit) that fills the speed gauge. */
const SPEED_GAUGE_MAX = 180;
/** Fraction of max RPM at which the redline styling kicks in. */
const REDLINE_THRESHOLD = 0.9;

interface LiveHUDProps {
  telemetry: TelemetryPayload | null;
  isConnected: boolean;
  useImperial: boolean;
}

export function LiveHUD({ telemetry, isConnected, useImperial }: LiveHUDProps) {
  if (!isConnected || !telemetry) {
    return <NoTelemetryInstructions />;
  }

  const speedVal = getSpeedValue(telemetry.speed, useImperial);
  const rpmRatio = telemetry.engineMaxRpm > 0
    ? telemetry.currentEngineRpm / telemetry.engineMaxRpm
    : 0;
  const isRedline = rpmRatio > REDLINE_THRESHOLD;

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
          <CircularGauge
            percent={(speedVal / SPEED_GAUGE_MAX) * 100}
            value={speedVal}
            unit={getSpeedUnit(useImperial)}
            color="var(--neon-cyan)"
          />
          <CircularGauge
            percent={rpmRatio * 100}
            value={telemetry.currentEngineRpm}
            unit="RPM"
            color={isRedline ? "var(--neon-red)" : "var(--neon-orange)"}
            redline={isRedline}
          />

          <div className="gear-display">
            <span className="gear-label">Gear</span>
            <span className={`gear-value-large ${isRedline ? "redline" : ""}`}>
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
        <PedalInputs
          accel={telemetry.accel}
          brake={telemetry.brake}
          clutch={telemetry.clutch}
          handBrake={telemetry.handBrake}
        />
        <TiresHeatmap telemetry={telemetry} />
      </div>
    </div>
  );
}
