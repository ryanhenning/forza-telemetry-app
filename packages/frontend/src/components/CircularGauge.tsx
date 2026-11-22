const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CircularGaugeProps {
  /** Fill level, 0..100. Values outside the range are clamped. */
  percent: number;
  /** The number shown in the middle of the gauge. */
  value: number;
  unit: string;
  color: string;
  redline?: boolean;
}

export function CircularGauge({ percent, value, unit, color, redline = false }: CircularGaugeProps) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="gauge-wrapper">
      <svg className="circular-gauge">
        <circle className="bg-ring" cx="100" cy="100" r={RADIUS} />
        <circle
          className="fill-ring"
          cx="100"
          cy="100"
          r={RADIUS}
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>
      <div className="gauge-center-text">
        <span className={`gauge-value ${redline ? "redline" : ""}`} style={{ color }}>
          {Math.round(value)}
        </span>
        <span className="gauge-unit">{unit}</span>
      </div>
    </div>
  );
}
