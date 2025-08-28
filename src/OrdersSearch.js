import React, { useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "./dashboard.css";

export default function OrdersSearch({ navigate }) {
  const [orderId, setOrderId] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState("");

  const searchOrder = async () => {
    if (!orderId.trim()) return;
    try {
      const docRef = doc(db, "orders", orderId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setOrderData(snap.data());
        setError("");
      } else {
        setOrderData(null);
        setError("❌ No order found with this ID.");
      }
    } catch (err) {
      console.error("Error searching order:", err);
    }
  };

  return (
    <div className="orders-search">
      <button onClick={() => navigate("dashboard")} className="back-btn">⬅ Back</button>
      <h1>🔍 Search Order</h1>
      <input
        type="text"
        placeholder="Enter Order ID"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
      />
      <button onClick={searchOrder}>Search</button>

      {error && <p className="error">{error}</p>}

      {orderData && (
        <div className="order-details">
          <h3>Order Details</h3>
          <pre>{JSON.stringify(orderData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
