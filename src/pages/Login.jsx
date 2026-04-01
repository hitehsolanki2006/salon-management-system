import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext"; // ✅ Step 1: Import the hook
import "../style/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { openSuccess, openError } = useModal(); // ✅ Step 2: Destructure the functions
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // const handleLogin = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);

  //   const { error } = await supabase.auth.signInWithPassword({
  //     email,
  //     password,
  //   });

  //   if (error) {
  //     // ✅ Step 3: Replace alert with openError
  //     openError(error.message, "Login Failed");
  //   } else {
  //     // ✅ Step 4: Optional - show success modal before redirect
  //     // You can either redirect immediately OR show a message first
  //     openSuccess("Welcome back! Redirecting to your dashboard...", "Login Successful");
      
  //     // Delay navigation slightly so user sees the success message
  //     setTimeout(() => {
  //       navigate("/dashboard", { replace: true });
  //     }, 1500);
  //   }

  //   setLoading(false);
  // };

  const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    openError(error.message, "Login Failed");
    setLoading(false);
    return;
  }

  // Fetch the user's role to decide where to send them
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  openSuccess("Welcome back!", "Login Successful");

  setTimeout(() => {
    // Decision logic
    if (["admin", "staff", "receptionist"].includes(profile?.role)) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/my-appointments", { replace: true });
    }
  }, 1500);

  setLoading(false);
};
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Login to SalonFlow</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🔒" : "👁️"}
              </button>
            </div>
          </div>

          <Link to="/forgot-password" className="forgot-link">
            Forgot Password?
          </Link>

          <button className="auth-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-redirect">
          <p>Don't have an account?</p>
          <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}