import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { useResource } from "../hooks/useResource";
import ProductCard from "../components/ProductCard";
import { Loading, ErrorBox, Empty } from "../components/Feedback";
export default function Products() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [saved, setSaved] = useState([]);
  const [wishlistError, setWishlistError] = useState("");
  const { data, loading, error, reload } = useResource(`/products?${params}`);
  useEffect(() => {
    let active = true;
    api("/wishlist")
      .then((data) => {
        if (active) setSaved(data.wishlist.map((p) => p._id));
      })
      .catch((err) => {
        if (active) setWishlistError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setParams(
          (previous) => {
            const next = new URLSearchParams(previous);
            search.trim()
              ? next.set("search", search.trim())
              : next.delete("search");
            return next;
          },
          { replace: true },
        ),
      300,
    );
    return () => clearTimeout(timer);
  }, [search, setParams]);
  function filter(key, value) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  }
  return (
    <>
      <section className="collection-hero">
        <div>
          <span className="eyebrow">THE EVERYDAY COLLECTION</span>
          <h1>
            Small upgrades.
            <br />
            <em>Better days.</em>
          </h1>
          <p>
            Useful, thoughtful, and a little bit delightful.
            <br />
            Discover essentials worth making room for.
          </p>
          <a href="#collection" className="hero-link">
            Find your next favourite <span>↓</span>
          </a>
        </div>
        <div className="hero-art">
          <img
            src="/images/headphones.svg"
            alt="Headphones from the everyday collection"
          />
          <span className="art-caption">Made for your everyday.</span>
        </div>
      </section>
      <section id="collection">
        <div className="section-title">
          <div>
            <span className="eyebrow">CURATED FOR YOU</span>
            <h2>Explore the collection</h2>
          </div>
          <span className="muted">
            {data ? `${data.count} products` : "Discover something good"}
          </span>
        </div>
        <div className="filters">
          <label className="search-label">
            Search
            <input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Category
            <select
              value={params.get("category") || ""}
              onChange={(e) => filter("category", e.target.value)}
            >
              <option value="">All categories</option>
              {["Electronics", "Fashion", "Books", "Home"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Sort by
            <select
              value={params.get("sort") || ""}
              onChange={(e) => filter("sort", e.target.value)}
            >
              <option value="">Newest arrivals</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>
        </div>
        <ErrorBox
          message={
            wishlistError && `Saved items could not be loaded: ${wishlistError}`
          }
        />
        {loading ? (
          <Loading text="Loading products…" />
        ) : error ? (
          <ErrorBox message={error} retry={reload} />
        ) : !data.products.length ? (
          <Empty title="No products found">
            Try a different search or category.
          </Empty>
        ) : (
          <div className="product-grid">
            {data.products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                saved={saved.includes(product._id)}
                onSaved={(id) =>
                  setSaved((current) => [...new Set([...current, id])])
                }
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
