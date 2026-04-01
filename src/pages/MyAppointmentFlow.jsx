import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import UserReportPDF from "../features/reports/UserReportPDF";
import RateService from "../features/feedback/RateService";
import PaymentModal from "../features/payments/PaymentModal";
import "../style/AppointmentFlow.css";

const STEPS = [
  { 
    id: "pending", 
    label: "Booking Received", 
    icon: "📅",
    color: "#f39c12",
    description: "Your appointment request has been received",
    animation: "bounce"
  },
  { 
    id: "approved", 
    label: "Confirmed", 
    icon: "✅",
    color: "#3498db",
    description: "Appointment confirmed by salon",
    animation: "checkmark"
  },
  { 
    id: "in_progress", 
    label: "Service Started", 
    icon: "✂️",
    color: "#9b59b6",
    description: "Your beautification journey begins",
    animation: "scissors"
  },
  { 
    id: "service_done", 
    label: "Service Complete", 
    icon: "✨",
    color: "#27ae60",
    description: "Looking fabulous! Ready for payment",
    animation: "sparkle"
  },
  { 
    id: "completed", 
    label: "All Done", 
    icon: "🎉",
    color: "#FFD700",
    description: "Thank you! Visit complete",
    animation: "celebration"
  }
];

export default function MyAppointmentFlow() {
  const [activeAppt, setActiveAppt] = useState(null);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("live");
  const [loading, setLoading] = useState(true);
  const [celebrationActive, setCelebrationActive] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        staff:users!appointments_staff_id_fkey(id, full_name, phone, avatar_url),
        appointment_services(price, services(name, duration)),
        feedback(rating, comment)
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      const live = data.find(a => !["completed", "cancelled"].includes(a.status));
      setActiveAppt(live);
      setHistory(data.filter(a => a.status === "completed"));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('flow-sync')
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "appointments" 
      }, (payload) => {
        fetchData();
        // Trigger celebration when completed
        if (payload.new?.status === "completed") {
          setCelebrationActive(true);
          setTimeout(() => setCelebrationActive(false), 5000);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  if (loading) {
    return (
      <div className="flow-loader">
        <div className="loader-animation">
          <div className="salon-chair">💺</div>
          <div className="loading-text">Loading your salon journey...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-master-container">
      {celebrationActive && <CelebrationEffect />}
      
      <div className="flow-tabs">
        <button 
          className={view === "live" ? "active" : ""} 
          onClick={() => setView("live")}
        >
          <span className="tab-icon">🚀</span>
          <span>Live Tracker</span>
        </button>
        <button 
          className={view === "history" ? "active" : ""} 
          onClick={() => setView("history")}
        >
          <span className="tab-icon">📜</span>
          <span>Past Visits</span>
        </button>
      </div>

      {view === "live" ? (
        activeAppt ? (
          <LiveView 
            activeAppt={activeAppt} 
            onRefresh={fetchData} 
            navigate={navigate} 
          />
        ) : (
          <EmptyLiveState navigate={navigate} />
        )
      ) : (
        <HistoryView history={history} onRefresh={fetchData} />
      )}
    </div>
  );
}

const confettiPieces = [...Array(50)].map((_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 3}s`,
  color: ['#FFD700', '#FF69B4', '#9B59B6', '#3498db'][Math.floor(Math.random() * 4)]
}));

function CelebrationEffect() {
  return (
    <div className="celebration-overlay">
      <div className="confetti">
        {confettiPieces.map((piece) => (
          <div key={piece.id} className="confetti-piece" style={{
            left: piece.left,
            animationDelay: piece.delay,
            background: piece.color
          }} />
        ))}
      </div>
      <div className="celebration-message">
        <div className="celebration-icon">🎉</div>
        <h2>All Done!</h2>
        <p>Thank you for choosing us!</p>
      </div>
    </div>
  );
}

function LiveView({ activeAppt, onRefresh, navigate }) {
  const { openConfirm, openError, openSuccess } = useModal();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const currentIndex = STEPS.findIndex(s => s.id === activeAppt.status);
  const currentStep = STEPS[currentIndex];
  const isCancelled = activeAppt.status === "cancelled";

  const isCancellable = () => {
    if (isCancelled || !["pending", "approved"].includes(activeAppt.status)) return false;
    const now = new Date();
    const apptTime = new Date(activeAppt.appointment_time);
    const diffInHours = (apptTime - now) / (1000 * 60 * 60);
    return diffInHours >= 24;
  };

  const handleCancel = async () => {
    openConfirm(
      "Are you sure you want to cancel this appointment? This action cannot be undone.",
      async () => {
        const { error } = await supabase
          .from("appointments")
          .update({ status: "cancelled" })
          .eq("id", activeAppt.id);

        if (error) {
          openError(error.message, "Failed to Cancel");
        } else {
          openSuccess("Appointment cancelled successfully.", "Cancelled");
          onRefresh();
        }
      },
      "Cancel Appointment"
    );
  };

  // Calculate estimated time
  const totalDuration = activeAppt.appointment_services?.reduce(
    (sum, as) => sum + (as.services?.duration || 30), 
    0
  ) || 60;

  return (
    <div className="live-tracker-container">
      {/* HERO SECTION */}
      <div className="hero-card">
        <div className="hero-bg-animation">
          <div className="floating-icon icon-1">✂️</div>
          <div className="floating-icon icon-2">💇</div>
          <div className="floating-icon icon-3">💅</div>
          <div className="floating-icon icon-4">✨</div>
        </div>
        
        <div className="hero-content">
          <div className="status-indicator">
            <div className="status-pulse" style={{ background: currentStep?.color }}></div>
            <span className="status-text" style={{ color: currentStep?.color }}>
              {currentStep?.label}
            </span>
          </div>
          
          <h1 className="hero-title">Your Appointment Journey</h1>
          <p className="hero-subtitle">{currentStep?.description}</p>
          
          <div className="appointment-meta">
            <div className="meta-item">
              <span className="meta-icon">📅</span>
              <div>
                <span className="meta-label">Date</span>
                <span className="meta-value">
                  {activeAppt.appointment_time 
                    ? new Date(activeAppt.appointment_time).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Date not set'
                  }
                </span>
              </div>
            </div>
            
            <div className="meta-item">
              <span className="meta-icon">⏰</span>
              <div>
                <span className="meta-label">Time</span>
                <span className="meta-value">
                  {activeAppt.appointment_time 
                    ? new Date(activeAppt.appointment_time).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                    : 'Time not set'
                  }
                </span>
              </div>
            </div>
            
            <div className="meta-item">
              <span className="meta-icon">⏱️</span>
              <div>
                <span className="meta-label">Duration</span>
                <span className="meta-value">{totalDuration} mins</span>
              </div>
            </div>
            
            <div className="meta-item">
              <span className="meta-icon">💰</span>
              <div>
                <span className="meta-label">Amount</span>
                <span className="meta-value">₹{activeAppt.total_amount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS FLOW */}
      <div className="progress-flow-card">
        <h2 className="section-title">
          <span className="title-icon">🚀</span>
          Progress Timeline
        </h2>
        
        <div className="flow-timeline">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isUpcoming = index > currentIndex;
            
            return (
              <div key={step.id} className="timeline-step-wrapper">
                {/* Step Node */}
                <div className={`timeline-step 
                  ${isCompleted ? 'completed' : ''} 
                  ${isCurrent ? 'current' : ''} 
                  ${isUpcoming ? 'upcoming' : ''}`}
                  style={{ '--step-color': step.color }}
                >
                  <div className="step-connector">
                    {index < STEPS.length - 1 && (
                      <div className={`connector-line ${isCompleted ? 'filled' : ''}`}>
                        <div className="connector-fill"></div>
                        {isCompleted && (
                          <div className="flow-particles">
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="step-content">
                    <div className="step-circle">
                      {isCompleted && (
                        <>
                          <div className="success-checkmark">✓</div>
                          <div className="success-ring"></div>
                        </>
                      )}
                      {isCurrent && (
                        <>
                          <div className={`step-icon-animated ${step.animation}`}>
                            {step.icon}
                          </div>
                          <div className="pulse-ring"></div>
                          <div className="pulse-ring-2"></div>
                        </>
                      )}
                      {isUpcoming && (
                        <div className="step-number">{index + 1}</div>
                      )}
                    </div>
                    
                    <div className="step-info">
                      <h3 className="step-title">{step.label}</h3>
                      <p className="step-desc">{step.description}</p>
                      
                      {isCompleted && (
                        <div className="completion-badge">
                          <span className="badge-icon">✓</span>
                          Completed
                        </div>
                      )}
                      
                      {isCurrent && (
                        <div className="current-badge">
                          <div className="badge-spinner"></div>
                          In Progress...
                        </div>
                      )}
                      
                      {isUpcoming && (
                        <div className="upcoming-badge">
                          <span className="badge-icon">⏳</span>
                          Upcoming
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STAFF & SERVICES GRID */}
      <div className="info-grid">
        {/* Staff Card */}
        <div className="info-card staff-card">
          <div className="card-header-decorated">
            <h3 className="card-title">
              <span className="title-icon">👨‍💼</span>
              Your Specialist
            </h3>
          </div>
          
          <div className="staff-profile-modern">
            <div className="staff-avatar-wrapper">
              <div className="avatar-glow"></div>
              {activeAppt.staff?.avatar_url ? (
                <img src={activeAppt.staff.avatar_url} alt={activeAppt.staff.full_name} className="staff-avatar" />
              ) : (
                <div className="staff-avatar-placeholder">
                  {activeAppt.staff?.full_name?.charAt(0) || 'S'}
                </div>
              )}
              <div className="online-indicator"></div>
            </div>
            
            <div className="staff-details">
              <h4 className="staff-name">{activeAppt.staff?.full_name || "Staff Member"}</h4>
              <p className="staff-role">Professional Stylist</p>
              
              {activeAppt.staff?.phone && (
                <a href={`tel:${activeAppt.staff.phone}`} className="contact-btn">
                  <span className="btn-icon">📞</span>
                  <span>Call Now</span>
                  <div className="btn-shine"></div>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Services Card */}
        <div className="info-card services-card">
          <div className="card-header-decorated">
            <h3 className="card-title">
              <span className="title-icon">✂️</span>
              Services Booked
            </h3>
          </div>
          
          <div className="services-list-modern">
            {activeAppt.appointment_services?.map((as, idx) => (
              <div key={idx} className="service-item-modern">
                <div className="service-icon-wrapper">
                  <div className="service-icon">✨</div>
                </div>
                <div className="service-details">
                  <span className="service-name">{as.services?.name}</span>
                  <span className="service-duration">
                    ⏱️ {as.services?.duration || 30} mins
                  </span>
                </div>
                <span className="service-price">₹{as.price}</span>
              </div>
            ))}
            
            <div className="services-total">
              <span>Total Amount</span>
              <span className="total-price">₹{activeAppt.total_amount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="action-section">
        {activeAppt.status === "service_done" && (
          <button className="action-btn-primary" onClick={() => setShowPaymentModal(true)}>
            <span className="btn-icon">💳</span>
            <span className="btn-text">Proceed to Payment</span>
            <div className="btn-glow"></div>
          </button>
        )}

        {isCancellable() && (
          <button className="action-btn-danger" onClick={handleCancel}>
            <span className="btn-icon">🚫</span>
            <span className="btn-text">Cancel Appointment</span>
          </button>
        )}

        {["pending", "approved"].includes(activeAppt.status) && !isCancellable() && (
          <div className="lock-notice">
            <span className="notice-icon">⚠️</span>
            <span>Cancellation locked (Less than 24 hours remaining)</span>
          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <PaymentModal 
          appointment={{
            ...activeAppt,
            customer: { full_name: "You" }
          }} 
          onClose={() => {
            setShowPaymentModal(false);
          }}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function EmptyLiveState({ navigate }) {
  return (
    <div className="empty-state-animated">
      <div className="empty-illustration">
        <div className="illustration-circle">
          <div className="rotating-icons">
            <span className="rotating-icon" style={{ '--delay': '0s' }}>✂️</span>
            <span className="rotating-icon" style={{ '--delay': '0.5s' }}>💇</span>
            <span className="rotating-icon" style={{ '--delay': '1s' }}>💅</span>
            <span className="rotating-icon" style={{ '--delay': '1.5s' }}>✨</span>
          </div>
          <div className="center-icon">💺</div>
        </div>
      </div>
      
      <h3 className="empty-title">No Active Appointments</h3>
      <p className="empty-text">You haven't booked any service yet. Ready for a makeover?</p>
      
      <button className="book-service-btn" onClick={() => navigate("/services")}>
        <span className="btn-icon">✂️</span>
        <span className="btn-text">Book Your First Service</span>
        <div className="btn-sparkle"></div>
      </button>
    </div>
  );
}

function HistoryView({ history, onRefresh }) {
  if (history.length === 0) {
    return (
      <div className="empty-history">
        <span className="empty-icon">📜</span>
        <h3>No Past Visits</h3>
        <p>Your completed appointments will appear here</p>
      </div>
    );
  }

  return (
    <div className="history-grid">
      {history.map((appt, idx) => (
        <HistoryCard key={appt.id} appt={appt} onRefresh={onRefresh} index={idx} />
      ))}
    </div>
  );
}

function HistoryCard({ appt, onRefresh, index }) {
  const userRating = appt.feedback?.[0]?.rating;
  
  return (
    <div className="history-card-modern" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="history-ribbon">COMPLETED</div>
      
      <div className="history-header">
        <div className="history-date">
          <span className="date-icon">📅</span>
          <div>
            <span className="date-text">
              {appt.appointment_time 
                ? new Date(appt.appointment_time).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Date not set'
              }
            </span>
            <span className="time-text">
              {appt.appointment_time 
                ? new Date(appt.appointment_time).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })
                : 'Time not set'
              }
            </span>
          </div>
        </div>
        
        <div className="history-amount">
          <span className="amount-label">Total</span>
          <span className="amount-value">₹{appt.total_amount}</span>
        </div>
      </div>
      
      <div className="history-staff">
        <div className="staff-mini-avatar">
          {appt.staff?.full_name?.charAt(0) || 'S'}
        </div>
        <span>with {appt.staff?.full_name}</span>
      </div>
      
      <div className="history-services">
        {appt.appointment_services?.map((as, idx) => (
          <span key={idx} className="history-service-tag">
            {as.services?.name}
          </span>
        ))}
      </div>
      
      <div className="history-footer">
        <UserReportPDF appointment={appt} />
        
        {userRating ? (
          <div className="rating-display">
            <div className="stars">{"⭐".repeat(userRating)}</div>
            <span className="rating-text">{userRating}/5</span>
          </div>
        ) : (
          <RateService 
            appointmentId={appt.id} 
            staffId={appt.staff?.id} 
            onRated={onRefresh} 
          />
        )}
      </div>
    </div>
  );
}