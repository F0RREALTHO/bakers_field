import { useEffect, useMemo, useState } from "react";
import { api, type Product } from "../api";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useGuestSession } from "../hooks/useGuestSession";
import { useReviews } from "../hooks/useReviews";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../components/ui/select";
import { StarRating } from "../components/ui/star-rating";

const FALLBACK_AVATARS = [
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

type ReviewsPageProps = {
  onToast: (toast: AlertToastState) => void;
};

export const ReviewsPage = ({ onToast }: ReviewsPageProps) => {
  const { guest } = useGuestSession();
  const [authorName, setAuthorName] = useState(guest.name || "");
  const { reviews, addReview } = useReviews({
    authorPhone: guest.phone.trim() || undefined,
    authorName: guest.phone.trim() ? undefined : authorName.trim() || undefined
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [customRating, setCustomRating] = useState(5);
  const [customComment, setCustomComment] = useState("");
  const [customCakeName, setCustomCakeName] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const productsData = await api.getProducts();
        setProducts(productsData);
      } catch {
        onToast({ type: "error", message: "Unable to load products." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [onToast]);

  const productOptions = useMemo(() => {
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl
    }));
  }, [products]);

  const userReviews = useMemo(() => {
    if (guest.phone.trim()) {
      return reviews.filter((review) => review.authorPhone === guest.phone.trim());
    }
    if (authorName.trim()) {
      return reviews.filter((review) => review.authorName === authorName.trim());
    }
    return [];
  }, [authorName, guest.phone, reviews]);

  const standardReviews = useMemo(() => {
    return userReviews.filter(
      (review) => !review.productName.startsWith("Custom Cake")
    );
  }, [userReviews]);

  const customReviews = useMemo(() => {
    return userReviews.filter((review) => review.productName.startsWith("Custom Cake"));
  }, [userReviews]);

  const handleSubmit = async () => {
    const trimmedName = authorName.trim();
    if (!trimmedName) {
      onToast({ type: "error", message: "Please add your name." });
      return;
    }
    if (!selectedProductId) {
      onToast({ type: "error", message: "Select a product to review." });
      return;
    }
    if (!comment.trim()) {
      onToast({ type: "error", message: "Add a review message." });
      return;
    }
    if (rating < 1) {
      onToast({ type: "error", message: "Select a rating." });
      return;
    }
    const product = productOptions.find((item) => String(item.id) === selectedProductId);
    if (!product) {
      onToast({ type: "error", message: "Selected product is unavailable." });
      return;
    }
    const avatar =
      guest.avatar ||
      FALLBACK_AVATARS[Math.floor(Math.random() * FALLBACK_AVATARS.length)];

    try {
      await addReview({
        productId: product.id,
        productName: product.name,
        rating,
        comment: comment.trim(),
        authorName: trimmedName,
        authorPhone: guest.phone.trim() || undefined,
        avatar
      });
      setComment("");
      setSelectedProductId("");
      onToast({ type: "success", message: "Review submitted for approval." });
    } catch {
      onToast({ type: "error", message: "Unable to submit review." });
    }
  };

  const handleCustomSubmit = async () => {
    const trimmedName = authorName.trim();
    const trimmedCakeName = customCakeName.trim();
    if (!trimmedName) {
      onToast({ type: "error", message: "Please add your name." });
      return;
    }
    if (!trimmedCakeName) {
      onToast({ type: "error", message: "Add your custom cake name." });
      return;
    }
    if (!customComment.trim()) {
      onToast({ type: "error", message: "Add a review message." });
      return;
    }
    if (customRating < 1) {
      onToast({ type: "error", message: "Select a rating." });
      return;
    }
    const avatar =
      guest.avatar ||
      FALLBACK_AVATARS[Math.floor(Math.random() * FALLBACK_AVATARS.length)];

    try {
      await addReview({
        productId: 0,
        productName: `Custom Cake: ${trimmedCakeName}`,
        rating: customRating,
        comment: customComment.trim(),
        authorName: trimmedName,
        authorPhone: guest.phone.trim() || undefined,
        avatar
      });
      setCustomComment("");
      setCustomCakeName("");
      onToast({ type: "success", message: "Custom review submitted for approval." });
    } catch {
      onToast({ type: "error", message: "Unable to submit review." });
    }
  };

  return (
    <section className="page reviews-page">
      <div className="page-header">
        <h2>My Reviews</h2>
        <p className="muted">Share your experience with any product.</p>
      </div>

      <div className="review-form">
        <div className="review-form__row">
          <label className="review-field">
            <span>Name</span>
            <input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Your name"
              type="text"
            />
          </label>
          <label className="review-field">
            <span>Product</span>
            <Select
              value={selectedProductId}
              onValueChange={(value) => setSelectedProductId(value)}
            >
              <SelectTrigger className="admin-select" placeholder="Select product" />
              <SelectContent>
                {productOptions.map((product, index) => (
                  <SelectItem key={product.id} index={index} value={String(product.id)}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="review-field">
            <span>Rating</span>
            <StarRating defaultValue={rating} onRate={setRating} />
          </label>
        </div>
        <label className="review-field">
          <span>Review</span>
          <textarea
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Share what you loved about this item"
          />
        </label>
        <div className="review-form__actions">
          <button className="primary" type="button" onClick={handleSubmit}>
            Submit Review
          </button>
        </div>
      </div>

      <div className="review-form review-form--custom">
        <div className="review-form__header">
          <h3>Custom Cake Review</h3>
          <p className="muted">Share feedback for your custom order.</p>
        </div>
        <div className="review-form__row">
          <label className="review-field">
            <span>Custom cake name</span>
            <input
              value={customCakeName}
              onChange={(event) => setCustomCakeName(event.target.value)}
              placeholder="e.g. Ella's Spring Garden"
              type="text"
              maxLength={40}
            />
            <span className="review-field__helper">
              {customCakeName.length}/40 characters
            </span>
          </label>
          <label className="review-field">
            <span>Rating</span>
            <StarRating defaultValue={customRating} onRate={setCustomRating} />
          </label>
        </div>
        <label className="review-field">
          <span>Review</span>
          <textarea
            rows={4}
            value={customComment}
            onChange={(event) => setCustomComment(event.target.value)}
            placeholder="Tell us about your custom cake experience"
          />
        </label>
        <div className="review-form__actions">
          <button className="primary" type="button" onClick={handleCustomSubmit}>
            Submit Custom Review
          </button>
        </div>
      </div>

      <div className="review-list">
        <div className="section-title">
          <h3>Recent Submissions</h3>
          {loading ? <span className="muted">Loading...</span> : null}
        </div>
        {standardReviews.length === 0 ? (
          <p className="muted">No reviews submitted yet.</p>
        ) : (
          standardReviews.map((review) => (
            <article key={review.id} className="review-card">
              <div className="review-card__header">
                <div>
                  <p className="review-card__product">{review.productName}</p>
                  <h4>{review.comment}</h4>
                </div>
                <span className="review-card__rating">{review.rating} ★</span>
              </div>
              <div className="review-card__meta">
                <div className="review-card__author">
                  <img src={review.avatar} alt={review.authorName} />
                  <span>{review.authorName}</span>
                </div>
                <div className="review-card__status">
                  <span className="review-badge">
                    {review.approved ? "Approved" : "Pending"}
                  </span>
                  {review.featured ? (
                    <span className="review-badge review-badge--featured">Featured</span>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="review-list">
        <div className="section-title">
          <h3>Custom Order Reviews</h3>
        </div>
        {customReviews.length === 0 ? (
          <p className="muted">No custom reviews submitted yet.</p>
        ) : (
          customReviews.map((review) => {
            const customName = review.productName.startsWith("Custom Cake:")
              ? review.productName.replace("Custom Cake:", "").trim()
              : "";

            return (
              <article key={review.id} className="review-card">
                <div className="review-card__header">
                  <div>
                    <div className="review-card__product-row">
                      <p className="review-card__product">Custom Cake</p>
                      {customName ? (
                        <span className="review-card__custom-name">{customName}</span>
                      ) : null}
                    </div>
                    <h4>{review.comment}</h4>
                  </div>
                  <span className="review-card__rating">{review.rating} ★</span>
                </div>
                <div className="review-card__meta">
                  <div className="review-card__author">
                    <img src={review.avatar} alt={review.authorName} />
                    <span>{review.authorName}</span>
                  </div>
                  <div className="review-card__status">
                    <span className="review-badge">
                      {review.approved ? "Approved" : "Pending"}
                    </span>
                    {review.featured ? (
                      <span className="review-badge review-badge--featured">Featured</span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
