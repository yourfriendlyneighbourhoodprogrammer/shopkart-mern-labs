import { useCart } from "../context/CartContext";
import { money } from "../services/cartMath";
export default function OrderSummary({ children }) {
  const { cartItems, count, subtotal } = useCart();
  return (
    <aside className="summary">
      <span className="eyebrow">THE DETAILS</span>
      <h2>Order summary</h2>
      {cartItems.map((item) => (
        <div className="summary-line" key={item.productId}>
          <span>
            {item.product?.name || "Unavailable product"} × {item.quantity}
          </span>
          <strong>{money((item.product?.price || 0) * item.quantity)}</strong>
        </div>
      ))}
      <div className="summary-line">
        <span>Total items</span>
        <span>{count}</span>
      </div>
      <div className="summary-line">
        <span>Delivery</span>
        <span>Complimentary</span>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{money(subtotal)}</strong>
      </div>
      {children}
      <p className="small-note">
        Final prices and availability are checked at checkout.
      </p>
    </aside>
  );
}
