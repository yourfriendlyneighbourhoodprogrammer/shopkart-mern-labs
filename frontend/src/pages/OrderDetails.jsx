import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useResource } from "../hooks/useResource";
import { useCart } from "../context/CartContext";
import { pendingPayment, verifyPayment } from "../services/payment";
import { money } from "../services/cartMath";
import { Loading, ErrorBox } from "../components/Feedback";
export default function OrderDetails() {
  const { id } = useParams();
  const { data, loading, error, reload } = useResource(`/orders/${id}`);
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  async function retry() {
    setBusy(true);
    setFailure("");
    try {
      await verifyPayment(pendingPayment(id));
      await cart.refresh();
      reload();
    } catch (err) {
      setFailure(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading text="Loading order…" />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  const { order } = data;
  const address = order.shippingAddress;
  return (
    <>
      <Link className="back-link" to="/orders">
        ← My orders
      </Link>
      <div className="page-heading">
        <span className="eyebrow">
          {order.paymentStatus === "PAID"
            ? "THANK YOU FOR SHOPPING WITH US"
            : "YOUR ORDER DETAILS"}
        </span>
        <h1>
          {order.paymentStatus === "PAID"
            ? "Order placed successfully."
            : "Payment pending."}
        </h1>
        <p>Order #{order._id}</p>
        <span
          className={`badge ${order.paymentStatus === "PAID" ? "paid" : ""}`}
        >
          {order.status.replaceAll("_", " ")} · {order.paymentStatus}
        </span>
      </div>
      <ErrorBox message={failure} />
      {order.paymentStatus !== "PAID" && pendingPayment(id) && (
        <button className="button" disabled={busy} onClick={retry}>
          {busy ? "Verifying…" : "Retry payment verification"}
        </button>
      )}
      <div className="checkout-layout">
        <section className="panel">
          <h2>Order items</h2>
          {order.items.map((item) => (
            <div className="summary-line" key={item.product}>
              <span>
                {item.name} × {item.quantity}
                <small>{money(item.price)} each</small>
              </span>
              <strong>{money(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(order.totalAmount)}</strong>
          </div>
          {order.razorpayPaymentId && (
            <p className="small-note">
              Payment reference: {order.razorpayPaymentId}
            </p>
          )}
        </section>
        <section className="panel">
          <span className="eyebrow">DELIVERY TO</span>
          <h2>{address.fullName}</h2>
          <p>
            {address.addressLine1}
            <br />
            {address.city}, {address.state} — {address.pincode}
            <br />
            {address.phone}
          </p>
          <Link className="button outline" to="/products">
            Continue shopping ↗
          </Link>
        </section>
      </div>
    </>
  );
}
