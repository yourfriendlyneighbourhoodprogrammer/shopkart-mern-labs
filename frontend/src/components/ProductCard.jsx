import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { money } from "../services/cartMath";
import { ErrorBox } from "./Feedback";
export function ProductImage({ product }) {
  return (
    <img
      src={product.image}
      alt={product.name}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = "/images/fallback.svg";
      }}
    />
  );
}
export default function ProductCard({
  product,
  saved = false,
  onSaved,
  onRemoved,
  removable = false,
}) {
  const cart = useCart();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  async function wishlist() {
    setSaving(true);
    setError("");
    try {
      await api(`/wishlist/${product._id}`, {
        method: removable ? "DELETE" : "POST",
      });
      removable ? onRemoved?.(product._id) : onSaved?.(product._id);
    } catch (err) {
      if (err.status === 409 && !removable) onSaved?.(product._id);
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  async function add() {
    setError("");
    try {
      await cart.add(product._id);
      setAdded(true);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <article className="product-card">
      <Link className="product-image" to={`/products/${product._id}`}>
        <ProductImage product={product} />
        <span className="image-arrow">↗</span>
      </Link>
      <div className="product-meta">
        <span>{product.category}</span>
        <span className={product.stock ? "" : "sold-out"}>
          {product.stock ? `${product.stock} in stock` : "Out of stock"}
        </span>
      </div>
      <Link className="product-title" to={`/products/${product._id}`}>
        {product.name}
      </Link>
      <div className="product-price">{money(product.price)}</div>
      <div className="card-actions">
        <button
          className="button small"
          onClick={add}
          disabled={!product.stock || !!cart.busy}
        >
          {cart.busy === product._id
            ? "Adding…"
            : added
              ? "Add another"
              : "Add to cart"}{" "}
          <span>+</span>
        </button>
        <button
          className={`wish-button ${saved ? "saved" : ""}`}
          disabled={saving || (saved && !removable)}
          onClick={wishlist}
          aria-label={
            removable
              ? `Remove ${product.name} from wishlist`
              : saved
                ? `${product.name} added to wishlist`
                : `Add ${product.name} to wishlist`
          }
        >
          {saving ? "…" : removable ? "Remove ♥" : saved ? "♥" : "♡"}
        </button>
      </div>
      {added && (
        <span className="success small-note" role="status">
          Added to cart
        </span>
      )}
      <Link className="details-link" to={`/products/${product._id}`}>
        View details
      </Link>
      <ErrorBox message={error} />
    </article>
  );
}
