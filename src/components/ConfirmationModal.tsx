import { motion, AnimatePresence } from "framer-motion";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  isDestructive?: boolean;
};

export const ConfirmationModal = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  isDestructive = false
}: ConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="modal">
          <motion.div
            className="modal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="modal__content modal__content--confirm"
            role="dialog"
            aria-modal="true"
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
          >
            <div className="modal-confirm-body">
              <div className={isDestructive ? "modal-confirm-icon is-destructive" : "modal-confirm-icon"}>
                {isDestructive ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <h3>{title}</h3>
              <p className="muted">{message}</p>
            </div>
            <div className="modal-confirm-actions">
              <button 
                className="ghost" 
                onClick={onClose} 
                type="button"
              >
                {cancelLabel}
              </button>
              <button
                className={isDestructive ? "primary primary--destructive" : "primary"}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                type="button"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
