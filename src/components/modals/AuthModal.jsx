import { useState } from "react";
import Login from "../../pages/Login";
import Register from "../../pages/Register";

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState("login");

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Click propagation stop prevents modal from closing when clicking inside */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn">✕</button>

        {/* We pass a prop 'isModal' so the pages can hide their extra CSS */}
        {mode === "login" ? (
          <Login isModal={true} onSuccess={onClose} />
        ) : (
          <Register isModal={true} onSuccess={onClose} />
        )}

        <div className="modal-footer">
          {mode === "login" ? (
            <p>
              New here?{" "}
              <span onClick={() => setMode("register")} className="modal-link">
                Create an account
              </span>
            </p>
          ) : (
            <p>
              Already a member?{" "}
              <span onClick={() => setMode("login")} className="modal-link">
                Login now
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}