import { pedalPercent } from "../utils/formatters";

interface PedalInputsProps {
  accel: number;
  brake: number;
  clutch: number;
  handBrake: number;
}

export function PedalInputs({ accel, brake, clutch, handBrake }: PedalInputsProps) {
  const pedals = [
    { label: "THROTTLE", className: "throttle", value: accel },
    { label: "BRAKE", className: "brake", value: brake },
    { label: "CLUTCH", className: "clutch", value: clutch },
    { label: "HANDBRAKE", className: "handbrake", value: handBrake },
  ];

  return (
    <div className="glass-card">
      <div className="card-title">PEDAL INPUTS</div>
      <div className="inputs-container">
        {pedals.map(({ label, className, value }) => {
          const percent = pedalPercent(value);
          return (
            <div key={label} className="input-bar-group">
              <div className="input-bar-header">
                <span>{label}</span>
                <span>{Math.round(percent)}%</span>
              </div>
              <div className="input-bar-bg">
                <div className={`input-bar-fill ${className}`} style={{ width: `${percent}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
