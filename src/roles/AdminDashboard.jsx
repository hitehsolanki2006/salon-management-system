import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext";
import UserManagement from "../admin/UserManagement";
import ServiceManagement from "../admin/ServiceManagement";
import Reports from "../admin/Reports";
import Analytics from "../admin/Analytics";
import AppointmentAnalytics from "../admin/AppointmentAnalytics";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { openConfirm } = useModal();
  const [tab, setTab] = useState("analytics");
  const [adminMode, setAdminMode] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const loadAdminMode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("admin_mode, admin_mode_until")
      .eq("id", user.id)
      .single();

    if (data?.admin_mode && data.admin_mode_until && new Date(data.admin_mode_until) > new Date()) {
      setAdminMode(true);
      setExpiresAt(new Date(data.admin_mode_until));
    } else {
      stopAdminMode();
    }
  };

  const updateTimer = () => {
    if (!expiresAt) return;
    const diff = Math.max(0, Math.floor((expiresAt - new Date()) / 1000));
    setTimeLeft(diff);
    if (diff === 0) stopAdminMode();
  };

  const stopAdminMode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("users")
        .update({ admin_mode: false, admin_mode_until: null })
        .eq("id", user.id);
    }
    setAdminMode(false);
    setExpiresAt(null);
    setTimeLeft(0);
  };

  useEffect(() => {
    loadAdminMode();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const startAdminMode = async () => {
    openConfirm(
      "Enable ADMIN MODE for 10 minutes? This will allow you to perform sensitive operations like deleting users and assigning admin roles.",
      async () => {
        const until = new Date(Date.now() + 10 * 60 * 1000);
        const { data: { user } } = await supabase.auth.getUser();

        await supabase
          .from("users")
          .update({ admin_mode: true, admin_mode_until: until.toISOString() })
          .eq("id", user.id);

        setAdminMode(true);
        setExpiresAt(until);
      },
      "⚠️ Enable Admin Mode"
    );
  };

  const formatTime = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  const tabs = [
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "services", label: "Services", icon: "✂️" },
    { id: "reports", label: "Reports", icon: "📈" },
  ];

  return (
    <div className="admin-dashboard-container">
      <header className="dashboard-header">
        <div className="header-text">
          <h1 className="dashboard-title">Royal Admin</h1>
          <p className="dashboard-subtitle">Salon Management Portal</p>
        </div>

        <div className="admin-controls">
          {!adminMode ? (
            <button className="btn-enable-admin" onClick={startAdminMode}>
              <span className="icon">🔐</span> Elevate Access
            </button>
          ) : (
            <div className="admin-status-badge">
              <span className="pulse-dot"></span>
              <span className="timer-val">{formatTime(timeLeft)}</span>
              <button className="btn-stop-admin" onClick={stopAdminMode}>Exit</button>
            </div>
          )}
        </div>
      </header>

      <nav className="dashboard-nav">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`nav-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="dashboard-view-area">
        <div className="content-card">
          {tab === "analytics" && <Analytics />}
          {tab === "appointments" && <AppointmentAnalytics />}
          {tab === "users" && <UserManagement adminMode={adminMode} />}
          {tab === "services" && <ServiceManagement />}
          {tab === "reports" && <Reports />}
        </div>
      </main>
    </div>
  );
}