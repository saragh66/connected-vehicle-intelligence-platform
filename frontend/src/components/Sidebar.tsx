import { NavLink } from "react-router-dom";
import { Activity, LayoutGrid, Car, MessageSquare, BarChart3, AlertTriangle, Settings } from "lucide-react";

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

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#fff",
        borderRight: "1px solid #e8eaef",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "22px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #0052ff, #0038b8)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Activity size={18} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>
          VEHIQ<span style={{ color: "#0052ff" }}>.</span>
        </span>
      </div>

      <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto" }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 10.5, fontWeight: 700, color: "#9ca3af",
                letterSpacing: 0.6, padding: "0 10px", marginBottom: 6,
              }}
            >
              {section.title}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, marginBottom: 2,
                  fontSize: 13.5, fontWeight: 600, textDecoration: "none",
                  color: isActive ? "#0052ff" : "#4b5563",
                  background: isActive ? "#eff4ff" : "transparent",
                })}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: "12px", borderTop: "1px solid #e8eaef" }}>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8,
            fontSize: 13.5, fontWeight: 600, textDecoration: "none",
            color: isActive ? "#0052ff" : "#4b5563",
            background: isActive ? "#eff4ff" : "transparent",
          })}
        >
          <Settings size={17} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}