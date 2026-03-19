import { useEffect, useState } from "react";
import { api, type Order } from "../api";
import { openWhatsAppChat } from "../lib/contact";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useGuestSession } from "../hooks/useGuestSession";
import { useLiveData } from "../hooks/useLiveData";

type MyOrdersPageProps = {
  onToast: (toast: AlertToastState) => void;
};

export const MyOrdersPage = ({ onToast }: MyOrdersPageProps) => {
  const { guest } = useGuestSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const liveDataUpdate = useLiveData(["orders"]);

  useEffect(() => {
    const load = async () => {
      if (guest.placedOrderIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }
      try {
        const results = await Promise.allSettled(
          guest.placedOrderIds.map((id) => api.getOrder(id))
        );
        const successfulOrders = results
          .filter((result): result is PromiseFulfilledResult<Order> => result.status === "fulfilled")
          .map((result) => result.value);
        setOrders(successfulOrders);
        if (successfulOrders.length === 0 && guest.placedOrderIds.length > 0) {
          onToast({ type: "error", message: "Unable to load some order history." });
        }
      } catch {
        setOrders([]);
        onToast({ type: "error", message: "Unable to load orders." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [guest.placedOrderIds, onToast, liveDataUpdate]);

  const openCustomContact = (
    requestId: number,
    occasion: string,
    description: string,
    budgetInr?: number
  ) => {
    const message = [
      "Hi BakersField, I need help with my custom cake request.",
      `Request ID: #${requestId}`,
      `Name: ${guest.name || "Guest"}`,
      `Phone: ${guest.phone || "Not provided"}`,
      budgetInr && budgetInr > 0 ? `Budget: ₹${budgetInr}` : null,
      `Occasion: ${occasion}`,
      description ? `Details: ${description}` : null
    ]
      .filter(Boolean)
      .join("\n");

    openWhatsAppChat(message);
  };

  if (loading) {
    return (
      <section className="page">
        <p className="muted">Loading your orders...</p>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>My Orders</h2>
      {orders.length === 0 && guest.customRequests.length === 0 ? (
        <p className="muted">No orders placed yet.</p>
      ) : null}

      {guest.customRequests.length > 0 ? (
        <div className="orders-list">
          {guest.customRequests.map((request) => (
            <div key={`custom-${request.id}`} className="order-card order-card--custom-request">
              <div>
                <h4>Custom Request #{request.id}</h4>
                <p className="muted">Occasion: {request.occasion}</p>
              </div>
              <div>
                <span className="status">PENDING_CONFIRMATION</span>
                <button
                  className="ghost order-card__contact"
                  type="button"
                  onClick={() =>
                    openCustomContact(
                      request.id,
                      request.occasion,
                      request.description,
                      request.budgetInr
                    )
                  }
                >
                  Contact Us
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div>
                <h4>Order #{order.id}</h4>
                <p className="muted">Placed on {order.placedAt}</p>
              </div>
              <div>
                <span className="status">{order.status}</span>
                <strong>₹{order.totalAmountInr}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};
