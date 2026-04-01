import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

import ReceptionistDashboard from "../roles/ReceptionistDashboard";
import StaffDashboard from "../roles/StaffDashboard";
import AdminDashboard from "../roles/AdminDashboard";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Role fetch error:", error);
        setRole(null);
      } else {
        setRole(data?.role || null);
      }

      setLoading(false);
    };

    fetchRole();
  }, [user]);

  if (authLoading || loading) {
    return <p>Loading dashboard...</p>;
  }

  if (!user) {
    return <p>Please login again.</p>;
  }

  if (!role) {
    return <p>No role assigned. Contact admin.</p>;
  }

  // ✅ Role-based dashboards
  if (role === "admin") return <AdminDashboard />;
  if (role === "receptionist") return <ReceptionistDashboard />;
  if (role === "staff") return <StaffDashboard />;

  return <p>Invalid role assigned. Contact admin.</p>;
}
