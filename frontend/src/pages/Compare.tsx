import { useState, useEffect, useMemo } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { useFleetHealth, getBand, BAND_COLOR } from "../hooks/useFleetHealth";
import { getVehicleStats, getAnomalyCauses, type AnomalyCause } from "../api/vehicles";
import type { TelemetryStats } from "../types/vehicle";

interface ComparedVehicle {
  id: number;
  vehicle_code: string;
  healthScore: number | null;
  anomalyCount: number | null;
  anomalyRate: number | null;
  stats: TelemetryStats | null;
  topCause: AnomalyCause | null;
}

const MAX_COMPARE = 3;
const MONO = "var(--font-mono, monospace)";

export default function Compare() {
  const { vehicles, loading: fleetLoading } = useFleetHealth();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [compared, setCompared] = useState<Record<number, ComparedVehicle>>({});
  const [loadingDetail, setLoadingDetail] = useState<Set<number>>(new Set());

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return vehicles
      .filter((v) => v.vehicle_code.toLowerCase().includes(query.toLowerCase()))
      .filter((v) => !selectedIds.includes(v.id))
      .slice(0, 6);
  }, [query, vehicles, selectedIds]);

  useEffect(() => {
    selectedIds.forEach((id) => {
      if (compared[id] || loadingDetail.has(id)) return;
      const vehicle = vehicles.find((v) => v.id === id);
      if (!vehicle) return;

      setLoadingDetail((prev) => new Set(prev).add(id));

      Promise.all([
        getVehicleStats(id).catch(() => null),
        getAnomalyCauses(id).catch(() => []),
      ]).then(([stats, causes]) => {
        setCompared((prev) => ({
          ...prev,
          [id]: {
            id,
            vehicle_code: vehicle.vehicle_code,
            healthScore: vehicle.healthScore,
            anomalyCount: vehicle.anomalyCount,
            anomalyRate: vehicle.anomalyRate,
            stats,
            topCause: causes[0] ?? null,
          },
        }));
        setLoadingDetail((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, vehicles]);

  const addVehicle = (id: number) => {
    if (selectedIds.length >= MAX_COMPARE) return;
    setSelectedIds((prev) => [...prev, id]);
    setQuery("");
  };

  const removeVehicle = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setCompared((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const rows: { label: string; get: (c: ComparedVehicle) => string; highlight?: (c: ComparedVehicle) => string }[] = [
    {
      label: "Health score",
      get: (c) => c.healthScore !== null ? c.healthScore.toFixed(0) : "—",
      highlight: (c) => c.healthScore !== null ? BAND_COLOR[getBand(c.healthScore)] : "#9ca3af",
    },
    { label: "Anomalies detected", get: (c) => c.anomalyCount !== null ? c.anomalyCount.toLocaleString() : "—" },
    { label: "Anomaly rate", get: (c) => c.anomalyRate !== null ? `${c.anomalyRate.toFixed(2)}%` : "—" },
    { label: "Primary factor", get: (c) => c.topCause ? `${c.topCause.sensor_label} · ${c.topCause.deviation.toFixed(1)}σ` : "—" },
    { label: "Avg speed", get: (c) => c.stats?.avg_speed !== undefined && c.stats?.avg_speed !== null ? `${c.stats.avg_speed} km/h` : "—" },
    { label: "Max speed", get: (c) => c.stats?.max_speed !== undefined && c.stats?.max_speed !== null ? `${c.stats.max_speed} km/h` : "—" },
    { label: "Avg RPM", get: (c) => c.stats?.avg_rpm !== undefined && c.stats?.avg_rpm !== null ? `${c.stats.avg_rpm}` : "—" },
    { label: "Avg coolant temp", get: (c) => c.stats?.avg_coolant_temp !== undefined && c.stats?.avg_coolant_temp !== null ? `${c.stats.avg_coolant_temp}°C` : "—" },
  ];

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#0f1117" }}>Compare Vehicles</h1>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 20px" }}>
        Select up to {MAX_COMPARE} vehicles to compare side by side
      </p>

      {/* Search + selected chips */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {selectedIds.map((id) => {
            const c = compared[id];
            const vehicle = vehicles.find((v) => v.id === id);
            return (
              <span key={id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 6px 6px 12px",
                background: "#fff", border: "1px solid #e4e7eb", borderRadius: 20, fontSize: 12.5,
                fontFamily: MONO, fontWeight: 600,
              }}>
                {vehicle?.vehicle_code ?? `Vehicle ${id}`}
                {c && (
                  <span style={{ color: BAND_COLOR[getBand(c.healthScore ?? 100)], fontWeight: 700 }}>
                    {c.healthScore?.toFixed(0)}
                  </span>
                )}
                <button
                  onClick={() => removeVehicle(id)}
                  style={{ border: "none", background: "#f1f2f5", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <X size={12} color="#6b7280" />
                </button>
              </span>
            );
          })}
        </div>

        {selectedIds.length < MAX_COMPARE && (
          <div style={{ position: "relative", maxWidth: 360 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={fleetLoading ? "Loading fleet..." : "Search vehicle to add..."}
              disabled={fleetLoading}
              style={{ padding: "9px 12px 9px 34px", borderRadius: 10, border: "1px solid #e4e7eb", fontSize: 13, width: "100%", outline: "none" }}
            />
            {searchResults.length > 0 && (
              <div style={{
                position: "absolute", top: "110%", left: 0, right: 0, background: "#fff",
                border: "1px solid #e4e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(15,17,23,0.1)",
                zIndex: 10, overflow: "hidden",
              }}>
                {searchResults.map((v) => {
                  const band = getBand(v.healthScore ?? 100);
                  return (
                    <button
                      key={v.id}
                      onClick={() => addVehicle(v.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "10px 14px", border: "none", background: "none",
                        cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f1f2f5",
                      }}
                    >
                      <span style={{ fontSize: 12.5, fontFamily: MONO }}>{v.vehicle_code}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: BAND_COLOR[band] }}>
                        {(v.healthScore ?? 100).toFixed(0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison table */}
      {selectedIds.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", background: "#fff", border: "1px dashed #e4e7eb", borderRadius: 16 }}>
          Search and select vehicles above to compare them.
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${selectedIds.length}, 1fr)` }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8eaef", background: "#fafbfc" }} />
            {selectedIds.map((id) => {
              const vehicle = vehicles.find((v) => v.id === id);
              return (
                <div key={id} style={{
                  padding: "14px 16px", borderBottom: "1px solid #e8eaef", background: "#fafbfc",
                  borderLeft: "1px solid #f1f2f5",
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {vehicle?.vehicle_code}
                  </div>
                </div>
              );
            })}
          </div>

          {rows.map((row, i) => (
            <div key={row.label} style={{
              display: "grid", gridTemplateColumns: `180px repeat(${selectedIds.length}, 1fr)`,
              borderBottom: i === rows.length - 1 ? "none" : "1px solid #f1f2f5",
            }}>
              <div style={{ padding: "13px 20px", fontSize: 12.5, fontWeight: 600, color: "#6b7280" }}>
                {row.label}
              </div>
              {selectedIds.map((id) => {
                const c = compared[id];
                const isLoading = loadingDetail.has(id) || !c;
                return (
                  <div key={id} style={{
                    padding: "13px 16px", borderLeft: "1px solid #f1f2f5",
                    fontSize: 13, fontWeight: 600, fontFamily: MONO,
                    color: c && row.highlight ? row.highlight(c) : "#0f1117",
                  }}>
                    {isLoading ? <span style={{ color: "#c4c9d4" }}>…</span> : row.get(c)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {selectedIds.map((id) => (
            <a key={id} href={`/vehicles/${id}`} style={{
              fontSize: 12.5, fontWeight: 700, color: "#0052ff", textDecoration: "none",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              View {vehicles.find((v) => v.id === id)?.vehicle_code} <ArrowRight size={12} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}