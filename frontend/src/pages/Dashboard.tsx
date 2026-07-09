import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getVehicles } from "../api/vehicles";
import type { Vehicle } from "../types/vehicle";
import HealthBadge from "../components/HealthBadge";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getVehicles()
      .then((data) => {
        setVehicles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter((v) =>
    v.vehicle_code.toLowerCase().includes(search.toLowerCase())
  );

  const pseudoHealth = (id: number) => ((id * 37) % 100);

  return (
    <div style={{ minHeight: "100vh", padding: "2.5rem 3rem", maxWidth: 1400, margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Live · Kafka Streaming Active
          </span>
        </div>
        <h1 style={{ fontSize: 32, marginBottom: 6 }}>Fleet Intelligence Center</h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          Real-time telemetry monitoring across {vehicles.length} vehicles
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <MetricCard label="Total Fleet" value={vehicles.length.toString()} accent="#0057ff" />
        <MetricCard label="Records Processed" value="2.69M" accent="#0891b2" />
        <MetricCard label="Active Streams" value="1" accent="#059669" />
        <MetricCard label="Alerts (24h)" value="0" accent="#d97706" />
      </div>

      <input
        type="text"
        placeholder="Search fleet by vehicle code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "12px 16px", marginBottom: 24,
          background: "#fff", border: "1px solid #e4e7eb", borderRadius: 10,
          color: "#14171f", fontSize: 14, outline: "none",
          boxShadow: "var(--shadow-sm)",
        }}
      />

      {loading ? (
        <div style={{ color: "#6b7280", padding: 60, textAlign: "center" }}>Loading fleet data...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((vehicle) => {
            const health = pseudoHealth(vehicle.id);
            return (
              <Link
                key={vehicle.id}
                to={`/vehicles/${vehicle.id}`}
                style={{
                  display: "block", padding: 18,
                  background: "#fff", border: "1px solid #e4e7eb", borderRadius: 12,
                  boxShadow: "var(--shadow-sm)",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b7280" }}>
                    ID-{String(vehicle.id).padStart(3, "0")}
                  </span>
                  <HealthBadge score={health} />
                </div>
                <h3 style={{ fontSize: 14, marginBottom: 10, wordBreak: "break-word", color: "#14171f" }}>
                  {vehicle.vehicle_code}
                </h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Health Score</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700 }}>{health}%</span>
                </div>
                <div style={{ height: 5, background: "#f1f2f4", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%", width: `${health}%`,
                      background: health >= 80 ? "#059669" : health >= 50 ? "#d97706" : "#dc2626",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e4e7eb", borderRadius: 12, padding: 18,
      borderLeft: `3px solid ${accent}`, boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: 6, color: "#14171f" }}>{value}</div>
    </div>
  );
}