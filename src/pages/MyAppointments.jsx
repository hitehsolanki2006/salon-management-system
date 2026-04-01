import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import RescheduleRequest from "../features/appointments/RescheduleRequest";
import RateService from "../features/feedback/RateService";
import UserReportPDF from "../features/reports/UserReportPDF";
import "../style/MyAppointments.css";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [ratedMap, setRatedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchMyAppointments = async () => {
    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_time,
        status,
        total_amount,
        staff:users!appointments_staff_id_fkey(
          id,
          full_name
        ),
        appointment_services(
          services(
            id,
            name,
            price
          )
        ),
        feedback(id)
      `)
      .eq("customer_id", user.id)
      .order("appointment_time", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Track rated appointments
    const rated = {};
    data.forEach((a) => {
      rated[a.id] = (a.feedback?.length || 0) > 0;
    });

    setRatedMap(rated);
    setAppointments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const getFilteredAppointments = () => {
    if (filter === "all") return appointments;
    return appointments.filter((a) => a.status === filter);
  };

  const filteredAppointments = getFilteredAppointments();

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: "status-pending",
      approved: "status-approved",
      completed: "status-completed",
      cancelled: "status-cancelled",
      reschedule_requested: "status-reschedule"
    };
    return statusMap[status] || "status-default";
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      pending: "⏳",
      approved: "✅",
      completed: "🎉",
      cancelled: "❌",
      reschedule_requested: "🔄"
    };
    return iconMap[status] || "📅";
  };

  if (loading) {
    return (
      <div className="appointments-loading">
        <div className="loading-spinner"></div>
        <p>Loading your appointments...</p>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <div className="header-content">
          <h2 className="appointments-title">My Appointments</h2>
          <p className="appointments-subtitle">
            View and manage your salon appointments
          </p>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({appointments.length})
        </button>
        <button
          className={`filter-tab ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending ({appointments.filter((a) => a.status === "pending").length})
        </button>
        <button
          className={`filter-tab ${filter === "approved" ? "active" : ""}`}
          onClick={() => setFilter("approved")}
        >
          Approved ({appointments.filter((a) => a.status === "approved").length})
        </button>
        <button
          className={`filter-tab ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Completed ({appointments.filter((a) => a.status === "completed").length})
        </button>
      </div>

      {/* APPOINTMENTS LIST */}
      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <p>No appointments found</p>
          <span className="empty-subtitle">
            {filter === "all"
              ? "You haven't booked any appointments yet"
              : `No ${filter} appointments`}
          </span>
        </div>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map((a) => (
            <div key={a.id} className="appointment-card">
              <div className="card-header">
                <div className="appointment-date">
                  <span className="date-icon">📅</span>
                  <div className="date-info">
                    <span className="date-text">
                      {new Date(a.appointment_time).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                    <span className="time-text">
                      {new Date(a.appointment_time).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(a.status)}`}>
                  {getStatusIcon(a.status)} {a.status.replace("_", " ")}
                </span>
              </div>

              <div className="card-body">
                <div className="appointment-info">
                  <div className="info-item">
                    <span className="info-label">Staff Member</span>
                    <span className="info-value">{a.staff?.full_name || "Not assigned"}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Total Amount</span>
                    <span className="info-value price">₹{a.total_amount}</span>
                  </div>
                </div>

                {/* SERVICES */}
                <div className="services-section">
                  <h4 className="services-title">Services</h4>
                  <ul className="services-list">
                    {a.appointment_services?.map((as, i) => (
                      <li key={i} className="service-item">
                        <span className="service-name">{as.services?.name}</span>
                        <span className="service-price">₹{as.services?.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card-actions">
                {/* RESCHEDULE */}
                {(a.status === "pending" || a.status === "approved") && (
                  <RescheduleRequest
                    appointmentId={a.id}
                    onRescheduled={fetchMyAppointments}
                  />
                )}

                {/* PDF DOWNLOAD */}
                {a.status === "completed" && <UserReportPDF appointment={a} />}

                {/* RATING */}
                {a.status === "completed" && !ratedMap[a.id] && (
                  <RateService
                    appointmentId={a.id}
                    staffId={a.staff?.id}
                    onRated={fetchMyAppointments}
                  />
                )}

                {a.status === "completed" && ratedMap[a.id] && (
                  <div className="rated-badge">
                    <span className="rated-icon">✓</span>
                    You rated this service
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}