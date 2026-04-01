import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../style/Home.css";

export default function Home() {
  const { user } = useAuth();

  // Redirect logged-in users
  if (user) {
    return <Navigate to="/services" replace />;
  }

  return (
    <div className="home-container">
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Manage Your Salon Effortlessly</h1>
          <p className="hero-subtitle">
            Book appointments, manage staff, track services, and grow your
            business with SalonFlow.
          </p>
          <div className="hero-buttons">
            <Link to="/register">
              <button className="btn-primary">Get Started</button>
            </Link>
            <Link to="/login">
              <button className="btn-secondary">Login</button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <h2 className="section-title">Why Choose SalonFlow?</h2>
        <div className="features-grid">
          <Feature title="Easy Booking" text="Book services in seconds." />
          <Feature title="Smart Scheduling" text="Avoid conflicts and delays." />
          <Feature title="Staff Management" text="Assign and track staff work." />
          <Feature title="Reports & Insights" text="Download reports anytime." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <ol className="steps-list">
          <li>Register & login</li>
          <li>Choose services</li>
          <li>Book appointment</li>
          <li>Relax & enjoy</li>
        </ol>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to get started?</h2>
        <Link to="/register">
          <button className="btn-primary">Create Account</button>
        </Link>
      </section>
    </div>
  );
}

function Feature({ title, text }) {
  return (
    <div className="feature-card">
      <h3 className="feature-title">{title}</h3>
      <p className="feature-text">{text}</p>
    </div>
  );
}