import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useResource } from "../hooks/useResource";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { money } from "../services/cartMath";
import { ProductImage } from "../components/ProductCard";
import { Loading, ErrorBox } from "../components/Feedback";
export default function ProductDetails() {
  const { id } = useParams();
  const { data, loading, error, reload } = useResource(`/products/${id}`);
  const cart = useCart();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    let active = true;
    setSaved(false);
    setMessage("");
    api("/wishlist")
      .then((data) => {
        if (active) setSaved(data.wishlist.some((p) => p._id === id));
      })
      .catch((err) => {
        if (active) setActionError(err.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function add() {
    setActionError("");
    try {
      await cart.add(id);
      setMessage("Added to your cart.");
    } catch (err) {
      setActionError(err.message);
    }
  }
  async function save() {
    setSaving(true);
    setActionError("");
    try {
      await api(`/wishlist/${id}`, { method: "POST" });
      setSaved(true);
    } catch (err) {
      if (err.status === 409) setSaved(true);
      else setActionError(err.message);
    } finally {
      setSaving(false);
    }
  }
  if (loading) return <Loading text="Loading product…" />;
  if (error) return <ErrorBox message={error} retry={reload} />;
  const { product } = data;
  return (
    <>
      <Link className="back-link" to="/products">
        ← Back to collection
      </Link>
      <section className="product-detail">
        <div className="detail-image">
          <ProductImage product={product} />
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="detail-price">{money(product.price)}</div>
          <p>{product.description}</p>
          <p className="stock">
            {product.stock
              ? `● In stock · ${product.stock} available`
              : "Out of stock"}
          </p>
          <button
            className="button full"
            onClick={add}
            disabled={!product.stock || !!cart.busy}
          >
            {cart.busy === id ? "Adding…" : "Add to cart"} <span>+</span>
          </button>
          <button
            className="button outline full"
            onClick={save}
            disabled={saving || saved}
          >
            {saving
              ? "Saving…"
              : saved
                ? "♥ Added to wishlist"
                : "♡ Add to wishlist"}
          </button>
          <ErrorBox message={actionError} />
          {message && (
            <p role="status" className="success">
              {message} <Link to="/cart">View cart →</Link>
            </p>
          )}
          <div className="detail-notes">
            <span>Complimentary delivery</span>
            <span>Secure Test Mode checkout</span>
          </div>
        </div>
      </section>
    </>
  );
}
