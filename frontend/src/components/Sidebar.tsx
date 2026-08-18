import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity, LayoutGrid, Car, GitCompare, MessageSquare,
  BarChart3, AlertTriangle, Settings, Menu,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { to: "/", label: "Overview", icon: <LayoutGrid size={17} /> },
      { to: "/fleet", label: "Fleet", icon: <Car size={17} /> },
      { to: "/compare", label: "Compare", icon: <GitCompare size={17} /> },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { to: "/assistant", label: "AI Assistant", icon: <MessageSquare size={17} /> },
      { to: "/analytics", label: "Analytics", icon: <BarChart3 size={17} /> },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { to: "/alerts", label: "Alerts", icon: <AlertTriangle size={17} /> },
    ],
  },
];

const INK = "#0f1117";
const MUTE = "#8b90a0";
const LINE = "#eceef3";
const BRAND = "#0052ff";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? 76 : 240;

  return (
    <aside
      style={{
        width, height: "100vh", position: "sticky", top: 0,
        background: "#fff", borderRight: `1px solid ${LINE}`,
        display: "flex", flexDirection: "column", flexShrink: 0,
        transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        padding: collapsed ? "16px 0" : "16px 14px 16px 20px",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        gap: 10, borderBottom: `1px solid ${LINE}`, minHeight: 68,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg, ${BRAND}, #0038b8)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Activity size={17} color="#fff" strokeWidth={2.5} />
            </button>
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: `linear-gradient(135deg, ${BRAND}, #0038b8)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Activity size={17} color="#fff" strokeWidth={2.5} />
            </div>
          )}
          {!collapsed && (
            <span style={{
              fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", color: INK,
              whiteSpace: "nowrap",
            }}>
              VEHIQ<span style={{ color: BRAND }}>.</span>
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            style={{
              width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              color: MUTE, flexShrink: 0, transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f2f5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Menu size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? "12px 10px" : "12px", overflowY: "auto", overflowX: "hidden" }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 22 }}>
            {!collapsed && (
              <div style={{
                fontSize: 10, fontWeight: 700, color: MUTE, letterSpacing: 0.7,
                padding: "0 10px", marginBottom: 8, whiteSpace: "nowrap",
              }}>
                {section.title}
              </div>
            )}
            {collapsed && <div style={{ height: 1, background: LINE, margin: "0 4px 10px" }} />}

            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "10px 0" : "9px 12px",
                  borderRadius: 9, marginBottom: 2,
                  fontSize: 13.5, fontWeight: 600, textDecoration: "none",
                  color: isActive ? BRAND : "#4b5563",
                  background: isActive ? "#eff4ff" : "transparent",
                  position: "relative",
                  transition: "background 0.15s, color 0.15s",
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.style.background.includes("eff4ff")) {
                    e.currentTarget.style.background = "#f7f8fa";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains("active")) {
                    const isActive = e.currentTarget.getAttribute("aria-current") === "page";
                    e.currentTarget.style.background = isActive ? "#eff4ff" : "transparent";
                  }
                }}
              >
                {item.icon}
                {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer: Settings */}
      <div style={{ padding: collapsed ? "10px" : "12px", borderTop: `1px solid ${LINE}` }}>
        <NavLink
          to="/settings"
          title={collapsed ? "Settings" : undefined}
          style={({ isActive }) => ({
            display: "flex", alignItems: "center", gap: 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "10px 0" : "9px 12px",
            borderRadius: 9, marginBottom: 6,
            fontSize: 13.5, fontWeight: 600, textDecoration: "none",
            color: isActive ? BRAND : "#4b5563",
            background: isActive ? "#eff4ff" : "transparent",
          })}
        >
          <Settings size={17} />
          {!collapsed && <span style={{ whiteSpace: "nowrap" }}>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
