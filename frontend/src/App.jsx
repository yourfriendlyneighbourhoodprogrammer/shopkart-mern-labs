import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import { Loading, ErrorBox, Empty } from "./components/Feedback";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
function Protected() {
  const { user, loading, error, refresh } = useAuth();
  if (loading) return <Loading text="Checking your session…" />;
  if (error) return <ErrorBox message={error} retry={refresh} />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Protected />}>
            <Route path="/home" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/order-success/:id" element={<OrderDetails />} />
          </Route>
          <Route
            path="*"
            element={
              <Empty title="This page wandered off">
                Let's get you back to the collection.
              </Empty>
            }
          />
        </Routes>
      </main>
      <footer>
        <span className="brand">shopkart.</span>
        <span>Everyday, considered.</span>
        <span>Built for the MERN Engineering Labs · 2026</span>
      </footer>
    </>
  );
}
