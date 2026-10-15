import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ErrorBox } from "./Feedback";
export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function leave() {
    setBusy(true);
    setError("");
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="announcement">
        Thoughtful finds. Everyday essentials.{" "}
        <span>ShopKart collection / 2026</span>
      </div>
      <header>
        <Link className="brand" to={user ? "/products" : "/login"}>
          <span className="brand-mark">s</span>shopkart
          <span className="brand-dot">.</span>
        </Link>
        <nav aria-label="Main navigation">
          {user ? (
            <>
              <NavLink to="/home">Home</NavLink>
              <NavLink to="/products">Products</NavLink>
              <NavLink to="/wishlist">Wishlist</NavLink>
              <NavLink to="/orders">Orders</NavLink>
              <NavLink className="cart-link" to="/cart">
                Cart <span>{count}</span>
              </NavLink>
              <button className="text-button" disabled={busy} onClick={leave}>
                {busy ? "Leaving…" : "Logout"}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register">Create account ↗</NavLink>
            </>
          )}
        </nav>
      </header>
      {error && <ErrorBox message={error} />}
    </>
  );
}
