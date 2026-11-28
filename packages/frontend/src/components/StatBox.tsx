import { CSSProperties, ReactNode } from "react";

interface StatBoxProps {
  label: string;
  value: ReactNode;
  valueStyle?: CSSProperties;
}

export function StatBox({ label, value, valueStyle }: StatBoxProps) {
  return (
    <div className="stat-box">
      <span className="stat-box-label">{label}</span>
      <span className="stat-box-value" style={valueStyle}>{value}</span>
    </div>
  );
}
