import { useCallback, useEffect, useState } from "react";

export type Address = {
  label: "Home" | "Work" | "Other";
  pinCode: string;
  city: string;
  state: string;
  line1: string;
  line2: string;
};

const STORAGE_KEY = "bakersfield.address";

const emptyAddress: Address = {
  label: "Home",
  pinCode: "",
  city: "",
  state: "",
  line1: "",
  line2: ""
};

const readAddress = (): Address => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyAddress;
  }
  try {
    const parsed = JSON.parse(raw) as Address;
    return { ...emptyAddress, ...parsed };
  } catch {
    return emptyAddress;
  }
};

let currentAddress = readAddress();
const listeners = new Set<(address: Address) => void>();

const publish = (next: Address) => {
  currentAddress = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener(next));
};

export const useAddressBook = () => {
  const [address, setAddress] = useState<Address>(currentAddress);

  useEffect(() => {
    const listener = (next: Address) => {
      setAddress(next);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const persist = useCallback((next: Address) => {
    publish(next);
  }, []);

  const updateAddress = useCallback(
    (updates: Partial<Address>) => {
      persist({
        ...address,
        ...updates
      });
    },
    [address, persist]
  );

  return {
    address,
    updateAddress
  };
};
