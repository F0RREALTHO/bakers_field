import { useEffect, useMemo, useState } from "react";
import { api, type Category, type Combo, type Product, type SaleConfig } from "../api";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useLiveData } from "../hooks/useLiveData";
import { useFavorites } from "../hooks/useFavorites";
import { useCart } from "../hooks/useCart";

type MenuPageProps = {
  onSelectProduct: (product: Product) => void;
  onSelectCombo: (combo: Combo) => void;
  onOpenCustomOrder: () => void;
  onToast: (toast: AlertToastState) => void;
};

export const MenuPage = ({
  onSelectProduct,
  onSelectCombo,
  onOpenCustomOrder,
  onToast
}: MenuPageProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [sale, setSale] = useState<SaleConfig | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const liveDataUpdate = useLiveData(["products", "categories", "combos", "sales"]);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addCombo, addProduct, items, updateQuantity } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const [categoriesData, productsData, combosData, saleData] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
          api.getCombos(),
          api.getActiveSale()
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
        setCombos(combosData);
        setSale(saleData);
      } catch (error) {
        onToast({
          type: "error",
          message: "Unable to load catalog right now."
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [onToast, liveDataUpdate]);

  const getSalePrice = (price: number) => {
    if (!sale || !sale.active) {
      return null;
    }
    if (sale.type === "PERCENT") {
      return Math.max(0, price - price * (sale.amount / 100));
    }
    return Math.max(0, price - sale.amount);
  };

  const quantityLookup = useMemo(() => {
    const lookup = new Map<string, number>();
    items.forEach((item) => {
      lookup.set(`${item.itemType}-${item.itemId}`, item.quantity);
    });
    return lookup;
  }, [items]);

  const getItemQuantity = (itemType: "PRODUCT" | "COMBO", itemId: number) =>
    quantityLookup.get(`${itemType}-${itemId}`) ?? 0;

  const filteredProducts = useMemo(() => {
    if (!activeCategoryId) {
      return products;
    }
    return products.filter((product) => product.categoryId === activeCategoryId);
  }, [activeCategoryId, products]);

  const handleCategoryClick = (category: Category) => {
    const normalized = category.name.trim().toLowerCase();
    if (normalized === "custom cakes" || normalized === "custom cake") {
      onOpenCustomOrder();
      return;
    }
    setActiveCategoryId(category.id);
  };

  return (
    <section className="page">
      {sale && sale.active ? (
        <div className="sale-banner">
          <div>
            <p className="sale-banner__title">{sale.name || "Festival Sale"}</p>
            <p className="sale-banner__note">Sitewide savings on every item.</p>
          </div>
          <span className="sale-banner__tag">
            {sale.type === "PERCENT" ? `${sale.amount}% OFF` : `₹${sale.amount} OFF`}
          </span>
        </div>
      ) : null}
      <div className="hero">
        <div>
          <p className="eyebrow">New Arrivals</p>
          <h2>Freshly Baked</h2>
          <p className="muted">
            Discover today&apos;s specials, artisan loaves, and signature treats.
          </p>
        </div>
        <button className="primary" onClick={onOpenCustomOrder} type="button">
          Design Your Cake
        </button>
      </div>

      <div className="section-title">
        <h3>Browse Categories</h3>
        <button className="link-button" type="button" onClick={() => setActiveCategoryId(null)}>
          See All
        </button>
      </div>
      <div className="category-row">
        {loading ? (
          <p className="muted">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="muted">No categories available yet.</p>
        ) : (
          categories.map((category) => (
            <button
              key={category.id}
              className={`category-card ${
                activeCategoryId === category.id ? "is-active" : ""
              }`}
              onClick={() => handleCategoryClick(category)}
              type="button"
            >
              <span>{category.name}</span>
            </button>
          ))
        )}
      </div>

      <div className="section-title">
        <h3>Menu</h3>
        <span className="section-hint">
          {filteredProducts.length} items
        </span>
      </div>

      {combos.length > 0 ? (
        <div className="combo-section">
          <div className="section-title">
            <h3>Combos</h3>
            <span className="section-hint">Bundles</span>
          </div>
          <div className="product-grid">
            {combos.map((combo) => {
              const salePrice = getSalePrice(combo.priceInr);
              const comboQuantity = getItemQuantity("COMBO", combo.id);
              return (
                <div
                  key={combo.id}
                  className="product-card combo-card"
                  onClick={() => onSelectCombo(combo)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectCombo(combo);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className="product-card__image"
                    style={
                      combo.imageUrl
                        ? { backgroundImage: `url(${combo.imageUrl})` }
                        : undefined
                    }
                  />
                  <div>
                    <h4>{combo.name}</h4>
                    <p className="muted">{combo.description ?? "Bundle deal"}</p>
                    <p className="muted">
                      {combo.items.map((item) => `${item.quantity}x ${item.productName}`).join(" · ")}
                    </p>
                  </div>
                  <div className="product-card__footer">
                    <span className="price">
                      ₹{salePrice ?? combo.priceInr}
                    </span>
                    {salePrice != null ? (
                      <span className="price price--strike">₹{combo.priceInr}</span>
                    ) : null}
                    <div className="product-card__actions">
                      <button
                        className="pill pill--ghost"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectCombo(combo);
                        }}
                      >
                        View
                      </button>
                      {comboQuantity > 0 ? (
                        <div
                          className={`product-card__quantity ${
                            comboQuantity > 0 ? "is-visible" : ""
                          }`}
                        >
                          <button
                            className="pill"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              updateQuantity(combo.id, "COMBO", comboQuantity - 1);
                            }}
                          >
                            -
                          </button>
                          <span>{comboQuantity}</span>
                          <button
                            className="pill"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              addCombo(combo, 1);
                            }}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="pill"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            addCombo(combo, 1);
                            onToast({ type: "success", message: "Combo added to bag." });
                          }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="muted">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="muted">No products available yet.</p>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => {
            const productQuantity = getItemQuantity("PRODUCT", product.id);
            return (
              <div
                key={product.id}
                className="product-card"
                onClick={() => onSelectProduct(product)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectProduct(product);
                  }
                }}
                role="button"
                tabIndex={0}
              >
              <button
                className={`product-card__favorite ${
                  isFavorite(product.id) ? "is-active" : ""
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFavorite(product.id);
                }}
                type="button"
                aria-label={
                  isFavorite(product.id)
                    ? `Remove ${product.name} from favorites`
                    : `Add ${product.name} to favorites`
                }
              >
                <svg className="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20.6 4.9 13.2a5 5 0 0 1 0-7.1 5 5 0 0 1 7 0l1.1 1.2 1.1-1.2a5 5 0 0 1 7 0 5 5 0 0 1 0 7.1L12 20.6z" />
                </svg>
              </button>
              <div
                className="product-card__image"
                style={
                  product.imageUrl
                    ? { backgroundImage: `url(${product.imageUrl})` }
                    : undefined
                }
              />
              <div>
                <h4>{product.name}</h4>
                <p className="muted">{product.categoryName}</p>
                {product.tags && product.tags.length > 0 ? (
                  <div className="tag-row">
                    {product.tags.slice(0, 3).map((tag) => (
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
                {product.description ? (
                  <p className="product-card__desc">{product.description}</p>
                ) : null}
              </div>
                <div className="product-card__footer">
                  {(() => {
                    const salePrice = getSalePrice(product.priceInr);
                    return (
                      <>
                        <span className="price">₹{salePrice ?? product.priceInr}</span>
                        {salePrice != null ? (
                          <span className="price price--strike">₹{product.priceInr}</span>
                        ) : null}
                      </>
                    );
                  })()}
                  <div className="product-card__actions">
                    <button
                      className="pill pill--ghost"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectProduct(product);
                      }}
                    >
                      View
                    </button>
                    {productQuantity > 0 ? (
                      <div
                        className={`product-card__quantity ${
                          productQuantity > 0 ? "is-visible" : ""
                        }`}
                      >
                        <button
                          className="pill"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            updateQuantity(product.id, "PRODUCT", productQuantity - 1);
                          }}
                        >
                          -
                        </button>
                        <span>{productQuantity}</span>
                        <button
                          className="pill"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            addProduct(product, 1);
                          }}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        className="pill"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          addProduct(product, 1);
                          onToast({ type: "success", message: "Added to bag." });
                        }}
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
