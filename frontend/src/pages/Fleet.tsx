import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { useFleetHealth, getBand, BAND_COLOR } from "../hooks/useFleetHealth";

export default function Fleet() {
  const { vehicles, loading, error } = useFleetHealth();
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");

  const filtered = vehicles
    .filter((v) => query === "" || v.vehicle_code.toLowerCase().includes(query.toLowerCase()))
    .filter((v) => band === "all" || getBand(v.healthScore ?? 100) === band)
    .sort((a, b) => (a.healthScore ?? 100) - (b.healthScore ?? 100));

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#0f1117" }}>Fleet</h1>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 20px" }}>
        {vehicles.length} vehicles · sorted by health score, lowest first
      </p>

      {error && (
        <div style={{ background: "#fdeaea", border: "1px solid #f5c2c2", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "critical", "fair", "good", "excellent"].map((b) => (
          <button
            key={b}
            onClick={() => setBand(b)}
            style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 700,
              border: band === b ? "none" : "1px solid #e4e7eb",
              background: band === b ? "#0f1117" : "#fff",
              color: band === b ? "#fff" : "#4b5563", cursor: "pointer", textTransform: "capitalize",
            }}
          >
            {b}
          </button>
        ))}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vehicle code..."
            style={{ padding: "8px 12px 8px 34px", borderRadius: 10, border: "1px solid #e4e7eb", fontSize: 12.5, width: 240, outline: "none" }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading fleet...</div>
      ) : vehicles.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", background: "#fff", border: "1px dashed #e4e7eb", borderRadius: 16 }}>
          No vehicle data returned from the backend.
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 16, overflow: "hidden" }}>
          {filtered.map((v, i) => {
            const score = v.healthScore ?? 100;
            const b = getBand(score);
            return (
              <Link
                key={v.id}
                to={`/vehicles/${v.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                  borderBottom: i === filtered.length - 1 ? "none" : "1px solid #e8eaef",
                  textDecoration: "none", color: "inherit",
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: BAND_COLOR[b], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{v.vehicle_code}</div>
                  {v.anomalyCount !== null && (
                    <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{v.anomalyCount} anomalies detected</div>
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: BAND_COLOR[b], width: 40, textAlign: "right" }}>
                  {score.toFixed(0)}
                </div>
                <ChevronRight size={16} color="#c4c9d4" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}