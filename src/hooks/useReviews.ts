import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Review, type ReviewRequest, type ReviewUpdateRequest } from "../api";
import { useLiveData } from "./useLiveData";

type UseReviewsOptions = {
  adminToken?: string;
  authorPhone?: string;
  authorName?: string;
  featuredOnly?: boolean;
};

export const useReviews = (options: UseReviewsOptions = {}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const isAdmin = Boolean(options.adminToken);
  const liveDataUpdate = useLiveData(["reviews"]);
  const query = useMemo(
    () => ({
      authorPhone: options.authorPhone,
      authorName: options.authorName,
      featured: options.featuredOnly
    }),
    [options.authorName, options.authorPhone, options.featuredOnly]
  );

  const refresh = useCallback(async () => {
    try {
      if (isAdmin && options.adminToken) {
        const data = await api.adminGetReviews(options.adminToken);
        setReviews(data);
        return;
      }
      const data = await api.getReviews(query);
      setReviews(data);
    } catch {
      setReviews([]);
    }
  }, [isAdmin, options.adminToken, query]);

  useEffect(() => {
    refresh();
  }, [refresh, liveDataUpdate]);

  const addReview = useCallback(async (payload: ReviewRequest) => {
    const created = await api.createReview(payload);
    setReviews((current) => [created, ...current]);
    return created;
  }, []);

  const updateReview = useCallback(
    async (id: number, updates: ReviewUpdateRequest) => {
      if (!options.adminToken) {
        return null;
      }
      const updated = await api.adminUpdateReview(options.adminToken, id, updates);
      setReviews((current) =>
        current.map((review) => (review.id === id ? updated : review))
      );
      return updated;
    },
    [options.adminToken]
  );

  return {
    reviews,
    refresh,
    addReview,
    updateReview
  };
};
