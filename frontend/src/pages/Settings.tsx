import { Cpu, Database, Server, Activity } from "lucide-react";

function StatusRow({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid #e8eaef" }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: "#eff4ff", color: "#0052ff",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f1117" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>{value}</div>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
        background: ok ? "#ecfdf5" : "#fef2f2",
        color: ok ? "#059669" : "#dc2626",
      }}>
        {ok ? "Online" : "Offline"}
      </span>
    </div>
  );
}

export default function Settings() {
  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1117", margin: 0 }}>Settings</h1>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 20px" }}>
        System status and platform configuration
      </p>

      <div style={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 16, padding: "8px 20px" }}>
        <StatusRow icon={<Server size={16} />} label="Backend API" value="FastAPI · localhost:8000" ok />
        <StatusRow icon={<Database size={16} />} label="Database" value="PostgreSQL · Seat Leon telemetry (81 trips)" ok />
        <StatusRow icon={<Cpu size={16} />} label="LLM Runtime" value="Ollama · Llama 3.2 (local)" ok />
        <div style={{ borderBottom: "none" }}>
          <StatusRow icon={<Activity size={16} />} label="Anomaly Model" value="Isolation Forest v1" ok />
        </div>
      </div>
    </div>
  );
}