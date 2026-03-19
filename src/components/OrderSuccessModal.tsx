import React from "react";
import { Order } from "../api";
import { buildWhatsAppUrl } from "../lib/contact";

type OrderSuccessModalProps = {
  order: Order;
  onClose: () => void;
};

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, onClose }) => {
  const generateWhatsAppUrl = () => {
    const itemDetails = order.items?.map(item => `- ${item.itemName} x${item.quantity}`).join("\n") || "";
    const message = `Hi Bakersfield! My order #${order.id} for ₹${order.totalAmountInr} has been placed. Please confirm my order!\n\nDetails:\n${itemDetails}`;
    return buildWhatsAppUrl(message);
  };

  return (
    <div className="modal">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__content" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div>
            <p className="eyebrow">Success!</p>
            <h3>Order Placed Successfully</h3>
          </div>
          <button className="modal__close modal__close--pill" onClick={onClose} type="button" aria-label="Close order success dialog">
            Close
          </button>
        </div>
        
        <div className="order-success-body">
          <div className="success-icon">🍰</div>
          <p className="muted">Your order <strong>#{order.id}</strong> is being prepared.</p>
          
          <div className="whatsapp-box">
            <p className="whatsapp-box__title">Confirm on WhatsApp</p>
            <p className="muted small">Send your order details to us directly to get faster updates and chat with us for free!</p>
            <a 
              href={generateWhatsAppUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="whatsapp-button"
            >
              <span>Confirm on WhatsApp</span>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.819.992 3.863 1.515 5.945 1.515h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
          
          <button className="ghost order-success__dismiss" onClick={onClose} type="button">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
