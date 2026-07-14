import { useMemo, useState } from "react";
import { AlertTriangle, AlertCircle, Info, Search, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

type Severity = "critical" | "warning" | "info";

interface AlertItem {
  id: number;
  vehicleCode: string;
  vehicleId: number;
  severity: Severity;
  title: string;
  detail: string;
  timestamp: string;
}

// Mock data shaped like the real API response will be.
// Replace with a fetch to /alerts when the endpoint exists.
const MOCK_ALERTS: AlertItem[] = [
  { id: 1, vehicleCode: "Seat_Leon_2017-07-05_RT_S", vehicleId: 12, severity: "critical", title: "Coolant temperature anomaly", detail: "Sustained readings above 94°C detected over 3 consecutive trips.", timestamp: "12 min ago" },
  { id: 2, vehicleCode: "VW_Golf_2019-03-11_HD_A", vehicleId: 8, severity: "critical", title: "Anomaly rate spike", detail: "Anomaly rate jumped from 0.3% to 1.8% in the last 24 hours.", timestamp: "38 min ago" },
  { id: 3, vehicleCode: "Renault_Clio_2020-01-22_FT_B", vehicleId: 34, severity: "warning", title: "Irregular RPM pattern", detail: "Idle RPM fluctuating outside the normal 700-900 band.", timestamp: "1h 14m ago" },
  { id: 4, vehicleCode: "Peugeot_308_2018-09-02_RT_C", vehicleId: 21, severity: "warning", title: "Throttle response drift", detail: "Response delay increased ~15% versus 30-day baseline.", timestamp: "2h 05m ago" },
  { id: 5, vehicleCode: "Seat_Ibiza_2021-05-17_HD_D", vehicleId: 45, severity: "info", title: "Scheduled telemetry gap", detail: "No data received for 40 minutes — likely garage downtime.", timestamp: "4h 22m ago" },
  { id: 6, vehicleCode: "Dacia_Sandero_2016-11-30_FT_E", vehicleId: 19, severity: "info", title: "Health score recalculated", detail: "Score updated from 91 to 89 after nightly batch scoring.", timestamp: "6h 40m ago" },
];

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  critical: { label: "Critical", color: "#dc2626", bg: "#fef2f2", icon: <AlertTriangle size={14} /> },
  warning: { label: "Warning", color: "#d97706", bg: "#fffbeb", icon: <AlertCircle size={14} /> },
  info: { label: "Info", color: "#0052ff", bg: "#eff4ff", icon: <Info size={14} /> },
};

export default function Alerts() {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => ({
    critical: MOCK_ALERTS.filter((a) => a.severity === "critical").length,
    warning: MOCK_ALERTS.filter((a) => a.severity === "warning").length,
    info: MOCK_ALERTS.filter((a) => a.severity === "info").length,
  }), []);

  const filtered = MOCK_ALERTS.filter((a) => {
    const matchesSeverity = filter === "all" || a.severity === filter;
    const matchesQuery = query.trim() === "" ||
      a.vehicleCode.toLowerCase().includes(query.toLowerCase()) ||
      a.title.toLowerCase().includes(query.toLowerCase());
    return matchesSeverity && matchesQuery;
  });

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 1000 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1117", margin: 0, letterSpacing: "-0.01em" }}>
          Alerts
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
          Live anomalies and health events across the fleet
        </p>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {(["all", "critical", "warning", "info"] as const).map((f) => {
          const isActive = filter === f;
          const cfg = f !== "all" ? SEVERITY_CONFIG[f] : null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 700,
                border: isActive ? "1px solid transparent" : "1px solid #e4e7eb",
                background: isActive ? (cfg ? cfg.color : "#0f1117") : "#fff",
                color: isActive ? "#fff" : "#4b5563",
                cursor: "pointer",
              }}
            >
              {cfg?.icon}
              {f === "all" ? "All" : cfg!.label}
              <span style={{
                fontSize: 11, opacity: isActive ? 0.85 : 0.6, fontWeight: 700,
              }}>
                {f === "all" ? MOCK_ALERTS.length : counts[f]}
              </span>
            </button>
          );
        })}

        <div style={{ position: "relative", marginLeft: "auto" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vehicle or alert..."
            style={{
              padding: "8px 12px 8px 34px", borderRadius: 10, border: "1px solid #e4e7eb",
              fontSize: 12.5, width: 220, outline: "none",
            }}
          />
        </div>
      </div>

      {/* Alert list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: "48px 0", color: "#9ca3af",
            background: "#fff", border: "1px dashed #e4e7eb", borderRadius: 14, fontSize: 13,
          }}>
            No alerts match this filter.
          </div>
        )}

        {filtered.map((alert) => {
          const cfg = SEVERITY_CONFIG[alert.severity];
          return (
            <Link
              key={alert.id}
              to={`/vehicles/${alert.vehicleId}`}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#fff", border: "1px solid #e8eaef", borderLeft: `3px solid ${cfg.color}`,
                borderRadius: 12, padding: "14px 16px", textDecoration: "none",
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: cfg.bg, color: cfg.color,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {cfg.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f1117" }}>{alert.title}</span>
                  {alert.severity === "critical" && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#dc2626",
                      display: "inline-block", animation: "pulse 1.6s infinite",
                    }} />
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{alert.detail}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                  {alert.vehicleCode}
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{alert.timestamp}</div>
              </div>
              <ChevronRight size={16} color="#c4c9d4" />
            </Link>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
          70% { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  );
}