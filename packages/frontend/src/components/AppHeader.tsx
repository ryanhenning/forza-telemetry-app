interface AppHeaderProps {
  isConnected: boolean;
  useImperial: boolean;
  onUnitChange: (useImperial: boolean) => void;
}

export function AppHeader({ isConnected, useImperial, onUnitChange }: AppHeaderProps) {
  return (
    <header>
      <div className="brand">
        <h1>FORZA HUD & SCROBBLER</h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Unit Switcher */}
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "4px", display: "flex", gap: "2px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            style={{ padding: "6px 12px", fontSize: "12px" }}
            className={`tab-btn ${useImperial ? "active" : ""}`}
            onClick={() => onUnitChange(true)}
          >
            MPH
          </button>
          <button
            style={{ padding: "6px 12px", fontSize: "12px" }}
            className={`tab-btn ${!useImperial ? "active" : ""}`}
            onClick={() => onUnitChange(false)}
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
  );
}
