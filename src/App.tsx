import { useEffect, useState, lazy, Suspense } from "react";
import { api, type Combo, type Order, type Product } from "./api";
import { AlertToast } from "./components/AlertToast";
import { BottomNav } from "./components/BottomNav/BottomNav";
import { CustomOrderModal } from "./components/CustomOrderModal";
import { Navbar } from "./components/Navbar/Navbar";
import { OrderSuccessModal } from "./components/OrderSuccessModal";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { useAlertToast } from "./hooks/useAlertToast";
import { useCart } from "./hooks/useCart";
import { useGuestSession } from "./hooks/useGuestSession";
import { useTheme } from "./hooks/useTheme";

// Eager load: home page, cart, favorites (likely to be accessed immediately)
import { HomePage } from "./pages/HomePage";
import { CartPage } from "./pages/CartPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { MenuPage } from "./pages/MenuPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { GuestInfoPage } from "./pages/GuestInfoPage";
import ProductDetail from "./pages/ProductDetail";
import ComboDetail from "./pages/ComboDetail";

// Lazy load: admin, orders, reviews, staff login (accessed less frequently)
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((module) => ({ default: module.AdminPage }))
);
const MyOrdersPage = lazy(() =>
  import("./pages/MyOrdersPage").then((module) => ({ default: module.MyOrdersPage }))
);
const StaffLoginPage = lazy(() =>
  import("./pages/StaffLoginPage").then((module) => ({ default: module.StaffLoginPage }))
);
const ReviewsPage = lazy(() =>
  import("./pages/ReviewsPage").then((module) => ({ default: module.ReviewsPage }))
);

const OWNER_LOGIN_PATH = "/owner-k9v3p8t7q4n6r1x5m0c2z8h1";

import { useAdminSession } from "./hooks/useAdminSession";

// Loading fallback component
const PageLoader = () => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
    <p style={{ color: "var(--muted)" }}>Loading...</p>
  </div>
);

type View =
  | "home"
  | "menu"
  | "favorites"
  | "cart"
  | "checkout"
  | "orders"
  | "profile"
  | "staff"
  | "reviews";

const viewTitles: Record<View, string> = {
  home: "Home",
  menu: "Menu",
  favorites: "My Favorites",
  cart: "Shopping Bag",
  checkout: "Checkout",
  orders: "My Orders",
  profile: "Guest Information",
  staff: "Owner Login",
  reviews: "My Reviews"
};

