import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api, jsonBody } from "../services/api";
import {
  loadRazorpay,
  rememberPayment,
  verifyPayment,
} from "../services/payment";
import OrderSummary from "../components/OrderSummary";
import { Loading, ErrorBox, Empty } from "../components/Feedback";
const fields = [
  ["fullName", "Full name", "name"],
  ["phone", "Phone number", "tel"],
  ["addressLine1", "Street address", "street-address"],
  ["city", "City", "address-level2"],
  ["state", "State", "address-level1"],
  ["pincode", "Pincode", "postal-code"],
];
export default function Checkout() {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: user.fullName,
    phone: user.phone,
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (Object.values(form).some((value) => !value.trim()))
      return setError("Please fill every shipping field.");
    if (!/^\+?[0-9]{10,15}$/.test(form.phone.trim()))
      return setError("Phone must contain 10–15 digits.");
    if (!/^[0-9]{6}$/.test(form.pincode.trim()))
      return setError("Pincode must contain 6 digits.");
    setBusy(true);
    try {
      await loadRazorpay();
      const data = await api("/orders/create-payment-order", {
        method: "POST",
        body: jsonBody({ shippingAddress: form }),
      });
      setPendingId(data.shopKartOrderId);
      let verifying = false;
      const payment = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart Test Mode order",
        order_id: data.razorpayOrderId,
        prefill: {
          name: form.fullName,
          contact: form.phone,
          email: user.email,
        },
        theme: { color: "#183f35" },
        handler: async (response) => {
          verifying = true;
          const proof = { shopKartOrderId: data.shopKartOrderId, ...response };
          rememberPayment(proof);
          try {
            const result = await verifyPayment(proof);
            cart.clear();
            navigate(`/orders/${result.order._id}`, {
              state: { confirmed: true },
            });
          } catch (err) {
            setError(
              `${err.message} Open this pending order to retry verification. Your cart is preserved.`,
            );
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            if (!verifying) {
              setBusy(false);
              setError("Checkout closed. Your cart is unchanged.");
            }
          },
        },
      });
      payment.on("payment.failed", () => {
        setBusy(false);
        setError(
          "Payment failed. Your cart has not been cleared. Please try again.",
        );
      });
      payment.open();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  if (cart.loading) return <Loading text="Preparing checkout…" />;
  if (!cart.cartItems.length)
    return (
      <Empty title="Your cart is empty">
        Add something before checking out.
      </Empty>
    );
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">THE FINAL DETAILS</span>
        <h1>Make it yours.</h1>
        <p>Review your order and tell us where it should go.</p>
      </div>
      <div className="checkout-layout">
        <section className="panel">
          <span className="eyebrow">01 / DELIVERY</span>
          <h2>Shipping details</h2>
          <form onSubmit={submit}>
            <div className="form-grid">
              {fields.map(([key, label, autocomplete]) => (
                <label
                  key={key}
                  className={key === "addressLine1" ? "wide" : ""}
                >
                  {label}
                  <input
                    required
                    autoComplete={autocomplete}
                    type={key === "phone" ? "tel" : "text"}
                    inputMode={
                      ["phone", "pincode"].includes(key) ? "numeric" : "text"
                    }
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <ErrorBox message={error || cart.error} />
            {pendingId && (
              <p>
                <Link to={`/orders/${pendingId}`}>
                  View pending order / retry verification →
                </Link>
              </p>
            )}
            {cart.unavailable && (
              <p className="error">
                Some items are unavailable.{" "}
                <Link to="/cart">Update your cart.</Link>
              </p>
            )}
            <button
              className="button full"
              disabled={busy || cart.unavailable || !!cart.error}
            >
              {busy ? "Processing payment…" : "Place order · Pay with Razorpay"}{" "}
              <span>→</span>
            </button>
            <p className="small-note">
              Test Mode only. Complete payment in Razorpay’s secure checkout. No
              real purchase is made.
            </p>
          </form>
        </section>
        <OrderSummary />
      </div>
    </>
  );
}
