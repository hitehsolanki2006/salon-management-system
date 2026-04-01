import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useModal } from "../../context/ModalContext";
import "../../style/RateService.css";

export default function RateService({ appointmentId, staffId, onRated }) {
  const { openSuccess, openError } = useModal();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const submitRating = async () => {
    if (!staffId) {
      openError("Staff ID is missing. Cannot submit rating.", "Invalid Data");
      return;
    }

    if (!appointmentId) {
      openError("Appointment ID is missing. Cannot submit rating.", "Invalid Data");
      return;
    }

    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      openError("You must be logged in to submit a rating.", "Authentication Required");
      setLoading(false);
      return;
    }

    console.log("Submitting rating:", {
      appointment_id: appointmentId,
      staff_id: staffId,
      rating,
      comment,
      customer_id: user.id
    });

    const { data, error } = await supabase.from("feedback").insert({
      appointment_id: appointmentId,
      staff_id: staffId,
      rating,
      comment
    }).select();

    setLoading(false);

    if (error) {
      console.error("Rating submission error:", error);
      openError(`Failed to submit rating: ${error.message}`, "Submission Failed");
      return;
    }

    console.log("Rating submitted successfully:", data);
    console.log("Trigger should now update staff avg_rating and rating_count");
    openSuccess("Thank you for your feedback! Your rating has been recorded.", "Rating Submitted");
    setShowForm(false);
    if (onRated) onRated();
  };

  if (!showForm) {
    return (
      <button className="btn-rate-toggle" onClick={() => setShowForm(true)}>
        ⭐ Rate Service
      </button>
    );
  }

  return (
    <div className="rate-service-form">
      <h4 className="rate-title">Rate Your Experience</h4>

      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-button ${
              star <= (hoveredRating || rating) ? "active" : ""
            }`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            ⭐
          </button>
        ))}
      </div>
      <p className="rating-label">{rating} out of 5 stars</p>

      <div className="form-group">
        <label>Your Feedback (Optional)</label>
        <textarea
          placeholder="Share your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="4"
          className="feedback-textarea"
        />
      </div>

      <div className="form-actions">
        <button className="btn-submit" onClick={submitRating} disabled={loading}>
          {loading ? "Submitting..." : "Submit Rating"}
        </button>
        <button className="btn-cancel" onClick={() => setShowForm(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}