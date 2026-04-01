import { useNavigate } from "react-router-dom";
import "../style/Auth.css";

export default function BlockedUser() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "50px", marginBottom: "10px" }}>🚫</div>
          <h2 className="auth-title">Account Blocked</h2>
          <p className="auth-subtitle">Access Denied</p>
        </div>

        <div className="auth-form" style={{ textAlign: "center", color: "#ccc" }}>
          <p>Your account has been blocked by the administrator for violating salon policies.</p>
          <p style={{ marginTop: "10px" }}>Please contact our support team to appeal this decision or for more information.</p>
          
          <button 
            className="auth-button" 
            style={{ marginTop: "20px" }}
            onClick={() => navigate("/contact")}
          >
            Contact Support
          </button>
        </div>

        <div className="auth-redirect">
          <button 
            onClick={() => window.location.href = "/"} 
            className="redirect-link"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}