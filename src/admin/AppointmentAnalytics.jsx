import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import "./Analytics.css";

export default function AppointmentAnalytics() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    avgValue: 0
  });
  
  const [trendData, setTrendData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [staffWorkload, setStaffWorkload] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointmentAnalytics();
  }, []);

  const fetchAppointmentAnalytics = async () => {
    setLoading(true);

    // Fetch all appointments with related data
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        *,
        customer:users!appointments_customer_id_fkey(full_name, email),
        staff:users!appointments_staff_id_fkey(full_name),
        appointment_services(
          price,
          services(name)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
      setLoading(false);
      return;
    }

    // Calculate statistics
    const total = appointments.length;
    const pending = appointments.filter(a => a.status === "pending").length;
    const approved = appointments.filter(a => a.status === "approved").length;
    const inProgress = appointments.filter(a => a.status === "in_progress").length;
    const completed = appointments.filter(a => a.status === "completed").length;
    const cancelled = appointments.filter(a => a.status === "cancelled").length;
    
    const totalRevenue = appointments
      .filter(a => a.status === "completed")
      .reduce((sum, a) => sum + (Number(a.total_amount) || 0), 0);
    
    const avgValue = completed > 0 ? Math.round(totalRevenue / completed) : 0;

    setStats({
      total,
      pending,
      approved,
      inProgress,
      completed,
      cancelled,
      totalRevenue,
      avgValue
    });

    // Status distribution for pie chart
    const statusDistribution = [
      { name: "Pending", value: pending, color: "#f39c12" },
      { name: "Approved", value: approved, color: "#3498db" },
      { name: "In Progress", value: inProgress, color: "#9b59b6" },
      { name: "Completed", value: completed, color: "#27ae60" },
      { name: "Cancelled", value: cancelled, color: "#e74c3c" }
    ].filter(item => item.value > 0);
    setStatusData(statusDistribution);

    // Trend data - last 30 days
    const last30Days = [...Array(30)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const trendByDay = last30Days.map(date => {
      const dayAppointments = appointments.filter(a => 
        a.appointment_time?.startsWith(date)
      );
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        appointments: dayAppointments.length,
        revenue: dayAppointments
          .filter(a => a.status === "completed")
          .reduce((sum, a) => sum + (Number(a.total_amount) || 0), 0)
      };
    });
    setTrendData(trendByDay);

    // Peak hours analysis
    const hourCounts = Array(24).fill(0);
    appointments.forEach(a => {
      if (a.appointment_time) {
        const hour = new Date(a.appointment_time).getHours();
        hourCounts[hour]++;
      }
    });

    const peakHoursData = hourCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      appointments: count
    })).filter(h => h.appointments > 0);
    setPeakHours(peakHoursData);

    // Top services
    const serviceCount = {};
    appointments.forEach(a => {
      a.appointment_services?.forEach(as => {
        const serviceName = as.services?.name || "Unknown";
        serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
      });
    });

    const topServicesData = Object.entries(serviceCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTopServices(topServicesData);

    // Staff workload
    const staffCount = {};
    appointments.forEach(a => {
      const staffName = a.staff?.full_name || "Unassigned";
      staffCount[staffName] = (staffCount[staffName] || 0) + 1;
    });

    const staffWorkloadData = Object.entries(staffCount)
      .map(([name, count]) => ({ name, appointments: count }))
      .sort((a, b) => b.appointments - a.appointments);
    setStaffWorkload(staffWorkloadData);

    // Recent appointments
    setRecentAppointments(appointments.slice(0, 10));

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading appointment analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h3>📅 Appointment Analytics</h3>
        <p>Comprehensive insights into your appointment data</p>
      </div>

      {/* KEY METRICS */}
      <div className="metrics-grid">
        <div className="metric-card total">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h4>Total Appointments</h4>
            <p className="metric-value">{stats.total}</p>
            <span className="metric-label">All time</span>
          </div>
        </div>

        <div className="metric-card pending">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <h4>Pending Approval</h4>
            <p className="metric-value">{stats.pending}</p>
            <span className="metric-label">Awaiting action</span>
          </div>
        </div>

        <div className="metric-card progress">
          <div className="metric-icon">✂️</div>
          <div className="metric-content">
            <h4>In Progress</h4>
            <p className="metric-value">{stats.inProgress}</p>
            <span className="metric-label">Active now</span>
          </div>
        </div>

        <div className="metric-card completed">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h4>Completed</h4>
            <p className="metric-value">{stats.completed}</p>
            <span className="metric-label">Successfully done</span>
          </div>
        </div>

        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h4>Total Revenue</h4>
            <p className="metric-value">₹{stats.totalRevenue.toLocaleString()}</p>
            <span className="metric-label">From completed</span>
          </div>
        </div>

        <div className="metric-card average">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h4>Average Value</h4>
            <p className="metric-value">₹{stats.avgValue}</p>
            <span className="metric-label">Per appointment</span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="charts-grid">
        {/* TREND CHART */}
        <div className="analytics-card full-width">
          <div className="card-header">
            <h4>📈 Appointment Trend (Last 30 Days)</h4>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6A0DAD" opacity={0.2} />
              <XAxis dataKey="date" stroke="#B0B0B0" />
              <YAxis stroke="#B0B0B0" />
              <Tooltip 
                contentStyle={{ 
                  background: "#2D1B3D", 
                  border: "1px solid #6A0DAD",
                  borderRadius: "8px"
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="appointments" 
                stroke="#9B59B6" 
                strokeWidth={3}
                dot={{ fill: "#FFD700", r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* STATUS DISTRIBUTION */}
        <div className="analytics-card">
          <div className="card-header">
            <h4>📊 Status Distribution</h4>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* PEAK HOURS */}
        <div className="analytics-card">
          <div className="card-header">
            <h4>⏰ Peak Hours</h4>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6A0DAD" opacity={0.2} />
              <XAxis dataKey="hour" stroke="#B0B0B0" />
              <YAxis stroke="#B0B0B0" />
              <Tooltip 
                contentStyle={{ 
                  background: "#2D1B3D", 
                  border: "1px solid #6A0DAD",
                  borderRadius: "8px"
                }} 
              />
              <Bar dataKey="appointments" fill="#FFD700" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TOP SERVICES */}
        <div className="analytics-card">
          <div className="card-header">
            <h4>✂️ Most Booked Services</h4>
          </div>
          <div className="top-list">
            {topServices.map((service, idx) => (
              <div key={idx} className="top-item">
                <div className="rank-badge">{idx + 1}</div>
                <div className="item-info">
                  <span className="item-name">{service.name}</span>
                  <span className="item-count">{service.count} bookings</span>
                </div>
                <div className="item-bar">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${(service.count / topServices[0].count) * 100}%`,
                      background: "linear-gradient(90deg, #6A0DAD, #FFD700)"
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STAFF WORKLOAD */}
        <div className="analytics-card">
          <div className="card-header">
            <h4>👥 Staff Workload</h4>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={staffWorkload} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#6A0DAD" opacity={0.2} />
              <XAxis type="number" stroke="#B0B0B0" />
              <YAxis dataKey="name" type="category" stroke="#B0B0B0" width={100} />
              <Tooltip 
                contentStyle={{ 
                  background: "#2D1B3D", 
                  border: "1px solid #6A0DAD",
                  borderRadius: "8px"
                }} 
              />
              <Bar dataKey="appointments" fill="#9B59B6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT APPOINTMENTS TABLE */}
      <div className="analytics-card full-width">
        <div className="card-header">
          <h4>📋 Recent Appointments</h4>
        </div>
        <div className="appointments-table-wrapper">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Staff</th>
                <th>Services</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map((appt) => (
                <tr key={appt.id}>
                  <td>
                    <div className="date-cell">
                      <span className="date-text">
                        {new Date(appt.appointment_time).toLocaleDateString()}
                      </span>
                      <span className="time-text">
                        {new Date(appt.appointment_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <span className="customer-name">{appt.customer?.full_name}</span>
                      <span className="customer-email">{appt.customer?.email}</span>
                    </div>
                  </td>
                  <td>{appt.staff?.full_name || "Unassigned"}</td>
                  <td>
                    <div className="services-cell">
                      {appt.appointment_services?.slice(0, 2).map((as, idx) => (
                        <span key={idx} className="service-tag">
                          {as.services?.name}
                        </span>
                      ))}
                      {appt.appointment_services?.length > 2 && (
                        <span className="more-services">
                          +{appt.appointment_services.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="amount-cell">₹{appt.total_amount}</td>
                  <td>
                    <span className={`status-badge status-${appt.status}`}>
                      {appt.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSIGHTS CARDS */}
      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-icon">🎯</div>
          <h4>Conversion Rate</h4>
          <p className="insight-value">
            {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
          </p>
          <span className="insight-label">Pending → Completed</span>
        </div>

        <div className="insight-card">
          <div className="insight-icon">❌</div>
          <h4>Cancellation Rate</h4>
          <p className="insight-value">
            {stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}%
          </p>
          <span className="insight-label">Total cancellations</span>
        </div>

        <div className="insight-card">
          <div className="insight-icon">⚡</div>
          <h4>Active Rate</h4>
          <p className="insight-value">
            {stats.total > 0 ? (((stats.approved + stats.inProgress) / stats.total) * 100).toFixed(1) : 0}%
          </p>
          <span className="insight-label">Currently active</span>
        </div>
      </div>
    </div>
  );
}
