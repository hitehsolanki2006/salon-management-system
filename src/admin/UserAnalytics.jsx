import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Analytics.css";

export default function UserAnalytics() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          customer_id, 
          total_amount, 
          status,
          users!appointments_customer_id_fkey(full_name)
        `)
        .in("status", ["completed", "approved", "in_progress", "pending"]);

      if (error) {
        console.error("Error fetching user stats:", error);
        setLoading(false);
        return;
      }

      const map = {};

      data?.forEach((a) => {
        if (!a.customer_id || !a.users) return;
        
        if (!map[a.customer_id]) {
          map[a.customer_id] = {
            name: a.users.full_name || "Unknown User",
            visits: 0,
            total: 0
          };
        }
        map[a.customer_id].visits += 1;
        map[a.customer_id].total += Number(a.total_amount) || 0;
      });

      const sorted = Object.values(map)
        .filter(u => u.visits > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      
      setUsers(sorted);
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  if (loading) {
    return (
      <div className="analytics-card">
        <div className="card-header">
          <h4>👥 Top Customers</h4>
          <p>Most valuable customers</p>
        </div>
        <div className="loading-small">Loading...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="analytics-card">
        <div className="card-header">
          <h4>👥 Top Customers</h4>
          <p>Most valuable customers</p>
        </div>
        <div className="no-data">
          <p>No customer data available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-card">
      <div className="card-header">
        <h4>👥 Top Customers</h4>
        <p>Most valuable customers</p>
      </div>

      <div className="customer-list">
        {users.map((u, i) => (
          <div key={i} className="customer-item">
            <div className="customer-rank">#{i + 1}</div>
            <div className="customer-info">
              <span className="customer-name">{u.name}</span>
              <span className="customer-stats">
                {u.visits} visits • ₹{u.total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}