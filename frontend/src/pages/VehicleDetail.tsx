import AIAssistant from "../components/AIAssistant";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { getVehicleDetail, getVehicleStats, getVehicleTelemetry, getVehicleHealthScore } from "../api/vehicles";
import type { VehicleDetail as VehicleDetailType, TelemetryStats, TelemetryRecord, HealthScore } from "../types/vehicle";
import Gauge from "../components/Gauge";


export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = Number(id);

  const [vehicle, setVehicle] = useState<VehicleDetailType | null>(null);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getVehicleDetail(vehicleId),
      getVehicleStats(vehicleId),
      getVehicleTelemetry(vehicleId, 3, 300),
      getVehicleHealthScore(vehicleId),
    ])
      .then(([v, s, t, h]) => {
        setVehicle(v);
        setStats(s);
        setTelemetry(t.data);
        setHealth(h);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [vehicleId]);

  if (loading) {
    return (
      <div style={{ padding: 100, textAlign: "center", color: "#9ca3af", fontSize: 14, fontWeight: 500 }}>
        Loading telemetry data...
      </div>
    );
  }
  if (!vehicle || !stats) {
    return <div style={{ padding: 100, textAlign: "center", color: "#9ca3af" }}>Vehicle not found</div>;
  }

  const chartData = telemetry.map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString(),
    speed: t.vehicle_speed ?? 0,
    rpm: t.engine_rpm ?? 0,
    temp: t.engine_coolant_temp ?? 0,
    isAnomaly: t.is_anomaly ?? false,
  }));

  const latest = telemetry[telemetry.length - 1];

  const healthColor =
    health && health.health_score >= 70 ? "#059669" :
    health && health.health_score >= 50 ? "#d97706" :
    "#dc2626";

  const healthLabel =
    health && health.health_score >= 70 ? "Healthy" :
    health && health.health_score >= 50 ? "Needs Attention" :
    "Critical";

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", padding: "2.5rem 3rem 4rem" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        <Link
          to="/"
          style={{
            color: "#0057ff", fontSize: 13, fontWeight: 600, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20,
          }}
        >
          ← Fleet Overview
        </Link>

        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0f1117", letterSpacing: -0.5, margin: 0 }}>
              {vehicle.vehicle_code}
            </h1>
            <p style={{ color: "#8a8f9c", fontSize: 13.5, marginTop: 6, fontWeight: 500 }}>
              {vehicle.model ?? "Unknown model"} · {vehicle.total_records.toLocaleString()} data points recorded
            </p>
          </div>
          {health && (
            <span style={{
              background: `${healthColor}14`, color: healthColor, fontSize: 12.5, fontWeight: 700,
              padding: "8px 16px", borderRadius: 999, border: `1px solid ${healthColor}33`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: healthColor, boxShadow: `0 0 0 4px ${healthColor}22` }} />
              {healthLabel}
            </span>
          )}
        </header>

        {/* ── AI Health Score Panel ── */}
        {health && (
          <section style={{
            background: "linear-gradient(135deg, #ffffff 0%, #fbfcfe 100%)",
            border: "1px solid #e8eaef", borderRadius: 20, padding: "30px 34px",
            marginBottom: 26, boxShadow: "0 4px 24px rgba(15, 17, 23, 0.05)",
            display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap",
          }}>
            <HealthRing score={health.health_score} color={healthColor} />

            <div style={{ height: 64, width: 1, background: "#e8eaef" }} />

            <div style={{ display: "flex", gap: 44, flexWrap: "wrap", flex: 1 }}>
              <MiniStat label="Anomalies Detected" value={health.anomaly_count.toLocaleString()} accent="#dc2626" />
              <MiniStat label="Anomaly Rate" value={`${health.anomaly_rate.toFixed(2)}%`} accent="#d97706" />
              <MiniStat label="Records Scored" value={health.total_records.toLocaleString()} accent="#0057ff" />
              <MiniStat
                label="Avg Anomaly Score"
                value={health.avg_anomaly_score !== null ? health.avg_anomaly_score.toFixed(3) : "-"}
                accent="#6b7280"
              />
            </div>

            <div style={{
              background: "#0f1117", borderRadius: 14, padding: "14px 20px",
              display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2,
            }}>
              <span style={{ fontSize: 9.5, color: "#9ca3af", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.8 }}>
                ML Model
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-mono)" }}>
                Isolation Forest v1
              </span>
            </div>
          </section>
        )}
        <AIAssistant vehicleId={vehicleId} />

        {/* ── Live Gauges ── */}
        <section style={{
          display: "flex", gap: 36, justifyContent: "center", flexWrap: "wrap",
          background: "#fff", border: "1px solid #e8eaef", borderRadius: 20,
          padding: "32px 20px", marginBottom: 26, boxShadow: "0 2px 12px rgba(15, 17, 23, 0.04)",
        }}>
          <Gauge value={latest?.vehicle_speed ?? 0} max={200} label="Speed" unit="km/h" color="#0057ff" />
          <Gauge value={latest?.engine_rpm ?? 0} max={6000} label="RPM" unit="rpm" color="#d97706" />
          <Gauge value={latest?.engine_coolant_temp ?? 0} max={120} label="Coolant" unit="°C" color="#dc2626" />
          <Gauge value={latest?.throttle_position ?? 0} max={100} label="Throttle" unit="%" color="#059669" />
        </section>

        {/* ── Stat Grid ── */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 26 }}>
          <StatBox label="Avg Speed" value={`${stats.avg_speed ?? "-"}`} unit="km/h" />
          <StatBox label="Max Speed" value={`${stats.max_speed ?? "-"}`} unit="km/h" />
          <StatBox label="Avg RPM" value={`${stats.avg_rpm ?? "-"}`} unit="rpm" />
          <StatBox label="Max RPM" value={`${stats.max_rpm ?? "-"}`} unit="rpm" />
          <StatBox label="Avg Temp" value={`${stats.avg_coolant_temp ?? "-"}`} unit="°C" />
          <StatBox label="Max Temp" value={`${stats.max_coolant_temp ?? "-"}`} unit="°C" />
        </section>

        {/* ── Charts ── */}
        <ChartPanel title="Vehicle Speed" color="#0057ff" dataKey="speed" data={chartData} unit="km/h" />
        <ChartPanel title="Engine RPM" color="#d97706" dataKey="rpm" data={chartData} unit="rpm" />
        <ChartPanel title="Coolant Temperature" color="#dc2626" dataKey="temp" data={chartData} unit="°C" />
      </div>
    </div>
  );
}

