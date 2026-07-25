import { useState } from "react";
import { AlertTriangle, AlertCircle, Search, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useFleetHealth } from "../hooks/useFleetHealth";

export default function Alerts() {
  const { vehicles, loading, error } = useFleetHealth();
  const [filter, setFilter] = useState<"all" | "critical" | "warning">("all");
  const [query, setQuery] = useState("");

  const flagged = vehicles
    .filter((v) => (v.healthScore ?? 100) < 75)
    .sort((a, b) => (a.healthScore ?? 100) - (b.healthScore ?? 100));

  const criticalCount = flagged.filter((v) => (v.healthScore ?? 100) < 50).length;
  const warningCount = flagged.filter((v) => (v.healthScore ?? 100) >= 50 && (v.healthScore ?? 100) < 75).length;

  const filtered = flagged
    .filter((v) => {
      const score = v.healthScore ?? 100;
      if (filter === "critical") return score < 50;
      if (filter === "warning") return score >= 50 && score < 75;
      return true;
    })
    .filter((v) => query.trim() === "" || v.vehicle_code.toLowerCase().includes(query.toLowerCase()));

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>Loading alerts...</div>;

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 1000 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1117", margin: 0, letterSpacing: "-0.01em" }}>Alerts</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
          {flagged.length} vehicles flagged · same scoring as Overview
        </p>
      </div>

      {error && (
        <div style={{ background: "#fdeaea", border: "1px solid #f5c2c2", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {(["all", "critical", "warning"] as const).map((f) => {
          const isActive = filter === f;
          const count = f === "all" ? flagged.length : f === "critical" ? criticalCount : warningCount;
          const color = f === "critical" ? "#dc2626" : f === "warning" ? "#d97706" : "#0f1117";
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 700,
                border: isActive ? "none" : "1px solid #e4e7eb",
                background: isActive ? color : "#fff",
                color: isActive ? "#fff" : "#4b5563",
                cursor: "pointer", textTransform: "capitalize",
              }}
            >
              {f}
              <span style={{ fontSize: 11, opacity: isActive ? 0.85 : 0.6, fontWeight: 700 }}>{count}</span>
            </button>
          );
        })}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vehicle..."
            style={{ padding: "8px 12px 8px 34px", borderRadius: 10, border: "1px solid #e4e7eb", fontSize: 12.5, width: 220, outline: "none" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", background: "#fff", border: "1px dashed #e4e7eb", borderRadius: 14, fontSize: 13 }}>
            No alerts match this filter.
          </div>
        )}
        {filtered.map((v) => {
          const score = v.healthScore ?? 100;
          const critical = score < 50;
          const color = critical ? "#dc2626" : "#d97706";
          return (
            <Link
              key={v.id}
              to={`/vehicles/${v.id}`}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#fff", border: "1px solid #e8eaef", borderLeft: `3px solid ${color}`,
                borderRadius: 12, padding: "14px 16px", textDecoration: "none",
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: critical ? "#fef2f2" : "#fffbeb", color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {critical ? <AlertTriangle size={16} /> : <AlertCircle size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f1117" }}>
                    {critical ? "Critical health score" : "Health score needs monitoring"}
                  </span>
                  {critical && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", display: "inline-block", animation: "pulse 1.6s infinite" }} />
                  )}
                </div>
                {v.anomalyCount !== null && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{v.anomalyCount} anomalies detected</div>
                )}
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, fontFamily: "var(--font-mono)" }}>{v.vehicle_code}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color }}>{score.toFixed(0)}</div>
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