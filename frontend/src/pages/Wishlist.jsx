import { useResource } from "../hooks/useResource";
import ProductCard from "../components/ProductCard";
import { Loading, ErrorBox, Empty } from "../components/Feedback";
export default function Wishlist() {
  const { data, loading, error, reload } = useResource("/wishlist");
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">KEEP THE GOOD FINDS CLOSE</span>
        <h1>Your wishlist.</h1>
        <p>
          {data
            ? `${data.count} products saved for another day.`
            : "A place for everything you love."}
        </p>
      </div>
      {loading ? (
        <Loading text="Loading your wishlist…" />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : !data.wishlist.length ? (
        <Empty title="Your wishlist is empty">
          Save products you love and find them here later.
        </Empty>
      ) : (
        <div className="product-grid">
          {data.wishlist.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              saved
              removable
              onRemoved={reload}
            />
          ))}
        </div>
      )}
    </>
  );
}
