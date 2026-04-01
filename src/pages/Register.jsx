import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext";
import "../style/Auth.css";

// ✅ Added isModal and onSuccess props
export default function Register({ isModal = false, onSuccess }) {
  const navigate = useNavigate();
  const { openSuccess, openError } = useModal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) {
      openError(error.message, "Registration Error");
    } else if (data.user) {
      openSuccess("Your account has been created successfully! ", "Welcome!");
      
      setTimeout(() => {
        // ✅ Close modal if applicable
        if (isModal && onSuccess) onSuccess();
        navigate("/dashboard");
      }, 2000);
    }
    setLoading(false);
  };

  return (
    /* ✅ Conditional wrapper class */
    <div className={isModal ? "auth-modal-internal" : "auth-container"}>
      <div className="auth-card">
        {/* ✅ Hide header if in modal */}
        {!isModal && (
          <div className="auth-header">
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join SalonFlow today</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="auth-input"
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </div>

          <button className="auth-button" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        {/* ✅ Hide redirect link if in modal */}
        {!isModal && (
          <div className="auth-redirect">
            <p>Already have an account?</p>
            <Link to="/login">Login here</Link>
          </div>
        )}
      </div>
    </div>
  );
}