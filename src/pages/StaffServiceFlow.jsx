import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext";
import "../style/AppointmentFlow.css";

const STEPS = [
  { id: "approved", label: "Confirmed", icon: "✅" },
  { id: "in_progress", label: "In Service", icon: "✂️" },
  { id: "service_done", label: "Done", icon: "✨" },
  { id: "completed", label: "Paid", icon: "💰" }
];

export default function StaffServiceFlow() {
  const { openConfirm, openSuccess, openError } = useModal();
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState("active"); 
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("appointments")
      .select(`
        *,
        customer:users!appointments_customer_id_fkey (full_name, phone),
        appointment_services(services(name)),
        feedback(rating, comment)
      `)
      .eq("staff_id", user.id);

    if (view === "active") {
      query = query.in("status", ["approved", "in_progress", "service_done"]);
    } else {
      query = query.eq("status", "completed").order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (!error) setAppointments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('staff-live-tracker')
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => fetchData())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [view]);

  const updateStatus = async (id, nextStatus) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) openError(error.message);
    else openSuccess(`Status updated to ${nextStatus.replace("_", " ")}!`);
  };

  if (loading) return <div className="flow-loader">Loading Jenkins Pipeline...</div>;

  return (
    <div className="flow-master-container">
      <div className="flow-tabs">
        <button className={view === "active" ? "active" : ""} onClick={() => setView("active")}>My Active Flow</button>
        <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}>Ratings & History</button>
      </div>

      <div className="staff-pipeline-list">
        {appointments.length === 0 ? (
          <div className="empty-msg">No appointments assigned.</div>
        ) : (
          appointments.map((appt) => {
            const currentIdx = STEPS.findIndex(s => s.id === appt.status);
            
            return (
              <div key={appt.id} className="flow-card-staff jenkins-theme">
                <div className="card-top">
                  <div>
                    <h3>{appt.customer?.full_name}</h3>
                    <a href={`tel:${appt.customer?.phone}`} className="phone-link">📞 {appt.customer?.phone}</a>
                  </div>
                  <div className="time-badge">{new Date(appt.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>

                {/* THE JENKINS PIPELINE */}
                <div className="pipeline-container">
                  <div className="main-line">
                    <div className="fill-line" style={{ width: `${(currentIdx / (STEPS.length - 1)) * 100}%` }}></div>
                  </div>
                  <div className="nodes-row">
                    {STEPS.map((step, i) => (
                      <div key={step.id} className={`node-box ${i <= currentIdx ? 'active' : ''} ${i === currentIdx ? 'current' : ''}`}>
                        <div className="node-icon">{i < currentIdx ? "✓" : step.icon}</div>
                        <span className="node-label">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SERVICE LIST */}
                <div className="service-tags-box">
                  {appt.appointment_services?.map((s, i) => (
                    <span key={i} className="service-tag-staff">{s.services.name}</span>
                  ))}
                </div>

                {/* ACTION BUTTONS */}
                {view === "active" && (
                  <div className="staff-actions">
                    {appt.status === "approved" && (
                      <button className="start-svc-btn" onClick={() => updateStatus(appt.id, "in_progress")}>
                        ▶ Start Service
                      </button>
                    )}
                    {appt.status === "in_progress" && (
                      <button className="finish-svc-btn" onClick={() => openConfirm("Mark this service as finished?", () => updateStatus(appt.id, "service_done"))}>
                        🏁 Finish Service
                      </button>
                    )}
                    {appt.status === "service_done" && (
                      <div className="wait-notif">⏳ Customer is at the counter for payment</div>
                    )}
                  </div>
                )}

                {/* RATING DISPLAY (History Only) */}
                {view === "history" && appt.feedback?.[0] && (
                  <div className="staff-feedback-result">
                    <div className="rating-stars">{"⭐".repeat(appt.feedback[0].rating)}</div>
                    <p className="rating-comment">"{appt.feedback[0].comment}"</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}