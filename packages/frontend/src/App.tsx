import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { CareerDashboard } from "./components/CareerDashboard";
import { LiveHUD } from "./components/LiveHUD";
import { ActiveSessionCard, LastSessionCard } from "./components/SessionCards";
import { useSessionTracker } from "./hooks/useSessionTracker";
import { useTelemetry } from "./hooks/useTelemetry";
import "./App.css";

type Tab = "live" | "career";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [useImperial, setUseImperial] = useState(true);

  const { telemetry, isConnected } = useTelemetry();
  const {
    liveSessionActive,
    activeSession,
    recentSession,
    historicalSessions,
    dismissRecentSession,
    clearHistory,
  } = useSessionTracker();

  return (
    <div className="app-container">
      <AppHeader
        isConnected={isConnected}
        useImperial={useImperial}
        onUnitChange={setUseImperial}
      />

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

      <div className="main-content">
        {activeTab === "live" && (
          <div className="panel">
            {liveSessionActive && activeSession && (
              <ActiveSessionCard session={activeSession} useImperial={useImperial} />
            )}
            {recentSession && !liveSessionActive && (
              <LastSessionCard
                session={recentSession}
                useImperial={useImperial}
                onDismiss={dismissRecentSession}
              />
            )}
            <LiveHUD telemetry={telemetry} isConnected={isConnected} useImperial={useImperial} />
          </div>
        )}

        {activeTab === "career" && (
          <CareerDashboard
            sessions={historicalSessions}
            useImperial={useImperial}
            onClearHistory={clearHistory}
          />
        )}
      </div>
    </div>
  );
}

export default App;
