import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, jsonBody } from "../services/api";
import { ErrorBox } from "../components/Feedback";
export default function Home() {
  const { user } = useAuth();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function change(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await api("/customers/change-password", {
        method: "PATCH",
        body: jsonBody(form),
      });
      setMessage(data.message);
      setForm({ oldPassword: "", newPassword: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">YOUR SPACE</span>
        <h1>Welcome, {user.fullName.split(" ")[0]}.</h1>
        <p>Make room for your next favourite thing.</p>
      </div>
      <div className="home-grid">
        <section className="panel">
          <span className="eyebrow">PROFILE</span>
          <h2>{user.fullName}</h2>
          <dl>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Phone</dt>
            <dd>{user.phone}</dd>
          </dl>
          <Link className="button" to="/products">
            Explore the collection ↗
          </Link>
        </section>
        <section className="panel">
          <span className="eyebrow">ACCOUNT SECURITY</span>
          <h2>Change password</h2>
          <form onSubmit={change}>
            <label>
              Current password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.oldPassword}
                onChange={(e) =>
                  setForm({ ...form, oldPassword: e.target.value })
                }
              />
            </label>
            <label>
              New password
              <input
                type="password"
                minLength="6"
                required
                autoComplete="new-password"
                value={form.newPassword}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
              />
            </label>
            <ErrorBox message={error} />
            {message && (
              <p className="success" role="status">
                {message}
              </p>
            )}
            <button className="button outline" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
