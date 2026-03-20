import { useCallback, useEffect, useRef, useState } from "react";

export type AlertToastState = {
  type: "success" | "error" | "favorite";
  message: string;
};

export const useAlertToast = () => {
  const [toast, setToast] = useState<AlertToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearToast = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (next: AlertToastState, duration = 3200) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      setToast(next);
      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, duration);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    toast,
    showToast,
    clearToast
  };
};
