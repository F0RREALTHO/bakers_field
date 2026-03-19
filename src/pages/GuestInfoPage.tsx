import { useState } from "react";
import { openWhatsAppChat } from "../lib/contact";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useAddressBook } from "../hooks/useAddressBook";
import { useCart } from "../hooks/useCart";
import { useGuestSession } from "../hooks/useGuestSession";

type GuestInfoPageProps = {
  onToast: (toast: AlertToastState) => void;
  onNavigate?: (view: string) => void;
};

const AVATAR_OPTIONS = [
  "/avatars/image-1773740156370.png",
  "/avatars/image-1773740166519.png",
  "/avatars/image-1773740173475.png",
  "/avatars/image-1773740183194.png",
  "/avatars/image-1773740191020.png",
  "/avatars/image-1773740197216.png",
  "/avatars/image-1773740202588.png",
  "/avatars/image-1773740207104.png",
  "/avatars/image-1773740211592.png",
  "/avatars/image-1773740215865.png",
  "/avatars/image-1773740224232.png",
  "/avatars/image-1773740228277.png",
  "/avatars/image-1773740233579.png",
  "/avatars/image-1773740247397.png",
  "/avatars/image-1773740257616.png",
  "/avatars/image-1773740262211.png",
  "/avatars/image-1773740267447.png",
  "/avatars/image-1773740272569.png",
  "/avatars/image-1773740280310.png",
  "/avatars/image-1773740284451.png",
  "/avatars/image-1773740288538.png",
  "/avatars/image-1773740292448.png"
];

