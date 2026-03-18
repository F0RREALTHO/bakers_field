import { useState } from "react";
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
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AdminPage } from "./pages/AdminPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { GuestInfoPage } from "./pages/GuestInfoPage";
import { HomePage } from "./pages/HomePage";
import { MenuPage } from "./pages/MenuPage";
import { MyOrdersPage } from "./pages/MyOrdersPage";
import ComboDetail from "./pages/ComboDetail";
import ProductDetail from "./pages/ProductDetail";
import { StaffLoginPage } from "./pages/StaffLoginPage";
import { useAdminSession } from "./hooks/useAdminSession";
import { ReviewsPage } from "./pages/ReviewsPage";

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
  const { guest, isIdentified, addPlacedOrderId } = useGuestSession();
  const { items, subtotal, clearCart, addCustomOrder, removeItem } = useCart();
  const { isAuthenticated: isAdmin } = useAdminSession();
  const { toast, showToast, clearToast } = useAlertToast();
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
        return <MyOrdersPage onToast={showToast} />;
      case "profile":
        return <GuestInfoPage onToast={showToast} onNavigate={handleNavigate as (view: string) => void} />;
      case "staff":
        return isAdmin ? <AdminPage onToast={showToast} /> : <StaffLoginPage onToast={showToast} />;
      case "reviews":
        return <ReviewsPage onToast={showToast} />;
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
