import { useEffect, useMemo, useState } from "react";
import { api, type Category, type Product, type SaleConfig } from "../api";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useLiveData } from "../hooks/useLiveData";
import { useReviews } from "../hooks/useReviews";
import { TestimonialCarousel } from "../components/ui/testimonial";

type HomePageProps = {
  onSelectProduct: (product: Product) => void;
  onOpenCustomOrder: () => void;
  onBrowseMenu: () => void;
  onToast: (toast: AlertToastState) => void;
};

export const HomePage = ({
  onSelectProduct,
  onOpenCustomOrder,
  onBrowseMenu,
  onToast
}: HomePageProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sale, setSale] = useState<SaleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const liveDataUpdate = useLiveData(["products", "categories", "sales"]);
  const { reviews } = useReviews({ featuredOnly: true });

  useEffect(() => {
    const load = async () => {
      try {
        const [categoriesData, productsData, saleData] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
          api.getActiveSale()
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
        setSale(saleData);
      } catch {
        onToast({ type: "error", message: "Unable to load home highlights." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [onToast, liveDataUpdate]);

  const specials = useMemo(() => {
    const featured = products.filter((p) => p.featured);
    return featured.length > 0 ? featured.slice(0, 4) : products.slice(0, 4);
  }, [products]);
  const featuredCategories = useMemo(() => categories.slice(0, 8), [categories]);
  const featuredTestimonials = useMemo(() => {
    return reviews.slice(0, 5).map((review) => ({
      id: review.id,
      name: review.authorName,
      avatar: review.avatar,
      description: review.comment,
      productName: review.productName,
      rating: review.rating
    }));
  }, [reviews]);

  const getSalePrice = (price: number) => {
    if (!sale || !sale.active) {
      return null;
    }
    if (sale.type === "PERCENT") {
      return Math.max(0, price - price * (sale.amount / 100));
    }
    return Math.max(0, price - sale.amount);
  };

  const handleCategoryClick = (category: Category) => {
    const normalized = category.name.trim().toLowerCase();
    if (normalized === "custom cakes" || normalized === "custom cake") {
      onOpenCustomOrder();
      return;
    }
    onBrowseMenu();
  };

  return (
    <section className="page home-page">
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
      <div className="home-hero">
        <div className="home-hero__media" />
        <div className="home-hero__content">
          <p className="eyebrow">New Arrivals</p>
          <h2>Freshly Baked</h2>
          <p className="muted">
            Experience warm loaves, artisan cakes, and seasonal favorites from
            our ovens.
          </p>
          <div className="home-hero__actions">
            <button className="primary" onClick={onOpenCustomOrder} type="button">
              Design Your Cake
            </button>
            <button className="ghost" onClick={onBrowseMenu} type="button">
              Explore Menu
            </button>
          </div>
        </div>
      </div>

      <div className="section-title home-section-title">
        <h3>Today&apos;s Specials</h3>
        <button className="link-button" onClick={onBrowseMenu} type="button">
          View All
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading specials...</p>
      ) : specials.length === 0 ? (
        <p className="muted">No specials available yet.</p>
      ) : (
        <div className="home-specials">
          {specials.map((product) => (
            <button
              key={product.id}
              className="home-special-card"
              onClick={() => onSelectProduct(product)}
              type="button"
            >
              <div
                className="home-special-card__image"
                style={
                  product.imageUrl
                    ? { backgroundImage: `url(${product.imageUrl})` }
                    : undefined
                }
              />
              <div className="home-special-card__body">
                <h4>{product.name}</h4>
                {product.description ? (
                  <p className="muted">{product.description}</p>
                ) : (
                  <p className="muted">{product.categoryName}</p>
                )}
                {(() => {
                  const salePrice = getSalePrice(product.priceInr);
                  return (
                    <div className="price-row">
                      <span className="price">₹{salePrice ?? product.priceInr}</span>
                      {salePrice != null ? (
                        <span className="price price--strike">₹{product.priceInr}</span>
                      ) : null}
                    </div>
                  );
                })()}
                {product.tags && product.tags.length > 0 ? (
                  <div className="tag-row">
                    {product.tags.slice(0, 2).map((tag) => (
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
            </button>
          ))}
        </div>
      )}

      <div className="section-title home-section-title">
        <h3>Browse Categories</h3>
        <button className="link-button" onClick={onBrowseMenu} type="button">
          See All
        </button>
      </div>
      {loading ? (
        <p className="muted">Loading categories...</p>
      ) : featuredCategories.length === 0 ? (
        <p className="muted">No categories available yet.</p>
      ) : (
        <div className="home-categories">
          {featuredCategories.map((category) => (
            <button
              key={category.id}
              className="category-card"
              onClick={() => handleCategoryClick(category)}
              type="button"
            >
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="home-custom-card">
        <div>
          <p className="eyebrow">Signature</p>
          <h3>Create A Custom Cake</h3>
          <p className="muted">
            Choose flavors, size, and a message for your celebration.
          </p>
        </div>
        <button className="primary" onClick={onOpenCustomOrder} type="button">
          Start Custom Order
        </button>
      </div>

      {featuredTestimonials.length > 0 ? (
        <div className="home-testimonials">
          <div className="section-title">
            <h3>Loved By Guests</h3>
          </div>
          <TestimonialCarousel
            testimonials={featuredTestimonials}
            className="home-testimonials__carousel"
          />
        </div>
      ) : null}
    </section>
  );
};
