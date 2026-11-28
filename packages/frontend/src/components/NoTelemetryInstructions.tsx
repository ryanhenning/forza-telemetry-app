export function NoTelemetryInstructions() {
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
