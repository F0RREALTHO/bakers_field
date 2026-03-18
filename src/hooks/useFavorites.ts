import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bakersfield.favorites";

const readFavorites = (): number[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed.filter((id) => Number.isFinite(id)) : [];
  } catch {
    return [];
  }
};

let currentFavorites = readFavorites();
const listeners = new Set<(items: number[]) => void>();

const publish = (next: number[]) => {
  currentFavorites = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener(next));
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<number[]>(currentFavorites);

  useEffect(() => {
    const listener = (next: number[]) => {
      setFavorites(next);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const persist = useCallback((next: number[]) => {
    publish(next);
  }, []);

  const addFavorite = useCallback(
    (productId: number) => {
      if (!favorites.includes(productId)) {
        persist([...favorites, productId]);
      }
    },
    [favorites, persist]
  );

  const removeFavorite = useCallback(
    (productId: number) => {
      persist(favorites.filter((id) => id !== productId));
    },
    [favorites, persist]
  );

  const toggleFavorite = useCallback(
    (productId: number) => {
      if (favorites.includes(productId)) {
        removeFavorite(productId);
      } else {
        addFavorite(productId);
      }
    },
    [addFavorite, favorites, removeFavorite]
  );

  const isFavorite = useCallback(
    (productId: number) => favorites.includes(productId),
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    persist([]);
  }, [persist]);

  const count = useMemo(() => favorites.length, [favorites]);

  return {
    favorites,
    count,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites
  };
};
