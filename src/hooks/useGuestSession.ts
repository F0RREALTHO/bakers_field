import { useCallback, useEffect, useMemo, useState } from "react";

export type GuestSession = {
  name: string;
  nickname: string;
  phone: string;
  avatar?: string;
  placedOrderIds: string[];
};

const STORAGE_KEY = "bakersfield.guestSession";

const emptyGuest: GuestSession = {
  name: "",
  nickname: "",
  phone: "",
  avatar: "",
  placedOrderIds: []
};

const readGuestSession = (): GuestSession => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyGuest;
  }
  try {
    const parsed = JSON.parse(raw) as GuestSession;
    return {
      ...emptyGuest,
      ...parsed,
      placedOrderIds: Array.isArray(parsed.placedOrderIds)
        ? parsed.placedOrderIds
        : []
    };
  } catch {
    return emptyGuest;
  }
};

let currentGuest = readGuestSession();
const listeners = new Set<(guest: GuestSession) => void>();

const publish = (next: GuestSession) => {
  currentGuest = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener(next));
};

export const useGuestSession = () => {
  const [guest, setGuest] = useState<GuestSession>(currentGuest);

  useEffect(() => {
    const listener = (next: GuestSession) => {
      setGuest(next);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isIdentified = useMemo(() => {
    return Boolean(guest.name.trim() && guest.phone.trim());
  }, [guest.name, guest.phone]);

  const persist = useCallback((next: GuestSession) => {
    publish(next);
  }, []);

  const identifyGuest = useCallback(
    (next: Pick<GuestSession, "name" | "nickname" | "phone">) => {
      persist({
        ...guest,
        ...next
      });
    },
    [guest, persist]
  );

  const updateGuest = useCallback(
    (updates: Partial<GuestSession>) => {
      persist({
        ...guest,
        ...updates
      });
    },
    [guest, persist]
  );

  const addPlacedOrderId = useCallback(
    (orderId: string) => {
      if (!orderId) {
        return;
      }
      if (guest.placedOrderIds.includes(orderId)) {
        return;
      }
      persist({
        ...guest,
        placedOrderIds: [...guest.placedOrderIds, orderId]
      });
    },
    [guest, persist]
  );

  const clearGuestSession = useCallback(() => {
    persist(emptyGuest);
  }, [persist]);

  return {
    guest,
    isIdentified,
    identifyGuest,
    updateGuest,
    addPlacedOrderId,
    clearGuestSession
  };
};
