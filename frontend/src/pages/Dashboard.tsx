import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Car, Database, Radio, AlertTriangle, ChevronRight } from "lucide-react";
import { getVehicles, getVehicleHealthScore } from "../api/vehicles";
import type { Vehicle } from "../types/vehicle";
import HealthBadge from "../components/HealthBadge";
import Header from "../components/Header";

interface VehicleWithHealth extends Vehicle {
  healthScore: number | null;
}

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<VehicleWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getVehicles()
      .then(async (data) => {
        const withHealth = await Promise.all(
          data.map(async (v) => {
            try {
              const h = await getVehicleHealthScore(v.id);
              return { ...v, healthScore: h.health_score };
            } catch {
              return { ...v, healthScore: null };
            }
          })
        );
        setVehicles(withHealth);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch vehicles:", err);
        setErrorMsg(
          err?.code === "ERR_NETWORK"
            ? "Cannot reach API. Is the backend running on port 8000?"
            : "Failed to load fleet data."
        );
        setLoading(false);
      });
  }, []);

  const filtered = vehicles.filter((v) =>
    v.vehicle_code.toLowerCase().includes(search.toLowerCase())
  );

  const avgHealth = vehicles.length
    ? Math.round(vehicles.reduce((sum, v) => sum + (v.healthScore ?? 100), 0) / vehicles.length)
    : 0;
  const criticalCount = vehicles.filter((v) => (v.healthScore ?? 100) < 50).length;

  return (
    <div>
      <Header />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2.5rem 3rem" }}>
        <header style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: 34, marginBottom: 8 }}>Fleet Intelligence Center</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            AI-powered anomaly detection across {vehicles.length} vehicles · Isolation Forest v1
          </p>
        </header>

        {errorMsg && (
          <div style={{ background: "#fdeaea", border: "1px solid #f5c2c2", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#b91c1c", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={16} /> {errorMsg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          <MetricCard icon={<Car size={18} />} label="Total Fleet" value={vehicles.length.toString()} accent="#0052ff" />
          <MetricCard icon={<Database size={18} />} label="Fleet Avg Health" value={loading ? "-" : `${avgHealth}%`} accent="#0891b2" />
          <MetricCard icon={<Radio size={18} />} label="Active Streams" value="1" accent="#00a877" />
          <MetricCard icon={<AlertTriangle size={18} />} label="Critical Vehicles" value={loading ? "-" : criticalCount.toString()} accent="#dc2626" />
        </div>

        <div style={{ position: "relative", marginBottom: 24 }}>
          <Search size={16} color="var(--text-tertiary)" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search fleet by vehicle code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "13px 16px 13px 42px", background: "#fff", border: "1px solid var(--border-color)", borderRadius: 10, color: "var(--text-primary)", fontSize: 14, outline: "none", boxShadow: "var(--shadow-sm)", fontFamily: "var(--font-sans)" }}
          />
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 140, borderRadius: 14 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
            {filtered.map((vehicle, i) => {
              const health = vehicle.healthScore ?? 100;
              return (
                <Link
                  key={vehicle.id}
                  to={`/vehicles/${vehicle.id}`}
                  style={{ display: "block", padding: 20, background: "#fff", border: "1px solid var(--border-color)", borderRadius: 14, boxShadow: "var(--shadow-sm)", transition: "all 0.2s ease", animation: `fadeIn 0.3s ease ${i * 0.02}s both` }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "var(--accent-blue)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border-color)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Car size={18} color="var(--accent-blue)" />
                    </div>
                    <HealthBadge score={health} />
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>
                    ID-{String(vehicle.id).padStart(3, "0")}
                  </div>
                  <h3 style={{ fontSize: 14, marginBottom: 14, color: "var(--text-primary)", lineHeight: 1.4 }}>
                    {vehicle.vehicle_code}
                  </h3>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>AI Health Score</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700 }}>{health}%</span>
                  </div>
                  <div style={{ height: 5, background: "#f0f1f3", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{ height: "100%", width: `${health}%`, background: health >= 80 ? "#00a877" : health >= 50 ? "#d97706" : "#dc2626", transition: "width 0.4s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2, color: "var(--accent-blue)", fontSize: 12, fontWeight: 600 }}>
                    View diagnostics <ChevronRight size={14} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: 14, padding: 20, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${accent}14`, color: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: 4 }}>{value}</div>
      </div>
    </div>
  );
}