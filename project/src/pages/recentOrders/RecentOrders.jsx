import React, { useEffect, useState } from "react";
import "./RecentOrders.css";
import { secureFetch } from "../../utils/secureFetch";

export default function RecentOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const response = await secureFetch("/api/purchases/recent?limit=5");
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ Failed to fetch recent orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="recent-orders-loading">Loading recent orders...</div>;
  }

  if (error) {
    return <div className="recent-orders-error">Error: {error}</div>;
  }

  return (
    <div className="recent-orders-container">
      <h2>Your 5 Most Recent Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table className="recent-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Total</th>
              <th>Purchased At</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>{(order.total_price / 100).toFixed(2)} {order.currency.toUpperCase()}</td>
                <td>{order.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
