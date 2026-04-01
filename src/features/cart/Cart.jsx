import { useState } from "react";
import BookAppointment from "../appointments/BookAppointment";
import { useModal } from "../../context/ModalContext";
import "./Cart.css";

export default function Cart({ cart, removeFromCart, clearCart }) {
  const [isOpen, setIsOpen] = useState(false);
  const { openSuccess, openConfirm } = useModal();

  // Calculate totals
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.final_price * (item.quantity || 1)), 0);

  // Handle successful booking
  const handleBookingSuccess = () => {
    clearCart();
    setIsOpen(false);
    openSuccess("Your appointment has been booked! Check 'My Appointments' for details.", "Success");
  };

  // Confirm before clearing cart
  const confirmClearCart = () => {
    if (cart.length === 0) return;

    openConfirm(
      "Are you sure you want to remove all services from your cart?",
      () => {
        clearCart();
        openSuccess("Cart has been cleared", "Cart Cleared");
      },
      "Clear Cart"
    );
  };

  // Confirm before removing single item
  const confirmRemoveItem = (index, itemName) => {
    openConfirm(
      `Remove "${itemName}" from cart?`,
      () => {
        removeFromCart(index);
        openSuccess(`${itemName} removed from cart`, "Item Removed");
      },
      "Remove Item"
    );
  };

  return (
    <div className={`cart-sidebar ${isOpen ? "cart-open" : ""}`}>
      {/* TOGGLE BUTTON */}
      <button className="cart-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span className="cart-icon">🛒</span>
        {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
      </button>

      <div className="cart-content">
        <div className="cart-header">
          <h3>Your Cart ({totalItems})</h3>
          <button className="cart-close" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon">🛍️</div>
            <p>Your cart is empty</p>
            <span>Add services to get started</span>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item, index) => {
                const quantity = item.quantity || 1;
                const itemTotal = item.final_price * quantity;

                return (
                  <div key={index} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <div className="cart-item-details">
                        <span className="qty-badge">×{quantity}</span>
                        <span className="price-each">₹{item.final_price} each</span>
                      </div>
                      <p className="cart-item-price">₹{itemTotal}</p>
                    </div>
                    <button
                      className="cart-item-remove"
                      onClick={() => confirmRemoveItem(index, item.name)}
                      title="Remove from cart"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total Amount:</span>
                <strong>₹{totalPrice}</strong>
              </div>

              <button className="btn-clear-cart" onClick={confirmClearCart}>
                🗑️ Clear Cart
              </button>

              <BookAppointment
                cart={cart}
                totalAmount={totalPrice}
                onSuccess={handleBookingSuccess}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}