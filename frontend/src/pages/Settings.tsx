import { useState, useEffect } from "react";
import { Gauge, Download, LayoutGrid, ChevronDown, Mail } from "lucide-react";
import { useFleetHealth } from "../hooks/useFleetHealth";
import { sendTestEmail } from "../api/notifications";

const STORAGE_KEY = "vehiq_settings";

interface AppSettings {
  units: "metric" | "imperial";
  defaultPage: "overview" | "fleet" | "analytics";
  alertThreshold: number;
  criticalAlerts: boolean;
  weeklyDigest: boolean;
  notifyEmail: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  units: "metric",
  defaultPage: "overview",
  alertThreshold: 50,
  criticalAlerts: true,
  weeklyDigest: false,
  notifyEmail: "",
};

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #e8eaef" }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f1117" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{sub}</div>
      </div>
      <button
        onClick={onChange}
        style={{
          width: 42, height: 24, borderRadius: 20, border: "none", cursor: "pointer",
          background: checked ? "#0052ff" : "#e4e7eb", position: "relative", transition: "background 0.2s",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 21 : 3, width: 18, height: 18,
          borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { vehicles } = useFleetHealth();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(t);
  }, [settings]);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleTestEmail = async () => {
    if (!settings.notifyEmail) return;
    setEmailStatus("Sending...");
    try {
      const result = await sendTestEmail(settings.notifyEmail);
      setEmailStatus(result.message);
    } catch {
      setEmailStatus("Failed to reach the server.");
    }
  };

  const exportCSV = () => {
    const header = "vehicle_code,health_score,anomaly_count,anomaly_rate\n";
    const rows = vehicles
      .map((v) => [
        v.vehicle_code,
        v.healthScore ?? "",
        v.anomalyCount ?? "",
        v.anomalyRate ?? "",
      ].join(","))
      .join("\n");
    const csv = header + rows;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1117", margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>Preferences and platform configuration</p>
        </div>
        {saved && (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#059669" }}>Saved</span>
        )}
      </div>

      {/* Units */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          Units
        </div>
        <div style={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 14, padding: "8px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Gauge size={16} color="#0052ff" />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f1117" }}>Measurement system</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Speed and temperature units across the app</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, background: "#f4f5f8", padding: 3, borderRadius: 8 }}>
              {(["metric", "imperial"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => update("units", u)}
                  style={{
                    padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none",
                    background: settings.units === u ? "#fff" : "transparent",
                    color: settings.units === u ? "#0f1117" : "#9096a3",
                    boxShadow: settings.units === u ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    cursor: "pointer", textTransform: "capitalize",
                  }}
                >
                  {u === "metric" ? "km/h, °C" : "mph, °F"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Default view */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          Dashboard
        </div>
        <div style={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LayoutGrid size={16} color="#0052ff" />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f1117" }}>Default landing page</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Which page opens first</div>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <select
                value={settings.defaultPage}
                onChange={(e) => update("defaultPage", e.target.value as AppSettings["defaultPage"])}
                style={{
                  appearance: "none", padding: "7px 30px 7px 12px", borderRadius: 8, border: "1px solid #e4e7eb",
                  fontSize: 12.5, fontWeight: 600, color: "#0f1117", background: "#fff", cursor: "pointer",
                }}
              >
                <option value="overview">Overview</option>
                <option value="fleet">Fleet</option>
                <option value="analytics">Analytics</option>
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }} />
            </div>
          </div>

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #f1f2f5" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f1117" }}>Critical health threshold</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", fontFamily: "var(--font-mono, monospace)" }}>
                {settings.alertThreshold}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
              Vehicles scoring below this are flagged critical in Alerts and Analytics
            </div>
            <input
              type="range"
              min={20}
              max={70}
              value={settings.alertThreshold}
              onChange={(e) => update("alertThreshold", Number(e.target.value))}
              style={{ width: "100%", accentColor: "#0052ff" }}
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          Notifications
        </div>
        <div style={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 14, padding: "0 20px" }}>
          <ToggleRow
            label="Critical alerts"
            sub="Notify when a vehicle enters the critical health band"
            checked={settings.criticalAlerts}
            onChange={() => update("criticalAlerts", !settings.criticalAlerts)}
          />
          <ToggleRow
            label="Weekly digest"
            sub="Summary of fleet health trends every Monday"
            checked={settings.weeklyDigest}
            onChange={() => update("weeklyDigest", !settings.weeklyDigest)}
          />
          <div style={{ padding: "14px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Mail size={15} color="#0052ff" />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0f1117" }}>Notification email</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                placeholder="you@company.com"
                value={settings.notifyEmail}
                onChange={(e) => update("notifyEmail", e.target.value)}
                style={{
                  flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #e4e7eb",
                  fontSize: 13, outline: "none",
                }}
              />
              <button
                onClick={handleTestEmail}
                disabled={!settings.notifyEmail}
                style={{
                  fontSize: 12.5, fontWeight: 700, color: "#0052ff", background: "#eff4ff",
                  border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer",
                  opacity: settings.notifyEmail ? 1 : 0.5,
                }}
              >
                Send test
              </button>
            </div>
            {emailStatus && (
              <div style={{ fontSize: 11.5, color: emailStatus.includes("sent") ? "#059669" : "#dc2626", marginTop: 6 }}>
                {emailStatus}
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#c4c9d4", marginTop: 8 }}>
          Preference is saved. Delivery (email/push) is not yet implemented.
        </div>
      </div>

      {/* Data */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          Data
        </div>
        <div style={{ background: "#fff", border: "1px solid #e8eaef", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Download size={16} color="#0052ff" />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f1117" }}>Export fleet report</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Download current fleet data as CSV</div>
            </div>
          </div>
          <button
            onClick={exportCSV}
            style={{
              fontSize: 12.5, fontWeight: 700, color: "#0052ff", background: "#eff4ff",
              border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer",
            }}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}