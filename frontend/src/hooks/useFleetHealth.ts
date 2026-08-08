import { useEffect, useState } from "react";
import { getVehicles, getVehicleHealthScore } from "../api/vehicles";
import type { Vehicle } from "../types/vehicle";

export interface VehicleWithHealth extends Vehicle {
  healthScore: number | null;
  anomalyCount: number | null;
  anomalyRate: number | null;
}

const SETTINGS_KEY = "vehiq_settings";
const DEFAULT_THRESHOLD = 50;

export function getCriticalThreshold(): number {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_THRESHOLD;
    const parsed = JSON.parse(saved);
    const value = Number(parsed.alertThreshold);
    return Number.isFinite(value) ? value : DEFAULT_THRESHOLD;
  } catch {
    return DEFAULT_THRESHOLD;
  }
}

export function getBand(score: number): "excellent" | "good" | "fair" | "critical" {
  const threshold = getCriticalThreshold();
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= threshold) return "fair";
  return "critical";
}

export const BAND_COLOR: Record<string, string> = {
  excellent: "#059669",
  good: "#0052ff",
  fair: "#d97706",
  critical: "#dc2626",
};

export function useFleetHealth() {
  const [vehicles, setVehicles] = useState<VehicleWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVehicles()
      .then(async (data) => {
        const withHealth = await Promise.all(
          data.map(async (v) => {
            try {
              const h = await getVehicleHealthScore(v.id);
              return {
                ...v,
                healthScore: h.health_score,
                anomalyCount: h.anomaly_count ?? null,
                anomalyRate: h.anomaly_rate ?? null,
              };
            } catch {
              return { ...v, healthScore: null, anomalyCount: null, anomalyRate: null };
            }
          })
        );
        setVehicles(withHealth);
      })
      .catch((err) => {
        console.error("Failed to fetch fleet:", err);
        setError(
          err?.code === "ERR_NETWORK"
            ? "Cannot reach API. Is the backend running on port 8000?"
            : "Failed to load fleet data."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return { vehicles, loading, error };
}