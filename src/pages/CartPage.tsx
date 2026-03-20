import { useEffect, useState } from "react";
import { api, type Order, type SaleConfig } from "../api";
import { openWhatsAppChat } from "../lib/contact";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useCart } from "../hooks/useCart";
import { useGuestSession } from "../hooks/useGuestSession";

type CartPageProps = {
  onCheckout: () => void;
  onOrderSuccess: (order: Order) => void;
  onToast: (toast: AlertToastState) => void;
};

import { ConfirmationModal } from "../components/ConfirmationModal";

export const CartPage = ({ onCheckout, onOrderSuccess, onToast }: CartPageProps) => {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { guest } = useGuestSession();
  const hasCustomItem = items.some((item) => item.itemType === "CUSTOM");
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const [sale, setSale] = useState<SaleConfig | null>(null);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [saleName, setSaleName] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [nameOnOrder, setNameOnOrder] = useState(guest.name);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const couponStorageKey = "bakersfield.cartCoupon";

  const handleClearCart = () => {
    setClearConfirmOpen(true);
  };

  const confirmClearCart = () => {
    clearCart();
    onToast({ type: "success", message: "Shopping bag cleared." });
  };

  useEffect(() => {
    setNameOnOrder((current) => (current ? current : guest.name));
  }, [guest.name]);

  useEffect(() => {
    const loadSale = async () => {
      try {
        const saleData = await api.getActiveSale();
        setSale(saleData);
      } catch {
        setSale(null);
      }
    };
    loadSale();
  }, []);

  useEffect(() => {
    if (!sale || !sale.active) {
      setSaleDiscount(0);
      setSaleName(null);
      return;
    }
    const discount = sale.type === "PERCENT"
      ? Math.max(0, subtotal * (sale.amount / 100))
      : Math.max(0, sale.amount);
    const capped = Math.min(discount, subtotal);
    setSaleDiscount(capped);
    setSaleName(sale.name);
  }, [sale, subtotal]);

  const totalAmount = Math.max(0, subtotal - saleDiscount - couponDiscount);
  const roundedTotalAmount = Math.round(totalAmount);
  const roundingAdjustment = roundedTotalAmount - totalAmount;

  const handleApplyCoupon = async () => {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) {
      onToast({ type: "error", message: "Enter a coupon code." });
      return;
    }
    if (!guest.phone.trim()) {
      onToast({ type: "error", message: "Please add your phone number first." });
      return;
    }
    setIsApplying(true);
    try {
      const result = await api.validateCoupon({
        code: trimmed,
        subtotalAmountInr: subtotal,
        phoneNumber: guest.phone.trim()
      });
      setCouponDiscount(result.discountAmountInr);
      setAppliedCoupon(result.code);
      if (result.saleDiscountAmountInr != null) {
        setSaleDiscount(result.saleDiscountAmountInr);
      }
      if (result.saleName != null) {
        setSaleName(result.saleName);
      }
      localStorage.setItem(
        couponStorageKey,
        JSON.stringify({ code: result.code })
      );
      onToast({ type: "success", message: `Coupon ${result.code} applied.` });
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : "Coupon could not be applied.";
      onToast({ type: "error", message });
      setCouponDiscount(0);
      setAppliedCoupon(null);
    } finally {
      setIsApplying(false);
    }
  };

  const handleClearCoupon = () => {
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponCode("");
    localStorage.removeItem(couponStorageKey);
  };

  const handleCustomConfirm = () => {
    const customItem = items.find(i => i.itemType === "CUSTOM");
    if (!customItem) return;

    const message = [
      "Hi BakersField, I want to confirm my custom cake request.",
      `Request ID: #${customItem.itemId}`,
      `Name: ${nameOnOrder.trim() || guest.name || "Guest"}`,
      `Phone: ${guest.phone || "Not provided"}`,
      customItem.priceInr > 0 ? `Budget: ₹${customItem.priceInr}` : null,
      customItem.details ? `Details: ${customItem.details}` : null
    ]
      .filter(Boolean)
      .join("\n");

    openWhatsAppChat(message);

    const pseudoOrder: Order = {
      id: customItem.itemId,
      customerName: nameOnOrder.trim() || guest.name || "Guest",
      phoneNumber: guest.phone || "",
      pinCode: "",
      totalAmountInr: 0,
      subtotalAmountInr: 0,
      paymentMethod: "WHATSAPP",
      paymentProvider: "WHATSAPP",
      paymentStatus: "PENDING",
      status: "PENDING_CONFIRMATION",
      placedAt: new Date().toISOString(),
      items: [{
        itemType: "CUSTOM",
        itemRefId: customItem.itemId,
        itemName: customItem.name,
        unitPriceInr: customItem.priceInr,
        quantity: customItem.quantity,
        lineTotalInr: 0
      }]
    };

    removeItem(customItem.itemId, "CUSTOM");
    onToast({ type: "success", message: "WhatsApp chat opened. Please send the message to confirm." });
    onOrderSuccess(pseudoOrder);
  };

  const handleOpenCustomWhatsApp = () => {
    const customItem = items.find(i => i.itemType === "CUSTOM");
    if (!customItem) return;
    const message = [
      "Hi BakersField, I need help with my custom cake request.",
      `Request ID: #${customItem.itemId}`,
      `Name: ${nameOnOrder.trim() || guest.name || "Guest"}`,
      `Phone: ${guest.phone || "Not provided"}`,
      customItem.priceInr > 0 ? `Budget: ₹${customItem.priceInr}` : null
    ]
      .filter(Boolean)
      .join("\n");
    openWhatsAppChat(message);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      onToast({ type: "error", message: "Your bag is empty." });
      return;
    }
    onCheckout();
  };

  return (
    <section
      className={`page cart-page cart-page--bold ${hasCustomItem ? "cart-page--custom" : ""}`}
    >
      <div className="page-header cart-header">
        <div className="cart-header__title">
          <h2>Shopping Bag</h2>
          {items.length > 0 && (
            <button className="cart-clear-btn" onClick={handleClearCart}>
              Clear All
            </button>
          )}
        </div>
        {items.length > 0 && !hasCustomItem ? (
          <button className="primary" onClick={handleCheckout} type="button">
            Proceed to Payment
          </button>
        ) : null}
      </div>
      {hasCustomItem ? (
        <div className="cart-cta-card">
          <div>
            <p className="cart-cta-title">Next: Confirm on WhatsApp</p>
            <p className="muted">
              Continue to confirm your custom request and finalize details directly on chat.
            </p>
            <label className="checkout-name-field">
              <strong>Name on order (optional)</strong>
              <input
                value={nameOnOrder}
                onChange={(event) => setNameOnOrder(event.target.value)}
                placeholder="Type a name for this order"
              />
            </label>
          </div>
          <div className="cart-cta-card__actions">
            <button className="primary" onClick={handleCustomConfirm} type="button">
              Continue to Confirm
            </button>
            <button className="ghost" onClick={handleOpenCustomWhatsApp} type="button">
              Open WhatsApp
            </button>
          </div>
        </div>
      ) : null}
        <div className="cart-coupon-card">
          <div className="cart-coupon-card__meta">
            <span className="cart-coupon-icon">%</span>
            <span>Apply Coupon</span>
          </div>
          <div className="cart-coupon-card__form">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Enter code"
            />
            {appliedCoupon ? (
              <button className="ghost" onClick={handleClearCoupon} type="button">
                Clear
              </button>
            ) : (
              <button
                className="primary"
                onClick={handleApplyCoupon}
                type="button"
                disabled={isApplying}
              >
                {isApplying ? "Applying..." : "Apply"}
              </button>
            )}
          </div>
          {appliedCoupon ? (
            <div className="checkout-coupon__applied">
              <span className="checkout-coupon__badge">Applied</span>
              <span className="checkout-coupon__code">{appliedCoupon}</span>
            </div>
          ) : null}
        </div>
      {hasCustomItem ? (
        <h3 className="cart-section-title">Items in Bag ({itemCount})</h3>
      ) : null}
      {items.length === 0 ? (
        <p className="muted">No items added yet.</p>
      ) : (
        <div className={`cart-list ${hasCustomItem ? "cart-list--custom" : ""}`}>
          {items.map((item) => (
            <div
              key={`${item.itemType}-${item.itemId}`}
              className={`cart-item ${item.itemType === "CUSTOM" ? "cart-item--custom" : ""}`}
            >
              {hasCustomItem ? (
                <div className="cart-item__media">
                  <div
                    className="cart-item__image"
                    style={
                      item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined
                    }
                  />
                </div>
              ) : null}
              <div className="cart-item__body">
                <div className="cart-item__header">
                  <div>
                    <h4>{item.name}</h4>
                    {item.details ? (
                      <p className="muted">{item.details}</p>
                    ) : null}
                  </div>
                  <button
                    className="cart-item__remove"
                    onClick={() => removeItem(item.itemId, item.itemType)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <p className="cart-item__price">
                  {item.itemType === "CUSTOM" ? "Price shared on confirmation" : `₹${item.priceInr}`}
                </p>
                <div className="cart-controls">
                  <button
                    className="pill"
                    onClick={() =>
                      updateQuantity(item.itemId, item.itemType, item.quantity - 1)
                    }
                    type="button"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="pill"
                    onClick={() =>
                      updateQuantity(item.itemId, item.itemType, item.quantity + 1)
                    }
                    type="button"
                    disabled={item.itemType === "CUSTOM"}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="summary-card">
        {hasCustomItem ? (
          <>
            <div>
              <span>Custom Request</span>
              <strong>Quote on WhatsApp</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>Awaiting confirmation</strong>
            </div>
          </>
        ) : (
          <>
            <div>
              <span>Subtotal</span>
              <strong>₹{subtotal}</strong>
            </div>
            {saleDiscount > 0 ? (
              <div className="summary-line--discount">
                <span>{saleName ? `Sale (${saleName})` : "Sale"}</span>
                <strong>-₹{saleDiscount}</strong>
              </div>
            ) : null}
            {couponDiscount > 0 ? (
              <div className="summary-line--discount">
                <span>Discount</span>
                <strong>-₹{couponDiscount}</strong>
              </div>
            ) : null}
            {Math.abs(roundingAdjustment) >= 0.01 ? (
              <div className="summary-line--sub">
                <span>Rounded Off</span>
                <strong>{roundingAdjustment >= 0 ? "+" : "-"}₹{Math.abs(roundingAdjustment).toFixed(2)}</strong>
              </div>
            ) : null}
            <div>
              <span>Total</span>
              <strong>₹{roundedTotalAmount}</strong>
            </div>
          </>
        )}
      </div>
      <ConfirmationModal
        open={clearConfirmOpen}
        title="Empty Bag?"
        message="Are you sure you want to remove all items from your shopping bag? This cannot be undone."
        confirmLabel="Clear Bag"
        cancelLabel="Keep Items"
        onConfirm={confirmClearCart}
        onClose={() => setClearConfirmOpen(false)}
        isDestructive
      />
    </section>
  );
};
