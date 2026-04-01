import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext"; 
import "../style/Auth.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { openSuccess, openError, openConfirm } = useModal(); 

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        navigate("/login");
        return;
      }

      // Check if account is deleted
      const { data: profile } = await supabase
        .from("users")
        .select("status")
        .eq("id", data.session.user.id)
        .single();

      if (profile?.status === 'deleted') {
        openError("This account is no longer active.");
        await supabase.auth.signOut();
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate, openError]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      return openError("Passwords do not match!");
    }

    if (password.length < 6) {
      return openError("Password must be at least 6 characters.");
    }

    // Matching your ModalContext: openConfirm(message, onConfirm, title)
    openConfirm(
      "Are you sure you want to change your password and sign in?",
      async () => {
        try {
          setLoading(true);
          const { error } = await supabase.auth.updateUser({ password });

          if (error) {
            openError(error.message);
          } else {
            setSuccess(true);
            openSuccess("Password updated! Logging you in...");
            
            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
              navigate("/dashboard");
            }, 1500);
          }
        } catch {
          openError("An unexpected error occurred.");
        } finally {
          setLoading(false);
        }
      },
      "Confirm Reset" // This is the title (3rd argument)
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>

        {!success ? (
          <form onSubmit={handleReset} className="auth-form">
            <input
              type="password"
              placeholder="New password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirm new password"
              className="auth-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <button className="auth-button" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <p>Processing your login...</p>
          </div>
        )}
      </div>
    </div>
  );
}