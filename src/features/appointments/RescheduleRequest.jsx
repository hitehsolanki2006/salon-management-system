import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useModal } from "../../context/ModalContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../style/RescheduleRequest.css";

export default function RescheduleRequest({ appointmentId, onRescheduled }) {
  const { openSuccess, openError, openInfo, openConfirm } = useModal();
  const [newTime, setNewTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const requestReschedule = async () => {
    if (!newTime) {
      openInfo("Please select new date & time", "Date Required");
      return;
    }

    openConfirm(
      `Request reschedule to ${newTime.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} at ${newTime.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}?`,
      async () => {
        setLoading(true);

        const { error } = await supabase
          .from("appointments")
          .update({
            appointment_time: newTime.toISOString(),
            status: "reschedule_requested"
          })
          .eq("id", appointmentId);

        setLoading(false);

        if (error) {
          openError(error.message, "Failed to Reschedule");
          return;
        }

        openSuccess("Reschedule request sent successfully! Waiting for receptionist approval.", "Request Sent");
        setShowForm(false);
        setNewTime(null);
        onRescheduled();
      },
      "Confirm Reschedule Request"
    );
  };

  if (!showForm) {
    return (
      <button
        className="btn-reschedule-toggle"
        onClick={() => setShowForm(true)}
      >
        🔄 Request Reschedule
      </button>
    );
  }

  return (
    <div className="reschedule-form">
      <h4 className="reschedule-title">Reschedule Appointment</h4>
      <p className="reschedule-subtitle">SELECT NEW DATE & TIME</p>
      
      <div className="form-group">
        <DatePicker
          selected={newTime}
          onChange={(date) => setNewTime(date)}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={30}
          timeCaption="Time"
          dateFormat="MMMM d, yyyy h:mm aa"
          minDate={new Date()}
          placeholderText="Click to select date and time"
          className="datetime-picker-input"
          autoComplete="off"
          inline={false}
        />
      </div>

      <div className="form-actions">
        <button
          className="btn-submit"
          onClick={requestReschedule}
          disabled={loading || !newTime}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Sending...
            </>
          ) : (
            "Submit Request"
          )}
        </button>
        <button 
          className="btn-cancel" 
          onClick={() => {
            setShowForm(false);
            setNewTime(null);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}