export const GuestInfoPage = ({ onToast, onNavigate }: GuestInfoPageProps) => {
  const { guest, identifyGuest, clearGuestSession, updateGuest } = useGuestSession();
  const { address, updateAddress } = useAddressBook();
  const { clearCart } = useCart();
  const [form, setForm] = useState({
    name: guest.name,
    nickname: guest.nickname,
    phone: guest.phone
  });
  const [contactMessage, setContactMessage] = useState("");
  const greetingName = form.nickname.trim() || "Foodie!";
  const hasEmail = guest.name.trim() || guest.phone.trim();
  const guestEmail = hasEmail
    ? `${(guest.nickname || guest.name || "guest").toLowerCase().replace(/\s+/g, ".")}@bakersfield.com`
    : "guest@bakersfield.com";

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleClearData = () => {
    clearGuestSession();
    clearCart();
    updateAddress({
      label: "Home",
      pinCode: "",
      city: "",
      state: "",
      line1: "",
      line2: ""
    });
    onToast({ type: "success", message: "Guest data cleared." });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    identifyGuest({
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      phone: form.phone.trim()
    });
    onToast({ type: "success", message: "Guest profile saved." });
  };

  const handleContactSend = () => {
    const trimmed = contactMessage.trim();
    if (!trimmed) {
      onToast({ type: "error", message: "Please enter your message." });
      return;
    }

    const message = [
      "Hi BakersField team, I need support.",
      `Name: ${form.name.trim() || guest.name || "Guest"}`,
      `Phone: ${form.phone.trim() || guest.phone || "Not provided"}`,
      `Message: ${trimmed}`
    ].join("\n");

    openWhatsAppChat(message);
    onToast({ type: "success", message: "Opening WhatsApp chat." });
  };

  return (
    <section className="page">
      <div className="profile-hero profile-hero--center">
        <div className="profile-avatar profile-avatar--image" aria-hidden="true">
          {guest.avatar ? (
            <img src={guest.avatar} alt="" />
          ) : (
            <span>{greetingName[0].toUpperCase()}</span>
          )}
          <span className="profile-avatar__badge" aria-hidden="true">📷</span>
        </div>
        <div className="profile-hero__content">
          <p className="eyebrow">My Profile</p>
          <h2>
            Hi, {greetingName} <span className="profile-emoji">🥐</span>
          </h2>
          <p className="muted">{guestEmail}</p>
          <button
            className="ghost"
            type="button"
            onClick={() => scrollToSection("profile-form")}
          >
            Edit Guest Info
          </button>
        </div>
      </div>

      <section className="profile-actions">
        <p className="section-kicker">Account Activity</p>
        <button
          className="profile-action"
          type="button"
          onClick={() => onNavigate?.("orders")}
        >
          <span className="profile-action__icon">O</span>
          <span className="profile-action__meta">
            <strong>My Orders</strong>
            <span>Track your treats</span>
          </span>
          <span className="profile-action__arrow">&gt;</span>
        </button>
        <button
          className="profile-action"
          type="button"
          onClick={() => scrollToSection("address-section")}
        >
          <span className="profile-action__icon">A</span>
          <span className="profile-action__meta">
            <strong>Saved Addresses</strong>
            <span>Home, Work, and more</span>
          </span>
          <span className="profile-action__arrow">&gt;</span>
        </button>
        <button
          className="profile-action"
          type="button"
          onClick={() => onNavigate?.("reviews")}
        >
          <span className="profile-action__icon">R</span>
          <span className="profile-action__meta">
            <strong>My Reviews</strong>
            <span>Share your feedback</span>
          </span>
          <span className="profile-action__arrow">&gt;</span>
        </button>
        <button
          className="profile-action"
          type="button"
          onClick={() => onNavigate?.("menu")}
        >
          <span className="profile-action__icon">P</span>
          <span className="profile-action__meta">
            <strong>Preferences</strong>
            <span>Manage your taste and theme</span>
          </span>
          <span className="profile-action__arrow">&gt;</span>
        </button>
        <button
          className="profile-action"
          type="button"
          onClick={() => scrollToSection("contact-us-section")}
        >
          <span className="profile-action__icon">C</span>
          <span className="profile-action__meta">
            <strong>Contact Us</strong>
            <span>Send a support message</span>
          </span>
          <span className="profile-action__arrow">&gt;</span>
        </button>
      </section>

      <form className="profile-form" onSubmit={handleSubmit} id="profile-form">
        <section className="profile-card">
          <div className="profile-card__header">
            <h3>Pick Your Avatar</h3>
            <p className="muted">This will show next to your reviews.</p>
          </div>
          <div className="avatar-picker">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar}
                type="button"
                className={`avatar-option ${guest.avatar === avatar ? "is-active" : ""}`}
                onClick={() => updateGuest({ avatar })}
              >
                <img src={avatar} alt="" />
              </button>
            ))}
          </div>
        </section>
        <section className="profile-card">
          <div className="profile-card__header">
            <h3>Personal Details</h3>
            <p className="muted">We will use this for order updates.</p>
          </div>
          <div className="form-grid form-grid--two">
            <label>
              Full Name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                placeholder="Enter your full name"
                required
              />
            </label>
            <label>
              Nickname
              <input
                value={form.nickname}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nickname: event.target.value
                  }))
                }
                placeholder="How should we call you?"
              />
            </label>
            <label className="field-span">
              Phone Number
              <div className="phone-row">
                <span className="phone-prefix">+91</span>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value.replace(/[^0-9]/g, "").slice(0, 10)
                    }))
                  }
                  placeholder="Enter 10 digit number"
                  inputMode="numeric"
                  required
                />
              </div>
            </label>
          </div>
        </section>

        <section className="profile-card" id="address-section">
          <div className="profile-card__header">
            <h3>Shipping Address</h3>
            <p className="muted">Choose a label and fill delivery details.</p>
          </div>
          <div className="address-chips">
            {(["Home", "Work", "Other"] as const).map((label) => (
              <button
                key={label}
                type="button"
                className={`chip ${address.label === label ? "is-active" : ""}`}
                onClick={() => updateAddress({ label })}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="form-grid form-grid--two">
            <label className="field-span">
              Address Line 1
              <input
                value={address.line1}
                onChange={(event) => updateAddress({ line1: event.target.value })}
                placeholder="House number and street"
              />
            </label>
            <label className="field-span">
              Address Line 2
              <input
                value={address.line2}
                onChange={(event) => updateAddress({ line2: event.target.value })}
                placeholder="Area or landmark"
              />
            </label>
            <label>
              PIN Code
              <input
                value={address.pinCode}
                onChange={(event) =>
                  updateAddress({
                    pinCode: event.target.value.replace(/[^0-9]/g, "").slice(0, 6)
                  })
                }
                placeholder="6 digits"
                inputMode="numeric"
              />
            </label>
            <label>
              City
              <input
                value={address.city}
                onChange={(event) => updateAddress({ city: event.target.value })}
                placeholder="Your City"
              />
            </label>
            <label className="field-span">
              State
              <input
                value={address.state}
                onChange={(event) => updateAddress({ state: event.target.value })}
                placeholder="Your State"
              />
            </label>
          </div>
        </section>

        <section className="profile-card" id="contact-us-section">
          <div className="profile-card__header">
            <h3>Contact Us</h3>
            <p className="muted">Send a message and we will help you quickly on WhatsApp.</p>
          </div>
          <label>
            Your Message
            <textarea
              value={contactMessage}
              onChange={(event) => setContactMessage(event.target.value)}
              rows={4}
              placeholder="Tell us what you need help with..."
            />
          </label>
          <button className="primary" type="button" onClick={handleContactSend}>
            Contact Us on WhatsApp
          </button>
        </section>

        <div className="profile-cta">
          <button className="primary primary--wide" type="submit">
            Save Profile
          </button>
          <button className="ghost" type="button" onClick={handleClearData}>
            Clear Data
          </button>
        </div>
      </form>
    </section>
  );
};
