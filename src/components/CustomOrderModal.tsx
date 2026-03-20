import { useEffect, useMemo, useState } from "react";
import { api, type CustomOrderRequest } from "../api";
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
  "Butterscotch",
  "Custom"
];

const initialForm = {
  description: "",
  imageUrls: [] as string[],
  occasion: "",
  budget: "1500",
  size: "0.5 kg",
  customSize: "",
  flavor: "Chocolate",
  customFlavor: "",
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [descriptionMissingHint, setDescriptionMissingHint] = useState(false);
  const [customSizeMissingHint, setCustomSizeMissingHint] = useState(false);
  const [customFlavorMissingHint, setCustomFlavorMissingHint] = useState(false);
  const [occasionMissingHint, setOccasionMissingHint] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setStep(1);
      setSubmitting(false);
      setUploading(false);
      setUploadError(null);
      setDescriptionMissingHint(false);
      setCustomSizeMissingHint(false);
      setCustomFlavorMissingHint(false);
      setOccasionMissingHint(false);
    }
  }, [open]);

  const nextStep = () => {
    setStep((current) => Math.min(3, current + 1));
  };

  const prevStep = () => {
    setStep((current) => Math.max(1, current - 1));
  };

  const summaryDescription = useMemo(() => {
    const selectedSize =
      form.size === "Custom"
        ? form.customSize.trim() || "Custom size"
        : form.size;
    const selectedFlavor =
      form.flavor === "Custom"
        ? form.customFlavor.trim() || "Custom flavor"
        : form.flavor;
    const base = form.description.trim();
    const picks = [
      `Size: ${selectedSize}`,
      `Flavor: ${selectedFlavor}`,
      `References: ${form.imageUrls.length}`,
      form.eggless ? "Eggless" : "With eggs"
    ];
    return base ? `${base} | ${picks.join(" · ")}` : picks.join(" · ");
  }, [form.customFlavor, form.customSize, form.description, form.eggless, form.flavor, form.imageUrls.length, form.size]);

  const selectedSizeLabel =
    form.size === "Custom"
      ? form.customSize.trim() || "Custom size"
      : form.size;

  const selectedFlavorLabel =
    form.flavor === "Custom"
      ? form.customFlavor.trim() || "Custom flavor"
      : form.flavor;

  if (!open) {
    return null;
  }

  const previewImage = "/pics/custom-cake-step1.png";
  const summaryImage = "/pics/custom-cake-step3.png";

  const handleSubmit = async () => {
    if (!form.occasion.trim()) {
      setOccasionMissingHint(true);
      return;
    }
    setOccasionMissingHint(false);
    setSubmitting(true);
    try {
      await onSubmit({
        customerName: guest.name.trim(),
        phoneNumber: guest.phone.trim(),
        description: summaryDescription,
        occasion: form.occasion.trim(),
        imageUrl: form.imageUrls[0],
        estimatedPriceInr: Number(form.budget)
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const oversized = files.find((file) => file.size > 2 * 1024 * 1024);
    if (oversized) {
      alert("Each image should be less than 2MB");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      const availableSlots = Math.max(0, 3 - form.imageUrls.length);
      const selectedFiles = files.slice(0, availableSlots);
      if (selectedFiles.length < files.length) {
        alert("You can upload a maximum of 3 reference photos.");
      }

      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const result = await api.uploadImage(file);
        uploadedUrls.push(result.url);
      }

      setForm((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...uploadedUrls]
      }));
    } catch {
      setUploadError("Unable to upload one or more images. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleStepOneContinue = () => {
    if (!form.description.trim()) {
      if (form.imageUrls.length > 0) {
        setDescriptionMissingHint(true);
      }
      return;
    }
    setDescriptionMissingHint(false);
    nextStep();
  };

  const handleStepTwoContinue = () => {
    if (form.size === "Custom" && !form.customSize.trim()) {
      setCustomSizeMissingHint(true);
      return;
    }
    if (form.flavor === "Custom" && !form.customFlavor.trim()) {
      setCustomFlavorMissingHint(true);
      return;
    }
    setCustomSizeMissingHint(false);
    setCustomFlavorMissingHint(false);
    nextStep();
  };

  return (
    <div className="modal modal--sheet">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__content modal__content--wide" role="dialog" aria-modal="true">
        <header className="custom-header">
          {step > 1 ? (
            <button
              className="icon-button"
              onClick={prevStep}
              type="button"
              aria-label="Go back to previous step"
            >
              &lt;
            </button>
          ) : (
            <span className="navbar__spacer" aria-hidden="true" />
          )}
          <div>
            <p className="custom-title">Order a Custom Cake</p>
            <div className="custom-underline" />
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close custom order">
            X
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
            <label className={descriptionMissingHint ? "custom-field--error" : ""}>
              Detailed Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => {
                    if (event.target.value.trim()) {
                      setDescriptionMissingHint(false);
                    }
                    return {
                      ...current,
                      description: event.target.value
                    };
                  })
                }
                placeholder="A three-tier vintage Victorian cake with lavender frosting..."
                rows={5}
                required
              />
            </label>
            {descriptionMissingHint ? (
              <p className="custom-field__error">Please let us know your cake idea in the detailed description.</p>
            ) : null}
            <div className="custom-upload">
              <label className="custom-upload__button">
                <span className="custom-upload__icon" aria-hidden="true">
                  {form.imageUrls.length ? "✓" : "↑"}
                </span>
                <span className="custom-upload__title">
                  {form.imageUrls.length ? "Reference photos added" : "Upload reference photos"}
                </span>
                <span className="custom-upload__subtitle">
                  {form.imageUrls.length
                    ? `${form.imageUrls.length}/3 selected. You can add more.`
                    : "Show us design, shape, colors, or theme"}
                </span>
                <span className="custom-upload__cta">
                  {uploading ? "Uploading..." : form.imageUrls.length ? "Add / Change Photos" : "Choose Photos"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="sr-only"
                  style={{ display: "none" }}
                  required
                  disabled={uploading}
                />
              </label>
              {uploadError ? <p className="custom-field__error">{uploadError}</p> : null}
              {form.imageUrls.length > 0 && (
                <div className="custom-upload__preview-wrap">
                  <div className="custom-upload__preview-grid">
                    {form.imageUrls.map((imageUrl, index) => (
                      <div key={`${index}-${imageUrl.slice(0, 24)}`} className="custom-upload__preview-card">
                        <a
                          className="custom-upload__preview"
                          style={{ backgroundImage: `url(${imageUrl})` }}
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open reference photo ${index + 1} in new tab`}
                        />
                        <button
                          type="button"
                          className="custom-upload__remove"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              imageUrls: current.imageUrls.filter((_, currentIndex) => currentIndex !== index)
                            }))
                          }
                          aria-label={`Remove reference photo ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <span className="custom-upload__status">Minimum 1, maximum 3 photos</span>
                </div>
              )}
            </div>
            <button 
              className="primary primary--wide" 
              type="button" 
              onClick={handleStepOneContinue}
              disabled={form.imageUrls.length === 0 || uploading}
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
                      setForm((current) => {
                        if (option.label !== "Custom") {
                          setCustomSizeMissingHint(false);
                        }
                        return {
                          ...current,
                          size: option.label,
                          customSize: option.label === "Custom" ? current.customSize : ""
                        };
                      })
                    }
                  >
                    <span>{option.label}</span>
                    <small>{option.hint}</small>
                  </button>
                ))}
              </div>
              {form.size === "Custom" ? (
                <label className={customSizeMissingHint ? "custom-field--error" : ""}>
                  Your required size
                  <input
                    value={form.customSize}
                    onChange={(event) =>
                      setForm((current) => {
                        if (event.target.value.trim()) {
                          setCustomSizeMissingHint(false);
                        }
                        return {
                          ...current,
                          customSize: event.target.value
                        };
                      })
                    }
                    placeholder="e.g. 3.5 kg or 60 servings"
                    required
                  />
                </label>
              ) : null}
              {customSizeMissingHint ? (
                <p className="custom-field__error">Please tell us your required custom size.</p>
              ) : null}
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
                      setForm((current) => {
                        if (flavor !== "Custom") {
                          setCustomFlavorMissingHint(false);
                        }
                        return {
                          ...current,
                          flavor,
                          customFlavor: flavor === "Custom" ? current.customFlavor : ""
                        };
                      })
                    }
                  >
                    {flavor}
                  </button>
                ))}
              </div>
              {form.flavor === "Custom" ? (
                <label className={customFlavorMissingHint ? "custom-field--error" : ""}>
                  Your required flavor
                  <input
                    value={form.customFlavor}
                    onChange={(event) =>
                      setForm((current) => {
                        if (event.target.value.trim()) {
                          setCustomFlavorMissingHint(false);
                        }
                        return {
                          ...current,
                          customFlavor: event.target.value
                        };
                      })
                    }
                    placeholder="e.g. Blueberry Cheesecake"
                    required
                  />
                </label>
              ) : null}
              {customFlavorMissingHint ? (
                <p className="custom-field__error">Please tell us your required custom flavor.</p>
              ) : null}
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
            <button
              className="primary primary--wide"
              type="button"
              onClick={handleStepTwoContinue}
            >
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
                style={{ backgroundImage: `url(${form.imageUrls[0] || summaryImage})` }}
              />
              <div>
                <p className="custom-summary__label">Reference Image</p>
                <p className="custom-summary__text">{summaryDescription}</p>
              </div>
            </div>
            <label className={occasionMissingHint ? "custom-field--error" : ""}>
              What's the Occasion? *
              <input
                value={form.occasion}
                onChange={(event) =>
                  setForm((current) => {
                    if (event.target.value.trim()) {
                      setOccasionMissingHint(false);
                    }
                    return {
                      ...current,
                      occasion: event.target.value
                    };
                  })
                }
                placeholder="Birthday, Wedding, Anniversary..."
                required
              />
            </label>
            {occasionMissingHint ? (
              <p className="custom-field__error">Please tell us the occasion for this cake.</p>
            ) : null}
            <div className="custom-summary__stats">
              <div>
                <span>Size</span>
                <strong>{selectedSizeLabel}</strong>
              </div>
              <div>
                <span>Flavor</span>
                <strong>{selectedFlavorLabel}</strong>
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
              disabled={submitting}
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
