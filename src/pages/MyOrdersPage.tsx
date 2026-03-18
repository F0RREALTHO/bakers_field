import { useEffect, useState } from "react";
import { api, type Order } from "../api";
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
        const results = await Promise.all(
          guest.placedOrderIds.map((id) => api.getOrder(id))
        );
        setOrders(results);
      } catch {
        onToast({ type: "error", message: "Unable to load orders." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [guest.placedOrderIds, onToast, liveDataUpdate]);

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
      {orders.length === 0 ? (
        <p className="muted">No orders placed yet.</p>
      ) : (
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
      )}
    </section>
  );
};
