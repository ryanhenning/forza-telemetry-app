import { TelemetryPayload } from "../types/telemetry";
import { getTireTempClass } from "../utils/formatters";

interface TiresHeatmapProps {
  telemetry: TelemetryPayload;
}

export function TiresHeatmap({ telemetry }: TiresHeatmapProps) {
  const tires = [
    { label: "Front Left", temp: telemetry.tireTempFrontLeft, slip: telemetry.tireSlipRatioFrontLeft },
    { label: "Front Right", temp: telemetry.tireTempFrontRight, slip: telemetry.tireSlipRatioFrontRight },
    { label: "Rear Left", temp: telemetry.tireTempRearLeft, slip: telemetry.tireSlipRatioRearLeft },
    { label: "Rear Right", temp: telemetry.tireTempRearRight, slip: telemetry.tireSlipRatioRearRight },
  ];

  return (
    <div className="glass-card">
      <div className="card-title">TIRE TEMPS & SLIP</div>
      <div className="tires-grid">
        {tires.map(({ label, temp, slip }) => (
          <div key={label} className={`tire-card ${getTireTempClass(temp)}`}>
            <span className="tire-label">{label}</span>
            <span className="tire-temp-val">{Math.round(temp)}°C</span>
            <span className="tire-slip-val">Slip: {slip.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
