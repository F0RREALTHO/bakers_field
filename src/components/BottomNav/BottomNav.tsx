import { useCart } from "../../hooks/useCart";

type BottomNavProps = {
  active: string;
  onNavigate: (view: string) => void;
};

const navItems = [
  { view: "home", label: "Home" },
  { view: "menu", label: "Menu" },
  { view: "favorites", label: "Favorites" },
  { view: "cart", label: "Bag" },
  { view: "profile", label: "Profile" }
];

const renderIcon = (view: string) => {
  switch (view) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.2 2.8 11a1 1 0 0 0 1.4 1.4l.8-.7V20a1 1 0 0 0 1 1h4.5a1 1 0 0 0 1-1v-4.5h3V20a1 1 0 0 0 1 1h4.5a1 1 0 0 0 1-1v-8.3l.8.7A1 1 0 0 0 21.2 11L12 3.2z" />
        </svg>
      );
    case "menu":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3a1 1 0 0 0-1 1v6a4 4 0 0 0 3 3.9V21a1 1 0 0 0 2 0v-7.1A4 4 0 0 0 13 10V4a1 1 0 0 0-2 0v6a2 2 0 0 1-4 0V4a1 1 0 0 0-1-1zm11 0a1 1 0 0 0-1 1v7.2a3.2 3.2 0 0 0 2 3V21a1 1 0 0 0 2 0v-7.6a3.2 3.2 0 0 0 2-3V4a1 1 0 0 0-1-1h-1z" />
        </svg>
      );
    case "cart":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 4a1 1 0 0 0 0 2h1.2l1.2 9.2a2 2 0 0 0 2 1.8h7.8a2 2 0 0 0 2-1.6l1.6-6.6a1 1 0 0 0-1-1.2H9.4L8.8 6H18a1 1 0 0 0 0-2H6zm4.8 15a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm6.4 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" />
        </svg>
      );
    case "favorites":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20.4 4.7 12.7a4.3 4.3 0 0 1 0-6.1 4.2 4.2 0 0 1 6 0l1.3 1.4 1.3-1.4a4.2 4.2 0 0 1 6 0 4.3 4.3 0 0 1 0 6.1L12 20.4z" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 10.8c-4.1 0-7.5 2-7.5 4.6 0 1.4 1.1 2.6 2.6 2.6h9.8c1.5 0 2.6-1.2 2.6-2.6 0-2.6-3.4-4.6-7.5-4.6z" />
        </svg>
      );
    default:
      return null;
  }
};

export const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  const { items } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={`${item.view}-${item.label}`}
          className={`bottom-nav__item ${
            active === item.view ? "is-active" : ""
          }`}
          onClick={() => onNavigate(item.view)}
          type="button"
        >
          <span className="bottom-nav__icon">
            {renderIcon(item.view)}
            {item.view === "cart" && itemCount > 0 ? (
              <span className="bottom-nav__badge" aria-label={`Bag items ${itemCount}`}>
                {itemCount}
              </span>
            ) : null}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
