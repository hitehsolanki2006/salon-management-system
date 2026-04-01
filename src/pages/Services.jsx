import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import AuthModal from "../components/modals/AuthModal";
import useServices from "../features/services/useServices";
import Cart from "../features/cart/Cart";
import "../style/Services.css";

export default function Services() {
  const { user } = useAuth();
  const { services, loading } = useServices();
  const { openSuccess, openInfo } = useModal();
  const [showAuth, setShowAuth] = useState(false);
  const [cart, setCart] = useState([]);
  const [sortBy, setSortBy] = useState("popular");
  const [searchTerm, setSearchTerm] = useState("");

  const addToCart = (service) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === service.id);
      if (existingItem) {
        openInfo(`${service.name} quantity increased`, "Added to Cart");
        return prev.map((item) =>
          item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      openSuccess(`${service.name} added to cart`, "Added to Cart");
      return [...prev, { ...service, quantity: 1 }];
    });
  };

  const decreaseQuantity = (serviceId) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === serviceId);
      if (existingItem?.quantity === 1) {
        return prev.filter((item) => item.id !== serviceId);
      }
      return prev.map((item) =>
        item.id === serviceId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  const getItemQuantity = (serviceId) => {
    return cart.find((item) => item.id === serviceId)?.quantity || 0;
  };

  const getFilteredAndSortedServices = () => {
    let filtered = services.filter((s) => s.is_active);

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "duration":
        filtered.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      default:
        break;
    }
    return filtered;
  };

  const filteredServices = getFilteredAndSortedServices();

  if (loading) {
    return (
      <div className="services-loading">
        <div className="loading-spinner"></div>
        <p>Loading services...</p>
      </div>
    );
  }

  return (
    <div className="services-container">
      <div className="services-content">
        <div className="services-header">
          <h2 className="services-title">Our Services</h2>
          <p className="services-subtitle">
            Choose from our premium collection of salon services
          </p>
        </div>

        {/* SEARCH & SORT */}
        <div className="services-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="popular">Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A-Z</option>
            <option value="duration">Duration</option>
          </select>
        </div>

        {/* SERVICES GRID */}
        <div className="services-grid">
          {filteredServices.map((s) => {
            const quantity = getItemQuantity(s.id);
            const hasDiscount = s.discount_allowed && s.discount_percent > 0;
            const discountedPrice = hasDiscount
              ? Math.round(s.price - (s.price * s.discount_percent) / 100)
              : s.price;

            return (
              <div key={s.id} className="service-card">
                {hasDiscount && (
                  <div className="discount-badge">-{s.discount_percent}% OFF</div>
                )}

                <div className="service-image-container">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.name} className="service-image" />
                  ) : (
                    <div className="service-no-image">
                      <span className="no-image-icon">✂️</span>
                    </div>
                  )}
                </div>

                <div className="service-content">
                  <h4 className="service-name">{s.name}</h4>
                  <p className="service-description">
                    {s.description || "Professional salon service"}
                  </p>

                  {s.duration && (
                    <div className="service-duration">
                      <span className="duration-icon">⏱️</span>
                      <span className="duration-text">{s.duration} mins</span>
                    </div>
                  )}

                  <div className="service-pricing">
                    {hasDiscount ? (
                      <>
                        <span className="price-old">₹{s.price}</span>
                        <span className="price-new">₹{discountedPrice}</span>
                      </>
                    ) : (
                      <span className="price-regular">₹{s.price}</span>
                    )}
                  </div>

                  {/* QUANTITY CONTROLS */}
                  {quantity === 0 ? (
                    <button
                      className="btn-add-to-cart"
                      onClick={() =>
                        addToCart({ ...s, final_price: discountedPrice })
                      }
                    >
                      <span className="cart-icon">🛒</span>
                      Add to Cart
                    </button>
                  ) : (
                    <div className="quantity-controls">
                      <button
                        className="qty-btn"
                        onClick={() => decreaseQuantity(s.id)}
                      >
                        −
                      </button>
                      <span className="qty-number">{quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() =>
                          addToCart({ ...s, final_price: discountedPrice })
                        }
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="no-services">
            <span className="no-services-icon">😔</span>
            <p>No services found matching your criteria</p>
          </div>
        )}
      </div>

      {/* CART SIDEBAR */}
      <Cart
        cart={cart}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
      />

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}