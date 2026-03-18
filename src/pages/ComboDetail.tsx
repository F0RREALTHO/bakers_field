import { useEffect, useState } from "react";
import { api, type Combo, type SaleConfig } from "../api";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useCart } from "../hooks/useCart";

type ComboDetailProps = {
  combo: Combo;
  onBack: () => void;
  onToast: (toast: AlertToastState) => void;
};

const ComboDetail = ({ combo, onBack, onToast }: ComboDetailProps) => {
  const { addCombo } = useCart();
  const [sale, setSale] = useState<SaleConfig | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const saleData = await api.getActiveSale();
        setSale(saleData);
      } catch {
        setSale(null);
      }
    };
    load();
  }, []);

  const getSalePrice = (price: number) => {
    if (!sale || !sale.active) {
      return null;
    }
    if (sale.type === "PERCENT") {
      return Math.max(0, price - price * (sale.amount / 100));
    }
    return Math.max(0, price - sale.amount);
  };

  const handleAdd = () => {
    addCombo(combo, 1);
    onToast({ type: "success", message: "Combo added to bag." });
  };

  const salePrice = getSalePrice(combo.priceInr);

  return (
    <section className="page detail-page">
      {sale && sale.active ? (
        <div className="sale-banner">
          <div>
            <p className="sale-banner__title">{sale.name || "Festival Sale"}</p>
            <p className="sale-banner__note">Limited-time savings on bundles.</p>
          </div>
          <span className="sale-banner__tag">
            {sale.type === "PERCENT" ? `${sale.amount}% OFF` : `₹${sale.amount} OFF`}
          </span>
        </div>
      ) : null}
      <div className="detail-header">
        <button className="ghost" onClick={onBack} type="button">
          Back
        </button>
      </div>

      <div
        className="detail-hero"
        style={
          combo.imageUrl ? { backgroundImage: `url(${combo.imageUrl})` } : undefined
        }
      />

      <div className="detail-info">
        <div>
          <h2>{combo.name}</h2>
          <div className="price-row">
            <p className="price">₹{salePrice ?? combo.priceInr}</p>
            {salePrice != null ? (
              <p className="price price--strike">₹{combo.priceInr}</p>
            ) : null}
          </div>
        </div>
        {combo.description ? (
          <p className="muted">{combo.description}</p>
        ) : (
          <p className="muted">Curated bundle from BakersField.</p>
        )}
      </div>

      <div className="detail-section">
        <h3>Bundle Items</h3>
        <div className="detail-chips">
          {combo.items.map((item) => (
            <span key={item.productId} className="detail-chip">
              {item.quantity}x {item.productName}
            </span>
          ))}
        </div>
      </div>

      <div className="detail-attrs">
        <div className="detail-attr">
          <span className="detail-attr__icon" aria-hidden="true">
            🎁
          </span>
          <span>Bundle Value</span>
        </div>
        <div className="detail-attr">
          <span className="detail-attr__icon" aria-hidden="true">
            ✨
          </span>
          <span>Chef Curated</span>
        </div>
        <div className="detail-attr">
          <span className="detail-attr__icon" aria-hidden="true">
            🧁
          </span>
          <span>Perfect for sharing</span>
        </div>
      </div>

      <div className="detail-sticky-cta">
        <button className="primary primary--wide" onClick={handleAdd} type="button">
          Add Bundle to Bag
        </button>
      </div>
    </section>
  );
};

export default ComboDetail;
