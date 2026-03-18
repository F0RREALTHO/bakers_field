import { useEffect, useMemo, useState } from "react";
import type { CustomOrderRequest } from "../api";
import type { GuestSession } from "../hooks/useGuestSession";

type CustomOrderModalProps = {
  open: boolean;
  guest: GuestSession;
  onClose: () => void;
  onSubmit: (payload: CustomOrderRequest) => Promise<void>;
};

const sizeOptions = [
  { label: "0.5 kg", hint: "Perfect for 4-6" },
  { label: "1.0 kg", hint: "Party of 8-12" },
  { label: "2.0 kg", hint: "Celebrations" },
  { label: "Custom", hint: "Tell us" }
];

const flavorOptions = [
  "Chocolate",
  "Vanilla",
  "Red Velvet",
  "Fruit Blast",
  "Butterscotch"
];

const initialForm = {
  description: "",
  imageUrl: "",
  occasion: "",
  budget: "1500",
  size: "0.5 kg",
  flavor: "Chocolate",
  eggless: true
};

export const CustomOrderModal = ({
  open,
  guest,
  onClose,
  onSubmit
}: CustomOrderModalProps) => {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setStep(1);
      setSubmitting(false);
    }
  }, [open]);

  const nextStep = () => {
    setStep((current) => Math.min(3, current + 1));
  };

  const prevStep = () => {
    setStep((current) => Math.max(1, current - 1));
  };

  const summaryDescription = useMemo(() => {
    const base = form.description.trim();
    const picks = [
      `Size: ${form.size}`,
      `Flavor: ${form.flavor}`,
      form.eggless ? "Eggless" : "With eggs"
    ];
    return base ? `${base} | ${picks.join(" · ")}` : picks.join(" · ");
  }, [form.description, form.eggless, form.flavor, form.size]);

  if (!open) {
    return null;
  }

  const previewImage = "/pics/custom-cake-step1.png";
  const summaryImage = "/pics/custom-cake-step3.png";

  const handleSubmit = async () => {
    if (!form.description || !form.imageUrl || !form.occasion) return;
    setSubmitting(true);
    try {
      await onSubmit({
        customerName: guest.name.trim(),
        phoneNumber: guest.phone.trim(),
        description: summaryDescription,
        occasion: form.occasion.trim(),
        imageUrl: form.imageUrl,
        estimatedPriceInr: Number(form.budget)
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal modal--sheet">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__content modal__content--wide" role="dialog" aria-modal="true">
        <header className="custom-header">
          <button className="icon-button" onClick={onClose} type="button">
            <span className="hamburger">
              <span />
              <span />
              <span />
            </span>
          </button>
          <div>
            <p className="custom-title">Order a Custom Cake</p>
            <div className="custom-underline" />
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            ?
          </button>
        </header>

        <div className="custom-stepper">
          <span className={step >= 1 ? "is-active" : ""} />
          <span className={step >= 2 ? "is-active" : ""} />
          <span className={step >= 3 ? "is-active" : ""} />
        </div>

        {step === 1 ? (
          <section className="custom-step">
            <h3>Introduce your Idea</h3>
            <p className="muted">
              Tell us about the cake you&apos;re envisioning. Include flavors,
              colors, and any special themes.
            </p>
            <label>
              Detailed Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                placeholder="A three-tier vintage Victorian cake with lavender frosting..."
                rows={5}
                required
              />
            </label>
            <div className="custom-upload">
              <label className="custom-upload__button">
                {form.imageUrl ? "Change Photo" : "Upload Reference Photo *"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                  style={{ display: "none" }}
                  required
                />
              </label>
              {form.imageUrl && (
                <div
                  className="custom-upload__preview"
                  style={{ backgroundImage: `url(${form.imageUrl})` }}
                />
              )}
            </div>
            <button 
              className="primary primary--wide" 
              type="button" 
              onClick={nextStep}
              disabled={!form.description.trim() || !form.imageUrl}
            >
              Continue to Preferences
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="custom-step">
            <div className="custom-step__header">
              <span className="custom-step__label">Step 2 of 3</span>
              <span className="custom-step__title">Preferences</span>
            </div>
            <h3>Customize Your Cake</h3>
            <div className="custom-block">
              <p className="custom-block__title">Choose Your Size</p>
              <div className="custom-grid">
                {sizeOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={`custom-tile ${
                      form.size === option.label ? "is-active" : ""
                    }`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        size: option.label
                      }))
                    }
                  >
                    <span>{option.label}</span>
                    <small>{option.hint}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="custom-block">
              <p className="custom-block__title">Base Flavor</p>
              <div className="custom-chips">
                {flavorOptions.map((flavor) => (
                  <button
                    key={flavor}
                    type="button"
                    className={`chip ${
                      form.flavor === flavor ? "is-active" : ""
                    }`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        flavor
                      }))
                    }
                  >
                    {flavor}
                  </button>
                ))}
              </div>
            </div>
            <label className="custom-toggle">
              <input
                type="checkbox"
                checked={form.eggless}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    eggless: event.target.checked
                  }))
                }
              />
              Eggless cake
            </label>
            <button className="primary primary--wide" type="button" onClick={nextStep}>
              Continue to Summary
            </button>
            <button className="ghost" type="button" onClick={prevStep}>
              Back
            </button>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="custom-step">
            <div className="custom-step__header">
              <span className="custom-step__label">Step 3 of 3</span>
              <span className="custom-step__title">Review</span>
            </div>
            <div className="custom-summary">
              <div
                className="custom-summary__image"
                style={{ backgroundImage: `url(${form.imageUrl || summaryImage})` }}
              />
              <div>
                <p className="custom-summary__label">Reference Image</p>
                <p className="custom-summary__text">{summaryDescription}</p>
              </div>
            </div>
            <label>
              What's the Occasion? *
              <input
                value={form.occasion}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    occasion: event.target.value
                  }))
                }
                placeholder="Birthday, Wedding, Anniversary..."
                required
              />
            </label>
            <div className="custom-summary__stats">
              <div>
                <span>Size</span>
                <strong>{form.size}</strong>
              </div>
              <div>
                <span>Flavor</span>
                <strong>{form.flavor}</strong>
              </div>
            </div>
            <label>
              Estimated Budget (INR)
              <input
                type="number"
                min={500}
                value={form.budget}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    budget: event.target.value
                  }))
                }
              />
            </label>
            <div className="custom-policy">
              Custom cake orders require a minimum of 48 hours for preparation.
              Our team will contact you within 2 hours to finalize the design.
            </div>
            <button
              className="primary primary--wide"
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.occasion.trim()}
            >
              {submitting ? "Submitting..." : "Add Custom Cake to Cart"}
            </button>
            <button className="ghost" type="button" onClick={prevStep}>
              Back
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
};
