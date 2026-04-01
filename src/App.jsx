import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import AuthModal from "./components/modals/AuthModal";
import useTimedAuthPopup from "./hooks/useTimedAuthPopup";
import StaffServiceFlow from "./pages/StaffServiceFlow";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ContactUs from "./pages/ContactUs";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Services from "./pages/Services";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import MyAppointments from "./pages/MyAppointments";
import BlockedUser from "./pages/BlockedUser";
import ProfileNotFound from "./pages/ProfileNotFound";
import MyAppointmentFlow from "./pages/MyAppointmentFlow";
import UserDashboard from "./pages/UserDashboard";

import ProtectedRoute from "./guards/ProtectedRoute";

export default function App() {
  const { open, setOpen } = useTimedAuthPopup(30000);

  return (
    <>
      <Navbar />

      {/* 🔐 Timed auth popup */}
      <AuthModal isOpen={open} onClose={() => setOpen(false)} />

      <Routes>
        {/* ---------- PUBLIC ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<ContactUs />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/blocked" element={<BlockedUser />} />
<Route path="/profile-not-found" element={<ProfileNotFound />} />


        {/* ---------- LOGGED IN ---------- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* ---------- CUSTOMER ---------- */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route path="/my-appointments" element={<UserDashboard />} />
        </Route>

        {/* ---------- STAFF / ADMIN ---------- */}
        <Route
  element={<ProtectedRoute allowedRoles={["staff"]} />}
>
  <Route path="/staff/services" element={<StaffServiceFlow />} />
</Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "receptionist", "staff"]}
            />
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  );
}
