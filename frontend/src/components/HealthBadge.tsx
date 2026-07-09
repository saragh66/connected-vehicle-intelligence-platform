interface HealthBadgeProps {
  score: number;
}

export default function HealthBadge({ score }: HealthBadgeProps) {
  const getStatus = () => {
    if (score >= 80) return { color: "#059669", bg: "#ecfdf5", label: "OPTIMAL" };
    if (score >= 50) return { color: "#d97706", bg: "#fffbeb", label: "MONITOR" };
    return { color: "#dc2626", bg: "#fef2f2", label: "CRITICAL" };
  };
  const { color, bg, label } = getStatus();

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "3px 8px", borderRadius: 20, background: bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.5 }}>{label}</span>
    </div>
  );
}