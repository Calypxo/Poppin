import { useCallback, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import api from "../api/client";
import { session } from "./session";
import { AuthContext, type SessionResponse } from "./context";
import type { User } from "../types/account";
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const logout = useCallback(() => {
    session.clear();
    setUser(null);
    setError("");
  }, []);
  const refresh = useCallback(
    async (restore = false) => {
      await Promise.resolve();
      setError("");
      if (restore) setLoading(true);
      try {
        if (session.get()) setUser((await api.get<User>("/auth/me")).data);
        else setUser(null);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) logout();
        else setError("Unable to restore your session. Please try again.");
      } finally {
        if (restore) setLoading(false);
      }
    },
    [logout],
  );
  useEffect(() => {
    const start = requestAnimationFrame(() => void refresh(true));
    window.addEventListener("poppin:session-expired", logout);
    const sync = () => void refresh(true);
    window.addEventListener("storage", sync);
    return () => {
      cancelAnimationFrame(start);
      window.removeEventListener("poppin:session-expired", logout);
      window.removeEventListener("storage", sync);
    };
  }, [refresh, logout]);
  function authenticate(response: SessionResponse) {
    session.set(response.token);
    setUser(response.user);
    setError("");
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, error, authenticate, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
