import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import "../style/Navbar.css";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchUserData = async () => {
      const { data } = await supabase
        .from("users")
        .select("role, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      setProfile(data || null);
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link" onClick={closeMobileMenu}>
            <svg className="brand-logo" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
              <circle cx="250" cy="250" r="240" fill="url(#purpleGradient)" />
              <circle cx="250" cy="250" r="240" fill="none" stroke="#FFD700" strokeWidth="8" />
              
              <g transform="translate(250, 200)">
                <path d="M-60,-20 L-40,40 L-20,30 L-40,-30 Z" fill="#FFD700" />
                <circle cx="-50" cy="-35" r="15" fill="#FFD700" stroke="#6A0DAD" strokeWidth="3" />
                
                <path d="M60,-20 L40,40 L20,30 L40,-30 Z" fill="#FFD700" />
                <circle cx="50" cy="-35" r="15" fill="#FFD700" stroke="#6A0DAD" strokeWidth="3" />
                
                <circle cx="0" cy="10" r="8" fill="#9B59B6" stroke="#FFD700" strokeWidth="2" />
              </g>
              
              <g transform="translate(250, 100)">
                <path d="M-40,0 L-30,-25 L-20,0 L0,-30 L20,0 L30,-25 L40,0 L35,15 L-35,15 Z" 
                      fill="#FFD700" stroke="#6A0DAD" strokeWidth="2" />
                <circle cx="-30" cy="-25" r="4" fill="#9B59B6" />
                <circle cx="0" cy="-30" r="4" fill="#9B59B6" />
                <circle cx="30" cy="-25" r="4" fill="#9B59B6" />
              </g>
              
              <text x="250" y="350" fontSize="48" fontWeight="bold" fill="#FFD700" 
                    textAnchor="middle" fontFamily="Arial, sans-serif">
                SalonFlow
              </text>
              
              <text x="250" y="385" fontSize="18" fill="#9B59B6" 
                    textAnchor="middle" fontFamily="Arial, sans-serif">
                Premium Beauty Services
              </text>
              
              <defs>
                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6A0DAD" />
                  <stop offset="100%" stopColor="#9B59B6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="brand-text">SalonFlow</span>
          </Link>
        </div>

        {/* Hamburger Menu */}
        <button 
          className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* HOME (PUBLIC ONLY) */}
          {!user && (
            <Link to="/" className="nav-link" onClick={closeMobileMenu}>
              Home
            </Link>
          )}

          {/* SERVICES */}
          <Link to="/services" className="nav-link" onClick={closeMobileMenu}>
            Services
          </Link>

          {/* CONTACT US (PUBLIC ONLY) */}
          {!user && (
            <Link to="/contact" className="nav-link" onClick={closeMobileMenu}>
              Contact Us
            </Link>
          )}

          {/* CUSTOMER */}
          {user && profile?.role === "customer" && (
            <Link to="/my-appointments" className="nav-link" onClick={closeMobileMenu}>
              Dashboard
            </Link>
          )}

          {/* STAFF / ADMIN / RECEPTION */}
          {user && ["admin", "receptionist", "staff"].includes(profile?.role) && (
            <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>
              Dashboard
            </Link>
          )}

          {/* AUTH / PROFILE */}
          {!user ? (
            <>
              <Link to="/login" className="nav-link" onClick={closeMobileMenu}>
                Login
              </Link>
              <Link to="/register" className="nav-link nav-link-register" onClick={closeMobileMenu}>
                Register
              </Link>
            </>
          ) : (
            <div className="navbar-profile">
              <Link to="/profile" className="profile-link" title="Profile" onClick={closeMobileMenu}>
                <Avatar
                  name={profile?.full_name}
                  avatarUrl={profile?.avatar_url}
                  size={40}
                />
                <span className="profile-name">{profile?.full_name}</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}