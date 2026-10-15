import { Link } from "react-router-dom";
export function Loading({ text = "Loading…" }) {
  return (
    <div className="state" role="status">
      <span className="spinner" />
      {text}
    </div>
  );
}
export function ErrorBox({ message, retry }) {
  return message ? (
    <div className="error" role="alert">
      {message}
      {retry && (
        <button className="text-button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  ) : null;
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">◇</span>
      <h2>{title}</h2>
      <p>{children}</p>
      <Link className="button" to="/products">
        Browse products <span>↗</span>
      </Link>
    </div>
  );
}
