import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Analytics.css";

export default function StaffAnalytics() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaffStats = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, full_name, avg_rating")
      .eq("role", "staff");

    const stats = [];

    for (const s of data || []) {
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("staff_id", s.id)
        .eq("status", "completed");

      stats.push({
        name: s.full_name,
        rating: s.avg_rating || 0,
        completed: count || 0
      });
    }

    setStaff(stats.sort((a, b) => b.completed - a.completed));
    setLoading(false);
  };

  useEffect(() => {
    fetchStaffStats();
  }, []);

  if (loading) {
    return (
      <div className="analytics-card">
        <div className="loading-small">Loading...</div>
      </div>
    );
  }

  return (
    <div className="analytics-card">
      <div className="card-header">
        <h4>✂️ Staff Performance</h4>
        <p>Top performing staff members</p>
      </div>

      <div className="staff-list">
        {staff.map((s, i) => (
          <div key={i} className="staff-item">
            <div className="staff-info">
              <span className="staff-name">{s.name}</span>
              <div className="staff-meta">
                <span className="staff-completed">
                  ✓ {s.completed} completed
                </span>
                <span className="staff-rating">
                  ⭐ {s.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}