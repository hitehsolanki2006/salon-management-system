import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext";
import "../style/StaffDashboard.css";

export default function StaffDashboard() {
  const { openConfirm, openSuccess, openError } = useModal();
  
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all"); 
  const [viewMode, setViewMode] = useState("tasks");
  const [rating, setRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("time");
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [newAppointmentAlert, setNewAppointmentAlert] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    in_progress: 0,
    service_done: 0,
    completed: 0,
    today_completed: 0,
    total_earnings: 0,
    avg_service_time: 0,
    rating_count: 0
  });

  const fetchMyAppointments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, 
        appointment_time, 
        status, 
        total_amount,
        created_at,
        customer:users!appointments_customer_id_fkey (full_name, phone, avatar_url),
        appointment_services (
          id,
          quantity, 
          price, 
          services (name, duration)
        )
      `)
      .eq("staff_id", user.id)
      .order("appointment_time", { ascending: false });

    if (error) {
      openError(error.message, "Fetch Failed");
      return;
    }

    setAppointments(data || []);
    updateStats(data || []);
  };

  const fetchMyRating = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("avg_rating, rating_count")
      .eq("id", user.id)
      .single();
    
    console.log("Staff rating data:", data); // Debug log
    setRating(data?.avg_rating || 0);
    
    // Update stats with rating count
    setStats(prev => ({
      ...prev,
      rating_count: data?.rating_count || 0
    }));
  };

  const updateStats = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCompleted = data.filter(a => {
      if (a.status !== "completed") return false;
      const apptDate = new Date(a.appointment_time);
      return apptDate >= today && apptDate < tomorrow;
    }).length;

    const totalEarnings = data
      .filter(a => a.status === "completed")
      .reduce((sum, a) => sum + (parseFloat(a.total_amount) || 0), 0);

    // Calculate average service time
    const avgServiceTime = data.length > 0 
      ? data.reduce((sum, a) => {
          const duration = a.appointment_services?.reduce((s, as) => 
            s + (as.services?.duration || 30), 0) || 30;
          return sum + duration;
        }, 0) / data.length 
      : 0;

    setStats({
      total: data.length,
      in_progress: data.filter(a => a.status === "in_progress").length,
      service_done: data.filter(a => a.status === "service_done").length,
      completed: data.filter(a => a.status === "completed").length,
      today_completed: todayCompleted,
      total_earnings: totalEarnings,
      avg_service_time: Math.round(avgServiceTime)
    });
  };

  useEffect(() => {
    fetchMyAppointments();
    fetchMyRating();
    
    // Real-time subscription
    const channel = supabase
      .channel('staff-appointments')
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "appointments" 
      }, (payload) => {
        // New appointment assigned
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setNewAppointmentAlert(true);
          setTimeout(() => setNewAppointmentAlert(false), 5000);
        }
        
        // Celebration when task completed
        if (payload.new?.status === "service_done") {
          setCelebrationActive(true);
          setTimeout(() => setCelebrationActive(false), 5000);
        }
        
        fetchMyAppointments();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const markAsFinished = async (id) => {
    openConfirm(
      "Are you sure you have finished all services for this client?",
      async () => {
        const { error } = await supabase
          .from("appointments")
          .update({ status: "service_done" })
          .eq("id", id);

        if (error) {
          openError(error.message, "Update Failed");
          return;
        }

        openSuccess("Service marked as finished! Wait for receptionist to collect payment.", "Task Done");
        setCelebrationActive(true);
        setTimeout(() => setCelebrationActive(false), 5000);
        fetchMyAppointments();
      },
      "Mark Service as Complete"
    );
  };

  // Advanced filtering
  const filteredData = appointments.filter((a) => {
    // View mode filter
    if (viewMode === "history") {
      if (a.status !== "completed") return false;
    } else {
      if (a.status === "completed") return false;
    }
    
    // Status filter
    if (activeFilter !== "all" && a.status !== activeFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const customerName = a.customer?.full_name?.toLowerCase() || "";
      const customerPhone = a.customer?.phone || "";
      if (!customerName.includes(query) && !customerPhone.includes(query)) {
        return false;
      }
    }

    // Date filter
    if (dateFilter !== "all") {
      const apptDate = new Date(a.appointment_time);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === "today") {
        const apptDay = new Date(apptDate);
        apptDay.setHours(0, 0, 0, 0);
        if (apptDay.getTime() !== today.getTime()) return false;
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (apptDate < weekAgo) return false;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (apptDate < monthAgo) return false;
      }
    }

    return true;
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "time") {
      const dateA = new Date(a.appointment_time);
      const dateB = new Date(b.appointment_time);
      return dateB - dateA;
    } else if (sortBy === "amount") {
      return (parseFloat(b.total_amount) || 0) - (parseFloat(a.total_amount) || 0);
    } else if (sortBy === "customer") {
      return (a.customer?.full_name || "").localeCompare(b.customer?.full_name || "");
    }
    return 0;
  });

  return (
    <div className="staff-dashboard-container">
      {/* Celebration Effect */}
      {celebrationActive && <CelebrationEffect />}
      
      {/* New Appointment Alert */}
      {newAppointmentAlert && (
        <div className="new-appointment-alert">
          <span className="alert-icon">🔔</span>
          <span>New appointment update!</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="staff-hero-header">
        <div className="hero-bg-animation">
          <div className="floating-icon icon-1">✂️</div>
          <div className="floating-icon icon-2">💇</div>
          <div className="floating-icon icon-3">💅</div>
          <div className="floating-icon icon-4">✨</div>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">Staff Dashboard</h1>
          <div className="rating-display">
            <div className="stars">{"⭐".repeat(Math.round(rating))}</div>
            <span className="rating-value">
              {rating ? rating.toFixed(1) : "0.0"} Rating
            </span>
            <span className="rating-count">
              ({stats.rating_count} {stats.rating_count === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        <button 
          className={`view-toggle-btn ${viewMode === "history" ? "history-mode" : ""}`}
          onClick={() => {
            setViewMode(viewMode === "tasks" ? "history" : "tasks");
            setActiveFilter("all");
          }}
        >
          {viewMode === "tasks" ? (
            <>
              <span className="btn-icon">📜</span>
              <span>View History</span>
            </>
          ) : (
            <>
              <span className="btn-icon">⬅️</span>
              <span>Back to Tasks</span>
            </>
          )}
        </button>
      </div>

      {/* Performance Analytics */}
      <div className="analytics-section">
        <h2 className="section-title">
          <span className="title-icon">📊</span>
          Performance Analytics
        </h2>
        
        <div className="analytics-grid">
          <div className="stat-card-modern" style={{"--card-color": "#3498db"}}>
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Appointments</div>
            </div>
            <div className="stat-glow"></div>
          </div>

          <div className="stat-card-modern" style={{"--card-color": "#9b59b6"}}>
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-value">{stats.in_progress}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-glow"></div>
          </div>

          <div className="stat-card-modern" style={{"--card-color": "#f39c12"}}>
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.service_done}</div>
              <div className="stat-label">Awaiting Payment</div>
            </div>
            <div className="stat-glow"></div>
          </div>

          <div className="stat-card-modern" style={{"--card-color": "#27ae60"}}>
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.today_completed}</div>
              <div className="stat-label">Completed Today</div>
            </div>
            <div className="stat-glow"></div>
          </div>

          <div className="stat-card-modern" style={{"--card-color": "#FFD700"}}>
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">₹{stats.total_earnings.toFixed(0)}</div>
              <div className="stat-label">Total Earnings</div>
            </div>
            <div className="stat-glow"></div>
          </div>

          <div className="stat-card-modern" style={{"--card-color": "#e74c3c"}}>
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.avg_service_time}m</div>
              <div className="stat-label">Avg Service Time</div>
            </div>
            <div className="stat-glow"></div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      {viewMode === "tasks" && (
        <div className="filters-section">
          <div className="filter-group">
            <h3 className="filter-title">Filter by Status</h3>
            <div className="status-filters">
              <button 
                className={`filter-chip ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                All Tasks
              </button>
              <button 
                className={`filter-chip ${activeFilter === "in_progress" ? "active" : ""}`}
                onClick={() => setActiveFilter("in_progress")}
                style={{"--chip-color": "#9b59b6"}}
              >
                In Progress ({stats.in_progress})
              </button>
              <button 
                className={`filter-chip ${activeFilter === "service_done" ? "active" : ""}`}
                onClick={() => setActiveFilter("service_done")}
                style={{"--chip-color": "#f39c12"}}
              >
                Awaiting Payment ({stats.service_done})
              </button>
            </div>
          </div>

          <div className="filter-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text"
                placeholder="Search by customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery("")}>✖</button>
              )}
            </div>

            <select 
              className="filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="time">Sort by Time</option>
              <option value="amount">Sort by Amount</option>
              <option value="customer">Sort by Customer</option>
            </select>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="appointments-section">
        <h2 className="section-title">
          <span className="title-icon">{viewMode === "history" ? "📜" : "📋"}</span>
          {viewMode === "history" ? "Completed History" : "Active Tasks"}
          <span className="count-badge">{sortedData.length}</span>
        </h2>

        {sortedData.length === 0 ? (
          <EmptyState viewMode={viewMode} />
        ) : (
          <div className="appointments-grid">
            {sortedData.map((appt, index) => (
              <AppointmentCard 
                key={appt.id} 
                appointment={appt} 
                onMarkFinished={markAsFinished}
                viewMode={viewMode}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const staffConfettiPieces = [...Array(50)].map((_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 3}s`,
  color: ['#FFD700', '#6A0DAD', '#9B59B6', '#27AE60'][Math.floor(Math.random() * 4)]
}));

function CelebrationEffect() {
  return (
    <div className="celebration-overlay">
      <div className="confetti">
        {staffConfettiPieces.map((piece) => (
          <div key={piece.id} className="confetti-piece" style={{
            left: piece.left,
            animationDelay: piece.delay,
            background: piece.color
          }} />
        ))}
      </div>
      <div className="celebration-message">
        <div className="celebration-icon">🎉</div>
        <h2>Service Completed!</h2>
        <p>Great job! Keep up the excellent work!</p>
      </div>
    </div>
  );
}

function AppointmentCard({ appointment, onMarkFinished, viewMode, index }) {
  const getStatusColor = (status) => {
    const colors = {
      in_progress: "#9b59b6",
      service_done: "#f39c12",
      completed: "#27ae60",
      pending: "#3498db",
      approved: "#1abc9c"
    };
    return colors[status] || "#6A0DAD";
  };

  const totalDuration = appointment.appointment_services?.reduce(
    (sum, as) => sum + (as.services?.duration || 30), 
    0
  ) || 0;

  // Format date and time from single timestamp
  const appointmentDate = new Date(appointment.appointment_time);
  const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = appointmentDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="appointment-card-modern" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="card-ribbon" style={{ background: getStatusColor(appointment.status) }}>
        {appointment.status.replace("_", " ").toUpperCase()}
      </div>

      {/* Customer Info */}
      <div className="customer-section">
        <div className="customer-avatar">
          {appointment.customer?.avatar_url ? (
            <img src={appointment.customer.avatar_url} alt={appointment.customer.full_name} />
          ) : (
            <div className="avatar-placeholder">
              {appointment.customer?.full_name?.charAt(0) || "C"}
            </div>
          )}
        </div>
        <div className="customer-info">
          <h3 className="customer-name">{appointment.customer?.full_name || "Guest"}</h3>
          <a href={`tel:${appointment.customer?.phone}`} className="customer-phone">
            📞 {appointment.customer?.phone || "No phone"}
          </a>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="appointment-details">
        <div className="detail-row">
          <span className="detail-icon">📅</span>
          <span className="detail-text">{formattedDate}</span>
        </div>
        <div className="detail-row">
          <span className="detail-icon">⏰</span>
          <span className="detail-text">{formattedTime}</span>
        </div>
        <div className="detail-row">
          <span className="detail-icon">⏱️</span>
          <span className="detail-text">{totalDuration} minutes</span>
        </div>
        <div className="detail-row">
          <span className="detail-icon">💰</span>
          <span className="detail-text amount">₹{parseFloat(appointment.total_amount || 0).toFixed(0)}</span>
        </div>
      </div>

      {/* Services List */}
      <div className="services-section">
        <h4 className="services-title">Services:</h4>
        <div className="services-list">
          {appointment.appointment_services?.map((as, idx) => (
            <div key={idx} className="service-item-compact">
              <div className="service-bullet"></div>
              <div className="service-info">
                <span className="service-name">{as.services?.name}</span>
                {as.quantity > 1 && (
                  <span className="service-quantity">×{as.quantity}</span>
                )}
                <span className="service-duration">
                  {as.services?.duration || 30}m
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      {appointment.status === "in_progress" && viewMode === "tasks" && (
        <button 
          className="finish-btn"
          onClick={() => onMarkFinished(appointment.id)}
        >
          <span className="btn-icon">✔️</span>
          <span className="btn-text">Mark as Finished</span>
          <div className="btn-shine"></div>
        </button>
      )}

      {appointment.status === "service_done" && (
        <div className="waiting-badge">
          <div className="waiting-spinner"></div>
          <span>Waiting for payment collection...</span>
        </div>
      )}
    </div>
  );
}

function EmptyState({ viewMode }) {
  return (
    <div className="empty-state-modern">
      <div className="empty-illustration">
        <div className="illustration-circle">
          <div className="rotating-icons">
            <span className="rotating-icon" style={{ '--delay': '0s' }}>✂️</span>
            <span className="rotating-icon" style={{ '--delay': '0.5s' }}>💇</span>
            <span className="rotating-icon" style={{ '--delay': '1s' }}>💅</span>
            <span className="rotating-icon" style={{ '--delay': '1.5s' }}>✨</span>
          </div>
          <div className="center-icon">
            {viewMode === "history" ? "📜" : "📋"}
          </div>
        </div>
      </div>
      
      <h3 className="empty-title">
        {viewMode === "history" ? "No Completed Appointments" : "No Active Tasks"}
      </h3>
      <p className="empty-text">
        {viewMode === "history" 
          ? "Your completed appointments will appear here" 
          : "You don't have any active appointments right now"}
      </p>
    </div>
  );
}