function HealthRing({ score, color }: { score: number; color: string }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 116, height: 116, flexShrink: 0 }}>
      <svg width={116} height={116} viewBox="0 0 116 116" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={58} cy={58} r={radius} fill="none" stroke="#eef0f4" strokeWidth={10} />
        <circle
          cx={58} cy={58} r={radius} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#0f1117", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
          {score.toFixed(0)}
        </span>
        <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, marginTop: 2 }}>HEALTH</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "#9ca3af", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, fontFamily: "var(--font-mono)", color: accent }}>
        {value}
      </div>
    </div>
  );
}

function StatBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e8eaef", borderRadius: 14, padding: "16px 18px",
      boxShadow: "0 2px 8px rgba(15, 17, 23, 0.03)",
    }}>
      <div style={{ fontSize: 10.5, color: "#9ca3af", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: 6, color: "#0f1117" }}>
        {value} <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{unit}</span>
      </div>
    </div>
  );
}

function ChartPanel({ title, color, dataKey, data, unit }: {
  title: string; color: string; dataKey: string; data: any[]; unit: string;
}) {
  const anomalyPoints = data
    .map((d, i) => ({ ...d, index: i }))
    .filter((d) => d.isAnomaly);

  return (
    <div style={{
      background: "#fff", border: "1px solid #e8eaef", borderRadius: 18, padding: "24px 26px",
      marginBottom: 18, boxShadow: "0 2px 12px rgba(15, 17, 23, 0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: "#0f1117" }}>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {anomalyPoints.length > 0 && (
            <span style={{
              fontSize: 11.5, color: "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
              background: "#fef2f2", padding: "4px 10px", borderRadius: 999,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
              {anomalyPoints.length} anomal{anomalyPoints.length > 1 ? "ies" : "y"}
            </span>
          )}
          <span style={{ fontSize: 11.5, color: "#9ca3af", fontWeight: 600 }}>{unit}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" vertical={false} />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#9ca3af" }} interval={Math.floor(data.length / 6)} axisLine={{ stroke: "#e8eaef" }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 16px rgba(15,17,23,0.08)" }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          {anomalyPoints.map((p) => (
            <ReferenceDot
              key={p.index}
              x={p.time}
              y={p[dataKey]}
              r={5}
              fill="#dc2626"
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}