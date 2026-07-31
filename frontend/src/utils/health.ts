export function getBand(score: number): "excellent" | "good" | "fair" | "critical" {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "fair";
  return "critical";
}

export const BAND_COLOR: Record<string, string> = {
  excellent: "#059669",
  good: "#0052ff",
  fair: "#d97706",
  critical: "#dc2626",
};