type AppProps = {};
export default function App() {
  const { guest, isIdentified, addPlacedOrderId, addCustomRequest } = useGuestSession();
  const { items, subtotal, clearCart, addCustomOrder, removeItem } = useCart();
  const { isAuthenticated: isAdmin } = useAdminSession();
  const { toast, showToast, clearToast } = useAlertToast();
  const { theme } = useTheme();
  const [view, setView] = useState<View>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customOrderOpen, setCustomOrderOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  const handleNavigate = (nextView: View) => {
    setSelectedProduct(null);
    setSelectedCombo(null);
    setView(nextView);
    document.title = `BakersField | ${viewTitles[nextView]}`;
  };

  useEffect(() => {
    if (window.location.pathname === OWNER_LOGIN_PATH) {
      setSelectedProduct(null);
      setSelectedCombo(null);
      setView("staff");
      document.title = `BakersField | ${viewTitles.staff}`;
    }
  }, []);

  const handleSelectProduct = (product: Product) => {
    setSelectedCombo(null);
    setSelectedProduct(product);
  };

  const handleSelectCombo = (combo: Combo) => {
    setSelectedProduct(null);
    setSelectedCombo(combo);
  };

  const handleOrderSuccess = (order: Order) => {
    setLastPlacedOrder(order);
    handleNavigate("orders");
  };

  const handleCustomOrderSubmit = async (payload: Parameters<typeof api.placeCustomOrder>[0]) => {
    if (!guest.name.trim() || !guest.phone.trim()) {
      showToast({
        type: "error",
        message: "Please complete your guest profile first."
      });
      return;
    }
    try {
      const result = await api.placeCustomOrder(payload);
      addCustomRequest({
        id: result.id,
        occasion: payload.occasion,
        description: payload.description,
        budgetInr: payload.estimatedPriceInr,
        createdAt: new Date().toISOString()
      });
      addCustomOrder({
        id: result.id,
        name: `Custom Order: ${payload.occasion}`,
        priceInr: payload.estimatedPriceInr,
        details: payload.description,
        imageUrl: payload.imageUrl || "/pics/custom-cake-step3.png"
      });
      
      showToast({ type: "success", message: "Custom order request added to bag." });
      setCustomOrderOpen(false);
      handleNavigate("cart");
    } catch {
      showToast({ type: "error", message: "Custom order could not be sent." });
    }
  };

  const renderContent = () => {
    if (selectedProduct) {
      return (
        <ProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          onToast={showToast}
        />
      );
    }

    if (selectedCombo) {
      return (
        <ComboDetail
          combo={selectedCombo}
          onBack={() => setSelectedCombo(null)}
          onToast={showToast}
        />
      );
    }

    switch (view) {
      case "home":
        return (
          <HomePage
            onSelectProduct={handleSelectProduct}
            onOpenCustomOrder={() => setCustomOrderOpen(true)}
            onBrowseMenu={() => handleNavigate("menu")}
            onToast={showToast}
          />
        );
      case "menu":
        return (
          <MenuPage
            onSelectProduct={handleSelectProduct}
            onSelectCombo={handleSelectCombo}
            onOpenCustomOrder={() => setCustomOrderOpen(true)}
            onToast={showToast}
          />
        );
      case "favorites":
        return (
          <FavoritesPage
            onSelectProduct={handleSelectProduct}
            onBrowseMenu={() => handleNavigate("menu")}
            onToast={showToast}
          />
        );
      case "cart":
        return (
          <CartPage
            onCheckout={() => handleNavigate("checkout")}
            onOrderSuccess={handleOrderSuccess}
            onToast={showToast}
          />
        );
      case "checkout":
        return (
          <CheckoutPage
            onOrderPlaced={handleOrderSuccess}
            onNavigateProfile={() => handleNavigate("profile")}
            onToast={showToast}
          />
        );
      case "orders":
        return (
          <Suspense fallback={<PageLoader />}>
            <MyOrdersPage onToast={showToast} />
          </Suspense>
        );
      case "profile":
        return <GuestInfoPage onToast={showToast} onNavigate={handleNavigate as (view: string) => void} />;
      case "staff":
        return (
          <Suspense fallback={<PageLoader />}>
            {isAdmin ? <AdminPage onToast={showToast} /> : <StaffLoginPage onToast={showToast} />}
          </Suspense>
        );
      case "reviews":
        return (
          <Suspense fallback={<PageLoader />}>
            <ReviewsPage onToast={showToast} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onNavigate={(nextView) => handleNavigate(nextView as View)}
        onOrderCustomCake={() => setCustomOrderOpen(true)}
      />
      <Navbar
        title={selectedProduct ? "Product" : viewTitles[view]}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <main>{renderContent()}</main>
      {view !== "staff" ? (
        <BottomNav active={view} onNavigate={(nextView) => handleNavigate(nextView as View)} />
      ) : null}
      <CustomOrderModal
        open={customOrderOpen}
        guest={guest}
        onClose={() => setCustomOrderOpen(false)}
        onSubmit={handleCustomOrderSubmit}
      />
      <AlertToast toast={toast} onClose={clearToast} />
      {lastPlacedOrder && (
        <OrderSuccessModal
          order={lastPlacedOrder}
          onClose={() => setLastPlacedOrder(null)}
        />
      )}
    </div>
  );
}
