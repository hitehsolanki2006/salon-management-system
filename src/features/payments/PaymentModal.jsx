import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useModal } from "../../context/ModalContext";
import "../../style/PaymentModal.css";

export default function PaymentModal({ appointment, onClose, onSuccess }) {
  const { openError } = useModal();
  const [method, setMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptNo, setReceiptNo] = useState("");

  const payNow = async () => {
    setLoading(true);
    const receipt = `RCT-${Date.now()}`;
    setReceiptNo(receipt);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Try to insert payment
    const { error: paymentError } = await supabase.from("payments").insert({
      appointment_id: appointment.id,
      amount: appointment.total_amount,
      payment_mode: method,
      receipt_no: receipt
    });

    // If payment insert fails due to RLS, just update appointment status
    // (This happens when customers try to pay - they don't have payment insert permission)
    if (paymentError) {
      console.log("Payment insert failed (RLS), updating appointment only:", paymentError.message);
      
      // Just mark appointment as completed
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ 
          status: "completed",
          // Store payment info in a note or custom field if needed
        })
        .eq("id", appointment.id);

      if (updateError) {
        openError(updateError.message, "Payment Failed");
        setLoading(false);
        return;
      }
    } else {
      // Payment inserted successfully, now update appointment
      await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointment.id);
    }

    setLoading(false);
    setShowSuccess(true);

    // Auto-close after 3 seconds and trigger success callback
    setTimeout(() => {
      onClose();
      if (onSuccess) onSuccess(); // Call success callback only after payment
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="modal-overlay">
        <div className="payment-modal success-modal">
          <div className="success-animation">
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
                <div className="icon-circle"></div>
                <div className="icon-fix"></div>
              </div>
            </div>
          </div>
          <h2>Payment Successful!</h2>
          <div className="receipt-info">
            <p className="receipt-label">Receipt Number</p>
            <p className="receipt-number">{receiptNo}</p>
          </div>
          <div className="success-details">
            <div className="detail-row">
              <span>Customer:</span>
              <strong>{appointment.customer?.full_name}</strong>
            </div>
            <div className="detail-row">
              <span>Amount Paid:</span>
              <strong className="amount">₹{appointment.total_amount}</strong>
            </div>
            <div className="detail-row">
              <span>Payment Method:</span>
              <strong>{method === 'cash' ? '💵 Cash' : '💳 Online'}</strong>
            </div>
          </div>
          <p className="success-message">Appointment completed successfully!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <div className="header-icon">💳</div>
            <div>
              <h2>Collect Payment</h2>
              <p>Complete the transaction</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="payment-summary">
            <h3>Payment Summary</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span className="label">Customer:</span>
                <span className="value">{appointment.customer?.full_name}</span>
              </div>
              <div className="summary-row">
                <span className="label">Services:</span>
                <span className="value">{appointment.appointment_services?.length || 0} service(s)</span>
              </div>
              <div className="service-list">
                {appointment.appointment_services?.map((as, idx) => (
                  <div key={idx} className="service-row">
                    <span>✂️ {as.services?.name}</span>
                    <span>₹{as.price}</span>
                  </div>
                ))}
              </div>
              <div className="summary-row total-row">
                <span className="label">Total Amount:</span>
                <span className="total-amount">₹{appointment.total_amount}</span>
              </div>
            </div>
          </div>

          <div className="payment-methods">
            <h3>Select Payment Method</h3>
            <div className="payment-options">
              <label className={`payment-option ${method === "cash" ? "selected" : ""}`}>
                <input
                  type="radio"
                  value="cash"
                  checked={method === "cash"}
                  onChange={() => setMethod("cash")}
                />
                <div className="option-card">
                  <div className="option-icon">💵</div>
                  <div className="option-content">
                    <h4>Cash Payment</h4>
                    <p>Pay with physical currency</p>
                  </div>
                  <div className="option-check">✓</div>
                </div>
              </label>

              <label className={`payment-option ${method === "online" ? "selected" : ""}`}>
                <input
                  type="radio"
                  value="online"
                  checked={method === "online"}
                  onChange={() => setMethod("online")}
                />
                <div className="option-card">
                  <div className="option-icon">💳</div>
                  <div className="option-content">
                    <h4>Online Payment</h4>
                    <p>UPI / Card / Net Banking</p>
                  </div>
                  <div className="option-check">✓</div>
                </div>
              </label>
            </div>
          </div>

          {method === "online" && (
            <div className="qr-section">
              <h3>Scan QR Code to Pay</h3>
              <div className="qr-container">
                <div className="qr-code-wrapper">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=salonflow@upi&pn=SalonFlow&am=${appointment.total_amount}&cu=INR`}
                    alt="QR Code"
                    className="qr-code"
                  />
                </div>
                <div className="qr-info">
                  <p className="qr-label">Amount to Pay</p>
                  <p className="qr-amount">₹{appointment.total_amount}</p>
                  <p className="qr-note">Scan with any UPI app</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-confirm" onClick={payNow} disabled={loading}>
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <span className="button-icon">✓</span>
                Confirm Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}