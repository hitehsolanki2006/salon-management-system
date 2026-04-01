import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading: authLoading } = useAuth(); // Auth user from context
  const [profile, setProfile] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    // If auth state is still loading, wait.
    if (authLoading) return;

    // If no user is logged in, stop loading.
    if (!user) {
      setDbLoading(false);
      return;
    }

    const fetchStatusAndRole = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("role, blocked")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user status:", error);
        setProfile(null);
      } else if (!data) {
        // User exists in Auth but not in the Users table
        setProfile({ deleted: true });
      } else {
        setProfile(data);
      }
      setDbLoading(false);
    };

    fetchStatusAndRole();
  }, [user, authLoading]);

  // 1. Show loading while checking Auth and Database
  if (authLoading || dbLoading) {
    return (
      <div className="auth-container">
        <span className="booking-spinner"></span>
        <p style={{ color: "white", marginTop: "10px" }}>Verifying Permissions...</p>
      </div>
    );
  }

  // 2. 🔐 Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. ❌ Redirect if profile was deleted from DB
  if (profile?.deleted) {
    return <Navigate to="/profile-not-found" replace />;
  }

  // 4. 🚫 BLOCKED LOGIC: Redirect to blocked page if blocked is true
  if (profile?.blocked) {
    return <Navigate to="/blocked" replace />;
  }

  // 5. 🛡️ ROLE LOGIC: Redirect home if role is not allowed for this route
  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/" replace />;
  }

  // 6. ✅ SUCCESS: User is logged in, not blocked, and has the right role
  return <Outlet />;
}