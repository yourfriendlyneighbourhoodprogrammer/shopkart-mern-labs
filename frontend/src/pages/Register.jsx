import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, jsonBody } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ErrorBox } from "../components/Feedback";
export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/home" replace />;
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.fullName.trim()) return setError("Please enter your full name.");
    setBusy(true);
    try {
      await api("/customers/register", {
        method: "POST",
        body: jsonBody(form),
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-layout">
      <div className="auth-story">
        <span className="eyebrow">MAKE YOURSELF AT HOME</span>
        <h1>
          Good finds.
          <br />
          <em>All yours.</em>
        </h1>
        <p>
          Save your favourites, build your cart,
          <br />
          and keep track of every order.
        </p>
        <div className="auth-art">
          <img src="/images/bag.svg" alt="Illustration of an everyday bag" />
        </div>
      </div>
      <div className="auth-form">
        <span className="eyebrow">JOIN SHOPKART</span>
        <h2>A fresh start.</h2>
        <p>Create your account in a few moments.</p>
        <form onSubmit={submit}>
          {[
            ["fullName", "Full name", "text", "name"],
            ["email", "Email address", "email", "email"],
            ["phone", "Phone number", "tel", "tel"],
            ["password", "Password", "password", "new-password"],
          ].map(([key, label, type, auto]) => (
            <label key={key}>
              {label}
              <input
                type={type}
                autoComplete={auto}
                required
                minLength={key === "password" ? 6 : undefined}
                pattern={key === "phone" ? "\+?[0-9]{10,15}" : undefined}
                title={
                  key === "phone"
                    ? "10–15 digits, optionally starting with +"
                    : undefined
                }
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          <p className="small-note">
            Use a password with at least 6 characters.
          </p>
          <ErrorBox message={error} />
          <button className="button full" disabled={busy}>
            {busy ? "Creating account…" : "Create account"} <span>→</span>
          </button>
        </form>
        <p className="auth-switch">
          Already a member? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}
