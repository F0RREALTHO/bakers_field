import { useEffect, useState } from "react";
import { api, type Order, type SaleConfig } from "../api";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useCart } from "../hooks/useCart";
import { useGuestSession } from "../hooks/useGuestSession";

type CartPageProps = {
  onCheckout: () => void;
  onOrderSuccess: (order: Order) => void;
  onToast: (toast: AlertToastState) => void;
};

export const CartPage = ({ onCheckout, onOrderSuccess, onToast }: CartPageProps) => {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { guest, addPlacedOrderId } = useGuestSession();
  const hasCustomItem = items.some((item) => item.itemType === "CUSTOM");
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const [sale, setSale] = useState<SaleConfig | null>(null);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [saleName, setSaleName] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const couponStorageKey = "bakersfield.cartCoupon";

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

    const pseudoOrder: Order = {
      id: customItem.itemId,
      customerName: guest.name || "Guest",
      phoneNumber: guest.phone || "",
      pinCode: "",
      totalAmountInr: totalAmount,
      subtotalAmountInr: totalAmount,
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
        lineTotalInr: customItem.priceInr * customItem.quantity
      }]
    };

    addPlacedOrderId(String(customItem.itemId));
    removeItem(customItem.itemId, "CUSTOM");
    onOrderSuccess(pseudoOrder);
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
        <h2>Shopping Bag</h2>
        {!hasCustomItem ? (
          <button className="primary" onClick={handleCheckout} type="button">
            Proceed to Payment
          </button>
        ) : null}
      </div>
      {hasCustomItem ? (
        <div className="cart-cta-card">
          <div>
            <p className="cart-cta-title">Next: WhatsApp Confirmation</p>
            <p className="muted">
              A bot will message you to finalize custom design details and delivery slot.
            </p>
          </div>
          <button className="primary" onClick={handleCustomConfirm} type="button">
            Confirm Order via WhatsApp
          </button>
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
                <p className="cart-item__price">₹{item.priceInr}</p>
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
        <div>
          <span>Total</span>
          <strong>₹{totalAmount}</strong>
        </div>
      </div>
    </section>
  );
};
