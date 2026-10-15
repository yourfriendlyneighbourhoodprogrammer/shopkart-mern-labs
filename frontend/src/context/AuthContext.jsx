import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setUser(await api("/customers/me"));
    } catch (err) {
      setUser(null);
      if (err.status !== 401) setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  async function logout() {
    try {
      await api("/customers/logout", { method: "POST" });
    } catch (err) {
      if (err.status !== 401) throw err;
    }
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, error, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
