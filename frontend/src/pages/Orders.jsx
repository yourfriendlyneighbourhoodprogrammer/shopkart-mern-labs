import { Link } from "react-router-dom";
import { useResource } from "../hooks/useResource";
import { money } from "../services/cartMath";
import { Loading, ErrorBox, Empty } from "../components/Feedback";
export default function Orders() {
  const { data, loading, error, reload } = useResource("/orders");
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">YOUR SHOPKART STORY</span>
        <h1>My orders.</h1>
        <p>Every good find, all in one place.</p>
      </div>
      {loading ? (
        <Loading text="Loading orders…" />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : !data.orders.length ? (
        <Empty title="No orders just yet">
          Your next favourite thing is waiting.
        </Empty>
      ) : (
        <div className="orders-list">
          {data.orders.map((order) => (
            <article className="order-card" key={order._id}>
              <div className="order-header">
                <div>
                  <span className="eyebrow">
                    ORDER #{order._id.slice(-8).toUpperCase()}
                  </span>
                  <p>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`badge ${order.paymentStatus === "PAID" ? "paid" : ""}`}
                >
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>
              {order.items.map((item) => (
                <p key={item.product}>
                  {item.name} <span className="muted">× {item.quantity}</span>
                </p>
              ))}
              <div className="order-footer">
                <strong>{money(order.totalAmount)}</strong>
                <Link to={`/orders/${order._id}`}>View details ↗</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
