import { useEffect, useMemo, useState } from "react";
import { api, type Product, type SaleConfig } from "../api";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../hooks/useFavorites";

type FavoritesPageProps = {
  onSelectProduct: (product: Product) => void;
  onBrowseMenu: () => void;
  onToast: (toast: AlertToastState) => void;
};

export const FavoritesPage = ({
  onSelectProduct,
  onBrowseMenu,
  onToast
}: FavoritesPageProps) => {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { addProduct } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [sale, setSale] = useState<SaleConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [productsData, saleData] = await Promise.all([
          api.getProducts(),
          api.getActiveSale()
        ]);
        setProducts(productsData);
        setSale(saleData);
      } catch {
        onToast({ type: "error", message: "Unable to load favorites." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [onToast]);

  const favoriteProducts = useMemo(() => {
    if (favorites.length === 0) {
      return [];
    }
    const byId = new Map(products.map((product) => [product.id, product]));
    return favorites
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product));
  }, [favorites, products]);

  const handleAddAll = () => {
    if (favoriteProducts.length === 0) {
      onToast({ type: "error", message: "No favorites to add yet." });
      return;
    }
    favoriteProducts.forEach((product) => addProduct(product, 1));
    onToast({ type: "success", message: "Added favorites to bag." });
  };

  return (
    <section className="page favorites-page">
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
      <div className="page-header">
        <h2>My Favorites</h2>
        <button className="ghost" onClick={onBrowseMenu} type="button">
          Browse Menu
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading favorites...</p>
      ) : favoriteProducts.length === 0 ? (
        <div className="empty-state">
          <h3>No favorites yet</h3>
          <p className="muted">
            Tap the heart on a product to save it here.
          </p>
          <button className="primary" onClick={onBrowseMenu} type="button">
            Explore Menu
          </button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favoriteProducts.map((product) => (
            <div key={product.id} className="favorite-card">
              <button
                className="favorite-card__image"
                onClick={() => onSelectProduct(product)}
                type="button"
                aria-label={`View ${product.name}`}
                style={
                  product.imageUrl
                    ? { backgroundImage: `url(${product.imageUrl})` }
                    : undefined
                }
              />
              <button
                className={`favorite-card__heart ${
                  isFavorite(product.id) ? "is-active" : ""
                }`}
                onClick={() => toggleFavorite(product.id)}
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
              <div className="favorite-card__body">
                <h3>{product.name}</h3>
                <p className="price">₹{product.priceInr}</p>
                <button
                  className="favorite-card__cta"
                  onClick={() => addProduct(product, 1)}
                  type="button"
                >
                  Add to Bag
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {favoriteProducts.length > 0 ? (
        <div className="favorites-sticky">
          <button className="primary primary--wide" onClick={handleAddAll} type="button">
            Add all to Shopping Bag
          </button>
        </div>
      ) : null}
    </section>
  );
};
