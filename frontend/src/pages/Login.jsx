import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api, jsonBody } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ErrorBox } from "../components/Feedback";
export default function Login() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/home" replace />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/customers/login", {
        method: "POST",
        body: jsonBody(form),
      });
      setUser(data.customer);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-layout">
      <div className="auth-story">
        <span className="eyebrow">GOOD THINGS START HERE</span>
        <h1>
          Everyday,
          <br />
          <em>considered.</em>
        </h1>
        <p>
          A little less searching.
          <br />A little more finding what you love.
        </p>
        <div className="auth-art">
          <img src="/images/headphones.svg" alt="Illustration of headphones" />
        </div>
        <span className="small-note">A collection for the way you live.</span>
      </div>
      <div className="auth-form">
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Your next good find awaits.</h2>
        <p>Log in to your ShopKart account.</p>
        {location.state?.registered && (
          <p className="success" role="status">
            Account created. You can log in now.
          </p>
        )}
        <form onSubmit={submit}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <ErrorBox message={error} />
          <button className="button full" disabled={busy}>
            {busy ? "Logging in…" : "Log in"} <span>→</span>
          </button>
        </form>
        <p className="auth-switch">
          New around here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
