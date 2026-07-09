interface GaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
  size?: number;
}

export default function Gauge({ value, max, label, unit, color = "#0057ff", size = 140 }: GaugeProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percentage = clamped / max;
  const angle = percentage * 270 - 135;

  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;

  const polarToCartesian = (angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const startAngle = -135;
  const endAngle = -135 + percentage * 270;
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArc = percentage * 270 > 180 ? 1 : 0;

  const fullStart = polarToCartesian(-135);
  const fullEnd = polarToCartesian(135);

  const needleRad = ((angle - 90) * Math.PI) / 180;
  const needleX = cx + (radius - 10) * Math.cos(needleRad);
  const needleY = cy + (radius - 10) * Math.sin(needleRad);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size}`}>
        <path
          d={`M ${fullStart.x} ${fullStart.y} A ${radius} ${radius} 0 1 1 ${fullEnd.x} ${fullEnd.y}`}
          fill="none"
          stroke="#e4e7eb"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          style={{ transition: "all 0.4s ease" }}
        />
        <line
          x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke="#14171f" strokeWidth={2}
          style={{ transition: "all 0.4s ease" }}
        />
        <circle cx={cx} cy={cy} r={4} fill="#14171f" />
        <text x={cx} y={cy + radius * 0.55} textAnchor="middle" fill="#14171f" fontSize={22} fontWeight={700} fontFamily="var(--font-mono)">
          {Math.round(clamped)}
        </text>
        <text x={cx} y={cy + radius * 0.55 + 16} textAnchor="middle" fill="#6b7280" fontSize={10}>
          {unit}
        </text>
      </svg>
      <span style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
    </div>
  );
}