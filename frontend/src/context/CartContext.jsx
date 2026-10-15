import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api, jsonBody } from "../services/api";
import { cartTotals } from "../services/cartMath";
import { useAuth } from "./AuthContext";
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const lock = useRef(false);
  const refresh = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setCartItems((await api("/cart")).cart);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  async function mutate(id, method, quantity) {
    if (lock.current) return;
    lock.current = true;
    setBusy(id);
    setError("");
    try {
      const data = await api(`/cart/${id}`, {
        method,
        ...(quantity !== undefined ? { body: jsonBody({ quantity }) } : {}),
      });
      setCartItems(data.cart);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      lock.current = false;
      setBusy("");
    }
  }
  const value = {
    cartItems,
    loading,
    error,
    busy,
    refresh,
    clear: () => setCartItems([]),
    ...cartTotals(cartItems),
    add: (id) => mutate(id, "POST"),
    remove: (id) => mutate(id, "DELETE"),
    update: (id, quantity) => mutate(id, "PATCH", quantity),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
