import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { money } from "../services/cartMath";
import { ProductImage } from "../components/ProductCard";
import OrderSummary from "../components/OrderSummary";
import { Loading, ErrorBox, Empty } from "../components/Feedback";
export default function Cart() {
  const cart = useCart();
  const act = (promise) => promise.catch(() => {});
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">A FEW GOOD CHOICES</span>
        <h1>Your shopping cart.</h1>
        <p>{cart.count} items, ready when you are.</p>
      </div>
      <ErrorBox message={cart.error} retry={cart.refresh} />
      {cart.loading ? (
        <Loading text="Loading your cart…" />
      ) : !cart.cartItems.length ? (
        <Empty title="Your cart is empty">
          Make room for your next favourite find.
        </Empty>
      ) : (
        <div className="checkout-layout">
          <div className="cart-list">
            {cart.cartItems.map(({ product, productId, quantity }) => (
              <article className="cart-item" key={productId}>
                <div className="cart-image">
                  {product && <ProductImage product={product} />}
                </div>
                <div className="cart-copy">
                  <span className="eyebrow">
                    {product?.category || "UNAVAILABLE"}
                  </span>
                  <h3>
                    {product ? (
                      <Link to={`/products/${productId}`}>{product.name}</Link>
                    ) : (
                      "This product is no longer available"
                    )}
                  </h3>
                  <span>{money(product?.price || 0)} each</span>
                  <div className="quantity">
                    <button
                      aria-label={`Decrease ${product?.name || "item"} quantity`}
                      disabled={quantity <= 1 || !!cart.busy || !product}
                      onClick={() => act(cart.update(productId, quantity - 1))}
                    >
                      −
                    </button>
                    <span aria-live="polite">{quantity}</span>
                    <button
                      aria-label={`Increase ${product?.name || "item"} quantity`}
                      disabled={
                        !product || quantity >= product.stock || !!cart.busy
                      }
                      onClick={() => act(cart.update(productId, quantity + 1))}
                    >
                      +
                    </button>
                  </div>
                  {product && quantity > product.stock && (
                    <p className="error">
                      Only {product.stock} available. Reduce quantity or remove
                      this item.
                    </p>
                  )}
                </div>
                <div className="cart-item-end">
                  <strong>{money((product?.price || 0) * quantity)}</strong>
                  <button
                    className="text-button"
                    disabled={!!cart.busy}
                    onClick={() => act(cart.remove(productId))}
                  >
                    {cart.busy === productId ? "Updating…" : "Remove"}
                  </button>
                </div>
              </article>
            ))}
            <Link to="/products" className="back-link">
              ← Continue shopping
            </Link>
          </div>
          <OrderSummary>
            {cart.unavailable || cart.error ? (
              <p className="error">Resolve the cart issue before checkout.</p>
            ) : (
              <Link className="button full" to="/checkout">
                Proceed to checkout <span>→</span>
              </Link>
            )}
          </OrderSummary>
        </div>
      )}
    </>
  );
}
