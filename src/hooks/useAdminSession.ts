import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bakersfield.adminToken";

const readToken = () => localStorage.getItem(STORAGE_KEY) ?? "";

let currentToken = readToken();
const listeners = new Set<(token: string) => void>();

const publish = (next: string) => {
  currentToken = next;
  if (next) {
    localStorage.setItem(STORAGE_KEY, next);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener(next));
};

export const useAdminSession = () => {
  const [token, setTokenState] = useState(currentToken);

  useEffect(() => {
    const listener = (next: string) => {
      setTokenState(next);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setToken = useCallback((next: string) => {
    publish(next);
  }, []);

  const clearToken = useCallback(() => {
    publish("");
  }, []);

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  return {
    token,
    isAuthenticated,
    setToken,
    clearToken
  };
};
