import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PaymentModal from "../features/payments/PaymentModal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import "../style/ReceptionistDashboard.css";

// Toast Notification Component
const Toast = ({ message, title, type, onClose }) => (
  <div className={`toast-notification toast-${type}`}>
    <div className="toast-icon">
      {type === "success" && "✅"}
      {type === "error" && "❌"}
      {type === "info" && "ℹ️"}
      {type === "warning" && "⚠️"}
    </div>
    <div className="toast-body">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
    <button onClick={onClose} className="toast-close">×</button>
  </div>
);

// Celebration Animation Component
const receptionistConfettiPieces = [...Array(50)].map((_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 3}s`,
  color: ['#FFD700', '#6A0DAD', '#9B59B6', '#27AE60'][Math.floor(Math.random() * 4)]
}));

const CelebrationOverlay = ({ onClose }) => (
  <div className="celebration-overlay" onClick={onClose}>
    <div className="confetti-container">
      {receptionistConfettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti"
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            background: piece.color
          }}
        />
      ))}
    </div>
    <div className="celebration-content">
      <div className="celebration-icon">🎉</div>
      <h2>Payment Received!</h2>
      <p>Transaction completed successfully</p>
    </div>
  </div>
);

// Confirm Modal Component
const ConfirmModal = ({ title, message, onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
      <div className="confirm-icon">⚠️</div>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="confirm-actions">
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-confirm" onClick={onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
);

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // New: date filter
  const [selectedStaff, setSelectedStaff] = useState({});
  const [allAppointmentsForStats, setAllAppointmentsForStats] = useState([]);
  const [paymentAppointment, setPaymentAppointment] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    inProgress: 0,
    serviceDone: 0,
    completed: 0,
    revenue: 0,
    pendingPayments: 0
  });
  
  const [notification, setNotification] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);

  // Chart data
  const [chartData, setChartData] = useState({
    statusData: [],
    revenueData: [],
    staffData: []
  });

  const handleRealtimeUpdate = (payload) => {
    if (payload.eventType === 'INSERT') {
      showNotification('New Appointment!', 'A new booking has been received', 'info');
      playNotificationSound();
    } else if (payload.eventType === 'UPDATE') {
      if (payload.new.status === 'completed') {
        showNotification('Completed!', 'Appointment marked as completed', 'success');
      }
    }
    fetchAppointments();
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLXijkIHGm98OGeT' +
      'gwKUKXh8LdjHQU2kdXyzHksBSF1xe/akEEIEle06+ypWRUJQ5zd8sFuJQUrgc/y2Io4CRxqvvDgnlANCk+m4/G3ZB0FOIzX8s16LAYgdb/w3JBBCBBVtOnqpFgVCT+c3fO+biQCKHzM8dWKOAglbb7w4p5QDQlMp+PxtWMcBjiP1fHMeSsFH3G+8N2RQQgPU7To6qNWFAgAmNzzv24kAyF6y/HUijcIImy98OKdUA4JTKfk8bRiHAU2jdXxy3orBR90v/DckUEIDlCy5+mjVRUIEo'); // Bell sound
    audio.play().catch(() => {});
  };

  const showNotification = (title, message, type = 'success') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchInitialData = async () => {
    const { data: staffData } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .eq("role", "staff");
    setStaff(staffData || []);
    
    const { data: serviceData } = await supabase
      .from("services")
      .select("*");
    setAllServices(serviceData || []);
  };

  const fetchAppointments = async () => {
    setLoading(true);
    
    // 1. Fetch EVERYTHING (without the status filter) for stats and charts
    let baseQuery = supabase
      .from("appointments")
      .select(`
        *,
        customer:users!appointments_customer_id_fkey(full_name, phone, email, avatar_url),
        staff:users!appointments_staff_id_fkey(full_name, avatar_url),
        appointment_services(id, service_id, price, quantity, services(name)),
        payments(id, amount, payment_mode, receipt_no)
      `)
      .order("appointment_time", { ascending: false }); // Sort by date, newest first

    const { data: allData, error } = await baseQuery;
    
    if (!error && allData) {
      // Save the full dataset for stats/charts so they never show zero
      setAllAppointmentsForStats(allData);
      calculateStats(allData);
      generateChartData(allData);

      // 2. Now apply filters ONLY for the list display
      let filteredForList = [...allData];

      // Filter by Status (the top chips)
      if (filter !== "all") {
        filteredForList = filteredForList.filter(apt => apt.status === filter);
      }

      // Filter by Search Query
      if (searchQuery) {
        filteredForList = filteredForList.filter(apt =>
          apt.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.customer?.phone?.includes(searchQuery) ||
          apt.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filter by Date
      if (dateFilter !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filteredForList = filteredForList.filter(apt => {
          if (!apt.appointment_time) return false;
          
          const apptDate = new Date(apt.appointment_time);
          apptDate.setHours(0, 0, 0, 0);
          
          if (dateFilter === "today") {
            return apptDate.getTime() === today.getTime();
          } else if (dateFilter === "tomorrow") {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return apptDate.getTime() === tomorrow.getTime();
          } else if (dateFilter === "week") {
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return apptDate >= today && apptDate <= weekFromNow;
          } else if (dateFilter === "past") {
            return apptDate < today;
          }
          return true;
        });
      }
      
      // Sort by date: Today first, then future dates, then past dates
      filteredForList.sort((a, b) => {
        const dateA = new Date(a.appointment_time);
        const dateB = new Date(b.appointment_time);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dayA = new Date(dateA);
        dayA.setHours(0, 0, 0, 0);
        const dayB = new Date(dateB);
        dayB.setHours(0, 0, 0, 0);
        
        const isAToday = dayA.getTime() === today.getTime();
        const isBToday = dayB.getTime() === today.getTime();
        
        // Today's appointments first
        if (isAToday && !isBToday) return -1;
        if (!isAToday && isBToday) return 1;
        
        // Within same day category, sort by time (earliest first)
        return dateB - dateA;
      });
      
      setAppointments(filteredForList);
    } else if (error) {
      console.error("Error fetching appointments:", error);
      showNotification("Error", "Failed to load appointments", "error");
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
    fetchAppointments();
    
    // Real-time subscription
    const channel = supabase
      .channel('receptionist-appointments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments'
      }, (payload) => {
        handleRealtimeUpdate(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments'
      }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, searchQuery, dateFilter]); // Added dateFilter

  const calculateStats = (data) => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  
  // Filter for today's appointments by checking the first 10 characters of appointment_time
  const todayAppointments = data.filter(a => 
    a.appointment_time && a.appointment_time.substring(0, 10) === today
  );
  
  setStats({
    total: todayAppointments.length,
    pending: data.filter(a => a.status === "pending").length,
    approved: data.filter(a => a.status === "approved").length,
    inProgress: data.filter(a => a.status === "in_progress").length,
    serviceDone: data.filter(a => a.status === "service_done").length,
    completed: todayAppointments.filter(a => a.status === "completed").length,
    rescheduleRequested: data.filter(a => a.status === "reschedule_requested").length,
    revenue: todayAppointments
      .filter(a => a.status === "completed")
      .reduce((sum, a) => sum + (Number(a.total_amount) || 0), 0),
    pendingPayments: data.filter(a => a.status === "service_done")
      .reduce((sum, a) => sum + (Number(a.total_amount) || 0), 0)
  });
};

  // const generateChartData = (data) => {
  //   const statusData = [
  //     { name: 'Pending', value: data.filter(a => a.status === 'pending').length, color: '#F39C12' },
  //     { name: 'Approved', value: data.filter(a => a.status === 'approved').length, color: '#3498DB' },
  //     { name: 'In Progress', value: data.filter(a => a.status === 'in_progress').length, color: '#9B59B6' },
  //     { name: 'Service Done', value: data.filter(a => a.status === 'service_done').length, color: '#1ABC9C' },
  //     { name: 'Completed', value: data.filter(a => a.status === 'completed').length, color: '#27AE60' }
  //   ];

  //   const revenueData = [];
  //   for (let i = 6; i >= 0; i--) {
  //     const date = new Date();
  //     date.setDate(date.getDate() - i);
  //     const dateStr = date.toISOString().split('T')[0];
  //     const dayRevenue = data
  //       .filter(a => a.appointment_date === dateStr && a.status === 'completed')
  //       .reduce((sum, a) => sum + (Number(a.total_amount) || 0), 0);
      
  //     revenueData.push({
  //       date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
  //       revenue: dayRevenue
  //     });
  //   }

  //   const staffMap = {};
  //   data.forEach(apt => {
  //     if (apt.staff?.full_name) {
  //       if (!staffMap[apt.staff.full_name]) {
  //         staffMap[apt.staff.full_name] = { completed: 0, total: 0 };
  //       }
  //       staffMap[apt.staff.full_name].total++;
  //       if (apt.status === 'completed') {
  //         staffMap[apt.staff.full_name].completed++;
  //       }
  //     }
  //   });

  //   const staffData = Object.keys(staffMap).map(name => ({
  //     name,
  //     appointments: staffMap[name].total,
  //     completed: staffMap[name].completed
  //   }));

  //   setChartData({ statusData, revenueData, staffData });
  // };

  const generateChartData = (data) => {
  const statusData = [
    { name: 'Pending', value: data.filter(a => a.status === 'pending').length, color: '#F39C12' },
    { name: 'Approved', value: data.filter(a => a.status === 'approved').length, color: '#3498DB' },
    { name: 'In Progress', value: data.filter(a => a.status === 'in_progress').length, color: '#9B59B6' },
    { name: 'Service Done', value: data.filter(a => a.status === 'service_done').length, color: '#1ABC9C' },
    { name: 'Completed', value: data.filter(a => a.status === 'completed').length, color: '#27AE60' }
  ];

  const revenueData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Check appointment_time substring instead of appointment_date
    const dayRevenue = data
      .filter(a => a.appointment_time?.startsWith(dateStr) && a.status === 'completed')
      .reduce((sum, a) => sum + (Number(a.total_amount) || 0), 0);
    
    revenueData.push({
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue: dayRevenue
    });
  }

  const staffMap = {};
  data.forEach(apt => {
    if (apt.staff?.full_name) {
      if (!staffMap[apt.staff.full_name]) {
        staffMap[apt.staff.full_name] = { completed: 0, total: 0 };
      }
      staffMap[apt.staff.full_name].total++;
      if (apt.status === 'completed') {
        staffMap[apt.staff.full_name].completed++;
      }
    }
  });

  const staffData = Object.keys(staffMap).map(name => ({
    name,
    appointments: staffMap[name].total,
    completed: staffMap[name].completed
  }));

  setChartData({ statusData, revenueData, staffData });
};

  const recalculateTotal = async (appointmentId) => {
    // Fetch all services for this appointment
    const { data: services, error } = await supabase
      .from("appointment_services")
      .select("price, quantity")
      .eq("appointment_id", appointmentId);
    
    if (error) {
      console.error("Error fetching services:", error);
      return;
    }
    
    // Calculate new total
    const newTotal = services.reduce((sum, s) => sum + (s.price * (s.quantity || 1)), 0);
    
    // Update appointment total_amount
    await supabase
      .from("appointments")
      .update({ total_amount: newTotal })
      .eq("id", appointmentId);
  };

  const removeService = async (apptServiceId, appointmentId) => {
    const { error } = await supabase
      .from("appointment_services")
      .delete()
      .eq("id", apptServiceId);
    
    if (!error) {
      // Recalculate total
      await recalculateTotal(appointmentId);
      
      showNotification("Service Removed", "Service successfully removed from appointment");
      fetchAppointments();
    } else {
      showNotification("Error", "Could not remove service", "error");
    }
  };

  const addService = async (appointmentId, service) => {
    const { error } = await supabase
      .from("appointment_services")
      .insert({
        appointment_id: appointmentId,
        service_id: service.id,
        price: service.price,
        quantity: 1
      });
    
    if (!error) {
      // Recalculate total
      await recalculateTotal(appointmentId);
      
      showNotification("Service Added", `${service.name} added successfully`);
      fetchAppointments();
    } else {
      showNotification("Error", "Could not add service", "error");
    }
  };

  const approveAppointment = async (id) => {
    const staffId = selectedStaff[id];
    if (!staffId) {
      return showNotification("Staff Required", "Please assign a staff member", "warning");
    }
    
    const { error } = await supabase
      .from("appointments")
      .update({ status: "approved", staff_id: staffId })
      .eq("id", id);
    
    if (!error) {
      showNotification("Approved!", "Appointment confirmed successfully");
      fetchAppointments();
    } else {
      showNotification("Error", "Could not approve appointment", "error");
    }
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);
    
    if (!error) {
      if (status === "completed") {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
      showNotification("Status Updated", `Appointment marked as ${status.replace('_', ' ')}`);
      fetchAppointments();
    } else {
      showNotification("Error", "Could not update status", "error");
    }
  };

  const handlePaymentSuccess = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
    showNotification("Payment Received!", "Transaction completed successfully");
    fetchAppointments();
  };

  const approveReschedule = async (id) => {
    const newStaffId = selectedStaff[id];
    
    // Prepare update data
    const updateData = { status: "approved" };
    
    // If staff was changed, update staff_id
    if (newStaffId) {
      updateData.staff_id = newStaffId;
    }
    
    const { error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id);
    
    if (!error) {
      const message = newStaffId 
        ? "Reschedule approved and staff reassigned successfully!"
        : "Reschedule approved successfully!";
      showNotification("Reschedule Approved!", message);
      fetchAppointments();
    } else {
      showNotification("Error", "Could not approve reschedule request", "error");
    }
  };

  const rejectReschedule = async (id, originalTime) => {
    // You can optionally restore the original time if you store it
    const { error } = await supabase
      .from("appointments")
      .update({ status: "approved" })
      .eq("id", id);
    
    if (!error) {
      showNotification("Reschedule Rejected", "Appointment kept at original time", "info");
      fetchAppointments();
    } else {
      showNotification("Error", "Could not reject reschedule request", "error");
    }
  };

  const FILTER_OPTIONS = [
    { value: 'all', label: 'All Appointments', icon: '📋', color: '#6A0DAD' },
    { value: 'pending', label: 'Pending Approval', icon: '⏳', color: '#F39C12' },
    { value: 'approved', label: 'Approved', icon: '✅', color: '#3498DB' },
    { value: 'in_progress', label: 'Ongoing Services', icon: '✂️', color: '#9B59B6' },
    { value: 'service_done', label: 'Awaiting Payment', icon: '💰', color: '#1ABC9C' },
    { value: 'completed', label: 'Completed', icon: '🎉', color: '#27AE60' },
    { value: 'reschedule_requested', label: 'Reschedule Requests', icon: '🔄', color: '#E74C3C' }
  ];

  return (
    <div className="receptionist-dashboard">
      {notification && (
        <Toast
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {showCelebration && (
        <CelebrationOverlay onClose={() => setShowCelebration(false)} />
      )}

      {confirmAction && (
        <ConfirmModal
          title="Remove Service"
          message="Are you sure you want to remove this service from the appointment?"
          onConfirm={() => {
            removeService(confirmAction.serviceId, confirmAction.appointmentId);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Receptionist Command Center</h1>
          <p className="dashboard-subtitle">Manage appointments and customer bookings</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📅</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Today's Total</p>
          </div>
        </div>

        <div className="stat-card highlight" onClick={() => setFilter('pending')}>
          <div className="stat-icon orange">⏳</div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Needs Approval</p>
          </div>
        </div>

        {stats.rescheduleRequested > 0 && (
          <div className="stat-card highlight urgent" onClick={() => setFilter('reschedule_requested')}>
            <div className="stat-icon red">🔄</div>
            <div className="stat-info">
              <h3>{stats.rescheduleRequested}</h3>
              <p>Reschedule Requests</p>
            </div>
          </div>
        )}

        <div className="stat-card highlight" onClick={() => setFilter('in_progress')}>
          <div className="stat-icon purple">✂️</div>
          <div className="stat-info">
            <h3>{stats.inProgress}</h3>
            <p>Ongoing Services</p>
          </div>
        </div>

        <div className="stat-card highlight" onClick={() => setFilter('service_done')}>
          <div className="stat-icon teal">💰</div>
          <div className="stat-info">
            <h3>{stats.serviceDone}</h3>
            <p>Awaiting Payment</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <h3>{stats.completed}</h3>
            <p>Completed Today</p>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon gold">💵</div>
          <div className="stat-info">
            <h3>₹{stats.revenue.toLocaleString('en-IN')}</h3>
            <p>Today's Revenue</p>
          </div>
        </div>

        {stats.pendingPayments > 0 && (
          <div className="stat-card urgent">
            <div className="stat-icon red">⚠️</div>
            <div className="stat-info">
              <h3>₹{stats.pendingPayments.toLocaleString('en-IN')}</h3>
              <p>Pending Collection</p>
            </div>
          </div>
        )}
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Appointment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>7-Day Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Line type="monotone" dataKey="revenue" stroke="#6A0DAD" strokeWidth={3} dot={{ fill: '#FFD700', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Staff Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.staffData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend />
              <Bar dataKey="appointments" fill="#9B59B6" name="Total" />
              <Bar dataKey="completed" fill="#27AE60" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* Date Filter Dropdown */}
        <div className="date-filter-container">
          <label className="date-filter-label">📅 Filter by Date:</label>
          <select 
            className="date-filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="week">Next 7 Days</option>
            <option value="past">Past Appointments</option>
          </select>
        </div>

        {/* <div className="filter-chips">
          {FILTER_OPTIONS.map(option => {
            const count = option.value === 'all' 
              ? appointments.length 
              : appointments.filter(a => a.status === option.value).length;
            
            return (
              <button
                key={option.value}
                className={`filter-chip ${filter === option.value ? 'active' : ''}`}
                style={{ '--chip-color': option.color }}
                onClick={() => setFilter(option.value)}
              >
                <span className="chip-icon">{option.icon}</span>
                <span className="chip-label">{option.label}</span>
                <span className="chip-count">{count}</span>
              </button>
            );
          })}
        </div> */}
      <div className="filter-chips">
  {FILTER_OPTIONS.map(option => {
    // Changed this line to use allAppointmentsForStats
    const count = option.value === 'all' 
      ? allAppointmentsForStats.length 
      : allAppointmentsForStats.filter(a => a.status === option.value).length;
    
    return (
      <button
        key={option.value}
        className={`filter-chip ${filter === option.value ? 'active' : ''}`}
        style={{ '--chip-color': option.color }}
        onClick={() => setFilter(option.value)}
      >
        <span className="chip-icon">{option.icon}</span>
        <span className="chip-label">{option.label}</span>
        <span className="chip-count">{count}</span>
      </button>
    );
  })}
</div>
      </div>

      <div className="appointments-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No Appointments Found</h3>
            <p>There are no appointments matching your filters</p>
          </div>
        ) : (
          appointments.map((a) => {
            const hasPayment = a.payments && a.payments.length > 0;
            
            return (
              <div key={a.id} className="appointment-card">
                <div className="card-header">
                  <div className="customer-info">
                    <div className="customer-avatar">
                      {a.customer?.avatar_url ? (
                        <img src={a.customer.avatar_url} alt={a.customer.full_name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {a.customer?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="customer-details">
                      <h4>{a.customer?.full_name || "Unknown Customer"}</h4>
                      <p>📞 {a.customer?.phone}</p>
                      <p>📧 {a.customer?.email}</p>
                    </div>
                  </div>
                  <div className="appointment-meta">
                    <span className={`status-badge status-${a.status}`}>
                      {a.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="appointment-time">
                      <span className="date">
                        📅 {a.appointment_time 
                          ? new Date(a.appointment_time).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Date not set'
                        }
                      </span>
                      <span className="time">
                        🕒 {a.appointment_time 
                          ? new Date(a.appointment_time).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })
                          : 'Time not set'
                        }
                      </span>
                    </div>
                    {a.status === 'in_progress' && (
                      <div className="ongoing-indicator">
                        <span className="pulse-dot"></span>
                        ONGOING
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-body">
                  <div className="services-section">
                    <h5>Services ({a.appointment_services?.length || 0})</h5>
                    <div className="services-list">
                      {a.appointment_services?.map((as) => (
                        <div key={as.id} className="service-item">
                          <div className="service-details">
                            <span className="service-name">✂️ {as.services?.name}</span>
                            <span className="service-qty">× {as.quantity}</span>
                          </div>
                          <span className="service-price">₹{as.price}</span>
                          {["pending", "approved"].includes(a.status) && (
                            <button
                              className="btn-remove-service"
                              onClick={() => setConfirmAction({ 
                                serviceId: as.id, 
                                appointmentId: a.id 
                              })}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {["pending", "approved"].includes(a.status) && (
                      <select
                        className="add-service-dropdown"
                        value=""
                        onChange={(e) => {
                          const service = allServices.find(s => s.id === e.target.value);
                          if (service) addService(a.id, service);
                        }}
                      >
                        <option value="">+ Add Service</option>
                        {allServices.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} - ₹{s.price}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="staff-section">
                    <h5>Staff Assignment</h5>
                    {a.staff ? (
                      <div className="assigned-staff">
                        <div className="staff-avatar">
                          {a.staff.avatar_url ? (
                            <img src={a.staff.avatar_url} alt={a.staff.full_name} />
                          ) : (
                            <div className="avatar-placeholder-small">
                              {a.staff.full_name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span>{a.staff.full_name}</span>
                      </div>
                    ) : (
                      <p className="unassigned">Not assigned</p>
                    )}
                    
                    {a.status === "pending" && (
                      <div className="staff-assignment-controls">
                        <select
                          className="staff-dropdown"
                          value={selectedStaff[a.id] || ""}
                          onChange={(e) => setSelectedStaff({ ...selectedStaff, [a.id]: e.target.value })}
                        >
                          <option value="">Select Staff</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.full_name}</option>
                          ))}
                        </select>
                        <button
                          className="btn-approve"
                          onClick={() => approveAppointment(a.id)}
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="amount-section">
                    <h5>Payment Status</h5>
                    <p className="total-amount">₹{a.total_amount}</p>
                    {hasPayment ? (
                      <div className="payment-info">
                        <span className="payment-badge paid">✓ PAID</span>
                        <p className="payment-details">
                          {a.payments[0].payment_mode.toUpperCase()} | {a.payments[0].receipt_no}
                        </p>
                      </div>
                    ) : a.status === 'service_done' ? (
                      <div className="payment-info">
                        <span className="payment-badge pending">⏳ PENDING</span>
                        <p className="payment-note">Awaiting payment collection</p>
                      </div>
                    ) : (
                      <p className="payment-note">Payment not applicable yet</p>
                    )}
                  </div>
                </div>

                <div className="card-footer">
                  {a.status === "reschedule_requested" && (
                    <div className="reschedule-actions">
                      <div className="reschedule-info">
                        <span className="reschedule-icon">🔄</span>
                        <div className="reschedule-details">
                          <p className="reschedule-label">Customer requested new time:</p>
                          <p className="reschedule-time">
                            📅 {new Date(a.appointment_time).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                            <br />
                            🕒 {new Date(a.appointment_time).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Staff Assignment for Reschedule */}
                      <div className="reschedule-staff-section">
                        <label className="reschedule-staff-label">
                          👤 Assign Staff Member:
                        </label>
                        <select
                          className="reschedule-staff-dropdown"
                          value={selectedStaff[a.id] || a.staff_id || ""}
                          onChange={(e) => setSelectedStaff({ ...selectedStaff, [a.id]: e.target.value })}
                        >
                          <option value="">Select Staff</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.full_name} {a.staff_id === s.id ? "(Current)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="reschedule-buttons">
                        <button
                          className="action-btn btn-approve-reschedule"
                          onClick={() => approveReschedule(a.id)}
                        >
                          ✅ Approve Reschedule
                        </button>
                        <button
                          className="action-btn btn-reject-reschedule"
                          onClick={() => rejectReschedule(a.id)}
                        >
                          ❌ Reject Request
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {a.status === "approved" && (
                    <button
                      className="action-btn btn-start"
                      onClick={() => updateStatus(a.id, "in_progress")}
                    >
                      ▶️ Start Service
                    </button>
                  )}
                  
                  {a.status === "in_progress" && (
                    <button
                      className="action-btn btn-complete"
                      onClick={() => updateStatus(a.id, "service_done")}
                    >
                      ✅ Mark as Done
                    </button>
                  )}
                  
                  {a.status === "service_done" && !hasPayment && (
                    <button
                      className="action-btn btn-payment"
                      onClick={() => setPaymentAppointment(a)}
                    >
                      💳 Collect Payment - ₹{a.total_amount}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {paymentAppointment && (
        <PaymentModal
          appointment={paymentAppointment}
          onClose={() => setPaymentAppointment(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}