import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext";
import "./Reports.css";

export default function Reports() {
  const { openError } = useModal();
  const [payments, setPayments] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [mode, setMode] = useState("all");

  const [summary, setSummary] = useState({
    total: 0,
    count: 0,
    cash: 0,
    online: 0,
    avgTransaction: 0,
    highestTransaction: 0,
    lowestTransaction: 0,
    cashPercentage: 0,
    onlinePercentage: 0
  });

  const calculateSummary = (data) => {
    let total = 0;
    let cash = 0;
    let online = 0;
    let highest = 0;
    let lowest = Infinity;

    data.forEach((p) => {
      const amt = Number(p.amount) || 0;
      total += amt;
      if (p.payment_mode === "cash") cash += amt;
      else if (p.payment_mode === "online") online += amt;
      
      if (amt > highest) highest = amt;
      if (amt < lowest) lowest = amt;
    });

    const count = data.length;
    const avgTransaction = count > 0 ? Math.round(total / count) : 0;
    const cashPercentage = total > 0 ? ((cash / total) * 100).toFixed(1) : 0;
    const onlinePercentage = total > 0 ? ((online / total) * 100).toFixed(1) : 0;

    setSummary({
      total,
      count,
      cash,
      online,
      avgTransaction,
      highestTransaction: count > 0 ? highest : 0,
      lowestTransaction: count > 0 && lowest !== Infinity ? lowest : 0,
      cashPercentage,
      onlinePercentage
    });
  };

  const fetchReports = async () => {
    let query = supabase
      .from("payments")
      .select("amount, payment_mode, created_at");

    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate + "T23:59:59");
    if (mode !== "all") query = query.eq("payment_mode", mode);

    const { data, error } = await query;

    if (error) {
      openError(error.message, "Failed to Load Reports");
      return;
    }

    setPayments(data || []);
    calculateSummary(data || []);
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const exportCSV = () => {
    const rows = [
      ["Amount", "Mode", "Date"],
      ...payments.map((p) => [
        p.amount,
        p.payment_mode,
        new Date(p.created_at).toLocaleString()
      ])
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `salon_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setMode("all");
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h3>Reports & Analytics</h3>
        <p>Financial reports and insights</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="summary-grid">
        <div className="summary-card primary">
          <div className="summary-icon">💰</div>
          <div className="summary-info">
            <span className="summary-value">₹{summary.total.toLocaleString()}</span>
            <span className="summary-label">Total Revenue</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-info">
            <span className="summary-value">{summary.count}</span>
            <span className="summary-label">Transactions</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">💵</div>
          <div className="summary-info">
            <span className="summary-value">₹{summary.cash.toLocaleString()}</span>
            <span className="summary-label">Cash ({summary.cashPercentage}%)</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">💳</div>
          <div className="summary-info">
            <span className="summary-value">₹{summary.online.toLocaleString()}</span>
            <span className="summary-label">Online ({summary.onlinePercentage}%)</span>
          </div>
        </div>
      </div>

      {/* INSIGHTS CARDS */}
      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-header">
            <span className="insight-icon">📈</span>
            <span className="insight-title">Average Transaction</span>
          </div>
          <div className="insight-value">₹{summary.avgTransaction.toLocaleString()}</div>
        </div>

        <div className="insight-card">
          <div className="insight-header">
            <span className="insight-icon">🔝</span>
            <span className="insight-title">Highest Transaction</span>
          </div>
          <div className="insight-value">₹{summary.highestTransaction.toLocaleString()}</div>
        </div>

        <div className="insight-card">
          <div className="insight-header">
            <span className="insight-icon">🔻</span>
            <span className="insight-title">Lowest Transaction</span>
          </div>
          <div className="insight-value">₹{summary.lowestTransaction.toLocaleString()}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="reports-filters">
        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Payment Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="all">All Payments</option>
            <option value="cash">Cash Only</option>
            <option value="online">Online Only</option>
          </select>
        </div>

        <div className="filter-actions">
          <button className="btn-apply-filter" onClick={fetchReports}>
            🔍 Apply Filters
          </button>
          <button className="btn-clear-filter" onClick={clearFilters}>
            ✕ Clear
          </button>
        </div>
      </div>

      {/* PAYMENT MODE BREAKDOWN */}
      <div className="breakdown-card">
        <h4>Payment Mode Breakdown</h4>
        <div className="breakdown-bars">
          <div className="breakdown-item">
            <div className="breakdown-label">
              <span>💵 Cash</span>
              <span>₹{summary.cash.toLocaleString()}</span>
            </div>
            <div className="breakdown-bar-container">
              <div 
                className="breakdown-bar cash-bar" 
                style={{ width: `${summary.cashPercentage}%` }}
              >
                <span className="bar-percentage">{summary.cashPercentage}%</span>
              </div>
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-label">
              <span>💳 Online</span>
              <span>₹{summary.online.toLocaleString()}</span>
            </div>
            <div className="breakdown-bar-container">
              <div 
                className="breakdown-bar online-bar" 
                style={{ width: `${summary.onlinePercentage}%` }}
              >
                <span className="bar-percentage">{summary.onlinePercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXPORT SECTION */}
      <div className="export-section">
        <button className="btn-export" onClick={exportCSV}>
          📥 Download CSV Report
        </button>
        <p className="export-note">
          Export includes {summary.count} transactions totaling ₹{summary.total.toLocaleString()}
        </p>
      </div>
    </div>
  );
}