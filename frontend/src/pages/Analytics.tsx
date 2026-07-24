import { useMemo, useState } from "react";
import { Sparkles, ArrowUpRight, HeartPulse, AlertTriangle, Layers, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useFleetHealth, getBand, BAND_COLOR } from "../hooks/useFleetHealth";

type Band = "excellent" | "good" | "fair" | "critical";
const BANDS: Band[] = ["excellent", "good", "fair", "critical"];
const BAND_LABEL: Record<Band, string> = { excellent: "Excellent", good: "Good", fair: "Fair", critical: "Critical" };

const INK = "#0F172A";
const MUTE = "#64748B";
const LINE = "#E2E8F0";
const BG = "#F8FAFC";
const PRIMARY = "#2563EB";
const SUCCESS = "#10B981";
const WARNING = "#F59E0B";
const DANGER = "#EF4444";

function KpiCard({
  icon, label, value, sub, accent,
}: { icon: React.ReactNode; label: string; value: string; sub: string; accent: string }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16,
      padding: "24px 24px 22px", boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
      transition: "box-shadow 0.2s, transform 0.2s", cursor: "default",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 28px rgba(15,23,42,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.03)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: MUTE, textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {label}
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: `${accent}12`, color: accent,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: INK, letterSpacing: "-0.02em", fontFamily: "Inter, sans-serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: accent, fontWeight: 600, marginTop: 10 }}>{sub}</div>
    </div>
  );
}

