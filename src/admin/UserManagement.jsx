import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext";
import "./UserManagement.css";

export default function UserManagement({ adminMode }) {
  const { openConfirm, openSuccess, openError } = useModal();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [view, setView] = useState("all"); // 'all' or 'staff'
  const [quickFilter, setQuickFilter] = useState("all"); // New: for metric card clicks

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, avg_rating, rating_count, blocked, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      openError(error.message, "Failed to Load Users");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (user, role) => {
    if (role === "admin" && !adminMode) {
      openError("Enable 'Admin Mode' in the dashboard header first.", "Admin Mode Required");
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", user.id);

    if (error) {
      openError(error.message, "Failed to Update Role");
    } else {
      openSuccess(`Role updated to ${role} successfully!`, "Role Updated");
      fetchUsers();
    }
  };

  const toggleBlockUser = async (user) => {
    const newBlockedStatus = !user.blocked;
    
    openConfirm(
      `Are you sure you want to ${newBlockedStatus ? 'BLOCK' : 'UNBLOCK'} ${user.full_name}?`,
      async () => {
        const { error } = await supabase
          .from("users")
          .update({ blocked: newBlockedStatus })
          .eq("id", user.id);

        if (error) {
          openError(error.message, "Failed to Update Status");
        } else {
          openSuccess(`User ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully!`, "Status Updated");
          fetchUsers();
        }
      },
      `${newBlockedStatus ? 'Block' : 'Unblock'} User`
    );
  };

  const deleteUser = async (user) => {
    if (!adminMode) {
      openError("You must be in Admin Mode to delete users.", "Admin Mode Required");
      return;
    }
    
    openConfirm(
      `Are you sure you want to permanently delete ${user.full_name}? This action cannot be undone.`,
      async () => {
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("id", user.id);

        if (error) {
          openError(error.message, "Failed to Delete User");
        } else {
          openSuccess(`User ${user.full_name} deleted successfully.`, "User Deleted");
          fetchUsers();
        }
      },
      "⚠️ Permanent Delete"
    );
  };

  const stats = {
    total: users.length,
    customers: users.filter((u) => !u.role || u.role === "customer").length,
    staff: users.filter((u) => u.role === "staff").length,
    blocked: users.filter((u) => u.blocked).length,
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch = 
        (u.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (u.email?.toLowerCase() || "").includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || (u.role || "customer") === roleFilter;
      const matchesView = view === "all" || u.role === "staff";
      
      // New: Apply quick filter from metric cards
      let matchesQuickFilter = true;
      if (quickFilter === "customers") {
        matchesQuickFilter = !u.role || u.role === "customer";
      } else if (quickFilter === "staff") {
        matchesQuickFilter = u.role === "staff";
      } else if (quickFilter === "blocked") {
        matchesQuickFilter = u.blocked === true;
      }
      // "all" shows everyone
      
      return matchesSearch && matchesRole && matchesView && matchesQuickFilter;
    })
    .sort((a, b) => {
      if (view === "staff") return (b.avg_rating || 0) - (a.avg_rating || 0);
      return 0;
    });

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div><p>Syncing users...</p></div>;

  return (
    <div className="user-management">
      <div className="management-header">
        <div className="header-text">
          <h3>User Management</h3>
          <p>{adminMode ? "🔓 Admin Mode: Full Privileges" : "🔒 Standard Mode: View Only"}</p>
        </div>
        <div className="view-selector">
          <button className={view === "all" ? "active" : ""} onClick={() => setView("all")}>All Users</button>
          <button className={view === "staff" ? "active" : ""} onClick={() => setView("staff")}>Staff Rankings</button>
        </div>
      </div>

      {/* STATS CARDS (The Analysis Section) - Now clickable filters */}
      <div className="stats-grid">
        <div 
          className={`stat-card ${quickFilter === "all" ? "active-filter" : ""}`}
          onClick={() => setQuickFilter("all")}
          style={{ cursor: "pointer" }}
          title="Click to show all users"
        >
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
        <div 
          className={`stat-card ${quickFilter === "customers" ? "active-filter" : ""}`}
          onClick={() => setQuickFilter("customers")}
          style={{ cursor: "pointer" }}
          title="Click to filter customers only"
        >
          <div className="stat-icon">🛍️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.customers}</span>
            <span className="stat-label">Customers</span>
          </div>
        </div>
        <div 
          className={`stat-card ${quickFilter === "staff" ? "active-filter" : ""}`}
          onClick={() => setQuickFilter("staff")}
          style={{ cursor: "pointer" }}
          title="Click to filter staff only"
        >
          <div className="stat-icon">✂️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.staff}</span>
            <span className="stat-label">Staff</span>
          </div>
        </div>
        <div 
          className={`stat-card alert ${quickFilter === "blocked" ? "active-filter" : ""}`}
          onClick={() => setQuickFilter("blocked")}
          style={{ cursor: "pointer" }}
          title="Click to filter blocked users only"
        >
          <div className="stat-icon">🚫</div>
          <div className="stat-info">
            <span className="stat-value">{stats.blocked}</span>
            <span className="stat-label">Blocked</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔍 Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="staff">Staff</option>
          <option value="receptionist">Receptionists</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* USER LIST */}
      <div className="user-list">
        {filteredUsers.map((u, i) => (
          <div key={u.id} className={`user-item ${u.blocked ? "is-blocked" : ""}`}>
            <div className="user-info">
              <h4>
                {view === "staff" && <span className="rank-idx">#{i + 1}</span>}
                {u.full_name || "New User"}
                {u.blocked && <span className="blocked-badge">BLOCKED</span>}
              </h4>
              <p className="user-email">{u.email}</p>
              
              <div className="badges-row">
                <span className={`role-badge role-${u.role || "customer"}`}>
                  {u.role || "customer"}
                </span>
                {u.role === "staff" && (
                  <span className="rating-tag">⭐ {Number(u.avg_rating || 0).toFixed(1)}</span>
                )}
              </div>
            </div>

            <div className="user-actions">
              <select
                className="role-select"
                value={u.role || "customer"}
                onChange={(e) => updateRole(u, e.target.value)}
              >
                <option value="customer">Customer</option>
                <option value="staff">Staff</option>
                <option value="receptionist">Receptionist</option>
                {(adminMode || u.role === "admin") && <option value="admin">Admin</option>}
              </select>

              <div className="btn-group">
                <button 
                  className={`action-btn block ${u.blocked ? "unblock" : ""}`}
                  onClick={() => toggleBlockUser(u)}
                  title={u.blocked ? "Unblock User" : "Block User"}
                >
                  {u.blocked ? "🔓" : "🚫"}
                </button>
                {adminMode && (
                  <button 
                    className="action-btn delete" 
                    onClick={() => deleteUser(u)}
                    title="Delete User"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}