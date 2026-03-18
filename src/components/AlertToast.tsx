import type { AlertToastState } from "../hooks/useAlertToast";

type AlertToastProps = {
  toast: AlertToastState | null;
  onClose: () => void;
};

export const AlertToast = ({ toast, onClose }: AlertToastProps) => {
  if (!toast) {
    return null;
  }

  return (
    <div className={`alert-toast alert-toast--${toast.type}`} role="status">
      <div className="alert-toast__content">
        <span>{toast.message}</span>
      </div>
      <button className="alert-toast__close" onClick={onClose} type="button">
        Close
      </button>
    </div>
  );
};
