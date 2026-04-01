import { useState } from "react";
import { useModal } from "../context/ModalContext"; // ✅ Added
import "../style/ContactUs.css";

export default function ContactUs() {
  const { openSuccess, openError } = useModal(); // ✅ Added
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append("access_key", "455ba334-2635-43c1-9f84-417d2d0acdb0");
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("subject", formData.subject);
    formDataToSend.append("message", formData.message);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        // ✅ Use Modal for Success
        openSuccess("Message sent successfully! We'll get back to you soon.", "Thank You!");
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        openError("Something went wrong with the form submission. Please try again.");
      }
    } catch {
      openError("Failed to connect to the server. Please check your internet.");
    }

    setLoading(false);
  };

  return (
    <div className="contact-container">
      <div className="contact-content">
        <div className="contact-header">
          <h2 className="contact-title">Get In Touch</h2>
          <p className="contact-subtitle">Have a question? We're here to help!</p>
        </div>

        <div className="contact-layout">
          {/* INFO SECTION */}
          <div className="contact-info-section">
            <div className="info-card">
              <div className="info-icon">📍</div>
              <div className="info-content">
                <h4>Visit Us</h4>
                <p>123 Salon Street, Beauty District</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">📞</div>
              <div className="info-content">
                <h4>Call Us</h4>
                <p>+91 98765 43210</p>
              </div>
            </div>
          </div>

          {/* FORM SECTION */}
          <div className="contact-form-section">
            <div className="form-card">
              <h3>Send Us a Message</h3>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Message *</label>
                  <textarea name="message" required rows="6" value={formData.message} onChange={handleChange} className="form-input form-textarea"></textarea>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}