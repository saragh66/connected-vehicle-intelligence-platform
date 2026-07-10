import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border-color)",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "16px 3rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #0052ff, #0038b8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>
            VEHIQ<span style={{ color: "var(--accent-blue)" }}>.</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent-green)",
              boxShadow: "0 0 0 3px rgba(0,168,119,0.15)",
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
            System Operational
          </span>
        </div>
      </div>
    </header>
  );
}