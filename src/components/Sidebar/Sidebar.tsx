import * as Dialog from "@radix-ui/react-dialog";
import * as Drawer from "vaul";
import { useGuestSession } from "../../hooks/useGuestSession";

type SidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string) => void;
  onOrderCustomCake: () => void;
};

const navItems = [
  { label: "Home", view: "home", hint: "Back to home", icon: "home" },
  { label: "My Orders", view: "orders", hint: "Track your treats", icon: "package" },
  { label: "My Reviews", view: "reviews", hint: "Share your experience", icon: "star" },
  { label: "Saved Addresses", view: "profile", hint: "Manage Home/Work", icon: "pin" }
];

const iconMap: Record<string, JSX.Element> = {
  package: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 4 7.5v9l8 4 8-4v-9l-8-4zm0 2.2 5.5 2.7-5.5 2.6L6.5 8.4 12 5.7zm-6 5.2 5 2.4v5.6l-5-2.5v-5.5zm12 0v5.5l-5 2.5v-5.6l5-2.4z" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3.5 2.3 4.7 5.2.8-3.8 3.7.9 5.2L12 15.8 7.4 17.9l.9-5.2-3.8-3.7 5.2-.8L12 3.5z" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5c3.1 0 5.5 2.3 5.5 5.2 0 3.7-4.1 8.2-5.5 9.7-1.4-1.5-5.5-6-5.5-9.7 0-2.9 2.4-5.2 5.5-5.2zm0 2.6a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  ),
  cake: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9h12a3 3 0 0 1 3 3v6.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V12a3 3 0 0 1 3-3zm1-4h10v2H7V5zm2-2h6v2H9V3z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10h1.5a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1.5zm2 0h5V7.5a2.5 2.5 0 0 0-5 0V10z" />
    </svg>
  )
};

export const Sidebar = ({
  open,
  onOpenChange,
  onNavigate,
  onOrderCustomCake
}: SidebarProps) => {
  const { guest } = useGuestSession();
  const nickname = guest.nickname.trim();
  const greeting = nickname ? `Hi, ${nickname}!` : "Welcome!";

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="left">
      <Drawer.Portal>
        <Drawer.Overlay className="drawer-overlay" />
        <Drawer.Content className="drawer-content drawer-content--sheet">
          <Dialog.Title className="sr-only">Main navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Browse orders, reviews, and profile settings.
          </Dialog.Description>
          <div className="drawer-header">
            <div className="drawer-avatar" aria-hidden="true">
              <span>{nickname ? nickname[0].toUpperCase() : "F"}</span>
            </div>
            <h2 className="drawer-greeting">{greeting} 🥐</h2>
          </div>
          <nav className="drawer-nav">
            {navItems.map((item) => (
              <Dialog.Close key={item.label} asChild>
                <button
                  className="drawer-link drawer-link--row"
                  onClick={() => onNavigate(item.view)}
                  type="button"
                >
                  <span className="drawer-icon">{iconMap[item.icon]}</span>
                  <span className="drawer-link__meta">
                    <span className="drawer-link__label">{item.label}</span>
                    <span className="drawer-link__hint">{item.hint}</span>
                  </span>
                  <span className="chevron">&gt;</span>
                </button>
              </Dialog.Close>
            ))}
            <button
              className="drawer-cta"
              onClick={() => {
                onOrderCustomCake();
                onOpenChange(false);
              }}
              type="button"
            >
              <span className="drawer-cta__icon">{iconMap.cake}</span>
              <span className="drawer-cta__text">
                <span>Order Custom Cake</span>
                <span>Special Occasions</span>
              </span>
              <span className="drawer-cta__arrow">→</span>
            </button>
          </nav>
          <div className="drawer-footer">
            <div className="drawer-footer__meta">
              <span>BakersField by Rashmi</span>
              <span>v2.4.0</span>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
