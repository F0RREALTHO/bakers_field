import { useEffect, useState } from "react";
import { api, type Product, type SaleConfig } from "../api";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../hooks/useFavorites";

type ProductDetailProps = {
  product: Product;
  onBack: () => void;
  onToast: (toast: AlertToastState) => void;
};

const ProductDetail = ({
  product,
  onBack,
  onToast
}: ProductDetailProps) => {
  const { addProduct } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [sale, setSale] = useState<SaleConfig | null>(null);
  const handleAdd = () => {
    addProduct(product, 1);
    onToast({ type: "success", message: "Added to bag." });
  };

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

  const commonTagMeta = [
    { slug: "handcrafted", label: "Handcrafted", icon: "✋" },
    { slug: "fresh-baked", label: "Fresh Baked", icon: "🥖" },
    { slug: "100-veg", label: "100% Veg", icon: "🌿" }
  ];

  const detailTags = commonTagMeta.filter((tag) =>
    product.tags?.some((productTag) => productTag.slug === tag.slug)
  );

  return (
    <section className="page detail-page">
      {sale && sale.active ? (
        <div className="sale-banner">
          <div>
            <p className="sale-banner__title">{sale.name || "Festival Sale"}</p>
            <p className="sale-banner__note">Limited-time savings on this item.</p>
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
        <button
          className={`detail-favorite ${
            isFavorite(product.id) ? "is-active" : ""
          }`}
          onClick={() => {
            const wasFavorite = isFavorite(product.id);
            toggleFavorite(product.id);
            onToast({
              type: "favorite",
              message: wasFavorite ? "Removed from favorites." : "Saved to favorites!"
            });
          }}
          type="button"
          aria-label={
            isFavorite(product.id)
              ? "Remove from favorites"
              : "Add to favorites"
          }
        >
          <svg className="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20.6 4.9 13.2a5 5 0 0 1 0-7.1 5 5 0 0 1 7 0l1.1 1.2 1.1-1.2a5 5 0 0 1 7 0 5 5 0 0 1 0 7.1L12 20.6z" />
          </svg>
        </button>
      </div>

      <div
        className="detail-hero"
        style={
          product.imageUrl
            ? { backgroundImage: `url(${product.imageUrl})` }
            : undefined
        }
      />

      <div className="detail-info">
        <div>
          <h2>{product.name}</h2>
          {(() => {
            const salePrice = getSalePrice(product.priceInr);
            const originalPrice = product.originalPriceInr ?? (salePrice != null ? product.priceInr : null);
            return (
              <div className="price-row" style={{ alignItems: "center", gap: "0.5rem" }}>
                <p className="price">₹{salePrice ?? product.priceInr}</p>
                {originalPrice != null ? (
                  <p className="price price--strike">₹{originalPrice}</p>
                ) : null}
                {product.weightKg ? (
                  <span className="muted" style={{ fontSize: "0.9rem" }}>
                    ({product.weightKg} kg)
                  </span>
                ) : null}
              </div>
            );
          })()}
        </div>
        {product.description ? (
          <p className="muted">{product.description}</p>
        ) : (
          <p className="muted">Freshly baked daily at BakersField.</p>
        )}
        {product.tags && product.tags.length > 0 ? (
          <div className="tag-row">
            {product.tags.map((tag) => (
              <span
                key={tag.id}
                className="tag-pill"
                style={{
                  backgroundColor: tag.backgroundColor,
                  color: tag.textColor
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {detailTags.length > 0 ? (
        <div className="detail-attrs">
          {detailTags.map((tag) => (
            <div key={tag.slug} className="detail-attr">
              <span className="detail-attr__icon" aria-hidden="true">
                {tag.icon}
              </span>
              <span>{tag.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="detail-section">
        <h3>Ingredients</h3>
        <div className="detail-chips">
          {(product.ingredients && product.ingredients.length > 0) ? (
            product.ingredients.map(ingredient => (
              <span key={ingredient} className="detail-chip">{ingredient}</span>
            ))
          ) : (
            <>
              <span className="detail-chip">Organic Wheat Flour</span>
              <span className="detail-chip">Wild Yeast Starter</span>
              <span className="detail-chip">Sea Salt</span>
              <span className="detail-chip">Purified Water</span>
            </>
          )}
        </div>
      </div>

      <div className="detail-nutrition">
        <button
          className="detail-nutrition__toggle"
          onClick={() => setNutritionOpen((open) => !open)}
          type="button"
          aria-expanded={nutritionOpen}
        >
          <span>Nutritional Information</span>
          <span aria-hidden="true">{nutritionOpen ? "▴" : "▾"}</span>
        </button>
        {nutritionOpen ? (
          <p className="detail-nutrition__content">
            Calories: {product.calories || "250kcal"} | Protein: {product.protein || "8g"}
          </p>
        ) : null}
      </div>

      <div className="detail-sticky-cta">
        <button className="primary primary--wide" onClick={handleAdd} type="button">
          Add to Shopping Bag
        </button>
      </div>
    </section>
  );
};

export default ProductDetail;