export default function Analytics() {
  const { vehicles, loading, error } = useFleetHealth();
  const [barFilter, setBarFilter] = useState<"all" | Band>("all");

  const stats = useMemo(() => {
    if (!vehicles.length) return null;
    const scores = vehicles.map((v) => v.healthScore ?? 100);
    const avgHealth = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    const totalAnomalies = vehicles.reduce((s, v) => s + (v.anomalyCount ?? 0), 0);
    const bands: Record<Band, number> = { excellent: 0, good: 0, fair: 0, critical: 0 };
    for (const score of scores) bands[getBand(score)]++;
    return { avgHealth, totalAnomalies, bands };
  }, [vehicles]);

  const ranked = useMemo(
    () => [...vehicles].sort((a, b) => (a.healthScore ?? 100) - (b.healthScore ?? 100)),
    [vehicles]
  );

  const donutData = stats ? BANDS.map((b) => ({ name: BAND_LABEL[b], value: stats.bands[b], band: b })) : [];

  if (loading) {
    return (
      <div style={{ padding: "28px 32px", background: BG, minHeight: "100vh" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 140, background: "#eef1f6", borderRadius: 20, animation: "pulse 1.4s infinite" }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
      </div>
    );
  }
  if (error || !stats) {
    return <div style={{ padding: 60, textAlign: "center", color: MUTE }}>{error ?? "No fleet data available."}</div>;
  }

  const critical = ranked.filter((v) => getBand(v.healthScore ?? 100) === "critical");
  const insights = [
    critical.length > 0
      ? `${critical.length} vehicle${critical.length > 1 ? "s" : ""} require immediate maintenance — lowest is ${critical[0].vehicle_code} at ${(critical[0].healthScore ?? 0).toFixed(0)}.`
      : "No vehicles currently in the critical band.",
    `${stats.totalAnomalies.toLocaleString()} anomalies detected across ${vehicles.length} vehicles by Isolation Forest v1.`,
    `${stats.bands.excellent} vehicles (${Math.round((stats.bands.excellent / vehicles.length) * 100)}% of fleet) are scoring in the excellent range.`,
  ];

  return (
    <div style={{ padding: "32px 40px 64px", background: BG, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: PRIMARY, letterSpacing: "0.08em", textTransform: "uppercase",
          marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 16, height: 2, borderRadius: 2, background: PRIMARY }} />
          Fleet Intelligence
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: INK, margin: 0, letterSpacing: "-0.02em" }}>Fleet Analytics</h1>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <KpiCard
          icon={<HeartPulse size={20} />} label="Fleet Health Score" value={`${stats.avgHealth}`}
          sub="Average across fleet" accent={PRIMARY}
        />
        <KpiCard
          icon={<AlertTriangle size={20} />} label="Critical Vehicles" value={`${stats.bands.critical}`}
          sub={stats.bands.critical > 0 ? "Needs immediate action" : "None flagged"} accent={DANGER}
        />
        <KpiCard
          icon={<Layers size={20} />} label="Detected Anomalies" value={stats.totalAnomalies.toLocaleString()}
          sub={`Across ${vehicles.length} vehicles`} accent={WARNING}
        />
        <KpiCard
          icon={<ShieldCheck size={20} />} label="Fleet Size" value={`${vehicles.length}`}
          sub="Seat Leon · KIT dataset" accent={SUCCESS}
        />
      </div>

      {/* Distribution row: donut + AI insights */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 2 }}>Fleet health distribution</div>
          <div style={{ fontSize: 12.5, color: MUTE, marginBottom: 8 }}>{vehicles.length} vehicles by health band</div>
          <div style={{ position: "relative", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                  {donutData.map((d) => (
                    <Cell key={d.band} fill={BAND_COLOR[d.band]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [`${v} vehicles`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", pointerEvents: "none",
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: INK }}>{vehicles.length}</div>
              <div style={{ fontSize: 10.5, color: MUTE, fontWeight: 600 }}>vehicles</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12, justifyContent: "center" }}>
            {BANDS.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#334155" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: BAND_COLOR[b] }} />
                {BAND_LABEL[b]} · {stats.bands[b]}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #eff6ff, #f5f3ff)", border: `1px solid #dbeafe`,
          borderRadius: 20, padding: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #2563EB, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={17} color="#fff" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>AI insights</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {insights.map((line, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: PRIMARY, marginTop: 7, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, color: "#1e293b", lineHeight: 1.6 }}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lowest health table */}
      <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 20, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Lowest health vehicles</div>
            <div style={{ fontSize: 12.5, color: MUTE, marginTop: 2 }}>Ranked lowest score first</div>
          </div>
          <Link to="/fleet" style={{ fontSize: 12.5, fontWeight: 700, color: PRIMARY, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            View full fleet <ArrowUpRight size={13} />
          </Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: BG }}>
              {["Vehicle", "Health score", "Status", "Anomalies", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "9px 8px", fontSize: 10.5, fontWeight: 700, color: MUTE, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${LINE}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.slice(0, 6).map((v) => {
              const score = v.healthScore ?? 100;
              const band = getBand(score);
              return (
                <tr
                  key={v.id}
                  style={{ borderBottom: `1px solid ${LINE}`, transition: "background 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = BG; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "12px 8px", fontSize: 13, fontFamily: "monospace", color: INK }}>{v.vehicle_code}</td>
                  <td style={{ padding: "12px 8px", fontSize: 14, fontWeight: 700, color: BAND_COLOR[band] }}>{score.toFixed(0)}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      background: `${BAND_COLOR[band]}18`, color: BAND_COLOR[band], textTransform: "capitalize",
                    }}>
                      {BAND_LABEL[band]}
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 13, color: "#475569" }}>{v.anomalyCount ?? "—"}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <Link to={`/vehicles/${v.id}`} style={{
                      fontSize: 12, fontWeight: 700, color: PRIMARY, textDecoration: "none",
                      border: `1px solid #dbeafe`, padding: "5px 12px", borderRadius: 8,
                    }}>
                      View details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vehicles needing attention — horizontal leaderboard, not a bar wall */}
      <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>Vehicles needing attention</div>
            <div style={{ fontSize: 12.5, color: MUTE, marginTop: 2 }}>Fair and critical band, sorted lowest first</div>
          </div>
          <div style={{ display: "flex", gap: 4, background: BG, padding: 4, borderRadius: 10 }}>
            {(["all", "fair", "critical"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setBarFilter(f)}
                style={{
                  padding: "6px 13px", borderRadius: 7, fontSize: 11.5, fontWeight: 700, border: "none",
                  background: barFilter === f ? "#fff" : "transparent",
                  color: barFilter === f ? INK : MUTE,
                  boxShadow: barFilter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer", textTransform: "capitalize",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {(() => {
          const attention = ranked
            .filter((v) => getBand(v.healthScore ?? 100) !== "excellent" && getBand(v.healthScore ?? 100) !== "good")
            .filter((v) => barFilter === "all" || getBand(v.healthScore ?? 100) === barFilter);

          if (attention.length === 0) {
            return (
              <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: MUTE }}>
                No vehicles in fair or critical range.
              </div>
            );
          }

          const chartData = attention.map((v) => ({
            code: v.vehicle_code,
            score: v.healthScore ?? 100,
            anomalies: v.anomalyCount ?? 0,
            band: getBand(v.healthScore ?? 100),
          }));

          return (
            <div style={{ height: Math.max(chartData.length * 34, 100) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke={LINE} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: MUTE }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category" dataKey="code" width={190}
                    tick={{ fontSize: 11.5, fill: INK, fontFamily: "monospace" }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(37,99,235,0.06)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}>
                          <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: INK }}>{d.code}</div>
                          <div style={{ fontSize: 12, color: MUTE, marginTop: 4 }}>Score: <b style={{ color: BAND_COLOR[d.band] }}>{d.score.toFixed(0)}</b></div>
                          <div style={{ fontSize: 12, color: MUTE }}>Anomalies: {d.anomalies}</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={BAND_COLOR[d.band]} cursor="pointer" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}
      </div>
    </div>
  );
}