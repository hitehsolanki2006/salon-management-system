import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ✅ Added useNavigate
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext"; // ✅ Added
import "../style/Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { openSuccess, openError } = useModal(); // ✅ Added
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // const handleForgot = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);

  //   const { error } = await supabase.auth.resetPasswordForEmail(email, {
  //     redirectTo: `${window.location.origin}/reset-password`,
  //   });

  //   if (error) {
  //     openError(error.message, "Reset Failed");
  //   } else {
  //     // ✅ Inform user and redirect
  //     openSuccess(`A reset link has been sent to ${email}. Please check your inbox.`, "Email Sent");
      
  //     setTimeout(() => {
  //       navigate("/login");
  //     }, 3000);
  //   }

  //   setLoading(false);
  // };
const handleForgot = async (e) => {
  e.preventDefault();
  setLoading(true);

  // Always send request to Supabase Auth
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    openError("Unable to process request. Please try again.", "Reset Failed");
    setLoading(false);
    return;
  }

  // Show same success message always (security)
  openSuccess(
    "If this email is registered, a password reset link has been sent.",
    "Check Your Email"
  );

  setTimeout(() => navigate("/login"), 3000);
  setLoading(false);
};

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleForgot} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          <button className="auth-button" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-redirect">
          <Link to="/login" className="redirect-link">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}