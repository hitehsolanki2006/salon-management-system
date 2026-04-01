import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import MyAppointments from "./MyAppointments";
import MyAppointmentFlow from "./MyAppointmentFlow";
import Avatar from "../components/Avatar";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../style/UserDashboard.css";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filter, setFilter] = useState("all");
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    spent: 0
  });
  const [chartData, setChartData] = useState({
    monthly: [],
    services: [],
    spending: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch Profile
      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profileData);

      // Fetch Appointments with services
      const { data: appts } = await supabase
        .from("appointments")
        .select(`
          *,
          appointment_services (
            service_id,
            price,
            services (name)
          )
        `)
        .eq("customer_id", user.id);

      if (appts) {
        const total = appts.length;
        const completed = appts.filter(a => a.status === "completed").length;
        const upcoming = appts.filter(a => 
          ["pending", "approved", "in_progress"].includes(a.status)
        ).length;
        
        // Calculate total spent
        const spent = appts
          .filter(a => a.status === "completed")
          .reduce((sum, apt) => {
            return sum + (Number(apt.total_amount) || 0);
          }, 0);

        setStats({ total, completed, upcoming, spent });

        // Generate chart data
        generateChartData(appts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (appointments) => {
    // Monthly spending data (last 6 months)
    const monthlyMap = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      monthlyMap[monthKey] = 0;
    }

    appointments
      .filter(a => a.status === "completed")
      .forEach(apt => {
        const date = new Date(apt.appointment_date || apt.created_at);
        const monthKey = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        if (monthlyMap[monthKey] !== undefined) {
          monthlyMap[monthKey] += Number(apt.total_amount) || 0;
        }
      });

    const monthly = Object.keys(monthlyMap).map(month => ({
      month,
      amount: monthlyMap[month]
    }));

    // Service popularity
    const serviceMap = {};
    appointments.forEach(apt => {
      apt.appointment_services?.forEach(as => {
        const serviceName = as.services?.name || "Unknown";
        serviceMap[serviceName] = (serviceMap[serviceName] || 0) + 1;
      });
    });

    const services = Object.keys(serviceMap)
      .map(name => ({ name, count: serviceMap[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Spending breakdown
    const spending = [
      { name: "Completed", value: appointments.filter(a => a.status === "completed").length },
      { name: "Upcoming", value: appointments.filter(a => ["pending", "approved", "in_progress"].includes(a.status)).length },
      { name: "Cancelled", value: appointments.filter(a => a.status === "cancelled").length }
    ];

    setChartData({ monthly, services, spending });
  };

  const handleStatClick = (type) => {
    setFilter(type);
    setActiveTab("appointments");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const COLORS = ['#6A0DAD', '#9B59B6', '#FFD700', '#E74C3C'];

  return (
    <div className="modern-dashboard">
      {/* MOBILE HAMBURGER BUTTON */}
      <button 
        className={`hamburger-menu ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="profile-section">
            <Avatar 
              name={profile?.full_name} 
              avatarUrl={profile?.avatar_url} 
              size={80} 
            />
            <h3>{profile?.full_name}</h3>
            <p className="profile-email">{profile?.email}</p>
            <span className="role-badge">{profile?.role?.toUpperCase()}</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("dashboard");
              setSidebarOpen(false);
            }}
          >
            <span className="menu-icon">📊</span>
            <span className="menu-text">Dashboard</span>
          </button>

          <button 
            className={`menu-item ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("appointments");
              setFilter("all");
              setSidebarOpen(false);
            }}
          >
            <span className="menu-icon">📋</span>
            <span className="menu-text">My Bookings</span>
          </button>

          <button 
            className={`menu-item ${activeTab === "tracker" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("tracker");
              setSidebarOpen(false);
            }}
          >
            <span className="menu-icon">🚀</span>
            <span className="menu-text">Live Tracker</span>
          </button>

          <button 
            className="menu-item"
            onClick={() => {
              navigate("/services");
              setSidebarOpen(false);
            }}
          >
            <span className="menu-icon">✂️</span>
            <span className="menu-text">Book Service</span>
          </button>

          <button 
            className={`menu-item ${activeTab === "spending" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("spending");
              setSidebarOpen(false);
            }}
          >
            <span className="menu-icon">💰</span>
            <span className="menu-text">Spending Analysis</span>
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <span className="menu-icon">🚪</span>
          <span className="menu-text">Logout</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-content">
        {activeTab === "dashboard" && (
          <>
            <header className="content-header">
              <div>
                <h1>Welcome back, {profile?.full_name?.split(' ')[0]}! ✨</h1>
                <p className="member-info">
                  Member since {new Date(profile?.created_at).toLocaleDateString('en-IN', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </header>

            {/* STATS CARDS */}
            <div className="stats-grid">
              <div className="stat-card clickable" onClick={() => handleStatClick("all")}>
                <div className="stat-icon blue">📅</div>
                <div className="stat-info">
                  <h3>{stats.total}</h3>
                  <p>Total Bookings</p>
                </div>
              </div>

              <div className="stat-card clickable" onClick={() => handleStatClick("completed")}>
                <div className="stat-icon green">✅</div>
                <div className="stat-info">
                  <h3>{stats.completed}</h3>
                  <p>Completed</p>
                </div>
              </div>

              <div className="stat-card clickable" onClick={() => handleStatClick("upcoming")}>
                <div className="stat-icon orange">⏳</div>
                <div className="stat-info">
                  <h3>{stats.upcoming}</h3>
                  <p>Upcoming</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">💰</div>
                <div className="stat-info">
                  <h3>₹{stats.spent.toLocaleString('en-IN')}</h3>
                  <p>Total Spent</p>
                </div>
              </div>
            </div>

            {/* CHARTS */}
            <div className="charts-grid">
              <div className="chart-card">
                <h3>Monthly Spending Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ background: '#fff', border: '2px solid #6A0DAD' }}
                      formatter={(value) => `₹${value}`}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#6A0DAD" strokeWidth={3} dot={{ fill: '#FFD700', r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Popular Services</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.services}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ background: '#fff', border: '2px solid #6A0DAD' }} />
                    <Bar dataKey="count" fill="#9B59B6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Appointments Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData.spending}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.spending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="quick-actions">
              <button className="action-btn primary" onClick={() => navigate("/services")}>
                <span className="action-icon">✂️</span>
                <span>Book New Service</span>
              </button>
              <button className="action-btn secondary" onClick={() => setActiveTab("tracker")}>
                <span className="action-icon">🚀</span>
                <span>Track Live Progress</span>
              </button>
              <button className="action-btn secondary" onClick={() => navigate("/contact")}>
                <span className="action-icon">📞</span>
                <span>Contact Support</span>
              </button>
            </div>
          </>
        )}

        {activeTab === "appointments" && (
          <div className="tab-content">
            <MyAppointments filter={filter} />
          </div>
        )}

        {activeTab === "tracker" && (
          <div className="tab-content">
            <MyAppointmentFlow />
          </div>
        )}

        {activeTab === "spending" && (
          <div className="spending-analysis">
            <h2>Spending Analysis</h2>
            <div className="analysis-grid">
              <div className="analysis-card">
                <h4>This Month</h4>
                <p className="amount">₹{chartData.monthly[chartData.monthly.length - 1]?.amount || 0}</p>
              </div>
              <div className="analysis-card">
                <h4>Average per Visit</h4>
                <p className="amount">₹{stats.completed > 0 ? Math.round(stats.spent / stats.completed) : 0}</p>
              </div>
              <div className="analysis-card">
                <h4>Total Lifetime</h4>
                <p className="amount">₹{stats.spent.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="chart-card full-width">
              <h3>6-Month Spending History</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: '2px solid #6A0DAD' }}
                    formatter={(value) => `₹${value}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="amount" name="Amount Spent" stroke="#6A0DAD" strokeWidth={3} dot={{ fill: '#FFD700', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}