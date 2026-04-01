import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../style/Auth.css";

export default function ProfileNotFound() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/register");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "50px", marginBottom: "10px" }}>❌</div>
          <h2 className="auth-title">Profile Not Found</h2>
          <p className="auth-subtitle">Data Error</p>
        </div>

        <div className="auth-form" style={{ textAlign: "center", color: "#ccc" }}>
          <p>We couldn't find your profile details in our records. Your account may have been removed.</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
            <button 
              className="auth-button" 
              onClick={() => navigate("/contact")}
            >
              Contact Support
            </button>
            
            <button 
              className="auth-button" 
              style={{ background: "#444" }} 
              onClick={handleLogout}
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}