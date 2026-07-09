import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getVehicleDetail, getVehicleStats, getVehicleTelemetry } from "../api/vehicles";
import type { VehicleDetail as VehicleDetailType, TelemetryStats, TelemetryRecord } from "../types/vehicle";
import Gauge from "../components/Gauge";

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = Number(id);

  const [vehicle, setVehicle] = useState<VehicleDetailType | null>(null);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getVehicleDetail(vehicleId),
      getVehicleStats(vehicleId),
      getVehicleTelemetry(vehicleId, 1, 300),
    ])
      .then(([v, s, t]) => {
        setVehicle(v);
        setStats(s);
        setTelemetry(t.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [vehicleId]);

  if (loading) return <div style={{ padding: 60, color: "#6b7280", textAlign: "center" }}>Loading telemetry...</div>;
  if (!vehicle || !stats) return <div style={{ padding: 60, textAlign: "center" }}>Vehicle not found</div>;

  const chartData = telemetry.map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString(),
    speed: t.vehicle_speed ?? 0,
    rpm: t.engine_rpm ?? 0,
    temp: t.engine_coolant_temp ?? 0,
  }));

  const latest = telemetry[telemetry.length - 1];

  return (
    <div style={{ minHeight: "100vh", padding: "2.5rem 3rem", maxWidth: 1400, margin: "0 auto" }}>
      <Link to="/" style={{ color: "#0057ff", fontSize: 13, fontWeight: 600 }}>← Fleet Overview</Link>

      <header style={{ margin: "1rem 0 2rem" }}>
        <h1 style={{ fontSize: 26 }}>{vehicle.vehicle_code}</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
          {vehicle.total_records.toLocaleString()} data points recorded
        </p>
      </header>

      <div style={{
        display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap",
        background: "#fff", border: "1px solid #e4e7eb", borderRadius: 14,
        padding: "28px 16px", marginBottom: 24, boxShadow: "var(--shadow-sm)",
      }}>
        <Gauge value={latest?.vehicle_speed ?? 0} max={200} label="Speed" unit="km/h" color="#0057ff" />
        <Gauge value={latest?.engine_rpm ?? 0} max={6000} label="RPM" unit="rpm" color="#d97706" />
        <Gauge value={latest?.engine_coolant_temp ?? 0} max={120} label="Coolant" unit="°C" color="#dc2626" />
        <Gauge value={latest?.throttle_position ?? 0} max={100} label="Throttle" unit="%" color="#059669" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatBox label="Avg Speed" value={`${stats.avg_speed ?? "-"}`} unit="km/h" />
        <StatBox label="Max Speed" value={`${stats.max_speed ?? "-"}`} unit="km/h" />
        <StatBox label="Avg RPM" value={`${stats.avg_rpm ?? "-"}`} unit="rpm" />
        <StatBox label="Max RPM" value={`${stats.max_rpm ?? "-"}`} unit="rpm" />
        <StatBox label="Avg Temp" value={`${stats.avg_coolant_temp ?? "-"}`} unit="°C" />
        <StatBox label="Max Temp" value={`${stats.max_coolant_temp ?? "-"}`} unit="°C" />
      </div>

      <ChartPanel title="Vehicle Speed" color="#0057ff" dataKey="speed" data={chartData} unit="km/h" />
      <ChartPanel title="Engine RPM" color="#d97706" dataKey="rpm" data={chartData} unit="rpm" />
      <ChartPanel title="Coolant Temperature" color="#dc2626" dataKey="temp" data={chartData} unit="°C" />
    </div>
  );
}

function StatBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7eb", borderRadius: 10, padding: 14, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: 4, color: "#14171f" }}>
        {value} <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}>{unit}</span>
      </div>
    </div>
  );
}

function ChartPanel({ title, color, dataKey, data, unit }: {
  title: string; color: string; dataKey: string; data: any[]; unit: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7eb", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} interval={Math.floor(data.length / 6)} />
          <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e4e7eb", borderRadius: 8, fontSize: 12, boxShadow: "var(--shadow-md)" }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}