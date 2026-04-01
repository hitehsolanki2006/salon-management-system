import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./BookAppointment.css";

export default function BookAppointment({ cart, totalAmount, onSuccess }) {
  const { user } = useAuth();
  const { openSuccess, openError, openConfirm } = useModal();
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!selectedDate || cart.length === 0) {
      openError("Please select a date and time for your appointment", "Missing Details");
      return;
    }

    openConfirm(
      `Book appointment for ${selectedDate.toLocaleDateString()} at ${selectedDate.toLocaleTimeString()}?`,
      async () => {
        setLoading(true);

        try {
          // Insert appointment
          const { data: appointmentData, error: apptError } = await supabase
            .from("appointments")
            .insert({
              customer_id: user.id,
              appointment_time: selectedDate.toISOString(),
              total_amount: totalAmount,
              status: "pending"
            })
            .select()
            .single();

          if (apptError) throw apptError;

          // Insert services
          const servicesPayload = cart.map((s) => ({
            appointment_id: appointmentData.id,
            service_id: s.id,
            price: s.final_price
          }));

          const { error: serviceError } = await supabase
            .from("appointment_services")
            .insert(servicesPayload);

          if (serviceError) throw serviceError;

          // Success - trigger callback
          openSuccess("Your appointment has been booked successfully! Awaiting approval.", "Booking Confirmed");
          
          // Clear form and trigger parent callback
          setSelectedDate(null);
          if (onSuccess) onSuccess();

        } catch (error) {
          openError(error.message, "Booking Failed");
        } finally {
          setLoading(false);
        }
      },
      "Confirm Booking"
    );
  };

  return (
    <div className="book-appointment">
      <div className="appointment-header">
        <h3>📅 Book Your Appointment</h3>
      </div>

      <div className="appointment-form">
        <div className="form-group">
          <label>Select Date & Time</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
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

        <button
          className="btn-confirm-booking"
          onClick={handleBook}
          disabled={loading || !selectedDate || cart.length === 0}
        >
          {loading ? (
            <>
              <span className="booking-spinner"></span>
              Processing...
            </>
          ) : (
            <>
              <span className="booking-icon">✓</span>
              Confirm Booking
            </>
          )}
        </button>

        {!selectedDate && cart.length > 0 && (
          <p className="booking-hint">Please select a date and time to proceed</p>
        )}
      </div>
    </div>
  );
}