import { useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, Gauge, Layers } from "lucide-react";

// ---- Mock data shaped like the real API response will be ----
// Replace with a fetch to /analytics/fleet-insights when the endpoint exists.
const HEALTH_DISTRIBUTION = [
  { range: "90-100", label: "Excellent", count: 34, color: "#059669" },
  { range: "75-89", label: "Good", count: 28, color: "#0052ff" },
  { range: "60-74", label: "Fair", count: 12, color: "#d97706" },
  { range: "0-59", label: "Critical", count: 7, color: "#dc2626" },
];

const ANOMALY_TREND = [
  { day: "Mon", value: 142 },
  { day: "Tue", value: 168 },
  { day: "Wed", value: 131 },
  { day: "Thu", value: 205 },
  { day: "Fri", value: 189 },
  { day: "Sat", value: 97 },
  { day: "Sun", value: 88 },
];

const VEHICLES_HEATMAP = Array.from({ length: 81 }, (_, i) => ({
  id: i,
  score: Math.round(40 + Math.random() * 60),
}));

function scoreColor(score: number) {
  if (score >= 90) return "#059669";
  if (score >= 75) return "#0052ff";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

function BarChartMini({ data }: { data: typeof HEALTH_DISTRIBUTION }) {
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 20, height: 180, padding: "0 8px" }}>
      {data.map((d) => (
        <div key={d.range} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f1117" }}>{d.count}</div>
          <div
            style={{
              width: "100%",
              maxWidth: 56,
              height: `${(d.count / max) * 130}px`,
              background: d.color,
              borderRadius: "6px 6px 2px 2px",
            }}
          />
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{d.range}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function LineChartMini({ data }: { data: typeof ANOMALY_TREND }) {
  const width = 560;
  const height = 160;
  const padX = 24;
  const padY = 16;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (d.value - min) / (max - min || 1)) * (height - padY * 2);
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${path} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="lineFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0052ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0052ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#lineFade)" />
      <path d={path} fill="none" stroke="#0052ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.day}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#0052ff" strokeWidth="2" />
          <text x={p.x} y={height - 2} textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight={600}>
            {p.day}
          </text>
        </g>
      ))}
    </svg>
  );
}

function StatCard({
  label, value, delta, deltaPositive, icon,
}: { label: string; value: string; delta: string; deltaPositive: boolean; icon: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e8eaef", borderRadius: 14,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.4 }}>{label}</span>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: "#eff4ff",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#0052ff",
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#0f1117", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{
        display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700,
        color: deltaPositive ? "#059669" : "#dc2626",
      }}>
        {deltaPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {delta}
      </div>
    </div>
  );
}

export default function Analytics() {
  const totalVehicles = VEHICLES_HEATMAP.length;
  const avgScore = useMemo(
    () => Math.round(VEHICLES_HEATMAP.reduce((s, v) => s + v.score, 0) / totalVehicles),
    [totalVehicles]
  );

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 1180 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1117", margin: 0, letterSpacing: "-0.01em" }}>
          Fleet Analytics
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
          Aggregated health, anomaly, and model performance across the entire fleet
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="FLEET AVG HEALTH" value={`${avgScore}`} delta="+2.1 vs last week" deltaPositive icon={<Gauge size={15} />} />
        <StatCard label="CRITICAL VEHICLES" value="7" delta="-3 vs last week" deltaPositive icon={<Activity size={15} />} />
        <StatCard label="ANOMALIES (7D)" value="1,020" delta="+12.4%" deltaPositive={false} icon={<Layers size={15} />} />
        <StatCard label="RECORDS PROCESSED" value="3.7M" delta="+4.2%" deltaPositive icon={<TrendingUp size={15} />} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1117", marginBottom: 4 }}>Health Score Distribution</div>
          <div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 12 }}>Vehicle count per health band</div>
          <BarChartMini data={HEALTH_DISTRIBUTION} />
        </div>
        <div style={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1117", marginBottom: 4 }}>Anomalies Detected — Last 7 Days</div>
          <div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 12 }}>Isolation Forest v1 · fleet-wide</div>
          <LineChartMini data={ANOMALY_TREND} />
        </div>
      </div>

      {/* Heatmap strip — signature element */}
      <div style={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 14, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1117" }}>Fleet Health Map</div>
            <div style={{ fontSize: 11.5, color: "#9ca3af" }}>Every vehicle, one tile — sorted by score</div>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 10.5, color: "#6b7280", fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#059669", display: "inline-block" }} /> Excellent
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#0052ff", display: "inline-block" }} /> Good
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#d97706", display: "inline-block" }} /> Fair
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#dc2626", display: "inline-block" }} /> Critical
            </span>
          </div>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(27, 1fr)", gap: 5, marginTop: 16,
        }}>
          {[...VEHICLES_HEATMAP].sort((a, b) => b.score - a.score).map((v) => (
            <div
              key={v.id}
              title={`Score: ${v.score}`}
              style={{
                aspectRatio: "1", borderRadius: 4, background: scoreColor(v.score),
                opacity: 0.85, cursor: "pointer", transition: "opacity 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "scale(1)"; }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}